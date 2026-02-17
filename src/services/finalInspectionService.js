import { getAuthToken } from './authService';
import { API_ENDPOINTS } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.FINAL_MATERIAL;

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Create a Final Inspection Call
 * POST /api/final-material/inspectionCall
 * @param {Object} payload - { inspectionCall, finalInspectionDetails, finalLotDetails }
 */
export const createFinalInspectionCall = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/inspectionCall`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.responseStatus?.message || 'Failed to create final inspection call');
  }

  const data = await response.json();
  return data.responseData || data;
};

/**
 * Get final inspection composite data by call number
 * GET /api/final-material/inspection/{callNo}
 * @param {string} callNo
 */
export const getFinalInspectionByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/inspection/${encodeURIComponent(callNo)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    // return null to allow graceful fallback
    return null;
  }

  const data = await response.json().catch(() => ({}));
  return data.responseData || data;
};

/**
 * (Optional) Helper to test schedule/reschedule/start flows for Final calls:
 * - Scheduling uses the shared `scheduleService` (/api/inspection-schedule)
 * - Starting uses `performTransitionAction` from `workflowService`
 * This file focuses on Final-specific creation and any future final endpoints.
 */

const finalInspectionService = {
  createFinalInspectionCall,
  getFinalInspectionByCallNo,
};

export default finalInspectionService;
