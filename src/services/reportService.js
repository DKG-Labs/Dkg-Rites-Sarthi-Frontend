import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, handleResponse } from './apiConfig';

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

    getDashboardSummary: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/dashboardSummary`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getAvgProductionPerDay: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/avgProductionPerDay`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Performance Matrix Data
     * Hits: /api/SummaryReports/dashboard
     * @param {Object} params - { page, size, startDate, endDate }
     */
    getPerformanceMatrix: async (params) => {
        const { page = 0, size = 10, startDate, endDate, rio, zone, vendor } = params || {};
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/dashboard`);

        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        if (rio) url.searchParams.append('rio', rio);
        if (zone) url.searchParams.append('zone', zone);
        if (vendor) url.searchParams.append('vendor', vendor);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Monthly Progress Report Data
     * Hits: /api/SummaryReports/monthly-progress
     * @param {Object} params - { page, size, startDate, endDate }
     */
    getMonthlyProgressReport: async (params) => {
        const { page = 0, size = 10, startDate, endDate, rio, zone, vendor } = params || {};
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/monthly-progress`);

        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        if (rio) url.searchParams.append('rio', rio);
        if (zone) url.searchParams.append('zone', zone);
        if (vendor) url.searchParams.append('vendor', vendor);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Monthly Analysis of Units Data
     * Hits: /api/SummaryReports/Manufature_wise_analysis
     * @param {Object} params - { page, size, startDate, endDate }
     */
    getMonthlyAnalysisOfUnits: async (params) => {
        const { page = 0, size = 10, startDate, endDate, rio, zone, vendor } = params || {};
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/Manufature_wise_analysis`);

        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        if (rio) url.searchParams.append('rio', rio);
        if (zone) url.searchParams.append('zone', zone);
        if (vendor) url.searchParams.append('vendor', vendor);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Request IDs for Lot Wise Closed Loop
     * Hits: /api/SummaryReports/request-ids
     */
    getRequestIds: async (params) => {
        const { startDate, endDate } = params || {};
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/request-ids`);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Lot Numbers for a specific Request ID
     * Hits: /api/SummaryReports/lot-numbers
     */
    getLotNumbers: async (requestId) => {
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/lot-numbers`);
        url.searchParams.append('requestId', requestId);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Lot Closed Loop Data
     * Hits: /api/SummaryReports/lot-closed-loop
     */
    getLotClosedLoop: async (params) => {
        const { callNo, lotNo } = params || {};
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/lot-closed-loop`);
        if (callNo) url.searchParams.append('callNo', callNo);
        if (lotNo) url.searchParams.append('lotNo', lotNo);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getQualityRejection: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/qualityRejection`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getManufacturerRejection: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/manufacturerRejection`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getProcessPerformance: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/processPerformance`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getDailyRejectionTrend: async (params) => {
        const { startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/dailyRejectionTrend`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getManufacturingStepWiseRejection: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/manufacturingStepWiseRejection`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getInspectionCallStatus: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/inspectionCallStatus`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getParetoAnalysis: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/paretoAnalysis`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getInspectionDetails: async (params) => {
        const { startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/inspectionDetails`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
    getMonthlyRejectionTrend: async (params) => {
        const { startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/monthlyRejectionTrend`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Manufacture Process Inspection Analysis Data
     * Hits: /api/SummaryReports/manufacture-process-analysis
     * @param {Object} params - { page, size, startDate, endDate }
     */
    getManufactureProcessAnalysis: async (params) => {
        const { page = 0, size = 10, startDate, endDate } = params || {};
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/manufacture-process-analysis`);

        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Company Month Wise Data for Drill Down
     * Hits: /api/SummaryReports/company-month-wise
     * @param {Object} params - { page, size, startDate, endDate, companyName }
     */
    getCompanyMonthWiseData: async (params) => {
        const { page = 0, size = 30, startDate, endDate, companyName } = params || {};
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/company-month-wise`);

        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        if (companyName) url.searchParams.append('companyName', companyName);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getSleeperPoCount: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/sleeperPoIssuedCount`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};

export default reportService;
