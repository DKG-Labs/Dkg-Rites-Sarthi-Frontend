import React, { useState, useMemo, useEffect, useRef } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate, getCallDateFromCallNo } from '../utils/helpers';
import { createStageValidationHandler } from '../utils/stageValidation';
import { getAllSchedules } from '../services/scheduleService';
import { isCallPaused, isCallInitiated } from '../services/callStatusService';
import { getAvailableActions, shouldShowScheduleDate, API_STATUS, getDetailedStatus } from '../utils/statusMapper';
import AnnexureLoader from './annexures/AnnexureLoader';
import PendingCallDetailsModal from './PendingCallDetailsModal';

/**
 * The IBS case number starts with the RIO letter (E25100017 → ERIO). An IE may act only on calls of
 * their own RIO: ERIO → case must start with E. Returns null when allowed (or when there is nothing
 * to compare: no case number yet / no RIO stored for the user), otherwise the details for the message.
 */
const RIO_NAMES = { N: 'NRIO', E: 'ERIO', W: 'WRIO', S: 'SRIO', C: 'CRIO' };
const getCaseRioMismatch = (row) => {
  let ieRio = '';
  try { ieRio = (localStorage.getItem('rio') || '').trim().toUpperCase(); } catch (e) { ieRio = ''; }
  const caseNo = String(row?.ibsCaseNo || row?.ibs_case_no || row?.caseNo || row?.case_no || '').trim().toUpperCase();
  if (!ieRio || !caseNo || caseNo === '-') return null;
  const ieLetter = ieRio.charAt(0);
  const caseLetter = caseNo.charAt(0);
  if (!/[A-Z]/.test(caseLetter) || caseLetter === ieLetter) return null;
  return { ieRio, caseNo, caseRio: RIO_NAMES[caseLetter] || `${caseLetter} region` };
};

// Responsive styles for mobile
const responsiveStyles = `
  @media (max-width: 768px) {
    .pending-calls-dashboard-cards {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
    }
    .pending-calls-dashboard-card {
      min-width: unset !important;
      padding: 12px 8px !important;
    }
    .pending-calls-dashboard-card .card-icon {
      font-size: 24px !important;
    }
    .pending-calls-dashboard-card .card-number {
      font-size: 22px !important;
    }
    .pending-calls-dashboard-card .card-label {
      font-size: 10px !important;
    }
    .pending-calls-filter-chips {
      padding: 10px 12px !important;
    }
    .pending-calls-filter-chips-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
    .pending-calls-filter-chip {
      padding: 5px 8px !important;
      font-size: 11px !important;
    }
    .pending-calls-filter-modal {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      border-radius: 0 !important;
      top: 0 !important;
      left: 0 !important;
      transform: none !important;
    }
    .pending-calls-filter-modal-content {
      flex-direction: column !important;
    }
    .pending-calls-filter-modal-sidebar {
      width: 100% !important;
      border-right: none !important;
      border-bottom: 1px solid #e5e7eb !important;
      display: flex !important;
      flex-wrap: wrap !important;
      padding: 8px !important;
      gap: 6px !important;
    }
    .pending-calls-filter-modal-sidebar > div {
      padding: 8px 12px !important;
      border-radius: 20px !important;
      border: 1px solid #e5e7eb !important;
      border-left: none !important;
      white-space: nowrap !important;
    }
    .pending-calls-filter-modal-options {
      padding: 12px 16px !important;
    }
    .pending-calls-table-container {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    .pending-calls-bulk-actions {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
      padding: 12px !important;
    }
    .pending-calls-bulk-actions-buttons {
      flex-direction: column !important;
      gap: 8px !important;
    }
    .pending-calls-bulk-actions-buttons button {
      width: 100% !important;
      min-height: 44px !important;
    }
    .pending-calls-filter-toggle {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
  }

  @media (max-width: 480px) {
    .pending-calls-dashboard-cards {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .pending-calls-dashboard-card {
      padding: 10px 6px !important;
    }
    .pending-calls-dashboard-card .card-icon {
      font-size: 20px !important;
    }
    .pending-calls-dashboard-card .card-number {
      font-size: 18px !important;
    }
    .pending-calls-dashboard-card .card-label {
      font-size: 9px !important;
    }
  }
`;

const getNormalizedCallType = (call) => {
  if (!call) return '';
  const pt = String(call.product_type || call.stage || '').toUpperCase().trim();
  if (pt.includes('RAW') || pt === 'RM' || pt === 'ER') return 'Raw Material';
  if (pt.includes('PROCESS') || pt === 'EP' || pt === 'P') return 'Process';
  if (pt.includes('FINAL') || pt === 'EF' || pt === 'F') return 'Final';

  const callNo = String(call.call_no || '').toUpperCase().trim();
  if (callNo.startsWith('ER-') || callNo.startsWith('ER_')) return 'Raw Material';
  if (callNo.startsWith('EP-') || callNo.startsWith('EP_')) return 'Process';
  if (callNo.startsWith('EF-') || callNo.startsWith('EF_')) return 'Final';
  return '';
};

// Line icons for the filter popup (replace the emoji icons)
const FILTER_ICON_PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9" y2="6.01" /><line x1="15" y1="6" x2="15" y2="6.01" /><line x1="9" y1="10" x2="9" y2="10.01" /><line x1="15" y1="10" x2="15" y2="10.01" /><line x1="9" y1="14" x2="9" y2="14.01" /><line x1="15" y1="14" x2="15" y2="14.01" /><path d="M10 22v-4h4v4" /></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>
};
const FIcon = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    {FILTER_ICON_PATHS[name]}
  </svg>
);

// Styled replacement for the native <select> (its option list can't be styled by the browser)
const CALL_TYPE_OPTIONS = [
  { value: '', label: 'All Call Types' },
  { value: 'Raw Material', label: 'Raw Material' },
  { value: 'Process', label: 'Process' },
  { value: 'Final', label: 'Final' }
];

const CallTypeSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = CALL_TYPE_OPTIONS.find(o => o.value === (value || '')) || CALL_TYPE_OPTIONS[0];

  return (
    <div ref={ref} className="ct-select">
      <button
        type="button"
        aria-label="Filter by Type of Call"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`ct-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{current.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ct-select-chevron">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {open && (
        <ul role="listbox" className="ct-select-menu">
          {CALL_TYPE_OPTIONS.map(o => {
            const selected = o.value === (value || '');
            return (
              <li
                key={o.label}
                role="option"
                aria-selected={selected}
                className={`ct-select-option ${selected ? 'selected' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                <span>{o.label}</span>
                {selected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const PendingCallsTab = ({ calls, onSchedule, onReschedule, onStart, onBulkSchedule, onBulkStart, onEnterShiftDetails, isLoading = false, selectionResetKey = 0 }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Call Number');
  const [selectionError, setSelectionError] = useState('');
  const [scheduledCalls, setScheduledCalls] = useState({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCallForView, setSelectedCallForView] = useState(null);
  const [selectedCallActions, setSelectedCallActions] = useState([]);
  const [filters, setFilters] = useState({
    productTypes: [],
    vendors: [],
    dateFrom: '',
    dateTo: '',
    poNumbers: [],
    statuses: [],
    stage: '',
    callType: '',
    callNumbers: []
  });

  // Fetch all scheduled calls on component mount
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const schedules = await getAllSchedules();
        const scheduleMap = {};
        schedules.forEach(schedule => {
          scheduleMap[schedule.callNo] = schedule;
        });
        setScheduledCalls(scheduleMap);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      }
    };
    fetchSchedules();
  }, []);

  // Use all calls directly - filtering by assignedToUser is done in workflowService
  const pendingCalls = calls;

  // Calls for which vendor name should be hidden in the table (UI-only masking)
  const HIDE_VENDOR_FOR_CALLS = new Set(['IC1201', 'IC1202']);

  // Extract unique values for filter dropdowns
  const uniqueProductTypes = [...new Set(pendingCalls.map(c => c.product_type))];
  const uniqueVendors = [...new Set(pendingCalls.map(c => c.vendor_name))].sort();
  const uniquePONumbers = [...new Set(pendingCalls.map(c => c.po_no))].sort();

  // Apply filters to data
  const filteredCalls = useMemo(() => {
    let result = pendingCalls.filter(call => {
      const s = (call.status || '').toUpperCase();
      return !s.includes('CANCELLED');
    });

    // Product Type filter
    if (filters.productTypes.length > 0) {
      result = result.filter(call => filters.productTypes.includes(call.product_type));
    }

    // Vendor filter
    if (filters.vendors.length > 0) {
      result = result.filter(call => filters.vendors.includes(call.vendor_name));
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter(call => new Date(call.requested_date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(call => new Date(call.requested_date) <= new Date(filters.dateTo));
    }

    // PO Number filter (multi-select)
    if (filters.poNumbers.length > 0) {
      result = result.filter(call => filters.poNumbers.includes(call.po_no));
    }

    // Stage filter
    if (filters.stage) {
      result = result.filter(call => call.stage === filters.stage);
    }

    // Type of Call filter (Raw Material, Process, Final)
    if (filters.callType) {
      result = result.filter(call => getNormalizedCallType(call) === filters.callType);
    }

    // Call Number filter (multi-select)
    if (filters.callNumbers.length > 0) {
      result = result.filter(call => filters.callNumbers.includes(call.call_no));
    }

    if (globalSearchTerm) {
      const lowerSearch = globalSearchTerm.toLowerCase();
      result = result.filter(call =>
        (call.call_no && call.call_no.toLowerCase().includes(lowerSearch)) ||
        (call.po_no && call.po_no.toLowerCase().includes(lowerSearch)) ||
        (call.vendor_name && call.vendor_name.toLowerCase().includes(lowerSearch))
      );
    }

    return result;
  }, [pendingCalls, filters, globalSearchTerm]);

  // (removed unused `uniqueStages` and `activeFilterCount` to satisfy CI lint rules)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      productTypes: [],
      vendors: [],
      dateFrom: '',
      dateTo: '',
      poNumbers: [],
      statuses: [],
      stage: '',
      callType: '',
      callNumbers: []
    });
  };

  // removeFilter helper removed (unused in current UI)

  // Helper to get scheduled date for a call
  const getScheduledDate = (callNo) => {
    const schedule = scheduledCalls[callNo];
    return schedule?.scheduleDate ? formatDate(schedule.scheduleDate) : '-';
  };

  const columns = [
    { key: 'call_no', label: 'Call No.' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'ibsCaseNo', label: 'IBS Case Number' },
    {
      key: 'vendor_name',
      label: 'Vendor Name',
      render: (val, row) => {
        const callNo = (row?.call_no || '').toString().toUpperCase();
        return HIDE_VENDOR_FOR_CALLS.has(callNo) ? '-' : (val || '-');
      }
    },
    { key: 'product_type', label: 'Product Type', render: (val) => getProductTypeDisplayName(val) },
    { key: 'call_date', label: 'Call Date', render: (val, row) => getCallDateFromCallNo(row?.call_no || row?.callNo, val) },
    { key: 'desired_inspection_date', label: 'Desired Inspection Date', render: (val) => formatDate(val) },
    {
      key: 'scheduled_date',
      label: 'Scheduled Date',
      render: (_val, row) => {
        // Check if this is a Raw Material call from API
        const isRawMaterialFromAPI = row.product_type === 'Raw Material' &&
          (row.status === 'CALL_REGISTERED' ||
            row.status === 'IE_SCHEDULED' ||
            row.status === 'VERIFY_PO_DETAILS');

        if (isRawMaterialFromAPI) {
          // For API calls, show schedule date based on status
          const apiStatus = row.status || API_STATUS.CALL_REGISTERED;
          if (shouldShowScheduleDate(apiStatus)) {
            return getScheduledDate(row.call_no);
          }
          return '-';
        } else {
          // For mock Process/Final calls, show schedule date if scheduled
          return getScheduledDate(row.call_no);
        }
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (_val, row) => {
        const isFromWorkflowAPI = row.status === 'CALL_REGISTERED' ||
          row.status === 'IE_SCHEDULED' ||
          row.status === 'VERIFY_PO_DETAILS' ||
          row.status === 'INSPECTION_COMPLETE_CONFIRM' ||
          row.status === 'ENTER_SHIFT_DETAILS_AND_START_INSPECTION' ||
          row.status === 'PAUSE_INSPECTION_RESUME_NEXT_DAY';

        let apiStatus = row.status || API_STATUS.CALL_REGISTERED;
        if (!isFromWorkflowAPI && isScheduled(row.call_no)) {
          apiStatus = 'SCHEDULED'; // mock data handling
        }
        const { mainStatus, combinedText } = getDetailedStatus(apiStatus);
        return <StatusBadge status={mainStatus} text={combinedText} />;
      }
    },
  ];

  const selectedCallsData = filteredCalls.filter(call => selectedRows.includes(call.id));

  // Handler to validate and update selection - prevents selecting calls from different stages
  const handleSelectionChange = createStageValidationHandler(
    filteredCalls,
    selectedRows,
    setSelectedRows,
    setSelectionError
  );

  // Clear selection when parent signals a reset (selectionResetKey changed)
  React.useEffect(() => {
    setSelectedRows([]);
  }, [selectionResetKey]);

  // Check if a call is scheduled
  const isScheduled = (callNo) => !!scheduledCalls[callNo];

  // Refresh schedules after scheduling/rescheduling
  const refreshSchedules = async () => {
    try {
      const schedules = await getAllSchedules();
      const scheduleMap = {};
      schedules.forEach(schedule => {
        scheduleMap[schedule.callNo] = schedule;
      });
      setScheduledCalls(scheduleMap);
    } catch (error) {
      console.error('Error refreshing schedules:', error);
    }
  };

  // Show individual actions button for each row
  // Actions are determined by API status for Raw Material, or by schedule status for mock data
  const actions = (row) => {
    // Check if this is a call from workflow API (has workflow status)
    const isFromWorkflowAPI = row.status === 'CALL_REGISTERED' ||
      row.status === 'IE_SCHEDULED' ||
      row.status === 'VERIFY_PO_DETAILS' ||
      row.status === 'INSPECTION_COMPLETE_CONFIRM' ||
      row.status === 'ENTER_SHIFT_DETAILS_AND_START_INSPECTION' ||
      row.status === 'PAUSE_INSPECTION_RESUME_NEXT_DAY' ||
      row.status === 'INSPECTION_PAUSED';

    let availableActions = [];

    if (isFromWorkflowAPI) {
      // Use new workflow for API calls
      const apiStatus = row.status || API_STATUS.CALL_REGISTERED;
      availableActions = getAvailableActions(apiStatus);
    } else {
      // Use old logic for mock Process/Final calls
      const scheduled = isScheduled(row.call_no);
      const isPausedOrUnderInspection = isCallPaused(row.call_no) || isCallInitiated(row.call_no);

      if (!scheduled) {
        availableActions = ['schedule'];
      } else {
        availableActions = ['reschedule'];
        // Show RESUME if paused/under inspection, otherwise START
        availableActions.push(isPausedOrUnderInspection ? 'resume' : 'start');
      }
    }

    if (availableActions.length === 0) {
      availableActions = ['view'];
    } else if (!availableActions.includes('view')) {
      availableActions.push('view');
    }

    // Case number of another RIO: actions are blocked for this IE
    const mismatch = getCaseRioMismatch(row);
    if (mismatch) {
      const why = `Case No. ${mismatch.caseNo} belongs to ${mismatch.caseRio}, but you are mapped to ${mismatch.ieRio}. Ask the Call Desk / CM to correct the case number or reassign this call.`;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '190px' }}>
          <button
            type="button"
            className="btn btn-sm"
            disabled
            aria-disabled="true"
            title={why}
            onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
            style={{ whiteSpace: 'nowrap', background: '#e2e8f0', color: '#94a3b8', border: '1px solid #cbd5e1', cursor: 'not-allowed' }}
          >
            🔒 VIEW ACTIONS
          </button>
          <span
            title={why}
            style={{ fontSize: '11px', lineHeight: 1.3, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 6px', whiteSpace: 'normal' }}
          >
            Case No. is of {mismatch.caseRio}; you are {mismatch.ieRio}. Actions disabled.
          </span>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
        <button
          className="btn btn-sm btn-primary"
          onClick={(e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            setSelectedCallForView(row);
            setSelectedCallActions(availableActions);
            setShowDetailsModal(true);
          }}
          style={{ whiteSpace: 'nowrap' }}
        >
          VIEW ACTIONS
        </button>
      </div>
    );
  };

  // Separate selected calls into scheduled and unscheduled
  const scheduledCallsData = selectedCallsData.filter(call => isScheduled(call.call_no));
  const unscheduledCallsData = selectedCallsData.filter(call => !isScheduled(call.call_no));

  // Enrich scheduled calls with their schedule info
  const scheduledCallsWithInfo = scheduledCallsData.map(call => ({
    ...call,
    scheduleInfo: scheduledCalls[call.call_no]
  }));

  const handleBulkSchedule = () => {
    // Pass only unscheduled calls to schedule, but also send scheduled calls info for display
    // Pass refreshSchedules so the schedule data is refreshed after successful scheduling
    onBulkSchedule(unscheduledCallsData, { scheduledCallsWithInfo, refreshSchedules });
  };

  const handleBulkStart = () => {
    // Pass scheduling info to parent for proper handling
    onBulkStart(selectedCallsData, {
      scheduledCalls: scheduledCallsWithInfo,
      unscheduledCalls: unscheduledCallsData,
      refreshSchedules
    });
    setSelectedRows([]);
  };

  /* ------------------ FILTER DRAWER (REPLACE COMMENTED BLOCK) ------------------ */
  /*
    This block is designed to live inside the same component scope where:
     - filters (object) and setFilters (setter) exist OR
     - handleFilterChange(key, value) is available
     - handleMultiSelectToggle(field, value) is available
     - clearAllFilters() is available
     - removeFilter(field, value) may be used by the UI
     - uniqueProductTypes, uniqueVendors, uniqueStages, pendingCalls (array) are available
    If any names differ in your file, either rename them here or keep using setFilters().
  */

  // canonical stage labels for UI (user-visible)
  const CANONICAL_STAGES = ['Raw Material', 'Process Material', 'Final'];

  // mapping from display label to internal data value
  const stageMapping = {
    'Raw Material': 'RM',
    'Process Material': 'Process Inspection',
    'Final': 'Final'
  };

  // Reverse mapping for display (imported from utils/stageValidation.js)

  // Make sure pendingCalls exists in this scope (it does in your app). If not, provide it.
  const effectivePendingCalls = (typeof pendingCalls !== 'undefined' && Array.isArray(pendingCalls))
    ? pendingCalls
    : (typeof window.pendingCalls !== 'undefined' ? window.pendingCalls : []);

  // helpers removed: findCallByCallNo / findCallByPONo (unused in current UI)

  // prefer to call your handler handleFilterChange if present; otherwise update filters state directly
  const safeSetFilter = (key, value) => {
    if (typeof handleFilterChange === 'function') {
      handleFilterChange(key, value);
    } else if (typeof setFilters === 'function') {
      setFilters(prev => ({ ...prev, [key]: value }));
    } else {
      // fallback: create local state (very unlikely for your app)
      console.warn('No handleFilterChange or setFilters available in this scope.');
    }
  };

  // auto-sync helpers removed (unused) to satisfy lint rules

  // helper to toggle product type checkboxes (works with your handler if present)
  const safeToggleMulti = (field, value) => {
    if (typeof handleMultiSelectToggle === 'function') {
      handleMultiSelectToggle(field, value);
    } else if (typeof setFilters === 'function') {
      setFilters(prev => {
        const arr = Array.isArray(prev[field]) ? prev[field] : [];
        const exists = arr.includes(value);
        return { ...prev, [field]: exists ? arr.filter(x => x !== value) : [...arr, value] };
      });
    }
  };

  // derived counts for right-side lists (example uses unique lists if present)
  const productTypesList = (typeof uniqueProductTypes !== 'undefined') ? uniqueProductTypes : (effectivePendingCalls.map(c => c.product_type).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i));
  const vendorsList = (typeof uniqueVendors !== 'undefined') ? uniqueVendors : (effectivePendingCalls.map(c => c.vendor).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i));
  const poSuggestions = (typeof uniquePONumbers !== 'undefined') ? uniquePONumbers : effectivePendingCalls.map(c => c.po_no || c.poNumber).filter(Boolean);

  // UI: Drawer toggle + Drawer panel
  return (
    <div>
      {/* Inject responsive styles */}
      <style>{responsiveStyles}</style>

      <div style={{ marginBottom: 'var(--space-16)' }}>
        <div className="pending-calls-filter-toggle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`pcf-toggle-btn ${showFilters ? 'open' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>Show Filters</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {/* Global Search Bar */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search by Call No., PO No., Vendor..."
                value={globalSearchTerm || ''}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  background: '#fff',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
            </div>

            {/* Type of Call Dropdown Filter */}
            <div style={{ minWidth: '170px' }}>
              <CallTypeSelect
                value={filters.callType || ''}
                onChange={(v) => {
                  handleFilterChange('callType', v);
                  setSelectedRows([]);
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Showing {typeof filteredCalls !== 'undefined' ? filteredCalls.length : effectivePendingCalls.length} of {effectivePendingCalls.length} results
          </div>
        </div>
      </div>

      {showFilters && (
        <>
          {/* Backdrop overlay */}
          <div className="pending-calls-filter-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setShowFilters(false)}
          />

          {/* Filter Modal */}
          <div className="pending-calls-filter-modal" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '85vh',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalSlideUpFade 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937'
              }}>Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >×</button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '18px'
                }}><FIcon name="search" /></span>
                <input
                  type="search"
                  placeholder="Search across filters..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="pending-calls-filter-modal-content" style={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              minHeight: 0
            }}>
              {/* LEFT: Filter Categories */}
              <div className="pending-calls-filter-modal-sidebar" style={{
                width: '140px',
                borderRight: '1px solid #e5e7eb',
                overflowY: 'auto',
                backgroundColor: '#f9fafb'
              }}>
                {['Product Type', 'Vendor', 'Stage', 'Call Number', 'PO Number', 'Date Range'].map(cat => (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: selectedCategory === cat ? '600' : '400',
                      color: selectedCategory === cat ? '#0d9488' : '#4b5563',
                      backgroundColor: selectedCategory === cat ? '#f0fdfa' : 'transparent',
                      borderLeft: selectedCategory === cat ? '3px solid #0d9488' : '3px solid transparent',
                      transition: 'all 0.2s',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== cat) {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== cat) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>

              {/* RIGHT: Options Panel */}
              <div className="pending-calls-filter-modal-options" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 24px'
              }}>
                {/* PRODUCT TYPE */}
                {selectedCategory === 'Product Type' && (
                  <div>
                    {(() => {
                      // Show only "ERC" as a single option
                      if (filterSearch && !'erc'.includes(filterSearch.toLowerCase())) {
                        return (
                          <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '14px'
                          }}>
                            No results found for "{filterSearch}"
                          </div>
                        );
                      }

                      // Check if any product type is selected (meaning ERC is selected)
                      const isERCSelected = (filters.productTypes || []).length > 0;

                      // Handler to select/deselect all product types when ERC is toggled
                      const handleERCToggle = () => {
                        if (isERCSelected) {
                          // Clear all product types
                          setFilters(prev => ({ ...prev, productTypes: [] }));
                        } else {
                          // Select all product types
                          setFilters(prev => ({ ...prev, productTypes: [...productTypesList] }));
                        }
                      };

                      return (
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            marginRight: '12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                          }} className="pcf-opt-icon"><FIcon name="box" /></div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>ERC</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isERCSelected}
                            onChange={handleERCToggle}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              accentColor: '#0d9488'
                            }}
                          />
                        </label>
                      );
                    })()}
                  </div>
                )}

                {/* VENDOR */}
                {selectedCategory === 'Vendor' && (
                  <div>
                    {vendorsList
                      .filter(vendor => {
                        if (!filterSearch) return true;
                        return vendor.toLowerCase().includes(filterSearch.toLowerCase());
                      })
                      .map(vendor => {
                        const checked = (filters.vendors || []).includes(vendor);
                        return (
                          <label
                            key={vendor}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              marginRight: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }} className="pcf-opt-icon"><FIcon name="building" /></div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>{vendor}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => safeToggleMulti('vendors', vendor)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#0d9488'
                              }}
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

                {/* STAGE */}
                {selectedCategory === 'Stage' && (
                  <div>
                    {CANONICAL_STAGES
                      .filter(stage => {
                        if (!filterSearch) return true;
                        return stage.toLowerCase().includes(filterSearch.toLowerCase());
                      })
                      .map(stage => {
                        const stageValue = stageMapping[stage];
                        const checked = filters.stage === stageValue;
                        return (
                          <label
                            key={stage}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              marginRight: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }} className="pcf-opt-icon"><FIcon name="layers" /></div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>{stage}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => safeSetFilter('stage', checked ? '' : stageValue)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#0d9488'
                              }}
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

                {/* CALL NUMBER */}
                {selectedCategory === 'Call Number' && (
                  <div>
                    {[...new Set(effectivePendingCalls.map(c => c.call_no).filter(Boolean))].sort()
                      .filter(callNo => {
                        if (!filterSearch) return true;
                        return callNo.toLowerCase().includes(filterSearch.toLowerCase());
                      })
                      .map(callNo => {
                        const checked = (filters.callNumbers || []).includes(callNo);
                        return (
                          <label
                            key={callNo}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              marginRight: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }} className="pcf-opt-icon"><FIcon name="phone" /></div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>{callNo}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleMultiSelectToggle('callNumbers', callNo)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#0d9488'
                              }}
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

                {/* PO NUMBER */}
                {selectedCategory === 'PO Number' && (
                  <div>
                    {poSuggestions
                      .filter(poNo => {
                        if (!filterSearch) return true;
                        return poNo.toLowerCase().includes(filterSearch.toLowerCase());
                      })
                      .map(poNo => {
                        const checked = (filters.poNumbers || []).includes(poNo);
                        return (
                          <label
                            key={poNo}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              marginRight: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }} className="pcf-opt-icon"><FIcon name="file" /></div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>{poNo}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleMultiSelectToggle('poNumbers', poNo)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#0d9488'
                              }}
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

                {/* DATE RANGE */}
                {selectedCategory === 'Date Range' && (
                  <div style={{ padding: '8px 0' }}>
                    {/* From Date */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          fontSize: '18px',
                          marginRight: '8px'
                        }}><FIcon name="calendar" size={16} /></span>
                        From Date
                      </label>
                      <input
                        type="date"
                        value={filters.dateFrom || ''}
                        onChange={(e) => safeSetFilter('dateFrom', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          fontSize: '18px',
                          marginRight: '8px'
                        }}><FIcon name="calendar" size={16} /></span>
                        To Date
                      </label>
                      <input
                        type="date"
                        value={filters.dateTo || ''}
                        onChange={(e) => safeSetFilter('dateTo', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  if (typeof clearAllFilters === 'function') clearAllFilters();
                  else {
                    setFilters({
                      callNumber: '',
                      poNumber: '',
                      stage: '',
                      callType: '',
                      dateFrom: '',
                      dateTo: '',
                      productTypes: [],
                      vendors: [],
                      callNumbers: [],
                      poNumbers: []
                    });
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                Clear Filter
              </button>
              <button className="pcf-apply-btn"
                onClick={() => {
                  setShowFilters(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#0d9488',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0f766e'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0d9488'}
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}



      {/* Selection Error Message */}
      <Notification
        message={selectionError}
        type="error"
        autoClose={true}
        autoCloseDelay={5000}
        onClose={() => setSelectionError('')}
      />

      {/* Bulk Action Bar */}
      {selectedRows.length > 1 && (
        <div className="pending-calls-bulk-actions" style={{
          marginBottom: 'var(--space-16)',
          padding: 'var(--space-16)',
          background: 'var(--color-bg-1)',
          borderRadius: 'var(--radius-base)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-12)'
        }}>
          <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
            {selectedRows.length} inspection calls selected
            {unscheduledCallsData.length > 0 && (
              <span style={{ color: 'var(--color-warning)', fontSize: '12px', marginLeft: '8px' }}>
                ({unscheduledCallsData.length} not scheduled)
              </span>
            )}
          </div>
          <div className="pending-calls-bulk-actions-buttons" style={{ display: 'flex', gap: 'var(--space-12)' }}>
            {/* Show SCHEDULE if any call is not scheduled */}
            {unscheduledCallsData.length > 0 && (
              <button className="btn btn-secondary" onClick={handleBulkSchedule} style={{ minHeight: '44px' }}>
                SCHEDULE ({unscheduledCallsData.length})
              </button>
            )}
            {/* Show RESCHEDULE if any call is already scheduled */}
            {scheduledCallsData.length > 0 && (
              <button className="btn btn-outline" onClick={() => onBulkSchedule(scheduledCallsData)} style={{ minHeight: '44px' }}>
                RESCHEDULE ({scheduledCallsData.length})
              </button>
            )}
            {/* Show START only if ALL calls are scheduled */}
            {unscheduledCallsData.length === 0 && (
              <button className="btn btn-primary" onClick={handleBulkStart} style={{ minHeight: '44px' }}>
                START FOR ALL
              </button>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="pending-calls-table-container">
        {isLoading ? (
          <AnnexureLoader
            title="Syncing Inspection Calls"
            subtitle="Updating your pending call list from Sarthi workflow..."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredCalls}
            actions={actions}
            selectable={false}
            selectedRows={selectedRows}
            onSelectionChange={handleSelectionChange}
            initialPageSize={10}
            hidePageSize={true}
            hideSearch={true}
          />
        )}
      </div>

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
          onSchedule(selectedCallForView, refreshSchedules);
          setShowDetailsModal(false);
        }}
        onReschedule={() => {
          onReschedule(selectedCallForView, refreshSchedules);
          setShowDetailsModal(false);
        }}
        onStart={() => {
          onStart(selectedCallForView, scheduledCalls[selectedCallForView?.call_no]);
          setShowDetailsModal(false);
        }}
        onEnterShiftDetails={(isResume) => {
          onEnterShiftDetails(selectedCallForView, isResume);
          setShowDetailsModal(false);
        }}
      />
    </div>
  );
};

export default PendingCallsTab;
