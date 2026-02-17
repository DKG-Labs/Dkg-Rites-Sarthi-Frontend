/**
 * Service for Raw Material Inspection APIs
 * Handles: Visual Inspection, Dimensional Check, Material Testing,
 * Packing Storage, and Calibration Documents
 */

import { API_ENDPOINTS } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.RM_INSPECTION;

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
 * Handle API response and surface errors
 */
const handleResponse = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch (e) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText} - ${text}`);
  }
  if (!response.ok) {
    const serverMsg = body && (body.message || body.error || JSON.stringify(body));
    throw new Error(`HTTP ${response.status} ${response.statusText} - ${serverMsg}`);
  }
  return body;
};

// ==================== Finish Inspection (Save All) ====================

/**
 * Save all Raw Material inspection data when user clicks "Finish Inspection"
 * @param {Object} data - Contains all submodule data
 */
export const finishInspection = async (data) => {
  const response = await fetch(`${API_BASE_URL}/finish`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  return result.responseData;
};

/**
 * Pause Raw Material inspection - saves all submodule data WITHOUT changing status
 * Called when inspector clicks "Pause Inspection" button
 * @param {Object} data - Contains all submodule data
 */
export const pauseRawMaterialInspection = async (data) => {
  const response = await fetch(`${API_BASE_URL}/pause`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  return result.responseData;
};

/**
 * Get all Raw Material inspection data by call number
 * Fetches complete inspection data including:
 * - Pre-inspection summary (cumulative data)
 * - Heat final results (per-heat status, weights, submodule statuses)
 * - Visual inspection data
 * - Dimensional check data
 * - Material testing data
 * - Packing & storage data
 * - Calibration documents data
 * - Inspector details
 */
export const getInspectionDataByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/call/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const result = await handleResponse(response);
  return result.responseData;
};

/**
 * Get cumulative summary data only (pre-inspection data)
 * Fetches:
 * - Total Heats Offered
 * - Total Qty Offered (MT)
 * - Number of Bundles
 * - Number of ERC
 * - Product Model
 * - PO details
 * - Vendor information
 * - Source of raw material
 */
export const getSummaryByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/summary/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const result = await handleResponse(response);
  return result.responseData;
};

/**
 * Get final inspection results for all heats
 * Fetches per-heat data including:
 * - Heat number and index
 * - Status (ACCEPTED/REJECTED/PENDING)
 * - Weight offered, accepted, rejected (MT)
 * - Submodule statuses (calibration, visual, dimensional, material test, packing)
 * - Remarks
 */
export const getFinalResultsByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/final-results/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const result = await handleResponse(response);
  return result.responseData;
};

/**
 * Get ladle values (chemical analysis from vendor) for all heats
 * Used in Material Testing page to display ladle values
 * Fetches per-heat data including:
 * - Heat number
 * - %C (Carbon)
 * - %Si (Silicon)
 * - %Mn (Manganese)
 * - %P (Phosphorus)
 * - %S (Sulphur)
 * - %Cr (Chromium) - optional
 */
export const getLadleValuesByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/ladle-values/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const result = await handleResponse(response);
  return result.responseData;
};

// ==================== Visual Inspection ====================

export const getVisualInspection = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/visual/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

export const saveVisualInspection = async (data) => {
  const response = await fetch(`${API_BASE_URL}/visual`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  return result.responseData;
};

export const saveVisualInspectionPass = async (data) => {
  const response = await fetch(`${API_BASE_URL}/visual/pass`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  return result.responseData;
};

export const getVisualInspectionPass = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/visual/pass/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

// ==================== Dimensional Check ====================

export const getDimensionalCheck = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/dimensional/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

export const saveDimensionalCheck = async (data) => {
  const response = await fetch(`${API_BASE_URL}/dimensional`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  return result.responseData;
};

// ==================== Material Testing ====================

export const getMaterialTesting = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/material-testing/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

export const saveMaterialTesting = async (data) => {
  const response = await fetch(`${API_BASE_URL}/material-testing`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  return result.responseData;
};

// ==================== Packing & Storage ====================

export const getPackingStorage = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/packing-storage/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

export const savePackingStorage = async (data) => {
  const response = await fetch(`${API_BASE_URL}/packing-storage`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  return result.responseData;
};

// ==================== Calibration Documents ====================

export const getCalibrationDocuments = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/calibration/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

export const saveCalibrationDocuments = async (data) => {
  const response = await fetch(`${API_BASE_URL}/calibration`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await handleResponse(response);
  return result.responseData;
};

