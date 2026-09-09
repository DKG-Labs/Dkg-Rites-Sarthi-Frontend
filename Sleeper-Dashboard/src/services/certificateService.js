// Sleeper-Dashboard/src/services/certificateService.js

import { API_BASE_URL } from './api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('authToken') || localStorage.getItem('token')
    ? { 'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}` }
    : {})
});

const getBaseUrl = () => {
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  return base;
};

/**
 * Upload Signed Certificate (Base64) to Azure Blob Storage
 * @param {Object} payload - { icNumber, signedData, fileName, uploadedBy }
 * @returns {Promise<Object>} Upload response
 */
export const uploadSignedCertificate = async (payload) => {
  try {
    console.log('🔍 Uploading signed certificate to Azure for IC:', payload.icNumber);
    const url = `${getBaseUrl()}/certificate-storage/upload`;
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

    const url = `${getBaseUrl()}/certificate-storage/upload-file`;
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
    const url = `${getBaseUrl()}/certificate-storage/view?icNumber=${encodeURIComponent(icNumber)}`;
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
 * Save or update Sleeper Final IC Edit Data (sleeper_final_ic_edit table)
 * @param {Object} payload 
 */
export const saveFinalIcEditData = async (payload) => {
  try {
    const url = `${getBaseUrl()}/sleeper-final-ic-edit`;
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
    const url = `${getBaseUrl()}/sleeper-final-ic-edit?icNumber=${encodedIcNumber}`;
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
    const url = `${getBaseUrl()}/sleeper-final-ic-save-changes`;
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
    const url = `${getBaseUrl()}/sleeper-final-ic-save-changes?icNumber=${encodedIcNumber}`;
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

