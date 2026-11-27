import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Select, Spin } from 'antd';
import {
  searchPos, getPoDp, applyDpChange, revertDpChange, getActiveDpChanges, getDpChangeHistory,
} from '../../services/superAdminDpChangeService';
import './ChangeOfferedQty.css';
import './TemporaryDpChange.css';
import ConfirmDialog from '../common/ConfirmDialog';

/*
 * Super Admin – Temporary DP Change
 * 1. Search & pick a PO  2. See PO details and each Sr No.'s DP  3. Set a new DP for a Sr No. (with remark)
 * The new DP is restored to the previous date automatically after 2 hours (or earlier with "Revert now").
 */

const REVERT_HOURS = 2;
const PAGE = 50;

const fmtDay = (d) => {
  if (!d) return '-';
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return y && m && day ? `${day}-${m}-${y}` : String(d);
};
const fmtTs = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};
/** Call cutoff = effective DP (Ext. DP if present, else DP) − 4 days. */
const cutoffOf = (dp, extDp) => {
  const base = extDp || dp;
  if (!base) return null;
  const d = new Date(`${String(base).slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() - 4);
  return d.toLocaleDateString('en-CA');
};
const todayStr = () => new Date().toLocaleDateString('en-CA');
/** Earliest new DP that still opens the call window (cutoff = DP − 4 days ≥ today). */
const minNewDp = () => {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toLocaleDateString('en-CA');
};
const left = (secs) => {
  const s = Math.max(0, Math.round(secs || 0));
  if (s === 0) return 'reverting…';
  const h = Math.floor(s / 3600), m = Math.ceil((s % 3600) / 60);
  return h > 0 ? `${h} h ${m} m` : `${m} min`;
};

const STATUS = {
  ACTIVE: { label: 'Active', cls: 'ok' },
  REVERTED: { label: 'Auto-reverted', cls: 'lock' },
  REVERTED_MANUAL: { label: 'Reverted early', cls: 'lock' },
  SKIPPED: { label: 'Not reverted', cls: 'warn' },
  REVERTING: { label: 'Reverting', cls: 'lock' },
};

export default function TemporaryDpChange({ onNotify }) {
  const notify = useCallback((m, s) => onNotify && onNotify(m, s), [onNotify]);
  const [tab, setTab] = useState('change');

  // PO dropdown (server search + infinite scroll)
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [optPage, setOptPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [optLoading, setOptLoading] = useState(false);
  const abortRef = useRef(null);

  const loadOptions = useCallback(async (q, page) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setOptLoading(true);
    try {
      const d = await searchPos({ q, page, size: PAGE, signal: ctrl.signal });
      setOptions((prev) => (page === 0 ? d.content : [...prev, ...d.content]));
      setHasMore(!!d.hasMore);
      setOptPage(page);
    } catch (e) {
      if (e.name !== 'AbortError') notify(e.message, 'error');
    } finally {
      if (abortRef.current === ctrl) setOptLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const t = setTimeout(() => loadOptions(search, 0), 300);
    return () => clearTimeout(t);
  }, [search, loadOptions]);

  const onPopupScroll = (e) => {
    const el = e.target;
    if (hasMore && !optLoading && el.scrollTop + el.clientHeight >= el.scrollHeight - 40) loadOptions(search, optPage + 1);
  };

  // Selected PO
  const [poNo, setPoNo] = useState();
  const [po, setPo] = useState(null);
  const [poLoading, setPoLoading] = useState(false);
  // Sr No. table paging (client side): back to page 1 for a new PO, same page after a change / revert
  const [itemPage, setItemPage] = useState(0);
  const [itemSize, setItemSize] = useState(10);
  const loadPo = useCallback(async (no, keepPage = false) => {
    if (!keepPage) setItemPage(0);
    if (!no) { setPo(null); return; }
    setPoLoading(true);
    try { setPo(await getPoDp(no)); } catch (e) { notify(e.message, 'error'); setPo(null); } finally { setPoLoading(false); }
  }, [notify]);

  // Edit dialog
  const [edit, setEdit] = useState(null);     // { item, newDp, remarks }
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!edit?.newDp || !edit.remarks.trim() || saving) return;
    if (edit.newDp < minNewDp()) {
      notify(`New date must be on or after ${fmtDay(minNewDp())} (calls can be raised up to 4 days before the DP).`, 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await applyDpChange({ poNo: po.poNo, srNo: edit.item.srNo, newDp: edit.newDp, remarks: edit.remarks.trim() });
      setPo(updated);
      setEdit(null);
      notify(`${edit.item.extDp ? 'Ext. DP' : 'DP'} of Sr No. ${edit.item.srNo} set to ${fmtDay(edit.newDp)} — it will be restored automatically in ${REVERT_HOURS} hours.`, 'success');
      loadActive();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Active changes (all POs) + history
  const [active, setActive] = useState([]);
  const loadActive = useCallback(async () => {
    try { setActive((await getActiveDpChanges()) || []); } catch (e) { /* shown on action */ }
  }, []);
  useEffect(() => {
    loadActive();
    const t = setInterval(loadActive, 60_000);   // keep the countdown / auto-reverts current
    return () => clearInterval(t);
  }, [loadActive]);

  const [history, setHistory] = useState({ content: [], total: 0, page: 0 });
  const [histLoading, setHistLoading] = useState(false);
  const loadHistory = useCallback(async (page = 0) => {
    setHistLoading(true);
    try { setHistory(await getDpChangeHistory({ page, size: 20 })); } catch (e) { notify(e.message, 'error'); } finally { setHistLoading(false); }
  }, [notify]);
  useEffect(() => { if (tab === 'history') loadHistory(0); }, [tab, loadHistory]);

  const [reverting, setReverting] = useState(null);
  const [confirmRevert, setConfirmRevert] = useState(null);   // change waiting for the user's OK
  const revertNow = (c) => { if (!reverting) setConfirmRevert(c); };
  const doRevert = async () => {
    const c = confirmRevert;
    if (!c || reverting) return;
    setReverting(c.id);
    try {
      const r = await revertDpChange(c.id);
      notify(r?.status === 'SKIPPED' ? 'DP was already changed by another source — kept as it is.' : 'Previous DP restored.', r?.status === 'SKIPPED' ? 'warning' : 'success');
      loadActive();
      if (po && po.poNo === c.poNo) loadPo(po.poNo, true);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setReverting(null);
      setConfirmRevert(null);
    }
  };

  return (
    <div className="coq dpc">
      <div className="coq-head">
        <div>
          <h2>Temporary DP Change</h2>
          <p>Change a PO serial&apos;s DP for {REVERT_HOURS} hours (e.g. to let the vendor raise a call). The previous DP is restored automatically.</p>
        </div>
        <div className="coq-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'change'} className={tab === 'change' ? 'on' : ''} onClick={() => setTab('change')}>Change DP</button>
          <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>History</button>
        </div>
      </div>

      {tab === 'change' && (
        <>
          {active.length > 0 && (
            <div className="coq-card dpc-active">
              <div className="dpc-title"><i className="fa-solid fa-hourglass-half" /> Active temporary changes ({active.length})</div>
              <div className="dpc-table-wrap">
                <table className="dpc-table">
                  <thead><tr><th>PO / Sr No.</th><th>DP</th><th>Changed by</th><th>Reverts in</th><th /></tr></thead>
                  <tbody>
                    {active.map((c) => (
                      <tr key={c.id}>
                        <td><button type="button" className="dpc-link" onClick={() => { setPoNo(c.poNo); loadPo(c.poNo); }}>{c.poNo}</button> / {c.srNo}</td>
                        <td>{c.field === 'EXT_DP' && <span className="dpc-sub">Ext. DP </span>}<span className="dpc-old">{fmtDay(c.oldDp)}</span> → <strong>{fmtDay(c.newDp)}</strong></td>
                        <td>{c.changedBy}{c.changedByEmpCode ? ` (${c.changedByEmpCode})` : ''}<div className="dpc-sub">{fmtTs(c.changedAt)}</div></td>
                        <td><span className="coq-chip ok">{left(c.secondsLeft)}</span></td>
                        <td><button type="button" className="dpc-btn ghost" disabled={reverting === c.id} onClick={() => revertNow(c)}>{reverting === c.id ? 'Reverting…' : 'Revert now'}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="coq-card">
            <div className="coq-field dpc-po-field">
              <label htmlFor="dpc-po">Purchase Order</label>
              <Select
                id="dpc-po"
                showSearch
                allowClear
                value={poNo}
                placeholder="Search PO no., vendor name or vendor code"
                filterOption={false}
                onSearch={setSearch}
                onChange={(v) => { setPoNo(v); loadPo(v); }}
                onClear={() => { setSearch(''); setPo(null); }}
                onPopupScroll={onPopupScroll}
                notFoundContent={optLoading ? <Spin size="small" /> : 'No POs found'}
                listHeight={320}
                optionLabelProp="label"
                popupClassName="coq-dropdown dpc-dropdown"
                style={{ width: '100%' }}
                popupMatchSelectWidth={false}
                options={options.map((o) => ({ value: o.poNo, label: o.poNo, render: o }))}
                optionRender={(opt) => {
                  const o = opt.data.render;
                  return (
                    <div className="coq-opt">
                      <div className="coq-opt-top"><strong>{o.poNo}</strong><span className="coq-chip lock">{o.product}</span></div>
                      <div className="coq-opt-sub">{o.vendorName} · {o.vendorCode} · {fmtDay(o.poDate)}</div>
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

          {poLoading && <div className="coq-card dpc-center"><Spin /></div>}

          {!poLoading && po && (
            <>
              <div className="coq-card dpc-summary">
                <div><span>PO No.</span><strong>{po.poNo}</strong></div>
                <div><span>PO Date</span><strong>{fmtDay(po.poDate)}</strong></div>
                <div><span>Product</span><strong>{po.product}</strong></div>
                <div><span>Railway</span><strong>{po.railway || '-'}</strong></div>
                <div className="dpc-wide"><span>Vendor</span><strong>{po.vendorName}</strong></div>
                <div><span>Vendor Code</span><strong>{po.vendorCode || '-'}</strong></div>
              </div>

              <div className="coq-card">
                <div className="dpc-title">PO Sr No. and DP</div>
                <div className="dpc-table-wrap">
                  <table className="dpc-table">
                    <thead>
                      <tr><th>Sr No.</th><th>Item</th><th>Qty</th><th>DP</th><th>Ext. DP</th><th>Call cutoff</th><th /></tr>
                    </thead>
                    <tbody>
                      {(po.items || []).slice(itemPage * itemSize, (itemPage + 1) * itemSize).map((it) => {
                        const cut = cutoffOf(it.dp, it.extDp);
                        const closed = cut && cut < todayStr();
                        return (
                          <tr key={it.srNo}>
                            <td><strong>{it.srNo}</strong></td>
                            <td className="dpc-desc" title={it.itemDesc}>{it.itemDesc || '-'}</td>
                            <td>{it.qty ?? '-'} {it.uom || ''}</td>
                            <td>
                              <strong>{fmtDay(it.dp)}</strong>
                              {it.activeChange && it.activeChange.field !== 'EXT_DP' && <div className="dpc-sub">was {fmtDay(it.activeChange.oldDp)} · reverts in {left(it.activeChange.secondsLeft)}</div>}
                            </td>
                            <td>
                              {fmtDay(it.extDp)}
                              {/* a serial with an Ext. DP has its Ext. DP changed (the vendor cutoff uses it) */}
                              {it.activeChange && it.activeChange.field === 'EXT_DP' && <div className="dpc-sub">was {fmtDay(it.activeChange.oldDp)} · reverts in {left(it.activeChange.secondsLeft)}</div>}
                            </td>
                            <td>
                              {cut ? <span className={`coq-chip ${closed ? 'lock' : 'ok'}`}>{closed ? 'Closed' : 'Open'} · {fmtDay(cut)}</span> : '-'}
                            </td>
                            <td>
                              {it.activeChange ? (
                                <button type="button" className="dpc-btn ghost" disabled={reverting === it.activeChange.id}
                                  onClick={() => revertNow({ ...it.activeChange, poNo: po.poNo, srNo: it.srNo })}>Revert now</button>
                              ) : (
                                <button type="button" className="dpc-btn" onClick={() => setEdit({ item: it, newDp: '', remarks: '' })}>Change DP</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {(po.items || []).length > 10 && (() => {
                  const total = po.items.length;
                  const pages = Math.ceil(total / itemSize);
                  const pg = Math.min(itemPage, pages - 1);
                  return (
                    <div className="dpc-pager">
                      <span>{pg * itemSize + 1}–{Math.min((pg + 1) * itemSize, total)} of {total} serials</span>
                      <label className="dpc-size">
                        Rows
                        <select value={itemSize} onChange={(e) => { setItemSize(Number(e.target.value)); setItemPage(0); }}>
                          {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                      <button type="button" className="dpc-btn ghost" disabled={pg === 0} onClick={() => setItemPage(pg - 1)}>Previous</button>
                      <span>Page {pg + 1} of {pages}</span>
                      <button type="button" className="dpc-btn ghost" disabled={pg + 1 >= pages} onClick={() => setItemPage(pg + 1)}>Next</button>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="coq-card">
          {histLoading ? <div className="dpc-center"><Spin /></div> : history.content.length === 0 ? (
            <div className="dpc-empty">No DP changes yet.</div>
          ) : (
            <div className="dpc-table-wrap">
              <table className="dpc-table">
                <thead><tr><th>PO / Sr No.</th><th>DP</th><th>Changed by</th><th>Remarks</th><th>Status</th><th>Reverted</th></tr></thead>
                <tbody>
                  {history.content.map((c) => {
                    const st = STATUS[c.status] || { label: c.status, cls: 'lock' };
                    return (
                      <tr key={c.id}>
                        <td>{c.poNo} / {c.srNo}</td>
                        <td>{c.field === 'EXT_DP' && <span className="dpc-sub">Ext. DP </span>}<span className="dpc-old">{fmtDay(c.oldDp)}</span> → <strong>{fmtDay(c.newDp)}</strong></td>
                        <td>{c.changedBy}{c.changedByEmpCode ? ` (${c.changedByEmpCode})` : ''}<div className="dpc-sub">{fmtTs(c.changedAt)}</div></td>
                        <td className="dpc-remarks">{c.remarks}</td>
                        <td><span className={`coq-chip ${st.cls}`}>{st.label}</span>{c.status === 'ACTIVE' && <div className="dpc-sub">in {left(c.secondsLeft)}</div>}</td>
                        <td>{c.revertedAt ? <>{fmtTs(c.revertedAt)}<div className="dpc-sub">{c.revertedBy}{c.revertNote ? ` · ${c.revertNote}` : ''}</div></> : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {history.total > 20 && (
            <div className="dpc-pager">
              <button type="button" className="dpc-btn ghost" disabled={history.page === 0} onClick={() => loadHistory(history.page - 1)}>Previous</button>
              <span>Page {history.page + 1} of {Math.ceil(history.total / 20)}</span>
              <button type="button" className="dpc-btn ghost" disabled={(history.page + 1) * 20 >= history.total} onClick={() => loadHistory(history.page + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {edit && (
        <div className="dpc-overlay" onClick={(e) => e.target === e.currentTarget && !saving && setEdit(null)}>
          <div className="dpc-dialog" role="dialog" aria-modal="true" aria-labelledby="dpc-dlg-title">
            <h3 id="dpc-dlg-title">Change DP · Sr No. {edit.item.srNo}</h3>
            <p className="dpc-sub">PO {po.poNo} · current DP <strong>{fmtDay(edit.item.dp)}</strong>{edit.item.extDp ? <> · Ext. DP <strong>{fmtDay(edit.item.extDp)}</strong></> : null}</p>
            {edit.item.extDp && (
              <div className="dpc-warn"><i className="fa-solid fa-triangle-exclamation" /> This serial has an Ext. DP, which the call cutoff uses instead of DP. Changing DP will not reopen call raising.</div>
            )}
            <label className="coq-field">
              <span>New DP <span className="dpc-req">*</span></span>
              <input type="date" min={minNewDp()} value={edit.newDp} onChange={(e) => setEdit({ ...edit, newDp: e.target.value })} />
            </label>
            {edit.newDp && <div className="dpc-sub">Calls can be raised until {fmtDay(cutoffOf(edit.newDp, edit.item.extDp))}.</div>}
            <label className="coq-field">
              <span>Remarks <span className="dpc-req">*</span></span>
              <textarea rows={3} maxLength={500} value={edit.remarks} placeholder="e.g. Vendor request letter dated …"
                onChange={(e) => setEdit({ ...edit, remarks: e.target.value })} />
            </label>
            <div className="dpc-note"><i className="fa-regular fa-clock" /> The {edit.item.extDp ? 'Ext. DP' : 'DP'} goes back to <strong>{fmtDay(edit.item.extDp || edit.item.dp)}</strong> automatically after {REVERT_HOURS} hours.</div>
            <div className="dpc-actions">
              <button type="button" className="dpc-btn ghost" disabled={saving} onClick={() => setEdit(null)}>Cancel</button>
              <button type="button" className="dpc-btn" disabled={!edit.newDp || !edit.remarks.trim() || saving} onClick={submit}>
                {saving ? 'Saving…' : 'Change DP'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRevert}
        tone="warning"
        title="Restore previous date?"
        message={confirmRevert ? `PO ${confirmRevert.poNo} / Sr No. ${confirmRevert.srNo}` : ''}
        details={confirmRevert && (
          <>
            {confirmRevert.field === 'EXT_DP' ? 'Ext. DP' : 'DP'} goes back from <strong>{fmtDay(confirmRevert.newDp)}</strong> to <strong>{fmtDay(confirmRevert.oldDp)}</strong>.
          </>
        )}
        confirmText="Restore now"
        busy={!!reverting}
        onConfirm={doRevert}
        onCancel={() => setConfirmRevert(null)}
      />
    </div>
  );
}
