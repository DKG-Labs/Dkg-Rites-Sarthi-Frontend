import { API_BASE_URL, getAuthHeaders, handleResponse } from './apiConfig';

export const getActiveLogins = ({ page = 0, size = 10, search = '' } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (search) params.set('search', search);
    return fetch(`${API_BASE_URL}/api/active-logins?${params}`, { headers: getAuthHeaders() }).then(handleResponse);
};

export const getActiveLoginSelfie = (id) =>
    fetch(`${API_BASE_URL}/api/active-logins/${id}/selfie`, { headers: getAuthHeaders() }).then(handleResponse);
