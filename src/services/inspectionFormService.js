/**
 * Service for Inspection Form APIs (Sections A, B, C, D)
 * All endpoints require JWT authentication
 */

import { API_BASE_URL as API_ROOT } from './apiConfig';

const API_BASE_URL = `${API_ROOT}/api/inspection-form`;
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

// ==================== Combined Form Data ====================

// Helper to parse response and surface errors
const handleResponse = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch (e) {
    // non-JSON response
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText} - ${text}`);
  }
  if (!response.ok) {
    const serverMsg = body && (body.message || body.error || JSON.stringify(body));
    throw new Error(`HTTP ${response.status} ${response.statusText} - ${serverMsg}`);
  }
  return body;
};
/**
 * Get all form data (Sections A, B, C) by inspection call number
 */
export const getFormDataByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

// ==================== Section A: PO Details ====================

export const getPoDetailsByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/po-details/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

export const savePoDetails = async (poDetails) => {
  const response = await fetch(`${API_BASE_URL}/po-details`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(poDetails)
  });
  const data = await handleResponse(response);
  return data.responseData;
};

export const verifyPoDetails = async (callNo, verifiedBy) => {
  const response = await fetch(`${API_BASE_URL}/po-details/verify/${callNo}?verifiedBy=${verifiedBy}`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

// ==================== Section B: Inspection Call ====================

export const getCallDetailsByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/call-details/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

export const saveCallDetails = async (callDetails) => {
  const response = await fetch(`${API_BASE_URL}/call-details`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(callDetails)
  });
  const data = await handleResponse(response);
  return data.responseData;
};

export const updateCallDetails = async (callDetails) => {
  const response = await fetch(`${API_BASE_URL}/call-details`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(callDetails)
  });
  const data = await response.json();
  return data.responseData;
};

export const verifyCallDetails = async (callNo, verifiedBy) => {
  const response = await fetch(`${API_BASE_URL}/call-details/verify/${callNo}?verifiedBy=${verifiedBy}`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

// ==================== Section C: Sub PO Details ====================

export const getSubPoDetailsByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/sub-po-details/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

export const saveSubPoDetails = async (subPoDetails) => {
  const response = await fetch(`${API_BASE_URL}/sub-po-details`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(subPoDetails)
  });
  const data = await handleResponse(response);
  return data.responseData;
};

export const verifySubPoDetails = async (callNo, verifiedBy) => {
  const response = await fetch(`${API_BASE_URL}/sub-po-details/verify/${callNo}?verifiedBy=${verifiedBy}`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

// ==================== Section D: Production Lines (Process Inspection) ====================

/**
 * Get all production lines by inspection call number
 */
export const getProductionLinesByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/production-lines/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

/**
 * Save production lines for an inspection call
 */
export const saveProductionLines = async (callNo, lines) => {
  const response = await fetch(`${API_BASE_URL}/production-lines/${callNo}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(lines)
  });
  const data = await handleResponse(response);
  return data.responseData;
};

/**
 * Verify all production lines for an inspection call
 */
export const verifyProductionLines = async (callNo, verifiedBy) => {
  const response = await fetch(`${API_BASE_URL}/production-lines/verify/${callNo}?verifiedBy=${verifiedBy}`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};

// ==================== Vendor API Data Ingestion ====================

/**
 * Ingest PO data from vendor API (simulated)
 * This function sends PO data to the backend for storage
 */
export const ingestVendorPoData = async (vendorData) => {
  const response = await fetch(`${API_BASE_URL}/vendor/ingest`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(vendorData)
  });
  const data = await handleResponse(response);
  return data.responseData;
};

/**
 * Get all pending inspection calls (not yet verified)
 * Used to populate the inspection call selection dropdown
 */
export const getAllPendingInspectionCalls = async () => {
  const response = await fetch(`${API_BASE_URL}/pending-calls`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data.responseData;
};
