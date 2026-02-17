/**
 * Service for ERC Process Inspection API calls
 * Handles all Process stage inspection data fetching and submission
 */

import { API_ENDPOINTS } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.PROCESS_MATERIAL; // Process Material Inspection endpoints
const VENDOR_API_URL = API_ENDPOINTS.INSPECTION_REQUESTS;

/**
 * Fetch all Process type inspection requests from vendor API
 * @returns {Promise<Array>} List of Process inspection requests
 */
export const fetchAllProcessInspectionRequests = async () => {
    try {
        const response = await fetch(VENDOR_API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch inspection requests');
        }

        const data = await response.json();
        const allRequests = data.responseData || [];
        // Filter only ERC Process type calls
        return allRequests.filter(item => item.typeOfCall === 'ERC Process');
    } catch (error) {
        console.error('Error fetching process inspection requests:', error);
        return [];
    }
};

/**
 * Fetch Process inspection request by ID
 * @param {number} id - Inspection request ID
 * @returns {Promise<Object|null>} Inspection request details
 */
export const fetchProcessInspectionRequestById = async (id) => {
    try {
        const response = await fetch(`${VENDOR_API_URL}/${id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch process inspection request');
        }

        const data = await response.json();
        return data.responseData || null;
    } catch (error) {
        console.error('Error fetching process inspection request:', error);
        return null;
    }
};

/**
 * Transform API response to match the frontend call format for Process
 * @param {Object} apiData - API response data
 * @returns {Object} Transformed data matching frontend format
 */
export const transformApiDataToProcessCallFormat = (apiData) => {
    const callNo = `CALL-PROC-${apiData.id.toString().padStart(3, '0')}`;

    return {
        id: `PROC${apiData.id.toString().padStart(3, '0')}`,
        call_no: callNo,
        po_no: apiData.poNo,
        vendor_name: apiData.companyName,
        call_date: apiData.createdAt ? apiData.createdAt.split('T')[0] : null,
        desired_inspection_date: apiData.desiredInspectionDate,
        status: apiData.status === 'PENDING' ? 'Pending' : apiData.status,
        product_type: 'ERC Process',
        stage: 'Process Inspection',
        po_date: apiData.poDate,
        po_qty: apiData.poQty,
        call_qty: apiData.rmOfferedQtyErc || 0,
        rate: 18000,
        place_of_inspection: apiData.unitAddress || 'Vendor Site',
        delivery_period: apiData.deliveryPeriod || '45 days',
        purchasing_authority: apiData.purchasingAuthority || 'N/A',
        bpo: apiData.bpo || 'N/A',
        inspection_fees_payment_details: apiData.inspectionFeesPaymentDetails || null,
        billing_status: null,
        ic_issued: false,
        ic_date: null,
        bill_no: null,
        bill_date: null,
        bill_amount: null,
        advance_payment: false,
        // Process specific fields
        po_description: apiData.poDescription,
        po_serial_no: apiData.poSerialNo,
        unit_name: apiData.unitName,
        unit_contact_person: apiData.unitContactPerson,
        heat_numbers: apiData.rmHeatNumbers,
        rm_heat_tc_mapping: apiData.rmHeatTcMapping || [],
        total_offered_qty_mt: apiData.rmTotalOfferedQtyMt,
        chemical_composition: {
            carbon: apiData.rmChemicalCarbon,
            manganese: apiData.rmChemicalManganese,
            silicon: apiData.rmChemicalSilicon,
            sulphur: apiData.rmChemicalSulphur,
            phosphorus: apiData.rmChemicalPhosphorus,
            chromium: apiData.rmChemicalChromium
        },
        remarks: apiData.remarks,
        api_id: apiData.id,
        company_name: apiData.companyName,
        company_id: apiData.companyId,
        cin: apiData.cin,
        unit_id: apiData.unitId,
        unit_address: apiData.unitAddress,
        unit_gstin: apiData.unitGstin,
        unit_role: apiData.unitRole,
        amendment_no: apiData.amendmentNo,
        amendment_date: apiData.amendmentDate,
        vendor_contact_name: apiData.vendorContactName,
        vendor_contact_phone: apiData.vendorContactPhone,
        qty_already_inspected_rm: apiData.qtyAlreadyInspectedRm,
        qty_already_inspected_process: apiData.qtyAlreadyInspectedProcess,
        qty_already_inspected_final: apiData.qtyAlreadyInspectedFinal
    };
};

/**
 * Fetch and transform all pending ERC Process inspection requests
 * @returns {Promise<Array>} Transformed list matching frontend format
 */
export const fetchTransformedPendingProcessCalls = async () => {
    try {
        const processCalls = await fetchAllProcessInspectionRequests();
        return processCalls.map(item => transformApiDataToProcessCallFormat(item));
    } catch (error) {
        console.error('Error fetching transformed process calls:', error);
        return [];
    }
};

/**
 * Get auth headers for API calls
 * @returns {Object} Headers with auth token
 */
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
});

/**
 * Handle API response and throw error if not ok
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Parsed JSON response
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.errorMessage || 'API request failed');
    }
    return response.json();
};

/**
 * Save Process inspection data when inspector finishes
 * @param {Object} data - Complete inspection data payload
 * @param {String} userId - User ID of logged in user
 * @returns {Promise<Object>} API response
 */
export const finishProcessInspection = async (data, userId) => {
    const url = userId ? `${API_BASE_URL}/finish?userId=${userId}` : `${API_BASE_URL}/finish`;
    const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    const result = await handleResponse(response);
    return result.responseData;
};

/**
 * Pause Process inspection - saves data without changing status
 * @param {Object} data - Complete inspection data payload
 * @param {String} userId - User ID of logged in user
 * @returns {Promise<Object>} API response
 */
export const pauseProcessInspection = async (data, userId) => {
    const url = userId ? `${API_BASE_URL}/pause?userId=${userId}` : `${API_BASE_URL}/pause`;
    const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    const result = await handleResponse(response);
    return result.responseData;
};

/**
 * Get Process inspection data by call number
 * @param {string} callNo - Inspection call number
 * @returns {Promise<Object|null>} Inspection data
 */
export const getProcessInspectionByCallNo = async (callNo) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(callNo)}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        return data.responseData || null;
    } catch (error) {
        console.error('Error fetching process inspection data:', error);
        return null;
    }
};

