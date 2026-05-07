import React, { useState, useEffect } from 'react';
import FinalInspectionScreen from './FinalInspectionScreen';
import './AttendingCallDashboard.css';
import { apiService } from '../../../services/api';
import { getStoredUser } from '../../../services/authService';

const AttendingCallDashboard = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedCall, setSelectedCall] = useState(null);
    const [isInspecting, setIsInspecting] = useState(false);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const [popupCall, setPopupCall] = useState(null);

    const [pendingCalls, setPendingCalls] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSchedulePopup, setShowSchedulePopup] = useState(false);
    const [selectedCallForSchedule, setSelectedCallForSchedule] = useState(null);

    const getModuleName = (id) => {
        const modules = {
            1: 'Plant Profile',
            2: 'Stress Bench Master',
            3: 'Raw Material Source',
            4: 'Mix Design',
            5: 'Production Declaration',
            6: 'Cement',
            7: 'Admixture',
            8: 'Aggregates',
            9: 'SGCI Insert',
            10: 'Dowel',
            11: 'Epoxy Treated'
        };
        return modules[id] || `Module ${id}`;
    };

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPendingCalls();
        } else if (activeTab === 'completed') {
            fetchCompletedCalls();
        }
    }, [activeTab]);

    const handleWorkflowAction = async (call, actionName) => {
        try {
            const user = getStoredUser();
            const payload = {
                workflowTransitionId: call.workflowTransitionId,
                moduleId: call.moduleId || 0,
                requestId: call.requestId,
                action: actionName,
                remarks: "Action performed from dashboard",
                actionBy: Number(user?.userId || 0)
            };
            
            const response = await apiService.performTransitionAction(payload);
            
            // Capture updated transition data from response
            let updatedCall = call;
            if (response && response.responseData) {
                updatedCall = {
                    ...call,
                    ...response.responseData,
                    id: response.responseData.workflowTransitionId // Maintain unique ID consistency
                };
            }
            
            handleInitiate(updatedCall);
            fetchPendingCalls(); // Refresh the list
        } catch (error) {
            console.error(`Error performing ${actionName}:`, error);
            // Fallback to current call if transition fail/redundant
            handleInitiate(call);
        }
    };

    const fetchPendingCalls = async () => {
        setIsLoading(true);
        try {
            const user = getStoredUser();
            const userId = user?.userId;
            const plantId = localStorage.getItem('plantId');
            
            // Using the API specified by the user
            const response = await apiService.getAllPendingWorkflowTransitions('Main IE', userId, plantId);
            
            if (response && response.responseData) {
                // Client-side filtering: prioritize plant filter if set
                const filtered = response.responseData.filter(item => {
                    const matchesPlant = !plantId || item.plantId === plantId;
                    return matchesPlant;
                });
                
                setPendingCalls(filtered.map(item => ({
                    ...item,
                    id: item.workflowTransitionId,
                    status: item.jobStatus || item.status || 'Pending', // Prioritize jobStatus for display
                    jobStatus: item.jobStatus,
                    checked: false
                })));
            }
        } catch (error) {
            console.error("Error fetching pending calls:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompletedCalls = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getCompletedFinalCalls();
            if (response && response.responseData) {
                setCompletedCalls(response.responseData.map(item => ({
                    ...item,
                    id: item.workflowTransitionId,
                    status: item.jobStatus || item.status || 'Completed',
                    checked: false
                })));
            }
        } catch (error) {
            console.error("Error fetching completed calls:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const [expandedActions, setExpandedActions] = useState({}); // Track which call has actions shown

    const [issuanceCalls, setIssuanceCalls] = useState([
        { id: 'CALL-003', vendor: 'Vendor C', po: 'PO-2024-03', productType: 'Final', qty: 450, accepted: 440, rejected: 10, callDate: '23/04/2026', status: 'ic_pending' },
    ]);

    const [completedCalls, setCompletedCalls] = useState([]);

    const toggleCheck = (id) => {
        setPendingCalls(prev => prev.map(call => 
            call.id === id ? { ...call, checked: !call.checked } : call
        ));
    };

    const toggleActions = (id) => {
        setExpandedActions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleInitiate = (call) => {
        setSelectedCall(call);
        setIsInspecting(true);
    };

    const handleViewDetails = (call) => {
        setPopupCall(call);
        setShowDetailsPopup(true);
    };

    if (isInspecting) {
        return <FinalInspectionScreen call={selectedCall} onBack={() => {
            setIsInspecting(false);
            fetchPendingCalls();
        }} />;
    }

    return (
        <div className="attending-call-container">
            <header className="dashboard-header">
                <h2>Attending the Call Raised</h2>
                <div className="dashboard-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        List of Calls Pending
                        <span className="badge">{pendingCalls.length}</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'issuance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('issuance')}
                    >
                        Issuance of IC
                        <span className="badge">{issuanceCalls.length}</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed Calls
                        <span className="badge">{completedCalls.length}</span>
                    </button>
                </div>
            </header>

            <div className="tab-content">
                {activeTab === 'pending' && (
                    <div className="table-container-modern">
                        <div className="table-search-header">
                            <input type="text" placeholder="Search..." className="search-input-modern" />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>TRANSITION ID</th>
                                        <th>REQUEST ID</th>
                                        <th>VENDOR CODE</th>
                                        <th>PLANT ID</th>
                                        <th>POI CODE</th>
                                        <th>CREATED DATE</th>
                                        <th>STATUS</th>
                                        {pendingCalls.some(c => expandedActions[c.id]) && <th>ACTIONS</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Loading pending calls...</td>
                                        </tr>
                                    ) : pendingCalls.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No pending calls found.</td>
                                        </tr>
                                    ) : (
                                        pendingCalls.map(call => (
                                            <tr key={call.id} className={call.checked ? 'row-selected' : ''}>
                                                <td className="checkbox-col">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={call.checked} 
                                                        onChange={() => toggleCheck(call.id)} 
                                                    />
                                                </td>
                                                <td>{call.workflowTransitionId}</td>
                                                <td>{call.requestId}</td>
                                                <td>{call.vendorCode || '-'}</td>
                                                <td>{call.plantId || '-'}</td>
                                                <td>{call.poiCode || '-'}</td>
                                                <td>{call.createdDate ? new Date(call.createdDate).toLocaleDateString() : '-'}</td>
                                                <td>
                                                    <button 
                                                        className={`status-action-pill ${call.status.toLowerCase().replace(' ', '-')}`}
                                                        onClick={() => toggleActions(call.id)}
                                                    >
                                                        {call.status}
                                                    </button>
                                                </td>
                                                {expandedActions[call.id] && (
                                                    <td>
                                                        <div className="table-actions-modern">
                                                            {/* RIO_VERIFIED -> SCHEDULE (only if not already scheduled) */}
                                                            {(call.jobStatus === 'RIO_VERIFIED' || !call.jobStatus) && !call.scheduleDate && (
                                                                <button 
                                                                    className="btn-start" 
                                                                    onClick={() => {
                                                                        setSelectedCallForSchedule(call);
                                                                        setShowSchedulePopup(true);
                                                                    }}
                                                                >
                                                                    SCHEDULE
                                                                </button>
                                                            )}

                                                            {/* SCHEDULED or already has a date -> START & RESCHEDULE */}
                                                            {(call.jobStatus === 'SCHEDULED' || call.jobStatus === 'scheduled' || !!call.scheduleDate) && (
                                                                <>
                                                                    <button 
                                                                        className="btn-start" 
                                                                        onClick={() => handleWorkflowAction(call, 'INITIATE_CALL')}
                                                                    >
                                                                        START
                                                                    </button>
                                                                    <button 
                                                                        className="btn-start" 
                                                                        style={{ background: '#f59e0b', marginLeft: '8px' }}
                                                                        onClick={() => {
                                                                            setSelectedCallForSchedule(call);
                                                                            setShowSchedulePopup(true);
                                                                        }}
                                                                    >
                                                                        RESCHEDULE
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* INITIATED -> OPEN PO DETAILS (Action: PO_VERIFICATION) */}
                                                            {(call.jobStatus === 'INITIATED' || call.jobStatus === 'initiated') && (
                                                                <button 
                                                                    className="btn-start" 
                                                                    onClick={() => handleWorkflowAction(call, 'PO_VERIFICATION')}
                                                                >
                                                                    OPEN PO DETAILS
                                                                </button>
                                                            )}

                                                            {/* PO_VERIFICATION -> OPEN INSPECTION DETAILS */}
                                                            {call.jobStatus === 'PO_VERIFICATION' && (
                                                                <button 
                                                                    className="btn-start" 
                                                                    onClick={() => handleInitiate(call)}
                                                                >
                                                                    OPEN INSPECTION DETAILS
                                                                </button>
                                                            )}

                                                            {/* pause -> RESUME */}
                                                            {(call.jobStatus === 'PAUSED' || call.jobStatus === 'pause') && (
                                                                <button 
                                                                    className="btn-start" 
                                                                    onClick={() => handleInitiate(call)}
                                                                >
                                                                    RESUME
                                                                </button>
                                                            )}
                                                            
                                                            {/* General Actions for non-matched states */}
                                                            {!['RIO_VERIFIED', 'SCHEDULED', 'scheduled', 'INITIATED', 'initiated', 'PO_VERIFICATION', 'PAUSED', 'pause'].includes(call.jobStatus) && call.jobStatus && (
                                                                <>
                                                                    <button className="btn-start" onClick={() => handleInitiate(call)}>
                                                                        {call.status === 'Under Inspection' ? 'RESUME' : 'START'}
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        

                    </div>
                )}

                {activeTab === 'issuance' && (
                    <div className="table-container-modern">
                        <div className="table-search-header">
                            <input type="text" placeholder="Search..." className="search-input-modern" />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>CALL NO.</th>
                                        <th>VENDOR NAME</th>
                                        <th>PO NO.</th>
                                        <th>QTY OFFERED</th>
                                        <th>PASSED</th>
                                        <th>REJECTED</th>
                                        <th>DATE</th>
                                        <th>STATUS</th>
                                        {issuanceCalls.some(c => expandedActions[c.id]) && <th>ACTIONS</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {issuanceCalls.map(call => (
                                        <tr key={call.id}>
                                            <td className="checkbox-col"><input type="checkbox" /></td>
                                            <td>{call.id}</td>
                                            <td>{call.vendor}</td>
                                            <td>{call.po}</td>
                                            <td>{call.qty}</td>
                                            <td className="text-success">{call.accepted}</td>
                                            <td className="text-danger">{call.rejected}</td>
                                            <td>{call.callDate}</td>
                                            <td>
                                                <button 
                                                    className={`status-action-pill ${call.status}`}
                                                    onClick={() => toggleActions(call.id)}
                                                >
                                                    {call.status}
                                                </button>
                                            </td>
                                            {expandedActions[call.id] && (
                                                <td>
                                                    <div className="table-actions-modern">
                                                        <button className="btn-reschedule">Download IC</button>
                                                        <button className="btn-start">Download Annexures</button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                )}

                {activeTab === 'completed' && (
                    <div className="table-container-modern">
                        <div className="table-search-header">
                            <input type="text" placeholder="Search..." className="search-input-modern" />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>TRANSITION ID</th>
                                        <th>REQUEST ID</th>
                                        <th>VENDOR CODE</th>
                                        <th>PLANT ID</th>
                                        <th>POI CODE</th>
                                        <th>CREATED DATE</th>
                                        <th>STATUS</th>
                                        {completedCalls.some(c => expandedActions[c.id]) && <th>ACTIONS</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Loading completed calls...</td>
                                        </tr>
                                    ) : completedCalls.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No completed calls found</td>
                                        </tr>
                                    ) : (
                                        completedCalls.map(call => (
                                            <React.Fragment key={call.id}>
                                                <tr>
                                                    <td className="checkbox-col"><input type="checkbox" checked={call.checked} onChange={() => {}} /></td>
                                                    <td>{call.workflowTransitionId}</td>
                                                    <td className="req-id-cell">{call.requestId}</td>
                                                    <td>{call.vendorCode}</td>
                                                    <td>{call.plantId}</td>
                                                    <td>{call.poiCode}</td>
                                                    <td>{call.createdDate ? new Date(call.createdDate).toLocaleDateString() : 'N/A'}</td>
                                                    <td>
                                                        <span 
                                                            className={`status-pill ${call.jobStatus?.toLowerCase() || 'pending'}`}
                                                            onClick={() => toggleActions(call.id)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            {call.jobStatus || call.status}
                                                        </span>
                                                    </td>
                                                    {expandedActions[call.id] && (
                                                        <td>
                                                            <div className="table-actions-modern">
                                                                <button className="btn-reschedule">Download IC</button>
                                                                <button className="btn-start" style={{ marginLeft: '8px' }}>Download Annexures</button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                )}
            </div>

            {showDetailsPopup && (
                <div className="modal-overlay" onClick={() => setShowDetailsPopup(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Inspection Details - {popupCall?.id}</h3>
                            <button className="modal-close-x" onClick={() => setShowDetailsPopup(false)}>×</button>
                        </div>
                        <div className="details-summary">
                            <div className="summary-item">
                                <label>PO Number</label>
                                <span>{popupCall?.po}</span>
                            </div>
                            <div className="summary-item">
                                <label>Sleeper Type</label>
                                <span>{popupCall?.sleeperType}</span>
                            </div>
                            <div className="summary-item">
                                <label>Total Offered</label>
                                <span>{popupCall?.qty}</span>
                            </div>
                            <div className="summary-item">
                                <label>Accepted</label>
                                <span className="text-success">{popupCall?.accepted}</span>
                            </div>
                            <div className="summary-item">
                                <label>Rejected</label>
                                <span className="text-danger">{popupCall?.rejected}</span>
                            </div>
                        </div>
                        <div className="modal-actions-horizontal">
                            {activeTab === 'issuance' ? (
                                <>
                                    <button className="issue-ic-btn">Issue IC</button>
                                    <button className="download-btn">Download Annexures</button>
                                </>
                            ) : (
                                <>
                                    <button className="download-btn">Download IC</button>
                                    <button className="download-btn">Download Annexures</button>
                                </>
                            )}
                        </div>
                        <button className="modal-footer-close" onClick={() => setShowDetailsPopup(false)}>Close</button>
                    </div>
                </div>
            )}
            {showSchedulePopup && (
                <RescheduleModal 
                    call={selectedCallForSchedule} 
                    onClose={() => setShowSchedulePopup(false)} 
                    onConfirm={async (data) => {
                        try {
                            const user = getStoredUser();
                            const isReschedule = selectedCallForSchedule.jobStatus === 'SCHEDULED' || 
                                                selectedCallForSchedule.jobStatus === 'scheduled' || 
                                                !!selectedCallForSchedule.scheduleDate;
                            
                            const payload = {
                                callNo: selectedCallForSchedule.requestId,
                                workflowTransitionId: selectedCallForSchedule.workflowTransitionId,
                                scheduleDate: data.newDate,
                                reason: data.reason,
                                plantId: selectedCallForSchedule.plantId,
                                vendorCode: selectedCallForSchedule.vendorCode,
                                shift: "A", // Default shift
                                createdBy: Number(user?.userId || 0),
                                ...(isReschedule ? { updatedBy: Number(user?.userId || 0) } : {})
                            };

                            const apiCall = isReschedule ? apiService.updateScheduleCall : apiService.scheduleCall;
                            const response = await apiCall(payload);
                            
                            if (response) {
                                alert(isReschedule ? "Call rescheduled successfully!" : "Call scheduled successfully!");
                                setShowSchedulePopup(false);
                                fetchPendingCalls(); // Refresh the list
                            }
                        } catch (error) {
                            console.error("Error scheduling call:", error);
                            alert(error.message || "Failed to schedule call. Please try again.");
                        }
                    }}
                />
            )}
        </div>
    );
};

const RescheduleModal = ({ call, onClose, onConfirm }) => {
    const [newDate, setNewDate] = useState('2026-02-19');
    const [reason, setReason] = useState('');

    return (
        <div className="modal-overlay">
            <div className="reschedule-modal">
                <div className="reschedule-header">
                    <h3>Reschedule Inspection</h3>
                    <button className="close-btn-blue" onClick={onClose}>×</button>
                </div>
                
                <div className="reschedule-info-card">
                    <div className="info-main">
                        <div className="req-id">{call.requestId || 'ER-02190008'}</div>
                        <div className="po-info">PO: {call.poNo || 'WCR / DummyPo_001 / 001'}</div>
                    </div>
                    <div className="desired-date-section">
                        <label>Desired Date</label>
                        <span className="date-val-orange">2026-02-19</span>
                    </div>
                </div>

                <div className="previous-details-card">
                    <h4>Previous Schedule Details</h4>
                    <div className="prev-grid">
                        <div className="prev-item">
                            <label>Scheduled Date:</label>
                            <span>19/02/2026</span>
                        </div>
                        <div className="prev-item">
                            <label>Previous Remark:</label>
                            <span>-</span>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="input-label">New Schedule Date <span className="req-star">for {call.requestId || 'ER-02190008'} *</span></label>
                    <div className="date-input-wrapper">
                        <input 
                            type="date" 
                            className="reschedule-date-input" 
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                    </div>
                    <p className="input-hint">Select new date for inspection <span className="min-hint">(Min: 2026-02-19)</span></p>
                </div>

                <div className="form-group">
                    <label className="input-label">Reason for Reschedule</label>
                    <textarea 
                        className="reschedule-textarea" 
                        placeholder="Enter reason for rescheduling..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    ></textarea>
                </div>

                <div className="reschedule-footer">
                    <button className="btn-cancel-grey" onClick={onClose}>Cancel</button>
                    <button className="btn-confirm-blue" onClick={() => onConfirm({ newDate, reason })}>Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default AttendingCallDashboard;
