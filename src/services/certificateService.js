/**
 * Certificate Service
 * Handles certificate generation API calls
 */

import { API_ENDPOINTS } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.CERTIFICATES;

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
 * Generate Raw Material Inspection Certificate by IC Number
 * @param {string} icNumber - Inspection Call Number (e.g., RM-IC-1767772023499 or N/RM-IC-1767618858167/RAJK)
 * @returns {Promise<Object>} Certificate data
 */
export const generateRawMaterialCertificate = async (icNumber) => {
  try {
    console.log('🔍 Generating certificate for IC Number:', icNumber);

    // Use query parameter instead of path variable to handle slashes
    // URL-encode the IC number to handle special characters
    const encodedIcNumber = encodeURIComponent(icNumber);
    console.log('📝 Encoded IC Number:', encodedIcNumber);

    const response = await fetch(`${API_BASE_URL}/raw-material?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to generate certificate: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Certificate generated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    throw error;
  }
};

/**
 * Generate Raw Material Inspection Certificate by Call ID
 * @param {number} callId - Inspection Call ID
 * @returns {Promise<Object>} Certificate data
 */
export const generateRawMaterialCertificateById = async (callId) => {
  try {
    console.log('🔍 Generating certificate for Call ID:', callId);
    
    const response = await fetch(`${API_BASE_URL}/raw-material/by-id/${callId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to generate certificate: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Certificate generated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    throw error;
  }
};

/**
 * Generate Process Material certificate data
 * @param {string} icNumber - Inspection Call Number (e.g., "EP-01090004")
 * @returns {Promise<Object>} Certificate data
 */
export const generateProcessMaterialCertificate = async (icNumber) => {
  try {
    console.log('🔍 Generating Process Material certificate for IC Number:', icNumber);

    // Use query parameter instead of path variable to handle slashes
    // URL-encode the IC number to handle special characters
    const encodedIcNumber = encodeURIComponent(icNumber);
    console.log('📝 Encoded IC Number:', encodedIcNumber);

    const response = await fetch(`${API_BASE_URL}/process-material?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to generate Process Material certificate: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Process Material certificate generated successfully:', data);
    return data.responseData || data;
  } catch (error) {
    console.error('❌ Error generating Process Material certificate:', error);
    throw error;
  }
};

/**
 * Generate Final Product certificate data
 * @param {string} icNumber - Inspection Call Number (e.g., "FP-01120001")
 * @returns {Promise<Object>} Certificate data
 */
export const generateFinalProductCertificate = async (icNumber) => {
  try {
    console.log('🔍 Generating Final Product certificate for IC Number:', icNumber);

    // Use query parameter instead of path variable to handle slashes
    // URL-encode the IC number to handle special characters
    const encodedIcNumber = encodeURIComponent(icNumber);
    console.log('📝 Encoded IC Number:', encodedIcNumber);

    const response = await fetch(`${API_BASE_URL}/final-product?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to generate Final Product certificate: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Final Product certificate generated successfully:', data);
    return data.responseData || data;
  } catch (error) {
    console.error('❌ Error generating Final Product certificate:', error);
    throw error;
  }
};

/**
 * Generate Final Material Inspection Certificate by IC Number
 * @param {string} icNumber - Inspection Call Number (e.g., "FM-IC-1767772023499")
 * @returns {Promise<Object>} Certificate data
 */
export const generateFinalCertificate = async (icNumber) => {
  try {
    console.log('🔍 Generating Final Material certificate for IC Number:', icNumber);

    // Use query parameter instead of path variable to handle slashes
    // URL-encode the IC number to handle special characters
    const encodedIcNumber = encodeURIComponent(icNumber);
    console.log('📝 Encoded IC Number:', encodedIcNumber);

    const response = await fetch(`${API_BASE_URL}/final-product?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to generate Final Material certificate: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Final Material certificate generated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error generating Final Material certificate:', error);
    throw error;
  }
};

/**
 * Generate Final Material Inspection Certificate by Call ID
 * @param {number} callId - Inspection Call ID
 * @returns {Promise<Object>} Certificate data
 */
export const generateFinalCertificateById = async (callId) => {
  try {
    console.log('🔍 Generating Final Material certificate for Call ID:', callId);

    const response = await fetch(`${API_BASE_URL}/final-product/by-id/${callId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to generate Final Material certificate: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Final Material certificate generated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error generating Final Material certificate:', error);
    throw error;
  }
};

/**
 * Download certificate as PDF (future implementation)
 * @param {string} icNumber - Inspection Call Number (will be URL-encoded automatically by generateRawMaterialCertificate)
 * @returns {Promise<Blob>} PDF blob
 */
export const downloadCertificatePDF = async (icNumber) => {
  try {
    console.log('🔍 Downloading certificate PDF for IC Number:', icNumber);

    // TODO: Implement PDF download endpoint when backend is ready
    // For now, we'll generate the certificate data and let the frontend handle PDF generation
    // Note: icNumber will be URL-encoded by generateRawMaterialCertificate
    const certificateData = await generateRawMaterialCertificate(icNumber);

    return certificateData;
  } catch (error) {
    console.error('❌ Error downloading certificate PDF:', error);
    throw error;
  }
};

/**
 * Health check for certificate service
 * @returns {Promise<string>} Health status
 */
export const checkCertificateServiceHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Certificate service is not available');
    }

    const data = await response.text();
    return data;
  } catch (error) {
    console.error('❌ Certificate service health check failed:', error);
    throw error;
  }
};

/**
 * Upload Signed IC to Azure Blob Storage
 * @param {Object} payload { icNumber, signedData, fileName, uploadedBy }
 * @returns {Promise<Object>} Upload response
 */
export const uploadSignedCertificate = async (payload) => {
  try {
    console.log('🔍 Uploading signed certificate to Azure for IC:', payload.icNumber);
    
    // Fallback to dynamic URL if API_ENDPOINTS.CERTIFICATE_STORAGE is not defined
    const url = API_ENDPOINTS.CERTIFICATE_STORAGE || `${API_ENDPOINTS.CERTIFICATES.replace('/certificate', '/certificate-storage')}`;
    const response = await fetch(`${url}/upload`, {
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
 * View/Download Signed IC from Azure Blob Storage
 * @param {string} icNumber 
 * @returns {Promise<Object>} { fileName, signedData }
 */
export const viewSignedCertificate = async (icNumber) => {
  try {
    console.log('🔍 Fetching signed certificate from Azure for IC:', icNumber);
    
    const url = API_ENDPOINTS.CERTIFICATE_STORAGE || `${API_ENDPOINTS.CERTIFICATES.replace('/certificate', '/certificate-storage')}`;
    const encodedIcNumber = encodeURIComponent(icNumber);
    const response = await fetch(`${url}/view?icNumber=${encodedIcNumber}`, {
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
 * Check if Signed IC exists in Azure Blob Storage
 * @param {string} icNumber 
 * @returns {Promise<boolean>} exists
 */
export const checkSignedCertificateExists = async (icNumber) => {
  try {
    const url = API_ENDPOINTS.CERTIFICATE_STORAGE || `${API_ENDPOINTS.CERTIFICATES.replace('/certificate', '/certificate-storage')}`;
    const encodedIcNumber = encodeURIComponent(icNumber);
    const response = await fetch(`${url}/check?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('❌ Error checking certificate existence:', error);
    return false;
  }
};



/**
 * Save or update Rm IC Edit Data
 * @param {Object} payload 
 */
export const saveRmIcEditData = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/rm-ic-edit')}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error saving IC edit data:', error);
    throw error;
  }
};

/**
 * Get Rm IC Edit Data
 * @param {string} icNumber 
 */
export const getRmIcEditData = async (icNumber) => {
  try {
    const encodedIcNumber = encodeURIComponent(icNumber);
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/rm-ic-edit')}?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null; // No content
    if (!response.ok) throw new Error('Failed to fetch IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching IC edit data:', error);
    return null;
  }
}

/**
 * Save or update Final IC Edit Data
 * @param {Object} payload 
 */
export const saveFinalIcEditData = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/final-ic-edit')}`, {
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
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/final-ic-edit')}?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null; // No content
    if (!response.ok) throw new Error('Failed to fetch Final IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Final IC edit data:', error);
    return null;
  }
};

/**
 * Save or update Process IC Edit Data
 * @param {Object} payload 
 */
export const saveProcessIcEditData = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/process-ic-edit')}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save Process IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error saving Process IC edit data:', error);
    throw error;
  }
};

/**
 * Get Process IC Edit Data
 * @param {string} icNumber 
 */
export const getProcessIcEditData = async (icNumber) => {
  try {
    const encodedIcNumber = encodeURIComponent(icNumber);
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/process-ic-edit')}?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null; // No content
    if (!response.ok) throw new Error('Failed to fetch Process IC edit data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Process IC edit data:', error);
    return null;
  }
};

/**
 * Save or update Rm IC Save Changes Data (Draft)
 * @param {Object} payload 
 */
export const saveRmIcSaveChanges = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/rm-ic-save-changes')}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save draft IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error saving draft IC changes:', error);
    throw error;
  }
};

/**
 * Get Rm IC Save Changes Data (Draft)
 * @param {string} icNumber 
 */
export const getRmIcSaveChanges = async (icNumber) => {
  try {
    const encodedIcNumber = encodeURIComponent(icNumber);
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/rm-ic-save-changes')}?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null; // No content
    if (!response.ok) throw new Error('Failed to fetch draft IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching draft IC changes:', error);
    return null;
  }
};

/**
 * Save or update Process IC Save Changes Data (Draft)
 * @param {Object} payload 
 */
export const saveProcessIcSaveChanges = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/process-ic-save-changes')}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save draft Process IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error saving draft Process IC changes:', error);
    throw error;
  }
};

/**
 * Get Process IC Save Changes Data (Draft)
 * @param {string} icNumber 
 */
export const getProcessIcSaveChanges = async (icNumber) => {
  try {
    const encodedIcNumber = encodeURIComponent(icNumber);
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/process-ic-save-changes')}?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null; // No content
    if (!response.ok) throw new Error('Failed to fetch draft Process IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching draft Process IC changes:', error);
    return null;
  }
};

/**
 * Save or update Final IC Save Changes Data (Draft)
 * @param {Object} payload 
 */
export const saveFinalIcSaveChanges = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/final-ic-save-changes')}`, {
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
    const response = await fetch(`${API_BASE_URL.replace('/api/certificate', '/api/final-ic-save-changes')}?icNumber=${encodedIcNumber}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (response.status === 204) return null; // No content
    if (!response.ok) throw new Error('Failed to fetch draft Final IC changes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching draft Final IC changes:', error);
    return null;
  }
};

/**
 * Validate Book No and Set No via Backend Proxy
 * @param {string} empNo
 * @param {string} bookNo
 * @param {string} setNo
 * @param {string} status "F" for Final, "S" for Stage (RM/Process)
 */
export const validateBookSetNo = async (empNo, bookNo, setNo, status = "F") => {
  try {
    const payload = {
      EMP_NO: empNo,
      BK_NO: bookNo,
      SET_NO: setNo,
      STATUS: status
    };
    
    // Use the backend proxy to bypass CORS
    const url = `${API_BASE_URL.replace('/api/certificate', '/api/ibs-validation')}/validate-book-set`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    } else {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(`Unexpected response: ${text}`);
      }
    }
  } catch (error) {
    console.error('Error validating Book/Set No:', error);
    throw error;
  }
};