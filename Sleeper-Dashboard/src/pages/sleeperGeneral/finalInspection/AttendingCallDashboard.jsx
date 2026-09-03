import React, { useState, useEffect } from 'react';
import FinalInspectionScreen from './FinalInspectionScreen';
import PendingCallDetailsModal from '../../../components/PendingCallDetailsModal';
import ResumeCallModal from '../../../components/ResumeCallModal';
import './AttendingCallDashboard.css';
import { apiService } from '../../../services/api';
import { getStoredUser } from '../../../services/authService';

const AttendingCallDashboard = () => {
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('attendingCallActiveTab') || 'pending';
    });

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        sessionStorage.setItem('attendingCallActiveTab', tab);
    };
    const [selectedCall, setSelectedCall] = useState(() => {
        const saved = sessionStorage.getItem('activeInspectionCall');
        try {
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });
    const [isInspecting, setIsInspecting] = useState(() => {
        return sessionStorage.getItem('isInspectingCall') === 'true';
    });
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const [popupCall, setPopupCall] = useState(null);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCallForView, setSelectedCallForView] = useState(null);
    const [selectedCallActions, setSelectedCallActions] = useState([]);

    const [showShiftModal, setShowShiftModal] = useState(false);
    const [selectedCallForShift, setSelectedCallForShift] = useState(null);
    const [isResumeShift, setIsResumeShift] = useState(true);

    const [pendingCalls, setPendingCalls] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
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

    const [issuanceCalls, setIssuanceCalls] = useState([]);
    const [completedCalls, setCompletedCalls] = useState([]);
    const [expandedActions, setExpandedActions] = useState({});

    const loadCalls = async () => {
        setIsLoading(true);
        try {
            const user = getStoredUser();
            const userId = user?.userId;
            const plantId = localStorage.getItem('plantId');

            const [pendingRes, completedRes] = await Promise.allSettled([
                apiService.getAllPendingWorkflowTransitions('Main IE', userId, plantId),
                apiService.getCompletedFinalCalls()
            ]);

            const pendingData = (pendingRes.status === 'fulfilled' && pendingRes.value?.responseData) ? pendingRes.value.responseData : [];
            const completedDataAll = (completedRes.status === 'fulfilled' && completedRes.value?.responseData) ? completedRes.value.responseData : [];

            const isNonPendingActionOrStatus = (c) => {
                const action = (c.action || '').toUpperCase();
                const status = (c.status || '').toUpperCase();
                const jobStatus = (c.jobStatus || '').toUpperCase();
                return (
                    action === 'FINISH' ||
                    action === 'COMPLETED' ||
                    action === 'IC_ISSUE' ||
                    action === 'ISSUE IC' ||
                    action === 'IC_GENERATION' ||
                    action === 'GENERATE_IC' ||
                    action === 'DSC_SIGN_IC' ||
                    action.includes('CANCEL') ||
                    action.includes('WITHDRAW') ||
                    jobStatus === 'COMPLETED' ||
                    jobStatus === 'FINISH' ||
                    jobStatus === 'IC_ISSUE' ||
                    jobStatus === 'ISSUE IC' ||
                    jobStatus === 'IC_GENERATION' ||
                    jobStatus === 'GENERATED' ||
                    jobStatus === 'IC_SIGNED' ||
                    jobStatus.includes('CANCEL') ||
                    jobStatus.includes('WITHDRAW') ||
                    status === 'COMPLETED' ||
                    status === 'IC_ISSUE' ||
                    status === 'IC_GENERATION' ||
                    status === 'GENERATED' ||
                    status === 'IC_SIGNED' ||
                    status.includes('CANCEL') ||
                    status.includes('WITHDRAW')
                );
            };

            // 1. List of Calls Pending: ONLY active pending inspection calls
            const pendingList = pendingData.filter(item => {
                const matchesPlant = !plantId || item.plantId === plantId;
                return matchesPlant && !isNonPendingActionOrStatus(item);
            }).map(item => {
                let displayStatus = item.jobStatus;
                if (!displayStatus || displayStatus === 'PENDING') {
                    if (item.scheduleDate || item.scheduledDate || item.action === 'MAIN_IE_SCHEDULE_CALL') {
                        displayStatus = 'SCHEDULED';
                    } else if (item.status === 'RIO_VERIFIED' || item.action === 'VERIFY') {
                        displayStatus = 'RIO_VERIFIED';
                    } else {
                        displayStatus = item.status || 'RIO_VERIFIED';
                    }
                }
                return {
                    ...item,
                    id: item.workflowTransitionId,
                    status: displayStatus,
                    jobStatus: displayStatus,
                    checked: false
                };
            });

            // 2. Issuance of IC & Completed Calls sources (from /allFInalCallCompletedCalls and completed transitions)
            const isSignedOrArchived = (c) => {
                const action = (c.action || '').toUpperCase();
                const status = (c.status || '').toUpperCase();
                const jobStatus = (c.jobStatus || '').toUpperCase();
                return (
                    action === 'GENERATE_IC' ||
                    action === 'IC_GENERATION' ||
                    action === 'DSC_SIGN_IC' ||
                    action === 'IC_SIGNED' ||
                    action.includes('CANCEL') ||
                    action.includes('WITHDRAW') ||
                    jobStatus === 'GENERATE_IC' ||
                    jobStatus === 'IC_GENERATION' ||
                    jobStatus === 'GENERATED' ||
                    jobStatus === 'DSC_SIGN_IC' ||
                    jobStatus === 'IC_SIGNED' ||
                    jobStatus.includes('CANCEL') ||
                    jobStatus.includes('WITHDRAW') ||
                    status === 'GENERATE_IC' ||
                    status === 'IC_GENERATION' ||
                    status === 'GENERATED' ||
                    status === 'DSC_SIGN_IC' ||
                    status === 'IC_SIGNED' ||
                    status.includes('CANCEL') ||
                    status.includes('WITHDRAW')
                );
            };

            const allCompletedSource = [...completedDataAll, ...pendingData.filter(isNonPendingActionOrStatus)];
            
            const uniqueCompletedMap = new Map();
            allCompletedSource.forEach(item => {
                const reqId = item.requestId || item.callNo;
                if (reqId) {
                    if (!uniqueCompletedMap.has(reqId) || (item.workflowTransitionId > uniqueCompletedMap.get(reqId).workflowTransitionId)) {
                        uniqueCompletedMap.set(reqId, item);
                    }
                }
            });
            const dedupedCompleted = Array.from(uniqueCompletedMap.values());

            // 2. Issuance of IC tab
            const certCalls = dedupedCompleted.filter(c => {
                const matchesPlant = !plantId || c.plantId === plantId;
                return matchesPlant && !isSignedOrArchived(c);
            }).map(item => ({
                ...item,
                id: item.workflowTransitionId,
                status: item.jobStatus || item.status || 'COMPLETED',
                jobStatus: item.jobStatus || item.status || 'COMPLETED',
                checked: false
            }));

            // 3. Completed Calls tab
            const finalCompletedCalls = dedupedCompleted.filter(c => {
                const matchesPlant = !plantId || c.plantId === plantId;
                return matchesPlant && isSignedOrArchived(c);
            }).map(item => {
                const action = (item.action || '').toUpperCase();
                const jobStatus = (item.jobStatus || '').toUpperCase();
                const status = (item.status || '').toUpperCase();
                let displayStatus = 'Completed - E-Signed';
                if (action.includes('CANCEL') || jobStatus.includes('CANCEL') || status.includes('CANCEL')) {
                    displayStatus = 'Cancelled';
                } else if (action.includes('WITHDRAW') || jobStatus.includes('WITHDRAW') || status.includes('WITHDRAW')) {
                    displayStatus = 'Withdrawn';
                }
                return {
                    ...item,
                    id: item.workflowTransitionId,
                    status: displayStatus,
                    jobStatus: 'COMPLETED',
                    checked: false
                };
            });

            setPendingCalls(pendingList);
            setIssuanceCalls(certCalls);
            setCompletedCalls(finalCompletedCalls);
        } catch (error) {
            console.error("Error loading calls:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingCalls = loadCalls;
    const fetchIssuanceCalls = loadCalls;
    const fetchCompletedCalls = loadCalls;

    useEffect(() => {
        loadCalls();
    }, [activeTab]); // Track which call has actions shown

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

    const handleWorkflowAction = async (call, actionName) => {
        try {
            const user = getStoredUser();
            const payload = {
                workflowTransitionId: call.workflowTransitionId || call.id,
                moduleId: call.moduleId || 0,
                requestId: call.requestId,
                action: actionName,
                remarks: "Action performed from dashboard",
                actionBy: Number(user?.userId || 0)
            };
            
            const response = await apiService.performTransitionAction(payload);
            
            let updatedCall = call;
            if (response && response.responseData) {
                updatedCall = {
                    ...call,
                    ...response.responseData,
                    id: response.responseData.workflowTransitionId
                };
            }
            
            handleInitiate(updatedCall);
            loadCalls();
        } catch (error) {
            console.error(`Error performing ${actionName}:`, error);
            handleInitiate(call);
        }
    };

    const handleShiftDetailsConfirm = async ({ shift, date, remarks }) => {
        try {
            const user = getStoredUser();
            const call = selectedCallForShift;
            if (!call) return;

            let updatedCall = {
                ...call,
                shift: shift,
                dateOfInspection: date,
                inspectionDate: date,
                date: date
            };

            if (!isResumeShift) {
                try {
                    const payload = {
                        workflowTransitionId: call.id || call.workflowTransitionId,
                        moduleId: call.moduleId || 0,
                        requestId: call.requestId || call.call_no || call.callNumber,
                        action: 'INITIATE_CALL',
                        remarks: remarks || "Initiated inspection with shift details",
                        actionBy: Number(user?.userId || 0)
                    };
                    const response = await apiService.performTransitionAction(payload);
                    if (response && response.responseData) {
                        updatedCall = {
                            ...updatedCall,
                            ...response.responseData,
                            shift: shift,
                            dateOfInspection: date,
                            inspectionDate: date,
                            date: date,
                            id: response.responseData.workflowTransitionId || updatedCall.id
                        };
                    }
                } catch (err) {
                    console.warn("Transition action warning (proceeding to inspection):", err);
                }
            }

            setShowShiftModal(false);
            setSelectedCallForShift(null);
            handleInitiate(updatedCall);
            loadCalls();
        } catch (error) {
            console.error("Error confirming shift details:", error);
            alert("Failed to proceed: " + error.message);
        }
    };

    const handleInitiate = (call) => {
        setSelectedCall(call);
        setIsInspecting(true);
        sessionStorage.setItem('activeInspectionCall', JSON.stringify(call));
        sessionStorage.setItem('isInspectingCall', 'true');
    };

    const handleOpenViewActions = (call) => {
        const availableActions = [];
        const jst = (call.jobStatus || call.status || '').toUpperCase();
        if (jst === 'RIO_VERIFIED') {
            availableActions.push('schedule');
        } else if (jst === 'SCHEDULED') {
            availableActions.push('reschedule');
            availableActions.push('start');
        } else if (jst === 'INITIATED' || jst === 'PO_VERIFICATION' || jst === 'RESUME') {
            availableActions.push('resume');
        } else if (jst === 'PAUSED') {
            availableActions.push('enterShiftDetails');
        }
        setSelectedCallForView(call);
        setSelectedCallActions(availableActions);
        setShowDetailsModal(true);
    };

    const handleIssueIC = async (call) => {
        try {
            const currentStatus = (call.jobStatus || call.status || call.action || '').toUpperCase();
            let updatedCall = call;
            
            // Only trigger performTransitionAction if status is not already IC_ISSUE
            if (currentStatus !== 'IC_ISSUE') {
                const user = getStoredUser();
                const payload = {
                    workflowTransitionId: call.id || call.workflowTransitionId,
                    moduleId: call.moduleId || 0,
                    requestId: call.requestId || call.callNo,
                    action: 'IC_ISSUE',
                    remarks: 'System updated status to IC_ISSUE',
                    actionBy: Number(user?.userId || 0)
                };
                
                try {
                    const res = await apiService.performTransitionAction(payload);
                    if (res && res.responseData) {
                        updatedCall = {
                            ...call,
                            ...res.responseData,
                            id: res.responseData.workflowTransitionId || call.id
                        };
                    }
                } catch (e) {
                    console.warn('Transition to IC_ISSUE warning:', e);
                }
            }

            localStorage.setItem('selectedICCall', JSON.stringify(updatedCall));
            const event = new CustomEvent('navigate', { detail: { target: 'Sleeper Final IC' } });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Error in handleIssueIC:', error);
            alert('Failed to open IC');
        }
    };

    const handleViewDetails = async (call) => {
        try {
            const summaryRes = await apiService.getInspectionCallSummary(call.requestId);
            if (summaryRes && summaryRes.responseData) {
                setPopupCall({
                    ...call,
                    po: summaryRes.responseData.poNo || call.requestId,
                    sleeperType: summaryRes.responseData.sleeperType || '-',
                    qty: summaryRes.responseData.qtyOfferedNow || 0,
                    accepted: summaryRes.responseData.totalAccepted || 0,
                    rejected: summaryRes.responseData.totalRejected || 0
                });
            } else {
                setPopupCall(call);
            }
        } catch (e) {
            console.error("Error fetching popup call details:", e);
            setPopupCall(call);
        }
        setShowDetailsPopup(true);
    };

    if (isInspecting && selectedCall) {
        return <FinalInspectionScreen call={selectedCall} onBack={() => {
            setIsInspecting(false);
            setSelectedCall(null);
            sessionStorage.removeItem('activeInspectionCall');
            sessionStorage.removeItem('isInspectingCall');
            loadCalls();
        }} />;
    }

    return (
        <div className="attending-call-container">
            <header className="dashboard-header">
                <h2>Attending the Call Raised</h2>
                <div className="dashboard-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => handleTabChange('pending')}
                    >
                        List of Calls Pending
                        <span className="badge">{pendingCalls.length}</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'issuance' ? 'active' : ''}`}
                        onClick={() => handleTabChange('issuance')}
                    >
                        Issuance of IC
                        <span className="badge">{issuanceCalls.length}</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => handleTabChange('completed')}
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
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="search-input-modern" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>CALL NO</th>
                                        <th>VENDOR NAME</th>
                                        <th>PLANT ID</th>
                                        <th>CREATED DATE</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading pending calls...</td>
                                        </tr>
                                    ) : pendingCalls.filter(c => {
                                        const q = (searchTerm || '').toLowerCase();
                                        return (c.requestId?.toLowerCase() || '').includes(q) ||
                                               (c.vendorName?.toLowerCase() || '').includes(q) ||
                                               (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                               (c.plantId?.toLowerCase() || '').includes(q);
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No pending calls found.</td>
                                        </tr>
                                    ) : (
                                        pendingCalls.filter(c => {
                                            const q = (searchTerm || '').toLowerCase();
                                            return (c.requestId?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorName?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                                   (c.plantId?.toLowerCase() || '').includes(q);
                                        }).map(call => (
                                            <tr key={call.id} className={call.checked ? 'row-selected' : ''}>
                                                <td className="checkbox-col">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={call.checked} 
                                                        onChange={() => toggleCheck(call.id)} 
                                                    />
                                                </td>
                                                <td style={{ fontWeight: '700', color: '#0f172a' }}>{call.requestId}</td>
                                                <td>{call.vendorName || call.vendorCode || '-'}</td>
                                                <td>{call.plantId || '-'}</td>
                                                <td>{call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : '-'}</td>
                                                <td>
                                                    <span 
                                                        className={`status-action-pill ${(call.jobStatus || call.status || '').toLowerCase().replace(/[\s_]+/g, '-')}`}
                                                        onClick={() => handleOpenViewActions(call)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {call.jobStatus || call.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions-modern">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenViewActions(call);
                                                            }}
                                                            style={{
                                                                padding: '6px 14px',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                background: '#2563eb',
                                                                color: '#ffffff',
                                                                fontSize: '11px',
                                                                fontWeight: '700',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            VIEW ACTIONS
                                                        </button>
                                                    </div>
                                                </td>
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
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="search-input-modern" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>CALL NO</th>
                                        <th>VENDOR NAME</th>
                                        <th>PLANT ID</th>
                                        <th>CREATED DATE</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading issuance calls...</td>
                                        </tr>
                                    ) : issuanceCalls.filter(c => {
                                        const q = (searchTerm || '').toLowerCase();
                                        return (c.requestId?.toLowerCase() || '').includes(q) ||
                                               (c.vendorName?.toLowerCase() || '').includes(q) ||
                                               (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                               (c.plantId?.toLowerCase() || '').includes(q);
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No calls for IC issuance found</td>
                                        </tr>
                                    ) : (
                                        issuanceCalls.filter(c => {
                                            const q = (searchTerm || '').toLowerCase();
                                            return (c.requestId?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorName?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                                   (c.plantId?.toLowerCase() || '').includes(q);
                                        }).map(call => (
                                            <tr key={call.id}>
                                                <td className="checkbox-col"><input type="checkbox" checked={call.checked} onChange={() => toggleCheck(call.id)} /></td>
                                                <td className="req-id-cell" style={{ fontWeight: '700', color: '#0f172a' }}>{call.requestId}</td>
                                                <td>{call.vendorName || call.vendorCode || '-'}</td>
                                                <td>{call.plantId || '-'}</td>
                                                <td>{call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                                                <td>
                                                    <span 
                                                        className={`status-pill ${call.jobStatus?.toLowerCase() || 'pending'}`}
                                                    >
                                                        {call.jobStatus || call.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions-modern">
                                                        <button className="btn-start" onClick={() => handleIssueIC(call)}>
                                                            {((call.jobStatus || call.status || '').toUpperCase() === 'IC_ISSUE') ? 'View IC' : 'IC Issue'}
                                                        </button>
                                                        <button className="btn-reschedule" style={{ marginLeft: '8px' }}>Download Annexures</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'completed' && (
                    <div className="table-container-modern">
                        <div className="table-search-header">
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="search-input-modern" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th className="checkbox-col"><input type="checkbox" /></th>
                                        <th>CALL NO.</th>
                                        <th>PO NO.</th>
                                        <th>IBS CASE NUMBER</th>
                                        <th>VENDOR NAME</th>
                                        <th>PRODUCT TYPE</th>
                                        <th>DATE</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Loading completed calls...</td>
                                        </tr>
                                    ) : completedCalls.filter(c => {
                                        const q = (searchTerm || '').toLowerCase();
                                        return (c.requestId?.toLowerCase() || '').includes(q) ||
                                               (c.vendorName?.toLowerCase() || '').includes(q) ||
                                               (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                               (c.plantId?.toLowerCase() || '').includes(q) ||
                                               (c.poNo?.toLowerCase() || '').includes(q);
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No completed calls found</td>
                                        </tr>
                                    ) : (
                                        completedCalls.filter(c => {
                                            const q = (searchTerm || '').toLowerCase();
                                            return (c.requestId?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorName?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                                   (c.plantId?.toLowerCase() || '').includes(q) ||
                                                   (c.poNo?.toLowerCase() || '').includes(q);
                                        }).map(call => (
                                            <tr key={call.id}>
                                                <td className="checkbox-col"><input type="checkbox" checked={call.checked} onChange={() => toggleCheck(call.id)} /></td>
                                                <td className="req-id-cell" style={{ fontWeight: '700', color: '#0f172a' }}>{call.requestId}</td>
                                                <td>{call.rlyPoSrNo || call.poNo || '-'}</td>
                                                <td>{call.caseNo || call.ibsCaseNo || '-'}</td>
                                                <td>{call.vendorName || call.vendorCode || '-'}</td>
                                                <td>{call.productType || 'Sleeper'}</td>
                                                <td>{call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                                                <td>
                                                    <span className="status-pill completed">Completed - E-Signed</span>
                                                </td>
                                                <td>
                                                    <div className="table-actions-modern">
                                                        <button className="btn-reschedule">Download IC</button>
                                                        <button className="btn-start" style={{ marginLeft: '8px' }}>Download Annexures</button>
                                                    </div>
                                                </td>
                                            </tr>
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
                                    <button className="issue-ic-btn" onClick={() => handleIssueIC(popupCall)}>
                                        {(popupCall?.jobStatus === 'IC_ISSUE' || popupCall?.status === 'IC_ISSUE') ? 'View IC' : 'Issue IC'}
                                    </button>
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
                            const isReschedule = data.isReschedule ?? (
                                selectedCallForSchedule.jobStatus === 'SCHEDULED' || 
                                selectedCallForSchedule.jobStatus === 'scheduled' || 
                                !!selectedCallForSchedule.scheduleDate
                            );
                            
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

                            let response;
                            if (isReschedule) {
                                response = await apiService.updateScheduleCall(payload);
                            } else {
                                try {
                                    response = await apiService.scheduleCall(payload);
                                } catch (err) {
                                    if (err.message && err.message.toLowerCase().includes('already exists')) {
                                        payload.updatedBy = Number(user?.userId || 0);
                                        response = await apiService.updateScheduleCall(payload);
                                    } else {
                                        throw err;
                                    }
                                }
                            }
                            
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

            {showDetailsModal && selectedCallForView && (
                <PendingCallDetailsModal
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedCallForView(null);
                        setSelectedCallActions([]);
                    }}
                    call={selectedCallForView}
                    availableActions={selectedCallActions}
                    onSchedule={() => {
                        setSelectedCallForSchedule(selectedCallForView);
                        setShowSchedulePopup(true);
                        setShowDetailsModal(false);
                    }}
                    onReschedule={() => {
                        setSelectedCallForSchedule(selectedCallForView);
                        setShowSchedulePopup(true);
                        setShowDetailsModal(false);
                    }}
                    onStart={() => {
                        setSelectedCallForShift(selectedCallForView);
                        setIsResumeShift(false);
                        setShowShiftModal(true);
                        setShowDetailsModal(false);
                    }}
                    onResume={() => {
                        setSelectedCallForShift(selectedCallForView);
                        setIsResumeShift(true);
                        setShowShiftModal(true);
                        setShowDetailsModal(false);
                    }}
                    onEnterShiftDetails={() => {
                        setSelectedCallForShift(selectedCallForView);
                        setIsResumeShift(true);
                        setShowShiftModal(true);
                        setShowDetailsModal(false);
                    }}
                    onDone={() => {
                        fetchPendingCalls();
                    }}
                />
            )}

            {showShiftModal && selectedCallForShift && (
                <ResumeCallModal
                    isOpen={showShiftModal}
                    onClose={() => {
                        setShowShiftModal(false);
                        setSelectedCallForShift(null);
                    }}
                    call={selectedCallForShift}
                    isResume={isResumeShift}
                    onConfirm={handleShiftDetailsConfirm}
                />
            )}
        </div>
    );
};

const RescheduleModal = ({ call, onClose, onConfirm }) => {
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [callDetails, setCallDetails] = useState({
        poNo: '',
        desiredDate: '',
        scheduledDate: '',
        previousRemark: ''
    });
    const [newDate, setNewDate] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchDetails = async () => {
            if (!call?.requestId) return;
            setLoadingDetails(true);
            try {
                const [summaryRes, scheduleRes, sec1Res, sec2Res] = await Promise.allSettled([
                    apiService.getInspectionCallSummary(call.requestId),
                    apiService.getSchedule(call.requestId),
                    apiService.getSection1Details(call.requestId),
                    apiService.getSection2Details(call.requestId)
                ]);

                const summary = summaryRes.status === 'fulfilled' ? summaryRes.value?.responseData : null;
                const schedule = scheduleRes.status === 'fulfilled' ? scheduleRes.value?.responseData : null;
                const sec1 = sec1Res.status === 'fulfilled' ? sec1Res.value?.responseData : null;
                const sec2 = sec2Res.status === 'fulfilled' ? sec2Res.value?.responseData : null;

                const po = sec1?.rlyPoNo || summary?.poNo || (call.poNo ? call.poNo : call.requestId);
                const desired = sec2?.inspectionDesiredDate || summary?.desiredInspectionDate || (call.createdDate ? new Date(call.createdDate).toISOString().split('T')[0] : '');
                const schedDate = schedule?.scheduleDate || call.scheduleDate || '';
                const remark = schedule?.reason || call.remarks || '-';

                const todayISO = new Date().toISOString().split('T')[0];
                const initialDate = schedDate || desired || todayISO;

                if (isMounted) {
                    setCallDetails({
                        poNo: po || 'N/A',
                        desiredDate: desired || 'N/A',
                        scheduledDate: schedDate ? (schedDate.includes('-') ? schedDate.split('-').reverse().join('/') : schedDate) : 'Not Scheduled',
                        previousRemark: remark
                    });
                    setNewDate(initialDate);
                }
            } catch (err) {
                console.error("Error fetching reschedule modal details:", err);
            } finally {
                if (isMounted) setLoadingDetails(false);
            }
        };

        fetchDetails();
        return () => { isMounted = false; };
    }, [call]);

    const isReschedule = (call.jobStatus === 'SCHEDULED' || 
                         call.jobStatus === 'scheduled' || 
                         call.status === 'SCHEDULED' || 
                         call.status === 'scheduled') && 
                         (callDetails.scheduledDate && callDetails.scheduledDate !== 'Not Scheduled' && callDetails.scheduledDate !== '-');

    const handleConfirm = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onConfirm({ newDate, reason, isReschedule });
        } catch (err) {
            console.error("Error confirming schedule:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="reschedule-modal">
                <div className="reschedule-header">
                    <h3>{isReschedule ? 'Reschedule Inspection' : 'Schedule Inspection'}</h3>
                    <button className="close-btn-blue" disabled={isSubmitting} onClick={onClose}>×</button>
                </div>
                
                {loadingDetails ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                        Loading call details...
                    </div>
                ) : (
                    <>
                        <div className="reschedule-info-card">
                            <div className="info-main">
                                <div className="req-id">{call.requestId}</div>
                                <div className="po-info">PO: {callDetails.poNo}</div>
                            </div>
                            <div className="desired-date-section">
                                <label>Desired Date</label>
                                <span className="date-val-orange">{callDetails.desiredDate}</span>
                            </div>
                        </div>

                        {/* Previous Schedule info only shown when rescheduling */}
                        {isReschedule && callDetails.scheduledDate && callDetails.scheduledDate !== 'Not Scheduled' && (
                            <div className="previous-details-card">
                                <h4>Previous Schedule Details</h4>
                                <div className="prev-grid">
                                    <div className="prev-item">
                                        <label>Scheduled Date:</label>
                                        <span>{callDetails.scheduledDate}</span>
                                    </div>
                                    <div className="prev-item">
                                        <label>Previous Remark:</label>
                                        <span>{callDetails.previousRemark}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="input-label">
                                {isReschedule ? 'New Schedule Date' : 'Schedule Date'}{' '}
                                <span className="req-star">for {call.requestId} *</span>
                            </label>
                            <div className="date-input-wrapper">
                                <input 
                                    type="date" 
                                    className="reschedule-date-input" 
                                    value={newDate}
                                    min={callDetails.desiredDate !== 'N/A' && callDetails.desiredDate.includes('-') ? callDetails.desiredDate : ''}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <p className="input-hint">
                                {isReschedule ? 'Select new date for inspection' : 'Select the date for inspection'}{' '}
                                {callDetails.desiredDate !== 'N/A' && <span className="min-hint">(Min: {callDetails.desiredDate})</span>}
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="input-label">{isReschedule ? 'Reason for Reschedule' : 'Remarks'}</label>
                            <textarea 
                                className="reschedule-textarea" 
                                placeholder={isReschedule ? "Enter reason for rescheduling..." : "Enter remarks for scheduling..."}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={isSubmitting}
                            ></textarea>
                        </div>

                        <div className="reschedule-footer">
                            <button className="btn-cancel-grey" disabled={isSubmitting} onClick={onClose}>Cancel</button>
                            <button 
                                className="btn-confirm-blue" 
                                disabled={isSubmitting || loadingDetails} 
                                onClick={handleConfirm}
                                style={{
                                    opacity: isSubmitting ? 0.65 : 1,
                                    cursor: (isSubmitting || loadingDetails) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSubmitting ? 'Confirming...' : 'Confirm'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AttendingCallDashboard;
