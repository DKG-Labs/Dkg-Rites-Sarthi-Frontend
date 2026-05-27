import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, handleResponse } from './apiConfig';

// Cache for PO Wise report to speed up frontend loading
const poWiseCache = {};

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

    getPoIssuedDetails: async (itemCatDescr) => {
        const url = new URL(`${API_ENDPOINTS.REPORTS}/poIssuedDetails`);
        url.searchParams.append('itemCatDescr', itemCatDescr);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getInspectionCallStatusDetails: async (stage, status) => {
        const url = new URL(`${API_ENDPOINTS.REPORTS}/inspectionCallStatusDetails`);
        url.searchParams.append('stage', stage);
        url.searchParams.append('status', status);
        const response = await fetch(url.toString(), {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    /**
     * Get PO Wise Monthly Report Data
     * Hits: /api/reports/poWise?startDate={startDate}&endDate={endDate}
     * @param {Object} params - { startDate, endDate }
     */
    getPoWiseReport: async (params) => {
        const { startDate, endDate, forceRefresh } = params || {};
        const cacheKey = `${startDate}_${endDate}`;
        if (!forceRefresh && poWiseCache[cacheKey]) {
            return poWiseCache[cacheKey];
        }

        const url = new URL(`${API_ENDPOINTS.REPORTS}/poWise`);
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
        const response = await fetch(`${API_BASE_URL}/api/poiMapping/companies/${encodeURIComponent(companyName)}/units`, {
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getPoiByCompanyAndUnit: async (companyName, unitName) => {
        const response = await fetch(`${API_BASE_URL}/api/poiMapping/companies/${encodeURIComponent(companyName)}/units/${encodeURIComponent(unitName)}`, {
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
    }
};

export default reportService;
