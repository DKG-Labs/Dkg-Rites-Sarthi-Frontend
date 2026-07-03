import { getBaseUrl, API_ENDPOINTS } from './apiConfig';

export const fetchInspectionCallSummary = async (callNo) => {
  try {
    let url = `${getBaseUrl()}${API_ENDPOINTS.RAILPAD_INSPECTION_CALL.GET_SUMMARY}/${encodeURIComponent(callNo)}`;
    
    // For Railpad Process calls, use the new process summary API
    if (callNo && callNo.startsWith('RPP-')) {
      url = `${getBaseUrl()}/rail-inspection-call/process/summary/${encodeURIComponent(callNo)}`;
    }
    
    const response = await fetch(url);
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
