import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, handleResponse } from './apiConfig';

// Cache for PO Wise report to speed up frontend loading
const poWiseCache = {};

/**
 * Service for fetching Railway Board Inspection Reports
 */
const reportService = {
    getVendorPlants: async () => {
        const response = await fetch(`${API_BASE_URL}/api/filters/vendor-plants`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getZonalRailways: async (poiCode) => {
        const response = await fetch(`${API_BASE_URL}/api/filters/zonal-railways?poiCode=${poiCode}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getAllZonalRailways: async () => {
        const response = await fetch(`${API_BASE_URL}/api/filters/all-zonal-railways`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getVendorPlantsByZone: async (zone) => {
        const response = await fetch(`${API_BASE_URL}/api/filters/vendor-plants-by-zone?zone=${zone}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getIcIssuedCounts: async (params) => {
        const { vendorPlantCode, zonalRailway, startDate, endDate } = params || {};
        const url = new URL(`${API_ENDPOINTS.REPORTS}/icIssuedCounts`);
        if (vendorPlantCode) url.searchParams.append('vendorPlantCode', vendorPlantCode);
        if (zonalRailway) url.searchParams.append('zonalRailway', zonalRailway);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Level 1: PO Wise List
     * Hits: /api/reports/1stLevelReportPoData
     */
    getLevel1Report: async (params) => {
        const forceRefresh = params && params._refresh > 0;
        const CACHE_KEY = 'cache_level1ReportPoData';
        
        if (!forceRefresh) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    console.error('Failed to parse cached level1 report data');
                }
            }
        }

        const response = await fetch(`${API_ENDPOINTS.REPORTS}/1stLevelReportPoData`, {
            headers: getAuthHeaders(),
        });
        
        const result = await handleResponse(response);
        
        if (result) {
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(result));
            } catch (e) {
                console.error('Failed to cache level1 report data (quota exceeded?)');
            }
        }
        
        return result;
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

    getRailPadLevel1Report: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/railpad/1stLevelReportPoData`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadLevel2Report: async (poNo) => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/railpad/2ndLevelReportPoSerialData/${poNo}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadLevel3Report: async (poNo, serialNo) => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/railpad/3rdLevelReportICData/${poNo}/${serialNo}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadMonthlyProgressReport: async (params) => {
        const { page = 0, size = 10, startDate, endDate, rio, zone, vendor } = params || {};
        const url = new URL(`${API_ENDPOINTS.REPORTS}/railpad/monthly-progress`);

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

    getRailPadMonthlyAnalysisOfUnits: async (params) => {
        const { page = 0, size = 10, startDate, endDate, rio, zone, vendor } = params || {};
        const url = new URL(`${API_ENDPOINTS.REPORTS}/railpad/monthly-analysis`);

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

    getRailPadClosedLoopManufacturers: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/railpad/closed-loop/manufacturers`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadClosedLoopPlants: async (vendorCode) => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/railpad/closed-loop/plants?vendorCode=${vendorCode}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadClosedLoopLots: async (plantId, year) => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/railpad/closed-loop/lots?plantId=${plantId}&year=${year}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadClosedLoopDetails: async (lotId) => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/railpad/closed-loop/details/${lotId}`, {
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

    getDashboardSummary: async (params) => {
        let url = `${API_ENDPOINTS.REPORTS}/dashboardSummary`;

        if (params) {
            const queryParams = new URLSearchParams();
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.vendor && params.vendor !== 'all') queryParams.append('vendorPlantCode', params.vendor);
            if (params.zone && params.zone !== 'all') queryParams.append('zonalRailway', params.zone);
            if (queryParams.toString()) url += `?${queryParams.toString()}`;
        }

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getAvgProductionPerDay: async (vendorPlantCode, zonalRailway, startDate, endDate) => {
        let url = `${API_ENDPOINTS.REPORTS}/avgProductionPerDay`;
        const params = new URLSearchParams();
        if (vendorPlantCode) params.append('vendorPlantCode', vendorPlantCode);
        if (zonalRailway) params.append('zonalRailway', zonalRailway);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const qs = params.toString();
        if (qs) {
            url += `?${qs}`;
        }

        const response = await fetch(url, {
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
        const { page = 0, size = 10, startDate, endDate, rio, zone, vendor, product } = params || {};
        let url;
        if (product === 'Rail Pad') {
            url = new URL(`${API_BASE_URL}/api/reports/railpad/performance`);
        } else {
            url = new URL(`${API_BASE_URL}/api/SummaryReports/dashboard`);
        }

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

    getQualityRejection: async (params) => {
        const { startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/qualityRejection`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getManufacturerRejection: async (params) => {
        const { startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/manufacturerRejection`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getProcessPerformance: async (params) => {
        const { startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/processPerformance`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
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

    getManufacturingStepWiseRejection: async (params) => {
        const { startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/manufacturingStepWiseRejection`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getInspectionCallStatus: async (params) => {
        const { vendor, zone, startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/inspectionCallStatus`;
        const queryParams = new URLSearchParams();
        if (vendor && vendor !== 'all') queryParams.append('vendorPlantCode', vendor);
        if (zone && zone !== 'all') queryParams.append('zonalRailway', zone);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCmInspectionCalls: async (params) => {
        const { startDate, endDate } = params || {};
        const url = new URL(`${API_ENDPOINTS.REPORTS}/cm-inspection-calls`);

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCmSleeperInspectionCalls: async (params) => {
        const { startDate, endDate } = params || {};
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/cm-inspection-calls`);

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCmSleeperOverdueCalls: async (params) => {
        const { startDate, endDate } = params || {};
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/cm-sleeper-overduecalls`);

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCmErcOverdueCalls: async (params) => {
        const { startDate, endDate } = params || {};
        const url = new URL(`${API_ENDPOINTS.REPORTS}/cm-erc-overduecalls`);

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getParetoAnalysis: async (params) => {
        const { startDate, endDate, product } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/paretoAnalysis`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (product) queryParams.append('product', product);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getInspectionDetails: async (params) => {
        const { startDate, endDate, vendor, zone } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/inspectionDetails`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (vendor && vendor !== 'all') queryParams.append('vendorPlantCode', vendor);
        if (zone && zone !== 'all') queryParams.append('zonalRailway', zone);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
    getProcessOverallRejection: async () => {
        let url = `${API_ENDPOINTS.REPORTS}/processOverallRejection`;
        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
    getMonthlyRejectionTrend: async (params) => {
        const { startDate, endDate, product } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/monthlyRejectionTrend`;
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (product) queryParams.append('product', product);
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

    getDemouldingRejectedCount: async () => {
        const response = await fetch(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/demoulding-process-rejected-count`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getFinalInspectionCallStatusCounts: async () => {
        const response = await fetch(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/final-inspection-call-status-counts`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getFinalRejectedCount: async () => {
        const response = await fetch(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/Final-inspection-rejected-count`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRejectionPercentage: async () => {
        const response = await fetch(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/rejection-percentage`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getSleeperMonthlyAnalysis: async (params) => {
        const { startDate, endDate } = params || {};
        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/monthly-analysis`);
        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get list of companies/manufacturers for Sleeper Dashboard
     * Hits: /api/sleeper-dashboard/companies
     */
    getSleeperCompanies: async () => {
        const response = await fetch(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/companies`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get list of plants for a specific vendor
     * Hits: /api/sleeper-dashboard/plants?vendorCode={vendorCode}
     * @param {string} vendorCode 
     */
    getSleeperPlants: async (vendorCode) => {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/plants`);
        url.searchParams.append('vendorCode', vendorCode);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get list of batches for a specific plant
     * Hits: /api/sleeper-dashboard/batches?plantId={plantId}
     * @param {string} plantId 
     */
    getSleeperBatches: async (plantId) => {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/batches`);
        url.searchParams.append('plantId', plantId);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Lot Wise Closed Loop Analysis data
     * Hits: /api/sleeper-dashboard/LifeCycle/LotWise?id={id}&batchId={batchId}
     * @param {Object} params - { id, batchId }
     */
    getSleeperLotWiseAnalysis: async (params) => {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/LifeCycle/LotWise`);
        if (params.id) url.searchParams.append('id', params.id);
        if (params.batchId) url.searchParams.append('batchId', params.batchId);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Sleeper Monthly Progress Report Data
     * Hits: /api/sleeper-dashboard/mpr
     * @param {Object} params - { startDate, endDate }
     */
    getSleeperMonthlyProgressReport: async (params) => {
        const { startDate, endDate } = params || {};

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/mpr`);
        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Quality of PSC Sleepers Report Data
     * Hits: /api/sleeper-dashboard/quality-sleeper
     * @param {Object} params - { startDate, endDate }
     */
    getSleeperQualityReport: async (params) => {
        const { startDate, endDate } = params || {};

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/quality-sleeper`);
        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Defect Distribution Analysis Data for Sleeper Dashboard
     * Hits: /api/sleeper-dashboard/defect-distribution-analysis
     * @param {Object} params - { startDate, endDate }
     */
    getSleeperDefectDistribution: async (params) => {
        const { startDate, endDate } = params || {};

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/defect-distribution-analysis`);
        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Pareto Analysis Data for Sleeper Dashboard
     * Hits: /api/sleeper-dashboard/pareto-analysis
     * @param {Object} params - { startDate, endDate }
     */
    getSleeperParetoAnalysis: async (params) => {
        const { startDate, endDate } = params || {};

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/pareto-analysis`);
        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Manufacturer Performance Data for a specific plant
     * Hits: /api/sleeper-dashboard/manufacturer-performance/{plantId}?plantId={plantId}
     * Note: Backend uses literal '{plantId}' in path but takes actual value as @RequestParam
     * @param {string} plantId 
     */
    getManufacturerPerformance: async (plantId) => {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/manufacturer-performance/{plantId}`);
        url.searchParams.append('plantId', plantId);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get Process Defect Distribution Data for a specific plant
     * Hits: /api/sleeper-dashboard/process-defect-distribution?plantId={plantId}
     * @param {string} plantId 
     */
    getProcessDefectDistribution: async (plantId) => {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/process-defect-distribution`);
        url.searchParams.append('plantId', plantId);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getPoIssuedDetails: async (itemCatDescr, vendorPlantCode, zonalRailway, startDate, endDate) => {
        const url = new URL(`${API_ENDPOINTS.REPORTS}/poIssuedDetails`);
        if (itemCatDescr) url.searchParams.append('itemCatDescr', itemCatDescr);
        if (vendorPlantCode) url.searchParams.append('vendorPlantCode', vendorPlantCode);
        if (zonalRailway) url.searchParams.append('zonalRailway', zonalRailway);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getInspectionCallStatusDetails: async (stage, status, filters) => {
        let url;
        if (stage === 'Railpad') {
            url = new URL(`${API_ENDPOINTS.REPORTS}/railPadInspectionCallStatusDetails`);
            url.searchParams.append('status', status);
        } else {
            url = new URL(`${API_ENDPOINTS.REPORTS}/inspectionCallStatusDetails`);
            url.searchParams.append('stage', stage);
            url.searchParams.append('status', status);
            if (filters) {
                const { vendor, zone, startDate, endDate } = filters;
                if (vendor && vendor !== 'all') url.searchParams.append('vendorPlantCode', vendor);
                if (zone && zone !== 'all') url.searchParams.append('zonalRailway', zone);
                if (startDate) url.searchParams.append('startDate', startDate);
                if (endDate) url.searchParams.append('endDate', endDate);
            }
        }
        try {
            const response = await fetch(url.toString(), {
                headers: getAuthHeaders(),
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching inspection call status details:', error);
            throw error;
        }
    },

    /**
     * Get PO Wise Monthly Report Data
     * Hits: /api/reports/poWise?startDate={startDate}&endDate={endDate}
     * @param {Object} params - { startDate, endDate }
     */
    getPoWiseReport: async (params) => {
        const { startDate, endDate, page = 0, size = 30, forceRefresh } = params || {};
        const cacheKey = `poWise_${startDate}_${endDate}_${page}_${size}`;
        if (!forceRefresh && poWiseCache[cacheKey]) {
            return poWiseCache[cacheKey];
        }

        const url = new URL(`${API_ENDPOINTS.REPORTS}/newPoWise`);
        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        const data = await handleResponse(response);
        poWiseCache[cacheKey] = data;
        return data;
    },

    getSqcReport: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/sqcReport`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadShiftWiseProductionReport: async (params) => {
        const { startDate, endDate, vendor, plant } = params || {};
        const url = new URL(`${API_ENDPOINTS.REPORTS}/railPadShiftWiseProduction`);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        if (vendor) url.searchParams.append('vendor', vendor);
        if (plant) url.searchParams.append('plant', plant);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadVendorWiseQualityReport: async (params) => {
        const { startDate, endDate } = params || {};
        const url = new URL(`${API_ENDPOINTS.REPORTS}/railPadVendorWiseQuality`);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadManufacturers: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/railPadManufacturers`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadPlaces: async (vendor) => {
        const url = new URL(`${API_ENDPOINTS.REPORTS}/railPadPlaces`);
        if (vendor) {
            url.searchParams.append('vendor', vendor);
        }
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getRailPadQualityReport: async (params) => {
        const { startDate, endDate } = params || {};
        const url = new URL(`${API_ENDPOINTS.REPORTS}/railPadQualityReport`);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getAllCompanies: async () => {
        const response = await fetch(`${API_ENDPOINTS.REPORTS}/companies`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getUnitsByCompany: async (companyName) => {
        const response = await fetch(`${API_BASE_URL}/api/poiMapping/companies/units?companyName=${encodeURIComponent(companyName)}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getPoiByCompanyAndUnit: async (companyName, unitName) => {
        const response = await fetch(`${API_BASE_URL}/api/poiMapping/companies/unit-details?companyName=${encodeURIComponent(companyName)}&unitName=${encodeURIComponent(unitName)}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getPlantShiftWiseReport: async (params) => {
        const { startDate, endDate, poiCode } = params || {};
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/plant-shift-wise`);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        if (poiCode) url.searchParams.append('poiCode', poiCode);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getPoNumbersByManufacturer: async (manufacturer) => {
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/po-numbers-by-manufacturer`);
        url.searchParams.append('manufacturer', manufacturer);
        const response = await fetch(url.toString(), { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    getCallNumbersByPoAndManufacturer: async (poNo, manufacturer) => {
        const url = new URL(`${API_BASE_URL}/api/SummaryReports/call-numbers-by-po`);
        url.searchParams.append('poNo', poNo);
        url.searchParams.append('manufacturer', manufacturer);
        const response = await fetch(url.toString(), { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    /**
     * Get Employee Wise Performance Data for Sleeper Dashboard
     * Hits: /api/sleeper-dashboard/employee-wise-performance
     * @param {Object} params - { startDate, endDate }
     */
    getSleeperEmployeePerformance: async (params) => {
        const { startDate, endDate } = params || {};

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/employee-wise-performance`);
        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));

        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get distinct company names from vendor_plant table
     * Hits: /api/sleeper-dashboard/vendor-plant/companies
     */
    getSleeperVendorPlantCompanies: async () => {
        const url = `${API_ENDPOINTS.SLEEPER_DASHBOARD}/vendor-plant/companies`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    /**
     * Get plants by company name from vendor_plant table
     * Hits: /api/sleeper-dashboard/vendor-plant/plants?companyName={companyName}
     * @param {string} companyName
     */
    getSleeperVendorPlantsByCompany: async (companyName) => {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/vendor-plant/plants`);
        url.searchParams.append('companyName', companyName);
        const response = await fetch(url.toString(), { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    /**
     * Get Sleeper Shift Wise Production Report data
     * Hits: /api/sleeper-dashboard/shift-wise-production?startDate={}&endDate={}&plantId={}
     * @param {Object} params - { startDate, endDate, plantId }
     */
    getSleeperShiftWiseProduction: async (params) => {
        const { startDate, endDate, plantId } = params || {};

        const formatDate = (dateStr) => {
            if (!dateStr || !dateStr.includes('-')) return dateStr;
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        };

        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/shift-wise-production`);
        if (startDate) url.searchParams.append('startDate', formatDate(startDate));
        if (endDate) url.searchParams.append('endDate', formatDate(endDate));
        if (plantId) url.searchParams.append('plantId', plantId);

        const response = await fetch(url.toString(), { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    getCmIeWiseCallStatus: async (cmEmpId) => {
        const url = new URL(`${API_ENDPOINTS.REPORTS}/cm-ie-wise-callStatus`);
        if (cmEmpId) url.searchParams.append('cmEmpId', cmEmpId);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCmSleeperIeWiseCallStatus: async (cmEmpId) => {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/cm-sleeper-ie-callWiseStatus`);
        if (cmEmpId) url.searchParams.append('cmEmplId', cmEmpId); // Note: backend uses cmEmplId
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCmCompletedCallsAnalysis: async (cmEmpId) => {
        const url = new URL(`${API_ENDPOINTS.REPORTS}/cm-completed-calls-analysis`);
        if (cmEmpId) url.searchParams.append('cmEmpId', cmEmpId);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getCmSleeperCompletedCallsAnalysis: async (cmEmpId) => {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/cm-sleeper-IECompletedCalls`);
        if (cmEmpId) url.searchParams.append('cmEmplId', cmEmpId); // Note: backend uses cmEmplId
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getErcDashboardTotalCalls: async (params) => {
        const { vendor, zone, startDate, endDate } = params || {};
        let url = `${API_ENDPOINTS.REPORTS}/ercDashboardTotalCalls`;
        const queryParams = new URLSearchParams();
        if (vendor && vendor !== 'all') queryParams.append('vendorPlantCode', vendor);
        if (zone && zone !== 'all') queryParams.append('zonalRailway', zone);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    getErcDashboardOpenCalls: async (filters = {}) => {
        const { vendor, zone, startDate, endDate } = filters;
        const url = new URL(`${API_ENDPOINTS.REPORTS}/ercDashboardOpenCalls`);
        if (vendor) url.searchParams.append('vendorPlantCode', vendor);
        if (zone) url.searchParams.append('zonalRailway', zone);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        const response = await fetch(url.toString(), { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    getErcDashboardUnderInspectionCalls: async (filters = {}) => {
        const { vendor, zone, startDate, endDate } = filters;
        const url = new URL(`${API_ENDPOINTS.REPORTS}/ercDashboardUnderInspectionCalls`);
        if (vendor) url.searchParams.append('vendorPlantCode', vendor);
        if (zone) url.searchParams.append('zonalRailway', zone);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        const response = await fetch(url.toString(), { headers: getAuthHeaders() });
        return handleResponse(response);
    },

    getErcDashboardPendingCalls: async (filters = {}) => {
        const { vendor, zone, startDate, endDate } = filters;
        const url = new URL(`${API_ENDPOINTS.REPORTS}/ercDashboardPendingCalls`);
        if (vendor) url.searchParams.append('vendorPlantCode', vendor);
        if (zone) url.searchParams.append('zonalRailway', zone);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        const response = await fetch(url.toString(), { headers: getAuthHeaders() });
        return handleResponse(response);
    },
    getRegionByCallNo: async (callNo) => {
        const response = await fetch(`${API_BASE_URL}/api/reports/region?callNo=${encodeURIComponent(callNo)}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    }
};

export default reportService;

