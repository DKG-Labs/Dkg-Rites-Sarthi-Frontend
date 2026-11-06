import { API_BASE_URL, getAuthHeaders, handleResponse } from './apiConfig';

export const getActiveLogins = ({ page = 0, size = 10, search = '' } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (search) params.set('search', search);
    return fetch(`${API_BASE_URL}/api/active-logins?${params}`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const getActiveLoginSelfie = (id) =>
    fetch(`${API_BASE_URL}/api/active-logins/${id}/selfie`, { headers: getAuthHeaders() }).then(handleResponse);

/**
 * Fetches the selfie image through the backend proxy (private Azure Blob container)
 * and returns a local object URL safe to use in <img src>.
 */
export const fetchSelfieBlob = async (id) => {
    const headers = { ...getAuthHeaders() };
    delete headers['Content-Type'];
    const res = await fetch(`${API_BASE_URL}/api/active-logins/${id}/selfie/image`, { headers });
    if (!res.ok) throw new Error('Selfie could not be loaded');
    return URL.createObjectURL(await res.blob());
};

export const getNearestPlant = (userId) =>
    fetch(`${API_BASE_URL}/api/nearest-plant?userId=${encodeURIComponent(userId)}`, { headers: getAuthHeaders() }).then(handleResponse);

