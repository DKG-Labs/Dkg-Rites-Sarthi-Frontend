/**
 * Service for managing call status in localStorage
 * Tracks the local status of inspection calls independent of API status
 */

const CALL_STATUS_KEY = 'call_status_';

/**
 * Call Status Constants
 */
export const CALL_STATUS = {
  PENDING: 'PENDING',           // Initial status when call is fetched from API
  SCHEDULED: 'SCHEDULED',       // After scheduling
  UNDER_INSPECTION: 'UNDER_INSPECTION', // After initiation or resume
  WITHHELD: 'WITHHELD',        // After withholding
  PAUSED: 'PAUSED',            // After pause (same as UNDER_INSPECTION for display)
  COMPLETED: 'COMPLETED'        // After completion
};

/**
 * Get the storage key for a call
 */
const getStorageKey = (callNo) => `${CALL_STATUS_KEY}${callNo}`;

/**
 * Get the current status of a call
 * @param {string} callNo - Call number
 * @returns {string} - Current status or PENDING if not found
 */
export const getCallStatus = (callNo) => {
  try {
    const stored = localStorage.getItem(getStorageKey(callNo));
    if (stored) {
      const data = JSON.parse(stored);
      return data.status || CALL_STATUS.PENDING;
    }
  } catch (e) {
    console.error('Error reading call status:', e);
  }
  return CALL_STATUS.PENDING;
};

/**
 * Get the full status data of a call (including metadata)
 * @param {string} callNo - Call number
 * @returns {Object|null} - Full status data or null if not found
 */
export const getCallStatusData = (callNo) => {
  try {
    const stored = localStorage.getItem(getStorageKey(callNo));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading call status data:', e);
  }
  return null;
};

/**
 * Set the status of a call
 * @param {string} callNo - Call number
 * @param {string} status - New status
 * @param {Object} metadata - Additional metadata (optional)
 */
export const setCallStatus = (callNo, status, metadata = {}) => {
  try {
    const data = {
      callNo,
      status,
      updatedAt: new Date().toISOString(),
      ...metadata
    };
    localStorage.setItem(getStorageKey(callNo), JSON.stringify(data));
  } catch (e) {
    console.error('Error saving call status:', e);
  }
};

/**
 * Mark a call as scheduled
 * @param {string} callNo - Call number
 * @param {string} scheduledDate - Scheduled date
 */
export const markAsScheduled = (callNo, scheduledDate) => {
  setCallStatus(callNo, CALL_STATUS.SCHEDULED, { scheduledDate });
};

/**
 * Mark a call as under inspection (initiated or resumed)
 * @param {string} callNo - Call number
 * @param {Object} initiationData - Initiation data (shift, date, etc.)
 */
export const markAsUnderInspection = (callNo, initiationData = {}) => {
  setCallStatus(callNo, CALL_STATUS.UNDER_INSPECTION, { 
    initiatedAt: new Date().toISOString(),
    ...initiationData 
  });
};

/**
 * Mark a call as withheld
 * @param {string} callNo - Call number
 * @param {string} reason - Reason for withholding
 */
export const markAsWithheld = (callNo, reason = '') => {
  setCallStatus(callNo, CALL_STATUS.WITHHELD, { reason });
};

/**
 * Mark a call as paused (displays as UNDER_INSPECTION with Resume action)
 * @param {string} callNo - Call number
 */
export const markAsPaused = (callNo) => {
  setCallStatus(callNo, CALL_STATUS.PAUSED, { 
    pausedAt: new Date().toISOString() 
  });
};

/**
 * Mark a call as completed
 * @param {string} callNo - Call number
 */
export const markAsCompleted = (callNo) => {
  setCallStatus(callNo, CALL_STATUS.COMPLETED, { 
    completedAt: new Date().toISOString() 
  });
};

/**
 * Check if inspection data exists in storage for a call
 * This checks for actual inspection data (shift, date, dashboard data, etc.)
 * @param {string} callNo - Call number
 * @returns {boolean}
 */
const hasInspectionData = (callNo) => {
  // Check sessionStorage for inspection initiation data (call-specific)
  // Newer key used by the Initiation page
  const initiationFormKey = `inspection_initiation_form_${callNo}`;
  const initiationFormData = sessionStorage.getItem(initiationFormKey);
  if (initiationFormData) {
    try {
      const data = JSON.parse(initiationFormData);
      if (data.shiftOfInspection && data.dateOfInspection) {
        return true;
      }
    } catch (e) {
      // Invalid JSON, continue checking
    }
  }

  // Back-compat: older key name that may have been used earlier
  const initiationKey = `inspection_initiation_${callNo}`;
  const initiationData = sessionStorage.getItem(initiationKey);
  if (initiationData) {
    try {
      const data = JSON.parse(initiationData);
      if (data.shiftOfInspection && data.dateOfInspection) {
        return true;
      }
    } catch (e) {
      // Invalid JSON, continue checking
    }
  }

  // NOTE: Do NOT check global sessionStorage 'inspectionShift' and 'inspectionDate'
  // These are shared across calls and will cause false positives
  // Only check call-specific keys above

  // Check localStorage for dashboard draft data
  const dashboardDraftKey = `process_dashboard_draft_${callNo}`;
  if (localStorage.getItem(dashboardDraftKey)) {
    return true;
  }

  // Check localStorage for raw material inspection data
  const rmMainKey = `rm_main_inspection_${callNo}`;
  if (localStorage.getItem(rmMainKey)) {
    return true;
  }

  // Check for actual process inspection data with shift and date
  // Only return true if we have meaningful inspection data, not just empty keys
  const processKeys = Object.keys(localStorage).filter(key =>
    key.startsWith('process_inspection_') && key.includes(callNo)
  );
  if (processKeys.length > 0) {
    // Check if any of these keys contain actual inspection data with shift and date
    for (const key of processKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data.shiftOfInspection && data.dateOfInspection) {
          return true;
        }
      } catch (e) {
        // Invalid JSON, continue checking
      }
    }
  }

  return false;
};

/**
 * Check if a call has been initiated (has shift and date entered or has inspection data)
 * @param {string} callNo - Call number
 * @returns {boolean}
 */
export const isCallInitiated = (callNo) => {
  // First check if there's actual inspection data
  if (hasInspectionData(callNo)) {
    return true;
  }

  // Fallback to status check
  const status = getCallStatus(callNo);
  return status === CALL_STATUS.UNDER_INSPECTION || status === CALL_STATUS.PAUSED;
};

/**
 * Check if a call is paused
 * @param {string} callNo - Call number
 * @returns {boolean}
 */
export const isCallPaused = (callNo) => {
  const status = getCallStatus(callNo);
  return status === CALL_STATUS.PAUSED;
};

/**
 * Get display status for UI
 * @param {string} callNo - Call number
 * @param {boolean} isScheduled - Whether the call is scheduled
 * @returns {string} - Display status
 */
export const getDisplayStatus = (callNo, isScheduled) => {
  const localStatus = getCallStatus(callNo);

  // Priority order: WITHHELD > PAUSED > UNDER_INSPECTION (with data) > SCHEDULED > PENDING
  if (localStatus === CALL_STATUS.WITHHELD) {
    return CALL_STATUS.WITHHELD;
  }

  if (localStatus === CALL_STATUS.PAUSED) {
    return CALL_STATUS.PAUSED;
  }

  // Check if there's actual inspection data
  if (hasInspectionData(callNo)) {
    return CALL_STATUS.UNDER_INSPECTION;
  }

  if (localStatus === CALL_STATUS.UNDER_INSPECTION) {
    return CALL_STATUS.UNDER_INSPECTION;
  }

  if (isScheduled) {
    return CALL_STATUS.SCHEDULED;
  }

  return CALL_STATUS.PENDING;
};

/**
 * Clear status for a call (useful for testing or reset)
 * @param {string} callNo - Call number
 */
export const clearCallStatus = (callNo) => {
  try {
    localStorage.removeItem(getStorageKey(callNo));
    console.log(`✅ Cleared status for call: ${callNo}`);
  } catch (e) {
    console.error('Error clearing call status:', e);
  }
};

/**
 * Debug: Log all call statuses in localStorage
 */
export const debugLogAllCallStatuses = () => {
  console.log('=== ALL CALL STATUSES IN LOCALSTORAGE ===');
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CALL_STATUS_KEY)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`${key}:`, data);
      } catch (e) {
        console.log(`${key}: (invalid JSON)`);
      }
    }
  });
  console.log('=========================================');
};

