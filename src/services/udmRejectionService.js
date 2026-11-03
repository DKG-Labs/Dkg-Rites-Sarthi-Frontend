import { API_BASE_URL, getAuthHeaders, handleResponse } from './apiConfig';

export const getUdmRejections = (filters = {}) => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const params = new URLSearchParams(clean).toString();
    return fetch(`${API_BASE_URL}/api/udm-rejections${params ? '?' + params : ''}`,
        { headers: getAuthHeaders() }).then(handleResponse);
};

export const syncUdmRejections = (date) => {
    return fetch(`${API_BASE_URL}/api/udm-rejections/sync?date=${date}`,
        { method: 'POST', headers: getAuthHeaders() }).then(handleResponse);
};

/** Latest sync runs (daily scheduler + manual), newest first, with counts and failure reason */
export const getUdmSyncHistory = (limit = 50) => {
    return fetch(`${API_BASE_URL}/api/udm-rejections/sync-history?limit=${limit}`,
        { headers: getAuthHeaders() }).then(handleResponse);
};

export const getUdmSummary = (rejDate) => {
    const params = rejDate ? `?rejDate=${rejDate}` : '';
    return fetch(`${API_BASE_URL}/api/udm-rejections/summary${params}`,
        { headers: getAuthHeaders() }).then(handleResponse);
};

