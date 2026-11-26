/**
 * Status Mapper Utility
 * Maps API status values to display labels and determines available actions
 * 
 * This is a PRESENTATION LAYER utility - it does NOT modify the actual status
 * from the API response. It only maps status for display purposes.
 */

/**
 * API Status Constants (from workflow API)
 */
export const API_STATUS = {
  CALL_REGISTERED: 'CALL_REGISTERED',
  IE_SCHEDULED: 'IE_SCHEDULED',
  SCHEDULED: 'SCHEDULED',
  VERIFY_PO_DETAILS: 'VERIFY_PO_DETAILS',
  ENTER_SHIFT_DETAILS_AND_START_INSPECTION: 'ENTER_SHIFT_DETAILS_AND_START_INSPECTION',
  PAUSE_INSPECTION_RESUME_NEXT_DAY: 'PAUSE_INSPECTION_RESUME_NEXT_DAY',
  INSPECTION_PAUSED: 'INSPECTION_PAUSED',
  // Add more statuses as needed
};

/**
 * Display Status Labels
 */
export const DISPLAY_STATUS = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  UNDER_INSPECTION: 'Under Inspection',
  INSPECTION_PAUSED: 'Inspection Paused',
  // Add more display labels as needed
};

/**
 * Map API status to display label
 * @param {string} apiStatus - Status from API response
 * @returns {string} Display label for UI
 */
export const getDisplayStatus = (apiStatus) => {
  const statusMap = {
    [API_STATUS.CALL_REGISTERED]: DISPLAY_STATUS.PENDING,
    [API_STATUS.IE_SCHEDULED]: DISPLAY_STATUS.SCHEDULED,
    [API_STATUS.SCHEDULED]: DISPLAY_STATUS.SCHEDULED,
    [API_STATUS.VERIFY_PO_DETAILS]: DISPLAY_STATUS.PENDING,
    [API_STATUS.ENTER_SHIFT_DETAILS_AND_START_INSPECTION]: DISPLAY_STATUS.UNDER_INSPECTION,
    [API_STATUS.PAUSE_INSPECTION_RESUME_NEXT_DAY]: DISPLAY_STATUS.INSPECTION_PAUSED,
    [API_STATUS.INSPECTION_PAUSED]: DISPLAY_STATUS.INSPECTION_PAUSED,
  };

  const displayStatus = statusMap[apiStatus] || apiStatus;

  return displayStatus; // Fallback to original status if not mapped
};

/**
 * Get available actions for a given API status
 * @param {string} apiStatus - Status from API response
 * @returns {Array<string>} List of available actions
 */
export const getAvailableActions = (apiStatus) => {
  const actionMap = {
    [API_STATUS.CALL_REGISTERED]: ['schedule'],
    [API_STATUS.IE_SCHEDULED]: ['start', 'reschedule'],
    [API_STATUS.SCHEDULED]: ['start', 'reschedule'],
    [API_STATUS.VERIFY_PO_DETAILS]: ['resume', 'reschedule'],
    [API_STATUS.ENTER_SHIFT_DETAILS_AND_START_INSPECTION]: ['resume', 'reschedule'],
    [API_STATUS.PAUSE_INSPECTION_RESUME_NEXT_DAY]: ['enterShiftDetails'],
    [API_STATUS.INSPECTION_PAUSED]: ['enterShiftDetails'],
  };

  return actionMap[apiStatus] || [];
};

/**
 * Check if schedule date should be displayed for this status
 * @param {string} apiStatus - Status from API response
 * @returns {boolean} True if schedule date should be shown
 */
export const shouldShowScheduleDate = (apiStatus) => {
  // Show schedule date for IE_SCHEDULED, SCHEDULED, VERIFY_PO_DETAILS (Under Inspection)
  // PAUSE_INSPECTION_RESUME_NEXT_DAY (Paused inspection), and INSPECTION_PAUSED
  // because the call was scheduled before inspection started
  return apiStatus === API_STATUS.IE_SCHEDULED ||
    apiStatus === API_STATUS.SCHEDULED ||
    apiStatus === API_STATUS.VERIFY_PO_DETAILS ||
    apiStatus === API_STATUS.PAUSE_INSPECTION_RESUME_NEXT_DAY ||
    apiStatus === API_STATUS.INSPECTION_PAUSED;
};

/**
 * Get status badge color/variant for UI
 * @param {string} apiStatus - Status from API response
 * @returns {string} Color variant for badge/chip
 */
export const getStatusVariant = (apiStatus) => {
  const variantMap = {
    [API_STATUS.CALL_REGISTERED]: 'warning', // Yellow/Orange for pending
    [API_STATUS.IE_SCHEDULED]: 'info',       // Blue for scheduled
    [API_STATUS.SCHEDULED]: 'info',          // Blue for scheduled
    [API_STATUS.VERIFY_PO_DETAILS]: 'info',  // Blue for scheduled
    [API_STATUS.ENTER_SHIFT_DETAILS_AND_START_INSPECTION]: 'success', // Green for under inspection
    [API_STATUS.PAUSE_INSPECTION_RESUME_NEXT_DAY]: 'warning', // Orange for paused
    [API_STATUS.INSPECTION_PAUSED]: 'warning', // Orange for paused
  };

  return variantMap[apiStatus] || 'default';
};

const DETAILED_STATUS_MAPPING = {
  // Pending Verification & Routing
  'CREATED': { mainStatus: 'Pending', subStatus: 'Call Raised' },
  'RESUBMIT': { mainStatus: 'Pending', subStatus: 'Resubmitted' },
  'RESUBMITTED': { mainStatus: 'Pending', subStatus: 'Resubmitted' },
  'RETURNED': { mainStatus: 'Pending', subStatus: 'Returned to Vendor' },
  'RETURN_TO_VENDOR': { mainStatus: 'Pending', subStatus: 'Returned to Vendor' },
  'RETURNED_BY_CALL_DESK': { mainStatus: 'Pending', subStatus: 'Returned to Vendor' },
  'ROUTED_CORRECTION': { mainStatus: 'Pending', subStatus: 'Returned by IE for Correction' },
  'FIX_ROUTING': { mainStatus: 'Pending', subStatus: 'Rerouted to RIO' },
  'REROUTE': { mainStatus: 'Pending', subStatus: 'Rerouted to RIO' },
  'REROUTED': { mainStatus: 'Pending', subStatus: 'Rerouted to RIO' },
  'REQUEST_CORRECTION_TO_CM': { mainStatus: 'Pending', subStatus: 'Correction Requested to CM' },

  // Verified, Registered & Scheduled
  'VERIFIED': { mainStatus: 'Pending', subStatus: 'Call Registered' },
  'CALL_REGISTERED': { mainStatus: 'Pending', subStatus: 'Call Registered' },
  'RIO_VERIFIED': { mainStatus: 'Pending', subStatus: 'Call Registered' },
  'VERIFY': { mainStatus: 'Pending', subStatus: 'Call Registered' },
  'AUTO_REGISTER': { mainStatus: 'Pending', subStatus: 'Call Registered' },
  'ASSIGNED_TO_IE': { mainStatus: 'Pending', subStatus: 'IE Assigned' },
  'IE_SCHEDULED': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
  'SCHEDULED': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
  'SCHEDULE': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
  'SCHEDULE_CALL': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
  'MAIN_IE_SCHEDULE_CALL': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
  'IE_SCHEDULE_CALL': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
  'RESCHEDULE': { mainStatus: 'Pending', subStatus: 'Call Rescheduled' },
  'RESCHEDULED': { mainStatus: 'Pending', subStatus: 'Call Rescheduled' },
  'RESCHEDULE_CALL': { mainStatus: 'Pending', subStatus: 'Call Rescheduled' },

  // Under Inspection
  'INITIATE_INSPECTION': { mainStatus: 'Under Inspection', subStatus: 'Call Initiated' },
  'INITIATE_CALL': { mainStatus: 'Under Inspection', subStatus: 'Call Initiated' },
  'INITIATED': { mainStatus: 'Under Inspection', subStatus: 'Call Initiated' },
  'VERIFY_PO_DETAILS': { mainStatus: 'Under Inspection', subStatus: 'PO Verification' },
  'PO_VERIFICATION': { mainStatus: 'Under Inspection', subStatus: 'PO Verification' },
  'ENTER_SHIFT_DETAILS_AND_START_INSPECTION': { mainStatus: 'Under Inspection', subStatus: 'In Progress' },
  'ENTER_SHIFT_DETAILS': { mainStatus: 'Under Inspection', subStatus: 'In Progress' },
  'VERIFY_MATERIAL_AVAILABILITY': { mainStatus: 'Under Inspection', subStatus: 'Material Verification' },
  'ENTRY_INSPECTION_RESULTS': { mainStatus: 'Under Inspection', subStatus: 'Result Entry' },
  'UNDER_INSPECTION': { mainStatus: 'Under Inspection', subStatus: 'In Progress' },
  'UNDER INSPECTION': { mainStatus: 'Under Inspection', subStatus: 'In Progress' },
  'IN_PROGRESS': { mainStatus: 'Under Inspection', subStatus: 'In Progress' },
  'IN PROGRESS': { mainStatus: 'Under Inspection', subStatus: 'In Progress' },
  'PAUSE_INSPECTION_RESUME_NEXT_DAY': { mainStatus: 'Under Inspection', subStatus: 'Paused for Next Schedule' },
  'INSPECTION_PAUSED': { mainStatus: 'Under Inspection', subStatus: 'Paused for Next Schedule' },
  'PAUSE': { mainStatus: 'Under Inspection', subStatus: 'Paused for Next Schedule' },
  'PAUSED': { mainStatus: 'Under Inspection', subStatus: 'Paused for Next Schedule' },
  'RESUME': { mainStatus: 'Under Inspection', subStatus: 'Inspection Resumed' },
  'CM_RETURN_TO_IE': { mainStatus: 'Under Inspection', subStatus: 'Returned by CM' },
  'RETURNED_BY_CM': { mainStatus: 'Under Inspection', subStatus: 'Returned by CM' },
  'CM_APPROVE_CORRECTION': { mainStatus: 'Under Inspection', subStatus: 'Correction Approved by CM' },
  'CM_REJECT_CORRECTION': { mainStatus: 'Under Inspection', subStatus: 'Correction Rejected by CM' },
  'UNDER_LAB_TESTING': { mainStatus: 'Under Inspection', subStatus: 'Under Lab Testing' },
  'WITHHELD': { mainStatus: 'Under Inspection', subStatus: 'Withheld' },

  // Completed & IC Issuance
  'INSPECTION_COMPLETE_CONFIRM': { mainStatus: 'Completed', subStatus: 'IC Issuance Pending' },
  'FINISH': { mainStatus: 'Completed', subStatus: 'IC Issuance Pending' },
  'INSPECTION_COMPLETED': { mainStatus: 'Completed', subStatus: 'IC Issuance Pending' },
  'IC_PENDING': { mainStatus: 'Completed', subStatus: 'IC Issuance Pending' },
  'GENERATE_IC': { mainStatus: 'Completed', subStatus: 'IC Issued' },
  'IC_GENERATION': { mainStatus: 'Completed', subStatus: 'IC Issued' },
  'GENERATED': { mainStatus: 'Completed', subStatus: 'IC Issued' },
  'IC_ISSUE': { mainStatus: 'Completed', subStatus: 'IC Issued' },
  'ISSUE_IC': { mainStatus: 'Completed', subStatus: 'IC Issued' },
  'ISSUE IC': { mainStatus: 'Completed', subStatus: 'IC Issued' },
  'IC_ISSUED': { mainStatus: 'Completed', subStatus: 'IC Issued' },
  'DSC_SIGN_IC': { mainStatus: 'Completed', subStatus: 'E-Signed' },
  'IC_SIGNED': { mainStatus: 'Completed', subStatus: 'E-Signed' },
  'BILLING_PENDING': { mainStatus: 'Completed', subStatus: 'Billing Pending' },

  // Closed, Blocked, Cancelled, Withdrawn, Rejected
  'SEND_CALL_TO_IBS': { mainStatus: 'Closed', subStatus: 'Sent to IBS' },
  'SENT_TO_IBS': { mainStatus: 'Closed', subStatus: 'Sent to IBS' },
  'CLOSED': { mainStatus: 'Closed', subStatus: 'Sent to IBS' },
  'BLOCKED': { mainStatus: 'Blocked', subStatus: 'Payment Pending' },
  'PAYMENT_PENDING': { mainStatus: 'Blocked', subStatus: 'Payment Pending' },
  'CANCELLED': { mainStatus: 'Cancelled', subStatus: 'Call Cancelled' },
  'CANCEL': { mainStatus: 'Cancelled', subStatus: 'Call Cancelled' },
  'COMPLETED-CANCELLED': { mainStatus: 'Cancelled', subStatus: 'Call Cancelled' },
  'CANCELLED_CHARGEABLE': { mainStatus: 'Cancelled', subStatus: 'Call Cancelled' },
  'CANCELLED_NON_CHARGEABLE': { mainStatus: 'Cancelled', subStatus: 'Call Cancelled' },
  'WITHDRAW': { mainStatus: 'Withdrawn', subStatus: 'Withdrawn by Vendor' },
  'WITHDRAWN': { mainStatus: 'Withdrawn', subStatus: 'Withdrawn by Vendor' },
  'REJECTED': { mainStatus: 'Rejected', subStatus: 'Call Rejected' },
  'REJECTED_CLOSED': { mainStatus: 'Rejected', subStatus: 'Call Rejected' },
};

const GENERIC_WRAPPER_STATUSES = new Set([
  '',
  'PENDING',
  'COMPLETED',
  'IN_PROGRESS',
  'IN PROGRESS',
  'OPEN',
  'ACTIVE',
]);

// Terminal or completion actions that override a stale jobStatus on Sleeper/Railpad rows
const OVERRIDING_ACTIONS = new Set([
  'SEND_CALL_TO_IBS',
  'SENT_TO_IBS',
  'CLOSED',
  'DSC_SIGN_IC',
  'IC_SIGNED',
  'GENERATE_IC',
  'IC_GENERATION',
  'GENERATED',
  'WITHDRAW',
  'WITHDRAWN',
  'CANCEL',
  'CANCELLED',
  'BLOCKED',
  'WITHHELD',
]);

const resolveDetailedMapping = (rawStatus, callDetails) => {
  const actionUpper = (callDetails?.action || callDetails?.latestAction || '').toString().trim().toUpperCase();
  const jobStatusUpper = (callDetails?.jobStatus || '').toString().trim().toUpperCase();
  const nextRoleUpper = (callDetails?.nextRole || callDetails?.nextRoleName || '').toString().trim().toUpperCase();
  const internalStatusLower = (callDetails?.status || '').toString().trim().toLowerCase();
  const hasScheduleDate = Boolean(callDetails?.scheduleDate || callDetails?.scheduledDate);

  // Specific top-level system statuses take priority when non-generic
  if (rawStatus && !GENERIC_WRAPPER_STATUSES.has(rawStatus) && DETAILED_STATUS_MAPPING[rawStatus]) {
    return DETAILED_STATUS_MAPPING[rawStatus];
  }

  // Resolve generic Sleeper/Railpad wrapper statuses ("PENDING", "COMPLETED", etc.) using action & jobStatus
  if (OVERRIDING_ACTIONS.has(actionUpper) && DETAILED_STATUS_MAPPING[actionUpper]) {
    return DETAILED_STATUS_MAPPING[actionUpper];
  }
  if (jobStatusUpper && !GENERIC_WRAPPER_STATUSES.has(jobStatusUpper) && DETAILED_STATUS_MAPPING[jobStatusUpper]) {
    return DETAILED_STATUS_MAPPING[jobStatusUpper];
  }
  if (actionUpper && DETAILED_STATUS_MAPPING[actionUpper]) {
    return DETAILED_STATUS_MAPPING[actionUpper];
  }

  // Fallback inference when action/jobStatus are absent on generic wrapper rows
  if (GENERIC_WRAPPER_STATUSES.has(rawStatus)) {
    if (rawStatus === 'COMPLETED') {
      return DETAILED_STATUS_MAPPING.FINISH;
    }
    if (hasScheduleDate) {
      return DETAILED_STATUS_MAPPING.SCHEDULED;
    }
    if (internalStatusLower === 'fresh_submission') {
      return DETAILED_STATUS_MAPPING.CREATED;
    }
    if (internalStatusLower === 'resubmission') {
      return DETAILED_STATUS_MAPPING.RESUBMITTED;
    }
    if (internalStatusLower === 'returned') {
      return DETAILED_STATUS_MAPPING.RETURNED;
    }
    if (nextRoleUpper.includes('IE')) {
      return DETAILED_STATUS_MAPPING.VERIFIED;
    }
    if (nextRoleUpper.includes('RIO') || nextRoleUpper.includes('CALL DESK') || nextRoleUpper.includes('HELP DESK')) {
      return DETAILED_STATUS_MAPPING.CREATED;
    }
    if (rawStatus === 'PENDING') {
      return { mainStatus: 'Pending', subStatus: 'Call Registered' };
    }
    if (rawStatus === 'IN_PROGRESS' || rawStatus === 'IN PROGRESS') {
      return { mainStatus: 'Under Inspection', subStatus: 'In Progress' };
    }
  }

  // Secondary check if rawStatus was an internal status key like 'scheduled' / 'under_inspection'
  if (rawStatus && DETAILED_STATUS_MAPPING[rawStatus]) {
    return DETAILED_STATUS_MAPPING[rawStatus];
  }

  return { mainStatus: rawStatus || '-', subStatus: '-' };
};

/**
 * Get detailed Main Status and Sub Status based on System Status (API Status) and optional call details.
 * @param {string} systemStatus - Status from API response
 * @param {string} [callNo] - Optional call number (used for context-aware resolution)
 * @param {Object} [callDetails] - Optional call payload/row containing action, jobStatus, scheduleDate, nextRole
 * @returns {Object} { mainStatus: string, subStatus: string, combinedText: string }
 */
export const getDetailedStatus = (systemStatus, callNo = '', callDetails = null) => {
  const rawStatus = (systemStatus || '').toString().trim().toUpperCase();
  const base = resolveDetailedMapping(rawStatus, callDetails);
  const result = { ...base };

  if (!result.subStatus || result.subStatus === '-' || result.subStatus.toLowerCase() === 'none') {
    result.combinedText = result.mainStatus;
  } else if (result.mainStatus.toLowerCase() === result.subStatus.toLowerCase()) {
    result.combinedText = result.mainStatus;
  } else {
    result.combinedText = `${result.mainStatus} - ${result.subStatus}`;
  }

  return result;
};
