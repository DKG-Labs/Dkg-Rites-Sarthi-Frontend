import { API_ENDPOINTS, API_BASE_URL } from './apiConfig';
import { getAuthHeaders, handleResponse } from './apiConfig';

const FINAL_MATERIAL_BASE_URL = API_ENDPOINTS.FINAL_MATERIAL;
const FINAL_INSPECTION_SUBMODULES_BASE_URL = `${API_BASE_URL}/api/final-inspection/submodules`;

/**
 * Save Visual Inspection data
 * POST /api/final-material/visual-inspection
 * @param {Object} data - Visual inspection data
 */
export const saveVisualInspection = async (data) => {
  try {
    const response = await fetch(`${FINAL_MATERIAL_BASE_URL}/visual-inspection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving visual inspection:', error);
    throw error;
  }
};

/**
 * Get Visual Inspection by call number
 * GET /api/final-material/visual-inspection/call/{callNo}
 * @param {string} callNo - Inspection call number
 */
export const getVisualInspectionByCallNo = async (callNo) => {
  try {
    const response = await fetch(`${FINAL_MATERIAL_BASE_URL}/visual-inspection/call/${encodeURIComponent(callNo)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching visual inspection:', error);
    throw error;
  }
};

/**
 * Get Visual Inspection by call and lot number
 * GET /api/final-material/visual-inspection/call/{callNo}/lot/{lotNo}
 */
export const getVisualInspectionByCallNoAndLotNo = async (callNo, lotNo) => {
  try {
    const response = await fetch(
      `${FINAL_MATERIAL_BASE_URL}/visual-inspection/call/${encodeURIComponent(callNo)}/lot/${encodeURIComponent(lotNo)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching visual inspection by lot:', error);
    throw error;
  }
};

/**
 * Update Visual Inspection
 * PUT /api/final-material/visual-inspection
 */
export const updateVisualInspection = async (data) => {
  try {
    const response = await fetch(`${FINAL_MATERIAL_BASE_URL}/visual-inspection`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating visual inspection:', error);
    throw error;
  }
};

/**
 * Save Dimensional Inspection data
 * POST /api/final-material/dimensional-inspection
 */
export const saveDimensionalInspection = async (data) => {
  try {
    const response = await fetch(`${FINAL_MATERIAL_BASE_URL}/dimensional-inspection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving dimensional inspection:', error);
    throw error;
  }
};

/**
 * Get Dimensional Inspection by call number
 * GET /api/final-material/dimensional-inspection/call/{callNo}
 */
export const getDimensionalInspectionByCallNo = async (callNo) => {
  try {
    const response = await fetch(`${FINAL_MATERIAL_BASE_URL}/dimensional-inspection/call/${encodeURIComponent(callNo)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching dimensional inspection:', error);
    throw error;
  }
};

/**
 * Get Dimensional Inspection by call and lot number
 * GET /api/final-material/dimensional-inspection/call/{callNo}/lot/{lotNo}
 */
export const getDimensionalInspectionByCallNoAndLotNo = async (callNo, lotNo) => {
  try {
    const response = await fetch(
      `${FINAL_MATERIAL_BASE_URL}/dimensional-inspection/call/${encodeURIComponent(callNo)}/lot/${encodeURIComponent(lotNo)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching dimensional inspection by lot:', error);
    throw error;
  }
};

/**
 * Update Dimensional Inspection
 * PUT /api/final-material/dimensional-inspection
 */
export const updateDimensionalInspection = async (data) => {
  try {
    const response = await fetch(`${FINAL_MATERIAL_BASE_URL}/dimensional-inspection`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating dimensional inspection:', error);
    throw error;
  }
};

// ===== DIMENSIONAL INSPECTION FLAT (FOR VISUAL INSPECTION PAGE) =====

/**
 * Save Dimensional Inspection data (Flat Structure)
 * POST /api/final-inspection/submodules/dimensional-inspection-flat
 * Used by Final Visual Inspection page
 */
export const saveDimensionalInspectionFlat = async (data) => {
  try {
    const response = await fetch(`${FINAL_INSPECTION_SUBMODULES_BASE_URL}/dimensional-inspection-flat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving dimensional inspection (flat):', error);
    throw error;
  }
};

/**
 * Get Dimensional Inspection (Flat) by call number
 * GET /api/final-inspection/submodules/dimensional-inspection-flat/call/{callNo}
 */
export const getDimensionalInspectionFlatByCallNo = async (callNo) => {
  try {
    const response = await fetch(`${FINAL_INSPECTION_SUBMODULES_BASE_URL}/dimensional-inspection-flat/call/${encodeURIComponent(callNo)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching dimensional inspection (flat):', error);
    throw error;
  }
};

/**
 * Get Dimensional Inspection (Flat) by ID
 * GET /api/final-inspection/submodules/dimensional-inspection-flat/{id}
 */
export const getDimensionalInspectionFlatById = async (id) => {
  try {
    const response = await fetch(`${FINAL_INSPECTION_SUBMODULES_BASE_URL}/dimensional-inspection-flat/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching dimensional inspection (flat) by ID:', error);
    throw error;
  }
};

/**
 * Update Dimensional Inspection (Flat)
 * PUT /api/final-inspection/submodules/dimensional-inspection-flat/{id}
 */
export const updateDimensionalInspectionFlat = async (id, data) => {
  try {
    const response = await fetch(`${FINAL_INSPECTION_SUBMODULES_BASE_URL}/dimensional-inspection-flat/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating dimensional inspection (flat):', error);
    throw error;
  }
};

/**
 * Delete Dimensional Inspection (Flat)
 * DELETE /api/final-inspection/submodules/dimensional-inspection-flat/{id}
 */
export const deleteDimensionalInspectionFlat = async (id) => {
  try {
    const response = await fetch(`${FINAL_INSPECTION_SUBMODULES_BASE_URL}/dimensional-inspection-flat/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting dimensional inspection (flat):', error);
    throw error;
  }
};

