/**
 * Correction Slip Service
 * Handles save / fetch of Correction to Inspection Certificate data.
 * Falls back to localStorage for offline persistence.
 */

import { getBaseUrl } from './apiConfig';

const LS_KEY_PREFIX = 'correctionSlip_';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

const getEndpoint = () => `${getBaseUrl()}/correction-slip`;

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
    createdBy: createdBy || localStorage.getItem('userId') || 'unknown',
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
    const response = await fetch(getEndpoint(), {
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
    const response = await fetch(`${getEndpoint()}?callNo=${encodedCallNo}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 204) return getLocalSlips(callNo);
    if (!response.ok) {
      console.warn('⚠️ Backend fetch failed, using localStorage.');
      return getLocalSlips(callNo);
    }

    const data = await response.json();
    const backendRows = data?.responseData || data || [];
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
 * Clear localStorage cache for a call number.
 * @param {string} callNo
 */
export const clearCorrectionSlipCache = (callNo) => {
  if (callNo) localStorage.removeItem(`${LS_KEY_PREFIX}${callNo}`);
};

const getLocalSlips = (callNo) => {
  try {
    const raw = localStorage.getItem(`${LS_KEY_PREFIX}${callNo}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
