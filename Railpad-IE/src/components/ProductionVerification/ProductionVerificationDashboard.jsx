import React, { useState, useEffect, useMemo } from 'react';
import ProductionVerificationScreen from './ProductionVerificationScreen';
import Pagination from '../common/Pagination';
import '../../styles/ProductionVerification.css';
import { getBaseUrl, API_ENDPOINTS, getDefaultHeaders } from '../../services/apiConfig';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error in ProductionVerificationScreen:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px',
          background: '#fff5f5',
          border: '1px solid #fee2e2',
          borderRadius: '16px',
          color: '#991b1b',
          maxWidth: '800px',
          margin: '40px auto',
          boxShadow: '0 10px 15px -3px rgba(153, 27, 27, 0.05)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>
            Verification Screen Rendering Error
          </h2>
          <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '20px', lineHeight: '1.5' }}>
            React encountered a runtime error while rendering the verification details page. Please see the technical details below.
          </p>
          <pre style={{
            background: '#fef2f2',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #fca5a5',
            overflowX: 'auto',
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#991b1b',
            whiteSpace: 'pre-wrap'
          }}>
            {this.state.error && this.state.error.toString()}
            {"\n\n"}
            {this.state.error && this.state.error.stack}
          </pre>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


const ProductionVerificationDashboard = ({ activeCard, setActiveCard, currentShift, user }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingDeclarations, setPendingDeclarations] = useState([]);
  const [verifiedDeclarations, setVerifiedDeclarations] = useState([]);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchDeclarations = async () => {
    if (!user || !currentShift) return;
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'pending') {
        // --- PENDING TRANSITIONS LOGIC ---
        const transUrl = `${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.ALL_PENDING_TRANSITIONS}?roleName=Rail%20Process%20IE`;
        const transResponse = await fetch(transUrl, {
          headers: getDefaultHeaders(user.token)
        });
        const transData = await transResponse.json();

        if (transData.responseStatus?.statusCode === 0) {
          const transitions = transData.responseData || [];
          const filteredTrans = transitions.filter(t => {
            const isModuleMatch = Number(t.moduleId) === 3;
            const isPlantMatch = t.plantId?.trim() === currentShift.unit?.trim();
            const isUserMatch = t.accessibleUserIds?.includes(Number(user.userId));
            return isModuleMatch && isPlantMatch && isUserMatch;
          });

          const declarations = await Promise.all(filteredTrans.map(async (t) => {
            const declUrl = `${getBaseUrl()}${API_ENDPOINTS.PRODUCTION_DECLARATION.GET_BY_ID}/${t.requestId}`;
            const declResponse = await fetch(declUrl, { headers: getDefaultHeaders(user.token) });
            const declData = await declResponse.json();

            if (declData.responseStatus?.statusCode === 0) {
              const d = declData.responseData;
              return {
                id: d.id,
                vendorName: d.vendorName,
                date: d.productionDate,
                shift: d.shift,
                line: d.productionLine,
                status: t.status,
                submittedAt: t.createdDate,
                workflowTransitionId: t.workflowTransitionId,
                items: (d.products || []).map(p => ({
                  productType: p.productType,
                  drawingNo: p.drawingNo,
                  batches: (p.batches || []).map(b => ({
                    batchNo: b.batchNo,
                    compoundA: b.compABatch,
                    compoundB: b.compBBatch,
                    initialWeight: b.initialWt,
                    finalWeight: b.finalWt,
                    qtyProduced: b.quantity
                  }))
                }))
              };
            }
            return null;
          }));
          const finalPending = declarations.filter(d => d !== null);
          finalPending.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setPendingDeclarations(finalPending);
        }
      } else {
        // --- VERIFIED (COMPLETED) CALLS LOGIC ---
        const completedUrl = `${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.ALL_COMPLETED_CALLS}`;
        const completedResponse = await fetch(completedUrl, {
          headers: getDefaultHeaders(user.token)
        });
        const completedData = await completedResponse.json();

        if (completedData.responseStatus?.statusCode === 0) {
          const completed = completedData.responseData || [];

          // Filter for current role and plant
          const myCompleted = completed.filter(c =>
            c.currentRole === 'Rail Process IE' &&
            c.plantId?.trim() === currentShift.unit?.trim() &&
            Number(c.moduleId) === 3
          );

          const verifiedEntries = await Promise.all(myCompleted.map(async (c) => {
            try {
              // Fetch vendor declaration
              const declUrl = `${getBaseUrl()}${API_ENDPOINTS.PRODUCTION_DECLARATION.GET_BY_ID}/${c.requestId}`;
              const declResponse = await fetch(declUrl, { headers: getDefaultHeaders(user.token) });
              const declData = await declResponse.json();

              // Fetch IE verification record
              const verifyUrl = `${getBaseUrl()}${API_ENDPOINTS.IE_PRODUCTION_VERIFICATION.GET_BY_REQUEST_ID}/${c.requestId}`;
              const verifyResponse = await fetch(verifyUrl, { headers: getDefaultHeaders(user.token) });
              const verifyData = await verifyResponse.json();

              if (declData.responseStatus?.statusCode === 0) {
                const d = declData.responseData;
                const v = verifyData.responseStatus?.statusCode === 0 ? verifyData.responseData : null;

                return {
                  id: d.id,
                  vendorName: d.vendorName,
                  date: d.productionDate,
                  shift: d.shift,
                  line: d.productionLine,
                  status: 'Verified',
                  workflowTransitionId: c.workflowTransitionId,
                  verifiedAt: c.updatedDate || c.createdDate,
                  summary: v ? {
                    totalProduced: v.totalPiecesProduced,
                    totalRejected: v.totalPiecesRejected,
                    totalAccepted: v.totalAcceptedPieces
                  } : { totalProduced: 0, totalRejected: 0, totalAccepted: 0 },
                  rejections: v ? v.rejections : [],
                  items: (d.products || []).map(p => ({
                    productType: p.productType,
                    drawingNo: p.drawingNo,
                    batches: (p.batches || []).map(b => ({
                      batchNo: b.batchNo,
                      compoundA: b.compABatch,
                      compoundB: b.compBBatch,
                      initialWeight: b.initialWt,
                      finalWeight: b.finalWt,
                      qtyProduced: b.quantity
                    }))
                  }))
                };
              }
            } catch (err) {
              console.error('Error fetching details for completed call:', c.requestId, err);
            }
            return null;
          }));

          const finalVerified = verifiedEntries.filter(v => v !== null);
          finalVerified.sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());
          setVerifiedDeclarations(finalVerified);
        }
      }
    } catch (error) {
      console.error('Error fetching declarations:', error);
      setError('Unable to load data. Please check your connection or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeclarations();
  }, [currentShift, user, activeTab]);

  useEffect(() => {
    if (selectedDeclaration) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedDeclaration]);

  // Logic for 8-hour window
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh to check for expired modification windows
      setVerifiedDeclarations(prev => [...prev]);
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const isModifiable = (verifiedAt) => {
    const hours = (Date.now() - new Date(verifiedAt).getTime()) / (1000 * 60 * 60);
    return hours < 8;
  };

  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, fading: false });
    setTimeout(() => {
      setNotification(prev => prev ? { ...prev, fading: true } : null);
      setTimeout(() => setNotification(null), 400);
    }, 3000);
  };

  const handleVerify = async (declaration, rejectionData) => {
    setIsLoading(true);
    try {
      // 1. Save IE Verification Record
      const verifyPayload = {
        requestId: Number(declaration.id),
        moduleId: 3,
        castingDate: declaration.date,
        shift: declaration.shift,
        productionUnit: currentShift.unit,
        createdBy: Number(user.userId),
        totalPiecesProduced: rejectionData.summary.totalProduced,
        totalPiecesRejected: rejectionData.summary.totalRejected,
        totalAcceptedPieces: rejectionData.summary.totalAccepted,
        productionInfos: declaration.items.flatMap(item =>
          item.batches.map(b => ({
            productType: item.productType,
            drawingNo: item.drawingNo,
            batchNo: b.batchNo || (b.compoundA && b.compoundB ? `${b.compoundA} + ${b.compoundB}` : ''),
            initialWt: b.initialWeight,
            finalWt: b.finalWeight,
            quantityProduced: b.qtyProduced
          }))
        ),
          rejections: rejectionData.rejections.map(r => ({
            productType: r.productType,
            batchNo: r.batchNo,
            drawingNo: r.drawingNo || null,
            rejectedQty: Number(r.rejectedQty),
            reason: r.reason
          }))
      };

      const verifyResponse = await fetch(`${getBaseUrl()}${API_ENDPOINTS.IE_PRODUCTION_VERIFICATION.SAVE}`, {
        method: 'POST',
        headers: getDefaultHeaders(user.token),
        body: JSON.stringify(verifyPayload)
      });

      if (!verifyResponse.ok) throw new Error('Failed to save verification record');

      // 2. Perform Workflow Transition (only if not already verified)
      if (declaration.status !== 'Verified') {
        const transitionPayload = {
          requestId: String(declaration.id),
          moduleId: 3,
          workflowTransitionId: declaration.workflowTransitionId,
          action: 'VERIFY',
          actionBy: user.userId,
          remarks: 'Verified and Accepted',
          plantId: currentShift.unit,
          shift: declaration.shift
        };

        const transResponse = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.PERFORM_TRANSITION}`, {
          method: 'POST',
          headers: getDefaultHeaders(user.token),
          body: JSON.stringify(transitionPayload)
        });

        if (!transResponse.ok) throw new Error('Failed to perform workflow transition');
      }
      // Success UI update
      const verifiedEntry = {
        ...declaration,
        status: 'Verified',
        verifiedAt: new Date().toISOString(),
        rejections: rejectionData.rejections,
        summary: rejectionData.summary
      };

      setVerifiedDeclarations(prev => [verifiedEntry, ...prev]);
      setPendingDeclarations(prev => prev.filter(d => d.id !== declaration.id));
      setSelectedDeclaration(null);
      showNotification('Production successfully verified and accepted!');

      // Refresh the page after 2 seconds to ensure clean state as requested
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error during verification:', error);
      showNotification('Error: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async (declaration, remarks) => {
    setIsLoading(true);
    try {
      const transitionPayload = {
        requestId: String(declaration.id),
        moduleId: 3,
        workflowTransitionId: declaration.workflowTransitionId,
        action: 'RETURN_TO_VENDOR',
        actionBy: user.userId,
        remarks: remarks,
        plantId: currentShift.unit,
        shift: declaration.shift
      };

      const transResponse = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.PERFORM_TRANSITION}`, {
        method: 'POST',
        headers: getDefaultHeaders(user.token),
        body: JSON.stringify(transitionPayload)
      });

      if (!transResponse.ok) throw new Error('Failed to perform workflow transition');

      // 2. Delete Verification record if it was already verified
      if (declaration.status === 'Verified') {
        await fetch(`${getBaseUrl()}${API_ENDPOINTS.IE_PRODUCTION_VERIFICATION.DELETE}/${declaration.id}`, {
          method: 'DELETE',
          headers: getDefaultHeaders(user.token)
        });

        setVerifiedDeclarations(prev => prev.filter(d => d.id !== declaration.id));
      }

      setPendingDeclarations(prev => prev.filter(d => d.id !== declaration.id));
      setSelectedDeclaration(null);
      showNotification('Production successfully returned to vendor.');

      // Refresh the page after 2 seconds to ensure clean state as requested
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error during return:', error);
      showNotification('Error: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVerified = (declaration) => {
    if (!isModifiable(declaration.verifiedAt)) return;

    if (window.confirm('Are you sure you want to delete this verified entry? It will return to the pending list.')) {
      const pendingEntry = {
        ...declaration,
        status: 'Pending',
        verifiedAt: null,
        rejections: [],
        summary: null
      };

      setPendingDeclarations(prev => [pendingEntry, ...prev]);
      setVerifiedDeclarations(prev => prev.filter(d => d.id !== declaration.id));
      showNotification('Record reverted to pending list.');
    }
  };

  // ─── Pagination computations (must be above any early returns to follow Rules of Hooks) ───
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedPending = useMemo(() => {
    return pendingDeclarations.slice(startIndex, endIndex);
  }, [pendingDeclarations, startIndex, endIndex]);

  const paginatedVerified = useMemo(() => {
    return verifiedDeclarations.slice(startIndex, endIndex);
  }, [verifiedDeclarations, startIndex, endIndex]);

  const totalCount = activeTab === 'pending' ? pendingDeclarations.length : verifiedDeclarations.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (selectedDeclaration) {
    return (
      <>
        <ErrorBoundary onReset={() => setSelectedDeclaration(null)}>
          <ProductionVerificationScreen
            declaration={selectedDeclaration}
            isSubmitting={isLoading}
            onBack={() => setSelectedDeclaration(null)}
            onVerify={(rejectionData) => handleVerify(selectedDeclaration, rejectionData)}
            onReturn={(remarks) => handleReturn(selectedDeclaration, remarks)}
          />
        </ErrorBoundary>
        {notification && (
          <div className="pv-notification-container">
            <div className={`pv-notification ${notification.type} ${notification.fading ? 'fade-out' : ''}`}>
              <div className="pv-notification-icon">{notification.type === 'success' ? '✅' : '❌'}</div>
              <div className="pv-notification-content">
                <span className="pv-notification-title">{notification.type === 'success' ? 'Success' : 'Attention'}</span>
                <span className="pv-notification-message">{notification.message}</span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }



  return (
    <div className="pv-dashboard">
      <div className="pv-header">
        <div className="pv-header-info">
          <h2>Production Verification & Acceptance</h2>
          <p>Review vendor declarations and log process rejections</p>
        </div>
        <div className="pv-tabs">
          <button
            className={`pv-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Production Pending for Verification
            <span className="pv-badge">{pendingDeclarations.length}</span>
          </button>
          <button
            className={`pv-tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
            onClick={() => setActiveTab('verified')}
          >
            Verified Production
            <span className="pv-badge">{verifiedDeclarations.length}</span>
          </button>
        </div>
      </div>

      <div className="pv-content">
        {isLoading ? (
          <div className="pv-loading-container">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="pv-skeleton-row">
                <div className="pv-skeleton-item" style={{ width: '80%' }}></div>
                <div className="pv-skeleton-item" style={{ width: '60%' }}></div>
                <div className="pv-skeleton-item" style={{ width: '40%' }}></div>
                <div className="pv-skeleton-item" style={{ width: '90%' }}></div>
                <div className="pv-skeleton-item" style={{ width: '50%' }}></div>
                <div className="pv-skeleton-item" style={{ width: '70%' }}></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="pv-error-state">
            <div className="pv-empty-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="pv-action-btn verify" onClick={fetchDeclarations} style={{ marginTop: '16px' }}>Retry</button>
          </div>
        ) : activeTab === 'pending' ? (
          <div className="pv-list">
            {pendingDeclarations.length === 0 ? (
              <div className="pv-empty-state">
                <div className="pv-empty-icon">📂</div>
                <h3>No pending declarations</h3>
                <p>All vendor submissions have been verified.</p>
              </div>
            ) : (
              <>
                <table className="pv-table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Date / Shift</th>
                      <th>Production Line</th>
                      <th>Items</th>
                      <th>Submitted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPending.map(decl => (
                      <tr key={decl.id}>
                        <td>
                          <div className="pv-vendor-cell">
                            <span className="pv-vendor-name">
                              {decl.vendorName}
                              {decl.status === 'RESUBMITTED' && (
                                <span className="pv-resubmit-badge">Resubmitted</span>
                              )}
                            </span>
                            <span className="pv-decl-id">ID: {decl.id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="pv-date-cell">
                            <span className="pv-date">{decl.date}</span>
                            <span className="pv-shift-badge">Shift {decl.shift}</span>
                          </div>
                        </td>
                        <td>{decl.line}</td>
                        <td>
                          <div className="pv-items-preview">
                            {decl.items.map((item, idx) => (
                              <span key={idx} className="pv-item-tag">{item.productType}</span>
                            ))}
                          </div>
                        </td>
                        <td>{new Date(decl.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <button
                            className="pv-action-btn verify"
                            onClick={() => setSelectedDeclaration(decl)}
                          >
                            Verify Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={pendingDeclarations.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        ) : (
          <div className="pv-list">
            {verifiedDeclarations.length === 0 ? (
              <div className="pv-empty-state">
                <div className="pv-empty-icon">✅</div>
                <h3>No verified production yet</h3>
                <p>Completed verifications will appear here.</p>
              </div>
            ) : (
              <>
                <table className="pv-table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Date / Shift</th>
                      <th>Verified At</th>
                      <th>Accepted Qty</th>
                      <th>Rejected Qty</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVerified.map(decl => {
                      const modifiable = isModifiable(decl.verifiedAt);
                      return (
                        <tr key={decl.id}>
                          <td>
                            <div className="pv-vendor-cell">
                              <span className="pv-vendor-name">{decl.vendorName}</span>
                            </div>
                          </td>
                          <td>{decl.date} / {decl.shift}</td>
                          <td>{decl.verifiedAt ? new Date(decl.verifiedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                          <td className="pv-qty-accepted">{(decl.summary?.totalAccepted ?? 0).toLocaleString()}</td>
                          <td className="pv-qty-rejected">{(decl.summary?.totalRejected ?? 0).toLocaleString()}</td>
                          <td>
                            <span className="pv-status-locked">
                              {modifiable ? '🔓 Modifiable' : '🔒 Locked'}
                            </span>
                          </td>
                          <td>
                            <div className="pv-row-actions">
                              {modifiable && (
                                <button
                                  className="pv-icon-btn edit"
                                  onClick={() => setSelectedDeclaration({ ...decl, forceEdit: true })}
                                  title="Edit Rejections"
                                >
                                  ✏️
                                </button>
                              )}
                              <button
                                className="pv-icon-btn view"
                                onClick={() => setSelectedDeclaration(decl)}
                                title="View Details"
                              >
                                👁️
                              </button>
                              {modifiable ? (
                                <button
                                  className="pv-icon-btn delete"
                                  onClick={() => handleDeleteVerified(decl)}
                                  title="Delete & Return to Pending"
                                >
                                  🗑️
                                </button>
                              ) : (
                                <span className="pv-lock-icon" title="Permanently Locked">🔒</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={verifiedDeclarations.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        )}
      </div>

      {notification && (
        <div className="pv-notification-container">
          <div className={`pv-notification ${notification.type} ${notification.fading ? 'fade-out' : ''}`}>
            <div className="pv-notification-icon">{notification.type === 'success' ? '✅' : '❌'}</div>
            <div className="pv-notification-content">
              <span className="pv-notification-title">{notification.type === 'success' ? 'Success' : 'Attention'}</span>
              <span className="pv-notification-message">{notification.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionVerificationDashboard;
