import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MOCK_INSPECTION_CALLS } from '../data/mockData';
import Tabs from '../components/Tabs';
import PendingCallsTab from '../components/PendingCallsTab';
import CompletedCallsTab from '../components/CompletedCallsTab';
import IssuanceOfICTab from '../components/IssuanceOfICTab';
import BillingStageTab from '../components/BillingStageTab';
import PerformanceDashboard from '../components/PerformanceDashboard';
import Modal from '../components/Modal';
import Notification from '../components/Notification';
import { scheduleInspection, rescheduleInspection, getScheduleByCallNo, validateScheduleLimit, MAX_CALLS_PER_DAY } from '../services/scheduleService';
import { raiseBill, updateBillingStatus, approvePayment, BILLING_STATUS } from '../services/billingService';
import { getStoredUser } from '../services/authService';
import { fetchUserPendingCalls, performTransitionAction, clearWorkflowCache, fetchLatestWorkflowTransition } from '../services/workflowService';
import { markAsScheduled, isCallInitiated, getCallStatusData } from '../services/callStatusService';
import { fetchCompletedCallsForIC, getCurrentUserId } from '../services/workflowApiService';
// import { fetchRawMaterialCallsByStatus } from '../services/rawMaterial/rawMaterialApiService';

const IELandingPage = ({ onStartInspection, onStartMultipleInspections, setSelectedCall, setContextSelectedCalls, setCurrentPage, initialTab = 'pending', setInspectionShift, setInspectionDate, setProcessShift }) => {
  // Restore active tab from sessionStorage on page load, fallback to initialTab
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem('ie_landing_active_tab');
    return savedTab || initialTab;
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCallLocal, setSelectedCallLocal] = useState(null);
  const [selectedCalls, setSelectedCalls] = useState([]);
  // Key to signal children to reset selection (increments when schedules/refresh happen)
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [scheduleDate, setScheduleDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isBulkSchedule, setIsBulkSchedule] = useState(false);
  const [isReschedule, setIsReschedule] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState(null);
  const [previousSchedule, setPreviousSchedule] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'error' });

  // State for unscheduled calls popup when trying to start
  const [showUnscheduledPopup, setShowUnscheduledPopup] = useState(false);
  const [unscheduledCallsInfo, setUnscheduledCallsInfo] = useState({ scheduledCalls: [], unscheduledCalls: [], refreshSchedules: null });
  const [, setAllSelectedForStart] = useState([]);

  // State for API-fetched pending calls from Azure workflow API
  const [pendingCalls, setPendingCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for completed calls (for IC issuance)
  const [completedCalls, setCompletedCalls] = useState([]);

  // State for Enter Shift Details modal
  const [showEnterShiftDetailsModal, setShowEnterShiftDetailsModal] = useState(false);
  const [shiftDetailsCall, setShiftDetailsCall] = useState(null);
  const [shiftDetailsShift, setShiftDetailsShift] = useState('');
  const [shiftDetailsDate, setShiftDetailsDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftDetailsError, setShiftDetailsError] = useState('');
  const [isResumeFromShiftModal, setIsResumeFromShiftModal] = useState(false);

  // Fetch pending workflow transitions for logged-in user from Azure API
  // PERFORMANCE OPTIMIZATION: Returns data immediately, fetches vendor names in background
  const fetchPendingData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);

    try {
      // Fetch workflow transitions immediately (without waiting for vendor names)
      const apiCalls = await fetchUserPendingCalls(forceRefresh);

      setPendingCalls(apiCalls);
      setIsLoading(false);

      // Vendor names are being fetched in background and cached
      // They will be available on next refresh or when needed

    } catch (error) {
      // console.error('❌ Error fetching pending calls from Azure API:', error);
      setPendingCalls([]);
      setIsLoading(false);
    }
  }, []);

  // Save active tab to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('ie_landing_active_tab', activeTab);
  }, [activeTab]);

  // Fetch completed calls for IC issuance
  const fetchCompletedCalls = useCallback(async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        // console.warn('⚠️ User ID not found, cannot fetch completed calls');
        setCompletedCalls([]);
        return;
      }

      const calls = await fetchCompletedCallsForIC(userId);
      setCompletedCalls(calls);
    } catch (error) {
      // console.error('❌ Error fetching completed calls:', error);
      setCompletedCalls([]);
    }
  }, []);

  // Only fetch pending data on mount. Fetch completed calls only when the
  // 'Issuance of IC' tab becomes active, and only once per session.
  const hasFetchedCompletedRef = useRef(false);

  // Fetch pending data only when the Pending tab is active.
  // This prevents triggering the pending-workflow API when the page loads
  // with the Issuance tab active (e.g. on browser refresh).
  useEffect(() => {
    if (activeTab === 'pending') {
      // Check if a caller requested a forced refresh (e.g., returned from a dashboard)
      const forceRefresh = (() => {
        try {
          return sessionStorage.getItem('ie_landing_force_refresh') === '1';
        } catch (e) {
          return false;
        }
      })();

      if (forceRefresh) {
        // Remove the flag and force-fetch pending data
        try { sessionStorage.removeItem('ie_landing_force_refresh'); } catch (e) { /* ignore */ }
        fetchPendingData(true);
      } else {
        fetchPendingData();
      }
    }
    // We depend on activeTab and fetchPendingData
  }, [activeTab, fetchPendingData]);

  useEffect(() => {
    if (activeTab === 'certificates' && !hasFetchedCompletedRef.current) {
      // Fetch completed calls only when user opens Issuance tab
      fetchCompletedCalls();
      hasFetchedCompletedRef.current = true;
    }
    // We intentionally depend on activeTab only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Use pending calls directly from API (includes Raw Material, Process, and Final)
  // No need to combine with mock data anymore
  const combinedPendingCalls = useMemo(() => {
    return pendingCalls;
  }, [pendingCalls]);

  // Azure API data for pending tab and IC issuance; mock data for other tabs (billing, etc.)
  const pendingCount = combinedPendingCalls.length;
  const completedCount = completedCalls.length; // Use actual completed calls from API
  const billingCount = MOCK_INSPECTION_CALLS.filter(call =>
    call.ic_issued === true &&
    call.billing_status &&
    call.billing_status !== BILLING_STATUS.PAYMENT_DONE
  ).length;

  const tabs = [
    { id: 'pending', label: 'List of Calls Pending', description: `${pendingCount} pending` },
    { id: 'certificates', label: 'Issuance of IC', description: `${completedCount} ready for IC` },
    { id: 'billing', label: 'Billing Stage', description: `${billingCount} in billing` },
    { id: 'completed', label: 'Calls Completed', description: `${completedCount} completed` },
    { id: 'performance', label: 'Performance', description: 'KPI overview' },
  ];

  // Handle schedule button click (first time scheduling)
  const handleSchedule = (call, refreshFn) => {
    setSelectedCallLocal(call);
    setSelectedCalls([call]);
    setIsBulkSchedule(false);
    setIsReschedule(false);
    setPreviousSchedule(null);
    setScheduleDate('');
    setRemarks('');
    // Store the refresh function directly (not wrapped in arrow function)
    setRefreshCallback(() => () => refreshFn?.());
    setShowScheduleModal(true);
  };

  // Handle reschedule button click - fetch existing schedule data
  const handleReschedule = async (call, refreshFn) => {
    setSelectedCallLocal(call);
    setSelectedCalls([call]);
    setIsBulkSchedule(false);
    setIsReschedule(true);
    // Store the refresh function directly (not wrapped in arrow function)
    setRefreshCallback(() => () => refreshFn?.());
    setPreviousSchedule(null);

    // Fetch existing schedule data to prefill the form
    try {
      const existingSchedule = await getScheduleByCallNo(call.call_no);
      if (existingSchedule) {
        // Store previous schedule for display
        setPreviousSchedule(existingSchedule);
        // Prefill schedule date
        if (existingSchedule.scheduleDate) {
          setScheduleDate(existingSchedule.scheduleDate);
        }
        // Prefill reason/remarks
        if (existingSchedule.reason) {
          setRemarks(existingSchedule.reason);
        }
      }
    } catch (error) {
      // console.error('Error fetching existing schedule:', error);
    }

    setShowScheduleModal(true);
  };

  // State for already scheduled calls info (to display in modal)
  const [alreadyScheduledCallsInfo, setAlreadyScheduledCallsInfo] = useState([]);

  // Helper: normalize various date formats to YYYY-MM-DD for comparison
  function normalizeToYMD(dateStr) {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      try {
        return new Date(dateStr).toISOString().split('T')[0];
      } catch (e) {
        return dateStr.split('T')[0];
      }
    }
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/').map(p => p.trim());
      if (parts.length === 3) {
        const [d, m, y] = parts;
        if (y.length === 4) {
          const dd = d.padStart(2, '0');
          const mm = m.padStart(2, '0');
          return `${y}-${mm}-${dd}`;
        }
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    return null;
  }

  const handleBulkSchedule = (calls, options = {}) => {
    const { scheduledCallsWithInfo = [], refreshSchedules } = options;
    setSelectedCalls(calls);
    setAlreadyScheduledCallsInfo(scheduledCallsWithInfo);
    setIsBulkSchedule(true);
    setIsReschedule(false);
    setPreviousSchedule(null);
    setScheduleDate('');
    setRemarks('');
    // Store the refresh callback to call after successful scheduling
    setRefreshCallback(() => () => refreshSchedules?.());
    setShowScheduleModal(true);
  };

  // Helper to show notification
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
  };

  // Submit schedule/reschedule to backend API
  const handleScheduleSubmit = async () => {
    if (!scheduleDate) {
      showNotification('Please select a schedule date', 'warning');
      return;
    }

    setIsSubmitting(true);
    const currentUser = getStoredUser();
    const userId = currentUser?.userId || 0;

    try {
      // Validate scheduled date is on or after desired inspection date
      const callsToValidate = isBulkSchedule ? selectedCalls : [selectedCallLocal];
      for (const call of callsToValidate) {
        if (call?.desired_inspection_date) {
          const scheduledDateObj = new Date(scheduleDate);
          const desiredDateObj = new Date(call.desired_inspection_date);
          if (scheduledDateObj < desiredDateObj) {
            showNotification(`Scheduled date cannot be before the Desired Inspection Date (${call.desired_inspection_date}) for call ${call.call_no}. Please select a later date.`, 'error');
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Validate schedule limit (5 calls per day) - only for new schedules, not reschedules
      if (!isReschedule) {
        const callsToSchedule = isBulkSchedule ? selectedCalls.length : 1;
        const validation = await validateScheduleLimit(scheduleDate, callsToSchedule);

        if (!validation.canSchedule) {
          showNotification(`Cannot schedule ${callsToSchedule} call(s) for this date. Maximum ${MAX_CALLS_PER_DAY} calls allowed per day. Currently ${validation.currentCount} call(s) scheduled, ${validation.remaining} slot(s) remaining.`, 'error');
          setIsSubmitting(false);
          return;
        }
      }

      if (isBulkSchedule) {
        // Bulk scheduling
        for (const call of selectedCalls) {
          const scheduleData = {
            callNo: call.call_no,
            scheduleDate: scheduleDate,
            reason: remarks,
            createdBy: userId
          };
          await scheduleInspection(scheduleData);
          // Mark call as scheduled in local storage
          markAsScheduled(call.call_no, scheduleDate);
        }
      } else {
        // Single call scheduling
        const scheduleData = {
          callNo: selectedCallLocal?.call_no,
          scheduleDate: scheduleDate,
          reason: remarks,
          createdBy: userId,
          updatedBy: userId
        };

        if (isReschedule) {
          await rescheduleInspection(scheduleData);
        } else {
          await scheduleInspection(scheduleData);
        }
        // Mark call as scheduled in local storage
        markAsScheduled(selectedCallLocal?.call_no, scheduleDate);
      }

      // Show success notification
      showNotification('Inspection scheduled successfully!', 'success');

      // Clear workflow cache to force fresh data on next fetch
      clearWorkflowCache();

      // Reset modal state immediately for prompt UI response
      setShowScheduleModal(false);
      setScheduleDate('');
      setRemarks('');
      setSelectedCallLocal(null);
      setSelectedCalls([]);
      setIsBulkSchedule(false);
      setIsReschedule(false);

      // Clear selection in landing page and child components (force reset)
      setSelectionResetKey(k => k + 1);

      // Refresh the schedule list
      if (refreshCallback) {
        refreshCallback();
      }

      // Refresh the pending calls list in background (force refresh to bypass cache)
      await fetchPendingData(true);
    } catch (error) {
      showNotification(error.message || 'Failed to schedule inspection', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Start/Resume button - routes immediately, validates in background
  const handleStart = (call, scheduleInfo) => {
    // console.log('🔍 handleStart called for:', call.call_no);
    // console.log('🔍 Call status:', call.status);

    // Route immediately to inspection initiation page
    // All validations and API calls will happen in the background
    if (call.status === 'VERIFY_PO_DETAILS') {
      // console.log('🔄 VERIFY_PO_DETAILS status - routing immediately to inspection initiation page');
      onStartInspection(call);
      return;
    }

    // For ENTER_SHIFT_DETAILS_AND_START_INSPECTION status (Process Material under inspection)
    // Route directly to dashboard to resume inspection
    if (call.status === 'ENTER_SHIFT_DETAILS_AND_START_INSPECTION') {
      // console.log('🔄 ENTER_SHIFT_DETAILS_AND_START_INSPECTION status - routing directly to dashboard');
      const productType = call.product_type;
      setSelectedCall(call);

      // Try to load shift/date for resume
      let shiftOfInspection = sessionStorage.getItem('inspectionShift');
      let dateOfInspection = sessionStorage.getItem('inspectionDate');

      if (!shiftOfInspection || !dateOfInspection) {
        const initiationData = sessionStorage.getItem(`inspection_initiation_${call.call_no}`);
        if (initiationData) {
          try {
            const data = JSON.parse(initiationData);
            shiftOfInspection = data.shiftOfInspection;
            dateOfInspection = data.dateOfInspection;
          } catch (e) { /* ignore */ }
        }
      }

      if (shiftOfInspection) {
        sessionStorage.setItem('inspectionShift', shiftOfInspection);
        if (typeof setInspectionShift === 'function') setInspectionShift(shiftOfInspection);

        const productTypeLower = productType?.toLowerCase() || '';
        if (productTypeLower.includes('process') || productType === 'ERC-PROCESS MATERIAL') {
          sessionStorage.setItem('processShift', shiftOfInspection);
          if (typeof setProcessShift === 'function') setProcessShift(shiftOfInspection);
        }
      }

      const productTypeLower = productType?.toLowerCase() || '';
      if (productTypeLower.includes('process') || productType === 'ERC-PROCESS MATERIAL') {
        // console.log('➡️ Routing to process-dashboard');
        setCurrentPage('process-dashboard');
      } else if (productTypeLower.includes('final') || productType === 'ERC-FINAL PRODUCT') {
        // console.log('➡️ Routing to final-dashboard');
        setCurrentPage('final-dashboard');
      } else {
        // console.log('➡️ Routing to rm-dashboard');
        setCurrentPage('rm-dashboard');
      }
      return;
    }

    // Check if call is already initiated (has inspection data stored)
    const alreadyInitiated = isCallInitiated(call.call_no);
    // console.log('📊 Already initiated?', alreadyInitiated);

    // If already initiated, navigate directly to dashboard (RESUME flow)
    if (alreadyInitiated) {
      // console.log('✅ RESUME flow - navigating to dashboard');

      // Try to get shift and date from various storage locations
      let shiftOfInspection = sessionStorage.getItem('inspectionShift');
      let dateOfInspection = sessionStorage.getItem('inspectionDate');

      // If not in sessionStorage, try to get from initiation data
      if (!shiftOfInspection || !dateOfInspection) {
        const initiationKey = `inspection_initiation_${call.call_no}`;
        const initiationData = sessionStorage.getItem(initiationKey);
        if (initiationData) {
          try {
            const data = JSON.parse(initiationData);
            shiftOfInspection = data.shiftOfInspection;
            dateOfInspection = data.dateOfInspection;
            // console.log('📝 Found shift/date in initiation data:', { shiftOfInspection, dateOfInspection });
          } catch (e) {
            // console.error('Error parsing initiation data:', e);
          }
        }
      }

      // If not found, try from call status metadata
      if (!shiftOfInspection || !dateOfInspection) {
        const callData = getCallStatusData(call.call_no);
        if (callData?.metadata) {
          shiftOfInspection = callData.metadata.shiftOfInspection;
          dateOfInspection = callData.metadata.dateOfInspection;
          // console.log('📝 Found shift/date in call status metadata:', { shiftOfInspection, dateOfInspection });
        }
      }

      // Store shift and date in sessionStorage for dashboard to use
      if (shiftOfInspection && dateOfInspection) {
        sessionStorage.setItem('inspectionShift', shiftOfInspection);
        sessionStorage.setItem('inspectionDate', dateOfInspection);

        // Update context if possible
        if (typeof setInspectionShift === 'function') setInspectionShift(shiftOfInspection);
        if (typeof setInspectionDate === 'function') setInspectionDate(dateOfInspection);

        // CRITICAL: For Process Dashboard, we must set processShift
        if ((call.product_type?.toLowerCase() || '').includes('process') || call.product_type === 'ERC-PROCESS MATERIAL') {
          sessionStorage.setItem('processShift', shiftOfInspection);
          if (typeof setProcessShift === 'function') setProcessShift(shiftOfInspection);
        }
        // console.log('💾 Stored shift/date in sessionStorage and context');
      }

      // Navigate directly to dashboard based on product type
      const productType = call.product_type;
      // console.log('🚀 Navigating to dashboard for product type:', productType);
      // console.log('📞 Call object:', call);
      // console.log('🔧 setSelectedCall function:', typeof setSelectedCall);
      // console.log('🔧 setCurrentPage function:', typeof setCurrentPage);

      // Set the selected call first
      setSelectedCall(call);
      if (typeof setContextSelectedCalls === 'function') {
        setContextSelectedCalls([call]);
      }
      // console.log('✅ setSelectedCall called');

      // Then navigate based on product type (handle both formats)
      const productTypeLower = productType?.toLowerCase() || '';

      if (productTypeLower.includes('raw') || productType === 'ERC-RAW MATERIAL') {
        // console.log('➡️ Calling setCurrentPage("rm-dashboard")');
        setCurrentPage('rm-dashboard');
        // console.log('✅ setCurrentPage called for rm-dashboard');
      } else if (productTypeLower.includes('process') || productType === 'ERC-PROCESS MATERIAL') {
        // console.log('➡️ Calling setCurrentPage("process-dashboard")');
        setCurrentPage('process-dashboard');
        // console.log('✅ setCurrentPage called for process-dashboard');
      } else if (productTypeLower.includes('final') || productType === 'ERC-FINAL PRODUCT') {
        // console.log('➡️ Calling setCurrentPage("final-dashboard")');
        setCurrentPage('final-dashboard');
        // console.log('✅ setCurrentPage called for final-dashboard');
      } else {
        // console.error('❌ Unknown product type:', productType);
      }
      return;
    }

    // console.log('🆕 START flow - routing immediately to initiation page');

    // Route immediately to inspection initiation page
    // All validations and API calls will happen in the background
    onStartInspection(call);

    // Perform validations and API calls in the background (non-blocking)
    // This ensures the UI routes immediately without waiting for async operations
    if (call.status === 'IE_SCHEDULED') {
      // Run background validation and API call asynchronously
      (async () => {
        try {
          // For Raw Material and Final calls, ensure scheduled date equals today's date before starting
          const productTypeLowerCheck = (call.product_type || '').toString().toLowerCase();
          const requiresScheduleToday = productTypeLowerCheck.includes('raw') || productTypeLowerCheck.includes('final');
          if (requiresScheduleToday) {
            try {
              const existingSchedule = await getScheduleByCallNo(call.call_no);
              const scheduledDate = existingSchedule?.scheduleDate || existingSchedule?.schedule_date || null;
              const today = new Date().toISOString().split('T')[0];
              if (!scheduledDate) {
                showNotification('This call is not scheduled. Please schedule it before starting.', 'error');
                return;
              }
              if (scheduledDate !== today) {
                showNotification(`This call is scheduled for ${scheduledDate}. Start is only allowed on the scheduled date (${today}).`, 'error');
                return;
              }
            } catch (schedErr) {
              console.error('Error fetching schedule for start validation', schedErr);
              // Don't show error notification for background validation
              return;
            }
          }
          const currentUser = getStoredUser();
          const userId = currentUser?.userId || 0;

          const actionData = {
            workflowTransitionId: call.workflowTransitionId || call.id,
            requestId: call.call_no,
            action: 'INITIATE_INSPECTION',
            remarks: 'Starting inspection',
            actionBy: userId,
            pincode: '560001'
          };

          await performTransitionAction(actionData);
          // console.log('✅ Inspection initiated successfully in background');

          // Refresh the pending calls list (force refresh to get updated status)
          fetchPendingData(true);
        } catch (error) {
          // console.error('Background API error:', error);
          // Don't show error notification for background operations
        }
      })();
    }
  };

  // Handle Enter Shift Details button - for PAUSE_INSPECTION_RESUME_NEXT_DAY status
  const handleEnterShiftDetails = (call, isResume = false) => {
    // console.log('🔍 handleEnterShiftDetails called for:', call.call_no, 'isResume:', isResume);
    // console.log('🔍 Call status:', call.status);

    // Show the shift details modal
    setShiftDetailsCall(call);
    setIsResumeFromShiftModal(isResume);
    setShiftDetailsShift('');
    setShiftDetailsDate(new Date().toISOString().split('T')[0]);
    setShiftDetailsError('');
    setShowEnterShiftDetailsModal(true);
  };

  // Handle Enter Shift Details modal confirm
  const handleEnterShiftDetailsConfirm = async () => {
    if (!shiftDetailsShift) {
      setShiftDetailsError('Please select a shift');
      return;
    }

    if (!shiftDetailsDate) {
      setShiftDetailsError('Please select a date');
      return;
    }

    setIsSubmitting(true);
    try {
      // console.log('✅ Shift details confirmed:', { shift: shiftDetailsShift, date: shiftDetailsDate });

      // Get current user for actionBy field
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Map action based on whether this is a resume
      if (isResumeFromShiftModal) {
        // console.log('⏭️ Resume flow - skipping workflow API call as requested');
      } else {
        // Fetch the latest workflow transition ID for this call
        let workflowTransitionId = shiftDetailsCall?.id || shiftDetailsCall?.workflowTransitionId || null;

        try {
          const latestTransition = await fetchLatestWorkflowTransition(shiftDetailsCall?.call_no);
          if (latestTransition && latestTransition.workflowTransitionId) {
            workflowTransitionId = latestTransition.workflowTransitionId;
            // console.log(`✅ Using latest workflowTransitionId: ${workflowTransitionId} for ${shiftDetailsCall?.call_no}`);
          }
        } catch (error) {
          // console.warn('⚠️ Failed to fetch latest workflow transition, using call.id:', error);
        }

        // Call workflow API for all product types (Process/Final Product and Raw Material)
        // console.log('🔄 Calling workflow API for enter shift details...');

        // Determine the action based on call status
        // If status is INSPECTION_PAUSED, use INSPECTION_PAUSED action, otherwise use ENTER_SHIFT_DETAILS_AND_START_INSPECTION
        const action = shiftDetailsCall?.status === 'INSPECTION_PAUSED'
          ? 'INSPECTION_PAUSED'
          : 'ENTER_SHIFT_DETAILS_AND_START_INSPECTION';

        const workflowActionData = {
          workflowTransitionId: workflowTransitionId,
          requestId: shiftDetailsCall?.call_no,
          action: action,
          remarks: `Shift details entered - Shift: ${shiftDetailsShift}, Date: ${shiftDetailsDate}`,
          actionBy: userId,
          pincode: shiftDetailsCall?.pincode || '560001',
          materialAvailable: 'YES',
          shiftCode: (shiftDetailsShift || 'A').charAt(0).toUpperCase()
        };

        // console.log('Workflow Action Data:', workflowActionData);

        try {
          await performTransitionAction(workflowActionData);
          // console.log('✅ Workflow transition successful');
        } catch (workflowError) {
          console.error('❌ Workflow API error:', workflowError);
          throw new Error(workflowError.message || 'Failed to enter shift details via workflow');
        }
      }

      // Store shift and date in sessionStorage for dashboard to use
      sessionStorage.setItem('inspectionShift', shiftDetailsShift);
      sessionStorage.setItem('inspectionDate', shiftDetailsDate);

      const productType = shiftDetailsCall?.product_type;

      // CRITICAL: For Process Dashboard, we must set processShift
      if ((productType?.toLowerCase() || '').includes('process') || productType === 'ERC-PROCESS MATERIAL') {
        sessionStorage.setItem('processShift', shiftDetailsShift);
      }

      // Close modal
      setShowEnterShiftDetailsModal(false);

      // Update context if possible
      try {
        if (typeof setInspectionShift === 'function') setInspectionShift(shiftDetailsShift);
        if (typeof setInspectionDate === 'function') setInspectionDate(shiftDetailsDate);
        if (typeof setProcessShift === 'function') setProcessShift(shiftDetailsShift);
      } catch (e) {
        // console.warn('Failed to update context in handleEnterShiftDetailsConfirm:', e);
      }

      // Navigate to dashboard based on product type
      // console.log('🚀 Navigating to dashboard for product type:', productType);

      setSelectedCall(shiftDetailsCall);
      if (typeof setContextSelectedCalls === 'function') {
        setContextSelectedCalls([shiftDetailsCall]);
      }

      const productTypeLower = productType?.toLowerCase() || '';
      if (productTypeLower.includes('raw') || productType === 'ERC-RAW MATERIAL') {
        // console.log('➡️ Routing to rm-dashboard');
        setCurrentPage('rm-dashboard');
      } else if (productTypeLower.includes('process') || productType === 'ERC-PROCESS MATERIAL') {
        // console.log('➡️ Routing to process-dashboard');
        setCurrentPage('process-dashboard');
      } else if (productTypeLower.includes('final') || productType === 'ERC-FINAL PRODUCT') {
        // console.log('➡️ Routing to final-dashboard');
        setCurrentPage('final-dashboard');
      } else {
        // console.log('➡️ Routing to rm-dashboard (default)');
        setCurrentPage('rm-dashboard');
      }
    } catch (error) {
      // console.error('Error entering shift details:', error);
      setShiftDetailsError(error.message || 'Failed to enter shift details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get date options for Shift C (today and yesterday)
  const getDateOptions = () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    return [
      { value: '', label: 'Select Date' },
      { value: today.toISOString().split('T')[0], label: `${today.toLocaleDateString('en-GB')} (Today)` },
      { value: yesterday.toISOString().split('T')[0], label: `${yesterday.toLocaleDateString('en-GB')} (Yesterday)` }
    ];
  };

  const handleBulkStart = (calls, scheduleInfo) => {
    const { unscheduledCalls, scheduledCalls, refreshSchedules } = scheduleInfo || {};

    // If there are unscheduled calls, show the popup
    if (unscheduledCalls && unscheduledCalls.length > 0) {
      setUnscheduledCallsInfo({ scheduledCalls, unscheduledCalls, refreshSchedules });
      setAllSelectedForStart(calls);
      setShowUnscheduledPopup(true);
      return;
    }

    // All calls are scheduled — validate each scheduled call's date for Raw Material & Final
    const validateAndStart = async () => {
      const today = new Date().toISOString().split('T')[0];
      const blocked = [];
      const allowed = [];

      // If no scheduledCalls provided, fall back to calls param
      const toCheck = Array.isArray(scheduledCalls) && scheduledCalls.length > 0 ? scheduledCalls : calls;

      for (const c of toCheck) {
        try {
          const productTypeLower = (c.product_type || '').toString().toLowerCase();
          const requiresScheduleToday = productTypeLower.includes('raw') || productTypeLower.includes('final');
          if (!requiresScheduleToday) {
            // Process and other types may start regardless
            allowed.push(c);
            continue;
          }

          // Prefer schedule info passed from PendingCallsTab (c may include scheduleInfo)
          const existingSchedule = c.scheduleInfo || (await getScheduleByCallNo(c.call_no));
          const scheduledDateRaw = existingSchedule?.scheduleDate || existingSchedule?.schedule_date || null;
          const scheduledDate = normalizeToYMD(scheduledDateRaw);
          if (!scheduledDate) {
            blocked.push({ call: c, reason: 'Not scheduled' });
            continue;
          }

          // Block if scheduled date is after today (future schedule)
          if (new Date(scheduledDate) > new Date(today)) {
            blocked.push({ call: c, reason: `Scheduled for ${scheduledDateRaw || scheduledDate}` });
            continue;
          }

          allowed.push(c);
        } catch (err) {
          // console.error('Error validating schedule for bulk start', c.call_no, err);
          blocked.push({ call: c, reason: 'Schedule verification failed' });
        }
      }

      if (blocked.length > 0) {
        const msgs = blocked.map(b => `${b.call.call_no} (${b.call.product_type || 'Unknown'}): ${b.reason}`);
        showNotification(`Some calls cannot be started:\n${msgs.join('\n')}`, 'error');
      }

      if (allowed.length > 0) {
        onStartMultipleInspections(allowed);
      } else {
        showNotification('No scheduled calls eligible to start. Please check schedules.', 'warning');
      }
    };

    validateAndStart();
  };

  // Handle scheduling from unscheduled popup
  const handleScheduleFromPopup = (callToSchedule) => {
    setSelectedCallLocal(callToSchedule);
    setSelectedCalls([callToSchedule]);
    setIsBulkSchedule(false);
    setIsReschedule(false);
    setPreviousSchedule(null);
    setScheduleDate('');
    setRemarks('');
    setRefreshCallback(() => unscheduledCallsInfo.refreshSchedules);
    setShowScheduleModal(true);
  };

  // Handle scheduling all unscheduled from popup
  const handleScheduleAllFromPopup = () => {
    setSelectedCalls(unscheduledCallsInfo.unscheduledCalls);
    setIsBulkSchedule(true);
    setIsReschedule(false);
    setPreviousSchedule(null);
    setScheduleDate('');
    setRemarks('');
    setRefreshCallback(() => unscheduledCallsInfo.refreshSchedules);
    setShowUnscheduledPopup(false);
    setShowScheduleModal(true);
  };

  // Proceed with all scheduled calls (ignore unscheduled)
  const handleProceedWithScheduledOnly = () => {
    if (unscheduledCallsInfo.scheduledCalls.length > 0) {
      setShowUnscheduledPopup(false);
      onStartMultipleInspections(unscheduledCallsInfo.scheduledCalls);
    } else {
      showNotification('No scheduled calls to start. Please schedule the calls first.', 'error');
    }
  };

  // Billing Stage Handlers
  const handleRaiseBill = async (call) => {
    // TODO: Open modal to collect bill details
    const billNo = `BILL-${Date.now()}`;
    const billDate = new Date().toISOString().split('T')[0];
    const billAmount = call.call_qty * call.rate;

    try {
      await raiseBill({
        callNo: call.call_no,
        billNo,
        billDate,
        billAmount,
        createdBy: getStoredUser()?.userName || 'System'
      });
      showNotification('Bill raised successfully!', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to raise bill', 'error');
    }
  };

  const handleUpdateBillingStatus = async (call, newStatus) => {
    try {
      await updateBillingStatus({
        callNo: call.call_no,
        billing_status: newStatus,
        updatedBy: getStoredUser()?.userName || 'System'
      });
      showNotification(`Status updated to "${newStatus}"`, 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to update status', 'error');
    }
  };

  const handleApprovePayment = async (call) => {
    try {
      await approvePayment({
        callNo: call.call_no,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentRef: `PAY-${Date.now()}`,
        approvedBy: getStoredUser()?.userName || 'System'
      });
      showNotification('Payment approved! Call moved to Completed.', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to approve payment', 'error');
    }
  };

  return (
    <div>
      {/* In-app Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        autoClose={true}
        autoCloseDelay={5000}
        onClose={() => setNotification({ message: '', type: 'error' })}
      />

      {/* <div className="breadcrumb">
        <div className="breadcrumb-item breadcrumb-active">Landing Page</div>
      </div> */}

      <h1 style={{ marginBottom: 'var(--space-24)' }}>IE Dashboard</h1>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. List of Calls Pending - Combined: Real RM calls + Mock Process/Final calls */}
      {activeTab === 'pending' && (
        <PendingCallsTab
          calls={combinedPendingCalls}
          onSchedule={handleSchedule}
          onReschedule={handleReschedule}
          onStart={handleStart}
          onBulkSchedule={handleBulkSchedule}
          onBulkStart={handleBulkStart}
          onEnterShiftDetails={handleEnterShiftDetails}
          isLoading={isLoading}
          selectionResetKey={selectionResetKey}
        />
      )}

      {/* 2. Issuance of IC - Second */}
      {activeTab === 'certificates' && (
        <IssuanceOfICTab
          calls={completedCalls}
          setSelectedCall={setSelectedCall}
          setCurrentPage={setCurrentPage}
        />
      )}

      {/* 3. Billing Stage - Third */}
      {activeTab === 'billing' && (
        <BillingStageTab
          calls={MOCK_INSPECTION_CALLS}
          onRaiseBill={handleRaiseBill}
          onUpdateStatus={handleUpdateBillingStatus}
          onApprovePayment={handleApprovePayment}
        />
      )}

      {/* 4. Calls Completed - Fourth */}
      {activeTab === 'completed' && (
        <CompletedCallsTab calls={MOCK_INSPECTION_CALLS} />
      )}

      {/* 5. Performance - Fifth (Last) */}
      {activeTab === 'performance' && (
        <PerformanceDashboard />
      )}

      <Modal
        isOpen={showScheduleModal}
        onClose={() => !isSubmitting && setShowScheduleModal(false)}
        title={isBulkSchedule
          ? `Schedule ${selectedCalls.length} Inspection Calls`
          : isReschedule
            ? "Reschedule Inspection"
            : "Schedule Inspection"}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowScheduleModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleScheduleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm'}
            </button>
          </>
        }
      >
        {isBulkSchedule && (
          <>
            {/* Already Scheduled Calls - Show first for reference */}
            {alreadyScheduledCallsInfo.length > 0 && (
              <div style={{
                marginBottom: 'var(--space-16)',
                padding: 'var(--space-12)',
                background: '#ecfdf5',
                borderRadius: 'var(--radius-base)',
                border: '1px solid #10b981'
              }}>
                <div style={{ fontWeight: '600', marginBottom: 'var(--space-12)', color: '#059669' }}>
                  ✓ Already Scheduled ({alreadyScheduledCallsInfo.length})
                </div>
                {alreadyScheduledCallsInfo.map((call, idx) => (
                  <div
                    key={call.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-8) 0',
                      borderBottom: idx < alreadyScheduledCallsInfo.length - 1 ? '1px solid #6ee7b7' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{call.call_no}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        PO: {call.po_no}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Scheduled Date</div>
                      <div style={{ fontWeight: '500', color: '#059669' }}>
                        {call.scheduleInfo?.scheduleDate
                          ? new Date(call.scheduleInfo.scheduleDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unscheduled Calls - To be scheduled (shown below) */}
            <div style={{
              marginBottom: 'var(--space-16)',
              padding: 'var(--space-12)',
              background: '#fff8e1',
              borderRadius: 'var(--radius-base)',
              border: '1px solid #f59e0b'
            }}>
              <div style={{ fontWeight: '600', marginBottom: 'var(--space-12)', color: '#b45309' }}>
                ⚠️ Scheduling For: {selectedCalls.map(c => c.call_no).join(', ')}
              </div>
              {selectedCalls.map((call, idx) => (
                <div
                  key={call.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-8) 0',
                    borderBottom: idx < selectedCalls.length - 1 ? '1px solid #fcd34d' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{call.call_no}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      PO: {call.po_no}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Desired Date</div>
                    <div style={{ fontWeight: '500', color: '#f59e0b' }}>
                      {call.desired_inspection_date || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {!isBulkSchedule && (
          <div style={{ marginBottom: 'var(--space-16)', padding: 'var(--space-12)', background: 'var(--color-bg-1)', borderRadius: 'var(--radius-base)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600' }}>{selectedCallLocal?.call_no}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  PO: {selectedCallLocal?.po_no}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Desired Date</div>
                <div style={{ fontWeight: '500', color: '#f59e0b' }}>
                  {selectedCallLocal?.desired_inspection_date || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show previous schedule info when rescheduling */}
        {isReschedule && previousSchedule && (
          <div style={{
            marginBottom: 'var(--space-16)',
            padding: 'var(--space-12)',
            background: '#fff8e1',
            borderRadius: 'var(--radius-base)',
            border: '1px solid #ffcc02'
          }}>
            <div style={{ fontWeight: '600', marginBottom: 'var(--space-8)', color: '#b8860b' }}>
              Previous Schedule Details
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-24)', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Scheduled Date:
                </span>
                <div style={{ fontWeight: '500' }}>
                  {previousSchedule.scheduleDate
                    ? new Date(previousSchedule.scheduleDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                    : '-'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Previous Remark:
                </span>
                <div style={{ fontWeight: '500' }}>
                  {previousSchedule.reason || '-'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label required">
            {isReschedule ? 'New Schedule Date' : 'Schedule Date'}
            {isBulkSchedule && selectedCalls.length > 0 && (
              <span style={{ fontWeight: 'normal', color: '#b45309', marginLeft: '8px' }}>
                for {selectedCalls.map(c => c.call_no).join(', ')}
              </span>
            )}
            {!isBulkSchedule && selectedCallLocal && (
              <span style={{ fontWeight: 'normal', color: '#b45309', marginLeft: '8px' }}>
                for {selectedCallLocal.call_no}
              </span>
            )}
          </label>
          <input
            type="date"
            className="form-control"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            disabled={isSubmitting}
            min={isBulkSchedule
              ? selectedCalls.reduce((maxDate, call) => {
                if (call.desired_inspection_date && call.desired_inspection_date > maxDate) {
                  return call.desired_inspection_date;
                }
                return maxDate;
              }, '')
              : (selectedCallLocal?.desired_inspection_date || '')}
          />
          <small style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {isReschedule ? 'Select new date for inspection' : 'Select the date for inspection'}
            {(isBulkSchedule ? selectedCalls[0]?.desired_inspection_date : selectedCallLocal?.desired_inspection_date) && (
              <span style={{ color: '#f59e0b', marginLeft: '8px' }}>
                (Min: {isBulkSchedule
                  ? selectedCalls.reduce((maxDate, call) => {
                    if (call.desired_inspection_date && call.desired_inspection_date > maxDate) {
                      return call.desired_inspection_date;
                    }
                    return maxDate;
                  }, selectedCalls[0]?.desired_inspection_date || '')
                  : selectedCallLocal?.desired_inspection_date})
              </span>
            )}
          </small>
        </div>
        <div className="form-group">
          <label className="form-label">{isReschedule ? 'Reason for Reschedule' : 'Remarks'}</label>
          <textarea
            className="form-control"
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={isReschedule ? "Enter reason for rescheduling..." : "Enter remarks for scheduling..."}
            disabled={isSubmitting}
          />
        </div>
      </Modal>

      {/* Unscheduled Calls Popup */}
      <Modal
        isOpen={showUnscheduledPopup}
        onClose={() => setShowUnscheduledPopup(false)}
        title="Some Calls Are Not Scheduled"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowUnscheduledPopup(false)}
            >
              Cancel
            </button>
            {unscheduledCallsInfo.scheduledCalls.length > 0 && (
              <button
                className="btn btn-outline"
                onClick={handleProceedWithScheduledOnly}
              >
                Start with Scheduled Only ({unscheduledCallsInfo.scheduledCalls.length})
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleScheduleAllFromPopup}
            >
              Schedule All ({unscheduledCallsInfo.unscheduledCalls.length})
            </button>
          </div>
        }
      >
        <div style={{ marginBottom: 'var(--space-16)' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-16)' }}>
            The following calls need to be scheduled before starting inspection:
          </p>

          {/* Unscheduled Calls List */}
          <div style={{
            background: '#fff8e1',
            padding: 'var(--space-16)',
            borderRadius: 'var(--radius-base)',
            border: '1px solid #f59e0b',
            marginBottom: 'var(--space-16)'
          }}>
            <div style={{ fontWeight: '600', marginBottom: 'var(--space-12)', color: '#b45309' }}>
              ⚠️ Unscheduled Calls ({unscheduledCallsInfo.unscheduledCalls.length})
            </div>
            {unscheduledCallsInfo.unscheduledCalls.map((call, idx) => (
              <div
                key={call.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-8) 0',
                  borderBottom: idx < unscheduledCallsInfo.unscheduledCalls.length - 1 ? '1px solid #fcd34d' : 'none'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{call.call_no}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    PO: {call.po_no} | Desired: {call.desired_inspection_date || 'N/A'}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleScheduleFromPopup(call)}
                >
                  Schedule
                </button>
              </div>
            ))}
          </div>

          {/* Scheduled Calls List */}
          {unscheduledCallsInfo.scheduledCalls.length > 0 && (
            <div style={{
              background: '#ecfdf5',
              padding: 'var(--space-16)',
              borderRadius: 'var(--radius-base)',
              border: '1px solid #10b981'
            }}>
              <div style={{ fontWeight: '600', marginBottom: 'var(--space-12)', color: '#059669' }}>
                ✓ Scheduled Calls ({unscheduledCallsInfo.scheduledCalls.length})
              </div>
              {unscheduledCallsInfo.scheduledCalls.map((call, idx) => (
                <div
                  key={call.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-8) 0',
                    borderBottom: idx < unscheduledCallsInfo.scheduledCalls.length - 1 ? '1px solid #6ee7b7' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{call.call_no}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      PO: {call.po_no}
                    </div>
                  </div>
                  <span style={{ color: '#059669', fontWeight: '500' }}>Ready</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Enter Shift Details Modal */}
      <Modal
        isOpen={showEnterShiftDetailsModal}
        onClose={() => !isSubmitting && setShowEnterShiftDetailsModal(false)}
        title={`Enter Shift Details - ${shiftDetailsCall?.call_no}`}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEnterShiftDetailsModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEnterShiftDetailsConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Confirming...' : 'Confirm'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          {shiftDetailsError && (
            <div style={{
              padding: 'var(--space-12)',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: 'var(--radius-base)',
              fontSize: '14px'
            }}>
              {shiftDetailsError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label required">
              Shift of Inspection
            </label>
            <select
              className="form-control"
              value={shiftDetailsShift}
              onChange={(e) => {
                setShiftDetailsShift(e.target.value);
                setShiftDetailsError('');
                if (e.target.value && e.target.value !== 'C') {
                  setShiftDetailsDate(new Date().toISOString().split('T')[0]);
                }
              }}
            >
              <option value="">Select Shift</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">
              Date of Inspection
            </label>
            {shiftDetailsShift === 'C' ? (
              <select
                className="form-control"
                value={shiftDetailsDate}
                onChange={(e) => {
                  setShiftDetailsDate(e.target.value);
                  setShiftDetailsError('');
                }}
              >
                {getDateOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-control"
                value={shiftDetailsDate ? new Date(shiftDetailsDate).toLocaleDateString('en-GB') : ''}
                disabled
              />
            )}
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
              {shiftDetailsShift === 'C' ? 'Shift C: Select today or yesterday' : 'Auto-set to today for shifts A, B, General'}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IELandingPage;
