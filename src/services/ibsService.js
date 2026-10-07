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
