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
