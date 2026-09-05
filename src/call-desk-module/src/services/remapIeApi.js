/**
 * Remap / Reassign Inspection Engineer API Service
 * All API calls for the Reassign IE modal are centralized here.
 */

import { API_BASE_URL } from '../../../services/apiConfig';

const getHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

const handleResponse = async (response) => {
    const json = await response.json();
    return json;
};

/**
 * Fetch POI details for a given call number.
 * @param {string} callNo - e.g. "ER-03230002"
 * @returns {Promise<Object>} responseData containing poiCode, companyName, unitName, unitAddress
 */
export const fetchRemapPoiDetails = async (callNo) => {
    const response = await fetch(
        `${API_BASE_URL}/api/call-desk/remap-poi-details?callNo=${encodeURIComponent(callNo)}`,
        { method: 'GET', headers: getHeaders() }
    );
    return handleResponse(response);
};

/**
 * Fetch the currently assigned user for the given call/stage/POI.
 * @param {string} callNo
 * @param {string} stage - e.g. "ER", "EP", "EF"
 * @param {string} poiCode
 * @returns {Promise<Object>} responseData containing currentMappedEmployee details
 */
export const fetchRemapAssignedUser = async (callNo, stage, poiCode) => {
    const response = await fetch(
        `${API_BASE_URL}/api/call-desk/remap-assigned-user?callNo=${encodeURIComponent(callNo)}&stage=${encodeURIComponent(stage)}&poiCode=${encodeURIComponent(poiCode)}`,
        { method: 'GET', headers: getHeaders() }
    );
    return handleResponse(response);
};

/**
 * Fetch list of available employees for reassignment by stage.
 * @param {string} stage - e.g. "ER", "EP", "EF"
 * @returns {Promise<Object>} responseData containing array of available employees
 */
export const fetchRemapAvailableEmployees = async (stage) => {
    const response = await fetch(
        `${API_BASE_URL}/api/call-desk/remap-available-employees?stage=${encodeURIComponent(stage)}`,
        { method: 'GET', headers: getHeaders() }
    );
    return handleResponse(response);
};

/**
 * Submit the IE reassignment.
 * @param {Object} payload
 * @param {string} payload.callNo
 * @param {string} payload.poiCode
 * @param {string} payload.previousEmpCode
 * @param {string} payload.newEmpCode
 * @param {string} payload.stage
 * @returns {Promise<Object>} full response JSON ({ responseStatus } or { status, message })
 */
export const submitRemapIe = async (payload) => {
    const response = await fetch(
        `${API_BASE_URL}/api/call-desk/remap-submit`,
        {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        }
    );
    return handleResponse(response);
};

/**
 * Fetch available employees for Sleeper remapping.
 */
export const fetchSleeperRemapAvailableUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/api/sleeper-workflow/remap-available-users`, {
        method: 'GET',
        headers: getHeaders()
    });
    return handleResponse(response);
};

/**
 * Submit the remapping for a Sleeper call.
 * @param {Object} payload - { callNo, plantId, oldUserId, newUserId }
 */
export const submitSleeperRemap = async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/sleeper-workflow/remap-submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

/**
 * Fetch available employees for Railpad remapping.
 */
export const fetchRailpadRemapAvailableUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/api/railpad-workflow/remap-available-users`, {
        method: 'GET',
        headers: getHeaders()
    });
    return handleResponse(response);
};

/**
 * Submit the remapping for a Railpad call.
 * @param {Object} payload - { callNo, plantId, oldUserId, newUserId }
 */
export const submitRailpadRemap = async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/railpad-workflow/reassign-user`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};
