import { useState, useEffect, useCallback, useRef } from 'react';

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

    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false); // start false; only true when actually fetching
    const [error, setError] = useState(null);
    const activeRequestId = useRef(0);

    const fetchData = useCallback(async () => {
        // Double guard: abort if dependency is undefined (tab not active)
        if (dependency === undefined) return;

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

                // Handle Spring Data Page object or direct array
                if (result && result.content && Array.isArray(result.content)) {
                    setData(result.content);
                    setPagination({
                        totalElements: result.totalElements || 0,
                        totalPages: result.totalPages || 0
                    });
                } else {
                    setData(result);
                    setPagination({
                        totalElements: Array.isArray(result) ? result.length : (result ? 1 : 0),
                        totalPages: 1
                    });
                }
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
            }
        }
    }, [fetchFn, dependency]);

    useEffect(() => {
        // Only fetch when dependency is explicitly provided (not undefined)
        if (isEnabled) {
            fetchData();
        }
    }, [fetchData, isEnabled]);

    return { data, pagination, loading, error, refresh: fetchData };
};

export default useReportData;
