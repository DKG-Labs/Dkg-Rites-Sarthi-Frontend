/* eslint-disable unicode-bom */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { formatDate, getHourLabels } from '../utils/helpers';
import { getAllProcessData, saveToLocalStorage, loadFromLocalStorage, loadGridDataForLine } from '../services/processLocalStorageService';
import { fetchProcessInitiationData } from '../services/processInitiationDataService';
import { markAsWithheld } from '../services/callStatusService';
import { fetchPendingWorkflowTransitions, performTransitionAction, fetchLatestWorkflowTransition } from '../services/workflowService';
import { getStoredUser } from '../services/authService';
import { cleanVendorName } from '../services/poDataService';
import { processVendorName } from '../utils/vendorMapper';
import { getQuantitySummary, getPoSerialNumberByCallId, getManufacturedQtyOfPo, finishProcessInspection, pauseProcessInspection } from '../services/processMaterialService';
import InspectionInitiationFormContent from '../components/InspectionInitiationFormContent';
import Notification from '../components/Notification';
import { resetSessionControl } from '../utils/inspectionSessionControl';
import { performInspectionCleanup } from '../utils/inspectionCleanup';
import { buildLineMapping, validateLineNumber } from '../utils/lineMapping';
import { transformLineDataForBackend } from '../utils/payloadTransformers';
import AddNewCallModal from '../components/AddNewCallModal';
import ResumeCallModal from '../components/ResumeCallModal';
import Modal from '../components/Modal';
import { scheduleInspection, rescheduleInspection, getScheduleByCallNo, validateScheduleLimit, MAX_CALLS_PER_DAY } from '../services/scheduleService';
import { clearWorkflowCache } from '../services/workflowService';
import { checkTolerance } from '../utils/toleranceValidation';

// Reason options for withheld/cancel call
const WITHHELD_REASONS = [
  { value: '', label: 'Select Reason *' },
  { value: 'MATERIAL_NOT_AVAILABLE', label: 'Full quantity of material not available with firm at the time of inspection' },
  { value: 'PLACE_NOT_AS_PER_PO', label: 'Place of inspection is not as per the PO' },
  { value: 'VENDOR_WITHDRAWN', label: 'Vendor has withdrawn the inspection call' },
  { value: 'ANY_OTHER', label: 'Any other' },
];

// Alias for consistency with InspectionInitiationPage
const CALL_ACTION_REASONS = WITHHELD_REASONS;

// localStorage key for dashboard draft data
const DASHBOARD_DRAFT_KEY = 'process_dashboard_draft_';

// Styles for the static data section and submodule session
const staticDataStyles = `
  .process-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .process-form-group {
    display: flex;
    flex-direction: column;
  }

  .process-form-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .process-form-input {
    padding: 10px 14px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: #f9fafb;
    color: #374151;
  }

  /* Sub Module Session Styles - Same as Raw Material */
  .process-submodule-session {
    padding: 24px;
    background: linear-gradient(135deg, #fef7ed 0%, #fef3e2 100%);
    border-radius: 12px;
    border: 1px solid #f59e0b;
    margin-bottom: 24px;
  }

  .process-submodule-session-header {
    margin-bottom: 20px;
  }

  .process-submodule-session-title {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
  }

  .process-submodule-session-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  .process-submodule-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .process-submodule-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 16px;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 120px;
  }

  .process-submodule-btn:hover {
    border-color: #0d9488;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
    transform: translateY(-2px);
  }

  .process-submodule-btn-icon {
    font-size: 28px;
    margin-bottom: 10px;
  }

  .process-submodule-btn-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    margin: 0 0 6px 0;
    line-height: 1.3;
  }

  .process-submodule-btn-desc {
    font-size: 12px;
    color: #64748b;
    text-align: center;
    margin: 0;
  }

  @media (max-width: 1024px) {
    .process-form-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .process-submodule-buttons {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* Lot Wise Quantity Breakup Table Styles */
  .lot-wise-quantity-wrapper {
    padding: var(--space-16);
    margin-bottom: var(--space-16);
    background: linear-gradient(135deg, #f0fdf4 0%, #f1fdf9 100%);
    border-radius: 12px;
    border: 1px solid #86efac;
  }

  .lot-wise-quantity-title {
    font-size: 18px;
    font-weight: 700;
    color: #15803d;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lot-wise-quantity-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .lot-wise-quantity-table thead {
    background-color: #dcfce7;
    border-bottom: 2px solid #86efac;
  }

  .lot-wise-quantity-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #15803d;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .lot-wise-quantity-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 14px;
  }

  .lot-wise-quantity-table tbody tr:hover {
    background-color: #f8fdf6;
  }

  .lot-wise-quantity-table tbody tr:last-child td {
    border-bottom: none;
  }

  .lot-number-cell {
    font-weight: 600;
    color: #1f2937;
  }

  .quantity-cell-manufactured {
    color: #3b82f6;
    font-weight: 500;
  }

  .quantity-cell-accepted {
    color: #22c55e;
    font-weight: 600;
  }

  .quantity-cell-rejected {
    color: #ef4444;
    font-weight: 600;
  }

  .lot-wise-quantity-wrapper {
    margin-top: 24px;
  }

  @media (max-width: 768px) {
    .process-form-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .process-submodule-buttons {
      grid-template-columns: repeat(2, 1fr);
    }
    .process-submodule-btn {
      padding: 16px 12px;
      min-height: 100px;
    }
    .process-submodule-btn-icon {
      font-size: 24px;
    }
    .process-submodule-btn-title {
      font-size: 12px;
    }
    .process-submodule-btn-desc {
      font-size: 10px;
    }
  }

  @media (max-width: 640px) {
    .process-submodule-buttons {
      grid-template-columns: 1fr;
    }
    .process-submodule-btn {
      padding: 20px 16px;
      min-height: 120px;
    }
    .process-submodule-btn-icon {
      font-size: 28px;
    }
    .process-submodule-btn-title {
      font-size: 14px;
    }
    .process-submodule-btn-desc {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .process-form-grid {
      gap: 12px;
    }
    .process-form-group {
      margin-bottom: 12px;
    }
    .process-form-label {
      font-size: 12px;
    }
    .process-form-input {
      font-size: 12px;
      padding: 8px 12px;
    }
    .process-submodule-session {
      padding: 16px;
    }
    .process-submodule-session-title {
      font-size: 18px;
    }
    .process-submodule-session-subtitle {
      font-size: 12px;
    }
    .process-submodule-buttons {
      gap: 12px;
    }
    .process-submodule-btn {
      padding: 16px 12px;
      min-height: 100px;
    }
    .process-submodule-btn-icon {
      font-size: 24px;
    }
    .process-submodule-btn-title {
      font-size: 12px;
    }
    .process-submodule-btn-desc {
      font-size: 10px;
    }
  }

  /* Additional mobile responsiveness for header and other elements */
  @media (max-width: 768px) {
    .process-dashboard .process-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .process-dashboard .process-header h1 {
      font-size: 24px;
      margin: 0;
    }
    .process-dashboard .process-header .btn {
      width: 100%;
      justify-content: center;
    }
    .process-dashboard .process-line-toggle {
      width: 100%;
      flex-direction: column;
    }
    .process-dashboard .process-line-toggle button {
      width: 100%;
      padding: 12px;
      font-size: 14px;
    }
    .process-dashboard .process-context-info {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .process-dashboard .breadcrumb {
      flex-wrap: wrap;
      font-size: 12px;
    }
    .process-dashboard .card {
      padding: 16px;
    }
    .process-dashboard .card-header {
      padding: 12px 0;
    }
    .process-dashboard .card-title {
      font-size: 16px;
    }
    .process-dashboard .card-subtitle {
      font-size: 12px;
    }
    .process-dashboard .alert {
      padding: 12px;
      font-size: 13px;
    }
    .process-dashboard .input-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    /* Final Inspection Table - Card Layout for Mobile */
    .process-dashboard .final-inspection-table thead {
      display: none;
    }
    .process-dashboard .final-inspection-table tbody tr {
      display: block;
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #fff;
    }
    .process-dashboard .final-inspection-table tbody tr.total-row {
      background: #0d9488;
      border-color: #0d9488;
    }
    .process-dashboard .final-inspection-table tbody td {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border: none;
      border-bottom: 1px solid #f1f5f9;
    }
    .process-dashboard .final-inspection-table tbody td:last-child {
      border-bottom: none;
    }
    .process-dashboard .final-inspection-table tbody td::before {
      content: attr(data-label);
      font-weight: 600;
      color: #64748b;
      margin-right: 12px;
    }
    .process-dashboard .final-inspection-table tbody tr.total-row td::before {
      color: rgba(255,255,255,0.8);
    }
    .process-dashboard .final-inspection-table tbody tr.total-row td {
      border-bottom-color: rgba(255,255,255,0.2);
    }
  }

  @media (max-width: 480px) {
    .process-dashboard .process-header h1 {
      font-size: 18px;
    }
    .process-dashboard .process-line-toggle button {
      padding: 10px;
      font-size: 12px;
    }
    .process-dashboard .process-context-info {
      padding: 12px;
      gap: 8px;
    }
    .process-dashboard .process-context-info > div {
      padding: 8px;
    }
    .process-dashboard .process-context-info > div div:first-child {
      font-size: 16px;
    }
    .process-dashboard .card {
      padding: 12px;
      margin-bottom: 16px;
    }
    .process-dashboard .card-title {
      font-size: 14px;
    }
    .process-dashboard .process-submodule-session {
      padding: 12px;
    }
    .process-dashboard .process-submodule-session-title {
      font-size: 16px;
    }
    .process-dashboard .btn {
      padding: 10px 16px;
      font-size: 13px;
    }
    .process-dashboard .data-table {
      font-size: 12px;
    }
    .process-dashboard .data-table th, .process-dashboard .data-table td {
      padding: 8px 6px;
    }
    .process-dashboard .form-control {
      padding: 10px 12px;
      font-size: 14px;
    }
    .process-dashboard textarea.form-control {
      min-height: 80px;
    }
  }

  /* Lot ↔ Heat mapping grid: desktop 5 columns, mobile 2 columns */
  .lot-heat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
  }
  .lot-heat-item {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lot-heat-label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 2px;
  }
  .lot-heat-value {
    font-weight: 600;
    color: #0f172a;
  }
  /* Compact card overrides for this page */
  .compact-card { padding: 12px; }
  .compact-card .card-header { margin-bottom: 8px; padding: 0; }
  .compact-card .card-title { font-size: 16px; }
  .compact-card .card-subtitle { font-size: 12px; margin-top: 4px; }
  .compact-card .alert { padding: 8px; font-size: 12px; }

  @media (max-width: 768px) {
    .lot-heat-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
  }

  /* Heat Wise Accoutnal Table - Mobile Responsive */
  .heat-wise-accoutnal-table thead {
    display: none;
  }

  .heat-wise-accoutnal-table tbody tr {
    display: block;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    background: #fff;
  }

  .heat-wise-accoutnal-table tbody td {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border: none;
    border-bottom: 1px solid #f1f5f9;
  }

  .heat-wise-accoutnal-table tbody td:last-child {
    border-bottom: none;
  }

  .heat-wise-accoutnal-table tbody td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #64748b;
    margin-right: 12px;
    min-width: 120px;
  }

  @media (min-width: 769px) {
    .heat-wise-accoutnal-table thead {
      display: table-header-group;
    }

    .heat-wise-accoutnal-table tbody tr {
      display: table-row;
      margin-bottom: 0;
      border: none;
      border-radius: 0;
      padding: 0;
      background: transparent;
    }

    .heat-wise-accoutnal-table tbody tr:hover {
      background-color: #f8fdf6;
    }

    .heat-wise-accoutnal-table tbody td {
      display: table-cell;
      justify-content: auto;
      padding: 12px 16px;
      border: none;
      border-bottom: 1px solid #e5e7eb;
    }

    .heat-wise-accoutnal-table tbody td::before {
      display: none;
    }
  }

  /* Production Lines Card - Full Width */
  .production-lines-card {
    width: 100%;
    max-width: 100%;
  }

  .production-lines-table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Production Lines Table - Full Width & Mobile Responsive */
  .production-lines-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
  }

  .production-lines-table thead {
    display: none;
    background-color: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
  }

  .production-lines-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #475569;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .production-lines-table tbody tr {
    display: block;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    background: #fff;
  }

  .production-lines-table tbody td {
    display: flex;
    flex-direction: column;
    padding: 8px 0;
    border: none;
    border-bottom: 1px solid #f1f5f9;
  }

  .production-lines-table tbody td:last-child {
    border-bottom: none;
  }

  .production-lines-table tbody td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #64748b;
    margin-bottom: 6px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .production-lines-table tbody td input,
  .production-lines-table tbody td select {
    width: 100% !important;
    min-width: auto !important;
  }

  .production-lines-table tbody td button {
    width: 100%;
  }

  /* Mobile: Ensure full width on small screens */
  @media (max-width: 768px) {
    .production-lines-card {
      margin-left: calc(-1 * var(--space-16, 16px));
      margin-right: calc(-1 * var(--space-16, 16px));
      border-radius: 0;
      width: calc(100% + 2 * var(--space-16, 16px));
    }

    .production-lines-table-wrapper {
      margin: 0;
      padding: 0;
    }
  }

  @media (min-width: 769px) {
    .production-lines-table {
      width: 100%;
      table-layout: auto;
    }

    .production-lines-table thead {
      display: table-header-group;
    }

    .production-lines-table tbody tr {
      display: table-row;
      margin-bottom: 0;
      border: none;
      border-radius: 0;
      padding: 0;
      background: transparent;
    }

    .production-lines-table tbody tr:hover {
      background-color: #f8fafc;
    }

    .production-lines-table tbody td {
      display: table-cell;
      flex-direction: row;
      padding: 12px 16px;
      border: none;
      border-bottom: 1px solid #e2e8f0;
    }

    .production-lines-table tbody td::before {
      display: none;
    }

    .production-lines-table tbody td input,
    .production-lines-table tbody td select {
      width: auto !important;
      min-width: auto !important;
    }

    .production-lines-table tbody td button {
      width: auto;
    }
  }
`;

const ProcessDashboard = ({ call, onBack, onNavigateToSubModule, productionLines: initialProductionLines = [], availableCalls = [] }) => {
  // State for fetched data from backend
  const [fetchedCallData, setFetchedCallData] = useState(null);
  const [fetchedPoData, setFetchedPoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for additional initiated calls (added through "Add New Call Number" modal)
  // Persisted in sessionStorage - scoped to call number
  const [additionalInitiatedCalls, setAdditionalInitiatedCalls] = useState(() => {
    const callNoForScoping = call?.call_no;
    if (!callNoForScoping) return [];

    const saved = sessionStorage.getItem(`additionalInitiatedCalls_${callNoForScoping}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.log('Error parsing saved additional calls:', e);
      }
    }
    return [];
  });

  // State for production lines section
  const [productionLinesExpanded, setProductionLinesExpanded] = useState(true);

  // State for editable production lines - persisted in sessionStorage - scoped to call number
  const [localProductionLines, setLocalProductionLines] = useState(() => {
    const callNoForScoping = call?.call_no;
    if (!callNoForScoping) return [{ lineNumber: 1, icNumber: '', poNumber: '', rawMaterialICs: '', productType: '' }];

    // First check sessionStorage for persisted data
    const savedLines = sessionStorage.getItem(`processProductionLinesData_${callNoForScoping} `);
    if (savedLines) {
      try {
        const parsed = JSON.parse(savedLines);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          // Ensure each line has a lineNumber property and is a valid object
          return parsed
            .filter(line => line && typeof line === 'object') // Filter out null/undefined or non-objects
            .map((line, idx) => ({
              ...line,
              lineNumber: line.lineNumber || (idx + 1)
            }));
        }
      } catch (e) {
        console.log('Error parsing saved production lines:', e);
      }
    }

    // Helper to extract unique calls from available sources
    const getUniqueCalls = () => {
      const callMap = new Map();
      if (availableCalls && Array.isArray(availableCalls)) {
        availableCalls.forEach(c => {
          if (c?.call_no) callMap.set(c.call_no, c);
        });
      }
      if (call?.call_no && !callMap.has(call.call_no)) {
        callMap.set(call.call_no, {
          call_no: call.call_no,
          po_no: call.po_no,
          rawMaterialICs: (Array.isArray(call.rm_heat_tc_mapping) ? call.rm_heat_tc_mapping.map(m => m.subPoNumber).filter(Boolean).join(', ') : '') || '',
          productType: call.erc_type || call.product_type || 'ERC Process'
        });
      }
      return Array.from(callMap.values());
    };

    const uniqueCallList = getUniqueCalls();

    if (initialProductionLines && initialProductionLines.length > 0) {
      return initialProductionLines;
    }

    // If only one call available across all sources, auto-fill it in the first line
    if (uniqueCallList.length === 1) {
      return [{
        lineNumber: 1,
        icNumber: uniqueCallList[0].call_no || '',
        poNumber: uniqueCallList[0].po_no || uniqueCallList[0].poNumber || '',
        rawMaterialICs: uniqueCallList[0].rawMaterialICs || '',
        productType: uniqueCallList[0].product_type || uniqueCallList[0].productType || ''
      }];
    }

    // If multiple calls available, create rows for each but leave unselected
    if (uniqueCallList.length > 1) {
      return uniqueCallList.map((_, idx) => ({
        lineNumber: idx + 1,
        icNumber: '',
        poNumber: '',
        rawMaterialICs: '',
        productType: ''
      }));
    }
    // Default first line with empty fields - user must select from dropdown
    return [{
      lineNumber: 1,
      icNumber: '',
      poNumber: '',
      rawMaterialICs: '',
      productType: ''
    }];
  });

  // State for line number validation errors
  const [lineNumberErrors, setLineNumberErrors] = useState({});

  // State to store fetched initiation data for each call (keyed by call number)
  // This stores PO data, heat numbers, lot numbers, etc. from the backend API
  // Persisted in sessionStorage to avoid re-fetching when navigating between modules
  const [callInitiationDataCache, setCallInitiationDataCache] = useState(() => {
    const saved = sessionStorage.getItem('processCallInitiationDataCache');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.log('Error parsing saved call initiation data cache:', e);
      }
    }
    return {};
  });

  // Refs to prevent duplicate API calls (especially in React StrictMode and when navigating back)
  const hasFetchedRef = useRef(false);
  const currentCallRef = useRef(null);
  const hasLoadedDraftRef = useRef(false);

  // Reset refs when component unmounts or call changes
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      hasFetchedRef.current = false;
      currentCallRef.current = null;
      hasLoadedDraftRef.current = false;
    };
  }, []);

  // Cache helpers removed (unused) to satisfy linting rules

  // State for "Add New Call Number" modal
  const [showAddCallModal, setShowAddCallModal] = useState(false);
  const [showInitiationForm, setShowInitiationForm] = useState(false);
  const [selectedNewCall, setSelectedNewCall] = useState(null);
  const [selectedNewCallData, setSelectedNewCallData] = useState(null);
  const [isLoadingInitiationData, setIsLoadingInitiationData] = useState(false);
  const [allProcessCalls, setAllProcessCalls] = useState([]);
  const [isLoadingProcessCalls, setIsLoadingProcessCalls] = useState(false);

  // State for Resume Call modal
  const [showResumeCallModal, setShowResumeCallModal] = useState(false);
  const [resumeCallData, setResumeCallData] = useState(null);
  const [isResumingCall, setIsResumingCall] = useState(false);
  const [isResumeFlow, setIsResumeFlow] = useState(true);

  // Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCallForSchedule, setSelectedCallForSchedule] = useState(null);
  const [isReschedule, setIsReschedule] = useState(false);
  const [selectedNewCallTransitionId, setSelectedNewCallTransitionId] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleRemarks, setScheduleRemarks] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [previousSchedule, setPreviousSchedule] = useState(null);

  // Filter out call numbers that are already selected in production lines
  const availableCallNumbersForModal = useMemo(() => {
    const selectedCallNumbers = localProductionLines
      .filter(line => line && typeof line === 'object')
      .map(line => line?.icNumber)
      .filter(Boolean);
    return allProcessCalls.filter(call => call && call.call_no && !selectedCallNumbers.includes(call.call_no));
  }, [allProcessCalls, localProductionLines]);

  // State for initiation form data (matching InspectionInitiationPage)
  const [newCallShift, setNewCallShift] = useState('');
  const [newCallOfferedQty, setNewCallOfferedQty] = useState(0);
  const [newCallCmApproval, setNewCallCmApproval] = useState(false);
  const [newCallDate, setNewCallDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCallMultipleLinesActive, setNewCallMultipleLinesActive] = useState(false);
  const [newCallProductionLines, setNewCallProductionLines] = useState([{ lineNumber: 1, icNumber: '', poNumber: '', rawMaterialICs: [], productType: '' }]);
  const [newCallSectionAVerified, setNewCallSectionAVerified] = useState(false);
  const [newCallSectionAStatus, setNewCallSectionAStatus] = useState('');
  const [newCallSectionBVerified, setNewCallSectionBVerified] = useState(false);
  const [newCallSectionBStatus, setNewCallSectionBStatus] = useState('');
  const [newCallSectionCVerified, setNewCallSectionCVerified] = useState(false);
  const [newCallSectionCStatus, setNewCallSectionCStatus] = useState('');
  const [newCallSectionDVerified, setNewCallSectionDVerified] = useState(false);
  const [newCallShowValidationErrors, setNewCallShowValidationErrors] = useState(false);

  // State for call action modals (withheld/cancel)
  const [showNewCallActionModal, setShowNewCallActionModal] = useState(false);
  const [newCallActionType, setNewCallActionType] = useState('');
  const [newCallActionReason, setNewCallActionReason] = useState('');
  const [newCallActionRemarks, setNewCallActionRemarks] = useState('');
  const [newCallActionError, setNewCallActionError] = useState('');

  // State for initiate inspection modal
  const [showNewCallInitiateModal, setShowNewCallInitiateModal] = useState(false);
  const [newCallInitiateError, setNewCallInitiateError] = useState('');
  const [isNewCallSaving, setIsNewCallSaving] = useState(false);

  // Persist production lines to sessionStorage whenever they change - scoped to call number
  useEffect(() => {
    if (call?.call_no && localProductionLines && localProductionLines.length > 0) {
      sessionStorage.setItem(`processProductionLinesData_${call.call_no} `, JSON.stringify(localProductionLines));
    }
  }, [localProductionLines, call?.call_no]);

  // Persist additional initiated calls to sessionStorage - scoped to call number
  useEffect(() => {
    if (call?.call_no && additionalInitiatedCalls) {
      sessionStorage.setItem(`additionalInitiatedCalls_${call.call_no} `, JSON.stringify(additionalInitiatedCalls));
    }
  }, [additionalInitiatedCalls, call?.call_no]);

  // Persist call initiation data cache to sessionStorage whenever it changes
  useEffect(() => {
    if (callInitiationDataCache && Object.keys(callInitiationDataCache).length > 0) {
      sessionStorage.setItem('processCallInitiationDataCache', JSON.stringify(callInitiationDataCache));
      console.log('💾 [Cache] Persisted call initiation data cache to sessionStorage');
    }
  }, [callInitiationDataCache]);

  // Fetch all process calls on component mount and cache them
  const fetchAllProcessCalls = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoadingProcessCalls(true);
      console.log(`🚀[Process Dashboard] Fetching all process calls(forceRefresh: ${forceRefresh})...`);

      // Get current user info
      const user = getStoredUser();
      if (!user) {
        console.warn('⚠️ User not authenticated, skipping process calls fetch');
        setIsLoadingProcessCalls(false);
        return;
      }

      const roleName = user.roleName;
      const userId = parseInt(user.userId, 10);

      // Fetch all pending workflow transitions for IE role
      const allTransitions = await fetchPendingWorkflowTransitions(roleName, forceRefresh);
      console.log('✅ [Process Dashboard] Fetched workflow transitions:', allTransitions.length);

      // Filter only Process type calls assigned to current user
      const processCalls = allTransitions.filter(transition => {
        const isProcess = transition.productType === 'Process';
        const isAssignedToUser = Array.isArray(transition.processIes) && transition.processIes.includes(userId);
        return isProcess && isAssignedToUser;
      });
      console.log('✅ [Process Dashboard] Filtered process calls:', processCalls.length);

      // Transform to match the format expected by the modal and PendingCallsTab
      const transformedCalls = processCalls.map(transition => {
        let vendorName = transition.vendorName;
        if (vendorName && typeof vendorName === 'string' && vendorName.trim() !== '') {
          vendorName = processVendorName(vendorName);
          vendorName = cleanVendorName(vendorName);
        } else {
          vendorName = 'SHIVAM HIGHRISE PVT. LTD';
        }

        return {
          id: transition.workflowTransitionId, // Ensure ID is present for selection
          call_no: transition.requestId || '',
          po_no: transition.poNo || '',
          vendor_name: vendorName,
          product_type: transition.ercType || transition.productType || 'Process',
          status: transition.status || '',
          call_date: transition.createdDate ? transition.createdDate.split('T')[0] : null,
          desired_inspection_date: transition.desiredInspectionDate || null,
          rawMaterialICs: transition.rmIcNumber || '',
          poQty: transition.poQty || 0,
          callQty: transition.callQty || 0,
          cmApproval: transition.cmApproval || 'NO'
        };
      });

      setAllProcessCalls(transformedCalls);
      console.log('💾 [Process Dashboard] Cached process calls:', transformedCalls.length);
      setIsLoadingProcessCalls(false);
    } catch (error) {
      console.error('❌ [Process Dashboard] Error fetching process calls:', error);
      setIsLoadingProcessCalls(false);
    }
  }, []);

  useEffect(() => {
    fetchAllProcessCalls();
  }, [fetchAllProcessCalls]); // Run once on mount

  // Persist additionalInitiatedCalls to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('additionalInitiatedCalls', JSON.stringify(additionalInitiatedCalls));
  }, [additionalInitiatedCalls]);


  // Add current call to options if not present
  const currentCallOption = useMemo(() => {
    return call?.call_no ? {
      call_no: call.call_no,
      po_no: call.po_no,
      rawMaterialICs: call.rm_heat_tc_mapping?.map(m => m.subPoNumber).filter(Boolean).join(', ') || '',
      productType: call.erc_type || call.product_type || '' // Use erc_type from call data, not hardcoded
    } : null;
  }, [call?.call_no, call?.po_no, call?.rm_heat_tc_mapping, call?.erc_type, call?.product_type]);

  // Show all calls from current inspection session (availableCalls)
  // Includes the main call so it can be used for multiple production lines
  const allCallOptions = useMemo(() => {
    // Create a map to ensure unique call numbers
    const callMap = new Map();

    // 1. Add availableCalls (these come from the dashboard wrapper)
    if (availableCalls && Array.isArray(availableCalls)) {
      availableCalls.forEach(c => {
        if (c && c.call_no) {
          callMap.set(c.call_no, c);
        }
      });
    }

    // 2. Add current call if not present (needed for multiple production lines of same call)
    if (currentCallOption && currentCallOption.call_no) {
      callMap.set(currentCallOption.call_no, currentCallOption);
    }

    // 3. Add additional initiated/resumed calls from this session
    if (additionalInitiatedCalls && Array.isArray(additionalInitiatedCalls)) {
      additionalInitiatedCalls.forEach(c => {
        if (c && c.call_no) {
          callMap.set(c.call_no, c);
        }
      });
    }

    const combined = Array.from(callMap.values());
    console.log('📋 [Call Options] Combined calls for dropdown:', combined.map(c => c.call_no));
    return combined;
  }, [availableCalls, currentCallOption, additionalInitiatedCalls]);

  // Auto-fill and Validate Production Lines based on available calls
  useEffect(() => {
    if (!allCallOptions || allCallOptions.length === 0) return;

    const availableCallNumbers = allCallOptions.map(c => c.call_no);
    const singleCall = allCallOptions.length === 1 ? allCallOptions[0] : null;

    setLocalProductionLines(prev => {
      let changed = false;
      const updated = prev.map((line, idx) => {
        // Condition 1: Single Call Auto-fill/Correction
        // If there's only one call, the first line MUST have that call
        if (idx === 0 && singleCall) {
          if (line.icNumber !== singleCall.call_no) {
            changed = true;
            return {
              ...line,
              icNumber: singleCall.call_no,
              poNumber: singleCall.po_no || '',
              rawMaterialICs: singleCall.rawMaterialICs || '',
              productType: singleCall.productType || singleCall.product_type || ''
            };
          }
        }

        // Condition 2: Stale Data Cleanup
        // If line has an icNumber that is NOT in availableCallNumbers, clear it
        if (line.icNumber && !availableCallNumbers.includes(line.icNumber)) {
          changed = true;
          return {
            ...line,
            icNumber: '',
            poNumber: '',
            rawMaterialICs: '',
            productType: ''
          };
        }

        return line;
      });

      return changed ? updated : prev;
    });
  }, [allCallOptions]); // Only sync when available calls change

  // NEW: Line display mapping logic (Phase 4)
  // Mapping of internal line IDs (Line-1, Line-2) to user-facing labels
  const lineDisplayMapping = useMemo(() => {
    return buildLineMapping(localProductionLines);
  }, [localProductionLines]);

  // Helper to get display label for any internal line identifier
  const getLineLabel = useCallback((internalLineId) => {
    return lineDisplayMapping[internalLineId]?.displayLabel || internalLineId;
  }, [lineDisplayMapping]);

  // Handle call number change for a production line
  const handleCallNumberChange = async (lineIndex, selectedCallNo) => {
    console.log('🔄 [Production Line] Call number changed:', selectedCallNo);
    console.log('🔄 [Production Line] Line index:', lineIndex);
    const selectedCall = allCallOptions.find(c => c.call_no === selectedCallNo);
    console.log('🔄 [Production Line] Selected call from options:', selectedCall);

    // First, update the production line with the selected call number (optimistic update)
    setLocalProductionLines(prev => {
      const updated = [...prev];
      updated[lineIndex] = {
        ...updated[lineIndex],
        icNumber: selectedCallNo,
        poNumber: '',
        rawMaterialICs: '',
        productType: ''
      };
      return updated;
    });

    // Then fetch the full data from API
    try {
      // Call the Process Initiation Service to get RM IC number, ERC type, and all other data
      console.log('📤 [Production Line] Fetching call details from service for call:', selectedCallNo);
      const data = await fetchProcessInitiationData(selectedCallNo);

      console.log('✅ [Production Line] Service Response:', data);
      console.log('✅ [Production Line] rmIcNumber from API:', data.rmIcNumber);
      console.log('✅ [Production Line] typeOfErc from API:', data.typeOfErc);
      console.log('✅ [Production Line] poNo from API:', data.poNo);
      console.log('✅ [Production Line] rmIcHeatInfoList:', data.rmIcHeatInfoList);
      console.log('✅ [Production Line] lotNumber from API:', data.lotNumber);
      console.log('✅ [Production Line] heatNumber from API:', data.heatNumber);

      const rmIcNumber = data.rmIcNumber || '';
      const ercType = data.typeOfErc || '';
      const poNumber = data.poNo || selectedCall?.po_no || '';

      console.log('📋 [Production Line] Final values - RM IC:', rmIcNumber, 'ERC Type:', ercType, 'PO:', poNumber);

      // Update the production line with fetched data
      setLocalProductionLines(prev => {
        const updated = [...prev];
        const updatedLine = {
          ...updated[lineIndex],
          icNumber: selectedCallNo,
          poNumber: poNumber,
          rawMaterialICs: rmIcNumber,
          productType: ercType
        };
        updated[lineIndex] = updatedLine;
        console.log('✅ [Production Line] Updated line', lineIndex + 1, ':', updatedLine);
        return updated;
      });

      // Cache the full initiation data for this call (including manufacturer from rmIcHeatInfoList)
      setCallInitiationDataCache(prev => ({
        ...prev,
        [selectedCallNo]: data
      }));
      console.log('💾 [Production Line] Cached initiation data for call:', selectedCallNo);
    } catch (error) {
      console.error('❌ [Production Line] Error fetching call details:', error);
      console.error('❌ [Production Line] Error stack:', error.stack);

      // On error, keep the call number but show empty fields
      setLocalProductionLines(prev => {
        const updated = [...prev];
        updated[lineIndex] = {
          ...updated[lineIndex],
          icNumber: selectedCallNo,
          poNumber: selectedCall?.po_no || '',
          rawMaterialICs: selectedCall?.rawMaterialICs || '',
          productType: selectedCall?.productType || ''
        };
        return updated;
      });
    }
  };

  /**
   * Handle custom line number change (Phase 4)
   * Enforces call-specific uniqueness using the validateLineNumber utility
   */
  const handleLineNumberChange = useCallback((lineIndex, selectedNumber) => {
    console.log(`🔄[Line Change] Line ${lineIndex} -> Number ${selectedNumber} `);

    // Validate uniqueness per call
    const { isValid, error } = validateLineNumber(localProductionLines, lineIndex, selectedNumber);

    if (!isValid) {
      // Show error but update state so user can see what they selected
      setLineNumberErrors(prev => ({
        ...prev,
        [lineIndex]: error
      }));
    } else {
      // Clear error for this line
      setLineNumberErrors(prev => {
        const updated = { ...prev };
        delete updated[lineIndex];
        return updated;
      });
    }

    // Update the production line state
    setLocalProductionLines(prev => {
      const updated = [...prev];
      updated[lineIndex] = {
        ...updated[lineIndex],
        lineNumber: selectedNumber
      };
      return updated;
    });
  }, [localProductionLines]);

  // Add new production line
  const handleAddProductionLine = () => {
    setLocalProductionLines(prev => [
      ...prev,
      {
        // Default to a reasonably unique number if 1-5 available, otherwise leave for user to choose
        lineNumber: prev.length < 5 ? prev.length + 1 : '',
        icNumber: '',
        poNumber: '',
        rawMaterialICs: '',
        productType: ''
      }
    ]);
  };

  // Remove production line
  const handleRemoveProductionLine = (lineIndex) => {
    if (localProductionLines.length <= 1) {
      showNotification('error', 'At least one production line is required');
      return;
    }
    setLocalProductionLines(prev => {
      const updated = prev.filter((_, idx) => idx !== lineIndex);
      // NOTE: We no longer auto-renumber sequentially to preserve custom line numbers
      return updated;
    });
  };



  // Handle "Add New Call Number" button click
  const handleAddNewCallNumber = () => {
    console.log('🔵 Add New Call Number clicked');
    console.log('💾 Using cached process calls:', allProcessCalls.length);

    // If no cached data, show a message
    if (allProcessCalls.length === 0 && !isLoadingProcessCalls) {
      showNotification('warning', 'No process calls available. Please refresh the page or contact support.');
      return;
    }

    // Show modal with cached data
    setShowAddCallModal(true);
  };


  // Handle call number selection from modal
  const handleSelectNewCall = (callData, skipInitiation = false, rowArg = null) => {
    const callNo = typeof callData === 'object' ? callData.call_no : callData;
    const rowData = typeof callData === 'object' ? callData : rowArg;

    console.log('🔵 Call selected:', callNo, 'skipInitiation:', skipInitiation, 'hasRowData:', !!rowData);
    console.log('📍 Transition ID:', rowData?.id);

    // Always close modal immediately for instant feedback
    setShowAddCallModal(false);
    setSelectedNewCall(callNo);
    setSelectedNewCallTransitionId(rowData?.id || null);

    if (skipInitiation) {
      // For RESUME flow, we skip the initiation form and add directly to production lines
      console.log('🔄 RESUME flow - adding call with Optimistic Update');
      setSelectedNewCallData(null); // Reset data

      // 1. Create a "basic" line instantly from available rowData
      const basicLine = {
        lineNumber: localProductionLines.length + 1,
        icNumber: callNo,
        poNumber: rowData?.po_no || rowData?.poNo || '',
        rawMaterialICs: rowData?.rawMaterialICs || rowData?.rmIcNumber || '',
        productType: rowData?.product_type || rowData?.typeOfErc || 'ERC Process',
        manufacturer: rowData?.vendor_name || rowData?.vendorName || ''
      };

      // 2. Update UI state instantly
      setLocalProductionLines(prev => [...prev, basicLine]);

      // 3. Ensure dropdown options are updated immediately
      setAdditionalInitiatedCalls(prev => {
        const alreadyExists = prev.some(c => c.call_no === callNo);
        if (alreadyExists) return prev;
        return [...prev, {
          call_no: callNo,
          po_no: basicLine.poNumber,
          rawMaterialICs: basicLine.rawMaterialICs,
          productType: basicLine.productType,
          vendor_name: basicLine.manufacturer
        }];
      });

      // 4. Update available calls list
      setAllProcessCalls(prev => prev.filter(c => c.call_no !== callNo));

      showNotification('success', `Call ${callNo} has been resumed and added to the production lines!`);

      // 5. Enrich data in the background (Async Background Fetch)
      const enrichData = async () => {
        try {
          console.log('📤 Background enriching data for call:', callNo);
          const richData = await fetchProcessInitiationData(callNo);

          if (richData) {
            console.log('✅ Background data fetched for:', callNo);

            // Update the specific line in localProductionLines with rich data
            setLocalProductionLines(prev => prev.map(line => {
              if (line.icNumber === callNo) {
                return {
                  ...line,
                  poNumber: richData.poNo || richData.po_no || line.poNumber,
                  rawMaterialICs: richData.rmIcNumber || richData.rawMaterialICs || line.rawMaterialICs,
                  productType: richData.typeOfErc || richData.product_type || line.productType,
                  manufacturer: richData.vendorName || richData.vendor_name || line.manufacturer
                };
              }
              return line;
            }));

            // Cache the full initiation data
            setCallInitiationDataCache(prev => ({
              ...prev,
              [callNo]: richData
            }));
          }
        } catch (error) {
          console.error('Error in background data enrichment:', error);
          // Don't show error notification to user for background fetch unless critical
        }
      };

      // Start enrichment without awaiting it
      enrichData();
    } else {
      // For START flow, show modal immediately and fetch data in background
      console.log('📤 START flow - showing modal immediately, fetching data in background');

      // Show the modal instantly with loading state
      setShowInitiationForm(true);
      setIsLoadingInitiationData(true);

      // Fetch data in background
      const fetchAndShowForm = async () => {
        try {
          // Fetch BOTH initiation data AND workflow transition ID in parallel
          const [data, workflowData] = await Promise.all([
            fetchProcessInitiationData(callNo),
            fetchLatestWorkflowTransition(callNo)
          ]);

          console.log('✅ Initiation data fetched:', data);
          console.log('✅ Workflow transition data fetched:', workflowData);

          // Store the actual workflow transition ID from the backend
          const actualWorkflowTransitionId = workflowData?.id || workflowData?.workflowTransitionId;
          console.log('📌 Storing workflow transition ID:', actualWorkflowTransitionId);
          setSelectedNewCallTransitionId(actualWorkflowTransitionId);

          setSelectedNewCallData(data);
          setNewCallOfferedQty(data.callQty || data.poQty || 0);
          setIsLoadingInitiationData(false);
        } catch (error) {
          console.error('❌ Error fetching initiation data:', error);
          setIsLoadingInitiationData(false);
          setShowInitiationForm(false); // Close modal on error
          showNotification('error', 'Error loading initiation data. Please try again.');
        }
      };

      fetchAndShowForm();
    }
  };

  // Create formData object for InspectionInitiationFormContent
  const newCallFormData = {
    shiftOfInspection: newCallShift,
    offeredQty: newCallOfferedQty,
    cmApproval: newCallCmApproval,
    dateOfInspection: newCallDate,
    multipleLinesActive: newCallMultipleLinesActive,
    productionLines: newCallProductionLines,
    sectionAVerified: newCallSectionAVerified,
    sectionAStatus: newCallSectionAStatus,
    sectionBVerified: newCallSectionBVerified,
    sectionBStatus: newCallSectionBStatus,
    sectionCVerified: newCallSectionCVerified,
    sectionCStatus: newCallSectionCStatus,
    sectionDVerified: newCallSectionDVerified,
    showValidationErrors: newCallShowValidationErrors,
  };

  // Handle form data changes from InspectionInitiationFormContent
  const handleNewCallFormDataChange = (updates) => {
    if (updates.shiftOfInspection !== undefined) setNewCallShift(updates.shiftOfInspection);
    if (updates.offeredQty !== undefined) setNewCallOfferedQty(updates.offeredQty);
    if (updates.cmApproval !== undefined) setNewCallCmApproval(updates.cmApproval);
    if (updates.dateOfInspection !== undefined) setNewCallDate(updates.dateOfInspection);
    if (updates.multipleLinesActive !== undefined) setNewCallMultipleLinesActive(updates.multipleLinesActive);
    if (updates.productionLines !== undefined) setNewCallProductionLines(updates.productionLines);
    if (updates.sectionAVerified !== undefined) setNewCallSectionAVerified(updates.sectionAVerified);
    if (updates.sectionAStatus !== undefined) setNewCallSectionAStatus(updates.sectionAStatus);
    if (updates.sectionBVerified !== undefined) setNewCallSectionBVerified(updates.sectionBVerified);
    if (updates.sectionBStatus !== undefined) setNewCallSectionBStatus(updates.sectionBStatus);
    if (updates.sectionCVerified !== undefined) setNewCallSectionCVerified(updates.sectionCVerified);
    if (updates.sectionCStatus !== undefined) setNewCallSectionCStatus(updates.sectionCStatus);
    if (updates.sectionDVerified !== undefined) setNewCallSectionDVerified(updates.sectionDVerified);
  };

  // Open call action modal (withheld/cancel) for new call
  const handleOpenNewCallActionModal = (actionType) => {
    setNewCallActionType(actionType);
    setNewCallActionReason('');
    setNewCallActionRemarks('');
    setNewCallActionError('');
    setShowNewCallActionModal(true);
  };

  // Close call action modal for new call
  const handleCloseNewCallActionModal = () => {
    setShowNewCallActionModal(false);
    setNewCallActionType('');
    setNewCallActionReason('');
    setNewCallActionRemarks('');
    setNewCallActionError('');
  };

  // Handle scheduling from AddNewCallModal
  const handleOpenScheduleModal = async (callData, reschedule = false) => {
    setSelectedCallForSchedule(callData);
    setIsReschedule(reschedule);
    setScheduleDate('');
    setScheduleRemarks('');
    setPreviousSchedule(null);

    if (reschedule) {
      try {
        const existingSchedule = await getScheduleByCallNo(callData.call_no);
        if (existingSchedule) {
          setPreviousSchedule(existingSchedule);
          if (existingSchedule.scheduleDate) {
            setScheduleDate(existingSchedule.scheduleDate);
          }
          if (existingSchedule.reason) {
            setScheduleRemarks(existingSchedule.reason);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch existing schedule:', error);
      }
    }

    setShowScheduleModal(true);
  };

  // Submit schedule/reschedule
  const handleScheduleSubmit = async () => {
    if (!scheduleDate) {
      showNotification('warning', 'Please select a schedule date');
      return;
    }

    setIsScheduling(true);
    const currentUser = getStoredUser();
    const userId = currentUser?.userId || 0;

    try {
      // Validate scheduled date is on or after desired inspection date
      if (selectedCallForSchedule?.desired_inspection_date) {
        const scheduledDateObj = new Date(scheduleDate);
        const desiredDateObj = new Date(selectedCallForSchedule.desired_inspection_date);
        if (scheduledDateObj < desiredDateObj) {
          showNotification('error', `Scheduled date cannot be before the Desired Inspection Date(${selectedCallForSchedule.desired_inspection_date}).`);
          setIsScheduling(false);
          return;
        }
      }

      // Validate schedule limit (5 calls per day) - only for new schedules, not reschedules
      if (!isReschedule) {
        const validation = await validateScheduleLimit(scheduleDate, 1);
        if (!validation.canSchedule) {
          showNotification('error', `Maximum ${MAX_CALLS_PER_DAY} calls allowed per day.Currently ${validation.currentCount} scheduled.`);
          setIsScheduling(false);
          return;
        }
      }

      const scheduleData = {
        callNo: selectedCallForSchedule.call_no,
        scheduleDate: scheduleDate,
        reason: scheduleRemarks,
        createdBy: userId,
        updatedBy: userId
      };

      if (isReschedule) {
        await rescheduleInspection(scheduleData);
      } else {
        await scheduleInspection(scheduleData);
      }

      showNotification('success', `Inspection for call ${selectedCallForSchedule.call_no} scheduled successfully!`);

      // Clear workflow cache to force fresh data on next fetch
      clearWorkflowCache();

      // Close modals immediately for prompt UI response
      setShowScheduleModal(false);
      setScheduleDate('');
      setScheduleRemarks('');
      setSelectedCallForSchedule(null);

      // Refresh the process calls list to update status in the background
      await fetchAllProcessCalls(true);
    } catch (error) {
      showNotification('error', error.message || 'Failed to schedule inspection');
    } finally {
      setIsScheduling(false);
    }
  };

  // Submit call action (withheld/cancel) for new call
  const handleSubmitNewCallAction = async () => {
    if (!newCallActionReason) {
      setNewCallActionError('Please select a reason');
      return;
    }
    if (newCallActionReason === 'ANY_OTHER' && !newCallActionRemarks.trim()) {
      setNewCallActionError('Please provide remarks for "Any other" reason');
      return;
    }

    setIsNewCallSaving(true);
    try {
      console.log(`🔴 ${newCallActionType} call: `, selectedNewCall);
      console.log('Reason:', newCallActionReason);
      console.log('Remarks:', newCallActionRemarks);

      // Close modals
      handleCloseNewCallActionModal();
      setShowInitiationForm(false);
      setSelectedNewCall(null);
      setSelectedNewCallData(null);

      showNotification('success', `Call ${selectedNewCall} has been ${newCallActionType.toLowerCase()}.`);
    } catch (error) {
      console.error('Error submitting call action:', error);
      setNewCallActionError('Failed to submit. Please try again.');
    } finally {
      setIsNewCallSaving(false);
    }
  };

  // Open initiate inspection modal for new call
  const handleOpenNewCallInitiateModal = () => {
    // Validate sections - Section C is NOT required for Process material (only for Raw Material)
    const isSectionCRequired = false; // Process does NOT need Section C
    if (!newCallSectionAVerified || !newCallSectionBVerified || (isSectionCRequired && !newCallSectionCVerified)) {
      setNewCallShowValidationErrors(true);
      showNotification('error', 'Please verify all required sections (A and B) before initiating inspection.');
      return;
    }

    // Pre-fill shift with the current inspection's shift
    const currentShift = fetchedCallData?.shiftOfInspection || call?.shift_of_inspection || call?.shift || '';
    if (currentShift && !newCallShift) {
      console.log('📌 Pre-filling shift with current inspection shift:', currentShift);
      setNewCallShift(currentShift);
    }

    setNewCallInitiateError('');
    setShowNewCallInitiateModal(true);
  };

  // Close initiate inspection modal for new call
  const handleCloseNewCallInitiateModal = () => {
    setShowNewCallInitiateModal(false);
    setNewCallInitiateError('');
  };

  // Submit initiate inspection for new call
  const handleSubmitNewCallInitiation = async () => {
    if (!newCallShift) {
      setNewCallInitiateError('Please select Shift of Inspection');
      return;
    }
    if (!newCallDate) {
      setNewCallInitiateError('Please select Date of Inspection');
      return;
    }

    setIsNewCallSaving(true);
    try {
      console.log('🟢 Initiating inspection for new call:', selectedNewCall);
      console.log('📋 Form data:', newCallFormData);

      // Create the new call option object for the dropdown
      const newCallOption = {
        call_no: selectedNewCall,
        po_no: selectedNewCallData?.poNo || '',
        rawMaterialICs: selectedNewCallData?.rmIcNumber || '',
        productType: selectedNewCallData?.typeOfErc || 'ERC Process',
        vendor_name: selectedNewCallData?.vendorName || ''
      };

      // Add to additionalInitiatedCalls so it appears in the dropdown
      setAdditionalInitiatedCalls(prev => [...prev, newCallOption]);

      // Add the new call to the production lines in the main dashboard
      const newLine = {
        lineNumber: localProductionLines.length + 1,
        icNumber: selectedNewCall,
        poNumber: selectedNewCallData?.poNo || '',
        rawMaterialICs: selectedNewCallData?.rmIcNumber || '',
        productType: selectedNewCallData?.typeOfErc || 'ERC Process',
        manufacturer: selectedNewCallData?.vendorName || ''
      };

      setLocalProductionLines(prev => [...prev, newLine]);

      // Store the initiated call data in cache so it's available for the dropdown
      setCallInitiationDataCache(prev => ({
        ...prev,
        [selectedNewCall]: newCallFormData
      }));

      // Remove from allProcessCalls so it doesn't show in "Add New Call Number" modal anymore
      setAllProcessCalls(prev => prev.filter(c => c.call_no !== selectedNewCall));

      // Close modals and reset state
      handleCloseNewCallInitiateModal();
      setShowInitiationForm(false);
      setSelectedNewCall(null);
      setSelectedNewCallData(null);

      // Reset form state
      setNewCallShift('');
      setNewCallOfferedQty(0);
      setNewCallCmApproval(false);
      setNewCallDate(new Date().toISOString().split('T')[0]);
      setNewCallMultipleLinesActive(false);
      setNewCallProductionLines([{ lineNumber: 1, icNumber: '', poNumber: '', rawMaterialICs: [], productType: '' }]);
      setNewCallSectionAVerified(false);
      setNewCallSectionAStatus('');
      setNewCallSectionBVerified(false);
      setNewCallSectionBStatus('');
      setNewCallSectionCVerified(false);
      setNewCallSectionCStatus('');
      setNewCallSectionDVerified(false);
      setNewCallShowValidationErrors(false);

      showNotification('success', `Call ${selectedNewCall} has been initiated and added to the production lines!`);
    } catch (error) {
      console.error('❌ Error submitting initiation:', error);
      setNewCallInitiateError('Failed to save. Please try again.');
    } finally {
      setIsNewCallSaving(false);
    }
  };

  // Fetch inspection data from API (same methodology as Raw Material Dashboard)
  useEffect(() => {
    const fetchInspectionData = async () => {
      if (!call?.call_no) {
        setIsLoading(false);
        return;
      }

      const callNo = call.call_no;

      // Reset fetch flag if call changes
      if (currentCallRef.current !== callNo) {
        console.log(`🔄[Process Dashboard] Call changed from ${currentCallRef.current} to ${callNo} - Resetting fetch flags and clearing state`);
        hasFetchedRef.current = false;
        hasLoadedDraftRef.current = false;
        currentCallRef.current = callNo;

        // Clear any cached state for the previous call to prevent showing stale data
        setFetchedPoData(null);
        setFetchedCallData(null);
        setLocalProductionLines([]);
        setSelectedLine('Line-1'); // Reset to first line
        setIsLoading(true);

        console.log(`🧹[Process Dashboard] Cleared state for previous call, ready to fetch data for ${callNo}`);
      }

      // Prevent duplicate API calls (especially in React StrictMode and when navigating back)
      if (hasFetchedRef.current) {
        console.log('⏭️ [Process Dashboard] Skipping duplicate API call (already fetched for this call)');
        setIsLoading(false);
        return;
      }

      // Check if we have cached data for this call
      if (callInitiationDataCache[callNo]) {
        console.log('✅ [Process Dashboard] Using cached initiation data for call:', callNo);
        console.log('📦 [Cache] Cached data keys:', Object.keys(callInitiationDataCache));
        console.log('📦 [Cache] Current call data:', callInitiationDataCache[callNo]);
        const initiationData = callInitiationDataCache[callNo];

        // Extract manufacturer from rmIcHeatInfoList (first entry)
        const firstHeatInfo = initiationData.rmIcHeatInfoList && initiationData.rmIcHeatInfoList.length > 0
          ? initiationData.rmIcHeatInfoList[0]
          : null;
        const manufacturer = firstHeatInfo?.manufacturer || initiationData.vendorName || '';

        // Map PO data from cached response
        const poData = {
          po_no: initiationData.poNo || call.po_no,
          po_date: initiationData.poDate || '',
          po_description: initiationData.itemDescription || initiationData.poDescription || '',
          po_qty: initiationData.poQty || 0,
          po_unit: initiationData.poUnit || 'Nos.',
          vendor_name: initiationData.vendorName || '',
          contractor: initiationData.vendorName || '',
          manufacturer: manufacturer,
          place_of_inspection: initiationData.placeOfInspection || call?.place_of_inspection || '',
          amendment_no: initiationData.amendmentNo || 'N/A',
          amendment_date: initiationData.amendmentDate || 'N/A',
          consignee: initiationData.consignee || '',
          delivery_date: initiationData.deliveryDate || '',
          purchasing_authority: initiationData.purchasingAuthority || '',
          bpo: initiationData.billPayingOfficer || ''
        };
        setFetchedPoData(poData);

        // Set call data
        setFetchedCallData({
          inspectionCallNo: callNo,
          shiftOfInspection: sessionStorage.getItem('inspectionShift') || 'Day Shift',
          dateOfInspection: sessionStorage.getItem('inspectionDate') || new Date().toISOString().split('T')[0]
        });

        // Restore production lines from sessionStorage if present to preserve user selections
        try {
          const savedLines = sessionStorage.getItem(`processProductionLinesData_${callNo} `);
          if (savedLines) {
            const parsed = JSON.parse(savedLines);
            if (parsed && parsed.length > 0) {
              setLocalProductionLines(parsed);
              console.log('💾 [Process Dashboard] Restored production lines from sessionStorage (cached path)');
            } else if (initialProductionLines && initialProductionLines.length > 0) {
              setLocalProductionLines(initialProductionLines);
              console.log('💾 [Process Dashboard] Initialized production lines from initialProductionLines (cached path)');
            } else {
              // Recalculate unique calls to check for single call scenario
              const callMap = new Map();
              if (availableCalls && Array.isArray(availableCalls)) {
                availableCalls.forEach(c => {
                  if (c?.call_no) callMap.set(c.call_no, c);
                });
              }
              if (call?.call_no && !callMap.has(call.call_no)) {
                callMap.set(call.call_no, {
                  call_no: call.call_no,
                  po_no: call.po_no,
                  productType: call.erc_type || call.product_type || 'ERC Process'
                });
              }
              const uniqueCallList = Array.from(callMap.values());

              if (uniqueCallList.length === 1) {
                // Always use the main call for auto-fill
                const mainCall = uniqueCallList.find(c => c.call_no === call?.call_no) || uniqueCallList[0];
                setLocalProductionLines([{
                  lineNumber: 1,
                  icNumber: mainCall.call_no || '',
                  poNumber: mainCall.po_no || mainCall.poNumber || '',
                  rawMaterialICs: mainCall.rawMaterialICs || '',
                  productType: mainCall.product_type || mainCall.productType || ''
                }]);
                console.log('💾 [Process Dashboard] Auto-filled production line for single available call (cached path)');
              } else if (uniqueCallList.length > 1) {
                setLocalProductionLines(uniqueCallList.map((_, idx) => ({
                  lineNumber: idx + 1,
                  icNumber: '',
                  poNumber: '',
                  rawMaterialICs: '',
                  productType: ''
                })));
                console.log('💾 [Process Dashboard] Created empty production lines for multiple available calls (cached path)');
              } else {
                setLocalProductionLines([{
                  lineNumber: 1,
                  icNumber: '',
                  poNumber: '',
                  rawMaterialICs: '',
                  productType: ''
                }]);
                console.log('💾 [Process Dashboard] Created default single production line (cached path)');
              }
            }
          }
        } catch (e) {
          console.log('⚠️ [Process Dashboard] Error restoring production lines from sessionStorage:', e);
        }

        hasFetchedRef.current = true;
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        console.log('🏭 [Process Dashboard] Fetching data from API for call:', callNo);

        // Fetch initiation data from API
        const initiationData = await fetchProcessInitiationData(callNo);
        console.log('✅ [Process Dashboard] API Response:', initiationData);

        // Cache the initiation data
        setCallInitiationDataCache(prev => ({
          ...prev,
          [callNo]: initiationData
        }));

        // Extract manufacturer from rmIcHeatInfoList (first entry)
        const firstHeatInfo = initiationData.rmIcHeatInfoList && initiationData.rmIcHeatInfoList.length > 0
          ? initiationData.rmIcHeatInfoList[0]
          : null;
        const manufacturer = firstHeatInfo?.manufacturer || initiationData.vendorName || '';

        // Map PO data from API response (similar to Raw Material Dashboard)
        const poData = {
          po_no: initiationData.poNo || call.po_no,
          po_date: initiationData.poDate || '',
          po_description: initiationData.itemDescription || initiationData.poDescription || '',
          po_qty: initiationData.poQty || 0,
          po_unit: initiationData.poUnit || 'Nos.',
          vendor_name: initiationData.vendorName || '',
          contractor: initiationData.vendorName || '',
          manufacturer: manufacturer,
          place_of_inspection: initiationData.placeOfInspection || call?.place_of_inspection || '',
          amendment_no: initiationData.amendmentNo || 'N/A',
          amendment_date: initiationData.amendmentDate || 'N/A',
          consignee: initiationData.consignee || '',
          delivery_date: initiationData.deliveryDate || '',
          purchasing_authority: initiationData.purchasingAuthority || '',
          bpo: initiationData.billPayingOfficer || ''
        };
        setFetchedPoData(poData);

        // Set call data
        setFetchedCallData({
          inspectionCallNo: call.call_no,
          shiftOfInspection: sessionStorage.getItem('inspectionShift') || 'Day Shift',
          dateOfInspection: sessionStorage.getItem('inspectionDate') || new Date().toISOString().split('T')[0]
        });

        // Restore production lines from sessionStorage if present to preserve user selections
        try {
          const savedLines = sessionStorage.getItem(`processProductionLinesData_${callNo} `);
          if (savedLines) {
            const parsed = JSON.parse(savedLines);
            if (parsed && parsed.length > 0) {
              setLocalProductionLines(parsed);
              console.log('💾 [Process Dashboard] Restored production lines from sessionStorage (fresh fetch path)');
            } else {
              populateDefaultLines();
            }
          } else {
            populateDefaultLines();
          }
        } catch (e) {
          console.log('⚠️ [Process Dashboard] Error restoring production lines from sessionStorage:', e);
          populateDefaultLines();
        }

        // Helper function for robust auto-fill (replicated from cached path for consistency)
        function populateDefaultLines() {
          if (initialProductionLines && initialProductionLines.length > 0) {
            setLocalProductionLines(initialProductionLines);
          } else {
            // Recalculate unique calls to check for single call scenario
            const callMap = new Map();
            if (availableCalls && Array.isArray(availableCalls)) {
              availableCalls.forEach(c => {
                if (c?.call_no) callMap.set(c.call_no, c);
              });
            }
            if (call?.call_no && !callMap.has(call.call_no)) {
              callMap.set(call.call_no, {
                call_no: call.call_no,
                po_no: call.po_no,
                productType: call.erc_type || call.product_type || 'ERC Process'
              });
            }
            const uniqueCallList = Array.from(callMap.values());

            if (uniqueCallList.length === 1) {
              // Always use the main call for auto-fill
              const mainCall = uniqueCallList.find(c => c.call_no === call?.call_no) || uniqueCallList[0];
              setLocalProductionLines([{
                lineNumber: 1,
                icNumber: mainCall.call_no || '',
                poNumber: mainCall.po_no || mainCall.poNumber || '',
                rawMaterialICs: mainCall.rawMaterialICs || '',
                productType: mainCall.product_type || mainCall.productType || ''
              }]);
              console.log('💾 [Process Dashboard] Auto-filled production line for single available call (fresh fetch path)');
            } else if (uniqueCallList.length > 1) {
              setLocalProductionLines(uniqueCallList.map((_, idx) => ({
                lineNumber: idx + 1,
                icNumber: '',
                poNumber: '',
                rawMaterialICs: '',
                productType: ''
              })));
              console.log('💾 [Process Dashboard] Created empty production lines for multiple available calls (fresh fetch path)');
            } else {
              setLocalProductionLines([{
                lineNumber: 1,
                icNumber: '',
                poNumber: '',
                rawMaterialICs: '',
                productType: ''
              }]);
              console.log('💾 [Process Dashboard] Created default single production line (fresh fetch path)');
            }
          }
        }

        // Mark as fetched to prevent duplicate calls
        hasFetchedRef.current = true;
      } catch (error) {
        console.error('⚠️ [Process Dashboard] Error fetching inspection data:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInspectionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.call_no, call?.po_no, availableCalls, callInitiationDataCache]);

  // Auto-fetch data for production lines that have call numbers but missing RM IC or product type
  useEffect(() => {
    const fetchMissingData = async () => {
      // Track which lines need data fetching
      const linesToFetch = [];

      for (let i = 0; i < localProductionLines.length; i++) {
        const line = localProductionLines[i];

        // If line has a call number but missing RM IC or product type, mark for fetching
        if (line.icNumber && (!line.rawMaterialICs || !line.productType)) {
          linesToFetch.push({ index: i, callNo: line.icNumber });
        }
      }

      // If no lines need fetching, exit early
      if (linesToFetch.length === 0) {
        return;
      }

      console.log(`🔄 Auto - fetching data for ${linesToFetch.length} production line(s)`);

      // Fetch data for all lines that need it (batched parallel fetch)
      try {
        const uniqueUncached = [...new Set(linesToFetch
          .filter(({ callNo }) => !callInitiationDataCache[callNo])
          .map(({ callNo }) => callNo))];

        const newCacheUpdates = {};

        if (uniqueUncached.length > 0) {
          console.log(`📤 Fetching API data in parallel for ${uniqueUncached.length} unique call(s)`);
          const promises = uniqueUncached.map(callNo =>
            fetchProcessInitiationData(callNo)
              .then(data => ({ callNo, data }))
              .catch(err => ({ callNo, err }))
          );

          const results = await Promise.all(promises);
          results.forEach(res => {
            if (res && res.data) {
              newCacheUpdates[res.callNo] = res.data;
              console.log(`✅ API Response for ${res.callNo}: `, res.data);
            } else {
              console.warn(`⚠️ Failed to fetch data for ${res.callNo}: `, res.err || 'unknown error');
            }
          });

          if (Object.keys(newCacheUpdates).length > 0) {
            setCallInitiationDataCache(prev => ({ ...prev, ...newCacheUpdates }));
          }
        }

        // Update all lines using cached data (existing or newly fetched)
        setLocalProductionLines(prev => {
          const updated = [...prev];
          linesToFetch.forEach(({ index, callNo }) => {
            const data = callInitiationDataCache[callNo] || newCacheUpdates[callNo] || null;
            if (data) {
              // Guard against line being removed while fetch was pending
              if (!updated[index]) return;

              if (!updated[index].rawMaterialICs || !updated[index].productType) {
                updated[index] = {
                  ...updated[index],
                  rawMaterialICs: data.rmIcNumber || '',
                  productType: data.typeOfErc || '',
                  poNumber: data.poNo || updated[index].poNumber
                };
                console.log(`✅ Updated line ${index + 1}: `, updated[index]);
              }
            }
          });
          return updated;
        });
      } catch (err) {
        console.error('❌ [Process Dashboard] Error during parallel initiation data fetch:', err);
      }
    };

    // Only run if we have production lines and not currently loading
    // Also check if any line has a call number selected (don't run on initial empty state)
    const hasCallNumbers = localProductionLines.some(line => line?.icNumber);
    if (!isLoading && localProductionLines.length > 0 && hasCallNumbers) {
      fetchMissingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localProductionLines.length, isLoading, localProductionLines.map(l => l?.icNumber).join(',')]); // Trigger when lines are added, loading completes, or call numbers change

  // Selected line tab - persisted in sessionStorage - scoped to call number
  const [selectedLine, setSelectedLine] = useState(() => {
    const callNoForScoping = call?.call_no;
    if (!callNoForScoping) return 'Line-1';
    return sessionStorage.getItem(`processSelectedLineTab_${callNoForScoping} `) || 'Line-1';
  });

  // Track selected lot number for each production line (line-specific)
  // This prevents cross-line interference when selecting lots
  // Persisted in sessionStorage - scoped to call number
  const [selectedLotByLine, setSelectedLotByLine] = useState(() => {
    const callNoForScoping = call?.call_no;
    if (!callNoForScoping) return {};
    const saved = sessionStorage.getItem(`processSelectedLotByLine_${callNoForScoping} `);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.log('Error parsing saved lot selection:', e);
      }
    }
    return {};
  });

  // Get the selected lot for the current line
  const selectedLotForDisplay = selectedLotByLine[selectedLine] || null;

  // Heat Wise Accountal - Quantity Summary Data
  // Structure: { heatNo: { manufaturedQty, rejectedQty, rmAcceptedQty, acceptedQty }, ... }
  const [heatWiseAccountalData, setHeatWiseAccountalData] = useState({});
  const [isLoadingHeatWiseData, setIsLoadingHeatWiseData] = useState(false);
  const [heatWiseDataError, setHeatWiseDataError] = useState(null);

  // Lot Wise Quantity Breakup - Previous Shift Data
  // Structure: { lotNumber: { manufacturedQty, rejectedQty, acceptedQty, offeredQty }, ... }
  const [previousShiftData, setPreviousShiftData] = useState({});
  const [isLoadingPreviousShiftData, setIsLoadingPreviousShiftData] = useState(false);
  const [previousShiftDataError, setPreviousShiftDataError] = useState(null);

  // Debug logging for lot selection
  useEffect(() => {
    console.log(`📋[Lot Display] Current line: ${selectedLine}, Selected lot: ${selectedLotForDisplay} `);
    console.log(`📋[Lot Display] All lot selections: `, selectedLotByLine);
  }, [selectedLine, selectedLotForDisplay, selectedLotByLine]);

  // Persist selected line tab - scoped to call number
  useEffect(() => {
    if (call?.call_no) {
      sessionStorage.setItem(`processSelectedLineTab_${call.call_no} `, selectedLine);
    }
  }, [selectedLine, call?.call_no]);

  // Persist selected lot by line - scoped to call number
  useEffect(() => {
    if (call?.call_no && Object.keys(selectedLotByLine).length > 0) {
      sessionStorage.setItem(`processSelectedLotByLine_${call.call_no} `, JSON.stringify(selectedLotByLine));
    }
  }, [selectedLotByLine, call?.call_no]);

  // Listen for lot selection events from toggle tab buttons
  useEffect(() => {
    const handleLotSelected = (event) => {
      console.log('📋 [Lot Selection] Lot selected for', selectedLine, ':', event.detail.lot);
      setSelectedLotByLine(prev => ({
        ...prev,
        [selectedLine]: event.detail.lot
      }));
    };

    window.addEventListener('lotSelected', handleLotSelected);
    return () => {
      window.removeEventListener('lotSelected', handleLotSelected);
    };
  }, [selectedLine]);

  // Auto-select first lot for current line if no lot is selected and lots are available
  useEffect(() => {
    // Only run if production lines are initialized
    // Also validate existing selected lot: if it's no longer present in saved data,
    // replace it with the first available lot to avoid stale selections.
    try {
      // If we have a stored selection for this line, validate it below rather than returning early
    } catch (e) {
      // continue
    }

    // Wait for production lines to be initialized
    if (!localProductionLines || localProductionLines.length === 0) {
      return;
    }

    const currentLineIndex = parseInt(selectedLine.replace('Line-', ''), 10) - 1;
    const prodLine = localProductionLines[currentLineIndex];

    if (!prodLine || !prodLine.icNumber) {
      return;
    }

    const poNo = prodLine.poNumber || prodLine.po_no || '';
    const lineIcNumber = prodLine.icNumber || '';
    const inspectionCallNo = lineIcNumber || call?.call_no || '';

    // Get all lots for this line
    const allData = getAllProcessData(inspectionCallNo, poNo, selectedLine);
    const lotsSet = new Set();
    const modules = ['shearingData', 'turningData', 'mpiData', 'forgingData', 'quenchingData', 'temperingData', 'finalCheckData'];

    modules.forEach((moduleName) => {
      if (allData?.[moduleName] && Array.isArray(allData[moduleName])) {
        allData[moduleName].forEach((hourData) => {
          if (hourData.lotNo && hourData.lotNo.trim()) {
            lotsSet.add(hourData.lotNo);
          }
        });
      }
    });

    const allLots = Array.from(lotsSet).sort();

    if (allLots.length > 0) {
      const currentStored = selectedLotByLine[selectedLine];
      // If no stored selection for this line, or stored selection is no longer present,
      // auto-select the first available lot
      if (!currentStored || (currentStored && !allLots.includes(currentStored))) {
        console.log(`📋[Auto - Select] Setting selected lot for ${selectedLine} to: `, allLots[0]);
        setSelectedLotByLine(prev => ({
          ...prev,
          [selectedLine]: allLots[0]
        }));
      } else {
        console.log(`📋[Auto - Select] Existing selected lot for ${selectedLine} is valid: `, currentStored);
      }
    }
  }, [selectedLine, localProductionLines, selectedLotByLine, call?.call_no]);

  // Lot data is now auto-fetched from the call's rm_heat_tc_mapping (read-only)

  // (removed) refresh trigger for recalculating rejected quantities — unused

  // Final Inspection Results - Remarks (manual entry, required)
  // Persisted in sessionStorage - scoped to call number
  const [finalInspectionRemarks, setFinalInspectionRemarks] = useState(() => {
    const callNoForScoping = call?.call_no;
    if (!callNoForScoping) return '';
    return sessionStorage.getItem(`processFinalInspectionRemarks_${callNoForScoping} `) || '';
  });
  // App-level notification state
  const [notification, setNotification] = useState({ type: '', message: '', autoClose: true });
  const [isSaving, setIsSaving] = useState(false);

  // Save Draft state
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveMessage, setDraftSaveMessage] = useState({ type: '', text: '' });
  const draftMessageTimeoutRef = useRef(null);

  // Withheld modal state
  const [showWithheldModal, setShowWithheldModal] = useState(false);
  const [withheldReason, setWithheldReason] = useState('');
  const [withheldRemarks, setWithheldRemarks] = useState('');
  const [withheldError, setWithheldError] = useState('');

  // State for finish inspection call selection modal
  const [showFinishCallSelectionModal, setShowFinishCallSelectionModal] = useState(false);
  const [selectedCallsToFinish, setSelectedCallsToFinish] = useState([]);
  const [callsGroupedByIc, setCallsGroupedByIc] = useState([]);

  /**
   * Reset all production lines related state
   * Called when:
   * - Finish Inspection
   * - Shift Complete
   * - Withhold
   * - Call number changes (new inspection)
   */
  const resetProductionLinesState = useCallback(() => {
    console.log('🔄 Resetting production lines state...');

    // Reset production lines to empty, or auto-fill if only one call available across all sources
    const callMap = new Map();
    if (availableCalls && Array.isArray(availableCalls)) {
      availableCalls.forEach(c => {
        if (c?.call_no) callMap.set(c.call_no, c);
      });
    }
    if (call?.call_no && !callMap.has(call.call_no)) {
      callMap.set(call.call_no, {
        call_no: call.call_no,
        po_no: call.po_no,
        productType: call.erc_type || call.product_type || 'ERC Process'
      });
    }
    const uniqueCallList = Array.from(callMap.values());

    if (uniqueCallList.length === 1) {
      // Always use the main call for auto-fill
      const mainCall = uniqueCallList.find(c => c.call_no === call?.call_no) || uniqueCallList[0];
      setLocalProductionLines([{
        lineNumber: 1,
        icNumber: mainCall.call_no || '',
        poNumber: mainCall.po_no || mainCall.poNumber || '',
        rawMaterialICs: mainCall.rawMaterialICs || '',
        productType: mainCall.product_type || mainCall.productType || ''
      }]);
    } else {
      setLocalProductionLines([{
        lineNumber: 1,
        icNumber: '',
        poNumber: '',
        rawMaterialICs: '',
        productType: ''
      }]);
    }

    // Reset call initiation data cache
    setCallInitiationDataCache({});

    // Reset additional initiated calls
    setAdditionalInitiatedCalls([]);

    // Reset selected line
    setSelectedLine('Line-1');

    // Reset selected lot by line
    setSelectedLotByLine({});

    // Reset manufactured quantities
    setManufacturedQtyByLine({});

    console.log('✅ Production lines state reset complete');
  }, [availableCalls, call]);

  // Detect call number changes and reset state
  useEffect(() => {
    // Skip on initial mount
    if (!currentCallRef.current) {
      currentCallRef.current = call?.call_no;
      return;
    }

    // Detect call number change (new inspection started)
    if (call?.call_no && currentCallRef.current !== call.call_no) {
      console.log(`🔄 Call number changed: ${currentCallRef.current} → ${call.call_no} `);

      // Reset production lines state for new inspection
      resetProductionLinesState();
    }

    // Update current call ref
    currentCallRef.current = call?.call_no;
  }, [call?.call_no, resetProductionLinesState]);

  // Persist final inspection remarks - scoped to call number
  useEffect(() => {
    if (call?.call_no) {
      sessionStorage.setItem(`processFinalInspectionRemarks_${call.call_no} `, finalInspectionRemarks);
    }
  }, [finalInspectionRemarks, call?.call_no]);

  // Reset session control when dashboard mounts (new inspection)
  useEffect(() => {
    resetSessionControl();
    console.log('✅ Dashboard mounted - session control reset, saves enabled');
  }, []);


  // Derive manufacturing lines from production lines table (moved up for use in callbacks)
  const manufacturingLines = useMemo(() => {
    return localProductionLines.length > 0
      ? localProductionLines.map((_, idx) => `Line - ${idx + 1} `)
      : ['Line-1'];
  }, [localProductionLines]);

  /**
   * Handle Save Draft - Save all dashboard data to localStorage
   */
  const handleSaveDraft = useCallback(() => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo) {
      setDraftSaveMessage({ type: 'error', text: 'Cannot save draft: No inspection call number found' });
      return;
    }

    setIsSavingDraft(true);

    // Clear any existing timeout
    if (draftMessageTimeoutRef.current) {
      clearTimeout(draftMessageTimeoutRef.current);
    }

    try {
      // Collect all dashboard form data
      const draftData = {
        savedAt: new Date().toISOString(),
        productionLines: localProductionLines,
        selectedLine: selectedLine,
        finalInspectionRemarks: finalInspectionRemarks,
        productionLinesExpanded: productionLinesExpanded
      };

      // Save to localStorage with inspection call number as key
      const storageKey = `${DASHBOARD_DRAFT_KEY}${inspectionCallNo} `;
      localStorage.setItem(storageKey, JSON.stringify(draftData));

      // Show success message
      setDraftSaveMessage({ type: 'success', text: `Draft saved successfully at ${new Date().toLocaleTimeString()} ` });

      // Clear message after 3 seconds
      draftMessageTimeoutRef.current = setTimeout(() => {
        setDraftSaveMessage({ type: '', text: '' });
      }, 3000);

    } catch (error) {
      console.error('Error saving draft:', error);
      setDraftSaveMessage({ type: 'error', text: `Failed to save draft: ${error.message} ` });

      // Clear error message after 5 seconds
      draftMessageTimeoutRef.current = setTimeout(() => {
        setDraftSaveMessage({ type: '', text: '' });
      }, 5000);
    } finally {
      setIsSavingDraft(false);
    }
  }, [call?.call_no, localProductionLines, selectedLine, finalInspectionRemarks, productionLinesExpanded]);

  // Load draft data from localStorage on mount
  useEffect(() => {
    const inspectionCallNo = call?.call_no;
    if (!inspectionCallNo) return;

    try {
      const storageKey = `${DASHBOARD_DRAFT_KEY}${inspectionCallNo} `;
      const savedDraft = localStorage.getItem(storageKey);

      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);

        // Restore production lines if they exist in draft
        if (draftData.productionLines && draftData.productionLines.length > 0) {
          // Only restore if current state is empty or default
          const hasEmptyLines = localProductionLines.every(line => !line.icNumber);
          if (hasEmptyLines) {
            setLocalProductionLines(draftData.productionLines);
          }
        }

        // Restore selected line
        if (draftData.selectedLine) {
          setSelectedLine(draftData.selectedLine);
        }

        // Restore remarks if empty
        if (draftData.finalInspectionRemarks && !finalInspectionRemarks) {
          setFinalInspectionRemarks(draftData.finalInspectionRemarks);
        }

        // Restore expanded state
        if (typeof draftData.productionLinesExpanded === 'boolean') {
          setProductionLinesExpanded(draftData.productionLinesExpanded);
        }

        console.log('Draft data restored from localStorage:', draftData.savedAt);
      }
    } catch (error) {
      console.error('Error loading draft data:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.call_no]); // Only run on mount and when call changes

  // Note: handleShiftCompleted was removed as it's not currently used in the UI

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (draftMessageTimeoutRef.current) {
        clearTimeout(draftMessageTimeoutRef.current);
      }
    };
  }, []);

  const showNotification = (type, message, autoClose = true) => {
    setNotification({ type, message, autoClose });
    if (autoClose) {
      setTimeout(() => setNotification({ type: '', message: '', autoClose: true }), 4000);
    }
  };

  /**
   * Group production lines by their IC (call) number
   * Returns array of objects: { icNumber, lines: ['Line-1', 'Line-2'], poNumber }
   */
  const groupLinesByCallNumber = useCallback(() => {
    const grouped = {};

    manufacturingLines.forEach((line, lineIdx) => {
      const prodLine = localProductionLines[lineIdx];
      if (!prodLine || !prodLine.icNumber) {
        console.warn(`⚠️[Group Lines] No IC number for ${line}`);
        return;
      }

      const icNumber = prodLine.icNumber;
      const poNumber = prodLine.poNumber || prodLine.po_no || '';

      if (!grouped[icNumber]) {
        grouped[icNumber] = {
          icNumber,
          poNumber,
          lines: []
        };
      }

      grouped[icNumber].lines.push(line);
    });

    return Object.values(grouped);
  }, [manufacturingLines, localProductionLines]);

  /**
   * Handle Finish Inspection button click - show call selection modal
   */
  const handleFinishInspectionClick = useCallback(() => {
    // Group lines by call number
    const groupedCalls = groupLinesByCallNumber();

    console.log('📋 [Finish] Grouped calls:', groupedCalls);

    if (groupedCalls.length === 0) {
      showNotification('error', 'No production lines with call numbers found');
      return;
    }

    // Set the grouped calls and pre-select all of them
    setCallsGroupedByIc(groupedCalls);
    setSelectedCallsToFinish(groupedCalls.map(g => g.icNumber));

    // Show the modal
    setShowFinishCallSelectionModal(true);
  }, [groupLinesByCallNumber]);

  // Note: handleFinishInspection was removed as it's not currently used and redundant with executeFinishInspection



  /**
   * Handle cancel finish modal
   */
  const handleCancelFinishModal = useCallback(() => {
    setShowFinishCallSelectionModal(false);
    setSelectedCallsToFinish([]);
    setCallsGroupedByIc([]);
  }, []);

  /**
   * Toggle call selection in modal
   */
  const handleToggleCallSelection = useCallback((icNumber) => {
    setSelectedCallsToFinish(prev => {
      if (prev.includes(icNumber)) {
        return prev.filter(c => c !== icNumber);
      } else {
        return [...prev, icNumber];
      }
    });
  }, []);

  // Withheld modal handlers
  const handleCloseWithheldModal = () => {
    setShowWithheldModal(false);
    setWithheldReason('');
    setWithheldRemarks('');
    setWithheldError('');
  };

  const handleSubmitWithheld = async () => {
    if (!withheldReason) {
      setWithheldError('Please select a reason');
      return;
    }
    if (withheldReason === 'ANY_OTHER' && !withheldRemarks.trim()) {
      setWithheldError('Please provide remarks for "Any other" reason');
      return;
    }

    setIsSaving(true);
    try {
      const actionData = {
        inspectionRequestId: call?.api_id || null,
        callNo: call?.call_no,
        poNo: call?.po_no,
        actionType: 'WITHHELD',
        reason: withheldReason,
        remarks: withheldRemarks.trim(),
        status: 'WITHHELD',
        actionDate: new Date().toISOString()
      };

      // Process Material: Save to localStorage only (no API call)
      console.log('🏭 Process Material: Withheld saved to localStorage only (no API call)');
      console.log('Withheld Data:', actionData);

      // Mark call as withheld in local storage
      markAsWithheld(call?.call_no, withheldRemarks.trim());

      // Perform comprehensive cleanup
      performInspectionCleanup(call?.call_no, localProductionLines, manufacturingLines);

      // Reset React state
      resetProductionLinesState();

      showNotification('success', 'Inspection has been withheld successfully');
      handleCloseWithheldModal();
      onBack();
    } catch (error) {
      console.error('Error withholding inspection:', error);
      setWithheldError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quantity Summary state - fetched from API
  const [quantitySummary, setQuantitySummary] = useState({
    rawMaterialAccepted: 0,
    processManufacturedFromApi: 0,
    processInspectionAcceptedFromApi: 0
  });

  // Fetch quantity summary from API when component mounts or call changes
  useEffect(() => {
    const fetchQuantitySummary = async () => {
      try {
        if (!call?.call_no) {
          console.log('⚠️ No inspection call number found');
          return;
        }

        console.log('📊 Fetching quantity summary for call:', call.call_no);
        const data = await getQuantitySummary(call.call_no);

        if (data) {
          console.log('✅ Quantity Summary API Response:', data);
          setQuantitySummary({
            rawMaterialAccepted: data.totalOfferedQty || 0,
            processManufacturedFromApi: data.totalManufactureQty || 0,
            processInspectionAcceptedFromApi: data.acceptedQty || 0
          });
        }
      } catch (error) {
        console.error('❌ Error fetching quantity summary:', error);
        // Set default values if API fails
        setQuantitySummary({
          rawMaterialAccepted: 0,
          processManufacturedFromApi: 0,
          processInspectionAcceptedFromApi: 0
        });
      }
    };

    fetchQuantitySummary();
  }, [call?.call_no]);

  // Use API data for raw material accepted, fallback to 0
  const rawMaterialAccepted = quantitySummary.rawMaterialAccepted;
  // const poOrderedQty = 450; // Qty Ordered in PO - Not currently used

  // Manual entry state for "Manufactured" column - PER LINE PER LOT (keyed by [line][lot])
  // Initialize as empty - will be populated by useEffect after callInitiationDataCache is available
  const [manufacturedQtyByLine, setManufacturedQtyByLine] = useState({});

  // Load manufactured quantities from localStorage for all lines and lots
  useEffect(() => {
    if (!callInitiationDataCache || Object.keys(callInitiationDataCache).length === 0) {
      return; // Wait for cache to be populated
    }

    try {
      const allMfgQty = {};
      localProductionLines.forEach((prodLine, lineIndex) => {
        const lineNo = `Line - ${lineIndex + 1} `;
        const poNo = prodLine.poNumber || prodLine.po_no || call?.po_no || '';
        const inspectionCallNo = call?.call_no || '';

        if (inspectionCallNo && poNo) {
          // Initialize line object if not exists
          if (!allMfgQty[lineNo]) {
            allMfgQty[lineNo] = {};
          }

          // Get all lots for this line from the initiation data
          const initiationData = callInitiationDataCache[prodLine.icNumber];
          const lotsForThisLine = initiationData?.lotDetailsList?.map(lot => lot.lotNumber) || [];

          // Load manufactured quantities for each lot in this line
          lotsForThisLine.forEach(lotNo => {
            const lineFinalResult = loadFromLocalStorage('lineFinalResult', inspectionCallNo, poNo, lineNo, lotNo);
            if (lineFinalResult) {
              // Store manufactured quantities per lot
              // OPTIMIZATION: Only include keys that actually have seeded values.
              // This prevents overwriting valid user input with empty strings if the storage is null/incomplete.
              const mfgData = {};
              if (lineFinalResult.shearingManufactured) mfgData.shearing = String(lineFinalResult.shearingManufactured);
              if (lineFinalResult.turningManufactured) mfgData.turning = String(lineFinalResult.turningManufactured);
              if (lineFinalResult.mpiManufactured) mfgData.mpiTesting = String(lineFinalResult.mpiManufactured);
              if (lineFinalResult.forgingManufactured) mfgData.forging = String(lineFinalResult.forgingManufactured);
              if (lineFinalResult.quenchingManufactured) mfgData.quenching = String(lineFinalResult.quenchingManufactured);
              if (lineFinalResult.temperingManufactured) mfgData.tempering = String(lineFinalResult.temperingManufactured);

              allMfgQty[lineNo][lotNo] = mfgData;
              console.log(`📋[Load] Loaded manufactured quantities for ${lineNo}, Lot ${lotNo}: `, allMfgQty[lineNo][lotNo]);
            }
          });
        }
      });

      if (Object.keys(allMfgQty).length > 0) {
        // Merge with existing state to preserve unsaved changes
        setManufacturedQtyByLine(prevState => {
          const newState = { ...prevState };

          Object.keys(allMfgQty).forEach(lineKey => {
            if (!newState[lineKey]) {
              newState[lineKey] = {};
            }

            Object.keys(allMfgQty[lineKey]).forEach(lotKey => {
              // Only update if we actually have data from storage
              // This is critical: if we have user input in state but storage is empty/null,
              // we must NOT overwrite the user input with empty/null from storage.
              // We assume `allMfgQty` only contains entries where `lineFinalResult` existed.
              newState[lineKey][lotKey] = {
                ...newState[lineKey][lotKey],
                ...allMfgQty[lineKey][lotKey]
              };
            });
          });

          return newState;
        });
      }
    } catch (error) {
      console.error('❌ [Load] Error loading manufactured quantities:', error);
    }
  }, [callInitiationDataCache, localProductionLines, call?.call_no, call?.po_no]);

  // Get the selected lot for the current line from the 8-hour grid data (returns first lot only)
  // MUST be defined before manufacturedQty useMemo that uses it
  const getSelectedLotForCurrentLine = useCallback(() => {
    try {
      // Check if production lines are initialized
      if (!localProductionLines || localProductionLines.length === 0) {
        return null;
      }

      const currentLineIndex = parseInt(selectedLine.replace('Line-', ''), 10) - 1;
      const prodLine = localProductionLines[currentLineIndex];

      // Ensure we have valid production line data
      if (!prodLine || !prodLine.icNumber) {
        return null;
      }

      const poNo = prodLine.poNumber || prodLine.po_no || '';
      // Use the line's specific IC number, not the main call number
      const lineIcNumber = prodLine.icNumber || '';
      const inspectionCallNo = lineIcNumber || call?.call_no || '';

      // Get all process data from localStorage
      const allData = getAllProcessData(inspectionCallNo, poNo, selectedLine);

      // Check shearing data first (most common starting point)
      // Note: getAllProcessData returns keys like 'shearingData', 'turningData', etc.
      if (allData?.shearingData && Array.isArray(allData.shearingData)) {
        // Find the first non-empty lot number from the grid data
        for (const hourData of allData.shearingData) {
          if (hourData.lotNo && hourData.lotNo.trim()) {
            return hourData.lotNo;
          }
        }
      }

      // Fallback to other modules if shearing doesn't have lot data
      const modules = ['turningData', 'mpiData', 'forgingData', 'quenchingData', 'temperingData', 'finalCheckData'];
      for (const moduleName of modules) {
        if (allData?.[moduleName] && Array.isArray(allData[moduleName])) {
          for (const hourData of allData[moduleName]) {
            if (hourData.lotNo && hourData.lotNo.trim()) {
              return hourData.lotNo;
            }
          }
        }
      }

      // NEW FALLBACK: If no lot found in localStorage (user hasn't entered grid data yet),
      // try to get the lot from the initiation data cache.
      const initiationData = callInitiationDataCache[lineIcNumber];
      if (initiationData) {
        // Try lotDetailsList first
        if (initiationData.lotDetailsList && initiationData.lotDetailsList.length > 0) {
          return initiationData.lotDetailsList[0].lotNumber;
        }
        // Try single lotNumber field
        if (initiationData.lotNumber) {
          return initiationData.lotNumber;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.call_no, selectedLine, localProductionLines]);

  // Get manufactured qty for current line and selected lot
  const manufacturedQty = useMemo(() => {
    // Use selectedLotForDisplay if available, otherwise get the first lot
    let lotNo = selectedLotForDisplay;
    if (!lotNo) {
      lotNo = getSelectedLotForCurrentLine();
    }

    return (manufacturedQtyByLine[selectedLine] && manufacturedQtyByLine[selectedLine][lotNo]) || {
      shearing: '',
      turning: '',
      mpiTesting: '',
      forging: '',
      quenching: '',
      tempering: ''
    };
  }, [manufacturedQtyByLine, selectedLine, selectedLotForDisplay, getSelectedLotForCurrentLine]);

  // Helper function to validate manufactured quantity against rejected quantity (on blur)
  const handleManufacturedBlur = (field, value, rejectedValue) => {
    const numValue = parseInt(value) || 0;
    const numRejected = rejectedValue || 0;
    const lotNo = selectedLotForDisplay || getSelectedLotForCurrentLine();

    // If user enters a value less than rejected, show alert and clear the field
    if (value !== '' && numValue < numRejected) {
      showNotification('error', `Manufactured quantity(${numValue}) cannot be less than rejected quantity(${numRejected})`);
      setManufacturedQtyByLine(prev => ({
        ...prev,
        [selectedLine]: {
          ...prev[selectedLine],
          [lotNo]: { ...(prev[selectedLine]?.[lotNo] || {}), [field]: '' }
        }
      }));
      // Persist cleared value
      try { persistLineFinalResult(field, ''); } catch (e) { console.warn('Persist clear failed', e); }
      return;
    }

    // Persist the entered manufactured quantity so lot-wise table updates immediately
    try {
      persistLineFinalResult(field, value);
      // Force re-render ensures the Lot Wise Table reads the newly saved value from localStorage
      setManufacturedQtyByLine(prev => ({ ...prev }));
    } catch (e) {
      console.warn('Persist manufactured failed', e);
    }
  };

  // Persist lineFinalResult is declared later to ensure `rejectedQty` and `acceptedQty` are initialized

  // Get ALL selected lots from the 8-hour grid data (across all sections)
  const getAllSelectedLotsForCurrentLine = useCallback((lineNo = null) => {
    try {
      const targetLine = lineNo || selectedLine;

      // Check if production lines are initialized
      if (!localProductionLines || localProductionLines.length === 0) {
        return [];
      }

      const currentLineIndex = parseInt(targetLine.replace('Line-', ''), 10) - 1;
      const prodLine = localProductionLines[currentLineIndex];

      // Ensure we have valid production line data
      if (!prodLine || !prodLine.icNumber) {
        return [];
      }

      const poNo = prodLine.poNumber || prodLine.po_no || '';
      // Use the line's specific IC number, not the main call number
      const lineIcNumber = prodLine.icNumber || '';
      const inspectionCallNo = lineIcNumber || call?.call_no || '';

      console.log(`📋[All Selected Lots] Getting all lots for: ${targetLine} `, { poNo, inspectionCallNo, lineIcNumber });
      // Get all process data from localStorage
      const allData = getAllProcessData(inspectionCallNo, poNo, targetLine);

      // Collect all unique lot numbers from all modules
      const lotsSet = new Set();
      const modules = ['shearingData', 'turningData', 'mpiData', 'forgingData', 'quenchingData', 'temperingData', 'finalCheckData'];

      modules.forEach((moduleName) => {
        if (allData?.[moduleName] && Array.isArray(allData[moduleName])) {
          allData[moduleName].forEach((hourData) => {
            if (hourData.lotNo && hourData.lotNo.trim()) {
              lotsSet.add(hourData.lotNo.trim());
            }
          });
        }
      });

      let allLots = Array.from(lotsSet).sort();

      // If no lots found in localStorage (user hasn't saved yet), fallback to initiation data cache
      if ((!allLots || allLots.length === 0) && callInitiationDataCache) {
        try {
          const initData = callInitiationDataCache[lineIcNumber] || null;
          const initLots = initData?.lotDetailsList ? initData.lotDetailsList.map(l => l.lotNumber) : [];
          if (initLots && initLots.length > 0) {
            console.log(`ℹ️[All Selected Lots] Falling back to initiation data lots for ${targetLine}: `, initLots);
            allLots = initLots.map(l => l.trim()).sort();
          }
        } catch (e) {
          // ignore
        }
      }

      console.log(`✅[All Selected Lots] All unique lots found for ${targetLine}: `, allLots);
      return allLots;
    } catch (error) {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.call_no, selectedLine, localProductionLines, callInitiationDataCache]);

  // Helper function to calculate rejected quantities for a SPECIFIC lot (used by both lot-wise and summary calculations)
  const calculateRejectedForSpecificLot = useCallback((submoduleName, specificLot, lineNo, rejectedField = null) => {
    // Check if production lines are initialized
    if (!localProductionLines || localProductionLines.length === 0) {
      console.log(`📊[Rejected Calc] Production lines not initialized yet for ${submoduleName}`);
      return 0;
    }

    // Use current active line if not provided
    const targetLine = lineNo || selectedLine;
    const lineIndex = parseInt(targetLine.replace('Line-', ''), 10) - 1;
    const prodLine = localProductionLines[lineIndex];

    // Ensure we have valid production line data
    if (!prodLine || !prodLine.icNumber) {
      console.log(`📊[Rejected Calc] No production line data for ${targetLine}`);
      return 0;
    }

    const poNo = prodLine.poNumber || prodLine.po_no || '';
    const lineIcNumber = prodLine.icNumber || '';
    const inspectionCallNo = lineIcNumber || call?.call_no || '';

    const allData = getAllProcessData(inspectionCallNo, poNo, targetLine);

    if (!allData || !allData[submoduleName]) {
      return 0;
    }

    const submoduleData = allData[submoduleName];
    let totalRejected = 0;

    // Get all lots for this line to handle empty lotNo values
    const allLots = getAllSelectedLotsForCurrentLine(targetLine);
    const targetLotTrimmed = specificLot ? String(specificLot).trim() : null;

    if (Array.isArray(submoduleData)) {
      submoduleData.forEach((hourData, idx) => {
        // Lot filtering logic
        if (targetLotTrimmed) {
          const hourLotTrimmed = hourData.lotNo ? String(hourData.lotNo).trim() : '';

          // 1. If hour has a lot number, it must match
          if (hourLotTrimmed && hourLotTrimmed !== targetLotTrimmed) {
            return;
          }

          // 2. If hour has no lot number, only include if there's exactly one lot for the line
          if (!hourLotTrimmed) {
            const isSingleLotLine = Array.isArray(allLots) && allLots.length === 1 && String(allLots[0]).trim() === targetLotTrimmed;
            if (!isSingleLotLine) return;
          }
        }

        // Summing logic (unchanged but robust)
        if (rejectedField && hourData[rejectedField] !== undefined && hourData[rejectedField] !== null) {
          totalRejected += parseInt(hourData[rejectedField]) || 0;
        } else if (!rejectedField && hourData.rejectedQty !== undefined && hourData.rejectedQty !== null) {
          if (Array.isArray(hourData.rejectedQty)) {
            hourData.rejectedQty.forEach(qty => totalRejected += (parseInt(qty) || 0));
          } else {
            totalRejected += parseInt(hourData.rejectedQty) || 0;
          }
        } else if (!rejectedField) {
          Object.keys(hourData).forEach(key => {
            if (key.match(/^rejectedQty(\d+)$/i)) totalRejected += (parseInt(hourData[key]) || 0);
          });
        }
      });
    }

    if (totalRejected > 0) {
      console.log(`✅[Rejected Calc] ${submoduleName} | Lot: ${specificLot} | Line: ${targetLine} | Rejections: ${totalRejected} `);
    }
    return totalRejected;
  }, [call?.call_no, selectedLine, localProductionLines, getAllSelectedLotsForCurrentLine]);

  // Helper function to get the full rejected quantity for a specific module and lot
  // Handles multi-field rejections for Forging, Quenching, Tempering, and Testing
  const getModuleTotalRejected = useCallback((moduleName, lotNo = null, lineNo = null) => {
    // If lotNo/lineNo is not provided, use the currently selected lot (for summary display)
    const targetLot = lotNo || selectedLotForDisplay || getSelectedLotForCurrentLine();
    const targetLine = lineNo || selectedLine;

    // Always include the general rejectedQty field (important for mobile/fallback)
    const baseTotal = calculateRejectedForSpecificLot(moduleName, targetLot, targetLine, null);

    if (moduleName === 'shearingData' || moduleName === 'turningData' || moduleName === 'mpiData') {
      return baseTotal;
    }

    let specificTotal = 0;

    if (moduleName === 'forgingData') {
      specificTotal = calculateRejectedForSpecificLot('forgingData', targetLot, targetLine, 'forgingTemperatureRejected') +
        calculateRejectedForSpecificLot('forgingData', targetLot, targetLine, 'forgingStabilisationRejected') +
        calculateRejectedForSpecificLot('forgingData', targetLot, targetLine, 'improperForgingRejected') +
        calculateRejectedForSpecificLot('forgingData', targetLot, targetLine, 'forgingDefectRejected') +
        calculateRejectedForSpecificLot('forgingData', targetLot, targetLine, 'embossingDefectRejected');
    }

    else if (moduleName === 'quenchingData') {
      specificTotal = calculateRejectedForSpecificLot('quenchingData', targetLot, targetLine, 'quenchingHardnessRejected') +
        calculateRejectedForSpecificLot('quenchingData', targetLot, targetLine, 'boxGaugeRejected') +
        calculateRejectedForSpecificLot('quenchingData', targetLot, targetLine, 'flatBearingAreaRejected') +
        calculateRejectedForSpecificLot('quenchingData', targetLot, targetLine, 'fallingGaugeRejected');
    }

    else if (moduleName === 'temperingData') {
      specificTotal = calculateRejectedForSpecificLot('temperingData', targetLot, targetLine, 'temperingTemperatureRejected') +
        calculateRejectedForSpecificLot('temperingData', targetLot, targetLine, 'temperingDurationRejected');
    }

    else if (moduleName === 'testingFinishingData') {
      specificTotal = calculateRejectedForSpecificLot('testingFinishingData', targetLot, targetLine, 'toeLoadRejected') +
        calculateRejectedForSpecificLot('testingFinishingData', targetLot, targetLine, 'weightRejected') +
        calculateRejectedForSpecificLot('testingFinishingData', targetLot, targetLine, 'paintIdentificationRejected') +
        calculateRejectedForSpecificLot('testingFinishingData', targetLot, targetLine, 'ercCoatingRejected');
    }

    return baseTotal + specificTotal;
  }, [calculateRejectedForSpecificLot, selectedLine, selectedLotForDisplay, getSelectedLotForCurrentLine]);

  // Calculate rejected quantities from submodule localStorage data
  // Now filters by the selected lot number (from toggle tab or first lot if only one)
  const calculateRejectedFromSubmodule = useCallback((submoduleName, rejectedField = null) => {
    // Use selectedLotForDisplay if available (from toggle tab), otherwise get the first lot
    let selectedLot = selectedLotForDisplay;

    if (!selectedLot) {
      selectedLot = getSelectedLotForCurrentLine();
    }

    console.log(`📋[${submoduleName}] Calculating rejected for selected lot: `, selectedLot);


    const totalRejected = calculateRejectedForSpecificLot(submoduleName, selectedLot, selectedLine, rejectedField);


    return totalRejected;
  }, [selectedLine, selectedLotForDisplay, getSelectedLotForCurrentLine, calculateRejectedForSpecificLot]);

  // Calculate rejected quantities for Final Check section
  // checkType: 'visual' | 'dimensions' | 'hardness'
  const calculateFinalCheckRejected = useCallback((checkType, lineNo = null) => {
    // Check if production lines are initialized
    if (!localProductionLines || localProductionLines.length === 0) {
      console.log(`📊[Final Check] Production lines not initialized yet for ${checkType}`);
      return 0;
    }

    const targetLine = lineNo || selectedLine;
    const currentLineIndex = parseInt(targetLine.replace('Line-', ''), 10) - 1;
    const prodLine = localProductionLines[currentLineIndex];

    // Ensure we have valid production line data
    if (!prodLine || !prodLine.icNumber) {
      console.log(`📊[Final Check] No production line data for ${targetLine}`);
      return 0;
    }

    const poNo = prodLine.poNumber || prodLine.po_no || '';
    // Use the line's specific IC number, not the main call number
    const lineIcNumber = prodLine.icNumber || '';
    const inspectionCallNo = lineIcNumber || call?.call_no || '';

    const allData = getAllProcessData(inspectionCallNo, poNo, targetLine);

    if (!allData || !allData.finalCheckData) {
      return 0;
    }

    // Use selectedLotForDisplay if available (from toggle tab), otherwise get the first lot
    let selectedLot = selectedLotForDisplay;
    if (!selectedLot) {
      selectedLot = getSelectedLotForCurrentLine();
    }
    console.log(`📋[Final Check] Calculating ${checkType} rejected for selected lot: `, selectedLot);

    const finalCheckData = allData.finalCheckData;
    let totalRejected = 0;

    // Define which fields to sum for each check type
    const fieldMap = {
      visual: ['surfaceDefectRejected', 'embossingDefectRejected', 'markingRejected'],
      dimensions: ['boxGaugeRejected', 'flatBearingAreaRejected', 'fallingGaugeRejected'],
      hardness: ['temperingHardnessRejected']
    };

    const fieldsToSum = fieldMap[checkType] || [];

    if (Array.isArray(finalCheckData)) {
      const targetLotTrimmed = selectedLot ? String(selectedLot).trim() : null;

      finalCheckData.forEach((hourData) => {
        // Only count rejected quantities for the selected lot
        const hourLotTrimmed = hourData.lotNo ? String(hourData.lotNo).trim() : '';
        if (targetLotTrimmed && hourLotTrimmed !== targetLotTrimmed) {
          return; // Skip this hour if it's for a different lot
        }

        // Sum the specified fields for this check type
        fieldsToSum.forEach(field => {
          if (hourData[field] !== undefined && hourData[field] !== null) {
            const num = parseInt(hourData[field]) || 0;
            totalRejected += num;
          }
        });
      });
    }

    return totalRejected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.call_no, selectedLine, localProductionLines, selectedLotForDisplay, getSelectedLotForCurrentLine]);

  // Get total rejected quantities for a SPECIFIC lot across ALL stages
  // Used by "Lot Wise Quantity Breakup" table to show lot-specific rejected quantities
  // Reads from the saved lineFinalResult which already has all rejected quantities calculated
  const getTotalRejectedForLot = useCallback((lotNo, lineNo = null) => {
    // Check if production lines are initialized
    if (!localProductionLines || localProductionLines.length === 0) {
      console.log(`📦[Lot Wise] Production lines not initialized yet for lot ${lotNo}`);
      return 0;
    }

    const targetLine = lineNo || selectedLine;
    const currentLineIndex = parseInt(targetLine.replace('Line-', ''), 10) - 1;
    const prodLine = localProductionLines[currentLineIndex];

    // Ensure we have valid production line data
    if (!prodLine || !prodLine.icNumber) {
      console.log(`📦[Lot Wise] No production line data for ${targetLine}`);
      return 0;
    }

    const poNo = prodLine.poNumber || prodLine.po_no || '';
    // Use the line's specific IC number, not the main call number
    const lineIcNumber = prodLine.icNumber || '';
    const inspectionCallNo = lineIcNumber || call?.call_no || '';

    console.log(`📦[Lot Wise] Loading lineFinalResult for lot ${lotNo}, IC: ${inspectionCallNo}, PO: ${poNo}, Line: ${targetLine} `);


    // Fallback: compute rejected totals directly
    // from the submodule data in localStorage using the unified module helper
    try {
      let fallbackTotal = 0;

      fallbackTotal += getModuleTotalRejected('shearingData', lotNo, targetLine);
      fallbackTotal += getModuleTotalRejected('turningData', lotNo, targetLine);
      fallbackTotal += getModuleTotalRejected('mpiData', lotNo, targetLine);
      fallbackTotal += getModuleTotalRejected('forgingData', lotNo, targetLine);
      fallbackTotal += getModuleTotalRejected('quenchingData', lotNo, targetLine);
      fallbackTotal += getModuleTotalRejected('temperingData', lotNo, targetLine);
      fallbackTotal += getModuleTotalRejected('testingFinishingData', lotNo, targetLine);

      // Add Final Check rejections (Visual, Dimensions, Hardness)
      fallbackTotal += calculateFinalCheckRejected('visual', targetLine);
      fallbackTotal += calculateFinalCheckRejected('dimensions', targetLine);
      fallbackTotal += calculateFinalCheckRejected('hardness', targetLine);

      console.log(`📦[Lot Wise] Fallback total rejected for ${lotNo} on ${targetLine}: `, fallbackTotal);
      return fallbackTotal;
    } catch (e) {
      console.warn(`📦[Lot Wise] Fallback rejected calc failed for ${lotNo}: `, e);
      return 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLine, localProductionLines, call?.call_no, calculateRejectedForSpecificLot, calculateFinalCheckRejected, getModuleTotalRejected]);





  // Calculate rejected quantities for each section
  const rejectedQty = useMemo(() => {
    console.log(`📊[Rejected Qty] Computing for line: ${selectedLine}, lot: ${selectedLotForDisplay || getSelectedLotForCurrentLine()} `);


    const visualCheckRejected = calculateFinalCheckRejected('visual'); // Surface Defect + Embossing Defect + Marking
    const dimensionsCheckRejected = calculateFinalCheckRejected('dimensions'); // Box Gauge + Flat Bearing Area + Falling Gauge
    const hardnessCheckRejected = calculateFinalCheckRejected('hardness'); // Tempering Hardness

    // Testing & Finishing rejected = sum of all 4 rejection fields from testingFinishingData
    const testingFinishingRejected = calculateRejectedFromSubmodule('testingFinishingData', 'toeLoadRejected') +
      calculateRejectedFromSubmodule('testingFinishingData', 'weightRejected') +
      calculateRejectedFromSubmodule('testingFinishingData', 'paintIdentificationRejected') +
      calculateRejectedFromSubmodule('testingFinishingData', 'ercCoatingRejected');

    // Tempering-specific rejections from tempering 8hr grid (ONLY temperature and duration)
    // NOTE: Visual/Dimensions/Hardness/Testing&Finishing are already counted in their own separate rows
    const temperingTempRejected = calculateRejectedFromSubmodule('temperingData', 'temperingTemperatureRejected');
    const temperingDurationRejected = calculateRejectedFromSubmodule('temperingData', 'temperingDurationRejected');

    // Tempering rejected = Final Check (Visual + Dimensions + Hardness) + Testing & Finishing + Tempering Temp + Tempering Duration
    // This shows the COMPLETE tempering rejection count in the dashboard summary
    const temperingRejected = visualCheckRejected + dimensionsCheckRejected + hardnessCheckRejected +
      testingFinishingRejected + temperingTempRejected + temperingDurationRejected;



    const result = {
      shearing: getModuleTotalRejected('shearingData'),
      turning: getModuleTotalRejected('turningData'),
      mpiTesting: getModuleTotalRejected('mpiData'),
      forging: getModuleTotalRejected('forgingData'),
      quenching: getModuleTotalRejected('quenchingData'),
      tempering: temperingRejected, // DISPLAY value: Includes Final Check + Testing + Base
      temperingBase: getModuleTotalRejected('temperingData'), // CALCULATION value: ONLY Tempering Temp + Duration
      visualCheck: visualCheckRejected,
      dimensionsCheck: dimensionsCheckRejected,
      hardnessCheck: hardnessCheckRejected,
      testingFinishing: testingFinishingRejected,
      // Total Rejected for cumulative calculation
      totalRejected: getModuleTotalRejected('shearingData') +
        getModuleTotalRejected('turningData') +
        getModuleTotalRejected('mpiData') +
        getModuleTotalRejected('forgingData') +
        getModuleTotalRejected('quenchingData') +
        getModuleTotalRejected('temperingData') +
        visualCheckRejected +
        dimensionsCheckRejected +
        hardnessCheckRejected +
        testingFinishingRejected
    };


    return result;
  }, [calculateRejectedFromSubmodule, calculateFinalCheckRejected, selectedLine, selectedLotForDisplay, getSelectedLotForCurrentLine, getModuleTotalRejected]);

  // Calculate accepted quantities (Manufactured - Rejected)
  const acceptedQty = useMemo(() => {
    const calc = (manufactured, rejected) => {
      const mfg = parseInt(manufactured) || 0;
      const rej = rejected || 0;
      return mfg > 0 ? mfg - rej : 0;
    };

    return {
      shearing: calc(manufacturedQty.shearing, rejectedQty.shearing),
      turning: calc(manufacturedQty.turning, rejectedQty.turning),
      mpiTesting: calc(manufacturedQty.mpiTesting, rejectedQty.mpiTesting),
      forging: calc(manufacturedQty.forging, rejectedQty.forging),
      quenching: calc(manufacturedQty.quenching, rejectedQty.quenching),
      tempering: calc(manufacturedQty.tempering, rejectedQty.tempering),
      dimensionsCheck: 0, // Blank
      hardnessCheck: 0, // Blank
      visualCheck: 0 // Blank
    };
  }, [manufacturedQty, rejectedQty]);

  // Persist lineFinalResult for current selected line & lot using current manufactured/rejected values
  // `persistLineFinalResult` is declared later in the file (after `lotOfferedQtyMap` memo)
  // to avoid referencing `lotOfferedQtyMap` before it is initialized.

  // Calculate totals from lot-wise breakup for Final Inspection Results display
  // Sum manufactured and accepted quantities from ALL lots in ALL lines
  // NOTE: This calculation is now commented out and replaced with API data
  // Keeping the logic for future reference or if needed to switch back
  /*
  const { processInspectionAccepted, processManufactured } = useMemo(() => {
    try {
      let totalManufactured = 0;
      let totalAccepted = 0;
   
      // Iterate through all production lines
      localProductionLines.forEach((prodLine, lineIndex) => {
        const lineNo = `Line - ${ lineIndex + 1 } `;
        const poNo = prodLine.poNumber || prodLine.po_no || call?.po_no || '';
        const inspectionCallNo = call?.call_no || '';
   
        if (!inspectionCallNo || !poNo) {
          return;
        }
   
        // Get all process data for this line
        const allData = getAllProcessData(inspectionCallNo, poNo, lineNo);
   
        // Get all unique lots from shearing data for this line
        const lotsSet = new Set();
        if (allData?.shearingData && Array.isArray(allData.shearingData)) {
          allData.shearingData.forEach((hourData) => {
            if (hourData.lotNo && hourData.lotNo.trim()) {
              lotsSet.add(hourData.lotNo);
            }
          });
        }
   
        // For each lot in this line, calculate manufactured and accepted
        lotsSet.forEach((lot) => {
          // Get manufactured qty for this specific lot from the state (manually entered in stage-wise table)
          // IMPORTANT: Only use SHEARING manufactured quantity, not sum from all stages
          const lineMfgQtyByLot = (manufacturedQtyByLine[lineNo] && manufacturedQtyByLine[lineNo][lot]) || {};
          const lotManufactured = parseInt(lineMfgQtyByLot.shearing) || 0;
   
          console.log(`📦[Final Results] Line ${ lineIndex + 1 }, Lot ${ lot }: lineMfgQtyByLot = `, lineMfgQtyByLot, 'Shearing Manufactured=`, lotManufactured);

// Calculate rejected for this lot from all modules (shearing, turning, mpi, forging, quenching, tempering)
// Use the helper function to properly filter by lot
let lotRejected = 0;
const modules = ['shearingData', 'turningData', 'mpiData', 'forgingData', 'quenchingData', 'temperingData'];
modules.forEach((moduleName) => {
  lotRejected += calculateRejectedForSpecificLot(moduleName, lot, lineNo);
});

// Calculate accepted for this lot (Manufactured - Total Rejected from all stages)
const lotAccepted = Math.max(0, lotManufactured - lotRejected);

totalManufactured += lotManufactured;
totalAccepted += lotAccepted;

console.log(`📦 [Final Results] Line ${lineIndex + 1}, Lot ${lot}: Manufactured=${lotManufactured}, Rejected=${lotRejected}, Accepted=${lotAccepted}`);
        });
      });

console.log(`📊 [Final Results] TOTAL: Manufactured=${totalManufactured}, Accepted=${totalAccepted}`);

return {
  processManufactured: totalManufactured,
  processInspectionAccepted: totalAccepted
};
    } catch (error) {
  console.error('❌ [Final Results] Error:', error);
  return { processManufactured: 0, processInspectionAccepted: 0 };
}
  }, [localProductionLines, call?.call_no, call?.po_no, manufacturedQtyByLine, calculateRejectedForSpecificLot]);
  */

  // Use API data for process manufactured and inspection accepted (read-only from API)
  const processManufactured = quantitySummary.processManufacturedFromApi;
  const processInspectionAccepted = quantitySummary.processInspectionAcceptedFromApi;

  // Handle line change - updates selected line tab and loads line-specific data
  const handleLineChange = (line) => {
    console.log(`🔄 [Line Change] Switching to ${line}`);
    setSelectedLine(line);

    // Force reload data for the new line after a short delay to ensure state is updated
    setTimeout(() => {
      loadLineDataFromStorage(line);

      // Auto-select first lot for this line if no lot is currently selected
      if (!selectedLotByLine[line]) {
        const currentLineIndex = parseInt(line.replace('Line-', ''), 10) - 1;
        const prodLine = localProductionLines[currentLineIndex];

        if (prodLine && prodLine.icNumber) {
          const poNo = prodLine.poNumber || prodLine.po_no || '';
          const lineIcNumber = prodLine.icNumber || '';
          const inspectionCallNo = lineIcNumber || call?.call_no || '';

          // Get all lots for this line
          const allData = getAllProcessData(inspectionCallNo, poNo, line);
          const lotsSet = new Set();
          const modules = ['shearingData', 'turningData', 'mpiData', 'forgingData', 'quenchingData', 'temperingData', 'finalCheckData'];

          modules.forEach((moduleName) => {
            if (allData?.[moduleName] && Array.isArray(allData[moduleName])) {
              allData[moduleName].forEach((hourData) => {
                if (hourData.lotNo && hourData.lotNo.trim()) {
                  lotsSet.add(hourData.lotNo);
                }
              });
            }
          });

          const allLots = Array.from(lotsSet).sort();
          if (allLots.length > 0) {
            console.log(`📋 [Line Change] Auto-selecting first lot for ${line}:`, allLots[0]);
            setSelectedLotByLine(prev => ({
              ...prev,
              [line]: allLots[0]
            }));
          }
        }
      }
    }, 100);
  };

  // Helper function to load line-specific data from localStorage
  const loadLineDataFromStorage = useCallback((lineNo) => {
    // Wait for production lines to be initialized
    if (!localProductionLines || localProductionLines.length === 0) {
      console.log(`📋 [Load Data] Production lines not initialized yet, skipping load for ${lineNo}`);
      return;
    }

    const currentLineIndex = parseInt(lineNo.replace('Line-', ''), 10) - 1;
    const prodLine = localProductionLines[currentLineIndex];

    // Ensure we have valid production line data
    if (!prodLine || !prodLine.icNumber) {
      console.log(`📋 [Load Data] No production line data for ${lineNo} at index ${currentLineIndex}, skipping load`);
      return;
    }

    const poNo = prodLine.poNumber || prodLine.po_no || '';
    const lineIcNumber = prodLine.icNumber || '';
    const inspectionCallNo = lineIcNumber || call?.call_no || '';

    console.log(`📋 [Load Data] ${lineNo} - Loading from localStorage with IC: ${inspectionCallNo}, PO: ${poNo}`);

    // Get all lots for THIS SPECIFIC LINE (not the currently selected line)
    // We need to fetch data from localStorage using this line's IC number
    const allData = getAllProcessData(inspectionCallNo, poNo, lineNo);
    console.log(`📋 [Load Data] ${lineNo} - Retrieved data from localStorage:`, {
      hasShearing: !!allData?.shearingData,
      hasTurning: !!allData?.turningData,
      hasMpi: !!allData?.mpiData,
      hasForging: !!allData?.forgingData,
      hasQuenching: !!allData?.quenchingData,
      hasTempering: !!allData?.temperingData,
      hasFinalCheck: !!allData?.finalCheckData
    });

    const lotsSet = new Set();
    const modules = ['shearingData', 'turningData', 'mpiData', 'forgingData', 'quenchingData', 'temperingData', 'finalCheckData'];

    modules.forEach((moduleName) => {
      if (allData?.[moduleName] && Array.isArray(allData[moduleName])) {
        allData[moduleName].forEach((hourData) => {
          if (hourData.lotNo && hourData.lotNo.trim()) {
            lotsSet.add(hourData.lotNo);
          }
        });
      }
    });

    const allLots = Array.from(lotsSet).sort();
    console.log(`📋 [Load Data] Found ${allLots.length} lots for ${lineNo}:`, allLots);

    // Load manufactured quantities for each lot
    allLots.forEach(lotNo => {
      const lineFinalResult = loadFromLocalStorage('lineFinalResult', inspectionCallNo, poNo, lineNo, lotNo);
      if (lineFinalResult) {
        console.log(`📋 [Load Data] Loaded lineFinalResult for ${lineNo}, lot ${lotNo}:`, lineFinalResult);

        // Update manufacturedQtyByLine state with the loaded data
        setManufacturedQtyByLine(prev => ({
          ...prev,
          [lineNo]: {
            ...prev[lineNo],
            [lotNo]: {
              shearing: lineFinalResult.shearingManufactured || '',
              turning: lineFinalResult.turningManufactured || '',
              mpiTesting: lineFinalResult.mpiManufactured || '',
              forging: lineFinalResult.forgingManufactured || '',
              quenching: lineFinalResult.quenchingManufactured || '',
              tempering: lineFinalResult.temperingManufactured || ''
            }
          }
        }));

        // Update remarks if available
        if (lineFinalResult.remarks) {
          setFinalInspectionRemarks(lineFinalResult.remarks);
        }
      }
    });
  }, [localProductionLines, call?.call_no]);

  // Load line-specific data whenever call or selectedLine changes
  // This ensures data is loaded when returning from submodules
  useEffect(() => {
    // Call the helper function to load data
    loadLineDataFromStorage(selectedLine);
  }, [selectedLine, localProductionLines, loadLineDataFromStorage]);



  // Refresh rejected quantities when call or PO changes (on initial load or call change)
  useEffect(() => {
  }, [call?.call_no, call?.po_no]);

  // Get current line index from selectedLine (e.g., "Line-1" → 0)
  const currentLineIndex = parseInt(selectedLine.replace('Line-', ''), 10) - 1;

  // Get the production line data for the selected line tab
  const currentProductionLine = localProductionLines[currentLineIndex] || localProductionLines[0] || {};

  // Get manufactured quantity for a specific lot from Shearing input field
  const getShearingManufacturedQtyForLot = useCallback((lotNo) => {
    const lotMfgQty = (manufacturedQtyByLine[selectedLine] && manufacturedQtyByLine[selectedLine][lotNo]) || {};
    return parseInt(lotMfgQty.shearing) || 0;
  }, [manufacturedQtyByLine, selectedLine]);

  // Get PO data based on the call selected in current production line
  const currentCallData = allCallOptions.find(c => c.call_no === currentProductionLine.icNumber);

  // Get cached initiation data for the current line's selected call
  const currentLineInitiationData = callInitiationDataCache[currentProductionLine.icNumber];

  // Get lot/heat data from cached initiation data (from process_inspection_details table)
  // ONLY use cached initiation data - no fallback to rm_heat_tc_mapping to avoid mock data
  // Memoize lot numbers and maps to ensure stable references
  const { lineLotNumbers, lineHeatNumbersMap, lotOfferedQtyMap } = useMemo(() => {
    let lotNumbers = [];
    let heatMap = {};
    let offeredQtyMap = {}; // Map of lot number to offered quantity

    if (currentLineInitiationData) {
      // Use data from lotDetailsList if available (contains all lots for this inspection)
      if (currentLineInitiationData.lotDetailsList && currentLineInitiationData.lotDetailsList.length > 0) {
        console.log('📋 [Lot Numbers] Using lotDetailsList from API:', currentLineInitiationData.lotDetailsList);

        // Extract all lot numbers and their details from lotDetailsList
        lotNumbers = currentLineInitiationData.lotDetailsList.map(lot => lot.lotNumber);

        // Build heat numbers map and offered quantity map
        currentLineInitiationData.lotDetailsList.forEach(lot => {
          heatMap[lot.lotNumber] = lot.heatNumber || '';
          offeredQtyMap[lot.lotNumber] = lot.offeredQty || 0;
        });

        console.log('✅ [Lot Numbers] Using all lot numbers from lotDetailsList:', lotNumbers);
        console.log('✅ [Lot Numbers] Heat numbers map:', heatMap);
        console.log('✅ [Lot Numbers] Offered quantities map:', offeredQtyMap);
      } else {
        // Fallback to main lot number if lotDetailsList is not available
        const mainLotNumber = currentLineInitiationData.lotNumber || '';
        const mainHeatNumber = currentLineInitiationData.heatNumber || '';

        console.log('📋 [Lot Numbers] Main lot number from API:', mainLotNumber);
        console.log('📋 [Lot Numbers] Main heat number from API:', mainHeatNumber);

        // If we have the main lot number, use it
        if (mainLotNumber) {
          lotNumbers = [mainLotNumber];
          heatMap = { [mainLotNumber]: mainHeatNumber };
          offeredQtyMap = { [mainLotNumber]: currentLineInitiationData.offeredQty || 0 };
        }
      }
    }


    return { lineLotNumbers: lotNumbers, lineHeatNumbersMap: heatMap, lotOfferedQtyMap: offeredQtyMap };
  }, [currentLineInitiationData]);

  // Save lineFinalResult to localStorage whenever stage-wise quantities change
  useEffect(() => {
    const currentLineIndex = parseInt(selectedLine.replace('Line-', ''), 10) - 1;
    const prodLine = localProductionLines[currentLineIndex] || localProductionLines[0] || {};
    const poNo = prodLine.poNumber || prodLine.po_no || '';
    // Use the line's specific IC number, not the main call number
    const lineIcNumber = prodLine.icNumber || '';
    const inspectionCallNo = lineIcNumber || call?.call_no || '';

    if (!inspectionCallNo || !poNo) return;

    // Get the lot number - use selectedLotForDisplay if available, otherwise get the first lot
    let lotNumber = selectedLotForDisplay;
    if (!lotNumber) {
      lotNumber = getSelectedLotForCurrentLine();
    }

    // Get heat number from initiation data
    const initiationData = callInitiationDataCache[prodLine.icNumber];
    const heatNumber = initiationData?.heatNumber || null;

    // Calculate total manufactured (restricted to Shearing as per user request)
    const totalManufactured = parseInt(manufacturedQty.shearing) || 0;

    // Calculate total rejected (sum of all stage rejected quantities)
    const totalRejectedCalc = (rejectedQty.shearing || 0) + (rejectedQty.turning || 0) + (rejectedQty.mpiTesting || 0) +
      (rejectedQty.forging || 0) + (rejectedQty.quenching || 0) + (rejectedQty.tempering || 0);

    // Calculate total accepted (manufactured - rejected)
    const totalAcceptedCalc = Math.max(0, totalManufactured - totalRejectedCalc);

    // Get offered quantity for this lot from the map
    const lotOfferedQty = lotOfferedQtyMap[lotNumber] || rawMaterialAccepted || 0;

    // Build lineFinalResult object matching backend ProcessLineFinalResultDto
    const lineFinalResult = {
      inspectionCallNo,
      poNo,
      lineNo: selectedLine,
      lotNumber,
      heatNumber,
      // Total quantities
      totalManufactured: totalManufactured > 0 ? totalManufactured : null,
      totalAccepted: totalAcceptedCalc > 0 ? totalAcceptedCalc : null,
      totalRejected: totalRejectedCalc > 0 ? totalRejectedCalc : null,
      offeredQty: lotOfferedQty > 0 ? lotOfferedQty : null,
      // Stage-wise quantities
      shearingManufactured: parseInt(manufacturedQty.shearing) || null,
      shearingAccepted: acceptedQty.shearing || null,
      shearingRejected: rejectedQty.shearing || null,
      turningManufactured: parseInt(manufacturedQty.turning) || null,
      turningAccepted: acceptedQty.turning || null,
      turningRejected: rejectedQty.turning || null,
      mpiManufactured: parseInt(manufacturedQty.mpiTesting) || null,
      mpiAccepted: acceptedQty.mpiTesting || null,
      mpiRejected: rejectedQty.mpiTesting || null,
      forgingManufactured: parseInt(manufacturedQty.forging) || null,
      forgingAccepted: acceptedQty.forging || null,
      forgingRejected: rejectedQty.forging || null,
      quenchingManufactured: parseInt(manufacturedQty.quenching) || null,
      quenchingAccepted: acceptedQty.quenching || null,
      quenchingRejected: rejectedQty.quenching || null,
      temperingManufactured: parseInt(manufacturedQty.tempering) || null,
      temperingAccepted: acceptedQty.tempering || null,
      temperingRejected: rejectedQty.tempering || null,
      // Final Check visual/dimension/hardness - from rejectedQty
      visualCheckRejected: rejectedQty.visualCheck || null,
      dimensionsCheckRejected: rejectedQty.dimensionsCheck || null,
      hardnessCheckRejected: rejectedQty.hardnessCheck || null,
      // Remarks
      remarks: finalInspectionRemarks || null
    };

    console.log(`💾 [Save] Saving lineFinalResult for ${selectedLine}, Lot ${lotNumber}:`, lineFinalResult);
    // Save with lot number as part of the key for per-lot storage
    saveToLocalStorage('lineFinalResult', inspectionCallNo, poNo, selectedLine, lineFinalResult, lotNumber);
  }, [manufacturedQty, acceptedQty, rejectedQty, selectedLine, selectedLotForDisplay, localProductionLines, call?.call_no, call?.po_no, processInspectionAccepted, finalInspectionRemarks, callInitiationDataCache, getSelectedLotForCurrentLine, lotOfferedQtyMap, rawMaterialAccepted]);

  // Persist lineFinalResult for current selected line & lot using current manufactured/rejected values
  const persistLineFinalResult = useCallback((updatedField = null, updatedValue = null) => {
    try {
      const currentLineIndex = parseInt(selectedLine.replace('Line-', ''), 10) - 1;
      const prodLine = localProductionLines[currentLineIndex] || localProductionLines[0] || {};
      const poNo = prodLine.poNumber || prodLine.po_no || '';
      const lineIcNumber = prodLine.icNumber || '';
      const inspectionCallNo = lineIcNumber || call?.call_no || '';
      if (!inspectionCallNo || !poNo) return;

      let lotNumber = selectedLotForDisplay;
      if (!lotNumber) lotNumber = getSelectedLotForCurrentLine();
      if (!lotNumber) return;

      // Build manufactured quantities object using the current state, but override the updated field
      const mfg = {
        shearing: manufacturedQty.shearing,
        turning: manufacturedQty.turning,
        mpiTesting: manufacturedQty.mpiTesting,
        forging: manufacturedQty.forging,
        quenching: manufacturedQty.quenching,
        tempering: manufacturedQty.tempering
      };

      if (updatedField) {
        mfg[updatedField] = updatedValue !== null && updatedValue !== undefined ? String(updatedValue) : mfg[updatedField];
      }

      // Compute totals: Manufactured is now restricted to only Shearing as per user request
      const totalManufactured = parseInt(mfg.shearing) || 0;

      // Compute rejected totals by calling the existing helpers
      const shearingRejected = getModuleTotalRejected('shearingData', lotNumber);
      const turningRejected = getModuleTotalRejected('turningData', lotNumber);
      const mpiRejected = getModuleTotalRejected('mpiData', lotNumber);
      const forgingRejected = getModuleTotalRejected('forgingData', lotNumber);
      const quenchingRejected = getModuleTotalRejected('quenchingData', lotNumber);
      // Final check/Testing/Base Tempering contribute to Row 6 (Tempering) rejections in summary
      const visual = calculateFinalCheckRejected('visual');
      const dims = calculateFinalCheckRejected('dimensions');
      const hard = calculateFinalCheckRejected('hardness');

      // Testing & Finishing rejected
      const testingFinishingRejected = getModuleTotalRejected('testingFinishingData', lotNumber);

      // Base tempering (temp/duration)
      const temperingBaseRejected = getModuleTotalRejected('temperingData', lotNumber);

      // Tempering row = Visual + Dimensions + Hardness + Testing + Base (matching Stage-wise table display)
      const temperingRejected = visual + dims + hard + testingFinishingRejected + temperingBaseRejected;

      // Total Rejected = Sum of Row 1 (Shearing) through Row 6 (Tempering)
      const totalRejectedCalc = (shearingRejected || 0) + (turningRejected || 0) + (mpiRejected || 0) +
        (forgingRejected || 0) + (quenchingRejected || 0) + (temperingRejected || 0);

      const totalAcceptedCalc = Math.max(0, totalManufactured - totalRejectedCalc);

      const initiationData = callInitiationDataCache[prodLine.icNumber];
      const heatNumber = initiationData?.heatNumber || null;
      const lotOfferedQty = lotOfferedQtyMap[lotNumber] || rawMaterialAccepted || 0;

      const lineFinalResult = {
        inspectionCallNo,
        poNo,
        lineNo: selectedLine,
        lotNumber,
        heatNumber,
        totalManufactured: totalManufactured > 0 ? totalManufactured : null,
        totalAccepted: totalAcceptedCalc > 0 ? totalAcceptedCalc : null,
        totalRejected: totalRejectedCalc > 0 ? totalRejectedCalc : null,
        offeredQty: lotOfferedQty > 0 ? lotOfferedQty : null,
        shearingManufactured: parseInt(mfg.shearing) || null,
        shearingAccepted: (parseInt(mfg.shearing) || 0) - (shearingRejected || 0) || null,
        shearingRejected: shearingRejected || null,
        turningManufactured: parseInt(mfg.turning) || null,
        turningAccepted: (parseInt(mfg.turning) || 0) - (turningRejected || 0) || null,
        turningRejected: turningRejected || null,
        mpiManufactured: parseInt(mfg.mpiTesting) || null,
        mpiAccepted: (parseInt(mfg.mpiTesting) || 0) - (mpiRejected || 0) || null,
        mpiRejected: mpiRejected || null,
        forgingManufactured: parseInt(mfg.forging) || null,
        forgingAccepted: (parseInt(mfg.forging) || 0) - (forgingRejected || 0) || null,
        forgingRejected: forgingRejected || null,
        quenchingManufactured: parseInt(mfg.quenching) || null,
        quenchingAccepted: (parseInt(mfg.quenching) || 0) - (quenchingRejected || 0) || null,
        quenchingRejected: quenchingRejected || null,
        temperingManufactured: parseInt(mfg.tempering) || null,
        temperingAccepted: (parseInt(mfg.tempering) || 0) - (temperingRejected || 0) || null,
        temperingRejected: temperingRejected || null,
        visualCheckRejected: visual || null,
        dimensionsCheckRejected: dims || null,
        hardnessCheckRejected: hard || null,
        testingFinishingRejected: testingFinishingRejected || null,
        remarks: finalInspectionRemarks || null
      };

      saveToLocalStorage('lineFinalResult', inspectionCallNo, poNo, selectedLine, lineFinalResult, lotNumber);
      console.log('💾 [Persist] Persisted lineFinalResult after manufactured blur:', { selectedLine, lotNumber, lineFinalResult });
    } catch (err) {
      console.warn('💾 [Persist] Error persisting lineFinalResult:', err);
    }
  }, [selectedLine, manufacturedQty, localProductionLines, call?.call_no, selectedLotForDisplay, callInitiationDataCache, lotOfferedQtyMap, rawMaterialAccepted, finalInspectionRemarks, getSelectedLotForCurrentLine, calculateFinalCheckRejected, getModuleTotalRejected]);

  // Fetch Heat Wise Accountal Data (Two-Step API Call)
  // Step 1: Get PO Serial Number, Step 2: Get Manufactured Quantity Summary
  useEffect(() => {
    const fetchHeatWiseAccountalData = async () => {
      try {
        // Get current production line data
        const currentLineIndex = parseInt(selectedLine.replace('Line-', ''), 10) - 1;
        const prodLine = localProductionLines[currentLineIndex];

        if (!prodLine || !prodLine.icNumber) {
          console.log('⏭️ [Heat Wise Accountal] No production line data available, skipping fetch');
          return;
        }

        const callNo = prodLine.icNumber;

        // Use the lot details from currentLineInitiationData
        if (!currentLineInitiationData) {
          console.log('⏭️ [Heat Wise Accountal] No initiation data available, skipping fetch');
          return;
        }

        // Get lot details list
        const lotDetailsList = currentLineInitiationData.lotDetailsList || [];
        if (lotDetailsList.length === 0) {
          console.log('⏭️ [Heat Wise Accountal] No lot details available, skipping fetch');
          return;
        }

        setIsLoadingHeatWiseData(true);
        setHeatWiseDataError(null);

        console.log(`🔄 [Heat Wise Accountal] Starting two-step API call for call: ${callNo}`);

        // Step 1: Fetch PO Serial Number
        const poSerialNumber = await getPoSerialNumberByCallId(callNo);

        if (!poSerialNumber) {
          throw new Error('Failed to fetch PO serial number');
        }

        console.log(`✅ [Heat Wise Accountal] Step 1 complete - PO Serial: ${poSerialNumber}`);

        // Step 2: Fetch manufactured quantity for each heat
        const accountalDataMap = {};

        for (const lotDetail of lotDetailsList) {
          const heatNo = lotDetail.heatNumber || '';
          if (!heatNo) continue;

          try {
            const quantityData = await getManufacturedQtyOfPo(heatNo, poSerialNumber);
            accountalDataMap[heatNo] = {
              manufaturedQty: quantityData.manufaturedQty || 0,
              rejectedQty: quantityData.rejectedQty || 0,
              rmAcceptedQty: quantityData.rmAcceptedQty || 0,
              weightAcceptedMt: quantityData.weightAcceptedMt || 0,
              acceptedQty: quantityData.acceptedQty || 0,
              heatNo: quantityData.heatNo || heatNo
            };
            console.log(`✅ [Heat Wise Accountal] Fetched data for heat ${heatNo}:`, accountalDataMap[heatNo]);
          } catch (error) {
            console.error(`❌ [Heat Wise Accountal] Error fetching data for heat ${heatNo}:`, error);
            // Continue with other heats even if one fails
          }
        }

        setHeatWiseAccountalData(accountalDataMap);
        console.log(`✅ [Heat Wise Accountal] Step 2 complete - All heat data fetched:`, accountalDataMap);
        setIsLoadingHeatWiseData(false);
      } catch (error) {
        console.error('❌ [Heat Wise Accountal] Error in two-step API call:', error);
        setHeatWiseDataError(error.message || 'Failed to fetch heat wise accountal data');
        setIsLoadingHeatWiseData(false);
      }
    };

    // Only fetch if we have production lines, a selected line, and initiation data
    if (localProductionLines.length > 0 && selectedLine && currentLineInitiationData) {
      fetchHeatWiseAccountalData();
    }
  }, [selectedLine, localProductionLines, currentLineInitiationData]);

  // Fetch Previous Shift Data for Lot Wise Quantity Breakup
  // This fetches cumulative quantities from all previous shifts
  useEffect(() => {
    const fetchPreviousShiftData = async () => {
      try {
        // Get current production line data
        const currentLineIndex = parseInt(selectedLine.replace('Line-', ''), 10) - 1;
        const prodLine = localProductionLines[currentLineIndex];

        if (!prodLine || !prodLine.icNumber) {
          console.log('⏭️ [Previous Shift Data] No production line data available, skipping fetch');
          return;
        }

        const callNo = prodLine.icNumber;

        setIsLoadingPreviousShiftData(true);
        setPreviousShiftDataError(null);

        console.log(`🔄 [Previous Shift Data] Fetching qty-summary for call: ${callNo}`);

        // Fetch qty-summary data which contains lot-wise array
        const quantitySummaryData = await getQuantitySummary(callNo);

        if (!quantitySummaryData) {
          throw new Error('Failed to fetch quantity summary');
        }

        console.log(`✅ [Previous Shift Data] Quantity summary received:`, quantitySummaryData);

        // Convert array to map: lotNumber -> { manufacturedQty, rejectedQty, acceptedQty, offeredQty }
        let previousShiftDataByLot = {};
        if (Array.isArray(quantitySummaryData)) {
          quantitySummaryData.forEach(lotData => {
            if (lotData.lotNumber) {
              previousShiftDataByLot[lotData.lotNumber] = {
                manufacturedQty: lotData.manufacturedQty || 0,
                rejectedQty: lotData.rejectedQty || 0,
                acceptedQty: lotData.acceptedQty || 0,
                offeredQty: lotData.offeredQty || 0
              };
            }
          });
          console.log(`✅ [Previous Shift Data] Lot-wise data map:`, previousShiftDataByLot);
        }

        // Store the lot-wise previous shift data
        setPreviousShiftData(previousShiftDataByLot);

        setIsLoadingPreviousShiftData(false);
      } catch (error) {
        console.error('❌ [Previous Shift Data] Error fetching quantity summary:', error);
        setPreviousShiftDataError(error.message || 'Failed to fetch previous shift data');
        setIsLoadingPreviousShiftData(false);
      }
    };

    // Only fetch if we have production lines and a selected line
    if (localProductionLines.length > 0 && selectedLine) {
      fetchPreviousShiftData();
    }
  }, [selectedLine, localProductionLines]);

  /**
   * Validate 8-hour grid data completeness for a specific lot
   * Returns array of incomplete sections/hours
   */
  const validateLotGridData = useCallback((callNo, poNo, lineNo, lotNo, productType = '') => {
    console.log(`🔍 [Validation] Checking lot: ${lotNo} in ${lineNo} (Call: ${callNo}, Product: ${productType})`);

    const allData = getAllProcessData(callNo, poNo, lineNo);
    const isEmpty = (val) => val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0) || (Array.isArray(val) && val.every(v => v === null || v === undefined || v === ''));

    let requiredModules = [
      'shearingData',
      'turningData',
      'mpiData',
      'forgingData',
      'quenchingData',
      'temperingData',
      'finalCheckData',
      'testingFinishingData'
    ];

    // Skip turningData validation for MK-III product type
    if (productType && /MK-III/i.test(productType)) {
      console.log(`🔍 [Validation] Skipping turningData validation for MK-III product`);
      requiredModules = requiredModules.filter(module => module !== 'turningData');
    }

    const incompleteSections = [];

    requiredModules.forEach(moduleName => {
      const moduleData = allData?.[moduleName];
      const sectionLabel = moduleName.replace('Data', '').charAt(0).toUpperCase() + moduleName.replace('Data', '').slice(1);

      // VALIDATION FIX: Fail if entire section data is missing
      if (!moduleData || !Array.isArray(moduleData) || moduleData.length === 0) {
        incompleteSections.push(`${sectionLabel}: No data entered`);
        return;
      }

      // Check each hour (0-7)
      moduleData.forEach((hourData, hourIndex) => {
        // Skip if marked as No Production
        if (hourData?.noProduction || hourData?.isSkipped) return;

        // Only validate if this row belongs to the lot we're checking
        if (hourData.lotNo !== lotNo) return;

        const missingFields = [];

        // Helper to check for field presence (handles original arrays and transformed numbered fields)
        const check = (fields) => {
          const fieldList = Array.isArray(fields) ? fields : [fields];
          return fieldList.some(f => !isEmpty(hourData[f]));
        };

        const validateTolerance = (fieldMap) => {
          Object.entries(fieldMap).forEach(([ruleName, fieldKeys]) => {
            const keys = Array.isArray(fieldKeys) ? fieldKeys : [fieldKeys];
            keys.forEach(key => {
              if (!isEmpty(hourData[key])) {
                const { isValid, isApplicable } = checkTolerance(ruleName, hourData[key], productType);
                if (isApplicable && !isValid) {
                  missingFields.push(`${key} out of tolerance`);
                }
              }
            });
          });
        };

        // Define required fields per module
        if (moduleName === 'shearingData') {
          if (!check('lotNo')) missingFields.push('Lot No');
          if (!check(['lengthCutBar', 'lengthCutBar1'])) missingFields.push('Length Cut Bar');
          else validateTolerance({ lengthCutBar: ['lengthCutBar', 'lengthCutBar1'] });

          if (!check(['qualityDia', 'qualityDia1'])) missingFields.push('Quality Dia');
          // Removed invalid tolerance check for Quality Dia (it's a dropdown)
          // Removed mandatory Rejected Qty check as strict validation blocks disabled inputs

        } else if (moduleName === 'turningData') {
          if (!check('lotNo')) missingFields.push('Lot No');
          if (!check(['turningDia', 'dia', 'dia1'])) missingFields.push('Turning Dia');
          else validateTolerance({ turningDia: ['turningDia', 'dia', 'dia1'] });

          if (!check(['turningLength', 'parallelLength', 'straightLength', 'straightLength1'])) missingFields.push('Turning Length');
          else validateTolerance({ parallelLength: ['turningLength', 'parallelLength', 'straightLength', 'straightLength1'] });

          if (!check(['fullTurningLength', 'taperLength', 'taperLength1'])) missingFields.push('Full Turning Length');
          else validateTolerance({ fullLength: ['fullTurningLength', 'taperLength', 'taperLength1'] });
          // Removed mandatory Rejected Qty check

        } else if (moduleName === 'mpiData') {
          if (!check('lotNo')) missingFields.push('Lot No');
          if (!check(['mpiTestingResult', 'testResults', 'testResult1'])) missingFields.push('MPI Result');
          // Removed mandatory Rejected Qty check
        } else if (moduleName === 'forgingData') {
          if (!check('lotNo')) missingFields.push('Lot No');
          if (!check(['forgingTemperature', 'forgingTemp1'])) missingFields.push('Forging Temp');
          else validateTolerance({ forgingTemperature: ['forgingTemperature', 'forgingTemp1'] });
          if (!check(['forgingStabilisation', 'forgingStabilisationRejection1'])) missingFields.push('Stabilisation');
          if (!check(['improperForging', 'improperForging1'])) missingFields.push('Improper Forging');
          if (!check(['forgingDefect', 'forgingDefect1'])) missingFields.push('Forging Defect');
          if (!check(['embossingDefect', 'embossingDefect1'])) missingFields.push('Embossing Defect');
        } else if (moduleName === 'quenchingData') {
          if (!check('lotNo')) missingFields.push('Lot No');
          if (!check(['quenchingHardness', 'quenchingHardness1'])) missingFields.push('Quenching Hardness');
          if (!check(['boxGauge', 'boxGauge1'])) missingFields.push('Box Gauge');
          if (!check(['flatBearingArea', 'flatBearingArea1'])) missingFields.push('Flat Bearing Area');
          if (!check(['fallingGauge', 'fallingGauge1'])) missingFields.push('Falling Gauge');
          validateTolerance({ quenchingTemperature: ['quenchingTemperature', 'quenchingTemp1', 'bathTemp', 'oilTemp'] });
        } else if (moduleName === 'temperingData') {
          if (!check('lotNo')) missingFields.push('Lot No');
          if (!check(['temperingTemperature', 'temperingTemperature1'])) missingFields.push('Tempering Temp');
          else validateTolerance({ temperingTemperature: ['temperingTemperature', 'temperingTemperature1'] });
          if (!check(['temperingDuration', 'temperingDuration1'])) missingFields.push('Tempering Duration');
        } else if (moduleName === 'finalCheckData') {
          if (!check('lotNo')) missingFields.push('Lot No');
          if (!check(['surfaceDefect', 'surfaceDefect1'])) missingFields.push('Surface Defect');
          if (!check(['embossingDefect', 'embossingDefect1'])) missingFields.push('Embossing Defect');
          if (!check(['marking', 'marking1'])) missingFields.push('Marking');
          if (!check(['boxGauge', 'boxGauge1'])) missingFields.push('Box Gauge');
          if (!check(['flatBearingArea', 'flatBearingArea1'])) missingFields.push('Flat Bearing Area');
          if (!check(['fallingGauge', 'fallingGauge1'])) missingFields.push('Falling Gauge');
          if (!check(['temperingHardness', 'temperingHardness1'])) missingFields.push('Tempering Hardness');
          else validateTolerance({ temperingHardness: ['temperingHardness', 'temperingHardness1'] });
        } else if (moduleName === 'testingFinishingData') {
          if (!check('lotNo')) missingFields.push('Lot No');
          if (!check(['toeLoad', 'toeLoad1'])) missingFields.push('Toe Load');
          else validateTolerance({ toeLoad: ['toeLoad', 'toeLoad1'] });

          if (!check(['weight', 'weight1'])) missingFields.push('Weight');
          else validateTolerance({ weight: ['weight', 'weight1'] });
          if (!check(['paintIdentification', 'paintIdentification1'])) missingFields.push('Paint ID');
          if (!check(['ercCoating', 'ercCoating1'])) missingFields.push('ERC Coating');
        }

        if (missingFields.length > 0) {
          const sectionLabel = moduleName.replace('Data', '').charAt(0).toUpperCase() + moduleName.replace('Data', '').slice(1);
          incompleteSections.push(`${sectionLabel} Hour ${hourIndex + 1}: Missing ${missingFields.join(', ')}`);
        }
      });
    });

    if (incompleteSections.length > 0) {
      console.log(`🔍 [Validation] Lot ${lotNo} has ${incompleteSections.length} incomplete fields`);
    } else {
      console.log(`🔍 [Validation] ✅ Lot ${lotNo} validation passed`);
    }

    return incompleteSections;
  }, []);

  /**
   * Validate all lots across all production lines
   * Returns object with validation results: { isValid: boolean, errors: Map }
   */
  const validateAllLots = useCallback((linesToValidate = null) => {
    console.log('🔍 [Validation] Starting validation for all lots...');

    const validationErrors = new Map(); // lineNo|lotNo -> [errors]
    const linesToCheck = linesToValidate || localProductionLines;

    linesToCheck.forEach((prodLine, lineIndex) => {
      const lineNo = `Line-${lineIndex + 1}`;
      const callNo = prodLine.icNumber;
      const poNo = prodLine.poNumber || prodLine.po_no || '';
      const productType = prodLine.productType || '';

      // Skip if no call number
      if (!callNo) {
        console.log(`🔍 [Validation] Skipping ${lineNo} - no call number`);
        return;
      }

      console.log(`🔍 [Validation] Validating ${lineNo} (Call: ${callNo}, Product: ${productType})`);

      // Get all lots for this line from localStorage
      const allData = getAllProcessData(callNo, poNo, lineNo);
      const lotsSet = new Set();
      const modules = ['shearingData', 'turningData', 'mpiData', 'forgingData', 'quenchingData', 'temperingData', 'finalCheckData'];

      modules.forEach((moduleName) => {
        if (allData?.[moduleName] && Array.isArray(allData[moduleName])) {
          allData[moduleName].forEach((hourData) => {
            if (hourData.lotNo && hourData.lotNo.trim()) {
              lotsSet.add(hourData.lotNo);
            }
          });
        }
      });

      const allLots = Array.from(lotsSet);
      console.log(`🔍 [Validation] Found ${allLots.length} lots in ${lineNo}:`, allLots);

      // VALIDATION FIX: Check EACH section independently for "No Production" vs empty data
      // This fixes the issue where user unchecks No Production for one section but doesn't fill data
      modules.forEach((moduleName) => {
        const sectionData = allData?.[moduleName];

        if (!sectionData || !Array.isArray(sectionData) || sectionData.length === 0) {
          // No data for this section at all - this is OK if other sections have data
          return;
        }

        // Check this specific section
        let sectionHasLots = false;
        let sectionHasNoProduction = false;
        let sectionHasAnyData = false;

        sectionData.forEach((hourData) => {
          if (hourData && Object.keys(hourData).length > 0) {
            sectionHasAnyData = true;

            // Check if this hour has a lot number
            if (hourData.lotNo && hourData.lotNo.trim()) {
              sectionHasLots = true;
            }

            // Check if this hour is marked as No Production
            if (hourData.noProduction === true) {
              sectionHasNoProduction = true;
            }
          }
        });

        console.log(`🔍 [Validation] ${lineNo} - ${moduleName}: hasData=${sectionHasAnyData}, hasLots=${sectionHasLots}, hasNoProduction=${sectionHasNoProduction}`);

        // Validation for this section:
        // FAIL if: Has data entries BUT no lot numbers AND no "No Production" marked
        if (sectionHasAnyData && !sectionHasLots && !sectionHasNoProduction) {
          const sectionName = moduleName.replace('Data', '').replace(/([A-Z])/g, ' $1').trim();
          validationErrors.set(`${lineNo}|${sectionName}`, [
            `${sectionName} section has incomplete data. Please either:\n` +
            `  - Enter lot numbers and production data for all hours, OR\n` +
            `  - Mark the section as "No Production"`
          ]);
          console.log(`❌ [Validation] ${lineNo} - ${moduleName} FAILED - has data but no lots and no "No Production"`);
        }
      });

      // Also check if NO sections have any data at all
      let hasAnyDataInAnySection = false;
      modules.forEach((moduleName) => {
        if (allData?.[moduleName] && Array.isArray(allData[moduleName]) && allData[moduleName].length > 0) {
          hasAnyDataInAnySection = true;
        }
      });

      if (!hasAnyDataInAnySection) {
        validationErrors.set(`${lineNo}|General`, [`No production data entered for ${lineNo}. Please complete all required sections before finishing inspection.`]);
        console.log(`❌ [Validation] ${lineNo} FAILED - no data in any section`);
      }

      // Validate each lot
      allLots.forEach(lotNo => {
        const incompleteSections = validateLotGridData(callNo, poNo, lineNo, lotNo, productType);
        if (incompleteSections.length > 0) {
          const key = `${lineNo}|${lotNo}`;
          validationErrors.set(key, incompleteSections);
        }
      });
    });

    const isValid = validationErrors.size === 0;
    console.log(`🔍 [Validation] Validation ${isValid ? 'PASSED' : 'FAILED'}. Errors found: ${validationErrors.size}`);

    return { isValid, errors: validationErrors };
  }, [localProductionLines, validateLotGridData]);

  /**
   * Handle Shift Completed - collect lot-wise data from ALL production lines and trigger performTransitionAction
   * Groups by unique (callNumber + lotNumber) combinations and sends separate API calls for each
   */
  const handleInspectionCompleted = useCallback(async () => {
    // STEP 1: Validate all 8-hour grid data before proceeding
    console.log('🔍 [Shift Completed] Starting validation...');
    const validation = validateAllLots();

    if (!validation.isValid) {
      // Build error message
      let errorMessage = 'Incomplete 8-hour grid data found:\n\n';

      validation.errors.forEach((errors, key) => {
        const [lineNo, lotNo] = key.split('|');
        errorMessage += `${lineNo}, ${lotNo}:\n`;
        errorMessage += `  ${errors.join('\n  ')}\n\n`;
      });

      errorMessage += 'Please complete all required sections before proceeding.';

      console.error('🔍 [Shift Completed] Validation failed:', errorMessage);
      showNotification('error', errorMessage);
      return;
    }

    console.log('🔍 [Shift Completed] ✅ Validation passed, proceeding with shift completion...');

    setIsSaving(true);

    try {
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || currentUser?.username || 'SYSTEM';

      // --- SAVE 8-HOUR GRID DATA (START) ---
      console.log('💾 [Shift Completed] Saving 8-hour grid data...');
      const linesData = [];
      // Initial save logic: gather data for all relevant lines
      // We process ALL lines that have an IC number or PO number
      const linesToSave = localProductionLines.filter(line => line && (line.icNumber || line.poNumber));

      for (const line of linesToSave) {
        // Use the line's specific IC number if available, otherwise fall back to main call number
        const lineCallNo = line.icNumber || call.call_no;
        const linePoNo = line.poNumber || call.po_no;

        // Load latest grid data from local storage using the line's specific call and PO
        const gridData = loadGridDataForLine(lineCallNo, linePoNo, `Line-${line.lineNumber}`);

        // Get initiation data for this line to get the correct shift
        const lineInitiationData = callInitiationDataCache[lineCallNo];
        let shift = lineInitiationData?.shiftOfInspection || call.shiftOfInspection || call.shift || 'A';

        // Attempt to derive actual shift from grid data
        // Iterate through all submodules to find the first non-empty row with a shift
        const submodules = ['shearing', 'turning', 'mpi', 'forging', 'quenching', 'tempering', 'finalCheck', 'testingFinishing'];
        for (const sub of submodules) {
          if (gridData?.[sub] && Array.isArray(gridData[sub])) {
            const rowWithShift = gridData[sub].find(r => r.shift);
            if (rowWithShift) {
              shift = rowWithShift.shift;
              break;
            }
          }
        }

        const hourLabels = getHourLabels(shift);

        console.log(`📋 [Shift Completed] Loading data for Line-${line.lineNumber} (Shift: ${shift}):`, {
          lineCallNo,
          linePoNo,
          hasGridData: !!gridData,
          shearingRows: gridData?.shearing?.length || 0
        });

        const enrichData = (data) => {
          if (!data || !Array.isArray(data)) return [];
          return data.map((row, idx) => ({
            ...row,
            shift: row.shift || shift,
            hourLabel: row.hourLabel || hourLabels[idx] || '',
            createdBy: userId
          }));
        };

        // Identify all lots processed on this line
        const lineKey = `Line-${line.lineNumber}`;
        const simpleLineKey = String(line.lineNumber);
        const lineLotData = manufacturedQtyByLine[lineKey] || manufacturedQtyByLine[simpleLineKey] || {};

        // Determine unique lots to process for this line
        const lotKeys = Object.keys(lineLotData).filter(key => key !== 'undefined' && key !== '');

        // Get Lot/Heat/Offered Qty Metadata for Payload
        const lotDetails = lineInitiationData?.lotDetailsList || [];


        // If no recorded lots via manual entry, fall back to current selected lot or first available
        const lotsToProcess = lotKeys.length > 0 ? lotKeys : [selectedLotByLine[lineKey] || (lotDetails.length > 0 ? lotDetails[0].lotNumber : 'Default')];

        for (const lotNo of lotsToProcess) {
          const lotData = lineLotData[lotNo] || {};

          // Filter grid data to only include rows for THIS specific lot
          const filterByLot = (data) => {
            if (!data || !Array.isArray(data)) return [];
            return data.filter(row => row.lotNo === lotNo);
          };

          const lotLineDto = {
            lineNo: `Line-${line.lineNumber}`,
            poNo: linePoNo,
            inspectionCallNo: lineCallNo,
            shearingData: enrichData(filterByLot(gridData?.shearing)),
            turningData: enrichData(filterByLot(gridData?.turning)),
            mpiData: enrichData(filterByLot(gridData?.mpi)),
            forgingData: enrichData(filterByLot(gridData?.forging)),
            quenchingData: enrichData(filterByLot(gridData?.quenching)),
            temperingData: enrichData(filterByLot(gridData?.tempering)),
            finalCheckData: enrichData(filterByLot(gridData?.finalCheck)),
            testingFinishingData: enrichData(filterByLot(gridData?.testingFinishing)),
            remarks: ''
          };

          const manualQuantities = {
            shearing: parseInt(lotData.shearing || 0) || 0,
            turning: parseInt(lotData.turning || 0) || 0,
            mpiTesting: parseInt(lotData.mpiTesting || 0) || 0,
            forging: parseInt(lotData.forging || 0) || 0,
            quenching: parseInt(lotData.quenching || 0) || 0,
            tempering: parseInt(lotData.tempering || 0) || 0,
            testingFinishing: parseInt(lotData.testingFinishing || 0) || 0
          };

          const targetLotDetail = lotDetails.find(l => l.lotNumber === lotNo) || lotDetails.find(l => l.lotNumber === lotNo.trim()) || lotDetails[0];

          const metaData = {
            lotNumbers: targetLotDetail?.lotNumber || lotNo || '',
            heatNumbers: targetLotDetail?.heatNumber || '',
            totalOfferedQty: parseInt(targetLotDetail?.offeredQty) || 0,
            shift: shift
          };

          const transformedLineDto = transformLineDataForBackend(lotLineDto, manualQuantities, metaData);
          if (transformedLineDto) {
            linesData.push(transformedLineDto);
          }
        }
      }

      const pausePayload = {
        inspectionCallNo: call.call_no,
        remarks: 'Shift Completed',
        shift: linesData.length > 0 ? linesData[0].lineFinalResult?.shift || call.shiftOfInspection || call.shift : call.shiftOfInspection || call.shift,
        linesData: linesData,
        createdBy: userId
      };

      console.log('Sending pause (shift complete) payload:', pausePayload);
      await pauseProcessInspection(pausePayload);
      console.log('✅ [Shift Completed] 8-hour grid data saved successfully');
      // --- SAVE 8-HOUR GRID DATA (END) ---

      // Step 2: Build a comprehensive data map for all lines
      // This will store: callNo|lotNo -> { quantities, heatNo, offeredQty, lineNo, poNo, pincode }
      const lotDataMap = new Map();

      console.log('📋 [Shift Completed] Processing all production lines...');
      console.log('📋 [Shift Completed] Total production lines:', localProductionLines.length);

      // Iterate through all production lines to collect lot-wise data
      for (let lineIndex = 0; lineIndex < localProductionLines.length; lineIndex++) {
        const prodLine = localProductionLines[lineIndex];
        if (!prodLine) continue; // Skip if line is undefined

        const lineNo = `Line-${lineIndex + 1}`;
        const callNo = prodLine.icNumber;
        const poNo = prodLine.poNumber || prodLine.po_no || '';
        const pincode = prodLine.pincode || call?.pincode || '560001';

        // Skip if no call number
        if (!callNo) {
          console.log(`⏭️ [Shift Completed] Skipping ${lineNo} - no call number`);
          continue;
        }

        console.log(`📋 [Shift Completed] Processing ${lineNo} (Call: ${callNo})`);

        // Get initiation data for this line to get lot details (offered qty, heat numbers)
        const lineInitiationData = callInitiationDataCache[callNo];

        if (!lineInitiationData?.lotDetailsList) {
          console.log(`⚠️ [Shift Completed] No initiation data for ${lineNo}, skipping`);
          continue;
        }

        // Fetch previous shift data for this call (lot-wise array)
        let previousShiftDataByLot = {};
        try {
          const quantitySummaryData = await getQuantitySummary(callNo);
          if (quantitySummaryData && Array.isArray(quantitySummaryData)) {
            // Convert array to map: lotNumber -> { manufacturedQty, rejectedQty }
            quantitySummaryData.forEach(lotData => {
              if (lotData.lotNumber) {
                previousShiftDataByLot[lotData.lotNumber] = {
                  manufacturedQty: lotData.manufacturedQty || 0,
                  rejectedQty: lotData.rejectedQty || 0,
                  acceptedQty: lotData.acceptedQty || 0,
                  offeredQty: lotData.offeredQty || 0
                };
              }
            });
            console.log(`✅ [Shift Completed] Previous shift data for ${callNo}:`, previousShiftDataByLot);
          }
        } catch (error) {
          console.error(`⚠️ [Shift Completed] Failed to fetch previous shift data for ${callNo}:`, error);
        }

        // Process each lot for this line
        lineInitiationData.lotDetailsList.forEach(lotDetail => {
          const lotNo = lotDetail.lotNumber;
          const heatNo = lotDetail.heatNumber || '';
          const offeredQty = lotDetail.offeredQty || 0;
          const trimmedLotNo = lotNo ? String(lotNo).trim() : '';

          // Aggregate manual manufactured quantities from all lots for this line
          const lineNoKey = `Line-${prodLine.lineNumber || (lineIndex + 1)}`;

          // Load persisted lineFinalResult for this lot (contains current shift metrics)
          const lotFinalResult = loadFromLocalStorage('lineFinalResult', callNo, poNo, lineNo, lotNo);

          const currentShiftManufacturedQty = lotFinalResult?.totalManufactured || 0;
          const currentShiftRejectedQty = lotFinalResult?.totalRejected || 0;
          const currentShiftAcceptedQty = lotFinalResult?.totalAccepted || 0;


          // Get previous shift data for THIS SPECIFIC LOT
          const previousShiftDataForLot = previousShiftDataByLot[lotNo] || previousShiftDataByLot[trimmedLotNo] || { manufacturedQty: 0, rejectedQty: 0 };

          // Calculate cumulative quantities

          const key = `${callNo}|${lotNo}`;
          const existingData = lotDataMap.get(key);

          // Calculate cumulative values based on either existing aggregated totals OR zero
          const prevMfg = existingData?.currentShiftManufacturedQty || 0;
          const prevRej = existingData?.currentShiftRejectedQty || 0;
          const prevAcc = existingData?.currentShiftAcceptedQty || 0;

          const totalShiftMfg = prevMfg + currentShiftManufacturedQty;
          const totalShiftRej = prevRej + currentShiftRejectedQty;
          const totalShiftAcc = prevAcc + currentShiftAcceptedQty;

          // Cumulative = total aggregated for current shift + historical previous shifts
          const finalCumulativeMfg = totalShiftMfg + previousShiftDataForLot.manufacturedQty;
          const finalCumulativeRej = totalShiftRej + previousShiftDataForLot.rejectedQty;
          const finalCumulativeAcc = Math.max(0, finalCumulativeMfg - finalCumulativeRej);

          lotDataMap.set(key, {
            callNo,
            lotNo,
            heatNo,
            offeredQty,
            currentShiftManufacturedQty: totalShiftMfg,
            currentShiftRejectedQty: totalShiftRej,
            currentShiftAcceptedQty: totalShiftAcc,
            cumulativeManufacturedQty: finalCumulativeMfg,
            cumulativeRejectedQty: finalCumulativeRej,
            cumulativeAcceptedQty: finalCumulativeAcc,
            lineNo, // Keep the last lineNo processed (or could aggregate)
            poNo,
            pincode,
            shiftCode: (sessionStorage.getItem('inspectionShift') || lineInitiationData?.shiftOfInspection || call.shiftOfInspection || call.shift || 'A').charAt(0).toUpperCase()
          });

          console.log(`✅ [Shift Completed] Prepared payload for ${lineNoKey} - Lot ${lotNo}. Mfg: ${currentShiftManufacturedQty}, Rej: ${currentShiftRejectedQty}`);
        });
      }

      console.log(`📋 [Shift Completed] Total lots to process: ${lotDataMap.size}`);

      if (lotDataMap.size === 0) {
        showNotification('error', 'No production lines with lot data found');
        return;
      }

      // Step 2: Send performTransitionAction API call for each lot
      const workflowResults = [];

      for (const [key, lotData] of lotDataMap) {
        const {
          callNo,
          lotNo,
          heatNo,
          offeredQty,
          currentShiftManufacturedQty,
          currentShiftRejectedQty,
          currentShiftAcceptedQty,
          cumulativeManufacturedQty,
          cumulativeRejectedQty,
          cumulativeAcceptedQty,
          pincode
        } = lotData;

        try {
          // Find the call data for this call number to get workflowTransitionId
          const callData = allCallOptions.find(c => c.call_no === callNo) || {};

          // Send ONLY current shift quantities to backend (not cumulative)
          const actionData = {
            workflowTransitionId: callData.workflowTransitionId || callData.id || call.workflowTransitionId || call.id,
            requestId: callNo,
            action: 'ENTRY_INSPECTION_RESULTS',
            lotNo: lotNo,
            heatNo: heatNo,
            offeredQty: Math.max(0, offeredQty),
            manufacturedQty: Math.max(0, currentShiftManufacturedQty),
            rejectedQty: Math.max(0, currentShiftRejectedQty),
            inspectedQty: Math.max(0, currentShiftAcceptedQty),
            remarks: `Shift completed for lot ${lotNo}, heat ${heatNo}. Current shift - Manufactured: ${currentShiftManufacturedQty}, Rejected: ${currentShiftRejectedQty}, Accepted: ${currentShiftAcceptedQty}. Cumulative - Manufactured: ${cumulativeManufacturedQty}, Rejected: ${cumulativeRejectedQty}, Accepted: ${cumulativeAcceptedQty}`,
            actionBy: userId,
            pincode: pincode,
            shiftCode: lotData.shiftCode
          };

          console.log(`🔄 [Shift Completed] Sending API call for ${key} (CURRENT SHIFT DATA ONLY):`, actionData);

          await performTransitionAction(actionData);
          console.log(`✅ [Shift Completed] Workflow transition successful for ${key}`);
          workflowResults.push({ key, callNo, lotNo, heatNo, success: true });
        } catch (workflowError) {
          console.error(`❌ [Shift Completed] Workflow API error for ${key}:`, workflowError);
          workflowResults.push({ key, callNo, lotNo, heatNo, success: false, error: workflowError.message });
        }
      }

      // Step 3: Show summary of workflow results
      const successCount = workflowResults.filter(r => r.success).length;
      const failCount = workflowResults.filter(r => !r.success).length;

      if (failCount > 0) {
        const failedCombos = workflowResults.filter(r => !r.success).map(r => r.key).join(', ');
        showNotification('warning', `Shift completed. ${successCount} lot(s) processed successfully. Warning: ${failCount} lot(s) failed: ${failedCombos}`);
      } else {
        showNotification('success', 'Shift completed successfully!');

        // Perform comprehensive cleanup BEFORE navigation
        performInspectionCleanup(call?.call_no, localProductionLines, manufacturingLines);

        // Reset React state
        resetProductionLinesState();

        // Small delay to ensure cleanup completes before unmount
        await new Promise(resolve => setTimeout(resolve, 100));

        // Navigate back to pending calls tab after successful completion
        setTimeout(() => {
          onBack();
        }, 1500); // Give user time to see the success message
      }
    } catch (error) {
      console.error('Error completing shift:', error);
      showNotification('error', `Failed to complete shift: ${error?.message || error}`);
    } finally {
      setIsSaving(false);
    }
  }, [call, localProductionLines, allCallOptions, callInitiationDataCache, manufacturedQtyByLine, manufacturingLines, onBack, resetProductionLinesState, validateAllLots, selectedLotByLine]);

  /**
   * Finishes inspection for the selected calls
   * Saves data and marks as complete
   */
  const executeFinishInspection = useCallback(async (selectedCalls = []) => {
    try {
      if (!selectedCalls || selectedCalls.length === 0) {
        // If no calls selected explicitly, try to use all available
        const allCalls = localProductionLines
          .filter(l => l)
          .map(l => l.icNumber)
          .filter(Boolean);

        // Remove duplicates
        selectedCalls = [...new Set(allCalls)];
      }

      console.log('🏁 [Finish] Finishing inspection for calls:', selectedCalls);
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || currentUser?.username || 'SYSTEM';

      const linesData = [];
      const linesToProcess = localProductionLines.filter(line =>
        line && (line.icNumber || line.poNumber) && selectedCalls.includes(line.icNumber)
      );

      for (const line of linesToProcess) {
        // Use the line's specific IC number if available, otherwise fall back to main call number
        const lineCallNo = line.icNumber || call.call_no;
        const linePoNo = line.poNumber || call.po_no;

        // Get initiation data for this line to get the correct shift
        // Get initiation data for this line
        const lineInitiationData = callInitiationDataCache[lineCallNo];
        let shift = lineInitiationData?.shiftOfInspection || call.shiftOfInspection || call.shift || 'A';

        // Load latest grid data from local storage using the line's specific call and PO
        const gridData = loadGridDataForLine(lineCallNo, linePoNo, `Line-${line.lineNumber}`);

        // Attempt to derive actual shift from grid data
        const submodules = ['shearing', 'turning', 'mpi', 'forging', 'quenching', 'tempering', 'finalCheck', 'testingFinishing'];
        for (const sub of submodules) {
          if (gridData?.[sub] && Array.isArray(gridData[sub])) {
            const rowWithShift = gridData[sub].find(r => r.shift);
            if (rowWithShift) {
              shift = rowWithShift.shift;
              break;
            }
          }
        }

        const hourLabels = getHourLabels(shift);

        const enrichData = (data) => {
          if (!data || !Array.isArray(data)) return [];
          return data.map((row, idx) => ({
            ...row,
            shift: row.shift || shift,
            hourLabel: row.hourLabel || hourLabels[idx] || '',
            createdBy: userId
          }));
        };

        // Identify all lots processed on this line
        const lineKey = `Line-${line.lineNumber}`;
        const simpleLineKey = String(line.lineNumber);
        const lineLotData = manufacturedQtyByLine[lineKey] || manufacturedQtyByLine[simpleLineKey] || {};

        // Determine unique lots to process for this line
        const lotKeys = Object.keys(lineLotData).filter(key => key !== 'undefined' && key !== '');

        // Get Lot/Heat/Offered Qty Metadata for Payload
        const lotDetails = lineInitiationData?.lotDetailsList || [];

        // If no recorded lots via manual entry, fall back to current selected lot or first available
        const lotsToProcess = lotKeys.length > 0 ? lotKeys : [selectedLotByLine[lineKey] || (lotDetails.length > 0 ? lotDetails[0].lotNumber : 'Default')];

        for (const lotNo of lotsToProcess) {
          const lotData = lineLotData[lotNo] || {};

          // Filter grid data to only include rows for THIS specific lot
          const filterByLot = (data) => {
            if (!data || !Array.isArray(data)) return [];
            return data.filter(row => row.lotNo === lotNo);
          };

          const lotLineDto = {
            lineNo: `Line-${line.lineNumber}`,
            poNo: linePoNo,
            inspectionCallNo: lineCallNo,
            shearingData: enrichData(filterByLot(gridData?.shearing)),
            turningData: enrichData(filterByLot(gridData?.turning)),
            mpiData: enrichData(filterByLot(gridData?.mpi)),
            forgingData: enrichData(filterByLot(gridData?.forging)),
            quenchingData: enrichData(filterByLot(gridData?.quenching)),
            temperingData: enrichData(filterByLot(gridData?.tempering)),
            finalCheckData: enrichData(filterByLot(gridData?.finalCheck)),
            testingFinishingData: enrichData(filterByLot(gridData?.testingFinishing)),
            remarks: ''
          };

          const manualQuantities = {
            shearing: parseInt(lotData.shearing || 0) || 0,
            turning: parseInt(lotData.turning || 0) || 0,
            mpiTesting: parseInt(lotData.mpiTesting || 0) || 0,
            forging: parseInt(lotData.forging || 0) || 0,
            quenching: parseInt(lotData.quenching || 0) || 0,
            tempering: parseInt(lotData.tempering || 0) || 0,
            testingFinishing: parseInt(lotData.testingFinishing || 0) || 0
          };

          const targetLotDetail = lotDetails.find(l => l.lotNumber === lotNo) || lotDetails.find(l => l.lotNumber === lotNo.trim()) || lotDetails[0];

          const metaData = {
            lotNumbers: targetLotDetail?.lotNumber || lotNo || '',
            heatNumbers: targetLotDetail?.heatNumber || '',
            totalOfferedQty: parseInt(targetLotDetail?.offeredQty) || 0,
            shift: shift
          };

          const transformedLineDto = transformLineDataForBackend(lotLineDto, manualQuantities, metaData);
          if (transformedLineDto) {
            linesData.push(transformedLineDto);
          }
        }
      }

      const payload = {
        inspectionCallNo: call.call_no,
        remarks: 'Inspection Finished',
        shift: linesData.length > 0 ? linesData[0].lineFinalResult?.shift || sessionStorage.getItem('inspectionShift') || call.shiftOfInspection || call.shift : sessionStorage.getItem('inspectionShift') || call.shiftOfInspection || call.shift,
        shiftCode: (linesData.length > 0 ? linesData[0].lineFinalResult?.shift || sessionStorage.getItem('inspectionShift') || call.shiftOfInspection || call.shift : sessionStorage.getItem('inspectionShift') || call.shiftOfInspection || call.shift)?.charAt(0).toUpperCase() || 'A',
        linesData: linesData,
        createdBy: userId
      };

      console.log('Sending finish payload:', payload);
      await finishProcessInspection(payload);

      console.log('✅ [Finish] Inspection data saved and finished successfully!');

      // Perform cleanup and navigate back
      performInspectionCleanup(call?.call_no, localProductionLines, manufacturingLines);
      resetProductionLinesState();

      // Small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate back to landing page after successful completion
      setTimeout(() => {
        console.log('🏠 [Execute] Calling onBack() to navigate to landing page...');
        onBack();
      }, 1500); // Give user time to see the success message

    } catch (error) {
      console.error('❌ [Finish] Error finishing inspection:', error);
      throw error; // Propagate error to caller
    }
  }, [call, localProductionLines, manufacturingLines, onBack, resetProductionLinesState, callInitiationDataCache, manufacturedQtyByLine, selectedLotByLine]);

  /**
   * Handle finish selected calls from modal
   */
  const handleFinishSelectedCalls = useCallback(async () => {
    if (selectedCallsToFinish.length === 0) {
      showNotification('error', 'Please select at least one call to finish');
      return;
    }

    // STEP 1: Validate 8-hour grid data for selected calls only
    console.log('🔍 [Finish] Starting validation for selected calls...');

    // Filter production lines to only those with selected call numbers (and are valid objects)
    const linesToValidate = localProductionLines.filter(l => l && typeof l === 'object').filter((prodLine) => {
      const callNo = prodLine.icNumber;
      return selectedCallsToFinish.includes(callNo);
    });

    console.log(`🔍 [Finish] Validating ${linesToValidate.length} production lines for selected calls`);

    const validation = validateAllLots(linesToValidate);

    if (!validation.isValid) {
      // Build error message
      let errorMessage = 'Incomplete 8-hour grid data found for selected calls:\n\n';

      validation.errors.forEach((errors, key) => {
        const [lineNo, lotNo] = key.split('|');
        errorMessage += `${lineNo}, ${lotNo}:\n`;
        errorMessage += `  ${errors.join('\n  ')}\n\n`;
      });

      errorMessage += 'Please complete all required sections before finishing inspection.';

      console.error('🔍 [Finish] Validation failed:', errorMessage);
      showNotification('error', errorMessage);
      return;
    }

    console.log('🔍 [Finish] ✅ Validation passed, proceeding with finish inspection...');

    setIsSaving(true);

    try {
      // Get logged in user
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || currentUser?.username || 'SYSTEM';

      console.log('📋 [Finish] Selected calls to finish:', selectedCallsToFinish);
      console.log('📋 [Finish] Processing all production lines...');

      // Step 2: Build a comprehensive data map for all lines
      const lotDataMap = new Map();

      // Iterate through all production lines to collect lot-wise data
      for (let lineIndex = 0; lineIndex < localProductionLines.length; lineIndex++) {
        const prodLine = localProductionLines[lineIndex];
        const lineNo = `Line-${lineIndex + 1}`;
        const callNo = prodLine.icNumber;
        const poNo = prodLine.poNumber || prodLine.po_no || '';
        const pincode = prodLine.pincode || call?.pincode || '560001';

        // Skip if no call number
        if (!callNo) {
          console.log(`⏭️ [Finish] Skipping ${lineNo} - no call number`);
          continue;
        }

        // Determine action based on whether this call is selected
        const action = selectedCallsToFinish.includes(callNo)
          ? 'INSPECTION_COMPLETE_CONFIRM'
          : 'ENTRY_INSPECTION_RESULTS';

        console.log(`📋 [Finish] Processing ${lineNo} (Call: ${callNo}) - Action: ${action}`);

        // Get initiation data for this line to get lot details (offered qty, heat numbers)
        const lineInitiationData = callInitiationDataCache[callNo];

        if (!lineInitiationData?.lotDetailsList) {
          console.log(`⚠️ [Finish] No initiation data for ${lineNo}, skipping`);
          continue;
        }

        // Fetch previous shift data for this call (lot-wise array)
        let previousShiftDataByLot = {};
        try {
          const quantitySummaryData = await getQuantitySummary(callNo);
          if (quantitySummaryData && Array.isArray(quantitySummaryData)) {
            // Convert array to map: lotNumber -> { manufacturedQty, rejectedQty }
            quantitySummaryData.forEach(lotData => {
              if (lotData.lotNumber) {
                previousShiftDataByLot[lotData.lotNumber] = {
                  manufacturedQty: lotData.manufacturedQty || 0,
                  rejectedQty: lotData.rejectedQty || 0,
                  acceptedQty: lotData.acceptedQty || 0,
                  offeredQty: lotData.offeredQty || 0
                };
              }
            });
            console.log(`✅ [Finish] Previous shift data for ${callNo}:`, previousShiftDataByLot);
          }
        } catch (error) {
          console.error(`⚠️ [Finish] Failed to fetch previous shift data for ${callNo}:`, error);
        }

        // Process each lot for this line
        lineInitiationData.lotDetailsList.forEach(lotDetail => {
          const lotNo = lotDetail.lotNumber;
          const heatNo = lotDetail.heatNumber || '';
          const offeredQty = lotDetail.offeredQty || 0;

          // Get current shift manufactured quantity from manufacturedQtyByLine state
          const currentShearingManufacturedQty = (manufacturedQtyByLine[lineNo]?.[lotNo]?.shearing)
            ? parseInt(manufacturedQtyByLine[lineNo][lotNo].shearing)
            : 0;

          // Get current shift rejected quantity using rejectedQty.totalRejected
          const currentTotalRejected = rejectedQty.totalRejected || 0;

          // Get previous shift data for THIS SPECIFIC LOT
          const previousShiftDataForLot = previousShiftDataByLot[lotNo] || { manufacturedQty: 0, rejectedQty: 0 };

          // Calculate cumulative quantities
          const cumulativeManufacturedQty = currentShearingManufacturedQty + previousShiftDataForLot.manufacturedQty;
          const cumulativeRejectedQty = currentTotalRejected + previousShiftDataForLot.rejectedQty;
          const cumulativeAcceptedQty = Math.max(0, cumulativeManufacturedQty - cumulativeRejectedQty);

          // Calculate current shift quantities
          const currentShiftManufacturedQty = currentShearingManufacturedQty;
          const currentShiftRejectedQty = currentTotalRejected;
          const currentShiftAcceptedQty = Math.max(0, currentShiftManufacturedQty - currentShiftRejectedQty);

          const key = `${callNo}|${lotNo}`;
          lotDataMap.set(key, {
            callNo,
            lotNo,
            heatNo,
            offeredQty,
            currentShiftManufacturedQty,
            currentShiftRejectedQty,
            currentShiftAcceptedQty,
            cumulativeManufacturedQty,
            cumulativeRejectedQty,
            cumulativeAcceptedQty,
            lineNo,
            poNo,
            pincode,
            action,
            shiftCode: (sessionStorage.getItem('inspectionShift') || lineInitiationData?.shiftOfInspection || call.shiftOfInspection || call.shift || 'A').charAt(0).toUpperCase()
          });

          console.log(`✅ [Finish] ${lineNo} - Lot ${lotNo} - Action: ${action}:`, {
            currentShift: { manufactured: currentShiftManufacturedQty, rejected: currentShiftRejectedQty, accepted: currentShiftAcceptedQty },
            previousShifts: previousShiftDataForLot,
            cumulative: { manufactured: cumulativeManufacturedQty, rejected: cumulativeRejectedQty, accepted: cumulativeAcceptedQty }
          });
        });
      }

      console.log(`📋 [Finish] Total lots to process: ${lotDataMap.size}`);

      if (lotDataMap.size === 0) {
        showNotification('error', 'No production lines with lot data found');
        return;
      }

      // Step 2: Send performTransitionAction API call for each lot
      const workflowResults = [];

      for (const [key, lotData] of lotDataMap) {
        const {
          callNo,
          lotNo,
          heatNo,
          offeredQty,
          currentShiftManufacturedQty,
          currentShiftRejectedQty,
          currentShiftAcceptedQty,
          cumulativeManufacturedQty,
          cumulativeRejectedQty,
          cumulativeAcceptedQty,
          pincode,
          action
        } = lotData;

        try {
          const callData = allCallOptions.find(c => c.call_no === callNo) || {};

          const actionData = {
            workflowTransitionId: callData.workflowTransitionId || callData.id || call.workflowTransitionId || call.id,
            requestId: callNo,
            action: action,
            lotNo: lotNo,
            heatNo: heatNo,
            offeredQty: Math.max(0, offeredQty),
            manufacturedQty: Math.max(0, currentShiftManufacturedQty),
            rejectedQty: Math.max(0, currentShiftRejectedQty),
            inspectedQty: Math.max(0, currentShiftAcceptedQty),
            remarks: `Inspection ${action === 'INSPECTION_COMPLETE_CONFIRM' ? 'completed' : 'paused'} for lot ${lotNo}, heat ${heatNo}. Current shift - Manufactured: ${currentShiftManufacturedQty}, Rejected: ${currentShiftRejectedQty}, Accepted: ${currentShiftAcceptedQty}. Cumulative - Manufactured: ${cumulativeManufacturedQty}, Rejected: ${cumulativeRejectedQty}, Accepted: ${cumulativeAcceptedQty}`,
            actionBy: userId,
            pincode: pincode,
            shiftCode: lotData.shiftCode
          };

          console.log(`🔄 [Finish] Sending API call for ${key} with action ${action}:`, actionData);

          await performTransitionAction(actionData);
          console.log(`✅ [Finish] Workflow transition successful for ${key}`);
          workflowResults.push({ key, callNo, lotNo, heatNo, action, success: true });
        } catch (workflowError) {
          console.error(`❌ [Finish] Workflow API error for ${key}:`, workflowError);
          workflowResults.push({ key, callNo, lotNo, heatNo, action, success: false, error: workflowError.message });
        }
      }

      // Step 3: Show summary
      const successCount = workflowResults.filter(r => r.success).length;
      const failCount = workflowResults.filter(r => !r.success).length;

      if (failCount > 0) {
        const failedCombos = workflowResults.filter(r => !r.success).map(r => r.key).join(', ');
        showNotification('warning', `Finish processed. ${successCount} lot(s) processed successfully. Warning: ${failCount} lot(s) failed: ${failedCombos}`);
      } else {
        showNotification('success', `Finish processed successfully! ${successCount} lot(s) processed.`);
      }

      setShowFinishCallSelectionModal(false);
      setSelectedCallsToFinish([]);
      setCallsGroupedByIc([]);

      await executeFinishInspection(selectedCallsToFinish);

    } catch (error) {
      console.error('Error finishing inspection:', error);
      showNotification('error', `Failed to finish inspection: ${error?.message || error}`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedCallsToFinish, executeFinishInspection, localProductionLines, call, callInitiationDataCache, manufacturedQtyByLine, allCallOptions, validateAllLots, rejectedQty.totalRejected]);



  // Use current line's PO data from cached initiation data (live from backend)
  // Priority: 1) currentLineInitiationData, 2) fetchedPoData, 3) currentCallData
  // Extract manufacturer from rmIcHeatInfoList (first entry) - same as Raw Material Dashboard
  const lineManufacturer = currentLineInitiationData?.rmIcHeatInfoList?.[0]?.manufacturer
    || currentLineInitiationData?.vendorName
    || fetchedPoData?.manufacturer
    || currentCallData?.manufacturer
    || currentCallData?.vendor_name
    || '';

  const linePoData = currentLineInitiationData ? {
    po_no: currentLineInitiationData.poNo || '',
    sub_po_no: currentProductionLine.rawMaterialICs || '',
    po_date: currentLineInitiationData.poDate || '',
    sub_po_date: currentLineInitiationData.poDate || '',
    contractor: currentLineInitiationData.vendorName || '',
    manufacturer: lineManufacturer,
    place_of_inspection: currentLineInitiationData.placeOfInspection || ''
  } : (fetchedPoData ? {
    po_no: fetchedPoData.po_no || '',
    sub_po_no: fetchedPoData.po_no || '',
    po_date: fetchedPoData.po_date || '',
    sub_po_date: fetchedPoData.po_date || '',
    contractor: fetchedPoData.contractor || fetchedPoData.vendor_name || '',
    manufacturer: fetchedPoData.manufacturer || '',
    place_of_inspection: fetchedPoData.place_of_inspection || ''
  } : (currentCallData ? {
    po_no: currentCallData.po_no || '',
    sub_po_no: currentCallData.sub_po_no || currentProductionLine.rawMaterialICs || '',
    po_date: currentCallData.po_date || '',
    sub_po_date: currentCallData.sub_po_date || currentCallData.po_date || '',
    contractor: currentCallData.contractor || currentCallData.vendor_name || '',
    manufacturer: currentCallData.manufacturer || currentCallData.vendor_name || '',
    place_of_inspection: currentCallData.place_of_inspection || ''
  } : {
    po_no: '',
    sub_po_no: '',
    po_date: '',
    sub_po_date: '',
    contractor: '',
    manufacturer: '',
    place_of_inspection: ''
  }));

  // removed unused hourly data and validators to satisfy lint rules

  // Show loading indicator while fetching data
  if (isLoading) {
    return (
      <div className="process-dashboard">
        <style>{staticDataStyles}</style>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
          <p>Loading inspection data...</p>
        </div>
      </div>
    );
  }

  // Get call details for display - show all PO numbers if multiple calls
  const callNo = availableCalls.length > 1
    ? availableCalls.map(c => c.po_no).join(', ')
    : (fetchedCallData?.inspectionCallNo || call?.call_no || 'N/A');
  // Read shift and date from sessionStorage (saved during Initiation) or fallback to fetched data
  const shiftOfInspection = sessionStorage.getItem('inspectionShift') || fetchedCallData?.shiftOfInspection || 'N/A';
  const dateOfInspection = sessionStorage.getItem('inspectionDate') || fetchedCallData?.dateOfInspection || 'N/A';

  return (
    <div className="process-dashboard">
      <style>{staticDataStyles}</style>
      <Notification
        message={notification.message}
        type={notification.type}
        autoClose={notification.autoClose}
        onClose={() => setNotification({ type: '', message: '', autoClose: true })}
      />

      <div className="breadcrumb">
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item">Inspection Initiation</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">ERC Process</div>
      </div>

      {/* Inspection Call Info Banner */}
      <div className="card" style={{ background: 'var(--color-primary-light)', marginBottom: 'var(--space-16)', padding: 'var(--space-16)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-24)', flexWrap: 'wrap' }}>
          <div><strong>Call No:</strong> {callNo}</div>
          <div><strong>Shift:</strong> {shiftOfInspection}</div>
          <div><strong>Date of Inspection:</strong> {formatDate(dateOfInspection)}</div>
        </div>
      </div>

      <div className="process-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
        <h1>ERC Process Inspection - {callNo}</h1>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ← Back to Landing Page
        </button>
      </div>

      {/* Multiple Production Lines Section */}
      <div className="card production-lines-card" style={{ marginBottom: 'var(--space-24)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Multiple Production Lines (if applicable)</h3>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setProductionLinesExpanded(!productionLinesExpanded)}
            style={{ padding: '8px 16px', fontSize: '18px' }}
          >
            {productionLinesExpanded ? '-' : '+'}
          </button>
        </div>
        {productionLinesExpanded && (
          <>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>All data points must be collected for each line number separately.</p>
            <div className="production-lines-table-wrapper">
              <table className="production-lines-table">
                <thead>
                  <tr>
                    <th>Line Number</th>
                    <th>Inspection Call Number <span style={{ color: '#ef4444' }}>*</span></th>
                    <th>PO Number</th>
                    <th>Raw Material IC Number(s)</th>
                    <th>Product Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {localProductionLines.map((line, idx) => {
                    if (!line || typeof line !== 'object') return null;
                    return (
                      <tr key={idx}>
                        <td data-label="Line Number">
                          <select
                            className="form-input"
                            value={line.lineNumber || ''}
                            onChange={(e) => handleLineNumberChange(idx, parseInt(e.target.value))}
                            disabled={!line.icNumber}
                            style={{
                              width: '100px',
                              backgroundColor: !line.icNumber ? '#f3f4f6' : '#white',
                              borderColor: lineNumberErrors[idx] ? '#dc2626' : '#d1d5db',
                              fontWeight: '500'
                            }}
                          >
                            <option value="" disabled>Select</option>
                            {[1, 2, 3, 4, 5].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                          {lineNumberErrors[idx] && (
                            <div style={{ color: '#dc2626', fontSize: '10px', marginTop: '4px', maxWidth: '100px', lineHeight: '1.2' }}>
                              {lineNumberErrors[idx]}
                            </div>
                          )}
                        </td>
                        <td data-label="Inspection Call Number">
                          <select
                            className="form-input"
                            value={line.icNumber || ''}
                            onChange={(e) => handleCallNumberChange(idx, e.target.value)}
                            style={{
                              minWidth: '180px',
                              backgroundColor: '#fff',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">Select Call Number</option>
                            {allCallOptions.map((opt, optIdx) => (
                              <option key={optIdx} value={opt.call_no}>{opt.call_no}</option>
                            ))}
                          </select>
                        </td>
                        <td data-label="PO Number">
                          <input
                            type="text"
                            className="form-input"
                            value={line.poNumber || ''}
                            readOnly
                            disabled
                            style={{ minWidth: '120px', backgroundColor: '#f3f4f6' }}
                          />
                        </td>
                        <td data-label="Raw Material IC">
                          <input
                            type="text"
                            className="form-input"
                            value={line.rawMaterialICs || '-'}
                            readOnly
                            disabled
                            style={{ minWidth: '150px', backgroundColor: '#f3f4f6' }}
                          />
                        </td>
                        <td data-label="Product Type">
                          <input
                            type="text"
                            className="form-input"
                            value={line.productType || ''}
                            readOnly
                            disabled
                            style={{ minWidth: '100px', backgroundColor: '#f3f4f6' }}
                          />
                        </td>
                        <td data-label="Actions">
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleRemoveProductionLine(idx)}
                            style={{
                              padding: '6px 16px',
                              fontSize: '13px',
                              color: '#dc2626',
                              borderColor: '#dc2626',
                              backgroundColor: '#fff'
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Add Production Line and Add New Call Number Buttons */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddProductionLine}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#1f2937',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                + Add Production Line
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddNewCallNumber}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0d9488',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                + Add New Call Number
              </button>
            </div>
          </>
        )}
      </div>

      {/* Line Number Toggle - At the top */}
      <div className="process-line-toggle" style={{
        display: 'flex',
        marginBottom: 'var(--space-24)',
        background: '#fef3e2',
        borderRadius: '8px',
        padding: '8px',
        border: '1px solid #f59e0b'
      }}>
        {manufacturingLines.map(line => (
          <button
            key={line}
            onClick={() => handleLineChange(line)}
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: selectedLine === line ? '600' : '400',
              color: selectedLine === line ? '#fff' : '#374151',
              backgroundColor: selectedLine === line ? '#0d9488' : 'transparent',
              border: selectedLine === line ? '2px solid #0d9488' : '2px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {getLineLabel(line)}
          </button>
        ))}
      </div>

      {/* Inspection Details (Static Data) - Based on selected line */}
      <div className="card" style={{ background: 'var(--color-gray-100)', marginBottom: 'var(--space-24)' }}>
        <div className="card-header">
          <h3 className="card-title">Inspection Details (Static Data) - {selectedLine}</h3>
          <p className="card-subtitle">Auto-fetched from PO/Sub PO information for selected line</p>
        </div>
        <div className="process-form-grid">
          <div className="process-form-group">
            <label className="process-form-label">PO Number</label>
            <input type="text" className="process-form-input" value={linePoData.po_no || linePoData.sub_po_no || ''} disabled />
          </div>
          <div className="process-form-group">
            <label className="process-form-label">PO Date</label>
            <input type="text" className="process-form-input" value={formatDate(linePoData.sub_po_date || linePoData.po_date)} disabled />
          </div>
          <div className="process-form-group">
            <label className="process-form-label">Contractor Name</label>
            <input type="text" className="process-form-input" value={linePoData.contractor || ''} disabled />
          </div>
          <div className="process-form-group">
            <label className="process-form-label">Manufacturer</label>
            <input type="text" className="process-form-input" value={linePoData.manufacturer || ''} disabled />
          </div>
          <div className="process-form-group">
            <label className="process-form-label">Place of Inspection</label>
            <input type="text" className="process-form-input" value={linePoData.place_of_inspection || ''} disabled />
          </div>
          <div className="process-form-group">
            <label className="process-form-label">Stage of Inspection</label>
            <input type="text" className="process-form-input" value="Process Material Inspection" disabled />
          </div>
        </div>
      </div>

      {/* Pre-Inspection Data Entry - Fetched from backend based on selected call's rm_heat_tc_mapping */}
      <div className="card compact-card" style={{ marginBottom: 'var(--space-16)' }}>
        <div className="card-header" style={{ paddingBottom: '8px' }}>
          <h3 className="card-title" style={{ marginBottom: '4px' }}>Pre-Inspection Data Entry - {selectedLine}</h3>
          {/* <span style={{ fontSize: '12px', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>📥 Fetched from Backend (PO: {currentCallData?.po_no || 'N/A'})</span> */}
        </div>

        {/* Compact Lot-Heat Mapping Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {lineLotNumbers.length > 0 ? lineLotNumbers.map(lot => (
            <div key={lot} style={{
              background: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: '6px',
              padding: '10px'
            }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Lot Number</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{lot}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Heat No. (from RM IC)</span>
                <span style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#1f2937',
                  background: '#f3f4f6',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}>{lineHeatNumbersMap[lot] || '-'}</span>
              </div>
            </div>
          )) : (
            <div style={{
              color: '#64748b',
              fontSize: '14px',
              padding: '20px',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '6px',
              border: '1px dashed #cbd5e1'
            }}>
              No lot/heat data available for selected call. Please ensure the call has rm_heat_tc_mapping data.
            </div>
          )}
        </div>

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', color: '#1d4ed8' }}>ℹ️</span>
          3 readings per hour are required for all process parameters
        </div>
      </div>

      {/* Sub Module Session - Shows for selected line */}
      <div className="process-submodule-session">
        <div className="process-submodule-session-header">
          <h3 className="process-submodule-session-title">📋 Sub Module Session</h3>
          <p className="process-submodule-session-subtitle">
            Select a module to proceed with inspection
            <span style={{ marginLeft: '8px', color: '#0d9488', fontWeight: 500 }}>({manufacturingLines.length} Production Lines)</span>
          </p>
        </div>
        <div className="process-submodule-buttons">
          <button className="process-submodule-btn" onClick={() => onNavigateToSubModule('process-calibration-documents', { selectedLine, productionLines: localProductionLines, allCallOptions, mapping: lineDisplayMapping })}>
            <span className="process-submodule-btn-icon">📄</span>
            <p className="process-submodule-btn-title">Calibration & Documents</p>
            <p className="process-submodule-btn-desc">Verify instrument calibration</p>
          </button>
          <button className="process-submodule-btn" onClick={() => onNavigateToSubModule('process-static-periodic-check', { selectedLine, productionLines: localProductionLines, allCallOptions, mapping: lineDisplayMapping })}>
            <span className="process-submodule-btn-icon">⚙️</span>
            <p className="process-submodule-btn-title">Static Periodic Check</p>
            <p className="process-submodule-btn-desc">Equipment verification (includes Oil Tank Counter)</p>
          </button>
          <button className="process-submodule-btn" onClick={() => onNavigateToSubModule('process-parameters-grid', { selectedLine, productionLines: localProductionLines, allCallOptions, callInitiationDataCache, mapping: lineDisplayMapping })}>
            <span className="process-submodule-btn-icon">🔬</span>
            <p className="process-submodule-btn-title">Process Parameters - 8 Hour Grid</p>
            <p className="process-submodule-btn-desc">Hourly production data entry</p>
          </button>
          <button className="process-submodule-btn" onClick={() => onNavigateToSubModule('process-summary-reports', { selectedLine, productionLines: localProductionLines, allCallOptions, mapping: lineDisplayMapping })}>
            <span className="process-submodule-btn-icon">📊</span>
            <p className="process-submodule-btn-title">Summary / Reports</p>
            <p className="process-submodule-btn-desc">View consolidated results</p>
          </button>
        </div>
      </div>

      {/* Final Inspection Results – Main Module (Auto Populated) */}
      <div className="card" style={{ marginTop: 'var(--space-24)', border: '2px solid #0d9488' }}>
        <div className="card-header" style={{ backgroundColor: '#f0fdfa' }}>
          <h3 className="card-title" style={{ color: '#0d9488' }}>📊 Stage-wise Results - {selectedLine}</h3>
          {/* <p className="card-subtitle">Summary of all stage-wise inspection results (Line-wise / Lot-wise / PO-wise / Total)</p> */}
        </div>

        {/* Final Inspection Results Totals - Shows sum of all lines */}
        <div className="process-context-info" style={{ padding: 'var(--space-16)', backgroundColor: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-16)', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#64748b' }}>Raw Material Accepted</small>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0d9488' }}>{rawMaterialAccepted} pcs</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#64748b' }}>Process Manufactured</small>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{processManufactured} pcs</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#64748b' }}>Process Inspection Accepted</small>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{processInspectionAccepted} pcs</div>
          </div>
        </div>


        {/* Heat Wise Accoutnal Section */}
        {(() => {
          // Only show if we have heat/lot data
          if (!lineLotNumbers || lineLotNumbers.length === 0) {
            return null;
          }

          return (
            <div style={{
              padding: 'var(--space-16)',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#15803d',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔥 Heat Wise Accoutnal
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="heat-wise-accoutnal-table" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#dcfce7', borderBottom: '2px solid #86efac' }}>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#15803d',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '120px'
                      }}>Heat No.</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#15803d',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '140px'
                      }}>Accepted RM (MT)</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#15803d',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '140px'
                      }}>Max No. of ERC Can Be Mfg</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#15803d',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '140px'
                      }}>Mfg ERC In Process</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#15803d',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '140px'
                      }}>Rejected ERC In Process</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#15803d',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        minWidth: '140px'
                      }}>Accepted ERC In Process</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingHeatWiseData && (
                      <tr>
                        <td colSpan="6" style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#64748b'
                        }}>
                          Loading heat wise accountal data...
                        </td>
                      </tr>
                    )}
                    {heatWiseDataError && (
                      <tr>
                        <td colSpan="6" style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#ef4444'
                        }}>
                          Error loading data: {heatWiseDataError}
                        </td>
                      </tr>
                    )}
                    {!isLoadingHeatWiseData && !heatWiseDataError && lineLotNumbers.map((lot) => {
                      const heatNo = lineHeatNumbersMap[lot] || '-';
                      const offeredQty = lotOfferedQtyMap[lot] || 0;

                      // Get API data for this heat if available
                      const apiData = heatWiseAccountalData[heatNo];

                      // Use API data if available, otherwise fall back to calculated values
                      // Updated field mappings based on new API response:
                      // - Accepted RM (MT) = weightAcceptedMt
                      // - Max No. of ERC Can Be Mfg = rmAcceptedQty
                      // - Mfg ERC In Process = manufaturedQty
                      // - Rejected ERC In Process = rejectedQty
                      // - Accepted ERC In Process = acceptedQty
                      const weightAcceptedMt = apiData?.weightAcceptedMt ?? offeredQty;
                      const maxErcCanBeMfg = apiData?.rmAcceptedQty ?? getShearingManufacturedQtyForLot(lot);
                      const mfgErcInProcess = apiData?.manufaturedQty ?? getShearingManufacturedQtyForLot(lot);
                      const rejectedErcInProcess = apiData?.rejectedQty ?? getTotalRejectedForLot(lot);
                      const acceptedErcInProcess = apiData?.acceptedQty ?? Math.max(0, mfgErcInProcess - rejectedErcInProcess);

                      return (
                        <tr key={lot} style={{
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: apiData ? '#f0fdf4' : 'white'
                        }}>
                          <td data-label="Heat No." style={{
                            padding: '12px 16px',
                            fontWeight: 600,
                            color: '#1f2937'
                          }}>{heatNo}</td>
                          <td data-label="Accepted RM (MT)" style={{
                            padding: '12px 16px',
                            color: '#64748b',
                            fontWeight: 500
                          }}>{weightAcceptedMt > 0 ? weightAcceptedMt : '-'}</td>
                          <td data-label="Max ERC Can be Mfg" style={{
                            padding: '12px 16px',
                            color: '#3b82f6',
                            fontWeight: 500
                          }}>{maxErcCanBeMfg > 0 ? maxErcCanBeMfg : '-'}</td>
                          <td data-label="Mfg ERC In Process" style={{
                            padding: '12px 16px',
                            color: apiData ? '#059669' : '#3b82f6',
                            fontWeight: 500
                          }}>{mfgErcInProcess > 0 ? mfgErcInProcess : '-'}</td>
                          <td data-label="Rejected ERC" style={{
                            padding: '12px 16px',
                            color: '#ef4444',
                            fontWeight: 600
                          }}>{rejectedErcInProcess > 0 ? rejectedErcInProcess : '-'}</td>
                          <td data-label="Accepted ERC" style={{
                            padding: '12px 16px',
                            color: '#22c55e',
                            fontWeight: 600
                          }}>{acceptedErcInProcess > 0 ? acceptedErcInProcess : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Lot Wise Quantity Breakup Section */}
        {(() => {
          // Get ALL selected lots from the 8-hour grid (across all sections)
          const allSelectedLots = getAllSelectedLotsForCurrentLine();

          console.log('📦 [Lot Wise Breakup] All selected lots:', allSelectedLots);

          // Only show the table if lots are selected in the 8-hour grid
          if (!allSelectedLots || allSelectedLots.length === 0) {
            return null;
          }

          return (
            <div className="lot-wise-quantity-wrapper">
              <div className="lot-wise-quantity-title">
                📦 Lot Wise Quantity Breakup (Cumulative - All Shifts)
              </div>
              {isLoadingPreviousShiftData && (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px'
                }}>
                  Loading previous shift data...
                </div>
              )}
              {previousShiftDataError && (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#ef4444',
                  fontSize: '14px'
                }}>
                  Error loading previous shift data: {previousShiftDataError}
                </div>
              )}
              {!isLoadingPreviousShiftData && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="lot-wise-quantity-table">
                    <thead>
                      <tr>
                        <th style={{ width: '150px' }}>Lot No.</th>
                        <th style={{ width: '150px' }}>Offered Qty</th>
                        <th style={{ width: '150px' }}>Manufactured Qty</th>
                        <th style={{ width: '150px' }}>Rejected Qty</th>
                        <th style={{ width: '150px' }}>Accepted Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSelectedLots.map((selectedLot) => {
                        // Resolve the production line object for the selected line
                        const lineIdx = parseInt(selectedLine.replace('Line-', ''), 10) - 1;
                        const prodLine = localProductionLines[lineIdx];

                        // Load persisted lineFinalResult for this lot (contains current shift metrics)
                        // Fetching from localStorage ensures we use the exact values computed during user data entry
                        const lotFinalResult = loadFromLocalStorage('lineFinalResult', prodLine?.icNumber || '', prodLine?.poNumber || prodLine?.po_no || '', selectedLine, selectedLot);

                        // REAL-TIME UPDATE FIX: Check state first, then localStorage
                        // This ensures the table updates AS THE USER TYPES, not just on blur
                        const stateMfgQty = manufacturedQtyByLine?.[selectedLine]?.[selectedLot]?.shearing;
                        const currentLotMaxManufacturedQty = (stateMfgQty !== undefined && stateMfgQty !== '')
                          ? parseInt(stateMfgQty) || 0
                          : (lotFinalResult?.totalManufactured || 0);

                        const currentTotalRejected = lotFinalResult?.totalRejected || 0;

                        const currentShearingManufacturedQty = currentLotMaxManufacturedQty;

                        // Get offered quantity for this specific lot from the map
                        // NOTE: Offered Qty is constant (provided by vendor) - NOT cumulative
                        const lotOfferedQty = lotOfferedQtyMap[selectedLot] || rawMaterialAccepted || '-';

                        // Get previous shift data for THIS SPECIFIC LOT
                        const previousShiftDataForLot = previousShiftData[selectedLot] || {
                          manufacturedQty: 0,
                          rejectedQty: 0,
                          acceptedQty: 0,
                          offeredQty: 0
                        };

                        // Calculate CUMULATIVE quantities by adding previous shift data + current shift data
                        // Previous shift data comes from API (qty-summary endpoint)
                        // IMPORTANT: Offered Qty is NOT cumulative - it remains constant across all shifts
                        const cumulativeManufacturedQty = currentShearingManufacturedQty + previousShiftDataForLot.manufacturedQty;
                        const cumulativeRejectedQty = currentTotalRejected + previousShiftDataForLot.rejectedQty;
                        const cumulativeAcceptedQty = Math.max(0, cumulativeManufacturedQty - cumulativeRejectedQty);

                        console.log(`📦 [Lot Wise Breakup] Lot: ${selectedLot}`);
                        console.log(`  Offered Qty (constant): ${lotOfferedQty}`);
                        console.log(`  Current Shift - Manufactured: ${currentShearingManufacturedQty}, Rejected: ${currentTotalRejected}`);
                        console.log(`  Previous Shift - Manufactured: ${previousShiftDataForLot.manufacturedQty}, Rejected: ${previousShiftDataForLot.rejectedQty}`);
                        console.log(`  Cumulative - Manufactured: ${cumulativeManufacturedQty}, Rejected: ${cumulativeRejectedQty}, Accepted: ${cumulativeAcceptedQty}`);

                        return (
                          <tr key={selectedLot}>
                            <td className="lot-number-cell">{selectedLot}</td>
                            <td style={{ color: '#64748b', fontWeight: 500 }}>{lotOfferedQty}</td>
                            <td className="quantity-cell-manufactured">{cumulativeManufacturedQty > 0 ? cumulativeManufacturedQty : '-'}</td>
                            <td style={{ color: '#ef4444', fontWeight: 600 }}>{cumulativeRejectedQty > 0 ? cumulativeRejectedQty : '-'}</td>
                            <td className="quantity-cell-accepted">{cumulativeAcceptedQty > 0 ? cumulativeAcceptedQty : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}


        {/* Lot Number Toggle Tabs */}
        {(() => {
          // Get lots from ALL sections (not just shearing)
          // This ensures the toggle displays when lots are added in any section
          const allLots = getAllSelectedLotsForCurrentLine();

          if (!allLots || allLots.length === 0) {
            return null;
          }

          // If only one lot is selected across all sections, show it as a display (not toggle tabs)
          if (allLots.length === 1) {
            return (
              <div style={{
                padding: 'var(--space-16)',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  📋 Selected Lot:
                </span>
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '2px solid #0d9488',
                  backgroundColor: '#f0fdfa',
                  color: '#0d9488',
                  fontWeight: 600,
                  fontSize: '13px'
                }}>
                  Lot {allLots[0]}
                </div>
              </div>
            );
          }

          // If multiple lots are selected across all sections, show toggle tabs
          return (
            <div style={{
              padding: 'var(--space-16)',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginRight: '8px'
              }}>
                📋 Select Lot:
              </span>
              {allLots.map((lot) => {
                const isSelected = selectedLotForDisplay === lot;
                return (
                  <button
                    key={lot}
                    onClick={() => {
                      // Trigger lot selection event (will be handled by line-specific state)
                      window.dispatchEvent(new CustomEvent('lotSelected', { detail: { lot } }));
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '2px solid #0d9488',
                      backgroundColor: isSelected ? '#0d9488' : '#fff',
                      color: isSelected ? '#fff' : '#0d9488',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(13, 148, 136, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = '#f0fdfa';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                      }
                    }}
                  >
                    Lot {lot}
                  </button>
                );
              })}
            </div>
          );
        })()}


        {/* Stage-wise Results Table */}
        <div className="final-inspection-table-wrapper" style={{ overflowX: 'auto', padding: 'var(--space-16)' }}>
          <table className="data-table final-inspection-table">
            <thead>
              <tr style={{ backgroundColor: '#90EE90', color: '#000' }}>
                <th style={{ color: '#000', width: '80px' }}>S.No.</th>
                <th style={{ color: '#000', width: '200px' }}>Stage / Section</th>
                <th style={{ color: '#000', width: '150px' }}>Manufactured</th>
                <th style={{ color: '#000', width: '150px' }}>Accepted</th>
                <th style={{ color: '#000', width: '150px' }}>Rejected</th>
              </tr>
            </thead>
            <tbody>
              {/* 1. Shearing */}
              <tr>
                <td data-label="S.No.">1</td>
                <td data-label="Stage"><strong>Shearing</strong></td>
                <td data-label="Manufactured">
                  <input
                    type="text"
                    value={manufacturedQty.shearing}
                    onChange={(e) => {
                      const lotNo = selectedLotForDisplay || getSelectedLotForCurrentLine();
                      setManufacturedQtyByLine(prev => ({
                        ...prev,
                        [selectedLine]: {
                          ...prev[selectedLine],
                          [lotNo]: { ...(prev[selectedLine]?.[lotNo] || {}), shearing: e.target.value }
                        }
                      }));
                    }}
                    onBlur={(e) => handleManufacturedBlur('shearing', e.target.value, rejectedQty.shearing)}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td data-label="Accepted" style={{ color: '#22c55e', fontWeight: 600 }}>
                  {acceptedQty.shearing || '-'}
                </td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.shearing || '-'}
                </td>
              </tr>

              {/* 2. Turning (Hydro Coping) */}
              <tr>
                <td data-label="S.No.">2</td>
                <td data-label="Stage"><strong>Turning </strong></td>
                <td data-label="Manufactured">
                  <input
                    type="text"
                    value={manufacturedQty.turning}
                    onChange={(e) => {
                      const lotNo = selectedLotForDisplay || getSelectedLotForCurrentLine();
                      setManufacturedQtyByLine(prev => ({
                        ...prev,
                        [selectedLine]: {
                          ...prev[selectedLine],
                          [lotNo]: { ...(prev[selectedLine]?.[lotNo] || {}), turning: e.target.value }
                        }
                      }));
                    }}
                    onBlur={(e) => handleManufacturedBlur('turning', e.target.value, rejectedQty.turning)}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td data-label="Accepted" style={{ color: '#22c55e', fontWeight: 600 }}>
                  {acceptedQty.turning || '-'}
                </td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.turning || '-'}
                </td>
              </tr>

              {/* 3. MPI Testing */}
              <tr>
                <td data-label="S.No.">3</td>
                <td data-label="Stage"><strong>MPI Testing</strong></td>
                <td data-label="Manufactured">
                  <input
                    type="text"
                    value={manufacturedQty.mpiTesting}
                    onChange={(e) => {
                      const lotNo = selectedLotForDisplay || getSelectedLotForCurrentLine();
                      setManufacturedQtyByLine(prev => ({
                        ...prev,
                        [selectedLine]: {
                          ...prev[selectedLine],
                          [lotNo]: { ...(prev[selectedLine]?.[lotNo] || {}), mpiTesting: e.target.value }
                        }
                      }));
                    }}
                    onBlur={(e) => handleManufacturedBlur('mpiTesting', e.target.value, rejectedQty.mpiTesting)}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td data-label="Accepted" style={{ color: '#22c55e', fontWeight: 600 }}>
                  {acceptedQty.mpiTesting || '-'}
                </td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.mpiTesting || '-'}
                </td>
              </tr>

              {/* 4. Forging (Visual) */}
              <tr>
                <td data-label="S.No.">4</td>
                <td data-label="Stage"><strong>Forging </strong></td>
                <td data-label="Manufactured">
                  <input
                    type="text"
                    value={manufacturedQty.forging}
                    onChange={(e) => {
                      const lotNo = selectedLotForDisplay || getSelectedLotForCurrentLine();
                      setManufacturedQtyByLine(prev => ({
                        ...prev,
                        [selectedLine]: {
                          ...prev[selectedLine],
                          [lotNo]: { ...(prev[selectedLine]?.[lotNo] || {}), forging: e.target.value }
                        }
                      }));
                    }}
                    onBlur={(e) => handleManufacturedBlur('forging', e.target.value, rejectedQty.forging)}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td data-label="Accepted" style={{ color: '#22c55e', fontWeight: 600 }}>
                  {acceptedQty.forging || '-'}
                </td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.forging || '-'}
                </td>
              </tr>

              {/* 5. Quenching */}
              <tr>
                <td data-label="S.No.">5</td>
                <td data-label="Stage"><strong>Quenching</strong></td>
                <td data-label="Manufactured">
                  <input
                    type="text"
                    value={manufacturedQty.quenching}
                    onChange={(e) => {
                      const lotNo = selectedLotForDisplay || getSelectedLotForCurrentLine();
                      setManufacturedQtyByLine(prev => ({
                        ...prev,
                        [selectedLine]: {
                          ...prev[selectedLine],
                          [lotNo]: { ...(prev[selectedLine]?.[lotNo] || {}), quenching: e.target.value }
                        }
                      }));
                    }}
                    onBlur={(e) => handleManufacturedBlur('quenching', e.target.value, rejectedQty.quenching)}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td data-label="Accepted" style={{ color: '#22c55e', fontWeight: 600 }}>
                  {acceptedQty.quenching || '-'}
                </td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.quenching || '-'}
                </td>
              </tr>

              {/* 6. Tempering */}
              <tr>
                <td data-label="S.No.">6</td>
                <td data-label="Stage"><strong>Tempering</strong></td>
                <td data-label="Manufactured">
                  <input
                    type="text"
                    value={manufacturedQty.tempering}
                    onChange={(e) => {
                      const lotNo = selectedLotForDisplay || getSelectedLotForCurrentLine();
                      setManufacturedQtyByLine(prev => ({
                        ...prev,
                        [selectedLine]: {
                          ...prev[selectedLine],
                          [lotNo]: { ...(prev[selectedLine]?.[lotNo] || {}), tempering: e.target.value }
                        }
                      }));
                    }}
                    onBlur={(e) => handleManufacturedBlur('tempering', e.target.value, rejectedQty.tempering)}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td data-label="Accepted" style={{ color: '#22c55e', fontWeight: 600 }}>
                  {acceptedQty.tempering || '-'}
                </td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.tempering || '-'}
                </td>
              </tr>

              {/* 7. Dimensions Check */}
              <tr>
                <td data-label="S.No.">7</td>
                <td data-label="Stage"><strong>Dimensions Check</strong></td>
                <td data-label="Manufactured">-</td>
                <td data-label="Accepted">-</td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.dimensionsCheck || '-'}
                </td>
              </tr>

              {/* 8. Hardness Check */}
              <tr>
                <td data-label="S.No.">8</td>
                <td data-label="Stage"><strong>Hardness Check</strong></td>
                <td data-label="Manufactured">-</td>
                <td data-label="Accepted">-</td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.hardnessCheck || '-'}
                </td>
              </tr>

              {/* 9. Visual Check */}
              <tr>
                <td data-label="S.No.">9</td>
                <td data-label="Stage"><strong>Visual Check</strong></td>
                <td data-label="Manufactured">-</td>
                <td data-label="Accepted">-</td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.visualCheck || '-'}
                </td>
              </tr>

              {/* 10. Testing & Finishing */}
              <tr>
                <td data-label="S.No.">10</td>
                <td data-label="Stage"><strong>Testing & Finishing</strong></td>
                <td data-label="Manufactured">-</td>
                <td data-label="Accepted">-</td>
                <td data-label="Rejected" style={{ color: '#ef4444', fontWeight: 600 }}>
                  {rejectedQty.testingFinishing || '-'}
                </td>
              </tr>

              {/* 11. Accepted - Completely Blank Row */}
              <tr>
                <td data-label="S.No.">11</td>
                <td data-label="Stage"><strong>Accepted</strong></td>
                <td data-label="Manufactured">-</td>
                <td data-label="Accepted">-</td>
                <td data-label="Rejected">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Remarks Field - Required Manual Entry */}
        <div style={{ padding: 'var(--space-16)', borderTop: '1px solid #e2e8f0' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Remarks <span style={{ color: '#ef4444' }}>*</span>
            <small style={{ fontWeight: 'normal', color: '#64748b', marginLeft: '8px' }}>(Manual Entry - Required)</small>
          </label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="Enter inspection remarks..."
            value={finalInspectionRemarks}
            onChange={e => setFinalInspectionRemarks(e.target.value)}
            style={{
              width: '100%',
              borderColor: !finalInspectionRemarks ? '#f59e0b' : '#22c55e',
              resize: 'vertical'
            }}
            required
          />
          {!finalInspectionRemarks && (
            <small style={{ color: '#f59e0b' }}>This field is required</small>
          )}
        </div>

        {/* Validation Rules Info */}
        {/* <div style={{ padding: 'var(--space-16)', backgroundColor: '#fffbeb', borderTop: '1px solid #fbbf24' }}>
          <strong style={{ color: '#92400e' }}>📋 Validation Rules Applied:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#92400e', fontSize: '13px' }}>
            <li>Qty Accepted in Raw Material Stage ≥ Qty Accepted in Process Inspection</li>
            <li>Qty Accepted in Process Inspection ≥ Qty Accepted in Final Inspection</li>
            <li>Qty Accepted in Final Inspection ≤ Qty Ordered in PO</li>
            <li>Accepted quantity mapped to any PO must not exceed Raw Material quantity passed for that PO</li>
          </ul>
        </div> */}
      </div>

      {/* Draft Save Feedback Message */}
      {draftSaveMessage.text && (
        <div
          className={`alert ${draftSaveMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}
          style={{
            marginTop: 'var(--space-16)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: draftSaveMessage.type === 'success' ? '#dcfce7' : '#fef2f2',
            border: `1px solid ${draftSaveMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
            borderRadius: '8px',
            color: draftSaveMessage.type === 'success' ? '#166534' : '#991b1b'
          }}
        >
          <span>{draftSaveMessage.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{draftSaveMessage.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="rm-action-buttons" style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '24px' }}>
        <button
          className="btn btn-outline"
          style={{
            minHeight: '44px',
            padding: '10px 20px',
            backgroundColor: isSavingDraft ? '#f3f4f6' : '#fff',
            cursor: isSavingDraft ? 'not-allowed' : 'pointer'
          }}
          onClick={handleSaveDraft}
          disabled={isSavingDraft}
        >
          {isSavingDraft ? '💾 Saving...' : '💾 Save Draft'}
        </button>
        {/* <button
            className="btn btn-outline"
            onClick={handlePauseInspection}
            disabled={isSaving}
          >
            {isSaving ? 'Pausing...' : 'Pause Inspection'}
          </button> */}
        {/* <button
            className="btn btn-outline"
            onClick={handleOpenWithheldModal}
          >
            Withheld Inspection
          </button> */}
        <button
          className="btn btn-outline"
          onClick={handleInspectionCompleted}
          disabled={isSaving}
        >
          Shift Completed
        </button>
        <button
          className="btn btn-primary"
          onClick={handleFinishInspectionClick}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Finish Inspection'}
        </button>
      </div>

      {/* Return button */}
      <div style={{ marginTop: 'var(--space-24)' }}>
        <button className="btn btn-secondary" onClick={onBack}>Return to Landing Page</button>
      </div>

      {/* Withheld Modal */}
      {showWithheldModal && (
        <div className="modal-overlay" onClick={handleCloseWithheldModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Withheld Inspection</h3>
              <button className="modal-close" onClick={handleCloseWithheldModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Reason <span className="required">*</span></label>
                <select
                  className="modal-select"
                  value={withheldReason}
                  onChange={(e) => { setWithheldReason(e.target.value); setWithheldError(''); }}
                >
                  {WITHHELD_REASONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {withheldReason === 'ANY_OTHER' && (
                <div className="modal-field">
                  <label className="modal-label">Remarks <span className="required">*</span></label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Please provide details..."
                    value={withheldRemarks}
                    onChange={(e) => { setWithheldRemarks(e.target.value); setWithheldError(''); }}
                  />
                </div>
              )}

              {withheldError && <div className="modal-error">{withheldError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary modal-actions__btn" onClick={handleCloseWithheldModal} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="btn btn-warning modal-actions__btn" onClick={handleSubmitWithheld} disabled={isSaving}>
                {isSaving ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Call Selection Modal */}
      {showFinishCallSelectionModal && (
        <div className="modal-overlay" onClick={handleCancelFinishModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Select Calls to Finish</h3>
              <button className="modal-close" onClick={handleCancelFinishModal}>×</button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#64748b' }}>
                Select which call numbers you want to finish inspection for:
              </p>

              {callsGroupedByIc.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  <p>No call numbers found in production lines.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {callsGroupedByIc.map((callGroup) => (
                    <div
                      key={callGroup.icNumber}
                      style={{
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: selectedCallsToFinish.includes(callGroup.icNumber) ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleToggleCallSelection(callGroup.icNumber)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedCallsToFinish.includes(callGroup.icNumber)}
                          onChange={() => handleToggleCallSelection(callGroup.icNumber)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                            {callGroup.icNumber}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Lines: {callGroup.lines.join(', ')}
                            {callGroup.poNumber && ` • PO: ${callGroup.poNumber}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCallsToFinish.length === 0 && callsGroupedByIc.length > 0 && (
                <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px', fontSize: '12px', color: '#92400e' }}>
                  ⚠️ Please select at least one call to finish
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary modal-actions__btn"
                onClick={handleCancelFinishModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary modal-actions__btn"
                onClick={handleFinishSelectedCalls}
                disabled={isSaving || selectedCallsToFinish.length === 0}
              >
                {isSaving ? 'Processing...' : `Finish Selected (${selectedCallsToFinish.length})`}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Initiation Form Modal */}
      {showInitiationForm && selectedNewCall && (
        <div className="modal-overlay" onClick={() => setShowInitiationForm(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Process Material Inspection Initiation - {selectedNewCall}</h3>
              <button className="modal-close" onClick={() => setShowInitiationForm(false)}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '0' }}>
              {isLoadingInitiationData ? (
                <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', margin: '20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                  <p style={{ color: '#64748b', marginBottom: '8px', fontSize: '16px' }}>
                    Loading initiation data...
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Please wait while we fetch the details for {selectedNewCall}
                  </p>
                </div>
              ) : selectedNewCallData ? (
                <div style={{ padding: '20px' }}>
                  <p style={{ marginBottom: '16px', color: '#64748b' }}>
                    Initiation form for call number: <strong>{selectedNewCall}</strong>
                  </p>

                  {/* Render the full initiation form */}
                  <InspectionInitiationFormContent
                    call={{
                      workflowTransitionId: selectedNewCallTransitionId || selectedNewCall,
                      id: selectedNewCallTransitionId || selectedNewCall,
                      call_no: selectedNewCall,
                      po_no: selectedNewCallData.poNo,
                      po_date: selectedNewCallData.poDate,
                      po_qty: selectedNewCallData.poQty,
                      call_qty: selectedNewCallData.callQty || selectedNewCallData.poQty,
                      product_type: 'ERC Process',
                      rm_ic_number: selectedNewCallData.rmIcNumber,
                      vendor_name: selectedNewCallData.vendorName,
                      vendor_code: selectedNewCallData.vendorCode,
                      consignee: selectedNewCallData.consignee,
                      place_of_inspection: selectedNewCallData.placeOfInspection,
                      remarks: selectedNewCallData.remarks,
                      call_date: selectedNewCallData.callDate,
                      desired_inspection_date: selectedNewCallData.desiredInspectionDate,
                      requested_date: selectedNewCallData.callDate || selectedNewCallData.desiredInspectionDate,
                      erc_type: selectedNewCallData.typeOfErc,
                      heat_number: selectedNewCallData.heatNumber,
                      delivery_period: selectedNewCallData.deliveryDate
                    }}
                    formData={newCallFormData}
                    onFormDataChange={handleNewCallFormDataChange}
                    showSectionA={true}
                    showSectionB={true}
                    showSectionC={false}
                  />
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', margin: '20px' }}>
                  <p style={{ color: '#ef4444', marginBottom: '8px' }}>
                    Failed to load initiation data
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Please close and try again
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInitiationForm(false)}
                disabled={isLoadingInitiationData}
              >
                Back
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => handleOpenNewCallActionModal('WITHHELD')}
                  disabled={isNewCallSaving || isLoadingInitiationData}
                >
                  Withheld Call
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleOpenNewCallActionModal('CANCELLED')}
                  disabled={isNewCallSaving || isLoadingInitiationData}
                >
                  Cancel Call
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleOpenNewCallInitiateModal}
                  disabled={isNewCallSaving || isLoadingInitiationData}
                >
                  Initiate Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withheld/Cancel Call Modal for New Call */}
      {showNewCallActionModal && (
        <div className="modal-overlay" onClick={handleCloseNewCallActionModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {newCallActionType === 'WITHHELD' ? 'Withheld Call' : 'Cancel Call'}
              </h3>
              <button className="modal-close" onClick={handleCloseNewCallActionModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Reason <span className="required">*</span></label>
                <select
                  className="modal-select"
                  value={newCallActionReason}
                  onChange={(e) => { setNewCallActionReason(e.target.value); setNewCallActionError(''); }}
                >
                  {CALL_ACTION_REASONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {newCallActionReason === 'ANY_OTHER' && (
                <div className="modal-field">
                  <label className="modal-label">Remarks <span className="required">*</span></label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Please provide details..."
                    value={newCallActionRemarks}
                    onChange={(e) => { setNewCallActionRemarks(e.target.value); setNewCallActionError(''); }}
                  />
                </div>
              )}

              {newCallActionError && <div className="modal-error">{newCallActionError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary modal-actions__btn" onClick={handleCloseNewCallActionModal} disabled={isNewCallSaving}>
                Cancel
              </button>
              <button type="button" className={`${newCallActionType === 'WITHHELD' ? 'btn btn-warning' : 'btn btn-danger'} modal-actions__btn`} onClick={handleSubmitNewCallAction} disabled={isNewCallSaving}>
                {isNewCallSaving ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Modals */}
      <AddNewCallModal
        isOpen={showAddCallModal}
        onClose={() => setShowAddCallModal(false)}
        availableCalls={availableCallNumbersForModal}
        onStart={(row) => handleSelectNewCall(row.call_no)}
        onResume={(row, isResume) => {
          if (isResume) {
            // "RESUME" action for active calls - add directly to dashboard without modal
            console.log(`⏩ [Process Dashboard] Direct RESUME for call ${row.call_no} (skipping modal)`);
            handleSelectNewCall(row.call_no, true, row);
            setShowAddCallModal(false);
            showNotification('success', `Call ${row.call_no} has been resumed!`);
          } else {
            // "ENTER SHIFT DETAILS" action for paused calls - show shift details modal
            setResumeCallData(row);
            setIsResumeFlow(isResume);
            setShowResumeCallModal(true);
          }
        }}
        onWithheld={(row) => {
          setSelectedNewCall(row.call_no);
          handleOpenNewCallActionModal('WITHHELD');
        }}
        onCancel={(row) => {
          setSelectedNewCall(row.call_no);
          handleOpenNewCallActionModal('CANCELLED');
        }}
        onSchedule={(row, isReschedule) => handleOpenScheduleModal(row, isReschedule)}
        onShowInfo={(type) => showNotification('info', `${type} is managed from the Landing Page.`)}
        isLoading={isLoadingProcessCalls}
      />

      {/* Scheduling Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => !isScheduling && setShowScheduleModal(false)}
        title={isReschedule ? `Reschedule Inspection - ${selectedCallForSchedule?.call_no}` : `Schedule Inspection - ${selectedCallForSchedule?.call_no}`}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowScheduleModal(false)}
              disabled={isScheduling}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleScheduleSubmit}
              disabled={isScheduling}
            >
              {isScheduling ? (isReschedule ? 'Rescheduling...' : 'Scheduling...') : (isReschedule ? 'Reschedule' : 'Schedule')}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Show previous schedule info when rescheduling */}
          {isReschedule && previousSchedule && (
            <div style={{
              padding: '12px',
              background: '#fff8e1',
              borderRadius: '8px',
              border: '1px solid #ffcc02',
              fontSize: '14px'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#b8860b' }}>
                Previous Schedule Details
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Scheduled Date: </span>
                  <span style={{ fontWeight: '500' }}>
                    {previousSchedule.scheduleDate ? new Date(previousSchedule.scheduleDate).toLocaleDateString('en-IN') : '-'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Previous Remark: </span>
                  <span style={{ fontWeight: '500' }}>{previousSchedule.reason || '-'}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '500', color: '#1e293b' }}>
              {isReschedule ? 'New Schedule Date' : 'Schedule Date'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              style={{
                padding: '10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                width: '100%'
              }}
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              disabled={isScheduling}
              min={selectedCallForSchedule?.desired_inspection_date || ''}
            />
            {selectedCallForSchedule?.desired_inspection_date && (
              <small style={{ color: '#64748b' }}>
                Minimum Date: {new Date(selectedCallForSchedule.desired_inspection_date).toLocaleDateString('en-IN')} (Desired Inspection Date)
              </small>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '500', color: '#1e293b' }}>
              {isReschedule ? 'Reason for Reschedule' : 'Remarks'}
            </label>
            <textarea
              style={{
                padding: '10px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '14px',
                width: '100%',
                minHeight: '100px',
                resize: 'vertical'
              }}
              value={scheduleRemarks}
              onChange={(e) => setScheduleRemarks(e.target.value)}
              placeholder={isReschedule ? "Enter reason for rescheduling..." : "Enter remarks for scheduling..."}
              disabled={isScheduling}
            />
          </div>
        </div>
      </Modal>

      <ResumeCallModal
        isOpen={showResumeCallModal}
        onClose={() => setShowResumeCallModal(false)}
        call={resumeCallData}
        onConfirm={async ({ shift, date }) => {
          setIsResumingCall(true);
          try {
            // Store shift/date in session storage as the dashboard expects
            sessionStorage.setItem('processShift', shift);
            sessionStorage.setItem('inspectionShift', shift);
            sessionStorage.setItem('inspectionDate', date);
            sessionStorage.setItem('shiftCode', (shift || 'A').charAt(0).toUpperCase());

            // Handle workflow transition if this is "ENTER SHIFT DETAILS" (isResumeFlow === false)
            if (!isResumeFlow) {
              console.log('🔄 ENTER SHIFT DETAILS flow - performing workflow transition');

              const currentUser = getStoredUser();
              const userId = currentUser?.userId || 0;

              // Fetch latest transition ID
              let transitionId = resumeCallData?.workflowTransitionId || resumeCallData?.id;
              try {
                const latestTransition = await fetchLatestWorkflowTransition(resumeCallData.call_no);
                if (latestTransition && latestTransition.workflowTransitionId) {
                  transitionId = latestTransition.workflowTransitionId;
                }
              } catch (err) {
                console.warn('Failed to fetch latest transition, using current:', err);
              }

              const action = resumeCallData?.status === 'INSPECTION_PAUSED'
                ? 'INSPECTION_PAUSED'
                : 'ENTER_SHIFT_DETAILS_AND_START_INSPECTION';

              const workflowActionData = {
                workflowTransitionId: transitionId,
                requestId: resumeCallData.call_no,
                action: action,
                remarks: `Shift details entered - Shift: ${shift}, Date: ${date}`,
                actionBy: userId,
                pincode: resumeCallData.pincode || '560001',
                materialAvailable: 'YES',
                shiftCode: (shift || 'A').charAt(0).toUpperCase()
              };

              await performTransitionAction(workflowActionData);
              console.log('✅ Workflow transition successful');
            } else {
              console.log('⏭️ RESUME flow - skipping workflow transition');
            }

            // Add the call to production lines
            await handleSelectNewCall(resumeCallData.call_no, true, resumeCallData); // Pass row data to skip fetch

            setShowResumeCallModal(false);
            setShowAddCallModal(false);
            showNotification('success', `Call ${resumeCallData.call_no} has been ${isResumeFlow ? 'resumed' : 'initiated'}!`);
          } catch (error) {
            console.error('Error in onResumeConfirm:', error);
            showNotification('error', `Failed to ${isResumeFlow ? 'resume' : 'initiate'} call: ` + (error.message || 'Unknown error'));
          } finally {
            setIsResumingCall(false);
          }
        }}
        isSubmitting={isResumingCall}
        isResume={isResumeFlow}
        initialShift={sessionStorage.getItem('inspectionShift') || ''}
        isShiftReadOnly={!isResumeFlow} // Shift is readonly for ENTER SHIFT DETAILS (paused calls)
      />

      {/* Initiate Inspection Modal for New Call */}
      {showNewCallInitiateModal && (
        <div className="modal-overlay" onClick={handleCloseNewCallInitiateModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Initiate Inspection</h3>
              <button className="modal-close" onClick={handleCloseNewCallInitiateModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Shift of Inspection <span className="required">*</span></label>
                <select
                  className="modal-select"
                  value={newCallShift}
                  onChange={(e) => {
                    setNewCallShift(e.target.value);
                    setNewCallInitiateError('');
                  }}
                  disabled={true}
                  style={{
                    backgroundColor: '#f1f5f9',
                    cursor: 'not-allowed',
                    opacity: 0.7
                  }}
                >
                  <option value="">Select Shift</option>
                  <option value="A">Shift A (6 AM - 2 PM)</option>
                  <option value="B">Shift B (2 PM - 10 PM)</option>
                  <option value="C">Shift C (10 PM - 6 AM)</option>
                  <option value="General">General Shift (9 AM - 5 PM)</option>
                </select>
              </div>

              <div className="modal-field">
                <label className="modal-label">Date of Inspection <span className="required">*</span></label>
                <input
                  type="date"
                  className="modal-input"
                  value={newCallDate}
                  onChange={(e) => {
                    setNewCallDate(e.target.value);
                    setNewCallInitiateError('');
                  }}
                />
              </div>

              {newCallInitiateError && <div className="modal-error">{newCallInitiateError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary modal-actions__btn" onClick={handleCloseNewCallInitiateModal} disabled={isNewCallSaving}>
                Cancel
              </button>
              <button type="button" className="btn btn-success modal-actions__btn" onClick={handleSubmitNewCallInitiation} disabled={isNewCallSaving}>
                {isNewCallSaving ? 'Initiating...' : 'Initiate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessDashboard;


