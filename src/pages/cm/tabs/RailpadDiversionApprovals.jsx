import React, { useCallback, useEffect, useState } from 'react';
import railpadDiversionService from '../../../services/railpadDiversionService';

/*
 * Rail Pad material diversion approvals for CM (mode="CM") or SBU Head (mode="SBU").
 * Approve = choose the Rail Pad IE who issues the diverted IC; the diverted call then appears in that IE's Issuance of IC.
 */
const fmtQty = (v) => (v == null ? '-' : Number(v).toLocaleString('en-IN'));
const fmtDate = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('-') : '-');
const STATUS = {
  PENDING_CM_APPROVAL: 'Pending with CM', SENT_TO_SBU_HEAD: 'With SBU Head', PENDING_SBU_APPROVAL: 'With SBU Head',
  CM_APPROVE_DIVERSION: 'Approved by CM', SBU_HEAD_APPROVE_DIVERSION: 'Approved by SBU Head', CM_RETURN_DIVERSION: 'Returned by CM',
  SBU_HEAD_RETURN_DIVERSION: 'Returned by SBU Head', BASKET_CREATED: 'Approved', COMPLETED: 'Completed',
};

const s = {
  wrap: { display: 'grid', gap: 14 },
  tabs: { display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0' },
  tab: (a) => ({ background: 'none', border: 'none', padding: '9px 14px', cursor: 'pointer', fontSize: 14, color: a ? '#0f172a' : '#64748b', fontWeight: a ? 600 : 400, borderBottom: `2px solid ${a ? '#2563eb' : 'transparent'}` }),
  tableWrap: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 },
  th: { textAlign: 'left', padding: '9px 10px', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' },
  td: { padding: '9px 10px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top', color: '#0f172a' },
  num: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
  link: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '2px 6px', fontSize: 13 },
  btn: (primary, disabled) => ({ border: primary ? 'none' : '1px solid #e2e8f0', borderRadius: 8, padding: '9px 14px', fontWeight: 600, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', background: primary ? (disabled ? '#93c5fd' : '#2563eb') : '#f1f5f9', color: primary ? '#fff' : '#0f172a', minHeight: 40 }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 16 },
  modal: { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, padding: 20, display: 'grid', gap: 12, maxHeight: '92vh', overflowY: 'auto' },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 },
  toast: (t) => ({ position: 'fixed', top: 18, right: 18, zIndex: 4000, padding: '12px 16px', borderRadius: 10, color: '#fff', fontSize: 14, background: t === 'error' ? '#dc2626' : '#16a34a', maxWidth: 'calc(100vw - 36px)' }),
  empty: { textAlign: 'center', color: '#64748b', padding: 28 },
};

const RailpadDiversionApprovals = ({ mode = 'CM' }) => {
  const isCm = mode === 'CM';
  const [view, setView] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ies, setIes] = useState([]);
  const [dialog, setDialog] = useState(null); // { type: 'approve'|'return'|'sbu'|'history', req }
  const [ieId, setIeId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fn = isCm ? (view === 'pending' ? railpadDiversionService.getCmPending : railpadDiversionService.getCmActioned)
        : (view === 'pending' ? railpadDiversionService.getSbuPending : railpadDiversionService.getSbuActioned);
      setRows((await fn()) || []);
    } catch (e) {
      setRows([]); showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [isCm, view, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { railpadDiversionService.getRailIes().then(setIes).catch(() => setIes([])); }, []);

  const open = async (type, req) => {
    setDialog({ type, req }); setRemarks(''); setIeId(req.sourceIeUserId ? String(req.sourceIeUserId) : '');
    if (type === 'history') {
      try { setHistory((await railpadDiversionService.getHistory(req.id)) || []); } catch (e) { setHistory([]); showToast(e.message, 'error'); }
    }
  };

  const confirm = async () => {
    const { type, req } = dialog;
    if (type === 'approve' && !ieId) { showToast('Select the IE who will issue the diverted IC', 'error'); return; }
    if (type === 'return' && !remarks.trim()) { showToast('Remarks are required to return', 'error'); return; }
    setSaving(true);
    try {
      if (type === 'approve') await (isCm ? railpadDiversionService.cmApprove : railpadDiversionService.sbuApprove)(req.id, Number(ieId), remarks);
      if (type === 'return') await (isCm ? railpadDiversionService.cmReturn : railpadDiversionService.sbuReturn)(req.id, remarks);
      if (type === 'sbu') await railpadDiversionService.cmSendToSbu(req.id, remarks);
      showToast(type === 'approve' ? 'Approved — diverted call sent to the IE' : type === 'return' ? 'Returned to vendor' : 'Forwarded to SBU Head');
      setDialog(null); load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openLetter = async (id) => {
    try { window.open(await railpadDiversionService.openLetter(id), '_blank'); } catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <div style={s.wrap}>
      <div style={s.tabs} role="tablist">
        <button type="button" style={s.tab(view === 'pending')} onClick={() => setView('pending')}>Pending</button>
        <button type="button" style={s.tab(view === 'done')} onClick={() => setView('done')}>Actioned</button>
      </div>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead><tr>
            {['Request', 'Vendor / plant', 'Stage', 'Source IC', 'From PO', 'To PO', 'Qty', 'Type', 'Railway letter', 'Status', ''].map((h, i) => (
              <th key={h || i} style={{ ...s.th, ...(h === 'Qty' ? s.num : {}) }}>{h}</th>))}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={11} style={s.empty}>Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={11} style={s.empty}>{view === 'pending' ? 'No Rail Pad diversion requests waiting for you.' : 'Nothing actioned yet.'}</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id}>
                <td style={s.td}><strong>{r.requestNo}</strong><div style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(r.createdDate)}</div></td>
                <td style={s.td}>{r.vendorCode}<div style={{ color: '#64748b', fontSize: 12 }}>{r.plantName || r.plantId}</div></td>
                <td style={s.td}>{r.stage === 'PROCESS' ? 'Process' : 'Final'}</td>
                <td style={{ ...s.td, fontFamily: 'Consolas, monospace', fontSize: 12 }}>{r.sourceIcNo}</td>
                <td style={s.td}>{r.sourcePoNo} / {r.sourcePoSrNo}</td>
                <td style={s.td}>{r.targetPoNo} / {r.targetPoSrNo}</td>
                <td style={{ ...s.td, ...s.num }}>{fmtQty(r.totalDiversionQty)} {r.unitOfMeasurement}</td>
                <td style={s.td}>{r.diversionType === 'COMPLETE' ? 'Complete' : 'Partial'}</td>
                <td style={s.td}>{r.railwayPermissionNo}<div style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(r.railwayPermissionDate)}</div>{r.callDate && <div style={{ color: '#0369a1', fontSize: 12 }}>Call Date: {fmtDate(r.callDate)}</div>}
                  <button type="button" style={s.link} onClick={() => openLetter(r.id)}>View</button></td>
                <td style={s.td}>{STATUS[r.status] || r.status}{r.divertedCallNo && <div style={{ color: '#64748b', fontSize: 12 }}>Call {r.divertedCallNo}</div>}</td>
                <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                  {view === 'pending' && <button type="button" style={s.link} onClick={() => open('approve', r)}>Approve</button>}
                  {view === 'pending' && <button type="button" style={{ ...s.link, color: '#b91c1c' }} onClick={() => open('return', r)}>Return</button>}
                  <button type="button" style={s.link} onClick={() => open('history', r)}>History</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog && (
        <div style={s.overlay} role="dialog" aria-modal="true">
          <div style={s.modal}>
            <h3 style={{ margin: 0, fontSize: 17 }}>
              {dialog.type === 'approve' ? 'Approve diversion' : dialog.type === 'return' ? 'Return to vendor' : dialog.type === 'sbu' ? 'Forward to SBU Head' : 'History'} · {dialog.req.requestNo}
            </h3>
            {dialog.type === 'history' ? (
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                {history.length === 0 && <div style={{ color: '#64748b' }}>No history.</div>}
                {history.map((h) => (
                  <div key={h.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                    <strong>{h.action}</strong> · {h.actionUserName || h.actionUserId} ({h.actionRole}) · {fmtDate(h.createdDate)}
                    <div style={{ color: '#64748b' }}>{h.fromStatus || '-'} → {h.toStatus}{h.remarks ? ` · ${h.remarks}` : ''}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {dialog.type === 'approve' && (
                  <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: '#475569' }}>IE to issue the diverted IC *
                    <select style={s.input} value={ieId} onChange={(e) => setIeId(e.target.value)}>
                      <option value="">Select Rail Pad IE</option>
                      {ies.map((u) => <option key={u.userId || u.id} value={String(u.userId || u.id)}>
                        {(u.fullName || u.userName || u.username)}{String(u.userId || u.id) === String(dialog.req.sourceIeUserId) ? ' · source IC IE' : ''} · {u.roleName}
                      </option>)}
                    </select>
                  </label>
                )}
                <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: '#475569' }}>Remarks {dialog.type === 'return' && '*'}
                  <textarea style={{ ...s.input, minHeight: 70 }} value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={1000} />
                </label>
                {dialog.type === 'approve' && (
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                    Approving creates a diverted {dialog.req.stage === 'PROCESS' ? 'Process (RPP)' : 'Final (RPF)'} call for {fmtQty(dialog.req.totalDiversionQty)} on PO {dialog.req.targetPoNo} / {dialog.req.targetPoSrNo}. It goes straight to the IE's Issuance of IC, without re-inspection.
                  </p>
                )}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" style={s.btn(false, saving)} disabled={saving} onClick={() => setDialog(null)}>{dialog.type === 'history' ? 'Close' : 'Cancel'}</button>
              {dialog.type !== 'history' && (
                <button type="button" style={s.btn(true, saving)} disabled={saving} onClick={confirm}>
                  {saving ? 'Saving…' : dialog.type === 'approve' ? 'Approve' : dialog.type === 'return' ? 'Return' : 'Forward'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && <div style={s.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
};

export default RailpadDiversionApprovals;
