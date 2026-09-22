import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchPendingWorkflowTransitions, 
  fetchCompletedCalls, 
  fetchClosedCalls,
  fetchMappedPlantIds,
  performTransitionAction, 
  isPlantIdMatching, 
  fetchCancellationDetails,
  revertToInspection,
  revertToIcIssuance
} from '../services/workflowService';
import { scheduleInspection } from '../services/scheduleService';
import { viewSignedCertificate } from '../services/certificateService';
import { getBaseUrl } from '../services/apiConfig';
import Notification from './Notification';
import { getStoredUser } from '../services/authService';
import CorrectionSlipModal from './CorrectionSlipModal';
import PendingCallDetailsModal from './PendingCallDetailsModal';
import ShiftDutyForm from './ShiftDutyForm';
import AnnexureLoader from './AnnexureLoader';
import AnnexureUploadModal from './AnnexureUploadModal';
import { generateRailpadCallLetterPDF } from '../utils/generateCallLetterPDF';

const AttendingCallsDashboard = ({ 
  onStart, 
  onResume, 
  onIssueIc, 
  onBackToPortal, 
  dutyPlantId,
  controlledTab,
  hideTopHeader = true,
  hideTopTabs = true,
  onCountsChange,
  mappedPlants: propMappedPlants = [],
  user: propUser
}) => {
  const [activeTab, setActiveTab] = useState(() => {
    return controlledTab || localStorage.getItem('railpad_attending_calls_tab') || 'pending';
  });
  const [calls, setCalls] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, certificates: 0, completed: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationData, setCancellationData] = useState(null);
  const [loadingCancellation, setLoadingCancellation] = useState(false);
  const [selectedCallForView, setSelectedCallForView] = useState(null);
  const [selectedCallActions, setSelectedCallActions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [callToResume, setCallToResume] = useState(null);
  const [showCorrectionSlipModal, setShowCorrectionSlipModal] = useState(false);
  const [correctionSlipRow, setCorrectionSlipRow] = useState(null);
  const [uploadAnnexureModal, setUploadAnnexureModal] = useState({ isOpen: false, call: null });
  const [selectedCertificateCall, setSelectedCertificateCall] = useState(null);

  // Closed Calls & IBS modal states
  const [sendIbsCallRow, setSendIbsCallRow] = useState(null);
  const [selectedActionCall, setSelectedActionCall] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isSendingIbs, setIsSendingIbs] = useState(false);
  const [selectedIbsCall, setSelectedIbsCall] = useState(null);
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const user = propUser || getStoredUser();

  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    if (controlledTab && controlledTab !== activeTab) {
      setActiveTab(controlledTab);
    }
  }, [controlledTab]);

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const mappedPlantsKey = (propMappedPlants || []).join(',');

  useEffect(() => {
    localStorage.setItem('railpad_attending_calls_tab', activeTab);
    activeTabRef.current = activeTab;
    loadCalls();
  }, [activeTab, dutyPlantId, mappedPlantsKey]);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const uId = user?.userId || localStorage.getItem('userId');
      let mappedPlants = (propMappedPlants && propMappedPlants.length > 0) ? [...propMappedPlants] : [];
      if (mappedPlants.length === 0 && uId) {
        try {
          const [mainP, procP, allP] = await Promise.all([
            fetchMappedPlantIds(uId, 'Main IE').catch(() => []),
            fetchMappedPlantIds(uId, 'Process IE').catch(() => []),
            fetchMappedPlantIds(uId, 'ALL').catch(() => [])
          ]);
          mappedPlants = Array.from(new Set([...(allP || []), ...(mainP || []), ...(procP || [])]));
        } catch (e) {}
      }

      const roleStr = (user?.roleName || localStorage.getItem('roleName') || '').toLowerCase();
      const isMainIeUser = roleStr.includes('main ie') || mappedPlants.length > 0;
      const queryPlantId = isMainIeUser ? '' : dutyPlantId;

      const [pendingDataResponse, completedDataResponse, closedDataResponse] = await Promise.all([
        fetchPendingWorkflowTransitions('Rail Main IE', queryPlantId, 2).catch(() => []),
        fetchCompletedCalls(queryPlantId, 2).catch(() => []),
        fetchClosedCalls(queryPlantId, uId).catch(() => [])
      ]);

      const pendingData = pendingDataResponse || [];
      const completedDataAll = completedDataResponse || [];
      const closedDataAll = closedDataResponse || [];

      let rpPending = pendingData.filter(c => c.requestId);
      let rpCompletedAll = completedDataAll.filter(c => c.requestId);
      let rpClosedAll = closedDataAll.filter(c => c.requestId);

      if (mappedPlants && mappedPlants.length > 0) {
        rpPending = rpPending.filter(c => c.plantId && mappedPlants.some(p => isPlantIdMatching(c.plantId, p)));
        rpCompletedAll = rpCompletedAll.filter(c => c.plantId && mappedPlants.some(p => isPlantIdMatching(c.plantId, p)));
        rpClosedAll = rpClosedAll.filter(c => c.plantId && mappedPlants.some(p => isPlantIdMatching(c.plantId, p)));
      } else if (dutyPlantId) {
        rpPending = rpPending.filter(c => c.plantId && isPlantIdMatching(c.plantId, dutyPlantId));
        rpCompletedAll = rpCompletedAll.filter(c => c.plantId && isPlantIdMatching(c.plantId, dutyPlantId));
        rpClosedAll = rpClosedAll.filter(c => c.plantId && isPlantIdMatching(c.plantId, dutyPlantId));
      }

      const deduplicateByLatestCall = (list) => {
        const map = new Map();
        (list || []).forEach(item => {
          const key = String(item.requestId || item.callNo || item.id || '').trim();
          if (key) {
            if (!map.has(key) || (item.workflowTransitionId && item.workflowTransitionId > (map.get(key).workflowTransitionId || 0))) {
              map.set(key, item);
            }
          }
        });
        return Array.from(map.values());
      };

      const uniquePending = deduplicateByLatestCall(rpPending);
      const uniqueCompletedAll = deduplicateByLatestCall(rpCompletedAll);
      const uniqueClosed = deduplicateByLatestCall(rpClosedAll);

      const isCallSignedAndCompleted = (c) => {
        const action = (c.action || c.latestAction || '').toUpperCase();
        const status = (c.status || c.workflowStatus || '').toUpperCase();
        const jobStatus = (c.jobStatus || '').toUpperCase();
        return c.isIcGenerated === true ||
               action === 'GENERATE_IC' ||
               action === 'DSC_SIGN_IC' ||
               action === 'IC_GENERATION' ||
               action === 'IC_ISSUE' ||
               action === 'ISSUE_IC' ||
               status === 'GENERATE_IC' ||
               status === 'IC_GENERATION' ||
               status === 'DSC_SIGN_IC' ||
               status === 'GENERATED' ||
               status === 'IC_SIGNED' ||
               status === 'IC_ISSUE' ||
               jobStatus === 'GENERATE_IC' ||
               jobStatus === 'DSC_SIGN_IC' ||
               jobStatus === 'IC_GENERATION' ||
               jobStatus === 'GENERATED' ||
               jobStatus === 'IC_SIGNED' ||
               jobStatus === 'IC_ISSUE' ||
               status.includes('CANCEL') ||
               jobStatus.includes('CANCEL') ||
               action.includes('CANCEL');
      };

      const isClosedOrSentToIbs = (c) => {
        const action = (c.action || c.latestAction || '').toUpperCase();
        const status = (c.status || c.workflowStatus || '').toUpperCase();
        const jobStatus = (c.jobStatus || '').toUpperCase();
        return action.includes('SEND_CALL_TO_IBS') || action.includes('SENT_TO_IBS') || action.includes('CLOSED') ||
               status.includes('SEND_CALL_TO_IBS') || status.includes('SENT_TO_IBS') || status.includes('CLOSED') ||
               jobStatus.includes('SEND_CALL_TO_IBS') || jobStatus.includes('SENT_TO_IBS') || jobStatus.includes('CLOSED');
      };

      let certCalls = uniqueCompletedAll.filter(c => !isCallSignedAndCompleted(c) && !isClosedOrSentToIbs(c));
      let finalCompletedCalls = uniqueCompletedAll.filter(c => isCallSignedAndCompleted(c) && !isClosedOrSentToIbs(c));
      let finalClosedCalls = uniqueClosed;

      const newCounts = {
        pending: uniquePending.length,
        certificates: certCalls.length,
        completed: finalCompletedCalls.length,
        closed: finalClosedCalls.length
      };

      setCounts(newCounts);
      if (onCountsChange) {
        onCountsChange(newCounts);
      }

      if (activeTabRef.current === 'pending') {
        setCalls(uniquePending);
      } else if (activeTabRef.current === 'certificates') {
        setCalls(certCalls);
      } else if (activeTabRef.current === 'completed') {
        setCalls(finalCompletedCalls);
      } else if (activeTabRef.current === 'closed') {
        setCalls(finalClosedCalls);
      }
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSendToIbs = async () => {
    if (!sendIbsCallRow) return;
    setIsSendingIbs(true);
    try {
      const uId = user?.userId || localStorage.getItem('userId');
      const payload = {
        workflowTransitionId: sendIbsCallRow.workflowTransitionId || sendIbsCallRow.id,
        requestId: sendIbsCallRow.requestId || sendIbsCallRow.callNo,
        action: 'SEND_CALL_TO_IBS',
        remarks: 'Send call to IBS confirmed by IE',
        actionBy: Number(uId || 0)
      };

      const result = await performTransitionAction(payload);
      if (result?.responseStatus?.statusCode === 0 || result?.status === 'SUCCESS' || result?.data) {
        setNotification({
          message: `Call ${payload.requestId} has been successfully sent to IBS!`,
          type: 'success'
        });
        setSendIbsCallRow(null);
        loadCalls();
      } else {
        setNotification({
          message: result?.responseStatus?.message || 'Failed to send call to IBS',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error sending call to IBS:', err);
      setNotification({
        message: err.message || 'Failed to send call to IBS. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSendingIbs(false);
    }
  };

  const renderIbsStatusBadge = (call) => {
    const status = (call.ibsStatus || 'PENDING').toUpperCase();
    let badgeStyle = {
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '700',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    };

    if (status === 'SUCCESS') {
      badgeStyle.background = '#dcfce7';
      badgeStyle.color = '#15803d';
      badgeStyle.border = '1px solid #86efac';
    } else if (status === 'FAIL' || status === 'FAILED' || status === 'ERROR') {
      badgeStyle.background = '#fee2e2';
      badgeStyle.color = '#b91c1c';
      badgeStyle.border = '1px solid #fca5a5';
    } else {
      badgeStyle.background = '#fef3c7';
      badgeStyle.color = '#b45309';
      badgeStyle.border = '1px solid #fde68a';
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span style={badgeStyle}>
          {status === 'SUCCESS' ? '✓ ' : status === 'FAIL' ? '✕ ' : '⏳ '}
          {status}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIbsCall(call);
          }}
          title="View IBS Details"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            padding: '2px',
            lineHeight: 1
          }}
        >
          ℹ️
        </button>
      </div>
    );
  };

  const handleViewDetails = (call) => {
    setSelectedCall(call);
    setRemarks('');
    setShowDetailsModal(true);
  };

  const handleViewCancelledDetails = async (call) => {
    setSelectedCall(call);
    setShowCancellationModal(true);
    setLoadingCancellation(true);
    setCancellationData(null);
    try {
      const data = await fetchCancellationDetails(call.requestId || call.callNo || call.callNumber);
      setCancellationData(data);
    } catch (e) {
      console.error('Error fetching cancellation data:', e);
      setCancellationData(null);
    } finally {
      setLoadingCancellation(false);
    }
  };

  const handleOpenSchedule = (call) => {
    setSelectedCall(call);
    setScheduleDate('');
    setScheduleReason('');
    setShowScheduleModal(true);
  };

  const onScheduleSubmit = async () => {
    if (!scheduleDate) {
      setNotification({ message: 'Please select a date', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Store schedule details
      await scheduleInspection({
        callNo: selectedCall.requestId,
        scheduleDate: scheduleDate,
        reason: scheduleReason,
        createdBy: user.employeeCode || user.userId.toString()
      });

      // 2. Perform workflow transition
      const actionData = {
        workflowTransitionId: selectedCall.workflowTransitionId,
        requestId: selectedCall.requestId,
        action: 'MAIN_IE_SCHEDULE_CALL',
        remarks: `Inspection scheduled for ${scheduleDate}. ${scheduleReason}`,
        actionBy: user.userId
      };

      const result = await performTransitionAction(actionData);
      if (result.responseStatus?.statusCode === 0) {
        setNotification({ message: 'Inspection scheduled successfully!', type: 'success' });
        setShowScheduleModal(false);
        loadCalls();
      } else {
        setNotification({ message: result.responseStatus?.message || 'Failed to update workflow', type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartInspection = async (call) => {
    setIsSubmitting(true);
    try {
      const actionData = {
        workflowTransitionId: call.workflowTransitionId,
        requestId: call.requestId,
        action: 'INITIATE_CALL',
        remarks: 'Inspection initiation started by IE',
        actionBy: user.userId
      };

      const result = await performTransitionAction(actionData);

      if (result.responseStatus?.statusCode === 0) {
        // Pass the updated transition ID to the next page
        const updatedCall = {
          ...call,
          workflowTransitionId: result.responseData?.workflowTransitionId || call.workflowTransitionId
        };
        onStart(updatedCall);
      } else {
        setNotification({
          message: result.responseStatus?.message || 'Failed to initiate inspection workflow',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error starting inspection:', error);
      setNotification({ message: 'Error: ' + error.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueICClick = (call) => {
    if (onIssueIc) {
      onIssueIc(call, false);
    }
  };

  const handleResumeClick = (call) => {
    setCallToResume(call);
    setShowResumeModal(true);
  };

  const handleResumeSubmit = async (shiftData) => {
    // If the call is PAUSED, perform RESUME workflow transition first
    if (callToResume && (callToResume.jobStatus === 'PAUSED' || callToResume.status === 'PAUSED')) {
      try {
        setIsSubmitting(true);
        const actionData = {
          workflowTransitionId: callToResume.workflowTransitionId,
          requestId: callToResume.requestId,
          action: 'RESUME',
          remarks: `Inspection resumed with Shift: ${shiftData?.shift || 'N/A'}, Date: ${shiftData?.castingDate || 'N/A'}`,
          actionBy: user.userId
        };

        const result = await performTransitionAction(actionData);
        if (result.responseStatus?.statusCode === 0) {
          setNotification({ message: 'Inspection resumed successfully!', type: 'success' });
          setShowResumeModal(false);
          if (onResume) {
            // Pass updated transition ID from the response
            const updatedCall = {
              ...callToResume,
              workflowTransitionId: result.responseData?.workflowTransitionId || callToResume.workflowTransitionId
            };
            onResume(updatedCall, shiftData);
          }
        } else {
          setNotification({ message: result.responseStatus?.message || 'Failed to resume inspection', type: 'error' });
        }
      } catch (error) {
        console.error('Error resuming inspection:', error);
        setNotification({ message: 'Unable to resume inspection. Please try again.', type: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // For non-PAUSED calls (PO_VERIFICATION), proceed directly
      setShowResumeModal(false);
      if (onResume) {
        onResume(callToResume, shiftData);
      }
    }
  };

  const handleAction = async (action) => {
    if (!selectedCall) return;

    setIsSubmitting(true);
    try {
      const actionData = {
        workflowTransitionId: selectedCall.workflowTransitionId,
        requestId: selectedCall.requestId,
        action: action,
        remarks: remarks,
        actionBy: user.userId
      };

      const result = await performTransitionAction(actionData);
      if (result.responseStatus?.statusCode === 0) {
        setNotification({ message: 'Action performed successfully!', type: 'success' });
        setShowDetailsModal(false);
        loadCalls();
      } else {
        setNotification({ message: result.responseStatus?.message || 'Failed to perform action', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Error performing action', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSignedIC = async (call) => {
    const icNumber = call.icNumber || call.icNo || call.requestId || call.callNo;
    if (!icNumber) {
      setNotification({ message: 'Call / IC number not found.', type: 'error' });
      return;
    }

    setNotification({ message: 'Retrieving signed Inspection Certificate from Azure...', type: 'info' });

    try {
      const response = await viewSignedCertificate(icNumber);
      const signedData = response?.signedData || response?.responseData?.signedData;

      if (signedData) {
        const byteCharacters = atob(signedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setNotification({ message: '', type: 'info' });
        return;
      }

      // Fallback: try opening direct PDF URL
      const directUrl = `${getBaseUrl()}/certificate-storage/view/${encodeURIComponent(icNumber)}.pdf`;
      window.open(directUrl, '_blank');
      setNotification({ message: '', type: 'info' });
    } catch (err) {
      console.warn('viewSignedCertificate error, attempting direct view URL:', err);
      try {
        const directUrl = `${getBaseUrl()}/certificate-storage/view/${encodeURIComponent(icNumber)}.pdf`;
        window.open(directUrl, '_blank');
        setNotification({ message: '', type: 'info' });
      } catch (fallbackErr) {
        setNotification({ message: 'Signed Inspection Certificate is not available in Azure storage.', type: 'error' });
      }
    }
  };

  const handleDownloadAnnexures = (call) => {
    setNotification({ message: `Annexure generation and download for call ${call.requestId || call.callNo || call.id} is being prepared.`, type: 'info' });
  };

  const handleDownloadLetter = async (call) => {
    if (!call) return;
    const callNumber = call.requestId || call.callNo || call.callNumber || call.id;
    if (!callNumber) {
      setNotification({ message: 'Call ID not found. Cannot generate PDF.', type: 'error' });
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
      
      const enrichedCall = { 
        ...pdfCallData, 
        rio: pdfCallData.rio || pdfCallData.plantRio || user?.rio 
      };
      
      generateRailpadCallLetterPDF(enrichedCall);
      setNotification({ message: 'Call letter downloaded successfully.', type: 'success' });
    } catch (err) {
      console.error('Failed to generate Call Letter PDF:', err);
      setNotification({ message: 'Failed to generate Call Letter PDF.', type: 'error' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleBackToInspection = (call) => {
    const callNo = call?.requestId || call?.call_no || call?.callNo || call?.id;
    if (!callNo) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Revert to Inspection Stage',
      callNo: callNo,
      message: `Are you sure you want to revert call "${callNo}" back to Inspection stage?`,
      details: 'This will delete the IC Issue / Finish transitions and reset the inspection state so you can perform inspection updates again.',
      confirmText: 'Yes, Revert to Inspection',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          setLoading(true);
          const user = getStoredUser();
          const userId = user?.userId || user?.id || 0;
          await revertToInspection(callNo, userId);
          localStorage.setItem('railpad_attending_calls_tab', 'pending');
          setNotification({ message: `Call ${callNo} reverted back to Inspection stage successfully. Refreshing...`, type: 'success' });
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (err) {
          console.error('Failed to revert to inspection:', err);
          setNotification({ message: `Failed to revert call: ${err.message || 'Server error'}`, type: 'error' });
          setLoading(false);
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
          setLoading(true);
          const user = getStoredUser();
          const userId = user?.userId || user?.id || 0;
          await revertToIcIssuance(callNo, userId);
          setSelectedActionCall(null);
          localStorage.setItem('railpad_attending_calls_tab', 'issuance');
          setNotification({ message: `Call ${callNo} reverted back to IC Issuance stage successfully. Refreshing...`, type: 'success' });
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (err) {
          console.error('Failed to revert to IC issuance:', err);
          setNotification({ message: `Failed to revert call: ${err.message || 'Server error'}`, type: 'error' });
          setLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const downloadPoDoc = async (call) => {
    if (!call) return;
    let rawPoNo = call.rlyPoSrNo || call.po_no || call.poNumber || call.poNo || call.rawPoNo;
    if (!rawPoNo) {
      setNotification({ message: 'No PO number available for this call.', type: 'error' });
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
      const cleanBase = (getBaseUrl() || 'http://localhost:8080/sarthi-backend/api').replace(/\/api\/?$/, '');
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
        setNotification({ message: `No PO document found for PO ${barePoNo}.`, type: 'info' });
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
      setNotification({ message: `PO & MA document for ${barePoNo} downloaded.`, type: 'success' });
    } catch (err) {
      console.error('Error downloading PO document:', err);
      setNotification({ message: 'Failed to download PO document.', type: 'error' });
    }
  };

  const downloadTCDoc = async (call) => {
    setNotification({ message: 'TC document download is being prepared.', type: 'info' });
  };

  const getLoaderText = () => {
    switch (activeTab) {
      case 'pending':
        return {
          title: 'Loading Pending Calls...',
          subtitle: 'Fetching pending inspection calls for mapped plants...'
        };
      case 'certificates':
        return {
          title: 'Loading IC & Annexure Records...',
          subtitle: 'Fetching calls awaiting Inspection Certificates & annexures...'
        };
      case 'completed':
        return {
          title: 'Loading Completed Calls...',
          subtitle: 'Fetching archive of finalized calls & signed ICs...'
        };
      case 'closed':
        return {
          title: 'Loading Closed Calls...',
          subtitle: 'Fetching calls sent to IBS & historical terminal records...'
        };
      default:
        return {
          title: 'Loading Inspection Calls...',
          subtitle: 'Fetching real-time records for mapped plants...'
        };
    }
  };

  const loaderText = getLoaderText();

  return (
    <div className="dashboard-container" style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
      {/* Notification Component */}
      <Notification
        message={notification.message}
        type={notification.type}
        autoClose={true}
        onClose={() => setNotification({ ...notification, message: '' })}
      />

      {loading && (
        <AnnexureLoader 
          title={loaderText.title} 
          subtitle={loaderText.subtitle} 
          fullScreen={true} 
        />
      )}

      {!hideTopHeader && (
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0', letterSpacing: '-0.02em' }}>
            RailPad IE Dashboard
          </h1>
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                margin: '0',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <span style={{ fontSize: '16px' }}>←</span>
              Back to Portal Home
            </button>
          )}
        </div>
      )}

      {/* Tabs as Cards */}
      {!hideTopTabs && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          {[
            { id: 'pending', label: 'List of Calls Pending', count: counts.pending, suffix: 'pending' },
            { id: 'certificates', label: 'Issuance of IC & Annexures', count: counts.certificates, suffix: 'ready for IC' },
            { id: 'completed', label: 'Calls Completed', count: counts.completed, suffix: 'completed' },
            { id: 'closed', label: 'Closed Calls', count: counts.closed, suffix: 'closed' }
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: '8px',
                background: activeTab === tab.id ? '#e0f2fe' : '#ffffff',
                border: activeTab === tab.id ? '1px solid #0284c7' : '1px solid #cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', color: activeTab === tab.id ? '#0f172a' : '#334155' }}>
                {tab.label}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {tab.count} {tab.suffix}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <input
            type="text"
            placeholder="Search by Call No., PO No., Case No., Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              background: '#f8fafc',
              color: '#1e293b',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
            }}
          />
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)', 
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {!loading && calls.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px' }}>
            No inspection calls found in this category.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1150px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>CALL NO.</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>PO NO.</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>IBS CASE NUMBER</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>VENDOR NAME</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>RAILPAD TYPE</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>OFFERED QTY</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>CALL DATE</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>DESIRED DATE</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>SCHEDULED DATE</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>STATUS</th>
                {activeTab === 'closed' && (
                  <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>IBS STATUS</th>
                )}
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredCalls = calls
                  .filter(call => {
                    const st = (call.status || '').toUpperCase();
                    const jst = (call.jobStatus || '').toUpperCase();
                    if (st === 'CREATED' || jst === 'CREATED') return false;

                    const userIdNum = Number(user?.userId);
                    const assignedUserId = call.assignedToUser ? Number(call.assignedToUser) : null;

                    let hasAccess = false;
                    if (assignedUserId && assignedUserId > 0) {
                      // Once a call is initiated / assigned to a specific IE, it strictly stays with that IE
                      hasAccess = (assignedUserId === userIdNum);
                    } else {
                      // Unassigned call: any mapped IE for that plant can access it
                      hasAccess = !call.accessibleUserIds || 
                                  call.accessibleUserIds.length === 0 || 
                                  call.accessibleUserIds.map(Number).includes(userIdNum);
                    }

                    if (!hasAccess) return false;

                    const q = (searchTerm || '').toLowerCase();
                    return (
                      (call.requestId?.toLowerCase() || '').includes(q) ||
                      (call.vendorCode?.toLowerCase() || '').includes(q) ||
                      (call.vendorName?.toLowerCase() || '').includes(q) ||
                      (call.plantId?.toLowerCase() || '').includes(q) ||
                      (call.poNo?.toLowerCase() || '').includes(q) ||
                      (call.rlyPoSrNo?.toLowerCase() || '').includes(q) ||
                      (call.caseNo?.toLowerCase() || '').includes(q) ||
                      (call.ibsCaseNo?.toLowerCase() || '').includes(q) ||
                      (call.railPadType?.toLowerCase() || '').includes(q)
                    );
                  })
                  .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));

                const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedCalls = filteredCalls.slice(startIndex, startIndex + itemsPerPage);

                return (
                  <>
                    {paginatedCalls.map((call, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{call.requestId}</td>
                  {activeTab === 'closed' ? (
                    <>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                        {call.rlyPoSrNo && call.rlyPoSrNo !== '-' ? call.rlyPoSrNo : (call.poNo ? `${call.rlyShortName ? call.rlyShortName + ' / ' : ''}${call.poNo} / ${call.poSr || '001'}` : 'N/A')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b' }}>
                        {call.caseNo || call.ibsCaseNo || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>{call.vendorName || call.vendorCode}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>{call.railPadType || call.productType || 'Rail Pad'}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                        {call.offeredQty != null ? Number(call.offeredQty).toLocaleString('en-IN') : (call.totalQty != null ? Number(call.totalQty).toLocaleString('en-IN') : '-')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.callDate ? new Date(call.callDate).toLocaleDateString('en-GB') : (call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : '-')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.desiredInspectionDate ? new Date(call.desiredInspectionDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.scheduledDate ? new Date(call.scheduledDate).toLocaleDateString('en-GB') : (call.scheduleDate ? new Date(call.scheduleDate).toLocaleDateString('en-GB') : '-')}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#e0e7ff',
                          color: '#4338ca',
                          border: '1px solid #c7d2fe',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          Closed - Sent to IBS
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {renderIbsStatusBadge(call)}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <button
                            onClick={() => setSelectedActionCall({ ...call, isClosed: true })}
                            title="View Call Actions"
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
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View Actions
                          </button>
                        </div>
                      </td>
                    </>
                  ) : activeTab === 'completed' ? (
                    <>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                        {call.rlyPoSrNo && call.rlyPoSrNo !== '-' ? call.rlyPoSrNo : (call.poNo ? `${call.rlyShortName ? call.rlyShortName + ' / ' : ''}${call.poNo} / ${call.poSr || '001'}` : 'N/A')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b' }}>
                        {call.caseNo || call.ibsCaseNo || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>{call.vendorName || call.vendorCode}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>{call.railPadType || call.productType || 'Rail Pad'}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                        {call.offeredQty != null ? Number(call.offeredQty).toLocaleString('en-IN') : (call.totalQty != null ? Number(call.totalQty).toLocaleString('en-IN') : '-')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.callDate ? new Date(call.callDate).toLocaleDateString('en-GB') : (call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : '-')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.desiredInspectionDate ? new Date(call.desiredInspectionDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.scheduledDate ? new Date(call.scheduledDate).toLocaleDateString('en-GB') : (call.scheduleDate ? new Date(call.scheduleDate).toLocaleDateString('en-GB') : '-')}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {(() => {
                          const isCancelled = (call.status || '').toUpperCase().includes('CANCEL') ||
                                              (call.jobStatus || '').toUpperCase().includes('CANCEL') ||
                                              (call.action || '').toUpperCase().includes('CANCEL');
                          if (isCancelled) {
                            return (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                display: 'inline-block',
                                whiteSpace: 'nowrap'
                              }}>
                                Cancelled
                              </span>
                            );
                          }
                          return (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}>
                              Completed - E-Signed
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {(() => {
                            const isCancelled = (call.status || '').toUpperCase().includes('CANCEL') ||
                                                (call.jobStatus || '').toUpperCase().includes('CANCEL') ||
                                                (call.action || '').toUpperCase().includes('CANCEL');
                            if (isCancelled) {
                              return (
                                <button
                                  onClick={() => handleViewCancelledDetails(call)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#334155',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }}
                                >
                                  View Details
                                </button>
                              );
                            }
                            return (
                              <button
                                onClick={() => setSelectedActionCall(call)}
                                title="View Call Actions"
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
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                View Actions
                              </button>
                            );
                          })()}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                        {call.rlyPoSrNo && call.rlyPoSrNo !== '-' 
                          ? call.rlyPoSrNo 
                          : (call.poNo ? `${call.rlyShortName ? call.rlyShortName + ' / ' : ''}${call.poNo} / ${call.poSr || '001'}` : 'N/A')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b' }}>
                        {call.caseNo || call.ibsCaseNo || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155' }}>
                        {call.vendorName || call.vendorCode || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#475569' }}>
                        {call.railPadType || call.productType || 'Rail Pad'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                        {call.offeredQty != null ? Number(call.offeredQty).toLocaleString('en-IN') : (call.totalQty != null ? Number(call.totalQty).toLocaleString('en-IN') : '-')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.callDate ? new Date(call.callDate).toLocaleDateString('en-GB') : (call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : '-')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.desiredInspectionDate ? new Date(call.desiredInspectionDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {call.scheduledDate ? new Date(call.scheduledDate).toLocaleDateString('en-GB') : (call.scheduleDate ? new Date(call.scheduleDate).toLocaleDateString('en-GB') : '-')}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.02em',
                          background: (call.jobStatus || call.status || '').toUpperCase().includes('VERIFIED') ? '#eff6ff' : '#f0fdf4',
                          color: (call.jobStatus || call.status || '').toUpperCase().includes('VERIFIED') ? '#1d4ed8' : '#166534',
                          border: `1px solid ${(call.jobStatus || call.status || '').toUpperCase().includes('VERIFIED') ? '#bfdbfe' : '#bbf7d0'}`,
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          {((call.jobStatus || call.status || '').toUpperCase().includes('IC_ISSUE') || (call.jobStatus || call.status || '').toUpperCase().includes('ISSUE IC')) ? 'IC ISSUED' : (call.jobStatus || call.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {activeTab === 'certificates' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCertificateCall(call);
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
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
                    ))}
                  </>
                );
              })()}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && calls.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>Rows per page:</span>
            <select 
              value={itemsPerPage} 
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: 'white', color: '#334155', outline: 'none', cursor: 'pointer' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {(() => {
                const filteredCalls = calls
                  .filter(call =>
                    (call.status !== 'CREATED' && call.jobStatus !== 'CREATED') &&
                    (call.accessibleUserIds?.includes(Number(user?.userId))) && (
                      (call.requestId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                      (call.vendorCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                      (call.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                      (call.plantId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                    )
                  );
                const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                return (
                  <>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>
                      Showing {filteredCalls.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCalls.length)} of {filteredCalls.length}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ padding: '4px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: currentPage === 1 ? '#f8fafc' : '#ffffff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500' }}
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        style={{ padding: '4px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: currentPage === totalPages || totalPages === 0 ? '#f8fafc' : '#ffffff', color: currentPage === totalPages || totalPages === 0 ? '#94a3b8' : '#334155', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500' }}
                      >
                        Next
                      </button>
                    </div>
                  </>
                );
            })()}
          </div>
        </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && (
        <ShiftDutyForm
          hideCompanyAndUnit={true}
          initialData={{
            company: callToResume?.vendorCode || '',
            unit: callToResume?.plantId || ''
          }}
          onSubmit={handleResumeSubmit}
          onCancel={() => setShowResumeModal(false)}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Workflow Details: {selectedCall.requestId}</h2>
              <button onClick={() => setShowDetailsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                  { label: 'Transition ID', value: selectedCall.workflowTransitionId },
                  { label: 'Request ID', value: selectedCall.requestId },
                  { label: 'Action', value: selectedCall.action },
                  { label: 'Status', value: selectedCall.status },
                  { label: 'Current Role', value: selectedCall.currentRole },
                  { label: 'Next Role', value: selectedCall.nextRole },
                  { label: 'Shift', value: selectedCall.shift },
                  { label: 'Vendor Code', value: selectedCall.vendorCode },
                  { label: 'Plant ID', value: selectedCall.plantId },
                  { label: 'POI Code', value: selectedCall.poiCode },
                  { label: 'RIO', value: selectedCall.rio || 'N/A' },
                  { label: 'Job Status', value: selectedCall.jobStatus },
                  { label: 'Created By', value: selectedCall.createdBy },
                  { label: 'Created Date', value: new Date(selectedCall.createdDate).toLocaleString() },
                  { label: 'Accessible User IDs', value: selectedCall.accessibleUserIds?.join(', ') || 'N/A' }
                ].map(item => (
                  <div key={item.label}>
                    <label style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.025em' }}>{item.label}</label>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '8px' }}>Action Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks for this action..."
                  style={{ width: '100%', height: '80px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', background: '#f9fafb' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                {activeTab === 'pending' && selectedCall.status === 'CREATED' && (
                  <>
                    <button
                      onClick={() => handleAction('VERIFY')}
                      disabled={isSubmitting}
                      style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s' }}
                    >
                      {isSubmitting ? 'Processing...' : 'VERIFY & ACCEPT'}
                    </button>
                    <button
                      onClick={() => handleAction('RETURN')}
                      disabled={isSubmitting}
                      style={{ flex: 1, padding: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s' }}
                    >
                      RETURN
                    </button>
                  </>
                )}
                {activeTab === 'pending' && selectedCall.status === 'VERIFIED' && (
                  <button
                    onClick={() => handleAction('INITIATE_INSPECTION')}
                    disabled={isSubmitting}
                    style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s' }}
                  >
                    {isSubmitting ? 'Processing...' : 'INITIATE INSPECTION'}
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Call Details & Charges Modal */}
      {showCancellationModal && selectedCall && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Cancellation Details: {selectedCall.requestId || selectedCall.callNo}
                  </h2>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '800',
                    background: (cancellationData?.cancellationBasis || '').toUpperCase() === 'CHARGEABLE' ? '#fee2e2' : '#f1f5f9',
                    color: (cancellationData?.cancellationBasis || '').toUpperCase() === 'CHARGEABLE' ? '#b91c1c' : '#475569',
                    border: (cancellationData?.cancellationBasis || '').toUpperCase() === 'CHARGEABLE' ? '1px solid #fca5a5' : '1px solid #cbd5e1'
                  }}>
                    {cancellationData?.cancellationBasis ? cancellationData.cancellationBasis.replace(/_/g, ' ') : 'CANCELLED'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Call cancellation records and financial liability assessment
                </p>
              </div>
              <button
                onClick={() => setShowCancellationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {loadingCancellation ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Loading cancellation details...</div>
                </div>
              ) : (
                <>
                  {/* General Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    background: '#f8fafc',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Call Number</label>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{selectedCall.requestId || selectedCall.callNo}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Vendor</label>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{selectedCall.vendorName || selectedCall.vendorCode}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>PO Reference</label>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{selectedCall.rlyPoSrNo || selectedCall.poNo || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Cancellation Basis</label>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{cancellationData?.cancellationBasis || 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Visit Status</label>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{cancellationData?.visitStatus ? cancellationData.visitStatus.replace(/_/g, ' ') : (cancellationData?.cancellationBasis === 'CHARGEABLE' ? 'Before Visit' : 'N/A')}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Cancelled On</label>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        {cancellationData?.createdDate ? new Date(cancellationData.createdDate).toLocaleDateString('en-GB') : (selectedCall.createdDate ? new Date(selectedCall.createdDate).toLocaleDateString('en-GB') : 'N/A')}
                      </div>
                    </div>
                  </div>

                  {/* Reasons and Description */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Reason for Cancellation
                    </label>
                    <div style={{ padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>
                      {cancellationData?.reasons || selectedCall.remarks || 'Material Not Available'}
                    </div>
                  </div>

                  {cancellationData?.cancellationDescription && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Description / Remarks
                      </label>
                      <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                        {cancellationData.cancellationDescription}
                      </div>
                    </div>
                  )}

                  {/* Financial Charges Calculation Card */}
                  {cancellationData && cancellationData.cancellationBasis === 'CHARGEABLE' ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)',
                      borderRadius: '16px',
                      border: '1px solid #fecdd3',
                      padding: '20px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #fecdd3', paddingBottom: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#9f1239' }}>
                          Cancellation Charges Breakdown
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#be123c', background: '#ffe4e6', padding: '3px 8px', borderRadius: '6px' }}>
                          Chargeable to Vendor
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#9a3412', display: 'block', marginBottom: '2px' }}>Material Value</span>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                            ₹{Number(cancellationData.materialValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#9a3412', display: 'block', marginBottom: '2px' }}>Cancellation Rate</span>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                            {cancellationData.percentage || 0}%
                          </span>
                        </div>
                        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#9a3412', display: 'block', marginBottom: '2px' }}>Calculated Charges</span>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                            ₹{Number(cancellationData.calculatedCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#9a3412', display: 'block', marginBottom: '2px' }}>Maximum Cap</span>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                            ₹{Number(cancellationData.maximumCap || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        background: '#e11d48',
                        color: '#ffffff',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 6px -1px rgba(225, 29, 72, 0.2)'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                            Final Cancellation Charges
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.8 }}>
                            MIN(Calculated Charges, Maximum Cap)
                          </div>
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: '900' }}>
                          ₹{Number(cancellationData.finalCancellationCharges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontSize: '20px' }}>✓</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Non-Chargeable Cancellation</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>No cancellation charges or vendor financial liability applicable for this call.</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Close Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                <button
                  onClick={() => setShowCancellationModal(false)}
                  style={{
                    padding: '10px 24px',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Schedule Inspection
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Request ID: <span style={{ fontWeight: '700', color: '#334155' }}>{selectedCall?.requestId}</span>
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Inspection Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Reason / Remarks (Optional)
              </label>
              <textarea
                value={scheduleReason}
                onChange={(e) => setScheduleReason(e.target.value)}
                placeholder="Enter any specific instructions or reasons..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  fontWeight: '600',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={onScheduleSubmit}
                disabled={isSubmitting || !scheduleDate}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSubmitting || !scheduleDate ? '#94a3b8' : '#3b82f6',
                  fontWeight: '600',
                  color: 'white',
                  cursor: isSubmitting || !scheduleDate ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Slip Modal */}
      {(correctionSlipRow || (showCorrectionSlipModal && selectedCall)) && (
        <CorrectionSlipModal
          row={correctionSlipRow || selectedCall}
          onClose={() => {
            setCorrectionSlipRow(null);
            setShowCorrectionSlipModal(false);
            setSelectedCall(null);
          }}
          viewOnly={((correctionSlipRow || selectedCall)?.isClosed || activeTab === 'closed')}
        />
      )}

      {/* Pending Call Details / Actions Modal */}
      <PendingCallDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCallForView(null);
          setSelectedCallActions([]);
        }}
        call={selectedCallForView}
        showNotification={(msg, type) => setNotification({ message: msg, type: type || 'info' })}
        availableActions={selectedCallActions}
        onSchedule={() => {
          handleOpenSchedule(selectedCallForView);
          setShowDetailsModal(false);
        }}
        onReschedule={() => {
          handleOpenSchedule(selectedCallForView);
          setShowDetailsModal(false);
        }}
        onStart={() => {
          handleStartInspection(selectedCallForView);
          setShowDetailsModal(false);
        }}
        onResume={() => {
          handleResumeClick(selectedCallForView);
          setShowDetailsModal(false);
        }}
        onEnterShiftDetails={() => {
          handleResumeClick(selectedCallForView);
          setShowDetailsModal(false);
        }}
        onDone={() => {
          loadCalls();
          setShowDetailsModal(false);
        }}
      />

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
            className="action-details-modal-content"
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
            <div style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#0ea5e9' }}>📋</span> Inspection Call Details - <span style={{ color: '#334155' }}>{selectedActionCall.requestId || selectedActionCall.call_no || selectedActionCall.callNo}</span>
              </h2>
              <button 
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

            <div style={{ maxHeight: '82vh', overflowY: 'auto', padding: '20px 24px' }}>
              {/* Top Summary Section */}
              <div style={{ 
                background: 'linear-gradient(to right, #ffffff, #f8fafc)', 
                padding: '16px 20px', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #0ea5e9', 
                marginBottom: '20px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px 20px' }}>
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
                      Railpad
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '2px', display: 'block' }}>Status</label>
                    <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                      {selectedActionCall.isClosed || activeTab === 'closed' ? 'Closed - Sent to IBS' : (selectedActionCall.status || 'Completed')}
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
                        {selectedActionCall.caseNo || selectedActionCall.ibsCaseNo}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59e0b' }}>⚡</span> Actions & Documents
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20000,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => !isSendingIbs && setSendIbsCallRow(null)}
        >
          <div 
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
                    {sendIbsCallRow.caseNo || sendIbsCallRow.ibsCaseNo || 'N/A'}
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

      {/* IBS Status Details Modal */}
      {selectedIbsCall && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            animation: 'fadeInUp 0.2s ease-out'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>ℹ️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    IBS Call Status Details
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Call No: {selectedIbsCall.requestId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIbsCall(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>IBS Transmission Status</span>
                  {renderIbsStatusBadge(selectedIbsCall)}
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>IBS Case Number</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{selectedIbsCall.caseNo || selectedIbsCall.ibsCaseNo || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>IBS Response / Remarks</span>
                  <div style={{
                    padding: '10px 12px',
                    background: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    color: '#334155',
                    lineHeight: '1.4'
                  }}>
                    {selectedIbsCall.ibsReason || selectedIbsCall.remarks || 'Call registered and transmitted to IBS.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSelectedIbsCall(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
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

      {/* Issuance of IC & Annexures Actions Modal */}
      {selectedCertificateCall && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setSelectedCertificateCall(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '720px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#0ea5e9' }}>📋</span> Available Actions - <span style={{ color: '#334155' }}>{selectedCertificateCall.requestId || selectedCertificateCall.call_no || selectedCertificateCall.callNo}</span>
              </h2>
              <button 
                onClick={() => setSelectedCertificateCall(null)}
                style={{
                  background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748b', fontSize: '1.2rem'
                }}
              >✕</button>
            </div>

            <div style={{ padding: '22px 24px' }}>
              {/* Call Summary Grid */}
              <div style={{ 
                background: '#f8fafc', 
                padding: '14px 18px', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #2563eb', 
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px 16px'
              }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Call Number</label>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{selectedCertificateCall.requestId || selectedCertificateCall.call_no || selectedCertificateCall.callNo || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Vendor</label>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{selectedCertificateCall.vendorName || selectedCertificateCall.vendorCode || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '2px' }}>PO Number</label>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{selectedCertificateCall.rlyPoSrNo || selectedCertificateCall.poNo || selectedCertificateCall.po_no || '-'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Status</label>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#166534' }}>
                    {((selectedCertificateCall.jobStatus || selectedCertificateCall.status || '').toUpperCase().includes('IC_ISSUE') || (selectedCertificateCall.jobStatus || selectedCertificateCall.status || '').toUpperCase().includes('ISSUE IC')) ? 'IC ISSUED' : (selectedCertificateCall.jobStatus || selectedCertificateCall.status || 'Inspection Done')}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#2563eb' }}>⚡</span> Available Call Actions
              </h3>

              {/* Action Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {/* 1. Issue IC / View IC */}
                <button
                  onClick={() => {
                    const call = selectedCertificateCall;
                    setSelectedCertificateCall(null);
                    handleIssueICClick(call);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '20px 14px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1px solid #bfdbfe', borderRadius: '14px',
                    cursor: 'pointer', transition: 'all 0.25s ease',
                    color: '#1d4ed8', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(29, 78, 216, 0.08)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(29, 78, 216, 0.16)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(29, 78, 216, 0.08)'; }}
                >
                  <div style={{ width: '44px', height: '44px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '14.5px' }}>
                    {(selectedCertificateCall.action === 'IC_ISSUE' || selectedCertificateCall.action === 'ISSUE IC' || (selectedCertificateCall.jobStatus || '').toUpperCase().includes('IC_ISSUE') || (selectedCertificateCall.status || '').toUpperCase().includes('IC_ISSUE')) ? 'View IC' : 'Issue IC'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Generate or view certificate</span>
                </button>

                {/* 2. Back to Inspection */}
                <button
                  onClick={() => {
                    const call = selectedCertificateCall;
                    setSelectedCertificateCall(null);
                    handleBackToInspection(call);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '20px 14px', background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                    border: '1px solid #fecdd3', borderRadius: '14px',
                    cursor: 'pointer', transition: 'all 0.25s ease',
                    color: '#be123c', width: '100%',
                    boxShadow: '0 4px 6px -1px rgba(190, 18, 60, 0.08)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(190, 18, 60, 0.16)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(190, 18, 60, 0.08)'; }}
                >
                  <div style={{ width: '44px', height: '44px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#be123c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '14.5px' }}>Back to Inspection</span>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Revert call to testing stage</span>
                </button>
              </div>
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
          moduleType="RAILPAD"
          uploadedBy={getStoredUser()?.name || "Inspecting Engineer"}
          mode={uploadAnnexureModal.mode || "upload"}
        />
      )}
    </div>
  );
};

export default AttendingCallsDashboard;
