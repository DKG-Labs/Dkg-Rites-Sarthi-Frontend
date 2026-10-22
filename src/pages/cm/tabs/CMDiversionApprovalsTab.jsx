import React, { useState, useEffect, useCallback, useMemo } from 'react';
import diversionService from '../../../services/diversionService';
import { formatDate } from '../../../utils/helpers';

/* ─── tiny helpers ─────────────────────────────────────────────── */
const STATUS_META = {
  PENDING_CM_APPROVAL:       { label: 'Pending CM',        bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  CM_APPROVE_DIVERSION:      { label: 'CM Approved',       bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  PENDING_SBU_APPROVAL:      { label: 'Sent to SBU',       bg: '#ede9fe', color: '#4c1d95', dot: '#8b5cf6' },
  CM_RETURN_DIVERSION:       { label: 'Returned',          bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  SBU_HEAD_APPROVE_DIVERSION:{ label: 'SBU Approved',      bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  SBU_HEAD_RETURN_DIVERSION: { label: 'SBU Returned',      bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  BASKET_CREATED:            { label: 'Basket Created',    bg: '#dbeafe', color: '#1e3a8a', dot: '#3b82f6' },
  COMPLETED:                 { label: 'Completed',         bg: '#dcfce7', color: '#14532d', dot: '#22c55e' },
};

const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || { label: status || '—', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600', background:m.bg, color:m.color }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:m.dot, flexShrink:0 }} />
      {m.label}
    </span>
  );
};

const StagePill = ({ stage }) => {
  const map = {
    STAGE_I_RAW_MATERIAL:    { label: 'Raw Material',    bg:'#dbeafe', color:'#1e40af' },
    STAGE_II_MANUFACTURING:  { label: 'Manufacturing',   bg:'#fef9c3', color:'#854d0e' },
    STAGE_III_FINISHED:      { label: 'Finished',        bg:'#dcfce7', color:'#166534' },
  };
  const s = map[stage] || { label: stage || '—', bg:'#f1f5f9', color:'#475569' };
  return <span style={{ padding:'2px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:'600', background:s.bg, color:s.color }}>{s.label}</span>;
};

const InfoRow = ({ label, value }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
    <span style={{ fontSize:'11px', color:'#94a3b8', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
    <span style={{ fontSize:'13px', color:'#0f172a', fontWeight:'600' }}>{value || '—'}</span>
  </div>
);

const StatCard = ({ label, value, color, bg, icon }) => (
  <div style={{ background: bg, borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', minWidth:'160px', flex:1 }}>
    <div style={{ width:'40px', height:'40px', borderRadius:'10px', background: color + '22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>{icon}</div>
    <div>
      <div style={{ fontSize:'24px', fontWeight:'800', color }}>{value}</div>
      <div style={{ fontSize:'12px', color:'#64748b', fontWeight:'500' }}>{label}</div>
    </div>
  </div>
);

/* ─── main component ───────────────────────────────────────────── */
const CMDiversionApprovalsTab = ({ cmUserId }) => {
  const [activeSubTab, setActiveSubTab] = useState('PENDING');
  const [requests, setRequests]               = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [error, setError]                     = useState(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [stageFilter, setStageFilter]         = useState('ALL');

  const [selectedRequest, setSelectedRequest]         = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen]   = useState(false);
  const [isActionModalOpen, setIsActionModalOpen]     = useState(false);
  const [actionType, setActionType]                   = useState('');
  const [remarks, setRemarks]                         = useState('');
  const [actionLoading, setActionLoading]             = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen]   = useState(false);
  const [historyLogs, setHistoryLogs]                 = useState([]);
  const [historyLoading, setHistoryLoading]           = useState(false);
  const [toast, setToast] = useState({ show:false, message:'', type:'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show:true, message, type });
    setTimeout(() => setToast({ show:false, message:'', type:'info' }), 4000);
  };

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await diversionService.getPendingCmRequests(cmUserId);
      setRequests(res?.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching pending requests');
      setRequests([]);
    } finally { setLoading(false); }
  }, [cmUserId]);

  const fetchApprovedRequests = useCallback(async () => {
    setApprovedLoading(true);
    try {
      const res = await diversionService.getPendingCmApprovedRequests(cmUserId);
      setApprovedRequests(res?.data || []);
    } catch { setApprovedRequests([]); }
    finally { setApprovedLoading(false); }
  }, [cmUserId]);

  useEffect(() => { fetchPendingRequests(); fetchApprovedRequests(); }, [fetchPendingRequests, fetchApprovedRequests]);

  const handleOpenAction = (req, type) => {
    setSelectedRequest(req); setActionType(type); setRemarks(''); setIsActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (actionType === 'CM_RETURN_DIVERSION' && !remarks.trim()) {
      showToast('Remarks are required when returning a request.', 'error'); return;
    }
    setActionLoading(true);
    try {
      const payload = { diversionId: selectedRequest.diversionId || selectedRequest.id, actionRemarks: remarks, actionBy: 'CM_OFFICER', actionByRole: 'CONTROLLING_MANAGER' };
      if (actionType === 'CM_APPROVE_DIVERSION')   await diversionService.cmApprove(payload);
      else if (actionType === 'CM_SEND_TO_SBU_HEAD') await diversionService.cmSendToSbu(payload);
      else                                           await diversionService.cmReturn(payload);
      setIsActionModalOpen(false); setSelectedRequest(null);
      const labels = { CM_APPROVE_DIVERSION:'approved and forwarded', CM_SEND_TO_SBU_HEAD:'sent to SBU Head', CM_RETURN_DIVERSION:'returned to vendor' };
      showToast(`Request ${selectedRequest.diversionRequestNo} ${labels[actionType]}.`, actionType === 'CM_RETURN_DIVERSION' ? 'warning' : 'success');
      fetchPendingRequests(); fetchApprovedRequests();
    } catch (err) { showToast(`Action failed: ${err.message}`, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleViewHistory = async (req) => {
    setSelectedRequest(req); setIsHistoryModalOpen(true); setHistoryLoading(true);
    try {
      const res = await diversionService.getDiversionHistory(req.diversionId);
      setHistoryLogs(res.data || []);
    } catch { showToast('Failed to fetch history', 'error'); setHistoryLogs([]); }
    finally { setHistoryLoading(false); }
  };

  const filtered = useMemo(() => requests.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || [r.diversionRequestNo, r.vendorName, r.sourceIcNo, r.sourcePoNo, r.targetPoNo].some(v => v?.toLowerCase().includes(q));
    const matchStage = stageFilter === 'ALL' || r.diversionStage === stageFilter;
    return matchSearch && matchStage;
  }), [requests, searchTerm, stageFilter]);

  /* ── action config ── */
  const ACTION_CFG = {
    CM_APPROVE_DIVERSION:  { label:'Confirm Approve',       bg:'#10b981', desc:'approve and forward to SBU Head' },
    CM_SEND_TO_SBU_HEAD:   { label:'Send to SBU Head',      bg:'#8b5cf6', desc:'send to SBU Head for review'    },
    CM_RETURN_DIVERSION:   { label:'Confirm Return',        bg:'#ef4444', desc:'return to vendor for revision'  },
  };

  /* ── shared table renderer ── */
  const renderTable = (rows, showActions = true, isLoading = false) => {
    if (isLoading) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', padding:'60px 20px', color:'#94a3b8' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid #e2e8f0', borderTop:'3px solid #3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <span style={{ fontSize:'14px' }}>Loading requests…</span>
      </div>
    );
    if (!rows.length) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', padding:'60px 20px', color:'#94a3b8' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 10h8M8 14h5"/></svg>
        <span style={{ fontSize:'14px', fontWeight:'500' }}>No requests found</span>
        <span style={{ fontSize:'12px' }}>Records will appear here once available.</span>
      </div>
    );
    return (
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
              {['Request No.','Vendor','Stage','Source IC','Source PO','Target PO','Qty','Date','Rly Doc', showActions && 'Actions'].filter(Boolean).map(h => (
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i} style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'12px', fontWeight:'700', color:'#2563eb', cursor:'pointer', whiteSpace:'nowrap' }}
                  onClick={() => { setSelectedRequest(r); setIsDetailsModalOpen(true); }}>
                  {r.diversionRequestNo}
                </td>
                <td style={{ padding:'12px', color:'#0f172a', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                  title={r.vendorName}>{r.vendorName || r.vendorCode}</td>
                <td style={{ padding:'12px' }}><StagePill stage={r.diversionStage} /></td>
                <td style={{ padding:'12px', color:'#475569', fontFamily:'monospace', fontSize:'12px' }}>{r.sourceIcNo || '—'}</td>
                <td style={{ padding:'12px', color:'#475569', fontSize:'12px' }}>{r.sourcePoNo}/{r.sourcePoSrNo} <span style={{ color:'#94a3b8' }}>({r.sourceRailwayCode || '-'})</span></td>
                <td style={{ padding:'12px', color:'#047857', fontWeight:'600', fontSize:'12px' }}>{r.targetPoNo}/{r.targetPoSrNo} <span style={{ color:'#94a3b8' }}>({r.targetRailwayCode || '-'})</span></td>
                <td style={{ padding:'12px', fontWeight:'700', color:'#0f172a', textAlign:'right' }}>{r.totalDivertedQty != null ? Number(r.totalDivertedQty).toFixed(2) : '—'}</td>
                <td style={{ padding:'12px', color:'#64748b', whiteSpace:'nowrap', fontSize:'12px' }}>{formatDate(r.createdDate)}</td>
                <td style={{ padding:'12px' }}>
                  {r.railwayDocUrl
                    ? <a href={r.railwayDocUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'4px', color:'#2563eb', fontSize:'12px', fontWeight:'600', textDecoration:'none', padding:'3px 8px', background:'#dbeafe', borderRadius:'6px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        View
                      </a>
                    : <span style={{ color:'#cbd5e1', fontSize:'12px' }}>None</span>}
                </td>
                {showActions && (
                  <td style={{ padding:'12px' }}>
                    <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                      <ActionBtn color="#3b82f6" title="View Details" onClick={() => { setSelectedRequest(r); setIsDetailsModalOpen(true); }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </ActionBtn>
                      <ActionBtn color="#10b981" title="Approve" onClick={() => handleOpenAction(r, 'CM_APPROVE_DIVERSION')}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </ActionBtn>
                      <ActionBtn color="#8b5cf6" title="Send to SBU Head" onClick={() => handleOpenAction(r, 'CM_SEND_TO_SBU_HEAD')}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </ActionBtn>
                      <ActionBtn color="#f59e0b" title="Return to Vendor" onClick={() => handleOpenAction(r, 'CM_RETURN_DIVERSION')}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
                      </ActionBtn>
                      <ActionBtn color="#64748b" title="History" onClick={() => handleViewHistory(r)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </ActionBtn>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding:'24px', background:'#f8fafc', minHeight:'100%' }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>

      {/* Toast */}
      {toast.show && (
        <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:10000, padding:'14px 20px', borderRadius:'10px', color:'#fff', fontWeight:'600', fontSize:'14px', display:'flex', alignItems:'center', gap:'10px',
          background: toast.type==='success'?'#10b981': toast.type==='error'?'#ef4444': toast.type==='warning'?'#f59e0b':'#3b82f6',
          boxShadow:'0 10px 25px -5px rgba(0,0,0,0.2)', animation:'slideIn 0.25s ease' }}>
          {toast.type==='success'?'✓': toast.type==='error'?'✕': toast.type==='warning'?'⚠':'ℹ'} {toast.message}
        </div>
      )}

      {/* Page header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
        <div>
          <h2 style={{ margin:0, fontSize:'22px', fontWeight:'800', color:'#0f172a', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ width:'36px', height:'36px', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius:'10px', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            </span>
            Material Diversion Approvals
          </h2>
          <p style={{ margin:'4px 0 0 46px', fontSize:'13px', color:'#64748b' }}>Review, approve, forward to SBU Head, or return vendor diversion requests.</p>
        </div>
        <button onClick={() => { fetchPendingRequests(); fetchApprovedRequests(); }} disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'8px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', fontSize:'13px', fontWeight:'600', cursor:loading?'not-allowed':'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
        <StatCard label="Approval Pending" value={requests.length}        color="#f59e0b" bg="#fff" icon="⏳" />
        <StatCard label="Approved / Forwarded" value={approvedRequests.length} color="#10b981" bg="#fff" icon="✓" />
        <StatCard label="Total Requests"   value={requests.length + approvedRequests.length} color="#3b82f6" bg="#fff" icon="📋" />
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:'0', marginBottom:'0', background:'#fff', borderRadius:'12px 12px 0 0', border:'1px solid #e2e8f0', borderBottom:'none', overflow:'hidden' }}>
        {[['PENDING','Approval Pending', requests.length, '#f59e0b'],['APPROVED','Approved', approvedRequests.length, '#10b981']].map(([key, lbl, cnt, accent]) => (
          <button key={key} onClick={() => setActiveSubTab(key)}
            style={{ flex:1, padding:'13px 20px', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'700', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              borderBottom: activeSubTab===key ? `3px solid ${accent}` : '3px solid transparent',
              background: activeSubTab===key ? '#fff' : '#f8fafc',
              color: activeSubTab===key ? accent : '#94a3b8' }}>
            {lbl}
            {cnt > 0 && <span style={{ padding:'2px 8px', borderRadius:'12px', fontSize:'11px', background: activeSubTab===key ? accent+'22' : '#e2e8f0', color: activeSubTab===key ? accent : '#64748b', fontWeight:'700' }}>{cnt}</span>}
          </button>
        ))}
      </div>

      {/* Content card */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden' }}>
        {activeSubTab === 'PENDING' && (
          <>
            {/* Filter bar */}
            <div style={{ padding:'14px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:'1', minWidth:'220px' }}>
                <svg style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search by Request No, Vendor, IC, PO…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ width:'100%', padding:'8px 12px 8px 32px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
              </div>
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
                style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'13px', background:'#fff', outline:'none', color:'#475569' }}>
                <option value="ALL">All Stages</option>
                <option value="STAGE_I_RAW_MATERIAL">Stage I – Raw Material</option>
                <option value="STAGE_II_MANUFACTURING">Stage II – Manufacturing</option>
                <option value="STAGE_III_FINISHED">Stage III – Finished</option>
              </select>
              {(searchTerm || stageFilter !== 'ALL') && (
                <button onClick={() => { setSearchTerm(''); setStageFilter('ALL'); }}
                  style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid #fecaca', background:'#fff', color:'#ef4444', fontSize:'12px', cursor:'pointer', fontWeight:'600' }}>
                  Clear
                </button>
              )}
              <span style={{ fontSize:'12px', color:'#94a3b8', marginLeft:'auto' }}>Showing {filtered.length} of {requests.length}</span>
            </div>
            {error ? (
              <div style={{ padding:'40px', textAlign:'center', color:'#ef4444', fontSize:'14px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display:'block', margin:'0 auto 10px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            ) : renderTable(filtered, true, loading)}
          </>
        )}
        {activeSubTab === 'APPROVED' && renderTable(approvedRequests, false, approvedLoading)}
      </div>

      {/* ── Details Modal ── */}
      {isDetailsModalOpen && selectedRequest && (
        <Overlay onClose={() => setIsDetailsModalOpen(false)}>
          <ModalBox title={`Diversion Request — ${selectedRequest.diversionRequestNo}`} onClose={() => setIsDetailsModalOpen(false)} wide>
            {/* status strip */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
              <StatusPill status={selectedRequest.requestStatus} />
              <StagePill stage={selectedRequest.diversionStage} />
              <span style={{ marginLeft:'auto', fontSize:'12px', color:'#94a3b8' }}>Submitted: {formatDate(selectedRequest.createdDate)}</span>
            </div>
            <div style={{ padding:'20px', overflowY:'auto', maxHeight:'65vh' }}>
              {/* info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'16px', marginBottom:'20px', padding:'16px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0' }}>
                <InfoRow label="Vendor" value={`${selectedRequest.vendorName || ''} (${selectedRequest.vendorCode || ''})`} />
                <InfoRow label="Plant / RIO" value={selectedRequest.plantRioCode} />
                <InfoRow label="Diversion Type" value={selectedRequest.diversionType} />
                <InfoRow label="Source IC No." value={selectedRequest.sourceIcNo} />
                <InfoRow label="Source PO" value={`${selectedRequest.sourcePoNo}/${selectedRequest.sourcePoSrNo} (${selectedRequest.sourceRailwayCode || '-'})`} />
                <InfoRow label="Target PO" value={`${selectedRequest.targetPoNo}/${selectedRequest.targetPoSrNo} (${selectedRequest.targetRailwayCode || '-'})`} />
                <InfoRow label="Target Consignee" value={selectedRequest.targetConsigneeCode} />
                <InfoRow label="Total Diverted Qty" value={selectedRequest.totalDivertedQty} />
              </div>
              {/* line items */}
              {(selectedRequest.items || []).length > 0 && (
                <div style={{ marginBottom:'20px' }}>
                  <h4 style={{ fontSize:'13px', fontWeight:'700', color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'10px' }}>Line Items / Heat / Lot Allocation</h4>
                  <div style={{ overflowX:'auto', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                      <thead><tr style={{ background:'#f1f5f9' }}>
                        {['Sr','Heat No','Lot No','Available','Diverted','Balance','Target Sr No'].map(h => (
                          <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {selectedRequest.items.map((itm, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                            <td style={{ padding:'8px 10px' }}>{itm.sourcePoItemSrNo || i+1}</td>
                            <td style={{ padding:'8px 10px', fontFamily:'monospace' }}>{itm.heatNo || '—'}</td>
                            <td style={{ padding:'8px 10px', fontFamily:'monospace' }}>{itm.lotNo || '—'}</td>
                            <td style={{ padding:'8px 10px' }}>{itm.availableQty}</td>
                            <td style={{ padding:'8px 10px', fontWeight:'700', color:'#2563eb' }}>{itm.divertedQty}</td>
                            <td style={{ padding:'8px 10px' }}>{itm.balanceRetainedQty}</td>
                            <td style={{ padding:'8px 10px' }}>{itm.targetPoItemSrNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {selectedRequest.vendorRemarks && (
                <div style={{ padding:'12px 14px', background:'#fef9c3', borderRadius:'8px', border:'1px solid #fde68a', marginBottom:'16px', fontSize:'13px' }}>
                  <strong style={{ color:'#92400e' }}>Vendor Remarks:</strong> <span style={{ color:'#78350f' }}>{selectedRequest.vendorRemarks}</span>
                </div>
              )}
              {selectedRequest.railwayDocUrl && (
                <div style={{ padding:'12px 14px', background:'#eff6ff', borderRadius:'8px', border:'1px solid #bfdbfe', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'12px', color:'#1e40af', fontWeight:'600' }}>Railway Authorization NOC</div>
                    <a href={selectedRequest.railwayDocUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:'12px', color:'#2563eb' }}>Open Document ↗</a>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding:'14px 20px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'8px', background:'#f8fafc' }}>
              <ModalBtn color="#64748b" onClick={() => setIsDetailsModalOpen(false)}>Close</ModalBtn>
              <ModalBtn color="#f59e0b" onClick={() => { setIsDetailsModalOpen(false); handleOpenAction(selectedRequest,'CM_RETURN_DIVERSION'); }}>↩ Return</ModalBtn>
              <ModalBtn color="#8b5cf6" onClick={() => { setIsDetailsModalOpen(false); handleOpenAction(selectedRequest,'CM_SEND_TO_SBU_HEAD'); }}>→ SBU Head</ModalBtn>
              <ModalBtn color="#10b981" onClick={() => { setIsDetailsModalOpen(false); handleOpenAction(selectedRequest,'CM_APPROVE_DIVERSION'); }}>✓ Approve</ModalBtn>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* ── Action Confirmation Modal ── */}
      {isActionModalOpen && selectedRequest && (() => {
        const cfg = ACTION_CFG[actionType] || {};
        return (
          <Overlay onClose={() => setIsActionModalOpen(false)}>
            <ModalBox title={cfg.label || 'Confirm Action'} onClose={() => setIsActionModalOpen(false)}>
              <div style={{ padding:'20px' }}>
                <div style={{ padding:'14px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'16px', fontSize:'13px', color:'#475569' }}>
                  You are about to <strong>{cfg.desc}</strong> for request <strong style={{ color:'#1e40af' }}>{selectedRequest.diversionRequestNo}</strong>. This action cannot be undone.
                </div>
                <label style={{ fontWeight:'700', fontSize:'13px', color:'#374151', display:'block', marginBottom:'6px' }}>
                  Remarks {actionType === 'CM_RETURN_DIVERSION' ? <span style={{ color:'#ef4444' }}>*</span> : <span style={{ color:'#94a3b8', fontWeight:'400' }}>(optional)</span>}
                </label>
                <textarea rows="3" value={remarks} onChange={e => setRemarks(e.target.value)}
                  placeholder={actionType==='CM_RETURN_DIVERSION' ? 'State reason for returning to vendor…' : 'Add remarks…'}
                  style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'1.5px solid #e2e8f0', fontSize:'13px', resize:'vertical', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }} />
              </div>
              <div style={{ padding:'14px 20px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'8px', background:'#f8fafc' }}>
                <ModalBtn color="#64748b" onClick={() => setIsActionModalOpen(false)} disabled={actionLoading}>Cancel</ModalBtn>
                <button disabled={actionLoading}
                  style={{ padding:'9px 18px', borderRadius:'8px', border:'none', background:cfg.bg||'#3b82f6', color:'#fff', fontWeight:'700', fontSize:'13px', cursor:actionLoading?'not-allowed':'pointer', opacity:actionLoading?0.7:1, display:'flex', alignItems:'center', gap:'6px' }}
                  onClick={handleExecuteAction}>
                  {actionLoading
                    ? <><span style={{ width:'14px', height:'14px', border:'2px solid #ffffff44', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} /> Processing…</>
                    : cfg.label}
                </button>
              </div>
            </ModalBox>
          </Overlay>
        );
      })()}

      {/* ── History Modal ── */}
      {isHistoryModalOpen && selectedRequest && (
        <Overlay onClose={() => setIsHistoryModalOpen(false)}>
          <ModalBox title={`Audit Trail — ${selectedRequest.diversionRequestNo}`} onClose={() => setIsHistoryModalOpen(false)} wide>
            <div style={{ padding:'20px', maxHeight:'70vh', overflowY:'auto' }}>
              {historyLoading ? (
                <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>Loading audit logs…</div>
              ) : historyLogs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>No history records found.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                  {historyLogs.map((log, i) => (
                    <div key={i} style={{ display:'flex', gap:'14px', paddingBottom:'20px', position:'relative' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        {i < historyLogs.length-1 && <div style={{ width:'2px', flex:1, background:'#e2e8f0', marginTop:'4px' }} />}
                      </div>
                      <div style={{ flex:1, paddingTop:'4px', paddingBottom: i < historyLogs.length-1 ? '0' : '0' }}>
                        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap', marginBottom:'4px' }}>
                          <span style={{ fontSize:'12px', fontWeight:'700', padding:'2px 8px', borderRadius:'6px', background:'#f1f5f9', color:'#475569' }}>{log.actionType}</span>
                          <span style={{ fontSize:'11px', color:'#94a3b8' }}>{formatDate(log.actionTimestamp)}</span>
                        </div>
                        <div style={{ fontSize:'13px', color:'#374151' }}><strong>{log.actorUsername}</strong> <span style={{ color:'#64748b' }}>({log.actorRole})</span></div>
                        {log.fromStatus && <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>{log.fromStatus} → {log.toStatus}</div>}
                        {log.actionRemarks && <div style={{ marginTop:'6px', padding:'8px 10px', background:'#f8fafc', borderRadius:'6px', fontSize:'12px', color:'#475569', borderLeft:'3px solid #cbd5e1' }}>{log.actionRemarks}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', background:'#f8fafc' }}>
              <ModalBtn color="#64748b" onClick={() => setIsHistoryModalOpen(false)}>Close</ModalBtn>
            </div>
          </ModalBox>
        </Overlay>
      )}
    </div>
  );
};

/* ─── Micro UI components ──────────────────────────────────────── */
const Overlay = ({ children, onClose }) => (
  <div onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.45)', backdropFilter:'blur(4px)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
    {children}
  </div>
);

const ModalBox = ({ title, children, onClose, wide }) => (
  <div style={{ background:'#fff', borderRadius:'14px', boxShadow:'0 25px 60px -10px rgba(0,0,0,0.3)', width:'100%', maxWidth: wide?'780px':'480px', display:'flex', flexDirection:'column', overflow:'hidden', maxHeight:'90vh' }}>
    <div style={{ padding:'18px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <h3 style={{ margin:0, fontSize:'16px', fontWeight:'800', color:'#0f172a' }}>{title}</h3>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'4px', borderRadius:'6px', display:'flex' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    {children}
  </div>
);

const ModalBtn = ({ color, onClick, disabled, children }) => (
  <button disabled={disabled} onClick={onClick}
    style={{ padding:'8px 16px', borderRadius:'8px', border:'none', background:color, color:'#fff', fontWeight:'700', fontSize:'13px', cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.6:1 }}>
    {children}
  </button>
);

const ActionBtn = ({ color, title, onClick, children }) => (
  <button title={title} onClick={onClick}
    style={{ width:'28px', height:'28px', borderRadius:'7px', border:'none', background:color+'18', color, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}
    onMouseEnter={e => e.currentTarget.style.background=color+'33'}
    onMouseLeave={e => e.currentTarget.style.background=color+'18'}>
    {children}
  </button>
);

export default CMDiversionApprovalsTab;
