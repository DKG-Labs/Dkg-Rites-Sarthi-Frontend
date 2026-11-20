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

    invalidateIbsCompletedCache(); // revert changes what the Completed tab shows
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
 * params: { page, size, category, product, region, status, search, dateField, from, to, sortKey, sortDir, refresh }
 * size = 0 returns all matching rows (CSV export).
 * Returns { content, total, page, size, totalPages, stats }.
 */
const fetchCompletedPage = async (params = {}) => {
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

/* ------------------------------------------------------------------ *
 * Client cache for the Completed IBS calls screen
 * - Each page/filter combination is kept for COMPLETED_TTL_MS.
 * - Two identical requests at the same time share one network call.
 * - refresh: true skips this cache AND tells the server to rebuild its cache.
 * - invalidateIbsCompletedCache() is called after acknowledge / revert / case-no changes.
 * ------------------------------------------------------------------ */
const COMPLETED_TTL_MS = 2 * 60 * 1000;
const COMPLETED_MAX_ENTRIES = 50;
const completedCache = new Map();   // key -> { at, data }
const completedInFlight = new Map(); // key -> Promise

const cacheKey = (params) => JSON.stringify(
    Object.keys(params).sort().filter((k) => k !== 'refresh').map((k) => [k, params[k]])
);

export const invalidateIbsCompletedCache = () => {
    completedCache.clear();
};

/** When the cached copy of this query was fetched (ms), or null. Used for the "Updated …" label. */
export const getIbsCompletedCachedAt = (params = {}) => completedCache.get(cacheKey(params))?.at || null;

export const searchIbsCompletedCalls = async (params = {}) => {
    const key = cacheKey(params);
    if (params.refresh) {
        completedCache.clear();
    } else {
        const hit = completedCache.get(key);
        if (hit && Date.now() - hit.at < COMPLETED_TTL_MS) return hit.data;
        if (completedInFlight.has(key)) return completedInFlight.get(key);
    }

    const p = fetchCompletedPage(params)
        .then((data) => {
            completedCache.set(key, { at: Date.now(), data });
            if (completedCache.size > COMPLETED_MAX_ENTRIES) {
                completedCache.delete(completedCache.keys().next().value); // drop oldest
            }
            return data;
        })
        .finally(() => completedInFlight.delete(key));
    completedInFlight.set(key, p);
    return p;
};

/** Load the next page in the background so "Next" opens instantly. Errors are ignored. */
export const prefetchIbsCompletedCalls = (params = {}) => {
    searchIbsCompletedCalls(params).catch(() => {});
};
