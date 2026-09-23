/**
 * Correction Slip Service
 * Handles save / fetch / compression / upload of Correction to Inspection Certificate data and PDF.
 * Stores PDFs in Azure container 'ic-correctionslip'.
 */

import { API_BASE_URL } from './apiConfig';

const LS_KEY_PREFIX = 'correctionSlip_';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

const endpoint = `${API_BASE_URL}/api/correction-slip`;

/**
 * Save corrections for a call number.
 * Persists to localStorage immediately; also POSTs to backend.
 * @param {string} callNo
 * @param {Array<{columnName: string, readAs: string, insteadOf: string}>} rows
 * @param {string} createdBy  - username / userId
 * @returns {Promise<void>}
 */
export const saveCorrectionSlip = async (callNo, rows, createdBy) => {
  if (!callNo) throw new Error('Call number is required.');
  if (!rows || rows.length === 0) throw new Error('At least one correction row is required.');

  // Validate rows
  rows.forEach((row, idx) => {
    if (!row.columnName?.trim()) throw new Error(`Row ${idx + 1}: Column name is required.`);
    if (!row.readAs?.trim()) throw new Error(`Row ${idx + 1}: "Read As" value is required.`);
  });

  const payload = {
    callNo,
    createdBy: createdBy || 'unknown',
    rows: rows.map(r => ({
      columnName: r.columnName.trim(),
      readAs: r.readAs.trim(),
      insteadOf: (r.insteadOf || '').trim(),
    })),
  };

  // 1. Persist to localStorage immediately (survives refresh / logout)
  const stored = getLocalSlips(callNo);
  const merged = [...stored.filter(s => !rows.some(r => r.columnName === s.columnName)), ...payload.rows.map(r => ({
    ...r,
    createdBy: payload.createdBy,
    createdAt: new Date().toISOString(),
  }))];
  localStorage.setItem(`${LS_KEY_PREFIX}${callNo}`, JSON.stringify(merged));

  // 2. Attempt backend save
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('⚠️ Backend save failed (data is in localStorage):', errText);
    } else {
      console.log('✅ Correction slip saved to backend successfully.');
    }
  } catch (networkErr) {
    console.warn('⚠️ Network error saving correction slip (data is in localStorage):', networkErr.message);
  }
};

/**
 * Fetch corrections for a call number.
 * Prefers backend; falls back to localStorage.
 * @param {string} callNo
 * @returns {Promise<Array>}
 */
export const fetchCorrectionSlip = async (callNo) => {
  if (!callNo) return [];

  try {
    const encodedCallNo = encodeURIComponent(callNo);
    const response = await fetch(`${endpoint}?callNo=${encodedCallNo}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 204) return getLocalSlips(callNo); // No content
    if (!response.ok) {
      console.warn('⚠️ Backend fetch failed, using localStorage.');
      return getLocalSlips(callNo);
    }

    const data = await response.json();
    const backendRows = data?.responseData || data || [];
    // Sync back to localStorage
    if (Array.isArray(backendRows) && backendRows.length > 0) {
      localStorage.setItem(`${LS_KEY_PREFIX}${callNo}`, JSON.stringify(backendRows));
    }
    return backendRows;
  } catch (err) {
    console.warn('⚠️ Error fetching from backend, using localStorage:', err.message);
    return getLocalSlips(callNo);
  }
};

/**
 * Compress and store Correction Slip PDF in Azure container 'ic-correctionslip'.
 * @param {Object} payload { callNo, icNumber, moduleType, pdfBase64, fileName, uploadedBy, stage }
 * @returns {Promise<Object>}
 */
export const compressAndStoreCorrectionSlip = async (payload) => {
  if (!payload?.callNo || !payload?.pdfBase64) {
    throw new Error('Call number and PDF data are required for storing correction slip.');
  }

  const response = await fetch(`${endpoint}/compress-and-store`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Failed to store correction slip (HTTP ${response.status})`);
  }

  return await response.json();
};

/**
 * Fetch metadata for stored Correction Slip PDF.
 * @param {string} callNo
 * @returns {Promise<Object>}
 */
export const fetchCorrectionSlipDocument = async (callNo) => {
  if (!callNo) return { exists: false };

  try {
    const response = await fetch(`${endpoint}/document?callNo=${encodeURIComponent(callNo)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) return { exists: false };
    return await response.json();
  } catch (e) {
    console.warn('Could not fetch correction slip document:', e.message);
    return { exists: false };
  }
};

export const getViewCorrectionSlipPdfUrl = (callNo) => {
  return `${endpoint}/view-pdf/${encodeURIComponent(callNo)}`;
};

export const getDownloadCorrectionSlipPdfUrl = (callNo) => {
  return `${endpoint}/download-pdf/${encodeURIComponent(callNo)}`;
};

/**
 * Delete Correction Slip for a call number from backend and Azure.
 * @param {string} callNo
 * @returns {Promise<Object>}
 */
export const deleteCorrectionSlip = async (callNo) => {
  if (!callNo) {
    throw new Error('Call number is required to delete correction slip.');
  }

  // Clear local storage cache
  clearCorrectionSlipCache(callNo);

  const response = await fetch(`${endpoint}?callNo=${encodeURIComponent(callNo)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Failed to delete correction slip (HTTP ${response.status})`);
  }

  return await response.json();
};

/**
 * Clear localStorage cache for a call number (call after successful save + PDF).
 * @param {string} callNo
 */
export const clearCorrectionSlipCache = (callNo) => {
  if (callNo) localStorage.removeItem(`${LS_KEY_PREFIX}${callNo}`);
};

// ---------- helpers ----------

const getLocalSlips = (callNo) => {
  try {
    const raw = localStorage.getItem(`${LS_KEY_PREFIX}${callNo}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
