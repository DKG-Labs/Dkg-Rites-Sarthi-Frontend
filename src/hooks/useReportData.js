import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to handle fetching report data for different levels of the dashboard.
 * 
 * @param {Function} fetchFn - The API service function to call.
 * @param {any} dependency - The ID or parameter the fetch function depends on.
 * @returns {Object} { data, loading, error, refresh }
 */
const useReportData = (fetchFn, dependency = null) => {
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchFn(dependency);

            if (response.responseStatus.statusCode === 0) {
                const result = response.responseData;

                // Handle Spring Data Page object or direct array
                if (result && result.content && Array.isArray(result.content)) {
                    setData(result.content);
                    setPagination({
                        totalElements: result.totalElements || 0,
                        totalPages: result.totalPages || 0
                    });
                } else {
                    setData(Array.isArray(result) ? result : []);
                    setPagination({
                        totalElements: Array.isArray(result) ? result.length : 0,
                        totalPages: 1
                    });
                }
            } else {
                setError(response.responseStatus.message || 'Failed to fetch data');
            }
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, [fetchFn, dependency]);

    useEffect(() => {
        // Only fetch if level 1 (no dep) or if dependency is provided
        if (dependency !== undefined) {
            fetchData();
        }
    }, [fetchData, dependency]);

    return { data, pagination, loading, error, refresh: fetchData };
};

export default useReportData;
