import { getBaseUrl, getDefaultHeaders } from './apiConfig';

/**
 * Fetch all captured images for a specific inspection call.
 * @param {string} callNo 
 * @param {string} typeOfCall e.g. 'RAILPAD_PROCESS' or 'RAILPAD_FINAL'
 * @returns {Promise<Array>} List of ImageCaptureDto
 */
export const fetchCallImages = async (callNo, typeOfCall = 'RAILPAD') => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = getDefaultHeaders(token);
    const url = `${getBaseUrl()}/images/call/${encodeURIComponent(callNo)}${typeOfCall ? `?typeOfCall=${encodeURIComponent(typeOfCall)}` : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`Failed to fetch images for call ${callNo}: status ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in fetchCallImages:', error);
    return [];
  }
};

/**
 * Save / upload captured images for a specific inspection call.
 * @param {string} callNo 
 * @param {Object} payload { typeOfCall, capturedImages, shift, dateOfInspection, userId }
 * @returns {Promise<Object>}
 */
export const saveCallImages = async (callNo, payload) => {
  try {
    const token = localStorage.getItem('authToken');
    const headers = getDefaultHeaders(token);
    const url = `${getBaseUrl()}/images/call/${encodeURIComponent(callNo)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Failed to save images: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error in saveCallImages:', error);
    throw error;
  }
};
