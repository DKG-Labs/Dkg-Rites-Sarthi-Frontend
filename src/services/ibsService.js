import { API_BASE_URL } from './apiConfig';
import { getAuthToken } from './authService';

/**
 * Service to interact with IBS Inspection Registration APIs
 */
export const getIbsCallRegistrationData = async () => {
    const token = getAuthToken() || '';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    };

    const url = `${API_BASE_URL}/api/ibs/call-registration-inspection-data`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to fetch IBS call registration data: Status ${response.status}`);
        }

        const data = await response.json();
        // Backend returns standard ResponseBuilder format { responseStatus: {...}, responseData: [...] }
        if (data && data.responseData) {
            return data.responseData;
        }
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching IBS Call Registration Data:', error);
        throw error;
    }
};

/**
 * Reverts a pending IBS call back to completed by deleting the SEND_CALL_TO_IBS
 * workflow transition and archiving it to the delete history table.
 */
export const revertIbsCallToCompleted = async (callNumber, deletedBy) => {
    const token = getAuthToken() || '';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    };

    const params = new URLSearchParams({ callNumber });
    if (deletedBy != null) params.append('deletedBy', deletedBy);

    const url = `${API_BASE_URL}/api/ibs/revert-to-completed?${params.toString()}`;

    const response = await fetch(url, { method: 'DELETE', headers });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to revert call: Status ${response.status}`);
    }
    const data = await response.json();
    return data;
};

/**
 * Service to fetch completed IBS calls from ibs_call_registration
 */
export const getIbsCompletedCallsData = async () => {
    const token = getAuthToken() || '';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    };

    const url = `${API_BASE_URL}/api/ibs/completed-inspection-data`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to fetch IBS completed calls: Status ${response.status}`);
        }

        const data = await response.json();
        if (data && data.responseData) {
            return data.responseData;
        }
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching IBS Completed Calls Data:', error);
        throw error;
    }
};

/**
 * Completed IBS calls, filtered / sorted / paged on the server.
 * params: { page, size, category, product, status, search, from, to } (from/to = acknowledged date, YYYY-MM-DD)
 * size = 0 returns all matching rows (CSV export).
 * Returns { content, total, page, size, totalPages, stats, serverMs }.
 */
export const searchIbsCompletedCalls = async (params = {}) => {
    const token = getAuthToken() || '';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    };
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'ALL') qs.append(k, v);
    });
    const response = await fetch(`${API_BASE_URL}/api/ibs/completed-inspection-data/search?${qs.toString()}`, {
        method: 'GET',
        headers
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch IBS completed calls: Status ${response.status}`);
    }
    const data = await response.json();
    return data?.responseData || { content: [], total: 0, stats: null };
};

