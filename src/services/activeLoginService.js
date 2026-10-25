import { API_BASE_URL, getAuthHeaders, handleResponse } from './apiConfig';

export const getActiveLogins = () =>
    fetch(`${API_BASE_URL}/api/active-logins`, { headers: getAuthHeaders() }).then(handleResponse);

export const getActiveLoginSelfie = (id) =>
    fetch(`${API_BASE_URL}/api/active-logins/${id}/selfie`, { headers: getAuthHeaders() }).then(handleResponse);
