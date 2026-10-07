import { getBaseUrl } from './apiConfig';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  return {
    Authorization: token ? `Bearer ${token}` : ''
  };
};

/**
 * Fetch document metadata and status for a call
 */
export const fetchCaseLetterMetadata = async (callNo, moduleType = 'RAILPAD') => {
  if (!callNo) throw new Error('Call number is required');
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/case-letter/metadata/${encodeURIComponent(callNo)}?moduleType=${encodeURIComponent(moduleType)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch metadata: ${res.statusText}`);
  }
  return await res.json();
};

/**
 * Fetch info of latest saved Case Letter
 */
export const fetchSavedCaseLetterInfo = async (callNo) => {
  if (!callNo) throw new Error('Call number is required');
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/case-letter/info/${encodeURIComponent(callNo)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch case letter info: ${res.statusText}`);
  }
  return await res.json();
};

/**
 * Send ordered files to backend for merging and receive merged PDF Blob for preview
 */
export const mergePreviewCaseLetter = async (formData) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/case-letter/merge-preview`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });
  if (!res.ok) {
    throw new Error(`Failed to preview merged PDF: ${res.statusText}`);
  }
  return await res.blob();
};

/**
 * Merge, compress and save Case Letter to Azure Blob Storage
 */
export const saveCaseLetter = async (formData) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/case-letter/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });
  if (!res.ok) {
    throw new Error(`Failed to save Case Letter: ${res.statusText}`);
  }
  return await res.json();
};

/**
 * View saved Case Letter PDF from Azure Blob Storage
 */
export const viewSavedCaseLetterPdf = async (callNo) => {
  if (!callNo) throw new Error('Call number is required');
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/case-letter/view/${encodeURIComponent(callNo)}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    throw new Error(`Failed to view saved Case Letter: ${res.statusText}`);
  }
  return await res.blob();
};

/**
 * Download saved Case Letter PDF
 */
export const downloadSavedCaseLetterPdf = (callNo) => {
  if (!callNo) return;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/case-letter/download/${encodeURIComponent(callNo)}`;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.download = `Case_Letter_${callNo}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Delete saved Case Letter for a call
 */
export const deleteSavedCaseLetter = async (callNo) => {
  if (!callNo) throw new Error('Call number is required');
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/case-letter/delete/${encodeURIComponent(callNo)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    throw new Error(`Failed to delete case letter: ${res.statusText}`);
  }
  return await res.json();
};

