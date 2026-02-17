import { API_ENDPOINTS, getAuthHeaders, handleResponse } from './apiConfig';

/**
 * Service for fetching Railway Board Inspection Reports
 */
const reportService = {
    /**
     * Level 1: PO Wise List
     * Hits: /api/reports/1stLevelReportPoData
     */
    getLevel1Report: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/1stLevelReportPoData`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Level 2: PO Serial Details
     * Hits: /api/reports/2ndLevelReportPoSerialData/{poNo}
     */
    getLevel2Report: async (poNo) => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/2ndLevelReportPoSerialData/${poNo}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Level 3: Inspection Call Details
     * Hits: /api/reports/3rdLevelReportICData?callNo={rlyPoSrNo}&poNo={poNo}
     */
    getLevel3Report: async (params) => {
        const { rlyPoSrNo, poNo, page, size } = typeof params === 'object' ? params : { rlyPoSrNo: params };
        const url = new URL(`${API_ENDPOINTS.REPORTS}/3rdLevelReportICData`);
        url.searchParams.append('callNo', rlyPoSrNo);
        if (poNo) url.searchParams.append('poNo', poNo);
        if (page !== undefined) url.searchParams.append('page', page);
        if (size !== undefined) url.searchParams.append('size', size);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Level 4: Inspection Call Wise List (Details)
     * Hits: /api/reports/4thLevelReportICData/{callNo}
     */
    getLevel4Report: async (callNo) => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/4thLevelReportICData/${callNo}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

export default reportService;
