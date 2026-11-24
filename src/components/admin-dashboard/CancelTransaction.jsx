import React, { useCallback, useEffect, useState } from 'react';
import { getCallTransactions, deleteLatestTransaction, getCancelHistory } from '../../services/superAdminTxnService';
import { getDetailedStatus } from '../../utils/statusMapper';
import './CancelTransaction.css';

/*
 * Super Admin – Cancel Last Transaction (ERC / Sleeper / Rail Pad)
 * Enter a call no. → all its workflow transactions are listed → only the latest one can be cancelled,
 * one at a time, with mandatory remarks. Every cancel is stored in the history (who, emp code, remarks).
 */

const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const PRODUCT_LABEL = { ERC: 'ERC', SLEEPER: 'Sleeper', RAILPAD: 'Rail Pad' };

// Sleeper / Rail Pad keep the step in ACTION (their STATUS is just Pending / Completed)
const SR_STEPS = {
  CREATED: ['Pending', 'Call Raised'],
  INITIATE_CALL: ['Under Inspection', 'Inspection Initiated'],
  VERIFY: ['Pending', 'Call Registered'],
  PO_VERIFICATION: ['Under Inspection', 'PO Verification'],
  MAIN_IE_SCHEDULE_CALL: ['Pending', 'Call Scheduled'],
  RESCHEDULE_CALL: ['Pending', 'Call Rescheduled'],
  PAUSE: ['Under Inspection', 'Paused for Next Schedule'],
  RESUME: ['Under Inspection', 'Resumed'],
  WITHHELD: ['Under Inspection', 'Withheld'],
  REJECT: ['Pending', 'Returned to Vendor'],
  REQUEST_BACK: ['Pending', 'Returned to Vendor'],
  RESUBMIT: ['Pending', 'Resubmitted'],
  FINISH: ['Completed', 'IC Issuance Pending'],
  IC_ISSUE: ['Completed', 'IC Issuance Pending'],
  IC_GENERATION: ['Completed', 'E-Signed'],
  GENERATE_IC: ['Completed', 'E-Signed'],
  DSC_SIGN_IC: ['Completed', 'E-Signed'],
  SEND_CALL_TO_IBS: ['Closed', 'Sent to IBS'],
  SENT_TO_IBS: ['Closed', 'Sent to IBS'],
  WITHDRAW: ['Withdrawn', 'Withdrawn by Vendor'],
  CANCEL: ['Cancelled', 'Cancelled'],
  CANCEL_CALL: ['Cancelled', 'Cancelled'],
  DELETE: ['Deleted', 'Deleted'],
};
const humanize = (v) => String(v || '').toLowerCase().replace(/_/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase());

/** main status + sub status, the same labels the vendor / IE dashboards use */
const stepStatus = (product, action, status) => {
  const a = String(action || '').trim().toUpperCase();
  const st = String(status || '').trim().toUpperCase();
  if (product !== 'ERC') {
    const m = SR_STEPS[a] || SR_STEPS[st];
    if (m) return { main: m[0], sub: m[1] };
    return { main: humanize(status || action) || '-', sub: '' };
  }
  const d = getDetailedStatus(st || a);
  if (d.subStatus && d.subStatus !== '-') return { main: d.mainStatus, sub: d.subStatus };
  return { main: humanize(st || a) || '-', sub: '' };
};
/** "Name (CODE), Name (CODE)" → [{ name, code }] */
const splitIes = (txt) => String(txt || '').split(/,\s*(?=[^,]*\(\s*[^()]*\)\s*(?:,|$))/).map((x) => x.trim()).filter(Boolean);
const parseIe = (x) => { const m = x.match(/^(.*)\(([^()]*)\)\s*$/); return m ? { name: m[1].trim(), code: m[2].trim() } : { name: x, code: '-' }; };

const tone = (main) => {
  const m = String(main).toLowerCase();
  if (m.includes('closed') || m.includes('completed')) return 'done';
  if (m.includes('under')) return 'active';
  if (m.includes('cancel') || m.includes('withdraw') || m.includes('delete')) return 'stop';
  return 'wait';
};

const CancelTransaction = ({ onNotify }) => {
  const [tab, setTab] = useState('cancel');
  const [ieOpen, setIeOpen] = useState(false);
  const [ieFilter, setIeFilter] = useState('');

  // cancel tab
  const [callNo, setCallNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [confirmRow, setConfirmRow] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  // history tab
  const [hCall, setHCall] = useState('');
  const [hQuery, setHQuery] = useState('');
  const [hPage, setHPage] = useState(0);
  const [history, setHistory] = useState(null);
  const [hLoading, setHLoading] = useState(false);

  const notify = (msg, sev) => onNotify && onNotify(msg, sev);

  const search = async (e) => {
    if (e) e.preventDefault();
    if (!callNo.trim()) { setError('Enter a call number'); return; }
    setLoading(true); setError(''); setData(null);
    try {
      setData(await getCallTransactions(callNo));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (remarks.trim().length < 5) return;
    setSaving(true);
    try {
      const res = await deleteLatestTransaction(data.callNo, confirmRow.id, remarks);
      notify(`Transaction ${res.deletedTransactionId} (${res.action || res.status}) of ${res.callNo} cancelled`, 'success');
      setConfirmRow(null); setRemarks('');
      try {
        setData(await getCallTransactions(data.callNo));
      } catch (err) {
        setData(null); setError(err.message);           // no transactions left
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = useCallback(async () => {
    setHLoading(true);
    try {
      setHistory(await getCancelHistory({ callNo: hQuery, page: hPage, size: 20 }));
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setHLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hPage, hQuery]);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const txns = data?.transactions || [];
  const mappedIes = (() => {
    const row = txns.find((t) => t.assignedVia);
    return row ? splitIes(row.assignedToName).map(parseIe) : [];
  })();

  return (
    <div className="ctx">
      <div className="ctx-head">
        <div>
          <h2>Cancel Last Transaction</h2>
          <p>Remove a call's latest workflow step, one at a time. ERC, Sleeper and Rail Pad.</p>
        </div>
        <div className="ctx-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'cancel'} className={tab === 'cancel' ? 'on' : ''} onClick={() => setTab('cancel')}>Transactions</button>
          <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>History</button>
        </div>
      </div>

      {tab === 'cancel' && (
        <>
          <form className="ctx-search" onSubmit={search}>
            <label htmlFor="ctx-call">Call No.</label>
            <input id="ctx-call" value={callNo} onChange={(e) => setCallNo(e.target.value)}
                   placeholder="e.g. EF-26111703, SF-26112110, RPP-080726010" autoComplete="off" />
            <button type="submit" disabled={loading}>{loading ? 'Fetching…' : 'Fetch transactions'}</button>
          </form>

          {error && <div className="ctx-error">{error}</div>}

          {loading && <div className="ctx-skel">{[0, 1, 2, 3].map((i) => <div key={i} />)}</div>}

          {data && !loading && (
            <div className="ctx-card">
              <div className="ctx-callhead">
                <div className="ctx-callhead-id">
                  <strong>{data.callNo}</strong>
                  <span className={`ctx-badge ${data.product.toLowerCase()}`}>{PRODUCT_LABEL[data.product] || data.product}</span>
                  {data.icNumber && <span className="ctx-muted">IC {data.icNumber}</span>}
                </div>
                <div className="ctx-callhead-facts">
                  <span><b>{txns.length}</b> step{txns.length === 1 ? '' : 's'}</span>
                  {mappedIes.length > 0 && (
                    <button type="button" className="ctx-iebtn" onClick={() => { setIeOpen(true); setIeFilter(''); }}>
                      <i className="fa-solid fa-users" aria-hidden="true" /> {mappedIes.length} Process IE{mappedIes.length === 1 ? '' : 's'} mapped
                      <i className="fa-solid fa-chevron-right ctx-iebtn-arrow" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div className="ctx-steps" role="table" aria-label="Workflow steps">
                <div className="ctx-steps-head" role="row">
                  <span role="columnheader">#</span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">Assigned to</span>
                  <span role="columnheader">Date</span>
                  <span role="columnheader" aria-label="Action" />
                </div>
                {txns.map((t, i) => {
                  const ss = stepStatus(data.product, t.action, t.status);
                  const ieCount = t.assignedVia ? splitIes(t.assignedToName).length : 0;
                  return (
                    <div key={t.id} role="row" className={`ctx-srow ${t.deletable ? 'latest' : ''}`}>
                      <span role="cell" className={`ctx-num ${tone(ss.main)}`}>{i + 1}</span>
                      <span role="cell" className="ctx-scell" title={`Workflow action: ${t.action || t.status || '-'}`}>
                        <span className={`ctx-chip ${tone(ss.main)}`}>{ss.main}</span>
                        {ss.sub && <span className="ctx-step-sub">{ss.sub}</span>}
                        {t.deletable && <span className="ctx-latest-tag">Latest</span>}
                      </span>
                      <span role="cell" className="ctx-acell">
                        {t.assignedVia ? (
                          <button type="button" className="ctx-ielink" onClick={() => { setIeOpen(true); setIeFilter(''); }}>
                            {ieCount} Process IE{ieCount === 1 ? '' : 's'}
                          </button>
                        ) : (
                          <span className={t.assignedToName ? '' : 'ctx-muted'}>{t.assignedToName || '—'}</span>
                        )}
                      </span>
                      <span role="cell" className="ctx-dcell">{fmtDate(t.createdDate)}</span>
                      <span role="cell" className="ctx-bcell">
                        {t.deletable && (
                          <button className="ctx-danger" onClick={() => { setConfirmRow(t); setRemarks(''); }}>
                            <i className="fa-solid fa-rotate-left" aria-hidden="true" /> Cancel step
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="ctx-note">Only the latest step can be cancelled. After it is removed, the one before it becomes the latest. Hover a status to see its workflow action.</p>
            </div>
          )}

          {!data && !loading && !error && (
            <div className="ctx-empty">
              <i className="fa-solid fa-magnifying-glass ctx-empty-ico" aria-hidden="true"></i>
              <strong>Search a call to see its workflow steps</strong>
              <span>Only the latest step can be cancelled, one at a time. Every cancel is recorded with your name, emp code and remarks.</span>
              <span className="ctx-formats">ERC: ER- / EP- / EF-  ·  Sleeper: SF-  ·  Rail Pad: RPP- / RPF-</span>
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="ctx-card">
          <form className="ctx-search" onSubmit={(e) => { e.preventDefault(); setHPage(0); setHQuery(hCall); }}>
            <label htmlFor="ctx-hcall">Call No.</label>
            <input id="ctx-hcall" value={hCall} onChange={(e) => setHCall(e.target.value)} placeholder="Filter by call no. (optional)" />
            <button type="submit" disabled={hLoading}>{hLoading ? 'Loading…' : 'Search'}</button>
          </form>
          {hLoading && <div className="ctx-skel">{[0, 1, 2].map((i) => <div key={i} />)}</div>}
          {!hLoading && history && (history.content.length === 0
            ? <div className="ctx-empty">No cancellations yet.</div>
            : (
              <>
                <div className="ctx-table-wrap">
                  <table className="ctx-table">
                    <thead>
                      <tr><th>When</th><th>Call No.</th><th>Product</th><th>Step cancelled</th><th>Deleted by</th><th>Emp code</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {history.content.map((h) => (
                        <tr key={h.id}>
                          <td data-l="When">{fmtDate(h.deletedOn)}</td>
                          <td data-l="Call No.">{h.callNo}</td>
                          <td data-l="Product">{PRODUCT_LABEL[h.product] || h.product}</td>
                          <td data-l="Step cancelled">
                            {(() => { const ss = stepStatus(h.product, h.action, h.status); return ss.sub ? `${ss.main} – ${ss.sub}` : ss.main; })()}
                            <div className="ctx-muted ctx-small"><code>{h.action || h.status}</code></div>
                          </td>
                          <td data-l="Deleted by">{h.deletedByName || h.deletedBy}</td>
                          <td data-l="Emp code">{h.empCode || '-'}</td>
                          <td data-l="Remarks" className="ctx-remarks">{h.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ctx-pager">
                  <button disabled={hPage === 0} onClick={() => setHPage((p) => p - 1)}>Previous</button>
                  <span>Page {history.page + 1} of {Math.max(history.totalPages, 1)} · {history.totalElements} records</span>
                  <button disabled={hPage + 1 >= history.totalPages} onClick={() => setHPage((p) => p + 1)}>Next</button>
                </div>
              </>
            ))}
        </div>
      )}

      {ieOpen && data && (
        <div className="ctx-overlay" role="dialog" aria-modal="true" aria-labelledby="ctx-ie-title" onClick={() => setIeOpen(false)}>
          <div className="ctx-dialog ctx-iedialog" onClick={(e) => e.stopPropagation()}>
            <div className="ctx-iedialog-head">
              <div>
                <h3 id="ctx-ie-title">Process IEs mapped to {data.callNo}</h3>
                <p className="ctx-muted">From the Process IE mapping of the call's place of inspection.</p>
              </div>
              <button type="button" className="ctx-x" aria-label="Close" onClick={() => setIeOpen(false)}>✕</button>
            </div>
            <input className="ctx-iefilter" value={ieFilter} onChange={(e) => setIeFilter(e.target.value)}
                   placeholder="Search name or employee code" aria-label="Search name or employee code" autoFocus />
            <div className="ctx-ielist">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Employee code</th></tr></thead>
                <tbody>
                  {mappedIes
                    .filter((ie) => !ieFilter.trim() || `${ie.name} ${ie.code}`.toLowerCase().includes(ieFilter.trim().toLowerCase()))
                    .map((ie, idx) => (
                      <tr key={`${ie.code}-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>{ie.name}</td>
                        <td><code>{ie.code}</code></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="ctx-dialog-foot ctx-muted">{mappedIes.length} Process IE{mappedIes.length === 1 ? '' : 's'}</div>
          </div>
        </div>
      )}

      {confirmRow && (
        <div className="ctx-overlay" role="dialog" aria-modal="true" aria-labelledby="ctx-dlg-title">
          <div className="ctx-dialog">
            <h3 id="ctx-dlg-title">Cancel the latest step of {data.callNo}?</h3>
            <p className="ctx-muted">
              {(() => { const ss = stepStatus(data.product, confirmRow.action, confirmRow.status); return ss.sub ? `${ss.main} – ${ss.sub}` : ss.main; })()}
              {' · '}<code>{confirmRow.action || confirmRow.status || '-'}</code>
            </p>
            <div className="ctx-remove">
              <strong>This will also remove:</strong>
              <ul>{(confirmRow.willAlsoRemove || ['Only this transaction']).map((x) => <li key={x}>{x}</li>)}</ul>
              <span>This cannot be undone.</span>
            </div>
            <label htmlFor="ctx-remarks">Remarks <span className="ctx-req">*</span></label>
            <textarea id="ctx-remarks" rows={3} maxLength={1000} value={remarks}
                      onChange={(e) => setRemarks(e.target.value)} placeholder="Why is this transaction being cancelled?" />
            {remarks.trim().length > 0 && remarks.trim().length < 5 && <div className="ctx-hint">At least 5 characters</div>}
            <div className="ctx-actions">
              <button className="ctx-ghost" onClick={() => setConfirmRow(null)} disabled={saving}>Keep it</button>
              <button className="ctx-danger" onClick={confirmDelete} disabled={saving || remarks.trim().length < 5}>
                {saving ? 'Cancelling…' : 'Cancel transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelTransaction;
