/**
 * Workflow Service
 * Handles fetching workflow-related data
 */

import { API_BASE_URL } from './api';

/**
 * Standardizes API response handling for both HTTP and business-level errors.
 * Throws a user-friendly error if the backend reports a failure.
 */
const handleRawResponse = async (response, fallbackMsg = "System encountered an error") => {
  if (!response.ok) {
    // Attempt to extract structured error message from JSON
    let errorMessage = fallbackMsg;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errJson = await response.json();
        errorMessage = errJson.responseStatus?.message || errJson.message || fallbackMsg;
      } else {
        // Handle non-JSON errors (e.g. 500 Internal Server Error page)
        console.warn(`Server returned non-JSON error (${response.status}): ${response.statusText}`);
        errorMessage = `${fallbackMsg} (Server Error ${response.status})`;
      }
    } catch (e) {
      console.error("Error parsing error response:", e);
    }
    throw new Error(errorMessage);
  }

  // Handle successful response (200 OK)
  let json;
  try {
    json = await response.json();
  } catch (e) {
    console.error("Error parsing success response JSON:", e);
    throw new Error("Unable to parse server response. Please contact support.");
  }
  
  // Check for business-level errors embedded in success response
  if (json.responseStatus && (json.responseStatus.errorType === 'error' || (json.responseStatus.statusCode !== 0 && json.responseStatus.statusCode !== 200))) {
    throw new Error(json.responseStatus.message || fallbackMsg);
  }

  // return actual data
  return json.responseData !== undefined ? json.responseData : json;
};

/**
 * Fetch all completed workflow calls
 * @returns {Promise<Array>} List of completed workflow transitions
 */
export const getAllCompletedCalls = async (userId = '') => {
  try {
    const token = localStorage.getItem('authToken');
    const url = `${API_BASE_URL}/sleeper-workflow/allCompletedCalls${userId ? `?assignedTo=${userId}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch completed calls');
    }

    const data = await response.json();
    // Based on the structure provided by user, response might be a direct array 
    // or wrapped in a responseData object. Assuming direct array or data.responseData.
    return data.responseData?.responseData || data.responseData || data;
  } catch (error) {
    console.error('Error fetching completed calls:', error);
    return [];
  }
};
/**
 * Fetch detailed material information by requestId
 * @param {string} type - Material type (e.g., 'cement', 'aggregates')
 * @param {string} requestId - The request ID from the workflow call
 * @returns {Promise<Object>} Detailed material data
 */
export const getMaterialDetail = async (type, requestId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/${type}/${requestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} details`);
    }

    const data = await response.json();
    return data.responseData || data;
  } catch (error) {
    console.error(`Error fetching ${type} details:`, error);
    return null;
  }
};

/**
 * Fetch Company Units mapping by User ID
 * @param {number|string} userId
 * @returns {Promise<Object>} Company name(s) and unit(s) mapped
 */
export const getCompanyMappingByUser = async (userId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/sleeper-mapping/company-units/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch company mapping details');
    }

    const data = await response.json();
    return data.responseData || data;
  } catch (error) {
    console.error('Error fetching company mapping details:', error);
    return null;
  }
};

/**
 * Fetch distinct sheds by vendor code and plant unit
 * @param {string|number} vendorId
 * @param {string} plantId
 * @returns {Promise<Array>} List of distinct shed numbers
 */
export const getShedsByVendorCode = async (vendorId, plantId) => {
  try {
    const token = localStorage.getItem('authToken');
    // Using the unusual literal path parameters as required by the backend
    const url = `${API_BASE_URL}/plant-profile/vendor/{vendorId}/{plantId}/sheds?vendorId=${vendorId}&plantId=${encodeURIComponent(plantId)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sheds for vendor');
    }

    const data = await response.json();
    return data.responseData || data;
  } catch (error) {
    console.error('Error fetching sheds strictly for vendor:', error);
    return [];
  }
};

/**
 * Fetch all Production Declarations
 * @returns {Promise<Array>} List of production declarations
 */
export const getProductionDeclarations = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/production-declaration/getAll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch production declarations');
    }

    const data = await response.json();
    return data.responseData || data;
  } catch (error) {
    console.error('Error fetching production declarations:', error);
    return [];
  }
};

/**
 * Fetch Production Declarations by a specific user (fast, filtered at DB level)
 * @param {number|string} userId - The user ID (createdBy)
 * @returns {Promise<Array>} List of production declarations for that user
 */
export const getProductionDeclarationsByUser = async (userId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/production-declaration/getByUser/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch production declarations for user');
    }

    const data = await response.json();
    return data.responseData || data;
  } catch (error) {
    console.error('Error fetching production declarations by user:', error);
    return [];
  }
};

/**
 * Save Water Cube Sample Declaration (Create or Update)
 * @param {Object} data - Declaration data
 * @param {number|string} [id] - Optional ID for update
 * @returns {Promise<Object>} Saved declaration
 */
export const saveWaterCubeSample = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id
      ? `${API_BASE_URL}/water-cube-sample/update/${id}`
      : `${API_BASE_URL}/water-cube-sample/create`;

    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to save water cube sample declaration');
    }

    const result = await response.json();
    return result.responseData || result;
  } catch (error) {
    console.error('Error saving water cube sample declaration:', error);
    throw error;
  }
};

/**
 * Fetch Water Cube Sample Declarations by User
 * @param {number|string} userId - User ID
 * @returns {Promise<Array>} List of declarations
 */
export const getWaterCubeSamplesByUser = async (userId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/water-cube-sample/getByUser/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch water cube sample declarations');
    }

    const data = await response.json();
    return data.responseData || data;
  } catch (error) {
    console.error('Error fetching water cube sample declarations:', error);
    return [];
  }
};

/**
 * Fetch all Water Cube Sample Declarations
 * @returns {Promise<Array>} List of declarations
 */
export const getWaterCubeSamples = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/water-cube-sample/getAll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch all water cube sample declarations');
    }

    const data = await response.json();
    return data.responseData || data;
  } catch (error) {
    console.error('Error fetching all water cube sample declarations:', error);
    return [];
  }
};

/**
 * Delete Water Cube Sample Declaration
 * @param {number|string} id - Declaration ID
 * @returns {Promise<void>}
 */
export const deleteWaterCubeSample = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/water-cube-sample/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete water cube sample declaration');
    }
  } catch (error) {
    console.error('Error deleting water cube sample declaration:', error);
    throw error;
  }
};
/**
 * Save Cement 7 Day Strength test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveCement7DayStrength = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id ? `${API_BASE_URL}/cement-7-day-strength/${id}` : `${API_BASE_URL}/cement-7-day-strength`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save 7 Day Strength record');
  } catch (error) {
    console.error('Error saving 7 Day Strength:', error);
    throw error;
  }
};
/**
 * Save Cement Normal Consistency test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveCementNormalConsistency = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id ? `${API_BASE_URL}/cement-normal-consistency/${id}` : `${API_BASE_URL}/cement-normal-consistency`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Normal Consistency record');
  } catch (error) {
    console.error('Error saving Normal Consistency:', error);
    throw error;
  }
};

/**
 * Save Cement Specific Surface test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveCementSpecificSurface = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id ? `${API_BASE_URL}/cement-specific-surface/${id}` : `${API_BASE_URL}/cement-specific-surface`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Specific Surface record');
  } catch (error) {
    console.error('Error saving Specific Surface:', error);
    throw error;
  }
};

/**
 * Save Cement Setting Time test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveCementSettingTime = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id 
        ? `${API_BASE_URL}/cement-setting-time/${id}` 
        : `${API_BASE_URL}/cement-setting-time`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Setting Time record');
  } catch (error) {
    console.error('Error saving Setting Time:', error);
    throw error;
  }
};

/**
 * Save Cement Fineness test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveCementFineness = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id 
        ? `${API_BASE_URL}/cement-fineness/${id}` 
        : `${API_BASE_URL}/cement-fineness`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Fineness record');
  } catch (error) {
    console.error('Error saving Fineness:', error);
    throw error;
  }
};

export const getCementBulkStatus = async (requestIds) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/cement-status/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestIds)
        });
        if (!response.ok) throw new Error('Failed to fetch bulk status');
        const data = await response.json();
        return data.responseData || data;
    } catch (error) {
        console.error('Error fetching bulk status:', error);
        return {};
    }
};

const getCementDataByRequestId = async (endpoint, requestId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/${endpoint}/request/${requestId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // We return null if business error here to avoid crashing UI when data just doesn't exist yet
        try {
            return await handleRawResponse(response, `Failed to fetch ${endpoint} by request ID`);
        } catch (err) {
            console.log(`No existing record for ${endpoint}:`, err.message);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching ${endpoint} by request ID:`, error);
        return null;
    }
};

const getDataById = async (endpoint, id) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.responseData || data;
    } catch (error) {
        console.error(`Error fetching ${endpoint} by id:`, error);
        return null;
    }
};

export const getCement7DayStrengthById = (id) => getDataById('cement-7-day-strength', id);
export const getCementNormalConsistencyById = (id) => getDataById('cement-normal-consistency', id);
export const getCementSpecificSurfaceById = (id) => getDataById('cement-specific-surface', id);
export const getCementSettingTimeById = (id) => getDataById('cement-setting-time', id);
export const getCementFinenessById = (id) => getDataById('cement-fineness', id);

export const getCement7DayStrengthByReqId = (reqId) => getCementDataByRequestId('cement-7-day-strength', reqId);
export const getCementNormalConsistencyByReqId = (reqId) => getCementDataByRequestId('cement-normal-consistency', reqId);
export const getCementSpecificSurfaceByReqId = (reqId) => getCementDataByRequestId('cement-specific-surface', reqId);
export const getCementSettingTimeByReqId = (reqId) => getCementDataByRequestId('cement-setting-time', reqId);
export const getCementFinenessByReqId = (reqId) => getCementDataByRequestId('cement-fineness', reqId);

/**
 * Save Aggregate 10mm Quality test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveAggregate10mmQuality = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id ? `${API_BASE_URL}/aggregate-10mm-quality/${id}` : `${API_BASE_URL}/aggregate-10mm-quality`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save 10mm Quality record');
  } catch (error) {
    console.error('Error saving 10mm Quality:', error);
    throw error;
  }
};

/**
 * Save Aggregate 20mm Quality test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveAggregate20mmQuality = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id ? `${API_BASE_URL}/aggregate-20mm-quality/${id}` : `${API_BASE_URL}/aggregate-20mm-quality`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save 20mm Quality record');
  } catch (error) {
    console.error('Error saving 20mm Quality:', error);
    throw error;
  }
};

/**
 * Save Aggregate Flakiness & Elongation test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveAggregateFlakiness = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id ? `${API_BASE_URL}/aggregate-flakiness/${id}` : `${API_BASE_URL}/aggregate-flakiness`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Flakiness record');
  } catch (error) {
    console.error('Error saving Flakiness:', error);
    throw error;
  }
};

/**
 * Save Aggregate Granulometric Curve test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveAggregateGranulometric = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id ? `${API_BASE_URL}/aggregate-granulometric/${id}` : `${API_BASE_URL}/aggregate-granulometric`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Granulometric record');
  } catch (error) {
    console.error('Error saving Granulometric:', error);
    throw error;
  }
};

/**
 * Save Aggregate Soundness test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveAggregateSoundness = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const url = id ? `${API_BASE_URL}/aggregate-soundness/${id}` : `${API_BASE_URL}/aggregate-soundness`;
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Soundness record');
  } catch (error) {
    console.error('Error saving Soundness:', error);
    throw error;
  }
};

// Aggregate Status & Fetch Methods
export const getAggregateBulkStatus = async (requestIds) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/aggregate-status/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestIds)
    });
    if (!response.ok) throw new Error('Failed to fetch aggregate statuses');
    const result = await response.json();
    return result.responseData || {};
  } catch (error) {
    console.error('Error fetching aggregate bulk status:', error);
    return {};
  }
};

export const getAggregate10mmQualityById = (id) => getDataById('aggregate-10mm-quality', id);
export const getAggregate20mmQualityById = (id) => getDataById('aggregate-20mm-quality', id);
export const getAggregateFlakinessById = (id) => getDataById('aggregate-flakiness', id);
export const getAggregateFlakinessElongationById = getAggregateFlakinessById;
export const getAggregateGranulometricById = (id) => getDataById('aggregate-granulometric', id);
export const getAggregateGranulometricCurveById = getAggregateGranulometricById;
export const getAggregateSoundnessById = (id) => getDataById('aggregate-soundness', id);

const getAggregateDataByRequestId = async (endpoint, requestId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/${endpoint}/request/${requestId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    try {
      return await handleRawResponse(response, `Failed to fetch ${endpoint} by request ID`);
    } catch (err) {
      console.log(`No existing record for ${endpoint}:`, err.message);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
};

export const getAggregate10mmQualityByReqId = (requestId) => getAggregateDataByRequestId('aggregate-10mm-quality', requestId);
export const getAggregate20mmQualityByReqId = (requestId) => getAggregateDataByRequestId('aggregate-20mm-quality', requestId);
export const getAggregateFlakinessByReqId = (requestId) => getAggregateDataByRequestId('aggregate-flakiness', requestId);
export const getAggregateGranulometricByReqId = (requestId) => getAggregateDataByRequestId('aggregate-granulometric', requestId);
export const getAggregateSoundnessByReqId = (requestId) => getAggregateDataByRequestId('aggregate-soundness', requestId);

/**
 * Save Admixture test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveAdmixtureTest = async (data) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/admixture-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Admixture record');
  } catch (error) {
    console.error('Error saving Admixture:', error);
    throw error;
  }
};

/**
 * Save HTS Wire Daily test result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveHtsWireDailyTest = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const method = id ? 'PUT' : 'POST';
    const url = id
        ? `${API_BASE_URL}/hts-wire-daily-test/${id}`
        : `${API_BASE_URL}/hts-wire-daily-test`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save HTS Wire Daily record');
  } catch (error) {
    console.error('Error saving HTS Wire:', error);
    throw error;
  }
};

export const getHtsWireDailyTestByReqId = async (requestId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/hts-wire-daily-test/request/${requestId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    try {
        return await handleRawResponse(response, 'Failed to fetch HTS Wire Daily test by request ID');
    } catch (err) {
        console.log("No existing HTS Wire test:", err.message);
        return null;
    }
  } catch (error) {
    console.error('Error fetching HTS wire test:', error);
    return null;
  }
};

/**
 * Save SGCI Insert Audit result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveSgciInsertAudit = async (data, id = null) => {
  try {
    const token = localStorage.getItem('authToken');
    const method = id ? 'PUT' : 'POST';
    const url = id
        ? `${API_BASE_URL}/sgci-insert-audit/${id}`
        : `${API_BASE_URL}/sgci-insert-audit`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save SGCI Insert Audit record');
  } catch (error) {
    console.error('Error saving SGCI Audit:', error);
    throw error;
  }
};

export const getSgciInsertAuditByRequestId = async (requestId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/sgci-insert-audit/request/${requestId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    try {
        return await handleRawResponse(response, 'Failed to fetch SGCI Insert Audit record by request ID');
    } catch (err) {
        console.log("No existing SGCI Audit:", err.message);
        return null;
    }
  } catch (error) {
    console.error('Error fetching SGCI Audit Details:', error);
    return null;
  }
};

export const getSgciInsertAuditById = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/sgci-insert-audit/${id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    try {
        return await handleRawResponse(response, 'Failed to fetch SGCI Insert Audit record by ID');
    } catch (err) {
        console.log("Error fetching SGCI by ID:", err.message);
        return null;
    }
  } catch (error) {
    console.error('Error fetching SGCI Audit Details by ID:', error);
    return null;
  }
};

export const deleteSgciInsertAudit = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/sgci-insert-audit/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await handleRawResponse(response, 'Failed to delete SGCI Insert Audit record');
  } catch (error) {
    console.error('Error deleting SGCI Audit record:', error);
    throw error;
  }
};

/**
 * Save Water Cube Test Result
 * @param {Object} data - Test data record
 * @returns {Promise<Object>} Saved record
 */
export const saveWaterCubeTestResult = async (data) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/water-cube-sample/save-test-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return await handleRawResponse(response, 'Failed to save Water Cube Test Result');
  } catch (error) {
    console.error('Error saving Water Cube Test Result:', error);
    throw error;
  }
};

/**
 * Get Water Cube Test Results by user ID
 * @param {Long} userId - user ID
 * @returns {Promise<Array>} List of results
 */
export const getWaterCubeTestResultsByUser = async (userId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/water-cube-sample/test-results/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Water Cube Test Results');
    }

    const result = await response.json();
    return result.responseData || result;
  } catch (error) {
    console.error('Error fetching Water Cube Test Results:', error);
    return [];
  }
};

/**
 * Get all Water Cube Test Results
 * @returns {Promise<Array>} List of all records
 */
export const getAllWaterCubeTests = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/water-cube-sample/getAllTests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch all Water Cube tests');
    }

    const result = await response.json();
    return result.responseData || result;
  } catch (error) {
    console.error('Error fetching all Water Cube tests:', error);
    return [];
  }
};

/**
 * Delete Water Cube Test Result
 * @param {number|string} id - Test ID
 * @returns {Promise<void>}
 */
export const deleteWaterCubeTest = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/water-cube-sample/testDelete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete Water Cube Test');
    }
  } catch (error) {
    console.error('Error deleting Water Cube Test:', error);
    throw error;
  }
};

/**
 * Update Water Cube Test Result
 * @param {Object} data - Updated test data
 * @param {number|string} id - Test ID
 * @returns {Promise<Object>} Saved record
 */
export const updateWaterCubeTest = async (data, id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/water-cube-sample/updateTest/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update Water Cube test result');
    }

    const result = await response.json();
    return result.responseData || result;
  } catch (error) {
    console.error('Error updating Water Cube test result:', error);
    throw error;
  }
};

/**
 * Get Batch Numbers for Compaction filtered by plantId and createdBy
 */
export const getBatchNosForCompaction = async (params) => {
  try {
    const token = localStorage.getItem('authToken');
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/batch-weighment/batchNosForCompaction?${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batch numbers for compaction');
    }

    const data = await response.json();
    return data.responseData || [];
  } catch (error) {
    console.error('Error fetching batch numbers for compaction:', error);
    return [];
  }
};

/**
 * Generic Fetch for Periodic Testing Data
 */
const getPeriodicData = async (endpoint) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/${endpoint}/periodic`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error(`Failed to fetch periodic ${endpoint}`);
        const data = await response.json();
        return data.responseData || data;
    } catch (error) {
        console.error(`Error fetching periodic ${endpoint}:`, error);
        return [];
    }
};

// Cement Periodic Fetchers
export const getPeriodicCement7DayStrength = () => getPeriodicData('cement-7-day-strength');
export const getPeriodicCementNormalConsistency = () => getPeriodicData('cement-normal-consistency');
export const getPeriodicCementSpecificSurface = () => getPeriodicData('cement-specific-surface');
export const getPeriodicCementSettingTime = () => getPeriodicData('cement-setting-time');
export const getPeriodicCementFineness = () => getPeriodicData('cement-fineness');

// Aggregate Periodic Fetchers
export const getPeriodicAggregate10mmQuality = () => getPeriodicData('aggregate-10mm-quality');
export const getPeriodicAggregate20mmQuality = () => getPeriodicData('aggregate-20mm-quality');
export const getPeriodicAggregateFlakiness = () => getPeriodicData('aggregate-flakiness');
export const getPeriodicAggregateGranulometric = () => getPeriodicData('aggregate-granulometric');
export const getPeriodicAggregateSoundness = () => getPeriodicData('aggregate-soundness');

/**
 * Generic Delete for Periodic Records
 */
export const deletePeriodicRecord = async (endpoint, id) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete record');
        return true;
    } catch (error) {
        console.error('Error deleting periodic record:', error);
        throw error;
    }
};
