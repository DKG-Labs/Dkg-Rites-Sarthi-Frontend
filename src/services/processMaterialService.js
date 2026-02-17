/**
 * Service for Process Material Inspection APIs
 * Handles all 11 submodules: Calibration, Static Check, Oil Tank,
 * Shearing, Turning, MPI, Forging, Quenching, Tempering, Final Check, Summary
 */

import { API_ENDPOINTS } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.PROCESS_MATERIAL;

/**
 * Get auth headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Generic API response handler
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
};

// ==================== Calibration Documents ====================

export const getCalibrationDocuments = async (inspectionCallNo) => {
  const response = await fetch(
    `${API_BASE_URL}/calibration-documents/call/${inspectionCallNo}`,
    { method: 'GET', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const getCalibrationByPoLine = async (inspectionCallNo, poNo, lineNo) => {
  const response = await fetch(
    `${API_BASE_URL}/calibration-documents/call/${inspectionCallNo}/po/${poNo}/line/${lineNo}`,
    { method: 'GET', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const saveCalibrationDocument = async (data) => {
  const response = await fetch(
    `${API_BASE_URL}/calibration-documents`,
    { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }
  );
  return handleResponse(response);
};

export const saveCalibrationDocumentsBatch = async (dataList) => {
  const response = await fetch(
    `${API_BASE_URL}/calibration-documents/batch`,
    { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(dataList) }
  );
  return handleResponse(response);
};

// ==================== Static Periodic Check ====================

export const getStaticPeriodicCheck = async (inspectionCallNo) => {
  const response = await fetch(
    `${API_BASE_URL}/static-periodic-check/call/${inspectionCallNo}`,
    { method: 'GET', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const getStaticCheckByPoLine = async (inspectionCallNo, poNo, lineNo) => {
  const response = await fetch(
    `${API_BASE_URL}/static-periodic-check/call/${inspectionCallNo}/po/${poNo}/line/${lineNo}`,
    { method: 'GET', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const saveStaticPeriodicCheck = async (data) => {
  const response = await fetch(
    `${API_BASE_URL}/static-periodic-check`,
    { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }
  );
  return handleResponse(response);
};

// ==================== Oil Tank Counter ====================

export const getOilTankCounter = async (inspectionCallNo) => {
  const response = await fetch(
    `${API_BASE_URL}/oil-tank-counter/call/${inspectionCallNo}`,
    { method: 'GET', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const getOilTankByPoLine = async (inspectionCallNo, poNo, lineNo) => {
  const response = await fetch(
    `${API_BASE_URL}/oil-tank-counter/call/${inspectionCallNo}/po/${poNo}/line/${lineNo}`,
    { method: 'GET', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const saveOilTankCounter = async (data) => {
  const response = await fetch(
    `${API_BASE_URL}/oil-tank-counter`,
    { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }
  );
  return handleResponse(response);
};

export const incrementOilTankCounter = async (inspectionCallNo, poNo, lineNo) => {
  const response = await fetch(
    `${API_BASE_URL}/oil-tank-counter/call/${inspectionCallNo}/po/${poNo}/line/${lineNo}/increment`,
    { method: 'PUT', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const markOilTankCleaningDone = async (inspectionCallNo, poNo, lineNo) => {
  const response = await fetch(
    `${API_BASE_URL}/oil-tank-counter/call/${inspectionCallNo}/po/${poNo}/line/${lineNo}/cleaning-done`,
    { method: 'PUT', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

// ==================== 8-Hour Grid Data (Factory Pattern) ====================

/**
 * Factory function to create API methods for 8-hour grid modules
 * @param {string} endpoint - API endpoint suffix
 */
const createGridDataService = (endpoint) => ({
  getByCallNo: async (inspectionCallNo) => {
    const response = await fetch(
      `${API_BASE_URL}/${endpoint}/call/${inspectionCallNo}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    return handleResponse(response);
  },

  getByPoLine: async (inspectionCallNo, poNo, lineNo) => {
    const response = await fetch(
      `${API_BASE_URL}/${endpoint}/call/${inspectionCallNo}/po/${poNo}/line/${lineNo}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    return handleResponse(response);
  },

  getByShift: async (inspectionCallNo, shift) => {
    const response = await fetch(
      `${API_BASE_URL}/${endpoint}/call/${inspectionCallNo}/shift/${shift}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    return handleResponse(response);
  },

  save: async (data) => {
    const response = await fetch(
      `${API_BASE_URL}/${endpoint}`,
      { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }
    );
    return handleResponse(response);
  },

  saveBatch: async (dataList) => {
    const response = await fetch(
      `${API_BASE_URL}/${endpoint}/batch`,
      { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(dataList) }
    );
    return handleResponse(response);
  }
});

// 8-Hour Grid Services
export const shearingDataService = createGridDataService('shearing-data');
export const turningDataService = createGridDataService('turning-data');
export const mpiDataService = createGridDataService('mpi-data');
export const forgingDataService = createGridDataService('forging-data');
export const quenchingDataService = createGridDataService('quenching-data');
export const temperingDataService = createGridDataService('tempering-data');
export const finalCheckDataService = createGridDataService('final-check-data');

// ==================== Summary Report ====================

export const getSummaryReport = async (inspectionCallNo) => {
  const response = await fetch(
    `${API_BASE_URL}/summary-report/call/${inspectionCallNo}`,
    { method: 'GET', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const getSummaryByPoLine = async (inspectionCallNo, poNo, lineNo) => {
  const response = await fetch(
    `${API_BASE_URL}/summary-report/call/${inspectionCallNo}/po/${poNo}/line/${lineNo}`,
    { method: 'GET', headers: getAuthHeaders() }
  );
  return handleResponse(response);
};

export const saveSummaryReport = async (data) => {
  const response = await fetch(
    `${API_BASE_URL}/summary-report`,
    { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }
  );
  return handleResponse(response);
};

export const completeInspection = async (inspectionCallNo, poNo, lineNo, ieRemarks, finalStatus) => {
  const response = await fetch(
    `${API_BASE_URL}/summary-report/call/${inspectionCallNo}/po/${poNo}/line/${lineNo}/complete`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ieRemarks, finalStatus })
    }
  );
  return handleResponse(response);
};

// ==================== Quantity Summary ====================

/**
 * Get quantity summary for a process inspection call
 * Returns: acceptedQty, totalOfferedQty, totalManufactureQty
 * @param {string} inspectionCallNo - Inspection call number (e.g., "EP-01170008")
 * @returns {Promise<Object>} Quantity summary data
 */
export const getQuantitySummary = async (inspectionCallNo) => {
  try {
    const response = await fetch(
      `${API_BASE_URL.replace('/api/process-material', '')}/api/processIe/qty-summary/${inspectionCallNo}`,
      { method: 'GET', headers: getAuthHeaders() }
    );
    const data = await handleResponse(response);
    // Return the responseData which contains acceptedQty, totalOfferedQty, totalManufactureQty
    return data.responseData || data;
  } catch (error) {
    console.error('Error fetching quantity summary:', error);
    throw error;
  }
};

// ==================== Heat Wise Accountal - Two Step API Calls ====================

/**
 * Step 1: Fetch PO Serial Number by Call ID
 * GET /api/processIe/getPoNumnerByCallId/{callNo}
 * @param {string} callNo - Inspection call number (e.g., "EP-01270001")
 * @returns {Promise<string>} PO serial number (e.g., "001")
 */
export const getPoSerialNumberByCallId = async (callNo) => {
  try {
    const baseUrl = API_BASE_URL.replace('/api/process-material', '');
    const url = `${baseUrl}/api/processIe/getPoNumnerByCallId/${callNo}`;
    console.log(`📡 [Heat Wise Accountal] Fetching PO serial number for call: ${callNo}`);
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse(response);
    const poSerialNumber = data.responseData || '';
    console.log(`✅ [Heat Wise Accountal] PO serial number received: ${poSerialNumber}`);
    return poSerialNumber;
  } catch (error) {
    console.error('❌ [Heat Wise Accountal] Error fetching PO serial number:', error);
    throw error;
  }
};

/**
 * Step 2: Fetch Manufactured Quantity Summary by Heat and PO Serial Number
 * GET /api/processIe/getManufaturedQtyOfPo/{heatNo}/{poSerialNo}
 * @param {string} heatNo - Heat number (e.g., "11")
 * @param {string} poSerialNo - PO serial number from Step 1 (e.g., "001")
 * @returns {Promise<Object>} Quantity summary with fields:
 *   - manufaturedQty: Manufactured ERC quantity
 *   - rejectedQty: Rejected ERC quantity
 *   - rmAcceptedQty: Accepted RM quantity (MT)
 *   - acceptedQty: Accepted ERC quantity
 *   - heatNo: Heat number
 */
export const getManufacturedQtyOfPo = async (heatNo, poSerialNo) => {
  try {
    const baseUrl = API_BASE_URL.replace('/api/process-material', '');
    const url = `${baseUrl}/api/processIe/getManufaturedQtyOfPo/${heatNo}/${poSerialNo}`;
    console.log(`📡 [Heat Wise Accountal] Fetching manufactured qty for heat: ${heatNo}, PO serial: ${poSerialNo}`);
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await handleResponse(response);
    const quantityData = data.responseData || {};
    console.log(`✅ [Heat Wise Accountal] Quantity data received:`, quantityData);
    return quantityData;
  } catch (error) {
    console.error('❌ [Heat Wise Accountal] Error fetching manufactured quantity:', error);
    throw error;
  }
};

// ==================== Finish Inspection (Save All Submodule Data) ====================

/**
 * Finish Process Material inspection - saves all submodule data to backend
 * @param {Object} payload - Contains all submodule data for all lines
 */
export const finishProcessInspection = async (payload) => {
  const response = await fetch(
    `${API_BASE_URL}/finish`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    }
  );
  return handleResponse(response);
};

export const pauseProcessInspection = async (payload) => {
  const response = await fetch(
    `${API_BASE_URL}/pause`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    }
  );
  return handleResponse(response);
};

