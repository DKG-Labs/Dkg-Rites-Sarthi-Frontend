import { API_BASE_URL, getAuthHeaders, handleResponse } from './apiConfig';

export const getActiveLogins = ({ page = 0, size = 10, search = '', from, to } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (search) params.set('search', search);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return fetch(`${API_BASE_URL}/api/active-logins?${params}`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const getActiveLoginSelfie = (id) =>
    fetch(`${API_BASE_URL}/api/active-logins/${id}/selfie`, { headers: getAuthHeaders() }).then(handleResponse);

export const getNearestPlant = (userId) =>
    fetch(`${API_BASE_URL}/api/nearest-plant?userId=${encodeURIComponent(userId)}`, { headers: getAuthHeaders() }).then(handleResponse);
