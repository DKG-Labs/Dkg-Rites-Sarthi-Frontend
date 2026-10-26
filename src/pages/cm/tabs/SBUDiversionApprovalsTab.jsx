import React, { useState, useEffect, useCallback, useMemo } from 'react';
import diversionService from '../../../services/diversionService';
import { formatDate } from '../../../utils/helpers';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';

const SBUDiversionApprovalsTab = ({ rioId: propRioId }) => {
  const rioId = propRioId || localStorage.getItem('rioId') || localStorage.getItem('userId') || '';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'SBU_HEAD_APPROVE_DIVERSION' or 'SBU_HEAD_RETURN_DIVERSION'
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 4000);
  };

  const handleViewDoc = async (requestId) => {
    if (!requestId) return;
    try {
      const { API_BASE_URL, getAuthHeaders } = await import('../../../services/apiConfig');
      const res = await fetch(`${API_BASE_URL}/api/erc/diversion/doc-url/${requestId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      const docData = data?.responseData || data?.data || data;
      if (docData?.signedData) {
        const cleanBase64 = String(docData.signedData).replace(/^data:application\/pdf;base64,/, '').trim();
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const file = new Blob([byteArray], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, '_blank');
        return;
      }
      const url = docData?.viewUrl || docData?.railwayPermissionDocUrl;
      if (url) {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        window.open(fullUrl, '_blank');
      } else {
        showNotification('Document not available.', 'error');
      }
    } catch (e) {
      console.error('Error opening railway document:', e);
      showNotification('Unable to open document.', 'error');
    }
  };

  const handleViewIcCertificate = async (token) => {
    if (!token) {
      showNotification('Source IC Number is not available.', 'error');
      return;
    }
    try {
      const { API_BASE_URL, getAuthHeaders } = await import('../../../services/apiConfig');
      const res = await fetch(`${API_BASE_URL}/api/certificate-storage/view?icNumber=${encodeURIComponent(token)}`, {
        headers: getAuthHeaders()
      });
      const certData = await res.json();
      if (certData && certData.signedData) {
        const cleanBase64 = String(certData.signedData).replace(/^data:application\/pdf;base64,/, '').trim();
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const file = new Blob([byteArray], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, '_blank');
        return;
      }
      const targetUrl = certData?.url;
      if (targetUrl) {
        window.open(targetUrl, '_blank');
      } else {
        showNotification('Certificate document is not available in storage.', 'error');
      }
    } catch (e) {
      console.error('Error fetching IC Certificate:', e);
      showNotification('Could not retrieve certificate document from storage.', 'error');
    }
  };

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await diversionService.getPendingSbuRequests(rioId);
      if (response && response.data) {
        setRequests(response.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to fetch SBU pending diversion requests:', err);
      setError(err.message || 'Error fetching pending requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [rioId]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleOpenActionModal = (req, type) => {
    setSelectedRequest(req);
    setActionType(type);
    setRemarks('');
    setIsActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (actionType === 'SBU_HEAD_RETURN_DIVERSION' && !remarks.trim()) {
      showNotification('Remarks are strictly mandatory when returning a request.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        diversionId: selectedRequest.diversionId || selectedRequest.id,
        actionRemarks: remarks,
        actionBy: 'SBU_HEAD_OFFICER',
        actionByRole: 'SBU_HEAD'
      };

      if (actionType === 'SBU_HEAD_APPROVE_DIVERSION') {
        await diversionService.sbuApprove(payload);
        showNotification(`Request ${selectedRequest.diversionRequestNo} APPROVED! Basket created.`, 'success');
      } else {
        await diversionService.sbuReturn(payload);
        showNotification(`Request ${selectedRequest.diversionRequestNo} returned to Vendor.`, 'warning');
      }

      setIsActionModalOpen(false);
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (err) {
      console.error(`Failed to execute SBU action ${actionType}:`, err);
      showNotification(`Action failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewHistory = async (req) => {
    setSelectedRequest(req);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await diversionService.getDiversionHistory(req.diversionId);
      setHistoryLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      showNotification('Failed to fetch history logs', 'error');
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(item => {
      const reqNo = item.requestNo || item.diversionRequestNo || '';
      const vName = item.companyName || item.vendorName || '';
      const matchesSearch =
        !searchTerm ||
        reqNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceIcNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourcePoNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.targetPoNo?.toLowerCase().includes(searchTerm.toLowerCase());

      const st = item.stage || item.diversionStage || '';
      const matchesStage = stageFilter === 'ALL' || st === stageFilter ||
        (stageFilter === 'STAGE_I_RAW_MATERIAL' && st === 'RAW_MATERIAL') ||
        (stageFilter === 'STAGE_II_MANUFACTURING' && st === 'PROCESS') ||
        (stageFilter === 'STAGE_III_FINISHED' && st === 'FINAL');

      return matchesSearch && matchesStage;
    });
  }, [requests, searchTerm, stageFilter]);

  const columns = [
    {
      key: 'requestNo',
      label: 'Request No.',
      render: (val, row) => {
        const no = val || row.requestNo || row.diversionRequestNo || '-';
        return (
          <span style={{ fontWeight: '700', color: '#1e3a8a', cursor: 'pointer' }} onClick={() => { setSelectedRequest(row); setIsDetailsModalOpen(true); }}>
            {no}
          </span>
        );
      }
    },
    { key: 'companyName', label: 'Vendor Name', render: (val, row) => `${val || row.vendorName || row.vendorCode}` },
    {
      key: 'stage',
      label: 'Stage',
      render: (val, row) => {
        const st = val || row.stage || row.diversionStage;
        return (
          <span className={`badge ${st === 'RAW_MATERIAL' || st === 'STAGE_I_RAW_MATERIAL' ? 'bg-primary' : st === 'PROCESS' || st === 'STAGE_II_MANUFACTURING' ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
            {st ? String(st).replace('STAGE_', '').replace('_', ' ') : '-'}
          </span>
        );
      }
    },
    { key: 'sourceIcNo', label: 'Source IC No.' },
    {
      key: 'sourcePoNo',
      label: 'Source PO / Rly',
      render: (val, row) => `${row.sourcePoSrNo || val || row.sourcePoNo || '-'} (${row.sourceRailwayCode || '-'})`
    },
    {
      key: 'targetPoNo',
      label: 'Target PO / Rly',
      render: (val, row) => (
        <span style={{ fontWeight: '600', color: '#047857' }}>
          {row.targetPoSrNo || val || row.targetPoNo || '-'} ({row.targetRailwayCode || '-'})
        </span>
      )
    },
    {
      key: 'totalDiversionQty',
      label: 'Diverted Qty',
      render: (val, row) => {
        const qty = val != null ? val : row.totalDivertedQty;
        return <span style={{ fontWeight: '700' }}>{qty != null ? Number(qty).toFixed(2) : '0.00'}</span>;
      }
    },
    {
      key: 'cmRemarks',
      label: 'CM Remarks',
      render: (val) => <span style={{ fontStyle: 'italic', color: '#475569' }}>{val || '-'}</span>
    },
    {
      key: 'railwayPermissionDocUrl',
      label: 'Railway Approval',
      render: (_, row) => (row.railwayPermissionNo || row.railwayPermissionDocUrl || row.railwayDocUrl) ? (
        <button
          onClick={() => handleViewDoc(row.id || row.diversionId)}
          style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          📄 View Doc
        </button>
      ) : <span style={{ color: '#94a3b8' }}>None</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '240px',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-sm btn-info"
            onClick={() => { setSelectedRequest(row); setIsDetailsModalOpen(true); }}
            title="View Details"
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            🔍 Details
          </button>
          <button
            className="btn btn-sm btn-success"
            onClick={() => handleOpenActionModal(row, 'SBU_HEAD_APPROVE_DIVERSION')}
            title="Final Approve & Credit Basket"
            style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#059669', borderColor: '#059669', color: '#fff', fontWeight: '600' }}
          >
            ✓ Approve
          </button>
          <button
            className="btn btn-sm btn-warning"
            onClick={() => handleOpenActionModal(row, 'SBU_HEAD_RETURN_DIVERSION')}
            title="Return to Vendor"
            style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
          >
            ↩ Return
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handleViewHistory(row)}
            title="View Workflow History"
            style={{ fontSize: '12px', padding: '4px 6px' }}
          >
            📜
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="sbu-diversion-approvals" style={{ padding: '20px' }}>
      {/* Toast Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
          padding: '12px 24px', borderRadius: '8px', color: '#fff',
          backgroundColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#3b82f6',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            👑 SBU Head ERC Material Diversion & PO Sr. No. Authorization Queue
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Final approval of inter-railway/inter-PO material reallocation. Approving will automatically generate usable credit entries in the Diverted & Passed Material Basket.
          </p>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchPendingRequests} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <input
          type="text"
          placeholder="Search by Request No, Vendor, IC, PO..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
        >
          <option value="ALL">All Inspection Stages</option>
          <option value="STAGE_I_RAW_MATERIAL">Stage I - Raw Material</option>
          <option value="STAGE_II_MANUFACTURING">Stage II - Process / Mfg</option>
          <option value="STAGE_III_FINISHED">Stage III - Finished Product</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading pending SBU authorization requests...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#ef4444' }}>
          {error}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRequests}
          emptyMessage="No pending material diversion requests waiting for SBU Head authorization."
        />
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRequest && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Diversion SBU Authorization: ${selectedRequest.requestNo || selectedRequest.diversionRequestNo}`}
        >
          <div style={{ padding: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px', background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Vendor:</strong> {selectedRequest.companyName || selectedRequest.vendorName} ({selectedRequest.vendorCode})</div>
              <div><strong>Plant RIO:</strong> {selectedRequest.rioId || selectedRequest.plantRioCode}</div>
              <div><strong>Diversion Stage:</strong> {selectedRequest.stage || selectedRequest.diversionStage}</div>
              <div><strong>Diversion Type:</strong> {selectedRequest.diversionType}</div>
              <div><strong>Source IC No:</strong> {selectedRequest.sourceIcNo}</div>
              <div><strong>Source PO:</strong> {selectedRequest.sourcePoSrNo || selectedRequest.sourcePoNo} {selectedRequest.sourceRailwayCode ? `(${selectedRequest.sourceRailwayCode})` : ''}</div>
              <div><strong>Target PO:</strong> {selectedRequest.targetPoSrNo || selectedRequest.targetPoNo} {selectedRequest.targetRailwayCode ? `(${selectedRequest.targetRailwayCode})` : ''}</div>
              <div><strong>Target Consignee:</strong> {selectedRequest.targetConsigneeCode || '-'}</div>
              <div><strong>Total Diverted Qty:</strong> {selectedRequest.totalDiversionQty != null ? selectedRequest.totalDiversionQty : selectedRequest.totalDivertedQty}</div>
              <div><strong>CM Recommendation Remarks:</strong> {selectedRequest.cmRemarks || 'None'}</div>
            </div>

            {/* Certificate Generated By & View IC Certificate */}
            {(selectedRequest.sourceIeName || selectedRequest.sourceIcNo || selectedRequest.sourceCallNo) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', padding: '10px 16px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderRadius: '10px', border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(59,130,246,0.08)' }}>
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
                  onClick={() => handleViewIcCertificate(selectedRequest.sourceCallNo || selectedRequest.sourceIcNo)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', border: 'none', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(2,132,199,0.3)', flexShrink: 0 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  View IC Certificate
                </button>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Line Items Breakup for Basket Credit</h4>
              <table className="table table-bordered table-sm" style={{ fontSize: '12px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Sr No</th>
                    <th>Heat No</th>
                    <th>Lot No</th>
                    <th>Available Qty</th>
                    <th>Diverted Qty</th>
                    <th>Balance Retained</th>
                    <th>Target PO Sr No</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRequest.items || []).map((itm, idx) => (
                    <tr key={idx}>
                      <td>{itm.sourcePoItemSrNo || idx + 1}</td>
                      <td>{itm.heatNo || '-'}</td>
                      <td>{itm.lotNo || '-'}</td>
                      <td>{itm.availableQty}</td>
                      <td style={{ fontWeight: '700', color: '#059669' }}>{itm.divertedQty}</td>
                      <td>{itm.balanceRetainedQty}</td>
                      <td>{itm.targetPoItemSrNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(selectedRequest.railwayPermissionNo || selectedRequest.railwayPermissionDocUrl || selectedRequest.railwayDocUrl) && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Railway Authorization Document:</strong>{' '}
                <button
                  onClick={() => handleViewDoc(selectedRequest.id || selectedRequest.diversionId)}
                  style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  📄 Open Attached PDF
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
              <button className="btn btn-warning" onClick={() => { setIsDetailsModalOpen(false); handleOpenActionModal(selectedRequest, 'SBU_HEAD_RETURN_DIVERSION'); }}>
                ↩ Return
              </button>
              <button className="btn btn-success" onClick={() => { setIsDetailsModalOpen(false); handleOpenActionModal(selectedRequest, 'SBU_HEAD_APPROVE_DIVERSION'); }}>
                ✓ Approve & Credit Basket
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Action Confirmation Modal */}
      {isActionModalOpen && selectedRequest && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={actionType === 'SBU_HEAD_APPROVE_DIVERSION' ? 'Authorize & Credit Basket' : 'Return Request to Vendor'}
        >
          <div style={{ padding: '10px' }}>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>
              {actionType === 'SBU_HEAD_APPROVE_DIVERSION'
                ? `You are giving FINAL SBU AUTHORIZATION for Request ${selectedRequest.diversionRequestNo}. This will automatically credit the Diverted Passed Material Basket.`
                : `You are returning request ${selectedRequest.diversionRequestNo} to the vendor.`
              }
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                {actionType === 'SBU_HEAD_RETURN_DIVERSION' ? 'Return Remarks (Mandatory): *' : 'SBU Head Approval Remarks (Optional):'}
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder={actionType === 'SBU_HEAD_RETURN_DIVERSION' ? 'State reason for returning...' : 'Enter approval observations...'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setIsActionModalOpen(false)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className={`btn ${actionType === 'SBU_HEAD_APPROVE_DIVERSION' ? 'btn-success' : 'btn-warning'}`}
                onClick={handleExecuteAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (actionType === 'SBU_HEAD_APPROVE_DIVERSION' ? '✓ Confirm Approval' : '↩ Confirm Return')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Workflow History Modal */}
      {isHistoryModalOpen && selectedRequest && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Audit Trail: ${selectedRequest.diversionRequestNo}`}
        >
          <div style={{ padding: '10px' }}>
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading audit logs...</div>
            ) : historyLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No history records found.</div>
            ) : (
              <table className="table table-bordered table-sm" style={{ fontSize: '12px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>From Status</th>
                    <th>To Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(log.actionTimestamp)}</td>
                      <td><span className="badge bg-secondary">{log.actionType}</span></td>
                      <td>{log.actorUsername}</td>
                      <td>{log.actorRole}</td>
                      <td>{log.fromStatus}</td>
                      <td>{log.toStatus}</td>
                      <td>{log.actionRemarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SBUDiversionApprovalsTab;
