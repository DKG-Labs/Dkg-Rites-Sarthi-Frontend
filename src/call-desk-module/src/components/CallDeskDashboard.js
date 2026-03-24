/**
 * Call Desk Dashboard Component
 * Main dashboard component with 3 tabs
 */

import React, { useState } from 'react';
import Tabs from '../../../components/Tabs';
import PendingVerificationTab from './PendingVerificationTab';
import VerifiedOpenCallsTab from './VerifiedOpenCallsTab';
import DisposedCallsTab from './DisposedCallsTab';
import CallDetailsModal from './CallDetailsModal';
import { RETURN_CALL_FLAGS } from '../utils/constants';
import useCallDeskData from '../hooks/useCallDeskData';
import useCallActions from '../hooks/useCallActions';
import { formatDate } from '../../../utils/helpers';
import '../styles/CallDeskDashboard.css';

const CallDeskDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRerouteModal, setShowRerouteModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [selectedRIO, setSelectedRIO] = useState('');
  const [flaggedFields, setFlaggedFields] = useState([]);

  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allIEs, setAllIEs] = useState([]);


  // Hooks
  const {
    pendingCalls,
    verifiedCalls,
    disposedCalls,
    dashboardKPIs,
    loading,
    error,
    refreshData
  } = useCallDeskData();

  const {
    verifyAndAccept,
    returnForRectification,
    rerouteToRIO,
    viewCallHistory,
    fetchAllIEs,
    loading: actionLoading
  } = useCallActions();

  // Load IEs on mount
  React.useEffect(() => {
    const loadIEs = async () => {
      const ies = await fetchAllIEs();
      setAllIEs(ies);
    };
    loadIEs();
  }, [fetchAllIEs]);





  // Tab configuration
  const tabs = [
    {
      id: 'pending',
      label: 'Pending Verification',
      count: dashboardKPIs?.pendingVerification?.total || 0
    },
    {
      id: 'verified',
      label: 'Verified & Open Calls',
      count: dashboardKPIs?.verifiedOpen?.total || 0
    },
    {
      id: 'disposed',
      label: 'Disposed Calls',
      count: dashboardKPIs?.disposed?.total || 0
    }
  ];

  // Action handlers
  const handleViewHistory = async (call) => {
    setSelectedCall(call);
    setShowHistoryModal(true);
    setHistoryLoading(true);

    try {
      const data = await viewCallHistory(call.callNumber); //  API CALL
      setHistoryData(data);
      console.log("history data", data);
    } catch (err) {
      alert(err.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };


  const handleViewDetails = (call) => {
    setSelectedCall(call);
    setShowDetailsModal(true);
  };

  const handleVerifyAccept = async (call, remarks, newIeId) => {
    setSelectedCall(call);
    const result = await verifyAndAccept(call.id, call, remarks, newIeId);
    if (result.success) {
      alert('Call verified and registered successfully!');
      setShowDetailsModal(false);
      refreshData();
    } else {
      alert(result.message);
    }
  };

  const handleReturn = async (call, remarks) => {
    if (!remarks || !remarks.trim()) {
      alert('Remarks are mandatory for returning a call');
      return;
    }
    setSelectedCall(call);
    const result = await returnForRectification(call.id, call, remarks);
    if (result.success) {
      alert('Call returned for rectification successfully!');
      setShowDetailsModal(false);
      refreshData();
    } else {
      alert(result.message);
    }
  };

  const handleReroute = async (call, remarks) => {
    // For now reroute might still need the RIO selection modal 
    setSelectedCall(call);
    setActionRemarks(remarks || '');
    setSelectedRIO('');
    setShowRerouteModal(true);
  };

  const handleDownloadLetter = (call) => {
    alert(`Downloading Inspection Call Letter for ${call.callNumber}...`);
    // Logic to trigger download
  };

  // Submit actions
  const submitVerify = async () => {
    if (!selectedCall) return;

    const result = await verifyAndAccept(selectedCall.id, selectedCall, actionRemarks);
    if (result.success) {
      alert('Call verified and registered successfully!');
      setShowVerifyModal(false);
      refreshData();
    } else {
      alert(result.message);
    }
  };

  const submitReturn = async () => {
    if (!selectedCall || !actionRemarks.trim()) {
      alert('Remarks are mandatory for returning a call');
      return;
    }

    // Format flags for remarks if any are selected
    let finalRemarks = actionRemarks;
    if (flaggedFields.length > 0) {
      const flagLabels = RETURN_CALL_FLAGS
        .filter(f => flaggedFields.includes(f.key))
        .map(f => f.label)
        .join(', ');
      finalRemarks = `Correction required in: ${flagLabels}.\nDetails: ${actionRemarks}`;
    }

    const result = await returnForRectification(selectedCall.id, selectedCall, finalRemarks, flaggedFields);
    if (result.success) {
      alert('Call returned for rectification successfully!');
      setShowReturnModal(false);
      refreshData();
    } else {
      alert(result.message);
    }
  };
  const submitReroute = async () => {
    if (!selectedCall || !selectedRIO || !actionRemarks.trim()) {
      alert('Target RIO and remarks are mandatory for re-routing');
      return;
    }

    const result = await rerouteToRIO(
      selectedCall.id,
      selectedCall,
      selectedRIO,
      actionRemarks
    );

    if (result.success) {
      alert(`Call re-routed to ${selectedRIO} successfully!`);
      setShowRerouteModal(false);
      refreshData();
    } else {
      alert(result.message);
    }
  };


  // Toggle flagged field
  const toggleFlaggedField = (field) => {
    setFlaggedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Call Desk Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <p className="error-message">❌ {error}</p>
          <button className="btn btn-primary" onClick={refreshData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-item">Call Desk Dashboard</span>
      </div>

      {/* Page Title */}
      <h1 className="page-title">Call Desk Dashboard</h1>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <PendingVerificationTab
          calls={pendingCalls}
          kpis={dashboardKPIs?.pendingVerification || {}}
          onVerifyAccept={handleVerifyAccept}
          onReturn={handleReturn}
          onReroute={handleReroute}
          onViewHistory={handleViewHistory}
          onViewDetails={handleViewDetails}
        />
      )}

      {activeTab === 'verified' && (
        <VerifiedOpenCallsTab
          calls={verifiedCalls}
          kpis={dashboardKPIs?.verifiedOpen || {}}
          onViewHistory={handleViewHistory}
        />
      )}

      {activeTab === 'disposed' && (
        <DisposedCallsTab
          calls={disposedCalls}
          kpis={dashboardKPIs?.disposed || {}}
          onViewHistory={handleViewHistory}
        />
      )}

      {/* Call History Modal */}
      {showHistoryModal && selectedCall && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Call History - {selectedCall.callNumber}</h2>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {historyLoading ? (
                <div className="history-empty">Loading history...</div>
              ) : historyData.length === 0 ? (
                <div className="history-empty">No history found</div>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Modified By</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historyData.map((row, index) => (
                      <tr key={index}>
                        {/* Action */}
                        <td className="action-cell">
                          {row.action || '-'}
                        </td>

                        {/* Status */}
                        <td>
                          {row.status || '-'}
                        </td>

                        {/* Created By */}
                        <td>
                          {row.createdBy ?? '-'}
                        </td>

                        {/* Modified By */}
                        <td>
                          {row.updatedBy ?? '-'}
                        </td>

                        {/* Date & Time */}
                        <td>
                          {row.createdDate
                            ? formatDate(row.createdDate)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              )}
            </div>



            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Details Modal */}
      <CallDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        call={selectedCall}
        allIEs={allIEs}
        onVerifyAccept={handleVerifyAccept}
        onReturn={handleReturn}
        onReroute={handleReroute}
        onWithdraw={refreshData}
        onDownloadLetter={handleDownloadLetter}
      />

      {/* Verify & Accept Modal */}
      {showVerifyModal && selectedCall && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify & Accept Call - {selectedCall.callNumber}</h2>
              <button className="modal-close" onClick={() => setShowVerifyModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Are you sure you want to verify and accept this call? The call will be registered and moved to the verified queue.
              </p>
              <div className="form-group">
                <label>Remarks (Optional):</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Enter any remarks or notes..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={submitVerify}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : '✅ Verify & Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return for Rectification Modal */}
      {showReturnModal && selectedCall && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Return for Rectification - {selectedCall.callNumber}</h2>
              <button className="modal-close" onClick={() => setShowReturnModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Remarks (Mandatory): <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Enter reason for returning the call..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Flag Fields for Correction:</label>
                <div className="checkbox-group">
                  {RETURN_CALL_FLAGS.map(field => (
                    <label key={field.key} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={flaggedFields.includes(field.key)}
                        onChange={() => toggleFlaggedField(field.key)}
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={submitReturn}
                disabled={actionLoading || !actionRemarks.trim()}
              >
                {actionLoading ? 'Processing...' : '↩️ Return for Rectification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-route to RIO Modal */}
      {showRerouteModal && selectedCall && (
        <div className="modal-overlay" onClick={() => setShowRerouteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Re-route to Another RIO - {selectedCall.callNumber}</h2>
              <button className="modal-close" onClick={() => setShowRerouteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Target RIO: <span className="text-danger">*</span></label>
                <select
                  className="form-control"
                  value={selectedRIO}
                  onChange={(e) => setSelectedRIO(e.target.value)}
                  required
                >
                  <option value="">Select RIO...</option>
                  {['NRIO', 'CRIO', 'WRIO', 'SRIO']
                    .filter(rio => rio !== selectedCall.rio)
                    .map(rio => (
                      <option key={rio} value={rio}>
                        {rio}
                      </option>
                    ))}
                </select>

              </div>
              <div className="form-group">
                <label>Remarks (Mandatory): <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Enter reason for re-routing..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRerouteModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submitReroute}
                disabled={actionLoading || !selectedRIO || !actionRemarks.trim()}
              >
                {actionLoading ? 'Processing...' : '🔀 Re-route Call'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallDeskDashboard;

