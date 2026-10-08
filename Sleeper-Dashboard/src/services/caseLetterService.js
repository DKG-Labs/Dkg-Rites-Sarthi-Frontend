import axios from 'axios';
import { API_BASE_URL } from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
  return {
    Authorization: token ? `Bearer ${token}` : ''
  };
};

/**
 * Fetch document metadata and status for a call
 */
export const fetchCaseLetterMetadata = async (callNo, moduleType = 'SLEEPER') => {
  if (!callNo) throw new Error('Call number is required');
  const response = await axios.get(`${API_BASE_URL}/case-letter/metadata/${encodeURIComponent(callNo)}`, {
    params: { moduleType },
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetch info of latest saved Case Letter
 */
export const fetchSavedCaseLetterInfo = async (callNo) => {
  if (!callNo) throw new Error('Call number is required');
  const response = await axios.get(`${API_BASE_URL}/case-letter/info/${encodeURIComponent(callNo)}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Send ordered files to backend for merging and receive merged PDF Blob for preview
 */
export const mergePreviewCaseLetter = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/case-letter/merge-preview`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data'
    },
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Merge, compress and save Case Letter to Azure Blob Storage
 */
export const saveCaseLetter = async (formData) => {
  const response = await axios.post(`${API_BASE_URL}/case-letter/save`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * View saved Case Letter PDF from Azure Blob Storage
 */
export const viewSavedCaseLetterPdf = async (callNo) => {
  if (!callNo) throw new Error('Call number is required');
  const response = await axios.get(`${API_BASE_URL}/case-letter/view/${encodeURIComponent(callNo)}`, {
    headers: getAuthHeaders(),
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Download saved Case Letter PDF
 */
export const downloadSavedCaseLetterPdf = (callNo) => {
  if (!callNo) return;
  const url = `${API_BASE_URL}/case-letter/download/${encodeURIComponent(callNo)}`;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.download = `Case_Letter_${callNo}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download saved Case Letter PDF or trigger onNotFound callback if not found
 */
export const downloadOrNotifyCaseLetter = async (callNo, options = {}) => {
  const onNotFound = typeof options === 'function' ? options : options?.onNotFound;
  const onStart = typeof options === 'object' ? options?.onStart : null;
  const onSuccess = typeof options === 'object' ? options?.onSuccess : null;
  const onError = typeof options === 'object' ? options?.onError : null;

  if (!callNo) {
    if (onNotFound) onNotFound('Case letter not found for this call no');
    return { success: false, message: 'Case letter not found for this call no' };
  }

  if (onStart) onStart();

  try {
    const info = await fetchSavedCaseLetterInfo(callNo);
    if (info && info.exists && info.data) {
      const blob = await viewSavedCaseLetterPdf(callNo);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const fileName = info.data.originalFileName || info.data.blobFileName || `Case_Letter_${callNo}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      if (onSuccess) onSuccess(info.data);
      return { success: true, data: info.data };
    } else {
      if (onNotFound) onNotFound('Case letter not found for this call no');
      return { success: false, message: 'Case letter not found for this call no' };
    }
  } catch (err) {
    console.warn('Failed to fetch/download case letter:', err);
    if (onError) onError(err);
    else if (onNotFound) onNotFound('Case letter not found for this call no');
    return { success: false, error: err };
  }
};

/**
 * Delete saved Case Letter for a call
 */
export const deleteSavedCaseLetter = async (callNo) => {
  if (!callNo) throw new Error('Call number is required');
  const response = await axios.delete(`${API_BASE_URL}/case-letter/delete/${encodeURIComponent(callNo)}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};



