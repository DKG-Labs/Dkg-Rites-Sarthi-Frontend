import React, { useState, useEffect, useRef } from 'react';
import { fetchPendingWorkflowTransitions, fetchCompletedCalls, performTransitionAction, isPlantIdMatching } from '../services/workflowService';
import { scheduleInspection } from '../services/scheduleService';
import { viewSignedCertificate } from '../services/certificateService';
import { getBaseUrl } from '../services/apiConfig';
import Notification from './Notification';
import { getStoredUser } from '../services/authService';
import CorrectionSlipModal from './CorrectionSlipModal';

import ShiftDutyForm from './ShiftDutyForm';

const AttendingCallsDashboard = ({ onStart, onResume, onIssueIc, onBackToPortal, dutyPlantId }) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('railpad_attending_calls_tab') || 'pending';
  });
  const [calls, setCalls] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, certificates: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
      const [pendingDataResponse, completedDataResponse] = await Promise.all([
        fetchPendingWorkflowTransitions('Rail Main IE', dutyPlantId, 2).catch(() => []),
        fetchCompletedCalls(dutyPlantId, 2).catch(() => [])
      ]);

      const pendingData = pendingDataResponse || [];
      const completedDataAll = completedDataResponse || [];

      let rpPending = pendingData.filter(c => c.requestId);
      let rpCompletedAll = completedDataAll.filter(c => c.requestId);

      if (dutyPlantId) {
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
               jobStatus === 'IC_SIGNED';
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

  return (
    <div className="dashboard-container" style={{ padding: '24px', background: '#ffffff', minHeight: '100vh' }}>
      {/* Notification Component */}
      <Notification
        message={notification.message}
        type={notification.type}
        autoClose={true}
        onClose={() => setNotification({ ...notification, message: '' })}
      />

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

      {/* Tabs as Cards */}
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

      {/* Search and Filters */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by Request ID, Vendor, or Plant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              background: '#fff',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
        </div>
      </div>      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '0' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 100px' }}>
                <div className="skeleton-item" style={{ width: '60%' }}></div>
                <div className="skeleton-item" style={{ width: '80%' }}></div>
                <div className="skeleton-item" style={{ width: '70%' }}></div>
                <div className="skeleton-item" style={{ width: '90%' }}></div>
                <div className="skeleton-item" style={{ width: '60%' }}></div>
                <div className="skeleton-item" style={{ width: '80%' }}></div>
                <div className="skeleton-item" style={{ width: '80px' }}></div>
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            No calls found in this category.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {(activeTab === 'completed'
                  ? ['CALL NO.', 'PO NO.', 'IBS CASE NUMBER', 'VENDOR NAME', 'PRODUCT TYPE', 'DATE', 'STATUS', 'ACTIONS']
                  : ['CALL NO', 'VENDOR NAME', 'PLANT ID', 'CREATED DATE', 'STATUS', 'ACTIONS']
                ).map(header => (
                  <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                          {/* DETAILS button removed per user request */}
                          {(call.jobStatus || '').toUpperCase() === 'RIO_VERIFIED' && (
                            <button
                              onClick={() => handleOpenSchedule(call)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #bbf7d0',
                                background: '#f0fdf4',
                                color: '#166534',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              SCHEDULE
                            </button>
                          )}
                          {((call.jobStatus || '').toUpperCase() === 'SCHEDULED' || (call.status || '').toUpperCase() === 'SCHEDULED') && (
                            <button
                              onClick={() => handleStartInspection(call)}
                              disabled={isSubmitting}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #bfdbfe',
                                background: isSubmitting ? '#f1f5f9' : '#eff6ff',
                                color: isSubmitting ? '#94a3b8' : '#1e40af',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                minWidth: '60px'
                              }}
                            >
                              {isSubmitting ? '...' : 'START'}
                            </button>
                          )}
                          {((call.jobStatus || '').toUpperCase() === 'INITIATED' || (call.status || '').toUpperCase() === 'INITIATED') && (
                            <button
                              onClick={() => onStart(call)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #fde68a',
                                background: '#fffbeb',
                                color: '#92400e',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              RESUME
                            </button>
                          )}
                          {((call.jobStatus || '').toUpperCase() === 'PO_VERIFICATION' || (call.status || '').toUpperCase() === 'PO_VERIFICATION' || (call.jobStatus || '').toUpperCase() === 'RESUME' || (call.status || '').toUpperCase() === 'RESUME') && (
                            <button
                              onClick={() => handleResumeClick(call)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #fde68a',
                                background: '#fffbeb',
                                color: '#92400e',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              RESUME
                            </button>
                          )}
                          {((call.jobStatus || '').toUpperCase() === 'PAUSED' || (call.status || '').toUpperCase() === 'PAUSED') && (
                            <button
                              onClick={() => handleResumeClick(call)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #93c5fd',
                                background: '#eff6ff',
                                color: '#1e40af',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Enter Shift Details
                            </button>
                          )}
                          {/* IC Issuance Stage */}
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
                                padding: '6px 12px',
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
                                padding: '6px 12px',
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
    </div>
  );
};

export default AttendingCallsDashboard;
