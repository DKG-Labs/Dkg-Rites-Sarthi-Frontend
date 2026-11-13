import { useState, useEffect, useCallback, useRef } from 'react';

import { currentUserKey } from '../utils/requestCache';

const globalReportCache = new Map();
const REPORT_CACHE_TTL_MS = 5 * 60 * 1000; // entries older than this are refetched

// Key includes the logged-in user so cached data is never shown to a different user on the same tab
const getCacheKey = (dep) => {
    const depKey = (dep === undefined || dep === null) ? 'null' : JSON.stringify(dep);
    return `${currentUserKey()}|${depKey}`;
};

const isFresh = (entry) => entry && (!entry.cachedAt || Date.now() - entry.cachedAt < REPORT_CACHE_TTL_MS);

export const clearGlobalReportCache = () => {
    globalReportCache.clear();
};

/**
 * Custom hook to handle fetching report data for different levels of the dashboard.
 * 
 * @param {Function} fetchFn - The API service function to call.
 * @param {any} dependency - Pass undefined to completely disable this hook (API will NOT fire).
 *                           Pass null or any value to enable fetching.
 * @returns {Object} { data, loading, error, refresh }
 */
const useReportData = (fetchFn, dependency = null) => {
    const isEnabled = dependency !== undefined;

    const getCached = () => {
        const key = getCacheKey(dependency);
        if (globalReportCache.has(fetchFn)) {
            const fnCache = globalReportCache.get(fetchFn);
            if (fnCache.has(key)) return fnCache.get(key);
        }
        return null;
    };

    const initialCache = isEnabled ? getCached() : null;

    const [data, setData] = useState(initialCache ? initialCache.data : []);
    const [pagination, setPagination] = useState(initialCache ? initialCache.pagination : { totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const activeRequestId = useRef(0);
    // Key of the request currently in flight: a re-render with an equal (but re-created) params object
    // must not fire the same request again while the first one is still running
    const inFlightKey = useRef(null);
    
    const [prevDependencyKey, setPrevDependencyKey] = useState(isEnabled ? getCacheKey(dependency) : null);
    const currentKey = isEnabled ? getCacheKey(dependency) : null;

    let currentData = data;
    let currentPagination = pagination;

    // Synchronously update data if dependency changes (loads cache or clears data) to prevent UI flashing
    if (currentKey !== prevDependencyKey) {
        setPrevDependencyKey(currentKey);
        const cached = isEnabled ? getCached() : null;
        if (cached) {
            setData(cached.data);
            setPagination(cached.pagination);
            currentData = cached.data;
            currentPagination = cached.pagination;
        } else {
            setData([]);
            setPagination({ totalElements: 0, totalPages: 0 });
            currentData = [];
            currentPagination = { totalElements: 0, totalPages: 0 };
        }
    }

    const fetchData = useCallback(async (force = false) => {
        // Double guard: abort if dependency is undefined (tab not active)
        if (dependency === undefined) return;

        const key = getCacheKey(dependency);
        
        // Skip fetching if we have a fresh cached copy and aren't forcing a refresh
        if (!force && globalReportCache.has(fetchFn) && isFresh(globalReportCache.get(fetchFn).get(key))) {
            return;
        }

        if (!force && inFlightKey.current === key) return;
        inFlightKey.current = key;
        activeRequestId.current += 1;
        const currentRequestId = activeRequestId.current;

        try {
            setLoading(true);
            setError(null);
            const response = await fetchFn(dependency);

            if (currentRequestId !== activeRequestId.current) {
                // A newer request has been made, ignore this stale response
                return;
            }

            if (response && (response.responseStatus?.statusCode === 0 || Array.isArray(response) || typeof response === 'object')) {
                // Determine if the response is wrapped and extract data
                const result = response.responseStatus ? response.responseData : response;

                let newData = [];
                let newPagination = { totalElements: 0, totalPages: 0 };

                // Handle Spring Data Page object or direct array
                if (result && result.content && Array.isArray(result.content)) {
                    newData = result.content;
                    newPagination = {
                        totalElements: result.totalElements || 0,
                        totalPages: result.totalPages || 0
                    };
                } else {
                    newData = result;
                    newPagination = {
                        totalElements: Array.isArray(result) ? result.length : (result ? 1 : 0),
                        totalPages: 1
                    };
                }

                setData(newData);
                setPagination(newPagination);

                // Update global cache
                if (!globalReportCache.has(fetchFn)) {
                    globalReportCache.set(fetchFn, new Map());
                }
                globalReportCache.get(fetchFn).set(key, { data: newData, pagination: newPagination, cachedAt: Date.now() });

            } else {
                setError(response?.responseStatus?.message || 'Failed to fetch data');
            }
        } catch (err) {
            if (currentRequestId !== activeRequestId.current) return;
            console.error('API Error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            if (currentRequestId === activeRequestId.current) {
                setLoading(false);
                inFlightKey.current = null;
            }
        }
    }, [fetchFn, dependency]);

    useEffect(() => {
        // Only fetch when dependency is explicitly provided (not undefined)
        if (isEnabled) {
            fetchData();
        }
    }, [fetchData, isEnabled]);

    return { data: currentData, pagination: currentPagination, loading, error, refresh: () => fetchData(true) };
};

export default useReportData;
