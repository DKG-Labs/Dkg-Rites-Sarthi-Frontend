import React, { useState, useMemo, useEffect } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import { createStageValidationHandler, stageReverseMapping } from '../utils/stageValidation';
import { getAllSchedules } from '../services/scheduleService';
import { getDisplayStatus, isCallPaused, isCallInitiated } from '../services/callStatusService';
import { getDisplayStatus as getDisplayStatusFromMapper, getAvailableActions, shouldShowScheduleDate, API_STATUS } from '../utils/statusMapper';

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

const PendingCallsTab = ({ calls, onSchedule, onReschedule, onStart, onBulkSchedule, onBulkStart, onEnterShiftDetails, isLoading = false, selectionResetKey = 0 }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Call Number');
  const [selectionError, setSelectionError] = useState('');
  const [scheduledCalls, setScheduledCalls] = useState({});
  const [filters, setFilters] = useState({
    productTypes: [],
    vendors: [],
    dateFrom: '',
    dateTo: '',
    poNumbers: [],
    statuses: [],
    stage: '',
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
    let result = [...pendingCalls];

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

    // Call Number filter (multi-select)
    if (filters.callNumbers.length > 0) {
      result = result.filter(call => filters.callNumbers.includes(call.call_no));
    }

    return result;
  }, [pendingCalls, filters]);

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
    {
      key: 'vendor_name',
      label: 'Vendor Name',
      render: (val, row) => {
        const callNo = (row?.call_no || '').toString().toUpperCase();
        return HIDE_VENDOR_FOR_CALLS.has(callNo) ? '-' : (val || '-');
      }
    },
    { key: 'product_type', label: 'Product Type', render: (val) => getProductTypeDisplayName(val) },
    { key: 'call_date', label: 'Call Date', render: (val) => formatDate(val) },
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
        // Check if this is a call from workflow API (has workflow status)
        // Check for workflow statuses instead of product type to be more reliable
        const isFromWorkflowAPI = row.status === 'CALL_REGISTERED' ||
          row.status === 'IE_SCHEDULED' ||
          row.status === 'VERIFY_PO_DETAILS' ||
          row.status === 'INSPECTION_COMPLETE_CONFIRM' ||
          row.status === 'ENTER_SHIFT_DETAILS_AND_START_INSPECTION' ||
          row.status === 'PAUSE_INSPECTION_RESUME_NEXT_DAY';

        let displayStatus;
        if (isFromWorkflowAPI) {
          // Apply status mapper for API calls (maps IE_SCHEDULED -> Scheduled, etc.)
          const apiStatus = row.status || API_STATUS.CALL_REGISTERED;
          displayStatus = getDisplayStatusFromMapper(apiStatus);
        } else {
          // For mock Process/Final calls, use callStatusService logic
          displayStatus = getDisplayStatus(row.call_no, isScheduled(row.call_no));
        }

        return <StatusBadge status={displayStatus} />;
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

  // Show individual actions only when exactly one row is selected
  // Actions are determined by API status for Raw Material, or by schedule status for mock data
  const actions = selectedRows.length === 1 ? (row) => {
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

    // No actions if none are available
    if (availableActions.length === 0) {
      return null;
    }

    return selectedRows.includes(row.id) ? (
      <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
        {availableActions.includes('schedule') && (
          <button className="btn btn-sm btn-secondary" onClick={() => onSchedule(row, refreshSchedules)}>
            SCHEDULE
          </button>
        )}
        {availableActions.includes('reschedule') && (
          <button className="btn btn-sm btn-secondary" onClick={() => onReschedule(row, refreshSchedules)}>
            RESCHEDULE
          </button>
        )}
        {availableActions.includes('start') && (
          <button className="btn btn-sm btn-primary" onClick={() => onStart(row, scheduledCalls[row.call_no])}>
            START
          </button>
        )}
        {availableActions.includes('resume') && (
          <button className="btn btn-sm btn-primary" onClick={() => onEnterShiftDetails(row, true)}>
            RESUME
          </button>
        )}
        {availableActions.includes('enterShiftDetails') && (
          <button className="btn btn-sm btn-primary" onClick={() => onEnterShiftDetails(row)}>
            ENTER SHIFT DETAILS
          </button>
        )}
      </div>
    ) : null;
  } : null;

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

      {/* Active Filters Display */}
      {(() => {
        const activeFilters = [];

        // Stage filter
        if (filters.stage) {
          const stageColors = { 'RM': '#f59e0b', 'Process Inspection': '#3b82f6', 'Final': '#9333ea' };
          activeFilters.push({
            key: 'stage',
            label: 'Stage',
            value: stageReverseMapping[filters.stage] || filters.stage,
            color: stageColors[filters.stage] || '#6b7280',
            onRemove: () => handleFilterChange('stage', '')
          });
        }

        // Product Types filter (multi-select)
        filters.productTypes.forEach(pt => {
          // Display just "ERC" for all product types
          activeFilters.push({
            key: `productType-${pt}`,
            label: 'Product Type',
            value: 'ERC',
            color: '#10b981',
            onRemove: () => handleMultiSelectToggle('productTypes', pt)
          });
        });

        // Vendors filter (multi-select)
        filters.vendors.forEach(vendor => {
          activeFilters.push({
            key: `vendor-${vendor}`,
            label: 'Vendor',
            value: vendor,
            color: '#0ea5e9',
            onRemove: () => handleMultiSelectToggle('vendors', vendor)
          });
        });

        // Call Number filter (multi-select)
        filters.callNumbers.forEach(callNo => {
          activeFilters.push({
            key: `callNumber-${callNo}`,
            label: 'Call No',
            value: callNo,
            color: '#8b5cf6',
            onRemove: () => handleMultiSelectToggle('callNumbers', callNo)
          });
        });

        // PO Number filter (multi-select)
        filters.poNumbers.forEach(poNo => {
          activeFilters.push({
            key: `poNumber-${poNo}`,
            label: 'PO No',
            value: poNo,
            color: '#ec4899',
            onRemove: () => handleMultiSelectToggle('poNumbers', poNo)
          });
        });

        // Date Range filter
        if (filters.dateFrom || filters.dateTo) {
          const fromDate = filters.dateFrom || 'Start';
          const toDate = filters.dateTo || 'End';
          activeFilters.push({
            key: 'dateRange',
            label: 'Date',
            value: `${fromDate} to ${toDate}`,
            color: '#f97316',
            onRemove: () => {
              handleFilterChange('dateFrom', '');
              handleFilterChange('dateTo', '');
            }
          });
        }

        if (activeFilters.length === 0) return null;

        return (
          <div className="pending-calls-filter-chips" style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div className="pending-calls-filter-chips-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Active Filters ({activeFilters.length})
              </span>
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                  minHeight: '36px'
                }}
                onMouseOver={(e) => e.target.style.background = '#fef2f2'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                Clear All ×
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {activeFilters.map(filter => (
                <div
                  className="pending-calls-filter-chip"
                  key={filter.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    backgroundColor: 'white',
                    border: `1px solid ${filter.color}40`,
                    borderRadius: '20px',
                    fontSize: '12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: filter.color,
                    flexShrink: 0
                  }} />
                  <span style={{ color: '#6b7280', fontWeight: '500', whiteSpace: 'nowrap' }}>{filter.label}:</span>
                  <span style={{ color: '#1f2937', fontWeight: '600', wordBreak: 'break-word' }}>{filter.value}</span>
                  <button
                    onClick={filter.onRemove}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      padding: '0 2px',
                      fontSize: '14px',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      minWidth: '22px',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#fee2e2';
                      e.target.style.color = '#dc2626';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'none';
                      e.target.style.color = '#9ca3af';
                    }}
                    title={`Remove ${filter.label} filter`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div style={{ marginBottom: 'var(--space-16)' }}>
        <div className="pending-calls-filter-toggle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-12)' }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-8)', minHeight: '44px' }}
          >
            <span style={{ transform: showFilters ? 'rotate(180deg)' : 'none' }}>▾</span>
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Showing {typeof filteredCalls !== 'undefined' ? filteredCalls.length : effectivePendingCalls.length} of {effectivePendingCalls.length} results
          </div>
        </div>
      </div>

      {showFilters && (
        <>
          {/* Backdrop overlay */}
          <div
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
            animation: 'slideUp 0.3s ease-out'
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
                }}>🔍</span>
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
                      color: selectedCategory === cat ? '#16a34a' : '#4b5563',
                      backgroundColor: selectedCategory === cat ? '#f0fdf4' : 'transparent',
                      borderLeft: selectedCategory === cat ? '3px solid #16a34a' : '3px solid transparent',
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
                          }}>📦</div>
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
                              accentColor: '#16a34a'
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
                            }}>🏢</div>
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
                                accentColor: '#16a34a'
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
                            }}>⚙️</div>
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
                                accentColor: '#16a34a'
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
                            }}>📞</div>
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
                                accentColor: '#16a34a'
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
                            }}>📄</div>
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
                                accentColor: '#16a34a'
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
                        }}>📅</span>
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
                        onFocus={(e) => e.target.style.borderColor = '#16a34a'}
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
                        }}>📅</span>
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
                        onFocus={(e) => e.target.style.borderColor = '#16a34a'}
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
                      dateFrom: '',
                      dateTo: '',
                      productTypes: [],
                      vendors: []
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
              <button
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
                  backgroundColor: '#16a34a',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--space-48)',
            gap: 'var(--space-16)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Loading inspection calls
            </span>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
              This may take a few seconds
            </span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredCalls}
            actions={actions}
            selectable={true}
            selectedRows={selectedRows}
            onSelectionChange={handleSelectionChange}
            initialPageSize={10}
            hidePageSize={true}
          />
        )}
      </div>
    </div>
  );
};

export default PendingCallsTab;
