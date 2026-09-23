// Sleeper-Dashboard/src/services/certificateService.js

import { API_BASE_URL } from './api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('authToken') || localStorage.getItem('token')
    ? { 'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}` }
    : {})
});

/**
 * Upload Signed Certificate (Base64) to Azure Blob Storage
 * @param {Object} payload - { icNumber, signedData, fileName, uploadedBy }
 * @returns {Promise<Object>} Upload response
 */
export const uploadSignedCertificate = async (payload) => {
  try {
    console.log('🔍 Uploading signed certificate to Azure for IC:', payload.icNumber);
    const url = `${API_BASE_URL.replace('/api', '')}/api/certificate-storage/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to upload certificate: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Certificate uploaded successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error uploading certificate:', error);
    throw error;
  }
};

/**
 * Upload Signed Certificate File (Multipart/form-data) to Azure Blob Storage
 * @param {File} file - PDF file to upload
 * @param {string} icNumber - Inspection call number
 * @param {string} uploadedBy - Username/name of the uploader
 * @returns {Promise<Object>} Upload response
 */
export const uploadSignedCertificateFile = async (file, icNumber, uploadedBy) => {
  try {
    console.log('🔍 Uploading signed certificate file to Azure for IC:', icNumber);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('icNumber', icNumber);
    formData.append('uploadedBy', uploadedBy || 'Inspecting Engineer');

    const headers = {};
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL.replace('/api', '')}/api/certificate-storage/upload-file`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to upload certificate file: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Certificate file uploaded successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error uploading certificate file:', error);
    throw error;
  }
};

/**
 * View/Download Signed IC from Azure Blob Storage
 * @param {string} icNumber 
 * @returns {Promise<Object>} { fileName, signedData }
 */
export const viewSignedCertificate = async (icNumber) => {
  try {
    console.log('🔍 Fetching signed certificate from Azure for IC:', icNumber);
    const url = `${API_BASE_URL.replace('/api', '')}/api/certificate-storage/view?icNumber=${encodeURIComponent(icNumber)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No signed certificate found for this IC.');
      }
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch certificate: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Certificate fetched successfully from Azure');
    return data;
  } catch (error) {
    console.error('❌ Error fetching signed certificate:', error);
    throw error;
  }
};

/**
/**
 * Save or update Sleeper Final IC Edit Data (sleeper_final_ic_edit table)
 * @param {Object} payload 
 */
export const saveFinalIcEditData = async (payload) => {
  try {
    const url = `${API_BASE_URL.replace('/api', '')}/api/sleeper-final-ic-edit`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save Sleeper Final IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error saving Sleeper Final IC edit data:', error);
    throw error;
  }
};

/**
 * Get Sleeper Final IC Edit Data (sleeper_final_ic_edit table)
 * @param {string} icNumber 
 */
export const getFinalIcEditData = async (icNumber) => {
  try {
    const encodedIcNumber = encodeURIComponent(icNumber);
    const url = `${API_BASE_URL.replace('/api', '')}/api/sleeper-final-ic-edit?icNumber=${encodedIcNumber}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null;
    if (!response.ok) throw new Error('Failed to fetch Sleeper Final IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Sleeper Final IC edit data:', error);
    return null;
  }
};

/**
 * Save or update Sleeper Final IC Save Changes Data Draft (sleeper_final_ic_save_changes table)
 * @param {Object} payload 
 */
export const saveFinalIcSaveChanges = async (payload) => {
  try {
    const url = `${API_BASE_URL.replace('/api', '')}/api/sleeper-final-ic-save-changes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save draft Sleeper Final IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error saving draft Sleeper Final IC changes:', error);
    throw error;
  }
};

/**
 * Get Sleeper Final IC Save Changes Data Draft (sleeper_final_ic_save_changes table)
 * @param {string} icNumber 
 */
export const getFinalIcSaveChanges = async (icNumber) => {
  try {
    const encodedIcNumber = encodeURIComponent(icNumber);
    const url = `${API_BASE_URL.replace('/api', '')}/api/sleeper-final-ic-save-changes?icNumber=${encodedIcNumber}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null;
    if (!response.ok) throw new Error('Failed to fetch draft Sleeper Final IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching draft Sleeper Final IC changes:', error);
    return null;
  }
};

// Aliases for explicit sleeper naming
export const saveSleeperFinalIcEditData = saveFinalIcEditData;
export const getSleeperFinalIcEditData = getFinalIcEditData;
export const saveSleeperFinalIcSaveChanges = saveFinalIcSaveChanges;
export const getSleeperFinalIcSaveChanges = getFinalIcSaveChanges;

/**
 * Upload Annexure / Document for an Inspection Call
 */
export const uploadAnnexureDocument = async (file, callNo, icNumber, moduleType, uploadedBy) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('callNo', callNo);
  if (icNumber) formData.append('icNumber', icNumber);
  formData.append('moduleType', moduleType || 'SLEEPER');
  formData.append('uploadedBy', uploadedBy || 'Inspecting Engineer');

  const headers = {};
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
  const url = `${base}/ic-annexures/upload`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  });

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    let errMsg = `Upload failed with status: ${response.status}`;
    if (contentType.includes('application/json')) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.message) errMsg = errorData.message;
    }
    throw new Error(errMsg);
  }
  if (contentType.includes('application/json')) {
    return await response.json();
  }
  return { success: true, message: 'Document uploaded' };
};

/**
 * Get list of uploaded Annexure documents for an Inspection Call
 */
export const getAnnexureDocuments = async (callNo, moduleType) => {
  if (!callNo) return { success: true, data: [] };
  try {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
    const url = `${base}/ic-annexures/list?callNo=${encodeURIComponent(callNo)}&moduleType=${encodeURIComponent(moduleType || 'SLEEPER')}`;
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      console.warn(`[getAnnexureDocuments] HTTP ${response.status} from ${url}`);
      return { success: false, data: [] };
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn(`[getAnnexureDocuments] Non-JSON response received from ${url}:`, contentType);
      return { success: false, data: [] };
    }
    return await response.json();
  } catch (err) {
    console.error('Failed to load annexures:', err);
    return { success: false, data: [] };
  }
};

/**
 * Delete an uploaded Annexure document
 */
export const deleteAnnexureDocument = async (id, requestedBy) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
  const url = `${base}/ic-annexures/${id}?requestedBy=${encodeURIComponent(requestedBy || '')}`;
  const response = await fetch(url, { method: 'DELETE', headers });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    let errMsg = `Failed to delete annexure (${response.status})`;
    if (contentType.includes('application/json')) {
      const errData = await response.json().catch(() => ({}));
      if (errData.message) errMsg = errData.message;
    }
    throw new Error(errMsg);
  }
  if (contentType.includes('application/json')) {
    return await response.json();
  }
  return { success: true, message: 'Deleted successfully' };
};

/**
 * View / Download decompressed Annexure document
 */
export const viewAnnexureDocument = async (id, fileName) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
  const url = `${base}/ic-annexures/download/${id}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) throw new Error('Failed to download decompressed document');
  const blob = await response.blob();
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const objectUrl = window.URL.createObjectURL(pdfBlob);
  window.open(objectUrl, '_blank');
};



