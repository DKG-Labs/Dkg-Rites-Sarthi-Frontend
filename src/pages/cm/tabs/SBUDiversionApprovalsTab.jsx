import React, { useState, useEffect, useCallback, useMemo } from 'react';
import diversionService from '../../../services/diversionService';
import { formatDate } from '../../../utils/helpers';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';

const SBUDiversionApprovalsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'APPROVE' or 'RETURN'
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

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await diversionService.getPendingSbuRequests();
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
  }, []);

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
    if (actionType === 'RETURN' && !remarks.trim()) {
      showNotification('Remarks are strictly mandatory when returning a request.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        diversionId: selectedRequest.diversionId,
        actionRemarks: remarks,
        actionBy: 'SBU_HEAD_OFFICER',
        actionByRole: 'SBU_HEAD'
      };

      if (actionType === 'APPROVE') {
        await diversionService.sbuApprove(payload);
        showNotification(`Request ${selectedRequest.diversionRequestNo} APPROVED! Virtual Basket has been successfully credited with ${selectedRequest.totalDivertedQty} units.`, 'success');
      } else {
        await diversionService.sbuReturn(payload);
        showNotification(`Request ${selectedRequest.diversionRequestNo} returned to CM with remarks.`, 'warning');
      }

      setIsActionModalOpen(false);
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (err) {
      console.error(`Failed to execute SBU ${actionType}:`, err);
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
      const matchesSearch =
        !searchTerm ||
        item.diversionRequestNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceIcNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourcePoNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.targetPoNo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStage = stageFilter === 'ALL' || item.diversionStage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [requests, searchTerm, stageFilter]);

  const columns = [
    {
      key: 'diversionRequestNo',
      label: 'Request No.',
      render: (val, row) => (
        <span style={{ fontWeight: '700', color: '#1e3a8a', cursor: 'pointer' }} onClick={() => { setSelectedRequest(row); setIsDetailsModalOpen(true); }}>
          {val}
        </span>
      )
    },
    { key: 'vendorName', label: 'Vendor Name', render: (val, row) => `${val || row.vendorCode}` },
    {
      key: 'diversionStage',
      label: 'Stage',
      render: (val) => (
        <span className={`badge ${val === 'STAGE_I_RAW_MATERIAL' ? 'bg-primary' : val === 'STAGE_II_MANUFACTURING' ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
          {val ? val.replace('STAGE_', '').replace('_', ' ') : '-'}
        </span>
      )
    },
    { key: 'sourceIcNo', label: 'Source IC No.' },
    {
      key: 'sourcePoNo',
      label: 'Source PO / Rly',
      render: (val, row) => `${val} (${row.sourceRailwayCode || '-'})`
    },
    {
      key: 'targetPoNo',
      label: 'Target PO / Rly',
      render: (val, row) => (
        <span style={{ fontWeight: '600', color: '#047857' }}>
          {val} ({row.targetRailwayCode || '-'})
        </span>
      )
    },
    {
      key: 'totalDivertedQty',
      label: 'Diverted Qty',
      render: (val) => <span style={{ fontWeight: '700' }}>{val != null ? Number(val).toFixed(2) : '0.00'}</span>
    },
    {
      key: 'cmRemarks',
      label: 'CM Remarks',
      render: (val) => <span style={{ fontStyle: 'italic', color: '#475569' }}>{val || '-'}</span>
    },
    {
      key: 'railwayDocUrl',
      label: 'Railway Approval',
      render: (val) => val ? (
        <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline' }}>
          📄 View Doc
        </a>
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
            onClick={() => handleOpenActionModal(row, 'APPROVE')}
            title="Final Approve & Credit Basket"
            style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#059669', borderColor: '#059669', color: '#fff', fontWeight: '600' }}
          >
            ✓ Approve
          </button>
          <button
            className="btn btn-sm btn-warning"
            onClick={() => handleOpenActionModal(row, 'RETURN')}
            title="Return to CM"
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
          title={`Diversion SBU Authorization: ${selectedRequest.diversionRequestNo}`}
        >
          <div style={{ padding: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px', background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Vendor:</strong> {selectedRequest.vendorName} ({selectedRequest.vendorCode})</div>
              <div><strong>Plant RIO:</strong> {selectedRequest.plantRioCode}</div>
              <div><strong>Diversion Stage:</strong> {selectedRequest.diversionStage}</div>
              <div><strong>Diversion Type:</strong> {selectedRequest.diversionType}</div>
              <div><strong>Source IC No:</strong> {selectedRequest.sourceIcNo}</div>
              <div><strong>Source PO:</strong> {selectedRequest.sourcePoNo} ({selectedRequest.sourceRailwayCode})</div>
              <div><strong>Target PO:</strong> {selectedRequest.targetPoNo} ({selectedRequest.targetRailwayCode})</div>
              <div><strong>Target Consignee:</strong> {selectedRequest.targetConsigneeCode || '-'}</div>
              <div><strong>Total Diverted Qty:</strong> {selectedRequest.totalDivertedQty}</div>
              <div><strong>CM Recommendation Remarks:</strong> {selectedRequest.cmRemarks || 'None'}</div>
            </div>

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

            {selectedRequest.railwayDocUrl && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Railway Authorization Document:</strong>{' '}
                <a href={selectedRequest.railwayDocUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: '600' }}>
                  📄 Open Attached PDF
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
              <button className="btn btn-warning" onClick={() => { setIsDetailsModalOpen(false); handleOpenActionModal(selectedRequest, 'RETURN'); }}>
                ↩ Return to CM
              </button>
              <button className="btn btn-success" onClick={() => { setIsDetailsModalOpen(false); handleOpenActionModal(selectedRequest, 'APPROVE'); }}>
                ✓ Final Approve & Credit Basket
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
          title={actionType === 'APPROVE' ? 'Authorize & Credit Basket' : 'Return Request to CM'}
        >
          <div style={{ padding: '10px' }}>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>
              {actionType === 'APPROVE'
                ? `You are giving FINAL SBU AUTHORIZATION for Request ${selectedRequest.diversionRequestNo}. This will automatically credit the Diverted Passed Material Basket for Target PO ${selectedRequest.targetPoNo}.`
                : `You are returning request ${selectedRequest.diversionRequestNo} back to the Controlling Manager.`
              }
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                {actionType === 'RETURN' ? 'Return Remarks (Strictly Mandatory): *' : 'SBU Head Approval Remarks (Optional):'}
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder={actionType === 'RETURN' ? 'Please state why this request is being returned to the CM...' : 'Enter approval observations...'}
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
                className={`btn ${actionType === 'APPROVE' ? 'btn-success' : 'btn-warning'}`}
                onClick={handleExecuteAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (actionType === 'APPROVE' ? 'Confirm Final Approval' : 'Confirm Return to CM')}
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
