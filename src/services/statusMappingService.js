/**
 * Status Mapping Service
 * Maps workflow API status to display status for UI
 * Does NOT modify the actual API status - only transforms for display
 */

/**
 * API Status Constants (from workflow API)
 */
export const API_STATUS = {
  CALL_REGISTERED: 'CALL_REGISTERED',
  IE_SCHEDULED: 'IE_SCHEDULED',
  VERIFY_PO_DETAILS: 'VERIFY_PO_DETAILS',
  INSPECTION_COMPLETED: 'INSPECTION_COMPLETED',
  // Add other API statuses as needed
};

/**
 * Display Status Constants (for UI)
 */
export const DISPLAY_STATUS = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  UNDER_INSPECTION: 'Under Inspection',
  COMPLETED: 'Completed',
  // Add other display statuses as needed
};

/**
 * Action Button Constants
 */
export const ACTIONS = {
  SCHEDULE: 'SCHEDULE',
  START: 'START',
  RESCHEDULE: 'RESCHEDULE',
  RESUME: 'RESUME',
  PAUSE: 'PAUSE',
  WITHHOLD: 'WITHHOLD',
  COMPLETE: 'COMPLETE',
};

/**
 * Map API status to display status
 * @param {string} apiStatus - Status from workflow API
 * @returns {string} Display status for UI
 */
export const mapApiStatusToDisplay = (apiStatus) => {
  const statusMap = {
    [API_STATUS.CALL_REGISTERED]: DISPLAY_STATUS.PENDING,
    [API_STATUS.IE_SCHEDULED]: DISPLAY_STATUS.SCHEDULED,
    [API_STATUS.VERIFY_PO_DETAILS]: DISPLAY_STATUS.UNDER_INSPECTION,
    [API_STATUS.INSPECTION_COMPLETED]: DISPLAY_STATUS.COMPLETED,
  };

  return statusMap[apiStatus] || apiStatus; // Return original if no mapping found
};

/**
 * Get available actions based on API status
 * @param {string} apiStatus - Status from workflow API
 * @returns {Array<string>} List of available actions
 */
export const getAvailableActions = (apiStatus) => {
  const actionMap = {
    [API_STATUS.CALL_REGISTERED]: [ACTIONS.SCHEDULE],
    [API_STATUS.IE_SCHEDULED]: [ACTIONS.START, ACTIONS.RESCHEDULE],
    [API_STATUS.VERIFY_PO_DETAILS]: [ACTIONS.RESUME, ACTIONS.RESCHEDULE],
    [API_STATUS.INSPECTION_COMPLETED]: [], // No actions for completed
  };

  return actionMap[apiStatus] || [];
};

/**
 * Check if a call can be scheduled
 * @param {string} apiStatus - Status from workflow API
 * @returns {boolean}
 */
export const canSchedule = (apiStatus) => {
  return apiStatus === API_STATUS.CALL_REGISTERED;
};

/**
 * Check if a call can be started
 * @param {string} apiStatus - Status from workflow API
 * @returns {boolean}
 */
export const canStart = (apiStatus) => {
  return apiStatus === API_STATUS.IE_SCHEDULED;
};

/**
 * Check if a call can be resumed
 * @param {string} apiStatus - Status from workflow API
 * @returns {boolean}
 */
export const canResume = (apiStatus) => {
  return apiStatus === API_STATUS.VERIFY_PO_DETAILS;
};

/**
 * Check if a call can be rescheduled
 * @param {string} apiStatus - Status from workflow API
 * @returns {boolean}
 */
export const canReschedule = (apiStatus) => {
  return apiStatus === API_STATUS.IE_SCHEDULED || apiStatus === API_STATUS.VERIFY_PO_DETAILS;
};

/**
 * Get status badge color based on display status
 * @param {string} displayStatus - Display status
 * @returns {string} Badge color class
 */
export const getStatusBadgeColor = (displayStatus) => {
  const colorMap = {
    [DISPLAY_STATUS.PENDING]: 'warning',
    [DISPLAY_STATUS.SCHEDULED]: 'info',
    [DISPLAY_STATUS.UNDER_INSPECTION]: 'primary',
    [DISPLAY_STATUS.COMPLETED]: 'success',
  };

  return colorMap[displayStatus] || 'secondary';
};

/**
 * Transform call data with display status
 * @param {Object} call - Call object from API
 * @returns {Object} Call object with display status
 */
export const transformCallWithDisplayStatus = (call) => {
  const apiStatus = call.status;
  const displayStatus = mapApiStatusToDisplay(apiStatus);
  const availableActions = getAvailableActions(apiStatus);

  return {
    ...call,
    apiStatus, // Keep original API status
    displayStatus, // Add display status
    availableActions, // Add available actions
  };
};

