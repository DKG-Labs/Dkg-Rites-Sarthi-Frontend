/**
 * Raw Material Inspection API Service
 *
 * Handles all API calls to the raw material inspection backend endpoints.
 * All endpoints are JWT protected.
 *
 * Tables Used:
 * - inspection_calls (main table)
 * - rm_inspection_details (RM-specific details)
 * - rm_heat_quantities (heat-wise breakdown)
 * - rm_chemical_analysis (chemical composition)
 */

import { getAuthToken } from '../authService';
import { API_ENDPOINTS } from '../apiConfig';

const API_BASE_URL = API_ENDPOINTS.RAW_MATERIAL;

/* ==================== Helper Functions ==================== */

/**
 * Get headers with JWT authentication
 * @returns {Object} Headers object with Authorization
 */
const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

/**
 * Handle API response and extract data
 * @param {Response} response - Fetch response object
 * @returns {Promise<any>} Response data
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        if (response.status === 401) {
            console.error('Unauthorized: Please login again');
            throw new Error('Unauthorized: Please login again');
        }
        throw new Error(`API Error: ${response.status}`);
    }
    const data = await response.json();
    return data.responseData;
};

/**
 * Format value for display - returns 'N/A' if null/undefined
 * @param {any} value - Value to format
 * @param {string} defaultValue - Default value if null/undefined
 * @returns {string} Formatted value
 */
export const formatValue = (value, defaultValue = 'N/A') => {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    return value;
};

/* ==================== Inspection Call APIs ==================== */

/**
 * Fetch all Raw Material inspection calls
 * @returns {Promise<Array>} List of all RM inspection calls
 */
export const fetchAllRawMaterialCalls = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/calls`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching RM calls:', error);
        return [];
    }
};

/**
 * Fetch Raw Material calls by status
 * @param {string} status - Status filter (PENDING, SCHEDULED, IN_PROGRESS, COMPLETED)
 * @returns {Promise<Array>} Filtered list of RM calls
 */
export const fetchRawMaterialCallsByStatus = async (status) => {
    try {
        const response = await fetch(`${API_BASE_URL}/calls/status/${status}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching RM calls by status ${status}:`, error);
        return [];
    }
};

/**
 * Fetch inspection call by ID with full details
 * @param {number} id - Inspection call ID
 * @returns {Promise<Object|null>} Complete call details
 */
export const fetchInspectionCallById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/calls/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching call by ID ${id}:`, error);
        return null;
    }
};

/**
 * Fetch inspection call by call number
 * @param {string} callNo - Unique call number
 * @returns {Promise<Object|null>} Call details
 */
export const fetchInspectionCallByCallNo = async (callNo) => {
    try {
        const response = await fetch(`${API_BASE_URL}/calls/call-no/${callNo}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching call by number ${callNo}:`, error);
        return null;
    }
};

/* ==================== RM Inspection Details APIs ==================== */

/**
 * Fetch RM inspection details by call ID
 * @param {number} callId - Parent call ID
 * @returns {Promise<Object|null>} RM-specific details
 */
export const fetchRmDetailsByCallId = async (callId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/details/call/${callId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching RM details for call ${callId}:`, error);
        return null;
    }
};

/* ==================== Heat Quantity APIs ==================== */

/**
 * Fetch all heat quantities for a call
 * @param {number} callId - Parent call ID
 * @returns {Promise<Array>} List of heat-wise quantity breakdown
 */
export const fetchHeatQuantitiesByCallId = async (callId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/heats/call/${callId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching heats for call ${callId}:`, error);
        return [];
    }
};

/**
 * Fetch heat quantity by ID with chemical analysis
 * @param {number} heatId - Heat quantity ID
 * @returns {Promise<Object|null>} Heat details with chemical composition
 */
export const fetchHeatQuantityById = async (heatId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/heats/${heatId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching heat by ID ${heatId}:`, error);
        return null;
    }
};

/* ==================== Chemical Analysis APIs ==================== */

/**
 * Fetch chemical analyses for a heat
 * @param {number} heatId - Parent heat ID
 * @returns {Promise<Array>} List of chemical element analyses
 */
export const fetchChemicalAnalysesByHeatId = async (heatId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chemical/heat/${heatId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching chemical analyses for heat ${heatId}:`, error);
        return [];
    }
};

/**
 * Fetch all chemical analyses for a call
 * @param {number} callId - Parent call ID
 * @returns {Promise<Array>} All chemical analyses across all heats
 */
export const fetchChemicalAnalysesByCallId = async (callId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chemical/call/${callId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching chemical analyses for call ${callId}:`, error);
        return [];
    }
};

/* ==================== Data Transformation ==================== */

/**
 * Transform API call data to landing page format
 * Maps backend field names (icNumber, companyName, etc.) to frontend expected format
 * Displays 'N/A' for missing fields
 * @param {Object} apiData - API response data from InspectionCallDto
 * @returns {Object} Transformed data for landing page display
 */
export const transformToLandingPageFormat = (apiData) => {
    // Map backend field names to frontend expected names
    return {
        id: `RM${String(apiData.id).padStart(3, '0')}`,
        call_no: formatValue(apiData.icNumber),                         // icNumber -> call_no
        po_no: formatValue(apiData.poNo),
        vendor_name: formatValue(apiData.companyName),                  // companyName -> vendor_name
        call_date: formatValue(apiData.createdAt),                      // createdAt -> call_date
        desired_inspection_date: formatValue(apiData.desiredInspectionDate),
        status: apiData.status === 'PENDING' ? 'Pending' : formatValue(apiData.status),
        product_type: apiData.typeOfCall === 'ERC-RAW MATERIAL' ? 'ERC-RAW MATERIAL' : 'Raw Material',
        stage: 'RM',
        po_date: formatValue(apiData.rmInspectionDetails?.subPoDate),   // From rm_details
        po_qty: formatValue(apiData.rmInspectionDetails?.itemQuantity), // From rm_details
        call_qty: apiData.rmHeatQuantities?.length || 0,                // Count of heats
        place_of_inspection: formatValue(apiData.placeOfInspection || apiData.unitAddress),
        delivery_period: formatValue(apiData.rmInspectionDetails?.deliveryPeriod),
        purchasing_authority: formatValue(apiData.rmInspectionDetails?.purchasingAuthority),
        bpo: formatValue(apiData.rmInspectionDetails?.bpo),
        remarks: formatValue(apiData.remarks),
        // Database ID for fetching details
        api_id: apiData.id,
        // Computed fields from heats
        total_heats: apiData.rmHeatQuantities?.length || 0,
        total_offered_qty_mt: formatValue(apiData.rmInspectionDetails?.totalOfferedQtyMt),
        pending_heats: apiData.rmHeatQuantities?.filter(h => h.status !== 'COMPLETED').length || 0,
        completed_heats: apiData.rmHeatQuantities?.filter(h => h.status === 'COMPLETED').length || 0,
        // Nested data for dashboard
        rm_details: apiData.rmInspectionDetails || null,
        rm_heats: apiData.rmHeatQuantities || [],
        // Additional fields
        unit_name: formatValue(apiData.unitName),
        unit_address: formatValue(apiData.unitAddress),
        company_id: apiData.companyId,
        unit_id: apiData.unitId
    };
};

/**
 * Fetch and transform all RM calls for landing page
 * @returns {Promise<Array>} Transformed list for landing page display
 */
export const fetchTransformedRawMaterialCalls = async () => {
    try {
        const calls = await fetchAllRawMaterialCalls();
        return calls.map(transformToLandingPageFormat);
    } catch (error) {
        console.error('Error fetching transformed RM calls:', error);
        return [];
    }
};

/**
 * Fetch pending RM calls for landing page
 * @returns {Promise<Array>} Transformed pending calls
 */
export const fetchPendingRawMaterialCalls = async () => {
    try {
        const calls = await fetchRawMaterialCallsByStatus('PENDING');
        return calls.map(transformToLandingPageFormat);
    } catch (error) {
        console.error('Error fetching pending RM calls:', error);
        return [];
    }
};

