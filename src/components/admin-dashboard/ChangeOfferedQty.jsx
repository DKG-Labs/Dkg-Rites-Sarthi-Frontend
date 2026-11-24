import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select, Spin } from 'antd';
import {
  searchErcCalls, getCallOfferedQty, updateCallOfferedQty, getOfferedQtyHistory,
} from '../../services/superAdminOfferedQtyService';
import { getDetailedStatus } from '../../utils/statusMapper';
import './ChangeOfferedQty.css';

/*
 * Super Admin – Change Offered Qty (ERC)
 * 1. Pick call type (ER / EP / EF)  2. Search & pick a call  3. Edit offered qty per heat / lot  4. Review & submit.
 * Allowed only before inspection is complete. Every change is stored in the history.
 */

const TYPES = [
  { key: 'ER', label: 'Raw Material', code: 'ER' },
  { key: 'EP', label: 'Process', code: 'EP' },
  { key: 'EF', label: 'Final', code: 'EF' },
];

const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const poSr = (po, sr) => {
  if (sr && String(sr).includes('/')) return sr;          // already '<po>/<sr>'
  if (po && sr) return `${po}/${sr}`;
  return po || sr || '-';
};
const StatusView = ({ raw, editable, compact }) => {
  const { mainStatus, subStatus } = getDetailedStatus(raw);
  const showSub = subStatus && subStatus !== '-' && subStatus.toLowerCase() !== String(mainStatus).toLowerCase();
  return (
    <span className={`coq-status ${compact ? 'compact' : ''}`}>
      <span className={`coq-chip ${editable ? 'ok' : 'lock'}`}>{mainStatus}</span>
      {showSub && <span className="coq-sub">{subStatus}</span>}
    </span>
  );
};
const fmtQty = (v, unit) => (v === null || v === undefined ? '-' : unit === 'MT' ? Number(v).toFixed(3) : String(Math.round(Number(v))));

const ChangeOfferedQty = ({ onNotify }) => {
  const notify = (m, s) => onNotify && onNotify(m, s);
  const [tab, setTab] = useState('change');

  // ── call picker ──
  const [type, setType] = useState('ER');
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [optLoading, setOptLoading] = useState(false);
  const [callNo, setCallNo] = useState(undefined);
  const abortRef = useRef(null);

  const loadOptions = useCallback(async (q, pg, append) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setOptLoading(true);
    try {
      const res = await searchErcCalls({ type, q, page: pg, size: 20, signal: ctrl.signal });
      setOptions((prev) => (append ? [...prev, ...res.content] : res.content));
      setHasMore(res.hasMore);
      setPage(pg);
    } catch (e) {
      if (e.name !== 'AbortError') notify(e.message, 'error');
    } finally {
      if (abortRef.current === ctrl) setOptLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // reload list when type changes, debounce typing
  useEffect(() => {
    const t = setTimeout(() => loadOptions(search, 0, false), 300);
    return () => clearTimeout(t);
  }, [search, loadOptions]);

  const onPopupScroll = (e) => {
    const el = e.target;
    if (!optLoading && hasMore && el.scrollTop + el.offsetHeight >= el.scrollHeight - 40) loadOptions(search, page + 1, true);
  };

  // ── selected call ──
  const [call, setCall] = useState(null);
  const [callLoading, setCallLoading] = useState(false);
  const [edits, setEdits] = useState({});
  const [remarks, setRemarks] = useState('');
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCall = async (no) => {
    setCall(null); setEdits({}); setRemarks('');
    if (!no) return;
    setCallLoading(true);
    try { setCall(await getCallOfferedQty(no)); }
    catch (e) { notify(e.message, 'error'); }
    finally { setCallLoading(false); }
  };

  const changeType = (t) => { setType(t); setCallNo(undefined); setCall(null); setSearch(''); setOptions([]); };

  const rows = useMemo(() => call?.rows || [], [call]);
  const changed = useMemo(() => rows
    .map((r) => {
      const v = edits[r.rowId];
      if (v === undefined || v === '') return null;
      const nv = Number(v);
      if (Number.isNaN(nv) || nv === Number(r.offeredQty)) return null;
      return { ...r, newQty: nv };
    })
    .filter(Boolean), [rows, edits]);

  const rowError = (r) => {
    const v = edits[r.rowId];
    if (v === undefined || v === '') return null;
    const nv = Number(v);
    if (Number.isNaN(nv) || nv <= 0) return 'Must be more than 0';
    if (call?.unit !== 'MT' && !Number.isInteger(nv)) return 'Whole number only';
    if (num(r.minQty) !== null && call?.unit !== 'MT' && nv < num(r.minQty)) return `Min ${fmtQty(r.minQty, call.unit)}`;
    if (num(r.maxQty) !== null && nv > num(r.maxQty)) return `Max ${fmtQty(r.maxQty, call.unit)}`;
    return null;
  };
  const hasErrors = rows.some((r) => rowError(r));
  const canSubmit = call?.editable && changed.length > 0 && !hasErrors && remarks.trim().length >= 5;

  const submit = async () => {
    setSaving(true);
    try {
      const res = await updateCallOfferedQty(call.callNo, changed.map((c) => ({ rowId: c.rowId, newQty: c.newQty })), remarks);
      notify(`Offered quantity updated for ${res.callNo} (${res.changedRows} ${res.changedRows === 1 ? 'row' : 'rows'})`, 'success');
      setReview(false);
      // saved → clear the page for the next call (call type stays as it was)
      setCallNo(undefined);
      setCall(null);
      setEdits({});
      setRemarks('');
      setSearch('');
      loadOptions('', 0, false);   // refresh the dropdown list
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── history ──
  const [hInput, setHInput] = useState('');
  const [hQuery, setHQuery] = useState('');
  const [hPage, setHPage] = useState(0);
  const [hist, setHist] = useState(null);
  const [hLoading, setHLoading] = useState(false);
  const loadHistory = useCallback(async () => {
    setHLoading(true);
    try { setHist(await getOfferedQtyHistory({ callNo: hQuery, page: hPage, size: 20 })); }
    catch (e) { notify(e.message, 'error'); }
    finally { setHLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hQuery, hPage]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const unit = call?.unit;
  const totalOld = rows.reduce((s, r) => s + Number(r.offeredQty || 0), 0);
  const totalNew = rows.reduce((s, r) => {
    const v = edits[r.rowId];
    return s + (v === undefined || v === '' || Number.isNaN(Number(v)) ? Number(r.offeredQty || 0) : Number(v));
  }, 0);

  return (
    <div className="coq">
      <div className="coq-head">
        <div>
          <h2>Change Offered Qty</h2>
          <p>Correct the offered quantity of an ERC call before inspection is complete. Every table of the call is updated.</p>
        </div>
        <div className="coq-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'change'} className={tab === 'change' ? 'on' : ''} onClick={() => setTab('change')}>Change</button>
          <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>History</button>
        </div>
      </div>

      {tab === 'change' && (
        <>
          <div className="coq-card coq-picker">
            <div className="coq-field">
              <label>Call type</label>
              <div className="coq-seg" role="radiogroup" aria-label="Call type">
                {TYPES.map((t) => (
                  <button key={t.key} role="radio" aria-checked={type === t.key} className={type === t.key ? 'on' : ''} onClick={() => changeType(t.key)}>
                    {t.label} <span>{t.code}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="coq-field coq-grow">
              <label htmlFor="coq-call">Call</label>
              <Select
                id="coq-call"
                showSearch
                allowClear
                value={callNo}
                placeholder={`Search ${type} call no., PO no. or vendor`}
                filterOption={false}
                onSearch={setSearch}
                onChange={(v) => { setCallNo(v); loadCall(v); }}
                onClear={() => { setSearch(''); }}
                onPopupScroll={onPopupScroll}
                notFoundContent={optLoading ? <Spin size="small" /> : 'No calls found'}
                listHeight={320}
                optionLabelProp="label"
                popupClassName="coq-dropdown"
                style={{ width: '100%' }}
                size="large"
                options={options.map((o) => ({
                  value: o.callNo,
                  label: o.callNo,
                  disabled: false,
                  title: o.callNo,
                  render: o,
                }))}
                optionRender={(opt) => {
                  const o = opt.data.render;
                  return (
                    <div className={`coq-opt ${o.editable ? '' : 'locked'}`}>
                      <div className="coq-opt-top">
                        <strong>{o.callNo}</strong>
                        <StatusView raw={o.status} editable={o.editable} compact />
                      </div>
                      <div className="coq-opt-sub">PO/Sr {poSr(o.poNo, o.poSerialNo)} · {o.vendor || '-'} · {fmtDate(o.createdAt)}</div>
                    </div>
                  );
                }}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    {optLoading && options.length > 0 && <div className="coq-more"><Spin size="small" /> Loading more…</div>}
                  </>
                )}
              />
            </div>
          </div>

          {callLoading && <div className="coq-skel">{[0, 1, 2, 3].map((i) => <div key={i} />)}</div>}

          {!callLoading && !call && (
            <div className="coq-empty">
              <i className="fa-solid fa-scale-balanced" aria-hidden="true" />
              <strong>Pick a call to see its offered quantity</strong>
              <span>Raw Material is changed per heat (MT); Process and Final per lot (Nos). Locked calls have already finished inspection.</span>
            </div>
          )}

          {!callLoading && call && (
            <div className="coq-card">
              <div className="coq-summary">
                <div><span>Call</span><strong>{call.callNo}</strong></div>
                <div><span>Status</span><strong><StatusView raw={call.status} editable={call.editable} /></strong></div>
                <div><span>PO/Sr No.</span><strong>{poSr(call.poNo, call.poSerialNo)}</strong></div>
                <div><span>Vendor</span><strong>{call.vendor || '-'}</strong></div>
                <div><span>Total offered</span><strong>{fmtQty(totalOld, unit)} {unit}</strong></div>
              </div>

              {!call.editable && (
                <div className="coq-blocked" role="status">
                  <i className="fa-solid fa-lock" aria-hidden="true" /> {call.blockedReason}
                </div>
              )}

              <div className="coq-table-wrap">
                <table className="coq-table">
                  <thead>
                    <tr>
                      <th>{call.type === 'ER' ? 'Heat / TC' : 'Lot / Heat'}</th>
                      <th className="r">Current ({unit})</th>
                      <th className="r">New ({unit})</th>
                      <th className="r">Change</th>
                      <th>Limits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const v = edits[r.rowId];
                      const err = rowError(r);
                      const nv = v === undefined || v === '' ? null : Number(v);
                      const diff = nv === null || Number.isNaN(nv) ? 0 : nv - Number(r.offeredQty || 0);
                      return (
                        <tr key={r.rowId} className={diff !== 0 && !err ? 'chg' : ''}>
                          <td data-l={call.type === 'ER' ? 'Heat / TC' : 'Lot / Heat'}>{r.label}</td>
                          <td data-l="Current" className="r">{fmtQty(r.offeredQty, unit)}</td>
                          <td data-l="New" className="r">
                            <input
                              type="number"
                              inputMode="decimal"
                              step={unit === 'MT' ? '0.001' : '1'}
                              min="0"
                              disabled={!call.editable}
                              value={v ?? ''}
                              placeholder={fmtQty(r.offeredQty, unit)}
                              aria-invalid={!!err}
                              aria-label={`New offered qty for ${r.label}`}
                              onChange={(e) => setEdits((p) => ({ ...p, [r.rowId]: e.target.value }))}
                            />
                            {err && <div className="coq-err">{err}</div>}
                          </td>
                          <td data-l="Change" className="r">
                            {diff === 0 ? <span className="coq-muted">—</span>
                              : <span className={`coq-diff ${diff > 0 ? 'up' : 'down'}`}>{diff > 0 ? '+' : ''}{fmtQty(diff, unit)}</span>}
                          </td>
                          <td data-l="Limits" className="coq-hint">{r.hint}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {call.editable && (
                <div className="coq-foot">
                  <div className="coq-field coq-grow">
                    <label htmlFor="coq-remarks">Remarks <span className="coq-req">*</span></label>
                    <textarea id="coq-remarks" rows={2} maxLength={1000} value={remarks}
                              onChange={(e) => setRemarks(e.target.value)} placeholder="Why is the offered quantity being changed?" />
                  </div>
                  <div className="coq-actions">
                    <span className="coq-muted">
                      {changed.length ? `${changed.length} changed · total ${fmtQty(totalOld, unit)} → ${fmtQty(totalNew, unit)} ${unit}` : 'No changes yet'}
                    </span>
                    <button className="coq-ghost" disabled={!changed.length || saving} onClick={() => setEdits({})}>Reset</button>
                    <button className="coq-primary" disabled={!canSubmit || saving} onClick={() => setReview(true)}>Review &amp; submit</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="coq-card">
          <form className="coq-hsearch" onSubmit={(e) => { e.preventDefault(); setHPage(0); setHQuery(hInput); }}>
            <input value={hInput} onChange={(e) => setHInput(e.target.value)} placeholder="Filter by call no. (optional)" aria-label="Filter by call no." />
            <button type="submit" className="coq-primary" disabled={hLoading}>{hLoading ? 'Loading…' : 'Search'}</button>
          </form>
          {hLoading && <div className="coq-skel">{[0, 1, 2].map((i) => <div key={i} />)}</div>}
          {!hLoading && hist && (hist.content.length === 0 ? <div className="coq-empty"><strong>No changes yet</strong></div> : (
            <>
              <div className="coq-table-wrap">
                <table className="coq-table">
                  <thead>
                    <tr><th>When</th><th>Call</th><th>Heat / Lot</th><th className="r">Old → New</th><th>Status then</th><th>Changed by</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {hist.content.map((h) => (
                      <tr key={h.id}>
                        <td data-l="When">{fmtDate(h.changedAt)}</td>
                        <td data-l="Call">{h.callNo}</td>
                        <td data-l="Heat / Lot">{h.item}</td>
                        <td data-l="Old → New" className="r">{fmtQty(h.oldQty, h.unit)} → <strong>{fmtQty(h.newQty, h.unit)}</strong> {h.unit}</td>
                        <td data-l="Status then">{h.status ? getDetailedStatus(h.status).combinedText : '-'}</td>
                        <td data-l="Changed by">{h.changedBy}{h.empCode ? ` (${h.empCode})` : ''}</td>
                        <td data-l="Remarks" className="coq-remarks">{h.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="coq-pager">
                <button disabled={hPage === 0} onClick={() => setHPage((p) => p - 1)}>Previous</button>
                <span>Page {hist.page + 1} of {Math.max(hist.totalPages, 1)} · {hist.totalElements} changes</span>
                <button disabled={hPage + 1 >= hist.totalPages} onClick={() => setHPage((p) => p + 1)}>Next</button>
              </div>
            </>
          ))}
        </div>
      )}

      {review && call && (
        <div className="coq-overlay" role="dialog" aria-modal="true" aria-labelledby="coq-dlg-title">
          <div className="coq-dialog">
            <h3 id="coq-dlg-title">Update offered qty of {call.callNo}?</h3>
            <ul className="coq-review">
              {changed.map((c) => (
                <li key={c.rowId}>
                  <span>{c.label}</span>
                  <span>{fmtQty(c.offeredQty, unit)} → <strong>{fmtQty(c.newQty, unit)}</strong> {unit}</span>
                </li>
              ))}
            </ul>
            <div className="coq-note">
              {call.type === 'ER' && 'Heat quantities, call totals, inventory (by the difference) and any IE summary / heat results will be updated.'}
              {call.type === 'EP' && 'Lot quantities, IE line results and shift quantities will be updated. The RM heat balance changes automatically.'}
              {call.type === 'EF' && 'Lot quantities, call total, Process IC draw-down, cumulative results (including later calls of this PO) and the final test tables will be updated.'}
            </div>
            <p className="coq-muted">Remarks: {remarks}</p>
            <div className="coq-dialog-actions">
              <button className="coq-ghost" onClick={() => setReview(false)} disabled={saving}>Back</button>
              <button className="coq-primary" onClick={submit} disabled={saving}>{saving ? 'Updating…' : 'Confirm update'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeOfferedQty;
