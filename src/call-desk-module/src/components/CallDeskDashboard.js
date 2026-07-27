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
import { generateCallLetterPDF } from '../utils/generateCallLetterPDF';
import { fetchCallLetterDetails } from '../services/callLetterApi';
import AnnexureLoader from '../../../components/annexures/AnnexureLoader';

const CallDeskDashboard = () => {
  const [pdfLoading, setPdfLoading] = useState(false);
  // Initialize tab from localStorage or default to 'pending'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('callDeskActiveTab') || 'pending';
  });

  // Initialize call type from localStorage or default to 'ERC'
  const [callType, setCallType] = useState(() => {
    return localStorage.getItem('callDeskType') || 'ERC';
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRerouteModal, setShowRerouteModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [selectedRIO, setSelectedRIO] = useState('');
  const [flaggedFields, setFlaggedFields] = useState([]);
  const [notification, setNotification] = useState(null);

  const showAppNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

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
  } = useCallDeskData(activeTab, callType);

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

  // Persist activeTab to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('callDeskActiveTab', activeTab);
  }, [activeTab]);

  // Persist callType to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('callDeskType', callType);
  }, [callType]);





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
      const data = await viewCallHistory(call.callNumber, callType); //  API CALL
      setHistoryData(data);
      console.log("history data", data);
    } catch (err) {
      showAppNotification(err.message || 'Failed to load history', 'error');
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
    const result = await verifyAndAccept(call.id, call, remarks, newIeId, callType);
    if (result.success) {
      showAppNotification('Call verified and registered successfully!', 'success');
      setShowDetailsModal(false);
      refreshData();
    } else {
      showAppNotification(result.message, 'error');
    }
  };

  const handleReturn = async (call, remarks) => {
    if (!remarks || !remarks.trim()) {
      showAppNotification('Remarks are mandatory for returning a call', 'error');
      return;
    }
    setSelectedCall(call);
    const result = await returnForRectification(call.id, call, remarks, [], callType);
    if (result.success) {
      showAppNotification('Call returned for rectification successfully!', 'success');
      setShowDetailsModal(false);
      refreshData();
    } else {
      showAppNotification(result.message, 'error');
    }
  };

  const handleReroute = async (call, remarks) => {
    // For now reroute might still need the RIO selection modal 
    setSelectedCall(call);
    setActionRemarks(remarks || '');
    setSelectedRIO('');
    setShowRerouteModal(true);
  };

  const handleDownloadLetter = async (call) => {
    if (!call?.callNumber) {
      showAppNotification('Call ID not found. Cannot generate PDF.', 'error');
      return;
    }
    setPdfLoading(true);
    try {
      // Fetch enriched details (PO Header, PO Item, type-specific fields)
      const details = await fetchCallLetterDetails(call.callNumber);
      // Merge backend details on top of existing call data;
      // backend values take priority for populated fields.
      const enrichedCall = { ...call, ...details };
      generateCallLetterPDF(enrichedCall);
    } catch (err) {
      console.error('Failed to generate Call Letter PDF:', err);
      showAppNotification('Failed to fetch call letter details. Please try again.', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  // Helper to format technical status/action strings to readable text
  const formatStatusText = (text) => {
    if (!text) return '-';
    return text
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Submit actions
  const submitVerify = async () => {
    if (!selectedCall) return;

    const result = await verifyAndAccept(selectedCall.id, selectedCall, actionRemarks, null, callType);
    if (result.success) {
      showAppNotification(`Call ${selectedCall.callNumber} verified and registered successfully!`);
      setShowVerifyModal(false);
      refreshData();
    } else {
      showAppNotification(result.message, 'error');
    }
  };

  const submitReturn = async () => {
    if (!selectedCall || !actionRemarks.trim()) {
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

    const result = await returnForRectification(selectedCall.id, selectedCall, finalRemarks, flaggedFields, callType);
    if (result.success) {
      showAppNotification(`Call ${selectedCall.callNumber} returned for rectification successfully!`);
      setShowReturnModal(false);
      refreshData();
    } else {
      showAppNotification(result.message, 'error');
    }
  };
  const submitReroute = async () => {
    if (!selectedCall || !selectedRIO || !actionRemarks.trim()) {
      showAppNotification('Target RIO and remarks are mandatory for re-routing', 'error');
      return;
    }

    const result = await rerouteToRIO(
      selectedCall.id,
      selectedCall,
      selectedRIO,
      actionRemarks,
      callType
    );

    if (result.success) {
      showAppNotification(`Call ${selectedCall.callNumber} re-routed to ${selectedRIO} successfully!`);
      setShowRerouteModal(false);
      refreshData();
    } else {
      showAppNotification(result.message, 'error');
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
      <AnnexureLoader
        title="Loading Call Desk"
        subtitle="Retrieving inspection calls pending verification..."
      />
    );
  }

  // Error state - only show full page error if we have NO data at all
  const isDataEmpty = pendingCalls.length === 0 && verifiedCalls.length === 0 && !dashboardKPIs;

  if (error && isDataEmpty) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <p className="error-message">❌ {error}</p>
          <button className="btn btn-primary" onClick={() => refreshData()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Tab Content
  return (
    <div className="dashboard-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-item">Call Desk Dashboard</span>
      </div>

      {/* Page Title & Toggle */}
      <div className="dashboard-header-row">
        <h1 className="page-title">Call Desk Dashboard</h1>

        <div className="call-type-switcher">
          <button
            className={`switcher-btn ${callType === 'ERC' ? 'active' : ''}`}
            onClick={() => setCallType('ERC')}
          >
            <span className="switcher-icon">🔩</span>
            ERC Calls
          </button>
          <button
            className={`switcher-btn ${callType === 'SLEEPER' ? 'active' : ''}`}
            onClick={() => setCallType('SLEEPER')}
          >
            <span className="switcher-icon">🛤️</span>
            Sleeper Calls
          </button>
          <button
            className={`switcher-btn ${callType === 'RAILPAD' ? 'active' : ''}`}
            onClick={() => setCallType('RAILPAD')}
          >
            <span className="switcher-icon">📦</span>
            Railpad Calls
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

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
          callType={callType}
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
                <div className="history-empty" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                  Loading history...
                </div>
              ) : historyData.length === 0 ? (
                <div className="history-empty" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  No history found for this call.
                </div>
              ) : (
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Action</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Performed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((row, index) => (
                        <tr key={index}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {row.createdDate ? formatDate(row.createdDate) : '-'}
                          </td>
                          <td>
                            <div className="history-action-text">
                              {formatStatusText(row.action)}
                            </div>
                          </td>
                          <td>
                            <span className="history-status-badge history-status-default">
                              {formatStatusText(row.status)}
                            </span>
                          </td>
                          <td>
                            {row.remarks && row.remarks !== 'null' ? (
                              <div className="history-remarks-box">
                                "{row.remarks}"
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td>
                            <div className="history-user-info">
                              <span className="history-user-name">
                                {row.createdBy || 'System'}
                              </span>
                              {row.modifiedBy && row.modifiedBy !== row.createdBy && (
                                <span className="history-user-label" title="Modified By">
                                  mod: {row.modifiedBy}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
        showNotification={showAppNotification}
        onRemap={refreshData}
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
      {/* PDF Generation Loading Overlay */}
      {pdfLoading && (
        <AnnexureLoader
          title="Generating Call Letter"
          subtitle="Fetching PO details from database..."
          fullScreen={true}
        />
      )}

      {/* Application Notifications */}
      {notification && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[3000] min-w-[320px] max-w-md animate-slideDown`}>
          <div className={`flex items-center gap-3 p-4 rounded-xl shadow-2xl border ${notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
            : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
              }`}>
              {notification.type === 'success' ? '✅' : '❌'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold tracking-tight">
                {notification.type === 'success' ? 'Task Completed' : 'Action Failed'}
              </p>
              <p className="text-xs opacity-90 leading-relaxed mt-0.5">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallDeskDashboard;

