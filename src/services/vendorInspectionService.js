/**
 * Service for Vendor Inspection Request API calls
 * Handles Raw Material inspection data fetching from the backend
 *
 * Note: For Process inspection, use processInspectionService.js
 */

import { API_ENDPOINTS, API_BASE_URL as API_ROOT } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.INSPECTION_REQUESTS;

/**
 * Fetch all pending inspection requests
 * @returns {Promise<Array>} List of vendor inspection requests
 */
export const fetchAllInspectionRequests = async () => {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch inspection requests');
        }

        const data = await response.json();
        return data.responseData || [];
    } catch (error) {
        console.error('Error fetching inspection requests:', error);
        return [];
    }
};

/**
 * Fetch pending inspection requests only
 * @returns {Promise<Array>} List of pending vendor inspection requests
 */
export const fetchPendingInspectionRequests = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/status/PENDING`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pending inspection requests');
        }

        const data = await response.json();
        return data.responseData || [];
    } catch (error) {
        console.error('Error fetching pending inspection requests:', error);
        return [];
    }
};

/**
 * Fetch inspection request by ID
 * @param {number} id - Inspection request ID
 * @returns {Promise<Object|null>} Inspection request details
 */
export const fetchInspectionRequestById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch inspection request');
        }

        const data = await response.json();
        return data.responseData || null;
    } catch (error) {
        console.error('Error fetching inspection request:', error);
        return null;
    }
};

/**
 * Transform API response to match the MOCK_INSPECTION_CALLS format for Raw Material
 * @param {Object} apiData - API response data
 * @returns {Object} Transformed data matching mock format
 */
export const transformApiDataToCallFormat = (apiData) => {
    const callNo = `CALL-RM-${apiData.id.toString().padStart(3, '0')}`;

    return {
        id: `RM${apiData.id.toString().padStart(3, '0')}`,
        call_no: callNo,
        po_no: apiData.poNo,
        vendor_name: apiData.companyName,
        call_date: apiData.createdAt ? apiData.createdAt.split('T')[0] : null,
        desired_inspection_date: apiData.desiredInspectionDate,
        status: apiData.status === 'PENDING' ? 'Pending' : apiData.status,
        product_type: 'Raw Material',
        stage: 'RM',
        po_date: apiData.poDate,
        po_qty: apiData.poQty,
        call_qty: apiData.rmOfferedQtyErc || 0,
        rate: 15000,
        place_of_inspection: apiData.unitAddress || 'Factory',
        delivery_period: apiData.deliveryPeriod || '30 days',
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
        // Additional raw material specific fields
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
        // Company and unit information
        company_name: apiData.companyName,
        company_id: apiData.companyId,
        cin: apiData.cin,
        unit_id: apiData.unitId,
        unit_address: apiData.unitAddress,
        unit_gstin: apiData.unitGstin,
        unit_role: apiData.unitRole,
        // Amendment info
        amendment_no: apiData.amendmentNo,
        amendment_date: apiData.amendmentDate,
        // Vendor contact
        vendor_contact_name: apiData.vendorContactName,
        vendor_contact_phone: apiData.vendorContactPhone,
        // Quantities
        qty_already_inspected_rm: apiData.qtyAlreadyInspectedRm,
        qty_already_inspected_process: apiData.qtyAlreadyInspectedProcess,
        qty_already_inspected_final: apiData.qtyAlreadyInspectedFinal
    };
};

/**
 * Extract unique sub PO details from rmHeatTcMapping
 * Groups heat/TC data by sub PO number
 * @param {Array} rmHeatTcMapping - Array of heat TC mappings
 * @returns {Array} Unique sub PO details with associated heat numbers
 */
export const extractSubPoDetails = (rmHeatTcMapping) => {
    if (!rmHeatTcMapping || rmHeatTcMapping.length === 0) {
        return [];
    }

    // One-to-One mapping: Each Sub PO has exactly 1 Heat Number
    // Each entry in rmHeatTcMapping represents a unique Sub PO + Heat combination
    return rmHeatTcMapping.map((mapping, index) => ({
        index: index + 1,
        subPoNumber: mapping.subPoNumber,
        subPoDate: mapping.subPoDate,
        subPoQty: mapping.subPoQty,
        subPoTotalValue: mapping.subPoTotalValue,
        manufacturer: mapping.manufacturer,
        // Single heat number (one-to-one mapping)
        heatNumber: mapping.heatNumber,
        heatNumbers: [mapping.heatNumber], // Keep array for backward compatibility
        // TC details for this heat
        tcNumber: mapping.tcNumber,
        tcDate: mapping.tcDate,
        tcQty: mapping.tcQty,
        tcQtyRemaining: mapping.tcQtyRemaining,
        offeredQty: mapping.offeredQty,
        invoiceNo: mapping.invoiceNo,
        invoiceDate: mapping.invoiceDate
    }));
};

/**
 * Fetch and transform all pending raw material inspection requests
 * @returns {Promise<Array>} Transformed list matching MOCK_INSPECTION_CALLS format
 */
export const fetchTransformedPendingRawMaterialCalls = async () => {
    try {
        const apiData = await fetchAllInspectionRequests();
        // Filter only Raw Material type calls
        const rmCalls = apiData.filter(item => item.typeOfCall === 'Raw Material');
        return rmCalls.map(item => transformApiDataToCallFormat(item));
    } catch (error) {
        console.error('Error fetching transformed raw material calls:', error);
        return [];
    }
};



// ==================== INSPECTION INITIATION API ====================

const INITIATION_API_URL = `${API_ROOT}/api/inspection-initiation`;

/**
 * Save inspection initiation data (shift, date, checkboxes)
 * @param {Object} initiationData - The initiation data from IE
 * @returns {Promise<Object>} Saved initiation record
 */
export const saveInspectionInitiation = async (initiationData) => {
    try {
        const response = await fetch(INITIATION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(initiationData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.responseStatus?.message || 'Failed to save inspection initiation');
        }

        const data = await response.json();
        return data.responseData;
    } catch (error) {
        console.error('Error saving inspection initiation:', error);
        throw error;
    }
};

/**
 * Get inspection initiation by call number
 * @param {string} callNo - The call number
 * @returns {Promise<Object|null>} Initiation record or null
 */
export const getInspectionInitiationByCallNo = async (callNo) => {
    try {
        const response = await fetch(`${INITIATION_API_URL}/call/${encodeURIComponent(callNo)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.responseData;
    } catch (error) {
        console.error('Error fetching inspection initiation:', error);
        return null;
    }
};
