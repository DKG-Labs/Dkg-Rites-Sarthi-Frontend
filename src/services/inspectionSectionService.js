/**
 * Service for Inspection Section APIs (Sections A, B, C)
 * All endpoints require JWT authentication
 * Integrates with InspectionSectionController endpoints
 */

import { API_ENDPOINTS } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.INSPECTION_SECTIONS;
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

/* ==================== SECTION A: Main PO Information ==================== */

/**
 * Save Section A data (Main PO Information)
 */
export const saveSectionA = async (sectionAData) => {
  console.log('🔵 [Section A] POST API Called - saveSectionA');
  console.log('📤 [Section A] Request URL:', `${API_BASE_URL}/section-a`);
  console.log('📤 [Section A] Request Payload:', sectionAData);

  const response = await fetch(`${API_BASE_URL}/section-a`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(sectionAData)
  });

  console.log('📥 [Section A] Response Status:', response.status);
  const data = await handleResponse(response);
  console.log('✅ [Section A] Response Data:', data);
  return data.responseData;
};

/**
 * Get Section A data by call number
 */
export const getSectionAByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/section-a/call/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await handleResponse(response);
  return data.responseData;
};

/**
 * Approve Section A
 */
export const approveSectionA = async (callNo) => {
  console.log('🟢 [Section A] POST API Called - approveSectionA');
  console.log('📤 [Section A] Approve URL:', `${API_BASE_URL}/section-a/approve/${callNo}`);

  const response = await fetch(`${API_BASE_URL}/section-a/approve/${callNo}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  console.log('📥 [Section A] Approve Response Status:', response.status);
  const data = await handleResponse(response);
  console.log('✅ [Section A] Approve Response Data:', data);
  return data.responseData;
};

/**
 * Reject Section A
 */
export const rejectSectionA = async (callNo, remarks) => {
  const response = await fetch(`${API_BASE_URL}/section-a/reject/${callNo}?remarks=${encodeURIComponent(remarks)}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await handleResponse(response);
  return data.responseData;
};

/* ==================== SECTION B: Inspection Call Details ==================== */

/**
 * Save Section B data (Inspection Call Details)
 */
export const saveSectionB = async (sectionBData) => {
  console.log('🔵 [Section B] POST API Called - saveSectionB');
  console.log('📤 [Section B] Request URL:', `${API_BASE_URL}/section-b`);
  console.log('📤 [Section B] Request Payload:', sectionBData);

  const response = await fetch(`${API_BASE_URL}/section-b`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(sectionBData)
  });

  console.log('📥 [Section B] Response Status:', response.status);
  const data = await handleResponse(response);
  console.log('✅ [Section B] Response Data:', data);
  return data.responseData;
};

/**
 * Get Section B data by call number
 */
export const getSectionBByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/section-b/call/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await handleResponse(response);
  return data.responseData;
};

/**
 * Get all Section B data (all inspection call details)
 */
export const getAllSectionB = async () => {
  const response = await fetch(`${API_BASE_URL}/section-b`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await handleResponse(response);
  return data.responseData;
};

/**
 * Approve Section B
 */
export const approveSectionB = async (callNo) => {
  console.log('🟢 [Section B] POST API Called - approveSectionB');
  console.log('📤 [Section B] Approve URL:', `${API_BASE_URL}/section-b/approve/${callNo}`);

  const response = await fetch(`${API_BASE_URL}/section-b/approve/${callNo}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  console.log('📥 [Section B] Approve Response Status:', response.status);
  const data = await handleResponse(response);
  console.log('✅ [Section B] Approve Response Data:', data);
  return data.responseData;
};

/**
 * Reject Section B
 */
export const rejectSectionB = async (callNo, remarks) => {
  const response = await fetch(`${API_BASE_URL}/section-b/reject/${callNo}?remarks=${encodeURIComponent(remarks)}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await handleResponse(response);
  return data.responseData;
};

/* ==================== SECTION C: Sub PO Details ==================== */

/**
 * Save Section C data (Sub PO Details) - batch save
 */
export const saveSectionCBatch = async (sectionCDataList) => {
  console.log('🔵 [Section C] POST API Called - saveSectionCBatch');
  console.log('📤 [Section C] Request URL:', `${API_BASE_URL}/section-c/batch`);
  console.log('📤 [Section C] Request Payload (count):', sectionCDataList?.length);
  console.log('📤 [Section C] Request Payload:', sectionCDataList);

  const response = await fetch(`${API_BASE_URL}/section-c/batch`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(sectionCDataList)
  });

  console.log('📥 [Section C] Response Status:', response.status);
  const data = await handleResponse(response);
  console.log('✅ [Section C] Response Data:', data);
  return data.responseData;
};

/**
 * Get Section C data by call number
 */
export const getSectionCByCallNo = async (callNo) => {
  const response = await fetch(`${API_BASE_URL}/section-c/call/${callNo}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const data = await handleResponse(response);
  return data.responseData;
};

/**
 * Approve all Section C records for a call
 */
export const approveAllSectionC = async (callNo) => {
  console.log('🟢 [Section C] POST API Called - approveAllSectionC');
  console.log('📤 [Section C] Approve URL:', `${API_BASE_URL}/section-c/approve-all/${callNo}`);

  const response = await fetch(`${API_BASE_URL}/section-c/approve-all/${callNo}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  console.log('📥 [Section C] Approve Response Status:', response.status);
  const data = await handleResponse(response);
  console.log('✅ [Section C] Approve Response Data:', data);
  return data.responseData;
};

/**
 * Reject all Section C records for a call
 */
export const rejectAllSectionC = async (callNo, remarks) => {
  const response = await fetch(`${API_BASE_URL}/section-c/reject-all/${callNo}?remarks=${encodeURIComponent(remarks)}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await handleResponse(response);
  return data.responseData;
};

