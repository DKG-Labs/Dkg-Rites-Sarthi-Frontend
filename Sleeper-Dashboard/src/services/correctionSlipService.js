/**
 * Correction Slip Service (Sleeper)
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

export const saveCorrectionSlip = async (callNo, rows, createdBy) => {
  if (!callNo) throw new Error('Call number is required.');
  if (!rows || rows.length === 0) throw new Error('At least one correction row is required.');

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

  const stored = getLocalSlips(callNo);
  const merged = [...stored.filter(s => !rows.some(r => r.columnName === s.columnName)), ...payload.rows.map(r => ({
    ...r,
    createdBy: payload.createdBy,
    createdAt: new Date().toISOString(),
  }))];
  localStorage.setItem(`${LS_KEY_PREFIX}${callNo}`, JSON.stringify(merged));

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

export const fetchCorrectionSlip = async (callNo) => {
  if (!callNo) return [];

  try {
    const encodedCallNo = encodeURIComponent(callNo);
    const response = await fetch(`${endpoint}?callNo=${encodedCallNo}`, {
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
