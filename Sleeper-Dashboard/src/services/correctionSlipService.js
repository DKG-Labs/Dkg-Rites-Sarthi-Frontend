/**
 * Correction Slip Service (Sleeper)
 * Handles save / fetch / compression / upload of Correction to Inspection Certificate data and PDF.
 * Stores PDFs in Azure container 'ic-correctionslip'.
 */

import { API_BASE_URL } from './api';

const LS_KEY_PREFIX = 'correctionSlip_';

const getToken = () => {
  return localStorage.getItem('token') ||
         localStorage.getItem('authToken') ||
         localStorage.getItem('jwtToken') ||
         sessionStorage.getItem('token') || '';
};

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '',
  };
};

const getEndpoint = () => {
  const base = (API_BASE_URL || '').replace(/\/api\/?$/, '');
  return `${base}/api/correction-slip`;
};

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

export const compressAndStoreCorrectionSlip = async (payload) => {
  if (!payload?.callNo || !payload?.pdfBase64) {
    throw new Error('Call number and PDF data are required for storing correction slip.');
  }

  const response = await fetch(`${getEndpoint()}/compress-and-store`, {
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
  if (!callNo) return { exists: false, totalCount: 0 };

  try {
    const response = await fetch(`${getEndpoint()}/document?callNo=${encodeURIComponent(callNo)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) return { exists: false, totalCount: 0 };
    return await response.json();
  } catch (e) {
    console.warn('Could not fetch correction slip document:', e.message);
    return { exists: false, totalCount: 0 };
  }
};

export const fetchCorrectionSlipDocuments = async (callNo) => {
  if (!callNo) return [];

  try {
    const response = await fetch(`${getEndpoint()}/documents?callNo=${encodeURIComponent(callNo)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Could not fetch correction slip documents list:', e.message);
    return [];
  }
};

export const getViewCorrectionSlipPdfUrl = (callNo) => {
  return `${getEndpoint()}/view-pdf/${encodeURIComponent(callNo)}`;
};

export const getDownloadCorrectionSlipPdfUrl = (callNo) => {
  return `${getEndpoint()}/download-pdf/${encodeURIComponent(callNo)}`;
};

export const getViewCorrectionSlipPdfByIdUrl = (id) => {
  return `${getEndpoint()}/view-pdf-by-id/${id}`;
};

export const getDownloadCorrectionSlipPdfByIdUrl = (id) => {
  return `${getEndpoint()}/download-pdf-by-id/${id}`;
};

/**
 * View stored Correction Slip PDF using authenticated fetch
 */
export const viewCorrectionSlipPdf = async (callNo, docId = null) => {
  if (!callNo && !docId) return;
  const token = getToken();
  const url = docId 
    ? getViewCorrectionSlipPdfByIdUrl(docId) 
    : getViewCorrectionSlipPdfUrl(callNo);

  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`Failed to load PDF (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    console.error('Error viewing correction slip PDF via authenticated fetch:', error);
    window.open(url, '_blank');
  }
};

/**
 * Download stored Correction Slip PDF using authenticated fetch
 */
export const downloadCorrectionSlipPdf = async (callNo, docId = null, filename = null) => {
  if (!callNo && !docId) return;
  const token = getToken();
  const url = docId 
    ? getDownloadCorrectionSlipPdfByIdUrl(docId) 
    : getDownloadCorrectionSlipPdfUrl(callNo);

  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`Failed to download PDF (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `Correction_Slip_${callNo || docId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
  } catch (error) {
    console.error('Error downloading correction slip PDF via authenticated fetch:', error);
    window.open(url, '_blank');
  }
};

/**
 * Download all stored Correction Slip PDFs for a call number separately
 */
export const downloadAllCorrectionSlips = async (callNo, initialDocs = [], onProgress = null) => {
  if (!callNo) return;
  let docs = Array.isArray(initialDocs) && initialDocs.length > 0 ? initialDocs : [];
  if (docs.length === 0) {
    try {
      docs = await fetchCorrectionSlipDocuments(callNo);
    } catch (e) {
      console.warn('Could not fetch documents list for download:', e);
    }
  }

  if (Array.isArray(docs) && docs.length > 0) {
    const total = docs.length;
    for (let i = 0; i < total; i++) {
      const doc = docs[i];
      if (typeof onProgress === 'function') {
        onProgress({ current: i + 1, total, doc });
      }
      const filename = doc.originalFileName || `Correction_Slip_${callNo}_${doc.id || (i + 1)}.pdf`;
      await downloadCorrectionSlipPdf(callNo, doc.id, filename);
      if (i < total - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  } else {
    if (typeof onProgress === 'function') {
      onProgress({ current: 1, total: 1, doc: null });
    }
    await downloadCorrectionSlipPdf(callNo, null, `Correction_Slip_${callNo}.pdf`);
  }
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
  clearCorrectionSlipCache(callNo);
  const response = await fetch(`${getEndpoint()}?callNo=${encodeURIComponent(callNo)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || `Failed to delete correction slip (HTTP ${response.status})`);
  }
  return await response.json();
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
