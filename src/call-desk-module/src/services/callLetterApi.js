/**
 * Call Letter Details API Service
 * Fetches enriched call letter data from the backend for PDF generation.
 */

import { API_BASE_URL } from '../../../services/apiConfig';

/**
 * Fetch all details needed for the Call Letter PDF.
 *
 * @param {string} requestId - The IC number e.g. "ER-03280001"
 * @returns {Promise<Object>} - Resolved with the CallLetterDetailsDto data object
 */
export const fetchCallLetterDetails = async (requestId) => {
    if (!requestId) return null;

    const reqStr = String(requestId).toUpperCase();
    if (reqStr.startsWith('RPP-') || reqStr.startsWith('RPF-') || reqStr.includes('RPP') || reqStr.includes('RPF')) {
        try {
            const railUrl = `${API_BASE_URL}/api/rail-inspection-call/summary/${encodeURIComponent(requestId)}`;
            const response = await fetch(railUrl, { method: 'GET' });
            if (response.ok) {
                const json = await response.json();
                return json.responseData ?? json.data ?? json;
            }
        } catch (e) {
            console.warn('Could not fetch rail inspection call summary, trying default call letter details endpoint:', e);
        }
    }

    const url = `${API_BASE_URL}/api/call-letter/details?requestId=${encodeURIComponent(requestId)}`;

    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(url, { method: 'GET', headers });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Call Letter API error ${response.status}: ${text}`);
    }

    const json = await response.json();
    // Backend wraps data under { responseStatus: {...}, responseData: { ... } }
    // Fall back to .data (ResponseBuilder pattern) or raw json as safety net
    return json.responseData ?? json.data ?? json;
};
