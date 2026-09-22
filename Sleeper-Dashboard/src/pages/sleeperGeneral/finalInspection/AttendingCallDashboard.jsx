import React, { useState, useEffect } from 'react';
import FinalInspectionScreen from './FinalInspectionScreen';
import PendingCallDetailsModal from '../../../components/PendingCallDetailsModal';
import ResumeCallModal from '../../../components/ResumeCallModal';
import Notification from '../../../components/Notification';
import CorrectionSlipModal from '../../../components/CorrectionSlipModal';
import AnnexureUploadModal from '../../../components/AnnexureUploadModal';
import './AttendingCallDashboard.css';
import { apiService, API_BASE_URL } from '../../../services/api';
import { getStoredUser } from '../../../services/authService';
import { viewSignedCertificate } from '../../../services/certificateService';
import { useShift } from '../../../context/ShiftContext';
import { generateCallLetterPDF } from '../../../utils/generateCallLetterPDF';

const resolveSleeperCaseNo = (rawCaseNo, rio) => {
    if (!rawCaseNo || !String(rawCaseNo).trim()) return '-';
    const parts = String(rawCaseNo).split(',').map(s => s.trim()).filter(Boolean);
    const effectiveRio = rio || (typeof localStorage !== 'undefined' ? localStorage.getItem('plantRio') : '');
    if (effectiveRio && String(effectiveRio).trim()) {
        const firstLetter = String(effectiveRio).trim().charAt(0).toUpperCase();
        const matched = parts.find(p => p.toUpperCase().startsWith(firstLetter));
        if (matched) return matched;
    }
    return parts[0] || '-';
};

const cleanPlantStr = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const isPlantMatching = (callPlantId, allowedPlantList) => {
    if (!allowedPlantList || allowedPlantList.length === 0) return true;
    const cleanCall = cleanPlantStr(callPlantId);
    if (!cleanCall) return false;

    return allowedPlantList.some(target => {
        const cleanTarget = cleanPlantStr(target);
        if (!cleanTarget) return false;
        
        if (cleanCall === cleanTarget) return true;
        
        if (cleanCall.includes(cleanTarget) || cleanTarget.includes(cleanCall)) {
            const callParts = String(callPlantId).split(/[/:]/).filter(Boolean);
            const targetParts = String(target).split(/[/:]/).filter(Boolean);
            if (callParts.length > 1 && targetParts.length > 1) {
                const callUnit = cleanPlantStr(callParts[callParts.length - 1]);
                const targetUnit = cleanPlantStr(targetParts[targetParts.length - 1]);
                return callUnit === targetUnit || callUnit.includes(targetUnit) || targetUnit.includes(callUnit);
            }
            return true;
        }
        return false;
    });
};

const AttendingCallDashboard = ({ mode }) => {
    const { dutyUnit } = useShift();
    const [internalActiveTab, setInternalActiveTab] = useState(() => {
        return sessionStorage.getItem('attendingCallActiveTab') || 'pending';
    });

    const activeTab = mode || internalActiveTab;

    const handleTabChange = (tab) => {
        setInternalActiveTab(tab);
        sessionStorage.setItem('attendingCallActiveTab', tab);
    };

    useEffect(() => {
        if (mode) {
            setInternalActiveTab(mode);
            sessionStorage.setItem('attendingCallActiveTab', mode);
        }
    }, [mode]);

    useEffect(() => {
        const handleTabEvent = (e) => {
            if (e.detail && e.detail.tab) {
                setInternalActiveTab(e.detail.tab);
            }
        };
        window.addEventListener('attendingTabChange', handleTabEvent);
        return () => window.removeEventListener('attendingTabChange', handleTabEvent);
    }, []);
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
    const [downloadingIcId, setDownloadingIcId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        callNo: '',
        message: '',
        details: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: null
    });

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
    const [closedCalls, setClosedCalls] = useState([]);
    const [selectedIbsDetail, setSelectedIbsDetail] = useState(null);
    const [correctionSlipRow, setCorrectionSlipRow] = useState(null);
    const [sendIbsCallRow, setSendIbsCallRow] = useState(null);
    const [selectedActionCall, setSelectedActionCall] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [isSendingIbs, setIsSendingIbs] = useState(false);
    const [expandedActions, setExpandedActions] = useState({});
    const [notification, setNotification] = useState({ message: '', type: 'info' });
    const [uploadAnnexureModal, setUploadAnnexureModal] = useState({ isOpen: false, call: null });

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
    };

    const renderIbsStatusBadge = (row) => {
        const rawStatus = (row.ibsStatus || '').toUpperCase().trim();
        let bg = '#fef3c7';
        let color = '#b45309';
        let label = 'PENDING';

        if (rawStatus.includes('SUCCESS') || rawStatus === 'OK') {
            bg = '#dcfce7';
            color = '#15803d';
            label = 'SUCCESS';
        } else if (rawStatus.includes('FAIL') || rawStatus.includes('ERROR') || rawStatus === 'NOK') {
            bg = '#fee2e2';
            color = '#b91c1c';
            label = 'FAIL';
        } else {
            bg = '#fef3c7';
            color = '#b45309';
            label = 'PENDING';
        }

        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                    style={{
                        backgroundColor: bg,
                        color: color,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                >
                    {label}
                </span>
                {row.ibsReason && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIbsDetail(row);
                        }}
                        title="View IBS Details"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '0 2px',
                            color: '#0284c7'
                        }}
                    >
                        ℹ️
                    </button>
                )}
            </div>
        );
    };

    const handleConfirmSendToIbs = async () => {
        if (!sendIbsCallRow) return;
        setIsSendingIbs(true);
        try {
            const user = getStoredUser();
            const userId = user?.userId || localStorage.getItem('userId');
            const payload = {
                workflowTransitionId: sendIbsCallRow.workflowTransitionId || sendIbsCallRow.id,
                moduleId: sendIbsCallRow.moduleId || 2,
                requestId: sendIbsCallRow.requestId || sendIbsCallRow.callNo,
                action: 'SEND_CALL_TO_IBS',
                remarks: 'Send call to IBS confirmed by IE',
                actionBy: Number(userId || 0)
            };

            await apiService.performTransitionAction(payload);
            showNotification(`Call ${payload.requestId} has been successfully sent to IBS!`, 'success');
            setCompletedCalls(prev => prev.filter(c => (c.requestId || c.callNo) !== payload.requestId && c.id !== sendIbsCallRow.id));
            setSendIbsCallRow(null);
            fetchClosedCalls();
        } catch (err) {
            console.error('Error sending call to IBS:', err);
            showNotification(err.message || 'Failed to send call to IBS. Please try again.', 'error');
        } finally {
            setIsSendingIbs(false);
        }
    };

    const loadCalls = async (tabToLoad = activeTab) => {
        setIsLoading(true);
        try {
            const user = getStoredUser();
            const userId = user?.userId || localStorage.getItem('userId');
            const activeDutyUnit = dutyUnit || localStorage.getItem('dutyUnit') || localStorage.getItem('plantId');

            let allowedPlants = [];
            if (activeDutyUnit) {
                allowedPlants.push(activeDutyUnit);
            } else {
                try {
                    const mappingRes = await apiService.getCompanyUnitsByUser(userId);
                    const data = mappingRes?.responseData;
                    if (Array.isArray(data)) {
                        data.forEach(comp => {
                            if (Array.isArray(comp.unitNames)) {
                                allowedPlants.push(...comp.unitNames);
                            }
                        });
                    } else if (data?.unitNames && Array.isArray(data.unitNames)) {
                        allowedPlants.push(...data.unitNames);
                    }
                } catch (e) {
                    console.error("Error fetching user company units:", e);
                }
            }

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
                    action.includes('SEND_CALL_TO_IBS') ||
                    action.includes('CLOSED') ||
                    jobStatus === 'COMPLETED' ||
                    jobStatus === 'FINISH' ||
                    jobStatus === 'IC_ISSUE' ||
                    jobStatus === 'ISSUE IC' ||
                    jobStatus === 'IC_GENERATION' ||
                    jobStatus === 'GENERATED' ||
                    jobStatus === 'IC_SIGNED' ||
                    jobStatus.includes('CANCEL') ||
                    jobStatus.includes('WITHDRAW') ||
                    jobStatus.includes('SEND_CALL_TO_IBS') ||
                    jobStatus.includes('CLOSED') ||
                    status === 'COMPLETED' ||
                    status === 'IC_ISSUE' ||
                    status === 'IC_GENERATION' ||
                    status === 'GENERATED' ||
                    status === 'IC_SIGNED' ||
                    status.includes('CANCEL') ||
                    status.includes('WITHDRAW') ||
                    status.includes('SEND_CALL_TO_IBS') ||
                    status.includes('CLOSED')
                );
            };

            const isClosedOrSentToIbs = (c) => {
                const action = (c.action || '').toUpperCase();
                const status = (c.status || '').toUpperCase();
                const jobStatus = (c.jobStatus || '').toUpperCase();
                return action.includes('SEND_CALL_TO_IBS') || action.includes('SENT_TO_IBS') || action.includes('CLOSED') ||
                       status.includes('SEND_CALL_TO_IBS') || status.includes('SENT_TO_IBS') || status.includes('CLOSED') ||
                       jobStatus.includes('SEND_CALL_TO_IBS') || jobStatus.includes('SENT_TO_IBS') || jobStatus.includes('CLOSED');
            };

            if (tabToLoad === 'closed') {
                const closedRes = await apiService.getClosedFinalCalls(activeDutyUnit, userId);
                const closedData = (closedRes && closedRes.responseData) ? closedRes.responseData : (Array.isArray(closedRes) ? closedRes : []);
                const mappedClosed = closedData.filter(c => {
                    return allowedPlants.length === 0 || isPlantMatching(c.plantId, allowedPlants);
                }).map(item => ({
                    ...item,
                    id: item.workflowTransitionId || item.id,
                    requestId: item.requestId || item.callNo,
                    status: 'Closed - Sent to IBS',
                    checked: false
                }));
                setClosedCalls(mappedClosed);
            } else if (tabToLoad === 'pending') {
                // 1. List of Calls Pending: ONLY trigger pending workflow transitions
                const res = await apiService.getAllPendingWorkflowTransitions('Main IE', userId, activeDutyUnit);
                const pendingData = (res && res.responseData) ? res.responseData : [];

                const pendingList = pendingData.filter(item => {
                    const matchesPlant = allowedPlants.length === 0 || isPlantMatching(item.plantId, allowedPlants);
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

                setPendingCalls(pendingList);
            } else if (tabToLoad === 'completed') {
                // 2. Completed Calls tab: ONLY call getCompletedFinalCalls
                const completedRes = await apiService.getCompletedFinalCalls(activeDutyUnit, userId);
                const completedDataAll = (completedRes && completedRes.responseData) ? completedRes.responseData : (Array.isArray(completedRes) ? completedRes : []);

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

                const uniqueCompletedMap = new Map();
                completedDataAll.forEach(item => {
                    const reqId = item.requestId || item.callNo;
                    if (reqId) {
                        if (!uniqueCompletedMap.has(reqId) || (item.workflowTransitionId > uniqueCompletedMap.get(reqId).workflowTransitionId)) {
                            uniqueCompletedMap.set(reqId, item);
                        }
                    }
                });
                const dedupedCompleted = Array.from(uniqueCompletedMap.values());

                const finalCompletedCalls = dedupedCompleted.filter(c => {
                    const matchesPlant = allowedPlants.length === 0 || isPlantMatching(c.plantId, allowedPlants);
                    return matchesPlant && isSignedOrArchived(c) && !isClosedOrSentToIbs(c);
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

                setCompletedCalls(finalCompletedCalls);
            } else {
                // 3. Issuance of IC tab: call getCompletedFinalCalls
                const completedRes = await apiService.getCompletedFinalCalls(activeDutyUnit, userId);
                const completedDataAll = (completedRes && completedRes.responseData) ? completedRes.responseData : (Array.isArray(completedRes) ? completedRes : []);

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

                const uniqueCompletedMap = new Map();
                completedDataAll.forEach(item => {
                    const reqId = item.requestId || item.callNo;
                    if (reqId) {
                        if (!uniqueCompletedMap.has(reqId) || (item.workflowTransitionId > uniqueCompletedMap.get(reqId).workflowTransitionId)) {
                            uniqueCompletedMap.set(reqId, item);
                        }
                    }
                });
                const dedupedCompleted = Array.from(uniqueCompletedMap.values());

                const certCalls = dedupedCompleted.filter(c => {
                    const matchesPlant = allowedPlants.length === 0 || isPlantMatching(c.plantId, allowedPlants);
                    return matchesPlant && !isSignedOrArchived(c) && !isClosedOrSentToIbs(c);
                }).map(item => ({
                    ...item,
                    id: item.workflowTransitionId,
                    status: item.jobStatus || item.status || 'COMPLETED',
                    jobStatus: item.jobStatus || item.status || 'COMPLETED',
                    checked: false
                }));

                setIssuanceCalls(certCalls);
            }
        } catch (error) {
            console.error("Error loading calls:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingCalls = () => loadCalls('pending');
    const fetchIssuanceCalls = () => loadCalls('issuance');
    const fetchCompletedCalls = () => loadCalls('completed');
    const fetchClosedCalls = () => loadCalls('closed');

    useEffect(() => {
        loadCalls(activeTab);
    }, [activeTab, dutyUnit]); // Track which call has actions shown

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
        } catch (error) {
            console.error("Error confirming shift details:", error);
            showNotification("Failed to proceed: " + error.message, 'error');
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
            showNotification('Failed to open IC', 'error');
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

    const handleDownloadSignedIC = async (call) => {
        if (!call) return;
        const icNumber = call.certificateNo || call.icNumber || call.icNo || call.requestId || call.callNo || call.id;
        if (!icNumber) {
            showNotification('Call / IC number not found.', 'error');
            return;
        }

        const callKey = call.id || call.requestId || icNumber;
        try {
            setDownloadingIcId(callKey);
            const response = await viewSignedCertificate(icNumber);
            const signedData = response?.signedData || response?.responseData?.signedData;
            const fileName = response?.fileName || `${String(icNumber).replace(/[/\\?%*:|"<>]/g, '_')}_signed_IC.pdf`;

            if (signedData) {
                const byteCharacters = atob(signedData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);

                // Open in a new tab for preview
                window.open(blobUrl, '_blank');

                // Trigger file download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            if (response?.url) {
                window.open(response.url, '_blank');
                return;
            }

            throw new Error('No signed PDF data found in storage response.');
        } catch (err) {
            console.warn('Error fetching signed certificate, attempting direct view URL:', err);
            try {
                const cleanBase = (API_BASE_URL || 'http://localhost:8080/sarthi-backend/api').replace(/\/api\/?$/, '');
                const directUrl = `${cleanBase}/api/certificate-storage/view/${encodeURIComponent(icNumber)}.pdf`;
                window.open(directUrl, '_blank');
            } catch (fallbackErr) {
                showNotification('Signed Inspection Certificate is not available: ' + (err.message || 'Not found in storage.'), 'error');
            }
        } finally {
            setDownloadingIcId(null);
        }
    };

    const handleDownloadAnnexures = (call) => {
        showNotification(`Annexure generation and download for call ${call.requestId || call.callNo || call.id} is being prepared.`, 'info');
    };

    const handleBackToInspection = (call) => {
        const callNo = call?.requestId || call?.call_no || call?.callNo || call?.id;
        if (!callNo) return;
        
        setConfirmDialog({
            isOpen: true,
            title: 'Revert to Inspection Stage',
            callNo: callNo,
            message: `Are you sure you want to revert call "${callNo}" back to Inspection stage?`,
            details: 'This will delete the IC Issue / Finish transitions and reset the inspection state, allowing you to update inspection values again.',
            confirmText: 'Yes, Revert to Inspection',
            cancelText: 'Cancel',
            type: 'warning',
            onConfirm: async () => {
                try {
                    setIsLoading(true);
                    const user = getStoredUser();
                    const userId = user?.userId || user?.id || 0;
                    await apiService.revertToInspection(callNo, userId);
                    sessionStorage.setItem('attendingCallActiveTab', 'pending');
                    sessionStorage.removeItem('activeInspectionCall');
                    sessionStorage.removeItem('isInspectingCall');
                    showNotification(`Call ${callNo} reverted back to Inspection stage successfully. Refreshing...`, 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } catch (err) {
                    console.error('Failed to revert to inspection:', err);
                    showNotification(`Failed to revert call: ${err.message || 'Server error'}`, 'error');
                    setIsLoading(false);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleBackToIcIssuance = (call) => {
        const callNo = call?.requestId || call?.call_no || call?.callNo || call?.id;
        if (!callNo) return;
        
        setConfirmDialog({
            isOpen: true,
            title: 'Revert to IC Issuance',
            callNo: callNo,
            message: `Are you sure you want to revert call "${callNo}" back to IC Issuance stage?`,
            details: 'This will delete the Generate IC / DSC Signed transition and certificate storage, allowing you to edit and re-issue the IC.',
            confirmText: 'Yes, Revert to Issuance',
            cancelText: 'Cancel',
            type: 'warning',
            onConfirm: async () => {
                try {
                    setIsLoading(true);
                    const user = getStoredUser();
                    const userId = user?.userId || user?.id || 0;
                    await apiService.revertToIcIssuance(callNo, userId);
                    setSelectedActionCall(null);
                    sessionStorage.setItem('attendingCallActiveTab', 'issuance');
                    sessionStorage.removeItem('activeInspectionCall');
                    sessionStorage.removeItem('isInspectingCall');
                    showNotification(`Call ${callNo} reverted back to IC Issuance stage successfully. Refreshing...`, 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } catch (err) {
                    console.error('Failed to revert to IC issuance:', err);
                    showNotification(`Failed to revert call: ${err.message || 'Server error'}`, 'error');
                    setIsLoading(false);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleDownloadLetter = async (call) => {
        if (!call) return;
        const callNumber = call.requestId || call.callNo || call.callNumber || call.id;
        if (!callNumber) {
            showNotification('Call ID not found. Cannot generate PDF.', 'error');
            return;
        }
        setPdfLoading(true);
        try {
            const pdfCallData = {
                ...call,
                callNumber: callNumber,
                poNumber: call.rlyPoSrNo || call.po_no || call.poNumber || call.poNo,
                vendorName: call.vendorName || call.vendor_name || call.vendorCode
            };
            
            const user = getStoredUser();
            const enrichedCall = { 
                ...pdfCallData, 
                rio: pdfCallData.rio || pdfCallData.plantRio || user?.rio 
            };
            
            generateCallLetterPDF(enrichedCall);
            showNotification('Call letter downloaded successfully.', 'success');
        } catch (err) {
            console.error('Failed to generate Call Letter PDF:', err);
            showNotification('Failed to generate Call Letter PDF.', 'error');
        } finally {
            setPdfLoading(false);
        }
    };

    const downloadPoDoc = async (call) => {
        if (!call) return;
        let rawPoNo = call.rlyPoSrNo || call.po_no || call.poNumber || call.poNo || call.rawPoNo;
        if (!rawPoNo) {
            showNotification('No PO number available for this call.', 'error');
            return;
        }

        let barePoNo = String(rawPoNo).trim();
        if (barePoNo.includes('/')) {
            const parts = barePoNo.split('/').map((p) => p.trim()).filter(Boolean);
            const numericPart = parts.find((p) => p.length >= 6 && !isNaN(Number(p.replace(/[^0-9]/g, ''))));
            if (numericPart) {
                barePoNo = numericPart;
            } else {
                barePoNo = parts[0];
            }
        }

        try {
            const token = localStorage.getItem('authToken');
            const cleanBase = (API_BASE_URL || 'http://localhost:8080/sarthi-backend/api').replace(/\/api\/?$/, '');
            const response = await fetch(`${cleanBase}/api/vendor/po-pdf-path?rawPoNo=${encodeURIComponent(barePoNo)}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) {
                throw new Error(`Server returned HTTP ${response.status}`);
            }
            const data = await response.json();
            const pdfPath = data?.responseData;
            if (!pdfPath) {
                showNotification(`No PO document found for PO ${barePoNo}.`, 'info');
                return;
            }

            if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
                const proxyUrl = `${cleanBase}/api/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`;
                const a = document.createElement('a');
                a.href = proxyUrl;
                a.download = `PO_${barePoNo}.pdf`;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                window.open(pdfPath, '_blank');
            }
            showNotification(`PO & MA document for ${barePoNo} downloaded.`, 'success');
        } catch (err) {
            console.error('Error downloading PO document:', err);
            showNotification('Failed to download PO document.', 'error');
        }
    };

    const downloadTCDoc = async (call) => {
        showNotification('TC document download is being prepared.', 'info');
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
            {/* UI Toast Notification */}
            <Notification
                message={notification.message}
                type={notification.type}
                autoClose={true}
                autoCloseDelay={4500}
                onClose={() => setNotification({ message: '', type: 'info' })}
            />
            <header className="ie-modern-header" style={{ marginBottom: '24px' }}>
                <div className="header-top-line" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        className="home-btn-glass"
                        onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'Main Dashboard' } }))}
                        title="Back to Dashboard"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </button>
                    <div className="header-titles">
                        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                            {activeTab === 'issuance' ? 'Issuance of IC' :
                             activeTab === 'completed' ? 'Completed Calls' :
                             activeTab === 'closed' ? 'Closed Calls' : 'List of Calls Pending'}
                        </h1>
                    </div>
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
                                        <th>CALL NO.</th>
                                        <th>PO & PO SR. NO.</th>
                                        <th>IBS CASE NUMBER</th>
                                        <th>VENDOR NAME</th>
                                        <th>SLEEPER TYPE</th>
                                        <th>PLANT ID</th>
                                        <th>CALL DATE</th>
                                        <th>DESIRED INSPECTION DATE</th>
                                        <th>OFFERED QUANTITY</th>
                                        <th>SCHEDULE DATE</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>Loading pending calls...</td>
                                        </tr>
                                    ) : pendingCalls.filter(c => {
                                        const q = (searchTerm || '').toLowerCase();
                                        return (c.requestId?.toLowerCase() || '').includes(q) ||
                                               (c.vendorName?.toLowerCase() || '').includes(q) ||
                                               (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                               (c.plantId?.toLowerCase() || '').includes(q) ||
                                               (c.poNo?.toLowerCase() || '').includes(q) ||
                                               (c.caseNo?.toLowerCase() || '').includes(q) ||
                                               (c.sleeperType?.toLowerCase() || '').includes(q) ||
                                               (c.rlyPoSrNo?.toLowerCase() || '').includes(q);
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>No pending calls found.</td>
                                        </tr>
                                    ) : (
                                        pendingCalls.filter(c => {
                                            const q = (searchTerm || '').toLowerCase();
                                            return (c.requestId?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorName?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                                   (c.plantId?.toLowerCase() || '').includes(q) ||
                                                   (c.poNo?.toLowerCase() || '').includes(q) ||
                                                   (c.caseNo?.toLowerCase() || '').includes(q) ||
                                                   (c.sleeperType?.toLowerCase() || '').includes(q) ||
                                                   (c.rlyPoSrNo?.toLowerCase() || '').includes(q);
                                        }).map(call => (
                                            <tr key={call.id}>
                                                <td style={{ fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{call.requestId || call.callNo || '-'}</td>
                                                <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#1e293b' }}>{call.rlyPoSrNo || (call.poNo ? `${call.poNo}${call.poSr ? ' / ' + call.poSr : ''}` : '-')}</td>
                                                <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#475569' }}>{resolveSleeperCaseNo(call.caseNo || call.ibsCaseNo, call.rio || call.plantRio)}</td>
                                                <td title={call.vendorName || call.vendorCode || ''} style={{ maxWidth: '200px' }}>
                                                    <div style={{ fontWeight: '600', color: '#0f172a', lineHeight: '1.25' }}>
                                                        {(call.vendorName || call.vendorCode || '-').split('~')[0]}
                                                    </div>
                                                    {(call.vendorName || '').includes('~') && (
                                                        <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.2' }}>
                                                            {(call.vendorName || '').split('~').slice(1).filter(Boolean).join(', ')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ fontWeight: '600', color: '#0369a1', whiteSpace: 'nowrap' }}>{call.sleeperType || call.productType || '-'}</td>
                                                <td style={{ whiteSpace: 'nowrap', color: '#334155' }}>{(call.plantId || '-').replace(/^:+/, '')}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{call.callDate ? new Date(call.callDate).toLocaleDateString('en-GB') : (call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : '-')}</td>
                                                <td style={{ color: '#ea580c', fontWeight: '600', whiteSpace: 'nowrap' }}>{call.desiredInspectionDate ? new Date(call.desiredInspectionDate).toLocaleDateString('en-GB') : '-'}</td>
                                                <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                                                    {call.offeredQty ?? call.totalOffered ?? '-'} {call.offeredQty || call.totalOffered ? (call.uom || 'Nos.') : ''}
                                                </td>
                                                <td style={{ color: '#2563eb', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                                    {call.scheduleDate ? new Date(call.scheduleDate).toLocaleDateString('en-GB') : (call.scheduledDate ? new Date(call.scheduledDate).toLocaleDateString('en-GB') : '-')}
                                                </td>
                                                <td>
                                                    <span 
                                                        className={`status-action-pill ${(call.jobStatus || call.status || '').toLowerCase().replace(/[\s_]+/g, '-')}`}
                                                        onClick={() => handleOpenViewActions(call)}
                                                        style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                                                                padding: '6px 12px',
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
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading issuance calls...</td>
                                        </tr>
                                    ) : issuanceCalls.filter(c => {
                                        const q = (searchTerm || '').toLowerCase();
                                        return (c.requestId?.toLowerCase() || '').includes(q) ||
                                               (c.vendorName?.toLowerCase() || '').includes(q) ||
                                               (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                               (c.plantId?.toLowerCase() || '').includes(q);
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No calls for IC issuance found</td>
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
                                                    <div className="table-actions-modern" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <button
                                                            className="btn-actions-modern"
                                                            onClick={() => handleActionClick(call)}
                                                            style={{
                                                                padding: '6px 12px',
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
                                        <th style={{ width: '135px', whiteSpace: 'nowrap' }}>CALL NO.</th>
                                        <th style={{ width: '180px', whiteSpace: 'nowrap' }}>PO NO.</th>
                                        <th style={{ width: '140px', whiteSpace: 'nowrap' }}>IBS CASE NUMBER</th>
                                        <th style={{ minWidth: '220px' }}>VENDOR NAME</th>
                                        <th style={{ width: '110px', whiteSpace: 'nowrap' }}>PRODUCT TYPE</th>
                                        <th style={{ width: '100px', whiteSpace: 'nowrap' }}>DATE</th>
                                        <th style={{ width: '150px', textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
                                        <th style={{ width: '135px', textAlign: 'center', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading completed calls...</td>
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
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No completed calls found</td>
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
                                                <td className="req-id-cell" style={{ fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{call.requestId || call.callNo || '-'}</td>
                                                <td style={{ color: '#1e293b', fontWeight: '600', whiteSpace: 'nowrap' }}>{call.rlyPoSrNo || (call.poNo ? `${call.poNo}${call.poSr ? ' / ' + call.poSr : ''}` : '-')}</td>
                                                <td style={{ color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>{resolveSleeperCaseNo(call.caseNo || call.ibsCaseNo, call.rio || call.plantRio)}</td>
                                                <td title={call.vendorName || call.vendorCode || ''}>
                                                    <div style={{ fontWeight: '600', color: '#0f172a', lineHeight: '1.3' }}>
                                                        {(call.vendorName || call.vendorCode || '-').split('~')[0]}
                                                    </div>
                                                    {(call.vendorName || '').includes('~') && (
                                                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.2' }}>
                                                            {(call.vendorName || '').split('~').slice(1).filter(Boolean).join(', ')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap', color: '#0369a1', fontWeight: '600' }}>{call.productType || call.sleeperType || 'Sleeper'}</td>
                                                <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : (call.callDate ? new Date(call.callDate).toLocaleDateString('en-GB') : 'N/A')}</td>
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span className="status-pill completed" style={{ padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Completed - E-Signed</span>
                                                </td>
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <button 
                                                            style={{ 
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '6px 14px',
                                                                fontWeight: '700',
                                                                fontSize: '12px',
                                                                borderRadius: '8px',
                                                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                                                color: '#ffffff',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                                                                whiteSpace: 'nowrap',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                            onClick={() => setSelectedActionCall(call)}
                                                            title="View Call Actions"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                            View Actions
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

                {activeTab === 'closed' && (
                    <div className="table-container-modern">
                        <div className="table-search-header">
                            <input 
                                type="text" 
                                placeholder="Search closed calls by call no, vendor, PO, plant..." 
                                className="search-input-modern" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="calls-table-wrapper-modern">
                            <table className="calls-table-modern">
                                <thead>
                                    <tr>
                                        <th style={{ width: '135px', whiteSpace: 'nowrap' }}>CALL NO.</th>
                                        <th style={{ width: '180px', whiteSpace: 'nowrap' }}>PO NO.</th>
                                        <th style={{ width: '140px', whiteSpace: 'nowrap' }}>IBS CASE NUMBER</th>
                                        <th style={{ minWidth: '220px' }}>VENDOR NAME</th>
                                        <th style={{ width: '110px', whiteSpace: 'nowrap' }}>PRODUCT TYPE</th>
                                        <th style={{ width: '100px', whiteSpace: 'nowrap' }}>DATE</th>
                                        <th style={{ width: '100px', textAlign: 'center', whiteSpace: 'nowrap' }}>STATUS</th>
                                        <th style={{ width: '120px', textAlign: 'center', whiteSpace: 'nowrap' }}>IBS STATUS</th>
                                        <th style={{ width: '135px', textAlign: 'center', whiteSpace: 'nowrap' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading closed calls...</td>
                                        </tr>
                                    ) : closedCalls.filter(c => {
                                        const q = (searchTerm || '').toLowerCase();
                                        return (c.requestId?.toLowerCase() || '').includes(q) ||
                                               (c.vendorName?.toLowerCase() || '').includes(q) ||
                                               (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                               (c.plantId?.toLowerCase() || '').includes(q) ||
                                               (c.poNo?.toLowerCase() || '').includes(q);
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No closed calls found</td>
                                        </tr>
                                    ) : (
                                        closedCalls.filter(c => {
                                            const q = (searchTerm || '').toLowerCase();
                                            return (c.requestId?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorName?.toLowerCase() || '').includes(q) ||
                                                   (c.vendorCode?.toLowerCase() || '').includes(q) ||
                                                   (c.plantId?.toLowerCase() || '').includes(q) ||
                                                   (c.poNo?.toLowerCase() || '').includes(q);
                                        }).map(call => (
                                            <tr key={call.id}>
                                                <td className="req-id-cell" style={{ fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{call.requestId || call.callNo || '-'}</td>
                                                <td style={{ color: '#1e293b', fontWeight: '600', whiteSpace: 'nowrap' }}>{call.rlyPoSrNo || (call.poNo ? `${call.poNo}${call.poSr ? ' / ' + call.poSr : ''}` : '-')}</td>
                                                <td style={{ color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>{resolveSleeperCaseNo(call.caseNo || call.ibsCaseNo, call.rio || call.plantRio)}</td>
                                                <td title={call.vendorName || call.vendorCode || ''}>
                                                    <div style={{ fontWeight: '600', color: '#0f172a', lineHeight: '1.3' }}>
                                                        {(call.vendorName || call.vendorCode || '-').split('~')[0]}
                                                    </div>
                                                    {(call.vendorName || '').includes('~') && (
                                                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.2' }}>
                                                            {(call.vendorName || '').split('~').slice(1).filter(Boolean).join(', ')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap', color: '#0369a1', fontWeight: '600' }}>{call.productType || call.sleeperType || 'Sleeper'}</td>
                                                <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : (call.callDate ? new Date(call.callDate).toLocaleDateString('en-GB') : 'N/A')}</td>
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span className="status-pill" style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 600, padding: '4px 10px', borderRadius: '6px' }}>
                                                        CLOSED
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    {renderIbsStatusBadge(call)}
                                                </td>
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <button 
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '6px 14px',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                                                color: '#ffffff',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                                                                whiteSpace: 'nowrap',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                            onClick={() => setSelectedActionCall({ ...call, isClosed: true })}
                                                            title="View Call Actions"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                            View Actions
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
                                    <button className="issue-ic-btn" onClick={() => { setShowDetailsPopup(false); handleIssueIC(popupCall); }}>
                                        {(popupCall?.jobStatus === 'IC_ISSUE' || popupCall?.status === 'IC_ISSUE') ? 'View IC' : 'Issue IC'}
                                    </button>
                                    <button 
                                        className="download-btn"
                                        style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontWeight: '700' }}
                                        onClick={() => { setShowDetailsPopup(false); setUploadAnnexureModal({ isOpen: true, call: popupCall }); }}
                                    >
                                        📁 Upload Annexures / Docs
                                    </button>
                                    <button 
                                        className="download-btn"
                                        style={{ background: '#fff7ed', color: '#c2410c', border: '1.5px solid #ffedd5', fontWeight: '700' }}
                                        onClick={() => { setShowDetailsPopup(false); handleBackToInspection(popupCall); }}
                                    >
                                        Back to Inspection
                                    </button>
                                    <button className="download-btn">Download Annexures</button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        className="download-btn"
                                        onClick={() => handleDownloadSignedIC(popupCall)}
                                        disabled={downloadingIcId === (popupCall?.id || popupCall?.requestId)}
                                    >
                                        {downloadingIcId === (popupCall?.id || popupCall?.requestId) ? 'Downloading...' : 'Download IC'}
                                    </button>
                                    <button 
                                        className="download-btn"
                                        onClick={() => handleDownloadAnnexures(popupCall)}
                                    >
                                        Download Annexures
                                    </button>
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
                                showNotification(isReschedule ? "Call rescheduled successfully!" : "Call scheduled successfully!", 'success');
                                setShowSchedulePopup(false);
                                fetchPendingCalls(); // Refresh the list
                            }
                        } catch (error) {
                            console.error("Error scheduling call:", error);
                            showNotification(error.message || "Failed to schedule call. Please try again.", 'error');
                        }
                    }}
                />
            )}

            {showDetailsModal && selectedCallForView && (
                <PendingCallDetailsModal
                    isOpen={showDetailsModal}
                    showNotification={showNotification}
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

            {/* Inspection Call Details & Actions Modal (Same as ERC) */}
            {selectedActionCall && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setSelectedActionCall(null)} 
                    style={{ 
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999, 
                        backgroundColor: 'rgba(15, 23, 42, 0.6)', 
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            maxWidth: '1080px', 
                            width: '95%', 
                            borderRadius: '16px', 
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <div className="modal-header" style={{
                            padding: '14px 24px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#0ea5e9' }}>📋</span> Inspection Call Details - <span style={{ color: '#334155' }}>{selectedActionCall.requestId || selectedActionCall.call_no || selectedActionCall.callNo}</span>
                            </h2>
                            <button 
                                className="modal-close" 
                                onClick={() => setSelectedActionCall(null)}
                                style={{
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%',
                                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s ease', color: '#64748b', fontSize: '1.2rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            >✕</button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '82vh', overflowY: 'auto', padding: '18px 24px 24px 24px' }}>
                            {/* Top Summary Section */}
                            <div style={{ 
                                background: 'linear-gradient(to right, #ffffff, #f8fafc)', 
                                padding: '14px 18px', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0',
                                borderLeft: '4px solid #0ea5e9', 
                                marginBottom: '18px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 20px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '2px', display: 'block' }}>Call Number</label>
                                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#0f172a' }}>{selectedActionCall.requestId || selectedActionCall.call_no || selectedActionCall.callNo || '-'}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '2px', display: 'block' }}>Vendor Name</label>
                                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#0f172a' }}>{selectedActionCall.vendorName || selectedActionCall.vendor_name || selectedActionCall.vendorCode || '-'}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '2px', display: 'block' }}>PO Number</label>
                                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#0f172a' }}>{selectedActionCall.rlyPoSrNo || selectedActionCall.po_no || selectedActionCall.poNo || '-'}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '2px', display: 'block' }}>Product Type</label>
                                        <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                                            Sleeper
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '2px', display: 'block' }}>Status</label>
                                        <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                                            {selectedActionCall.status || (selectedActionCall.isClosed ? 'Closed' : 'Completed')}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '2px', display: 'block' }}>IBS Status</label>
                                        <div>
                                            {renderIbsStatusBadge(selectedActionCall)}
                                        </div>
                                    </div>
                                    {(selectedActionCall.caseNo || selectedActionCall.ibsCaseNo) && (
                                        <div>
                                            <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '2px', display: 'block' }}>IBS Case Number</label>
                                            <div style={{ fontWeight: '600', fontSize: '15px', color: '#0f172a' }}>
                                                {resolveSleeperCaseNo(selectedActionCall.caseNo || selectedActionCall.ibsCaseNo, selectedActionCall.rio || selectedActionCall.plantRio)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#f59e0b' }}>⚡</span> Actions & Documents
                            </h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
                                {/* 1. View IC */}
                                <button
                                    onClick={() => {
                                        const row = selectedActionCall;
                                        handleDownloadSignedIC(row);
                                    }}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '16px 12px', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                                        border: '1px solid #a5f3fc', borderRadius: '14px',
                                        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        color: '#0891b2', width: '100%',
                                        boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)'
                                    }}
                                    onMouseEnter={(e) => { 
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(8, 145, 178, 0.2), 0 4px 6px -2px rgba(8, 145, 178, 0.1)'; 
                                    }}
                                    onMouseLeave={(e) => { 
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)'; 
                                    }}
                                >
                                    <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                    </div>
                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>View IC</span>
                                </button>

                                {/* 2. Send call to IBS (Completed Calls only) */}
                                {!selectedActionCall.isClosed && activeTab !== 'closed' && (
                                    <button
                                        onClick={() => {
                                            const row = selectedActionCall;
                                            setSelectedActionCall(null);
                                            setSendIbsCallRow(row);
                                        }}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '16px 12px', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                            border: '1px solid #86efac', borderRadius: '14px',
                                            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            color: '#15803d', width: '100%',
                                            boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.1), 0 2px 4px -1px rgba(21, 128, 61, 0.06)'
                                        }}
                                        onMouseEnter={(e) => { 
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(21, 128, 61, 0.2), 0 4px 6px -2px rgba(21, 128, 61, 0.1)'; 
                                        }}
                                        onMouseLeave={(e) => { 
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(21, 128, 61, 0.1), 0 2px 4px -1px rgba(21, 128, 61, 0.06)'; 
                                        }}
                                    >
                                        <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>Send call to IBS</span>
                                    </button>
                                )}

                                {/* Correction Slip (Closed Calls) */}
                                {(selectedActionCall.isClosed || activeTab === 'closed') && (
                                    <button
                                        onClick={() => {
                                            const row = selectedActionCall;
                                            setSelectedActionCall(null);
                                            setCorrectionSlipRow(row);
                                        }}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '16px 12px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                            border: '1px solid #fcd34d', borderRadius: '14px',
                                            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            color: '#b45309', width: '100%',
                                            boxShadow: '0 4px 6px -1px rgba(180, 83, 9, 0.1), 0 2px 4px -1px rgba(180, 83, 9, 0.06)'
                                        }}
                                        onMouseEnter={(e) => { 
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(180, 83, 9, 0.2), 0 4px 6px -2px rgba(180, 83, 9, 0.1)'; 
                                        }}
                                        onMouseLeave={(e) => { 
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(180, 83, 9, 0.1), 0 2px 4px -1px rgba(180, 83, 9, 0.06)'; 
                                        }}
                                        title="Issue Correction Slip"
                                    >
                                        <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>Correction Slip</span>
                                    </button>
                                )}

                                {/* 3. Call Letter */}
                                <button
                                    onClick={() => handleDownloadLetter(selectedActionCall)}
                                    disabled={pdfLoading}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '16px 12px', background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                                        border: '1px solid #a5f3fc', borderRadius: '14px',
                                        cursor: pdfLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        color: '#0891b2', width: '100%',
                                        boxShadow: '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)'
                                    }}
                                    onMouseEnter={(e) => { 
                                        if(!pdfLoading) { 
                                             e.currentTarget.style.transform = 'translateY(-3px)';
                                             e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(8, 145, 178, 0.2), 0 4px 6px -2px rgba(8, 145, 178, 0.1)'; 
                                        }
                                    }}
                                    onMouseLeave={(e) => { 
                                        if(!pdfLoading) { 
                                             e.currentTarget.style.transform = 'translateY(0)';
                                             e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)'; 
                                        }
                                    }}
                                >
                                    <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    </div>
                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{pdfLoading ? 'Generating...' : 'Call Letter'}</span>
                                </button>

                                {/* 4. PO & MA */}
                                <button
                                    onClick={() => downloadPoDoc(selectedActionCall)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '16px 12px', background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                                        border: '1px solid #d8b4fe', borderRadius: '14px',
                                        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        color: '#7e22ce', width: '100%',
                                        boxShadow: '0 4px 6px -1px rgba(126, 34, 206, 0.1), 0 2px 4px -1px rgba(126, 34, 206, 0.06)'
                                    }}
                                    onMouseEnter={(e) => { 
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(126, 34, 206, 0.2), 0 4px 6px -2px rgba(126, 34, 206, 0.1)'; 
                                    }}
                                    onMouseLeave={(e) => { 
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(126, 34, 206, 0.1), 0 2px 4px -1px rgba(126, 34, 206, 0.06)'; 
                                    }}
                                >
                                    <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                    </div>
                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>PO & MA</span>
                                </button>

                                {/* 5. Upload / View Annexures and Other Docs */}
                                <button
                                    onClick={() => {
                                        const call = selectedActionCall;
                                        const isClosed = call.isClosed || activeTab === 'closed';
                                        setSelectedActionCall(null);
                                        setUploadAnnexureModal({ isOpen: true, call, mode: isClosed ? 'view' : 'upload' });
                                    }}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '16px 12px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                        border: '1px solid #86efac', borderRadius: '14px',
                                        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        color: '#166534', width: '100%',
                                        boxShadow: '0 4px 6px -1px rgba(22, 101, 52, 0.1), 0 2px 4px -1px rgba(22, 101, 52, 0.06)'
                                    }}
                                    onMouseEnter={(e) => { 
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(22, 101, 52, 0.2), 0 4px 6px -2px rgba(22, 101, 52, 0.1)'; 
                                    }}
                                    onMouseLeave={(e) => { 
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(22, 101, 52, 0.1), 0 2px 4px -1px rgba(22, 101, 52, 0.06)'; 
                                    }}
                                    title={(selectedActionCall.isClosed || activeTab === 'closed') ? "View uploaded annexures and other documents" : "Upload or manage annexures and other documents"}
                                >
                                    <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    </div>
                                    <span style={{ fontWeight: '700', fontSize: '13.5px', textAlign: 'center', lineHeight: '1.2' }}>
                                        {(selectedActionCall.isClosed || activeTab === 'closed') ? "View Uploaded Annexures & Docs" : "Upload / Manage Annexures & Docs"}
                                    </span>
                                </button>

                                {/* 6. Back to Issuance of IC */}
                                {!selectedActionCall.isClosed && activeTab !== 'closed' && (
                                    <button
                                        onClick={() => handleBackToIcIssuance(selectedActionCall)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '16px 12px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                                            border: '1px solid #fed7aa', borderRadius: '14px',
                                            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            color: '#c2410c', width: '100%',
                                            boxShadow: '0 4px 6px -1px rgba(194, 65, 12, 0.1), 0 2px 4px -1px rgba(194, 65, 12, 0.06)'
                                        }}
                                        onMouseEnter={(e) => { 
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(194, 65, 12, 0.2), 0 4px 6px -2px rgba(194, 65, 12, 0.1)'; 
                                        }}
                                        onMouseLeave={(e) => { 
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(194, 65, 12, 0.1), 0 2px 4px -1px rgba(194, 65, 12, 0.06)'; 
                                        }}
                                        title="Revert call back to IC Issuance stage"
                                    >
                                        <div style={{ width: '42px', height: '42px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>Back to Issuance of IC</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Send to IBS Confirmation Modal */}
            {sendIbsCallRow && (
                <div 
                    className="modal-overlay" 
                    onClick={() => !isSendingIbs && setSendIbsCallRow(null)}
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20000,
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <div 
                        className="modal-content" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            maxWidth: '520px',
                            width: '92%',
                            borderRadius: '20px',
                            background: '#ffffff',
                            padding: '28px',
                            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.9)',
                            border: 'none',
                            position: 'relative'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                                    border: '1px solid #7dd3fc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#0284c7',
                                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.15)'
                                }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
                                        Send Call to IBS
                                    </h3>
                                    <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>
                                        Finalize & submit inspection records to IBS portal
                                    </p>
                                </div>
                            </div>
                            <button 
                                disabled={isSendingIbs} 
                                onClick={() => setSendIbsCallRow(null)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    transition: 'all 0.15s'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Informational Alert Box */}
                        <div style={{
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            border: '1px solid #bae6fd',
                            borderLeft: '4px solid #0284c7',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            marginBottom: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span style={{ fontSize: '16px' }}>ℹ️</span>
                            <span style={{ fontSize: '13px', color: '#0369a1', lineHeight: 1.45, fontWeight: '500' }}>
                                Once submitted, this call will be recorded in IBS and archived under the <strong>Closed Calls</strong> tab.
                            </span>
                        </div>

                        {/* Call Details Card Grid */}
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '16px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                                    <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                        Call Number
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                                        {sendIbsCallRow.requestId || sendIbsCallRow.callNo}
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                                    <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                        IBS Case Number
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0369a1' }}>
                                        {resolveSleeperCaseNo(sendIbsCallRow.caseNo || sendIbsCallRow.ibsCaseNo, sendIbsCallRow.rio || sendIbsCallRow.plantRio)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #edf2f7', marginBottom: '14px' }}>
                                <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    PO & SR Number
                                </div>
                                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#1e293b' }}>
                                    {sendIbsCallRow.rlyPoSrNo || sendIbsCallRow.poNo || '-'}
                                </div>
                            </div>

                            <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                                <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    Vendor
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', lineHeight: 1.4 }}>
                                    {sendIbsCallRow.vendorName || sendIbsCallRow.vendorCode || '-'}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                disabled={isSendingIbs} 
                                onClick={() => setSendIbsCallRow(null)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#475569',
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    cursor: isSendingIbs ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                disabled={isSendingIbs} 
                                onClick={handleConfirmSendToIbs}
                                style={{
                                    padding: '10px 22px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    cursor: isSendingIbs ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {isSendingIbs ? (
                                    <>
                                        <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                                        Sending to IBS...
                                    </>
                                ) : (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                        Confirm Send to IBS
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* IBS Details Modal */}
            {selectedIbsDetail && (
                <div 
                    className="modal-overlay" 
                    onClick={() => setSelectedIbsDetail(null)}
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20000
                    }}
                >
                    <div 
                        className="modal-content" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            maxWidth: '500px',
                            width: '92%',
                            borderRadius: '20px',
                            background: '#ffffff',
                            padding: '28px',
                            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.9)',
                            border: 'none'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px'
                                }}>
                                    📋
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                        IBS Status Details
                                    </h3>
                                    <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600' }}>
                                        {selectedIbsDetail.requestId || selectedIbsDetail.callNo}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedIbsDetail(null)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>IBS Status:</span>
                                <span style={{ 
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    backgroundColor: (selectedIbsDetail.ibsStatus || '').toUpperCase().includes('SUCCESS') ? '#dcfce7' : 
                                                     (selectedIbsDetail.ibsStatus || '').toUpperCase().includes('FAIL') ? '#fee2e2' : '#fef3c7',
                                    color: (selectedIbsDetail.ibsStatus || '').toUpperCase().includes('SUCCESS') ? '#15803d' : 
                                           (selectedIbsDetail.ibsStatus || '').toUpperCase().includes('FAIL') ? '#b91c1c' : '#b45309'
                                }}>
                                    {selectedIbsDetail.ibsStatus || 'PENDING'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: selectedIbsDetail.ibsReason ? '12px' : '0' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>IBS Case Number:</span>
                                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                                    {resolveSleeperCaseNo(selectedIbsDetail.caseNo || selectedIbsDetail.ibsCaseNo, selectedIbsDetail.rio || selectedIbsDetail.plantRio)}
                                </span>
                            </div>

                            {selectedIbsDetail.ibsReason && (
                                <div style={{
                                    background: '#ffffff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    marginTop: '12px'
                                }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                        Response / Reason
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                        {selectedIbsDetail.ibsReason}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setSelectedIbsDetail(null)}
                                style={{
                                    padding: '9px 20px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#475569',
                                    fontWeight: '700',
                                    fontSize: '13.5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Correction Slip Modal */}
            {correctionSlipRow && (
                <CorrectionSlipModal
                    row={correctionSlipRow}
                    onClose={() => setCorrectionSlipRow(null)}
                />
            )}

            {/* UI Confirmation Modal for Revert Actions */}
            {confirmDialog.isOpen && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        animation: 'fadeIn 0.15s ease'
                    }}
                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                >
                    <div 
                        style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '490px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{
                            padding: '24px 24px 16px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '12px',
                                backgroundColor: confirmDialog.type === 'danger' ? '#fef2f2' : '#fffbeb',
                                border: confirmDialog.type === 'danger' ? '1px solid #fee2e2' : '1px solid #fef3c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={confirmDialog.type === 'danger' ? '#dc2626' : '#d97706'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                    {confirmDialog.title}
                                </h3>
                                {confirmDialog.callNo && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '3px 10px',
                                            background: '#f0f9ff',
                                            color: '#0369a1',
                                            border: '1px solid #bae6fd',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '700'
                                        }}>
                                            Call No: {confirmDialog.callNo}
                                        </span>
                                    </div>
                                )}
                                <p style={{ margin: '0 0 12px', fontSize: '13.5px', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>
                                    {confirmDialog.message}
                                </p>
                                {confirmDialog.details && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#64748b',
                                        lineHeight: '1.45'
                                    }}>
                                        {confirmDialog.details}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{
                            padding: '16px 24px',
                            background: '#f8fafc',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#475569',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {confirmDialog.cancelText || 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (typeof confirmDialog.onConfirm === 'function') {
                                        confirmDialog.onConfirm();
                                    }
                                }}
                                style={{
                                    padding: '9px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: confirmDialog.type === 'danger' 
                                        ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' 
                                        : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {confirmDialog.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Annexure & Document Upload Modal */}
            {uploadAnnexureModal.isOpen && uploadAnnexureModal.call && (
                <AnnexureUploadModal
                    isOpen={uploadAnnexureModal.isOpen}
                    onClose={() => setUploadAnnexureModal({ isOpen: false, call: null })}
                    callNo={uploadAnnexureModal.call.requestId || uploadAnnexureModal.call.callNo || uploadAnnexureModal.call.call_no}
                    icNumber={uploadAnnexureModal.call.icNumber || uploadAnnexureModal.call.icNo || ""}
                    moduleType="SLEEPER"
                    uploadedBy={getStoredUser()?.name || "Inspecting Engineer"}
                    mode={uploadAnnexureModal.mode || "upload"}
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
