import React, { useState, useEffect, useRef } from 'react';
import { fetchPendingWorkflowTransitions, fetchCompletedCalls, performTransitionAction, isPlantIdMatching, fetchCancellationDetails } from '../services/workflowService';
import { scheduleInspection } from '../services/scheduleService';
import { viewSignedCertificate } from '../services/certificateService';
import { getBaseUrl } from '../services/apiConfig';
import Notification from './Notification';
import { getStoredUser } from '../services/authService';
import CorrectionSlipModal from './CorrectionSlipModal';
import PendingCallDetailsModal from './PendingCallDetailsModal';
import ShiftDutyForm from './ShiftDutyForm';
import AnnexureLoader from './AnnexureLoader';

const AttendingCallsDashboard = ({ 
  onStart, 
  onResume, 
  onIssueIc, 
  onBackToPortal, 
  dutyPlantId,
  controlledTab,
  hideTopHeader = false,
  hideTopTabs = false,
  onCountsChange
}) => {
  const [activeTab, setActiveTab] = useState(() => {
    return controlledTab || localStorage.getItem('railpad_attending_calls_tab') || 'pending';
  });
  const [calls, setCalls] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, certificates: 0, completed: 0 });
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
  const [remarks, setRemarks] = useState('');
  const [showCorrectionSlipModal, setShowCorrectionSlipModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const user = getStoredUser();

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

  useEffect(() => {
    localStorage.setItem('railpad_attending_calls_tab', activeTab);
    activeTabRef.current = activeTab;
    loadCalls();
  }, [activeTab, dutyPlantId]);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const uId = user?.userId || localStorage.getItem('userId');
      let mappedPlants = [];
      if (uId) {
        try {
          mappedPlants = await fetchMappedPlantIds(uId, 'Main IE');
        } catch (e) {}
      }

      const roleStr = (user?.roleName || localStorage.getItem('roleName') || '').toLowerCase();
      const isMainIeUser = roleStr.includes('main ie') || mappedPlants.length > 0;
      const queryPlantId = isMainIeUser ? '' : dutyPlantId;

      const [pendingDataResponse, completedDataResponse] = await Promise.all([
        fetchPendingWorkflowTransitions('Rail Main IE', queryPlantId, 2).catch(() => []),
        fetchCompletedCalls(queryPlantId, 2).catch(() => [])
      ]);

      const pendingData = pendingDataResponse || [];
      const completedDataAll = completedDataResponse || [];

      let rpPending = pendingData.filter(c => c.requestId);
      let rpCompletedAll = completedDataAll.filter(c => c.requestId);

      if (mappedPlants && mappedPlants.length > 0) {
        rpPending = rpPending.filter(c => !c.plantId || mappedPlants.some(p => isPlantIdMatching(c.plantId, p)));
        rpCompletedAll = rpCompletedAll.filter(c => !c.plantId || mappedPlants.some(p => isPlantIdMatching(c.plantId, p)));
      } else if (dutyPlantId) {
        rpPending = rpPending.filter(c => !c.plantId || isPlantIdMatching(c.plantId, dutyPlantId));
        rpCompletedAll = rpCompletedAll.filter(c => !c.plantId || isPlantIdMatching(c.plantId, dutyPlantId));
      }

      const isCallSignedAndCompleted = (c) => {
        const action = (c.action || '').toUpperCase();
        const status = (c.status || '').toUpperCase();
        const jobStatus = (c.jobStatus || '').toUpperCase();
        return action === 'GENERATE_IC' ||
               action === 'DSC_SIGN_IC' ||
               action === 'IC_GENERATION' ||
               status === 'GENERATE_IC' ||
               jobStatus === 'GENERATE_IC' ||
               status === 'DSC_SIGN_IC' ||
               jobStatus === 'DSC_SIGN_IC' ||
               status === 'IC_GENERATION' ||
               jobStatus === 'IC_GENERATION' ||
               status === 'GENERATED' ||
               jobStatus === 'GENERATED' ||
               status === 'IC_SIGNED' ||
               jobStatus === 'IC_SIGNED' ||
               status.includes('CANCEL') ||
               jobStatus.includes('CANCEL') ||
               action.includes('CANCEL');
      };

      let certCalls = rpCompletedAll.filter(c => {
        if (isCallSignedAndCompleted(c)) return false;
        const action = (c.action || '').toUpperCase();
        const status = (c.status || '').toUpperCase();
        const jobStatus = (c.jobStatus || '').toUpperCase();
        return (status === 'INSPECTION_DONE' || 
                status === 'CERTIFICATE_PENDING' || 
                status === 'COMPLETED' || 
                jobStatus === 'COMPLETED' || 
                status === 'ISSUE IC' || 
                status === 'IC_ISSUE' || 
                jobStatus === 'ISSUE IC' || 
                jobStatus === 'IC_ISSUE' ||
                action === 'IC_ISSUE' ||
                action === 'ISSUE IC' ||
                action === 'FINISH');
      });
      let finalCompletedCalls = rpCompletedAll.filter(c => isCallSignedAndCompleted(c));

      setCounts({
        pending: rpPending.length,
        certificates: certCalls.length,
        completed: finalCompletedCalls.length
      });

      if (activeTabRef.current === 'pending') {
        setCalls(rpPending);
      } else if (activeTabRef.current === 'certificates') {
        setCalls(certCalls);
      } else if (activeTabRef.current === 'completed') {
        setCalls(finalCompletedCalls);
      }
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
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
            { id: 'completed', label: 'Calls Completed', count: counts.completed, suffix: 'completed' }
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
            placeholder="Search by Request ID, Vendor, or Plant..."
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
      <div style={{ position: 'relative', minHeight: '260px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)', overflow: 'hidden' }}>
        {!loading && calls.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px' }}>
            No inspection calls found in this category.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {(activeTab === 'completed'
                  ? ['CALL NO.', 'PO NO.', 'IBS CASE NUMBER', 'VENDOR NAME', 'PRODUCT TYPE', 'DATE', 'STATUS', 'ACTIONS']
                  : ['CALL NO', 'VENDOR NAME', 'PLANT ID', 'CREATED DATE', 'STATUS', 'ACTIONS']
                ).map(header => (
                  <th key={header} style={{ padding: '13px 18px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {header}
                  </th>
                ))}
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
                    const hasAccess = !call.accessibleUserIds || 
                                      call.accessibleUserIds.length === 0 || 
                                      call.accessibleUserIds.map(Number).includes(userIdNum) || 
                                      Number(call.assignedToUser) === userIdNum;

                    if (!hasAccess) return false;

                    const q = (searchTerm || '').toLowerCase();
                    return (
                      (call.requestId?.toLowerCase() || '').includes(q) ||
                      (call.vendorCode?.toLowerCase() || '').includes(q) ||
                      (call.vendorName?.toLowerCase() || '').includes(q) ||
                      (call.plantId?.toLowerCase() || '').includes(q) ||
                      (call.poNo?.toLowerCase() || '').includes(q)
                    );
                  })
                  .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));

                const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedCalls = filteredCalls.slice(startIndex, startIndex + itemsPerPage);

                return (
                  <>
                    {paginatedCalls.map((call, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{call.requestId}</td>
                  {activeTab === 'completed' ? (
                    <>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                        {call.rlyPoSrNo && call.rlyPoSrNo !== '-' ? call.rlyPoSrNo : (call.poNo ? `${call.rlyShortName ? call.rlyShortName + ' / ' : ''}${call.poNo} / ${call.poSr || '001'}` : 'N/A')}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                        {call.caseNo || call.ibsCaseNo || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{call.vendorName || call.vendorCode}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{call.railPadType || call.productType || 'Rail Pad'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                        {call.createdDate ? new Date(call.createdDate).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {(() => {
                          const isCancelled = (call.status || '').toUpperCase().includes('CANCEL') ||
                                              (call.jobStatus || '').toUpperCase().includes('CANCEL') ||
                                              (call.action || '').toUpperCase().includes('CANCEL');
                          if (isCancelled) {
                            return (
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '700',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                display: 'inline-block'
                              }}>
                                Cancelled
                              </span>
                            );
                          }
                          return (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: '#dcfce7',
                              color: '#15803d',
                              border: '1px solid #86efac',
                              display: 'inline-block'
                            }}>
                              Completed - E-Signed
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                              <>
                                <button
                                  onClick={() => handleViewSignedIC(call)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
                                  }}
                                >
                                  View IC
                                </button>
                                <button
                                  disabled={true}
                                  title="Under development"
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    color: '#94a3b8',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'not-allowed',
                                    opacity: 0.6
                                  }}
                                >
                                  Annexures
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCall(call);
                                    setShowCorrectionSlipModal(true);
                                  }}
                                  title="Issue Correction Slip"
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #fed7aa',
                                    background: '#fff7ed',
                                    color: '#ea580c',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(234, 88, 12, 0.1)',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = '#ffedd5';
                                    e.currentTarget.style.borderColor = '#fdba74';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = '#fff7ed';
                                    e.currentTarget.style.borderColor = '#fed7aa';
                                  }}
                                >
                                  Correction Slip
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{call.vendorName || call.vendorCode}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{call.plantId}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                        {call.createdDate ? new Date(call.createdDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: '700',
                          background: call.jobStatus === 'CREATED' ? '#eff6ff' : '#f0fdf4',
                          color: call.jobStatus === 'CREATED' ? '#1e40af' : '#166534',
                          border: `1px solid ${call.jobStatus === 'CREATED' ? '#bfdbfe' : '#bbf7d0'}`
                        }}>
                          {((call.jobStatus || call.status || '').toUpperCase().includes('IC_ISSUE') || (call.jobStatus || call.status || '').toUpperCase().includes('ISSUE IC')) ? 'IC ISSUED' : (call.jobStatus || call.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {activeTab === 'certificates' ? (
                            <>
                              {(
                                (call.jobStatus || '').toUpperCase() === 'INSPECTION_DONE' ||
                                (call.status || '').toUpperCase() === 'INSPECTION_DONE' ||
                                (call.jobStatus || '').toUpperCase() === 'CERTIFICATE_PENDING' ||
                                (call.status || '').toUpperCase() === 'CERTIFICATE_PENDING' ||
                                (call.jobStatus || '').toUpperCase() === 'COMPLETED' ||
                                (call.status || '').toUpperCase() === 'COMPLETED' ||
                                (call.jobStatus || '').toUpperCase() === 'ISSUE IC' ||
                                (call.status || '').toUpperCase() === 'ISSUE IC' ||
                                (call.jobStatus || '').toUpperCase() === 'IC_ISSUE' ||
                                (call.status || '').toUpperCase() === 'IC_ISSUE' ||
                                (call.jobStatus || '').toUpperCase() === 'IC_GENERATION' ||
                                (call.status || '').toUpperCase() === 'IC_GENERATION' ||
                                (call.jobStatus || '').toUpperCase() === 'GENERATED' ||
                                (call.status || '').toUpperCase() === 'GENERATED'
                              ) && (
                                <button
                                  onClick={() => handleIssueICClick(call)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #10b981',
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {(call.action === 'IC_ISSUE' || call.action === 'ISSUE IC' || (call.jobStatus || '').toUpperCase().includes('IC_ISSUE') || (call.status || '').toUpperCase().includes('IC_ISSUE')) ? 'VIEW IC' : 'ISSUE IC'}
                                </button>
                              )}
                              {((call.jobStatus || '').toUpperCase() === 'DSC_SIGN_IC' || (call.status || '').toUpperCase() === 'DSC_SIGN_IC' || (call.jobStatus || '').toUpperCase() === 'IC_SIGNED' || (call.status || '').toUpperCase() === 'IC_SIGNED' || (call.jobStatus || '').toUpperCase() === 'SIGNED' || (call.status || '').toUpperCase() === 'SIGNED') && (
                                <button
                                  onClick={() => onIssueIc && onIssueIc(call, true)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #3b82f6',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  VIEW IC
                                </button>
                              )}
                            </>
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
      {showCorrectionSlipModal && selectedCall && (
        <CorrectionSlipModal
          row={selectedCall}
          onClose={() => {
            setShowCorrectionSlipModal(false);
            setSelectedCall(null);
          }}
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
          if (onResume) {
            onResume(selectedCallForView);
          }
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
    </div>
  );
};

export default AttendingCallsDashboard;
