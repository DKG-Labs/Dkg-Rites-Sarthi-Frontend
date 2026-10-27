import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import diversionService from '../../../services/diversionService';
import { formatDate } from '../../../utils/helpers';

/* ─── tiny helpers ─────────────────────────────────────────────── */
const STATUS_META = {
  DRAFT:                     { label: 'Draft',             bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  SUBMIT_DIVERSION_REQUEST:  { label: 'Submitted',         bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  PENDING_CM_APPROVAL:       { label: 'Pending CM',        bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  CM_APPROVE_DIVERSION:      { label: 'CM Approved',       bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  CM_RETURN_DIVERSION:       { label: 'Returned by CM',    bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  SENT_TO_SBU_HEAD:          { label: 'Sent to SBU',       bg: '#ede9fe', color: '#4c1d95', dot: '#8b5cf6' },
  PENDING_SBU_APPROVAL:      { label: 'Pending SBU',       bg: '#ede9fe', color: '#4c1d95', dot: '#8b5cf6' },
  SBU_HEAD_APPROVE_DIVERSION:{ label: 'SBU Approved',      bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  SBU_HEAD_RETURN_DIVERSION: { label: 'SBU Returned',      bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  RETURNED_TO_VENDOR:        { label: 'Returned to Vendor',bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
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
    RAW_MATERIAL:            { label: 'Raw Material',    bg:'#dbeafe', color:'#1e40af' },
    PROCESS:                 { label: 'Process',         bg:'#fef9c3', color:'#854d0e' },
    FINAL:                   { label: 'Final',           bg:'#dcfce7', color:'#166534' },
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
  const [actionsPopupRequest, setActionsPopupRequest] = useState(null);
  const [toast, setToast] = useState({ show:false, message:'', type:'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show:true, message, type });
    setTimeout(() => setToast({ show:false, message:'', type:'info' }), 4000);
  };

  // IE assignment state (shown before approve)
  const [isAssignIEModalOpen, setIsAssignIEModalOpen] = useState(false);
  const [ieList, setIeList]                           = useState([]);
  const [ieLoading, setIeLoading]                     = useState(false);
  const [selectedIeId, setSelectedIeId]               = useState('');

  const openDocUrl = async (requestId, cachedUrl) => {
    let url = cachedUrl;
    if (!url && requestId) {
      try {
        const { API_BASE_URL, getAuthHeaders } = await import('../../../services/apiConfig');
        const res = await fetch(`${API_BASE_URL}/api/erc/diversion/doc-url/${requestId}`, { headers: getAuthHeaders() });
        const data = await res.json();
        const docData = data?.responseData || data?.data || data;
        if (docData?.signedData) {
          url = `data:application/pdf;base64,${docData.signedData}`;
        } else {
          url = docData?.viewUrl || docData?.railwayPermissionDocUrl || '';
        }
      } catch { url = ''; }
    }
    if (!url) {
      setToast({ show: true, message: 'Document not available or could not be loaded.', type: 'error' });
      return;
    }
    if (url.startsWith('data:')) {
      const [meta, b64] = url.split(',');
      const mime = meta.match(/:(.*?);/)?.[1] || 'application/pdf';
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } else {
      const { API_BASE_URL } = await import('../../../services/apiConfig');
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      window.open(fullUrl, '_blank');
    }
  };

  const handleViewIcCertificate = async (token, stage) => {
    if (!token) {
      showToast('Source IC Number is not available.', 'error');
      return;
    }
    try {
      const { API_BASE_URL, getAuthHeaders } = await import('../../../services/apiConfig');
      let icToView = token;

      // 1. Fetch full IC Number from the new get-ic-number API (from IC edit table)
      try {
        const icRes = await fetch(
          `${API_BASE_URL}/api/erc/diversion/get-ic-number?callNo=${encodeURIComponent(token)}${stage ? `&stage=${encodeURIComponent(stage)}` : ''}`,
          { headers: getAuthHeaders() }
        );
        const icData = await icRes.json();
        const resolved = icData?.responseData?.icNumber || icData?.data?.icNumber || icData?.icNumber;
        if (resolved) {
          icToView = resolved;
        }
      } catch (err) {
        console.warn('Could not fetch IC Number from edit tables, falling back to call token:', err);
      }

      // 2. Fetch certificate using the resolved IC Number
      const res = await fetch(
        `${API_BASE_URL}/api/certificate-storage/view?icNumber=${encodeURIComponent(icToView)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP Error ${res.status}`);
      }
      const certData = await res.json();
      if (certData && certData.signedData) {
        const cleanBase64 = String(certData.signedData).replace(/^data:application\/pdf;base64,/, '').trim();
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new Blob([byteArray], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, '_blank');
        return;
      }
      const targetUrl = certData?.url;
      if (targetUrl) {
        const fullUrl = targetUrl.startsWith('http') ? targetUrl : `${API_BASE_URL}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
        window.open(fullUrl, '_blank');
      } else {
        showToast('Certificate document is not available in storage.', 'error');
      }
    } catch (e) {
      console.error('Error fetching IC Certificate:', e);
      showToast('Could not retrieve certificate document: ' + (e?.message || ''), 'error');
    }
  };

  const handleOpenApprove = async (req) => {
    setSelectedRequest(req);
    setSelectedIeId(req.sourceIeUserId || '');
    setIsAssignIEModalOpen(true);
    setIeLoading(true);
    try {
      // Process IE for PROCESS stage; regular IE for RAW_MATERIAL & FINAL
      const roleName = req.stage === 'PROCESS' ? 'Process IE' : 'IE';
      const { API_BASE_URL, getAuthHeaders } = await import('../../../services/apiConfig');
      const res = await fetch(
        `${API_BASE_URL}/api/auth/api/users/by-role?roleName=${encodeURIComponent(roleName)}`,
        { method: 'GET', headers: getAuthHeaders() }
      );
      const json = await res.json();
      const raw = json?.responseData || [];
      const expectedRole = req.stage === 'PROCESS' ? 'process ie' : 'ie';
      // normalise and filter to the correct role only
      const mapped = raw
        .filter(u => {
          const r = (u.roleName || u.role || '').toLowerCase();
          return expectedRole === 'ie' ? r === 'ie' : r.includes('process ie');
        })
        .map(u => ({
          userId: u.userId,
          fullName: u.fullName || u.userName,
          employeeCode: u.employeeCode,
          shortName: u.shortName,
          roleName: u.roleName || u.role,
        }));
      // If source IE isn't in the filtered list, prepend them so the pre-selection resolves
      if (req.sourceIeUserId && req.sourceIeName) {
        const alreadyIn = mapped.some(ie => String(ie.userId) === String(req.sourceIeUserId));
        if (!alreadyIn) {
          mapped.unshift({ userId: req.sourceIeUserId, fullName: req.sourceIeName, employeeCode: '', roleName: '' });
        }
      }
      setIeList(mapped);
    } catch {
      setIeList([]);
      showToast('Failed to load IE list', 'error');
    } finally {
      setIeLoading(false);
    }
  };

  const handleSubmitApprove = async () => {
    if (!selectedIeId) { showToast('Please select an IE to assign.', 'error'); return; }
    setActionLoading(true);
    try {
      const { API_BASE_URL, getAuthHeaders } = await import('../../../services/apiConfig');
      const res = await fetch(`${API_BASE_URL}/api/erc/diversion/cm/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          requestId: selectedRequest.id,
          remarks: '',
          userId: 'CM_OFFICER',
          role: 'CONTROLLING_MANAGER',
          assignedToUserId: Number(selectedIeId),
          assignUserId: Number(selectedIeId),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data?.responseStatus && data.responseStatus.statusCode !== 0 && data.responseStatus.statusCode !== 200)) {
        const errorMsg = data?.responseStatus?.message || data?.message || `Approval failed (HTTP ${res.status})`;
        throw new Error(errorMsg);
      }
      setIsAssignIEModalOpen(false);
      setIsDetailsModalOpen(false);
      showToast(`Request ${selectedRequest.requestNo} approved and IE assigned.`, 'success');
      fetchPendingRequests(); fetchApprovedRequests();
    } catch (err) {
      showToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await diversionService.getPendingCmRequests(cmUserId);
      setRequests(res?.responseData || res?.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching pending requests');
      setRequests([]);
    } finally { setLoading(false); }
  }, [cmUserId]);

  const fetchApprovedRequests = useCallback(async () => {
    setApprovedLoading(true);
    try {
      const res = await diversionService.getPendingCmApprovedRequests(cmUserId);
      setApprovedRequests(res?.responseData || res?.data || []);
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
      const payload = { diversionId: selectedRequest.id, actionRemarks: remarks, actionBy: 'CM_OFFICER', actionByRole: 'CONTROLLING_MANAGER' };
      if (actionType === 'CM_APPROVE_DIVERSION')   await diversionService.cmApprove(payload);
      else if (actionType === 'CM_SEND_TO_SBU_HEAD') await diversionService.cmSendToSbu(payload);
      else                                           await diversionService.cmReturn(payload);
      setIsActionModalOpen(false); setSelectedRequest(null);
      const labels = { CM_APPROVE_DIVERSION:'approved and forwarded', CM_SEND_TO_SBU_HEAD:'sent to SBU Head', CM_RETURN_DIVERSION:'returned to vendor' };
      showToast(`Request ${selectedRequest.requestNo} ${labels[actionType]}.`, actionType === 'CM_RETURN_DIVERSION' ? 'warning' : 'success');
      fetchPendingRequests(); fetchApprovedRequests();
    } catch (err) { showToast(`Action failed: ${err.message}`, 'error'); }
    finally { setActionLoading(false); }
  };

  // eslint-disable-next-line no-unused-vars
  const handleViewHistory = async (req) => {
    setSelectedRequest(req); setIsHistoryModalOpen(true); setHistoryLoading(true);
    try {
      const res = await diversionService.getDiversionHistory(req.id);
      setHistoryLogs(res.responseData || res.data || []);
    } catch { showToast('Failed to fetch history', 'error'); setHistoryLogs([]); }
    finally { setHistoryLoading(false); }
  };

  const filtered = useMemo(() => requests.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || [r.requestNo, r.companyName, r.vendorCode, r.sourceIcNo, r.sourcePoNo, r.targetPoNo].some(v => v?.toLowerCase().includes(q));
    const matchStage = stageFilter === 'ALL' || r.stage === stageFilter;
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
              {['Request No.','Vendor','Stage','Source IC','Source PO','Target PO','Qty','Date', showActions && 'Actions'].filter(Boolean).map(h => (
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
                  {r.requestNo}
                </td>
                <td style={{ padding:'12px', color:'#0f172a', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                  title={r.companyName}>{r.companyName || r.vendorCode}</td>
                <td style={{ padding:'12px' }}><StagePill stage={r.stage} /></td>
                <td style={{ padding:'12px', color:'#475569', fontFamily:'monospace', fontSize:'12px' }}>{r.sourceIcNo || '—'}</td>
                <td style={{ padding:'12px', color:'#475569', fontSize:'12px' }}>{r.sourcePoSrNo} <span style={{ color:'#94a3b8' }}>({r.rioId || '-'})</span></td>
                <td style={{ padding:'12px', color:'#047857', fontWeight:'600', fontSize:'12px' }}>{r.targetPoSrNo}</td>
                <td style={{ padding:'12px', fontWeight:'700', color:'#0f172a', textAlign:'right' }}>{r.totalDiversionQty != null ? Number(r.totalDiversionQty).toFixed(2) : '—'}</td>
                <td style={{ padding:'12px', color:'#64748b', whiteSpace:'nowrap', fontSize:'12px' }}>{formatDate(r.createdDate)}</td>
                {showActions && (
                  <td style={{ padding:'12px' }}>
                    <button onClick={() => { setSelectedRequest(r); setIsDetailsModalOpen(true); }}
                      style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px 14px', borderRadius:'8px', border:'1.5px solid #bfdbfe', background:'#eff6ff', color:'#2563eb', fontSize:'12px', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#dbeafe'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#eff6ff'; }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      View Detail
                    </button>
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
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="PROCESS">Process</option>
                <option value="FINAL">Final</option>
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

      {/* ── Assign IE Modal (shown before Approve) ── */}
      {isAssignIEModalOpen && selectedRequest && (
        <Overlay onClose={() => { setIsAssignIEModalOpen(false); setSelectedIeId(''); }}>
          <ModalBox title="Assign Inspection Engineer" onClose={() => { setIsAssignIEModalOpen(false); setSelectedIeId(''); }}>
            <div style={{ padding:'20px' }}>
              {/* request summary strip */}
              <div style={{ padding:'12px 14px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0', marginBottom:'20px' }}>
                <div style={{ fontSize:'12px', color:'#94a3b8', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>Diversion Request</div>
                <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:'13px', fontWeight:'800', color:'#1e40af' }}>{selectedRequest.requestNo}</span>
                  <StagePill stage={selectedRequest.stage} />
                  <span style={{ fontSize:'12px', color:'#64748b' }}>{selectedRequest.companyName} ({selectedRequest.vendorCode})</span>
                </div>
              </div>

              <label style={{ fontWeight:'700', fontSize:'13px', color:'#374151', display:'block', marginBottom:'8px' }}>
                Select {selectedRequest.stage === 'PROCESS' ? 'Process IE' : 'Inspection Engineer'} <span style={{ color:'#ef4444' }}>*</span>
              </label>

              {selectedRequest.sourceIeName && (
                <div style={{ marginBottom:'12px', padding:'9px 12px', background:'#eff6ff', borderRadius:'8px', border:'1px solid #bfdbfe', fontSize:'12.5px', color:'#1e40af', display:'flex', alignItems:'center', gap:'6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  Source IC certificate generated by: <strong style={{ marginLeft:'4px' }}>{selectedRequest.sourceIeName}</strong>
                  <span style={{ marginLeft:'4px', color:'#64748b' }}>(pre-selected below — change if needed)</span>
                </div>
              )}

              {ieLoading ? (
                <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px', background:'#f8fafc', borderRadius:'8px', color:'#94a3b8', fontSize:'13px' }}>
                  <div style={{ width:'16px', height:'16px', border:'2px solid #e2e8f0', borderTop:'2px solid #3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
                  Loading available IEs…
                </div>
              ) : ieList.length === 0 ? (
                <div style={{ padding:'14px', background:'#fef2f2', borderRadius:'8px', border:'1px solid #fecaca', color:'#991b1b', fontSize:'13px' }}>
                  No IEs available for this stage. Please check call desk mappings.
                </div>
              ) : (
                <IESearchDropdown
                  ieList={ieList}
                  selectedIeId={selectedIeId}
                  onChange={setSelectedIeId}
                />
              )}

              {selectedIeId && (
                <div style={{ marginTop:'10px', padding:'10px 12px', background:'#f0fdf4', borderRadius:'8px', border:'1px solid #bbf7d0', fontSize:'12px', color:'#166534', display:'flex', alignItems:'center', gap:'6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  IE selected — approving will assign this engineer to the diversion call.
                </div>
              )}
            </div>

            <div style={{ padding:'14px 20px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'8px', background:'#f8fafc' }}>
              <ModalBtn color="#64748b" onClick={() => { setIsAssignIEModalOpen(false); setSelectedIeId(''); }} disabled={actionLoading}>Cancel</ModalBtn>
              <button
                disabled={actionLoading || ieLoading || !selectedIeId}
                onClick={handleSubmitApprove}
                style={{ padding:'9px 20px', borderRadius:'8px', border:'none', background: selectedIeId ? '#10b981' : '#d1fae5', color:'#fff', fontWeight:'700', fontSize:'13px', cursor: (actionLoading || !selectedIeId) ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1, display:'flex', alignItems:'center', gap:'6px', transition:'background 0.15s' }}>
                {actionLoading
                  ? <><span style={{ width:'14px', height:'14px', border:'2px solid #ffffff44', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} /> Approving…</>
                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Approve & Assign IE</>}
              </button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* ── Actions Popup Modal ── */}
      {actionsPopupRequest && (
        <Overlay onClose={() => setActionsPopupRequest(null)}>
          <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 25px 60px -10px rgba(0,0,0,0.3)', width:'100%', maxWidth:'420px', overflow:'hidden' }}>
            {/* header */}
            <div style={{ padding:'18px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ margin:0, fontSize:'15px', fontWeight:'800', color:'#0f172a' }}>Actions</h3>
                <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#64748b' }}>{actionsPopupRequest.requestNo}</p>
              </div>
              <button onClick={() => setActionsPopupRequest(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'4px', borderRadius:'6px', display:'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* action buttons */}
            <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
              <PopupActionBtn
                color="#10b981" bg="#f0fdf4" border="#bbf7d0"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                label="Approve"
                desc="Approve and forward this diversion request"
                onClick={() => { const r = actionsPopupRequest; setActionsPopupRequest(null); handleOpenApprove(r); }}
              />
              <PopupActionBtn
                color="#8b5cf6" bg="#faf5ff" border="#e9d5ff"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
                label="Send to SBU Head"
                desc="Escalate this request to the SBU Head for review"
                onClick={() => { setActionsPopupRequest(null); handleOpenAction(actionsPopupRequest, 'CM_SEND_TO_SBU_HEAD'); }}
              />
              <PopupActionBtn
                color="#ef4444" bg="#fef2f2" border="#fecaca"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>}
                label="Return to Vendor"
                desc="Send back to vendor for revision with remarks"
                onClick={() => { setActionsPopupRequest(null); handleOpenAction(actionsPopupRequest, 'CM_RETURN_DIVERSION'); }}
              />
              <PopupActionBtn
                color="#3b82f6" bg="#eff6ff" border="#bfdbfe"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
                label="View Diversion Call Details"
                desc="View full details and line items for this request"
                onClick={() => { setActionsPopupRequest(null); setSelectedRequest(actionsPopupRequest); setIsDetailsModalOpen(true); }}
              />
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Details Modal ── */}
      {isDetailsModalOpen && selectedRequest && (
        <Overlay onClose={() => setIsDetailsModalOpen(false)}>
          <ModalBox title={`Diversion Request — ${selectedRequest.requestNo}`} onClose={() => setIsDetailsModalOpen(false)} wide>
            {/* status strip */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
              <StatusPill status={selectedRequest.status} />
              <StagePill stage={selectedRequest.stage} />
              <span style={{ marginLeft:'auto', fontSize:'12px', color:'#94a3b8' }}>Submitted: {formatDate(selectedRequest.createdDate)}</span>
            </div>
            <div style={{ padding:'20px', overflowY:'auto', maxHeight:'65vh' }}>
              {/* info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'16px', marginBottom:'20px', padding:'16px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0' }}>
                <InfoRow label="Vendor" value={`${selectedRequest.companyName || ''} (${selectedRequest.vendorCode || ''})`} />
                <InfoRow label="Plant / RIO" value={`${selectedRequest.plantName || ''} (${selectedRequest.rioId || ''})`} />
                <InfoRow label="Diversion Type" value={selectedRequest.diversionType} />
                <InfoRow label="Source IC No." value={selectedRequest.sourceIcNo} />
                <InfoRow label="Source PO" value={selectedRequest.sourcePoSrNo} />
                <InfoRow label="Target PO" value={selectedRequest.targetPoSrNo} />
                <InfoRow label="Railway Permission No." value={selectedRequest.railwayPermissionNo} />
                <InfoRow label="Total Diversion Qty" value={selectedRequest.totalDiversionQty} />
              </div>

              {/* Certificate Generated By & View IC Certificate */}
              {(selectedRequest.sourceIeName || selectedRequest.sourceIcNo || selectedRequest.sourceCallNo) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', padding: '10px 16px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderRadius: '10px', border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(59,130,246,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    {selectedRequest.sourceIeName ? (
                      <div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Certificate Generated By</div>
                        <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 700, marginTop: '1px' }}>{selectedRequest.sourceIeName}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>Source IC: {selectedRequest.sourceIcNo || selectedRequest.sourceCallNo}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewIcCertificate(selectedRequest.sourceIcNo || selectedRequest.sourceCallNo, selectedRequest.stage)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', border: 'none', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(2,132,199,0.3)', flexShrink: 0 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    View IC Certificate
                  </button>
                </div>
              )}

              {/* line items */}
              {(selectedRequest.items || []).length > 0 && (() => {
                const isRaw = selectedRequest.stage === 'RAW_MATERIAL';
                const isProcess = selectedRequest.stage === 'PROCESS';
                return (
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                      <h4 style={{ fontSize:'13px', fontWeight:'700', color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>
                        Line Items / {isRaw ? 'Heat & TC' : isProcess ? 'Lot' : 'Material'} Allocation
                      </h4>
                      <span style={{ padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'700',
                        background: isRaw ? '#dbeafe' : isProcess ? '#fef9c3' : '#dcfce7',
                        color: isRaw ? '#1e40af' : isProcess ? '#854d0e' : '#166534' }}>
                        {selectedRequest.diversionType}
                      </span>
                    </div>
                    <div style={{ overflowX:'auto', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                        <thead>
                          <tr style={{ background:'#f1f5f9' }}>
                            <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>Sr</th>
                            {isRaw && <>
                              <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>Heat No</th>
                              <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>TC No</th>
                            </>}
                            {isProcess && <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>Lot No</th>}
                            {!isRaw && !isProcess && <>
                              <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>Heat No</th>
                              <th style={{ padding:'8px 10px', textAlign:'left', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>Lot No</th>
                            </>}
                            <th style={{ padding:'8px 10px', textAlign:'right', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>Accepted Qty</th>
                            <th style={{ padding:'8px 10px', textAlign:'right', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>Available</th>
                            <th style={{ padding:'8px 10px', textAlign:'right', fontWeight:'700', color:'#2563eb', borderBottom:'1px solid #e2e8f0' }}>Diversion Qty</th>
                            <th style={{ padding:'8px 10px', textAlign:'right', fontWeight:'700', color:'#475569', borderBottom:'1px solid #e2e8f0' }}>Remaining</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRequest.items.map((itm, i) => (
                            <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                              <td style={{ padding:'8px 10px', color:'#64748b' }}>{i + 1}</td>
                              {isRaw && <>
                                <td style={{ padding:'8px 10px', fontFamily:'monospace', fontWeight:'600', color:'#0f172a' }}>{itm.heatNo || '—'}</td>
                                <td style={{ padding:'8px 10px', fontFamily:'monospace', color:'#475569' }}>{itm.tcNo || '—'}</td>
                              </>}
                              {isProcess && <td style={{ padding:'8px 10px', fontFamily:'monospace', fontWeight:'600', color:'#0f172a' }}>{itm.lotNo || '—'}</td>}
                              {!isRaw && !isProcess && <>
                                <td style={{ padding:'8px 10px', fontFamily:'monospace', color:'#475569' }}>{itm.heatNo || '—'}</td>
                                <td style={{ padding:'8px 10px', fontFamily:'monospace', color:'#475569' }}>{itm.lotNo || '—'}</td>
                              </>}
                              <td style={{ padding:'8px 10px', textAlign:'right', color:'#475569' }}>{itm.acceptedQty != null ? Number(itm.acceptedQty).toFixed(3) : '—'}</td>
                              <td style={{ padding:'8px 10px', textAlign:'right', color:'#475569' }}>{itm.availableBalanceQty != null ? Number(itm.availableBalanceQty).toFixed(3) : '—'}</td>
                              <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:'700', color:'#2563eb' }}>{itm.diversionQty != null ? Number(itm.diversionQty).toFixed(3) : '—'}</td>
                              <td style={{ padding:'8px 10px', textAlign:'right', color:'#64748b' }}>{itm.remainingBalanceQty != null ? Number(itm.remainingBalanceQty).toFixed(3) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
              {selectedRequest.reasonRemarks && (
                <div style={{ padding:'12px 14px', background:'#fef9c3', borderRadius:'8px', border:'1px solid #fde68a', marginBottom:'16px', fontSize:'13px' }}>
                  <strong style={{ color:'#92400e' }}>Reason Remarks:</strong> <span style={{ color:'#78350f' }}>{selectedRequest.reasonRemarks}</span>
                </div>
              )}
              {selectedRequest.railwayPermissionNo && (
                <div style={{ padding:'12px 14px', background:'#eff6ff', borderRadius:'8px', border:'1px solid #bfdbfe', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'12px', color:'#1e40af', fontWeight:'600' }}>Railway Authorization NOC</div>
                    <button onClick={() => openDocUrl(selectedRequest.id, null)} style={{ fontSize:'12px', color:'#2563eb', background:'none', border:'none', padding:0, cursor:'pointer', textDecoration:'underline' }}>Open Document ↗</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding:'14px 20px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'8px', background:'#f8fafc' }}>
              <ModalBtn color="#64748b" onClick={() => setIsDetailsModalOpen(false)}>Close</ModalBtn>
              {selectedRequest.status === 'PENDING_CM_APPROVAL' && (
                <>
                  <ModalBtn color="#f59e0b" onClick={() => { setIsDetailsModalOpen(false); handleOpenAction(selectedRequest,'CM_RETURN_DIVERSION'); }}>↩ Return</ModalBtn>
                  <ModalBtn color="#8b5cf6" onClick={() => { setIsDetailsModalOpen(false); handleOpenAction(selectedRequest,'CM_SEND_TO_SBU_HEAD'); }}>→ SBU Head</ModalBtn>
                  <ModalBtn color="#10b981" onClick={() => { setIsDetailsModalOpen(false); handleOpenApprove(selectedRequest); }}>✓ Approve</ModalBtn>
                </>
              )}
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
                  You are about to <strong>{cfg.desc}</strong> for request <strong style={{ color:'#1e40af' }}>{selectedRequest.requestNo}</strong>. This action cannot be undone.
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
          <ModalBox title={`Audit Trail — ${selectedRequest.requestNo}`} onClose={() => setIsHistoryModalOpen(false)} wide>
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

/* ─── Searchable IE Dropdown ───────────────────────────────────── */
const IESearchDropdown = ({ ieList, selectedIeId, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [panelRect, setPanelRect] = useState(null);
  const triggerRef = React.useRef(null);
  const panelRef = React.useRef(null);

  const selected = ieList.find(ie => String(ie.userId || ie.id) === String(selectedIeId));

  const filtered = ieList.filter(ie => {
    const name = (ie.fullName || ie.name || '').toLowerCase();
    const code = (ie.employeeCode || '').toLowerCase();
    const q = query.toLowerCase();
    return !q || name.includes(q) || code.includes(q);
  });

  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPanelRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setOpen(true);
  };

  // close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = (ie) => {
    onChange(String(ie.userId || ie.id));
    setQuery('');
    setOpen(false);
  };

  return (
    <div style={{ position:'relative' }}>
      {/* trigger */}
      <button ref={triggerRef} type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        style={{ width:'100%', padding:'10px 14px', borderRadius:'10px', border:`1.5px solid ${selectedIeId ? '#10b981' : '#e2e8f0'}`, background:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'border-color 0.15s', outline:'none' }}>
        {selected ? (
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'12px', fontWeight:'700', flexShrink:0 }}>
              {(selected.fullName || selected.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:'13px', fontWeight:'700', color:'#0f172a' }}>{selected.fullName || selected.name}</div>
              {selected.employeeCode && <div style={{ fontSize:'11px', color:'#64748b' }}>{selected.employeeCode}</div>}
            </div>
          </div>
        ) : (
          <span style={{ fontSize:'13px', color:'#94a3b8' }}>— Search and select IE —</span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s', flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* dropdown panel — rendered via fixed position to escape modal overflow:hidden */}
      {open && panelRect && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div ref={panelRef}
          style={{ position:'fixed', top: panelRect.top, left: panelRect.left, width: panelRect.width, background:'#fff', borderRadius:'12px', border:'1.5px solid #e2e8f0', boxShadow:'0 16px 40px -4px rgba(0,0,0,0.18)', zIndex:99999, overflow:'hidden' }}>
          {/* search */}
          <div style={{ padding:'10px', borderBottom:'1px solid #f1f5f9', position:'relative' }}>
            <svg style={{ position:'absolute', left:'20px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or employee code…"
              style={{ width:'100%', padding:'8px 10px 8px 32px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'13px', outline:'none', boxSizing:'border-box', background:'#f8fafc' }} />
          </div>
          {/* list */}
          <div style={{ maxHeight:'240px', overflowY:'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>No IEs match your search</div>
            ) : filtered.map(ie => {
              const id = String(ie.userId || ie.id);
              const isSelected = id === String(selectedIeId);
              const initials = (ie.fullName || ie.name || '?')[0].toUpperCase();
              return (
                <div key={id} onClick={() => select(ie)}
                  style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px', cursor:'pointer', background: isSelected ? '#eff6ff' : 'transparent', transition:'background 0.1s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='#f8fafc'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='transparent'; }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background: isSelected ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : '#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', color: isSelected ? '#fff' : '#475569', fontSize:'12px', fontWeight:'700', flexShrink:0 }}>
                    {initials}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px', fontWeight:'600', color: isSelected ? '#1e40af' : '#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {ie.fullName || ie.name}
                    </div>
                    {ie.employeeCode && <div style={{ fontSize:'11px', color:'#64748b' }}>{ie.employeeCode}</div>}
                  </div>
                  {isSelected && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              );
            })}
          </div>
          {filtered.length > 0 && (
            <div style={{ padding:'8px 14px', borderTop:'1px solid #f1f5f9', fontSize:'11px', color:'#94a3b8', textAlign:'right' }}>
              {filtered.length} of {ieList.length} IEs
            </div>
          )}
        </div>,
        document.body
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

const PopupActionBtn = ({ color, bg, border, icon, label, desc, onClick }) => (
  <button onClick={onClick}
    style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'12px', border:`1.5px solid ${border}`, background:bg, cursor:'pointer', textAlign:'left', width:'100%', transition:'filter 0.15s' }}
    onMouseEnter={e => e.currentTarget.style.filter='brightness(0.96)'}
    onMouseLeave={e => e.currentTarget.style.filter='brightness(1)'}>
    <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
    <div>
      <div style={{ fontSize:'13px', fontWeight:'700', color:'#0f172a' }}>{label}</div>
      <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>{desc}</div>
    </div>
    <svg style={{ marginLeft:'auto', color:'#cbd5e1', flexShrink:0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
  </button>
);

// eslint-disable-next-line no-unused-vars
const ActionBtn = ({ color, title, onClick, children }) => (
  <button title={title} onClick={onClick}
    style={{ width:'28px', height:'28px', borderRadius:'7px', border:'none', background:color+'18', color, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}
    onMouseEnter={e => e.currentTarget.style.background=color+'33'}
    onMouseLeave={e => e.currentTarget.style.background=color+'18'}>
    {children}
  </button>
);

export default CMDiversionApprovalsTab;
