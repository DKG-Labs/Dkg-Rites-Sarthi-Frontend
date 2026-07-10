import React, { useState, useEffect } from 'react';

import Notification from '../../components/Notification';
import CreateDiscrepancyModal from './CreateDiscrepancyModal';
import ActionModal from './ActionModal';
import { processFeedbackApiService } from '../../services/processFeedbackApiService';

const ProcessIeFeedbackModule = () => {
  const [activeSubTab, setActiveSubTab] = useState('open'); // 'open' or 'closed'
  const [openDiscrepancies, setOpenDiscrepancies] = useState([]);
  const [closedDiscrepancies, setClosedDiscrepancies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [notification, setNotification] = useState({ message: '', type: 'error' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'view', 'edit', 'accept', 'resend', 'withdraw'

  const userId = localStorage.getItem('userId');
  const userRoleId = localStorage.getItem('roleId') || 7;

  const fetchDiscrepancies = async () => {
    setIsLoading(true);
    try {
      // RoleId 7 is usually Process IE in this context. Use actual from user or fallback to 7
      const roleId = userRoleId;
      const productType = localStorage.getItem('productType') || 'ERC';
      
      const [pendingRes, completedRes] = await Promise.all([
        processFeedbackApiService.fetchPendingDiscrepancies(roleId, productType),
        processFeedbackApiService.fetchCompletedDiscrepancies(productType)
      ]);

      if (pendingRes?.responseData) {
        const filteredOpen = pendingRes.responseData.filter(item => 
          item.createdBy === parseInt(userId, 10) || item.processIeUserId === parseInt(userId, 10)
        );
        setOpenDiscrepancies(filteredOpen);
      }
      
      if (completedRes?.responseData) {
        const filteredClosed = completedRes.responseData.filter(item => {
          const d = item.discrepancy || item;
          return d.createdBy === parseInt(userId, 10) || d.processIeUserId === parseInt(userId, 10);
        });
        setClosedDiscrepancies(filteredClosed.map(item => item.discrepancy || item));
      }
    } catch (error) {
      console.error("Error fetching discrepancies", error);
      showNotification("Failed to fetch discrepancies", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscrepancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleAction = (discrepancy, type) => {
    setSelectedDiscrepancy(discrepancy);
    setActionType(type);
    setShowActionModal(true);
  };

  const handleDownload = async (discrepancyNo) => {
    try {
      const response = await processFeedbackApiService.downloadDocument(discrepancyNo);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${discrepancyNo}_document`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading document", error);
      showNotification("Failed to download document or no document attached.", "error");
    }
  };

  const calculateAge = (dateOfRaising) => {
    if (!dateOfRaising) return 'N/A';
    const start = new Date(dateOfRaising);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} days`;
  };

  return (
    <div style={{ 
      marginTop: '20px', 
      background: '#ffffff', 
      borderRadius: '8px', 
      padding: '20px',
      border: '1px solid #e2e8f0'
    }}>
      <style>{`
        .feedback-module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .feedback-module-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        .premium-btn {
          background-color: #0d6efd;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .premium-btn:hover {
          background-color: #0b5ed7;
        }
        .premium-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #dee2e6;
        }
        .premium-tab {
          background: none;
          border: none;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #6c757d;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .premium-tab:hover {
          color: #495057;
        }
        .premium-tab.active {
          color: #0d6efd;
          border-bottom-color: #0d6efd;
        }
        .premium-table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
        }
        .premium-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .premium-table th {
          background-color: #f8f9fa;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 700;
          color: #495057;
          text-transform: uppercase;
          border-bottom: 1px solid #dee2e6;
        }
        .premium-table td {
          padding: 12px 16px;
          font-size: 13px;
          color: #212529;
          border-bottom: 1px solid #dee2e6;
          vertical-align: middle;
          background-color: #f8fbff; /* Match screenshot light blue tint */
        }
        .premium-table tbody tr:nth-child(even) td {
          background-color: #ffffff;
        }
        .premium-table tbody tr:hover td {
          background-color: #f1f5f9;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
          border: 1px solid transparent;
        }
        .status-warning {
          background-color: #fff3cd;
          color: #856404;
          border-color: #ffeeba;
        }
        .status-success {
          background-color: #d1e7dd;
          color: #0f5132;
          border-color: #badbcc;
        }
        .action-btn {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
          margin-right: 6px;
        }
        .btn-view {
          background-color: #0d6efd;
          color: white;
          border-color: #0d6efd;
        }
        .btn-view:hover {
          background-color: #0b5ed7;
        }
        .btn-edit {
          background-color: #6c757d;
          color: white;
          border-color: #6c757d;
        }
        .btn-edit:hover {
          background-color: #5c636a;
        }
        .btn-danger {
          background-color: #dc3545;
          color: white;
          border-color: #dc3545;
        }
        .btn-danger:hover {
          background-color: #c82333;
        }
        .btn-success {
          background-color: #198754;
          color: white;
          border-color: #198754;
        }
        .btn-success:hover {
          background-color: #157347;
        }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        autoClose={true}
        autoCloseDelay={5000}
        onClose={() => setNotification({ message: '', type: 'error' })}
      />

      <div className="feedback-module-header">
        <h3 className="feedback-module-title">Process Inspection Discrepancies</h3>
        <button className="premium-btn" onClick={() => setShowCreateModal(true)}>
          + Create Discrepancy
        </button>
      </div>

      <div className="premium-tabs">
        <button 
          className={`premium-tab ${activeSubTab === 'open' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('open')}
        >
          Open ({openDiscrepancies.length})
        </button>
        <button 
          className={`premium-tab ${activeSubTab === 'closed' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('closed')}
        >
          Closed ({closedDiscrepancies.length})
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', width: '24px', height: '24px', marginBottom: '8px' }}></div>
          <div>Loading discrepancies...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Discrepancy No</th>
                <th>Product</th>
                <th>PO Number</th>
                <th>Category</th>
                <th>Date Raised</th>
                <th>Age</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeSubTab === 'open' ? openDiscrepancies : closedDiscrepancies).map((item, idx) => {
                const d = item.feedbackMaster || item; 
                const dNo = item.feedbackId || d.discrepancyNo || 'N/A';
                const pType = item.productType || d.productType || 'N/A';
                const poNo = d.poNumber || 'N/A'; 
                const cat = d.category || 'N/A';
                const dateRaised = d.dateOfRaising || item.createdDate || 'N/A';
                const status = item.nextStatus || d.status || 'N/A';
                
                const badgeClass = status.includes('PENDING') ? 'status-warning' : 'status-success';

                return (
                  <tr key={idx}>
                    <td><span style={{ color: '#495057' }}>{dNo}</span></td>
                    <td>{pType}</td>
                    <td>{poNo}</td>
                    <td>{cat}</td>
                    <td>{dateRaised}</td>
                    <td><span style={{ color: '#495057' }}>{calculateAge(dateRaised)}</span></td>
                    <td><span className={`status-badge ${badgeClass}`}>{status.replace(/_/g, ' ')}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="action-btn btn-view" onClick={() => handleAction(item, 'view')}>View</button>
                      <button className="action-btn btn-view" onClick={() => handleDownload(dNo)} style={{ backgroundColor: '#17a2b8', borderColor: '#17a2b8' }}>Doc</button>
                      
                      {activeSubTab === 'open' && (
                        <>
                          {(status === 'PENDING_RECTIFICATION') && (
                            <>
                              <button className="action-btn btn-edit" onClick={() => handleAction(item, 'edit')}>Edit</button>
                              <button className="action-btn btn-danger" onClick={() => handleAction(item, 'withdraw')}>Withdraw</button>
                            </>
                          )}
                          {(status === 'SUBMIT_RECTIFICATION' || status === 'RESUBMIT_RECTIFICATION' || status === 'PENDING_IE_VERIFICATION') && (
                            <>
                              <button className="action-btn btn-success" onClick={() => handleAction(item, 'accept')}>Accept</button>
                              <button className="action-btn btn-edit" onClick={() => handleAction(item, 'resend')}>Resend</button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(activeSubTab === 'open' ? openDiscrepancies : closedDiscrepancies).length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                    No discrepancies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateDiscrepancyModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            showNotification("Discrepancy created successfully!", "success");
            fetchDiscrepancies();
          }}
          showNotification={showNotification}
          currentUserId={userId}
        />
      )}

      {showActionModal && (
        <ActionModal 
          discrepancy={selectedDiscrepancy}
          actionType={actionType}
          onClose={() => setShowActionModal(false)}
          onSuccess={() => {
            setShowActionModal(false);
            fetchDiscrepancies();
            showNotification(`Action ${actionType} completed successfully!`, "success");
          }}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

export default ProcessIeFeedbackModule;
