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
 * Save or update Final IC Edit Data
 * @param {Object} payload 
 */
export const saveFinalIcEditData = async (payload) => {
  try {
    const url = `${API_BASE_URL.replace('/api', '')}/api/final-ic-edit`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save Final IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error saving Final IC edit data:', error);
    throw error;
  }
};

/**
 * Get Final IC Edit Data
 * @param {string} icNumber 
 */
export const getFinalIcEditData = async (icNumber) => {
  try {
    const encodedIcNumber = encodeURIComponent(icNumber);
    const url = `${API_BASE_URL.replace('/api', '')}/api/final-ic-edit?icNumber=${encodedIcNumber}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null;
    if (!response.ok) throw new Error('Failed to fetch Final IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Final IC edit data:', error);
    return null;
  }
};

/**
 * Save or update Final IC Save Changes Data (Draft)
 * @param {Object} payload 
 */
export const saveFinalIcSaveChanges = async (payload) => {
  try {
    const url = `${API_BASE_URL.replace('/api', '')}/api/final-ic-save-changes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save draft Final IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error saving draft Final IC changes:', error);
    throw error;
  }
};

/**
 * Get Final IC Save Changes Data (Draft)
 * @param {string} icNumber 
 */
export const getFinalIcSaveChanges = async (icNumber) => {
  try {
    const encodedIcNumber = encodeURIComponent(icNumber);
    const url = `${API_BASE_URL.replace('/api', '')}/api/final-ic-save-changes?icNumber=${encodedIcNumber}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null;
    if (!response.ok) throw new Error('Failed to fetch draft Final IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching draft Final IC changes:', error);
    return null;
  }
};

