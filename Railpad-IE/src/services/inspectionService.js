import { getBaseUrl, API_ENDPOINTS } from './apiConfig';

export const fetchInspectionCallSummary = async (callNo) => {
  try {
    const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_INSPECTION_CALL.GET_SUMMARY}/${encodeURIComponent(callNo)}`);
    const data = await response.json();
    if (data.responseStatus?.statusCode === 0) {
      return data.responseData;
    }
    throw new Error(data.responseStatus?.message || 'Failed to fetch summary');
  } catch (error) {
    console.error('Error fetching inspection call summary:', error);
    throw error;
  }
};

export const fetchInspectionCallById = async (id) => {
  try {
    const response = await fetch(`${getBaseUrl()}/rail-inspection-call/${id}`);
    const data = await response.json();
    if (data.responseStatus?.statusCode === 0) {
      return data.responseData;
    }
    throw new Error(data.responseStatus?.message || 'Failed to fetch call details');
  } catch (error) {
    console.error('Error fetching inspection call details:', error);
    throw error;
  }
};

export const fetchInspectionCallByCallNo = async (callNo) => {
  try {
    const response = await fetch(`${getBaseUrl()}/rail-inspection-call/callNo/${encodeURIComponent(callNo)}`);
    const data = await response.json();
    if (data.responseStatus?.statusCode === 0) {
      return data.responseData;
    }
    throw new Error(data.responseStatus?.message || 'Failed to fetch call details');
  } catch (error) {
    console.error('Error fetching inspection call details:', error);
    throw error;
  }
};
