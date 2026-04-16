import axios from 'axios';

// const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = 'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api';
//export const API_BASE_URL = 'https://api.ritesqasarthi.com/sarthi-backend/api';
const BASE_URL = API_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // 30-second timeout prevents hanging indefinitely
    headers: {
        'Content-Type': 'application/json',
    },
});

// Simple promise-based cache to prevent redundant simultaneous requests
const pendingRequests = new Map();

const getWithCache = (url, options) => {
    if (pendingRequests.has(url)) {
        return pendingRequests.get(url);
    }
    const promise = api.get(url, options).finally(() => {
        // Clear cache after a short delay to allow fresh fetches later
        setTimeout(() => pendingRequests.delete(url), 1000);
    });
    pendingRequests.set(url, promise);
    return promise;
};


// Response interceptor for standardized error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = 
            error.response?.data?.responseStatus?.message || 
            error.response?.data?.message || 
            error.message || 
            'An unexpected error occurred';
        console.error('API Error:', message, error.config?.url);
        return Promise.reject(new Error(message));
    }
);

export const apiService = {
    // ================= Moisture Analysis =================
    getAllMoistureAnalysis: () => getWithCache('/MoistureAnalysis/all'),
    getMoistureAnalysisById: (id) => api.get(`/MoistureAnalysis/${id}`),
    getLastFiveMoisture: () => getWithCache('/MoistureAnalysis/lastFiveMoisture'),
    createMoistureAnalysis: (payload) => api.post('/MoistureAnalysis/create', payload),
    updateMoistureAnalysis: (id, payload) => api.put(`/MoistureAnalysis/update/${id}`, payload),
    deleteMoistureAnalysis: (id) => api.delete(`/MoistureAnalysis/${id}`),

    // ================= HTS Wire Placement =================
    getAllHtsWirePlacement: () => getWithCache('/HtsWirePlacement/all'),
    getHtsWirePlacementById: (id) => api.get(`/HtsWirePlacement/${id}`),
    createHtsWirePlacement: (payload) => api.post('/HtsWirePlacement/create', payload),
    updateHtsWirePlacement: (id, payload) => api.put(`/HtsWirePlacement/update/${id}`, payload),
    deleteHtsWirePlacement: (id) => api.delete(`/HtsWirePlacement/delete/${id}`),
    getHtsWireTodayRecord: (params) => api.get('/HtsWirePlacement/htsTodayRecord', { params }),

    // ================= Demoulding Inspection =================
    getAllDemouldingInspection: () => getWithCache('/DemouldingInspection/all'),
    getDemouldingInspectionById: (id) => api.get(`/DemouldingInspection/${id}`),
    createDemouldingInspection: (payload) => api.post('/DemouldingInspection/create', payload),
    updateDemouldingInspection: (id, payload) => api.put(`/DemouldingInspection/update/${id}`, payload),
    deleteDemouldingInspection: (id) => api.delete(`/DemouldingInspection/delete/${id}`),
    getDemouldingTodayRecord: (params) => api.get('/DemouldingInspection/demouldingTodayRecord', { params }),

    // ================= Mould Preparation =================
    getAllMouldPreparations: () => getWithCache('/MouldPreparation/all'),
    getMouldPreparationById: (id) => api.get(`/MouldPreparation/${id}`),
    createMouldPreparation: (data) => api.post('/MouldPreparation/create', data),
    updateMouldPreparation: (id, payload) => api.put(`/MouldPreparation/update/${id}`, payload),
    deleteMouldPreparation: (id) => api.delete(`/MouldPreparation/delete/${id}`),
    getMouldPreparationTodayRecord: (params) => api.get('/MouldPreparation/mouldPreparationTodayRecord', { params }),

    // ================= Steam Cube Testing =================
    waterCubeSamples: {
        create: (data) => api.post('/water-cube-sample/create', data),
        getAll: () => getWithCache('/water-cube-sample/getAll'),
        getById: (id) => api.get(`/water-cube-sample/getById/${id}`),
        update: (id, data) => api.put(`/water-cube-sample/update/${id}`, data),
        delete: (id) => api.delete(`/water-cube-sample/delete/${id}`),
        getByUser: (userId) => api.get(`/water-cube-sample/getByUser/${userId}`),
        saveTestResult: (data) => api.post('/water-cube-sample/save-test-result', data),
        getTestResultsByUser: (userId) => api.get(`/water-cube-sample/test-results/user/${userId}`)
    },
    getAllSteamCubes: () => getWithCache('/SteamCube/get-all'),
    getSteamCubeById: (id) => api.get(`/SteamCube/get/${id}`),
    createSteamCube: (payload) => api.post('/SteamCube/create', payload),
    updateSteamCube: (id, payload) => api.put(`/SteamCube/update/${id}`, payload),
    deleteSteamCube: (id) => api.delete(`/SteamCube/delete/${id}`),
    getSteamCubeData: (params) => api.get('/SteamCube/steamCubeData', { params }),

    // ================= Steam Cube Test Results =================
    steamCubeResults: {
        create: (payload) => api.post('/steam-cube-testing/create', payload),
        update: (id, payload) => api.put(`/steam-cube-testing/update/${id}`, payload),
        delete: (id) => api.delete(`/steam-cube-testing/delete/${id}`),
        getResults: (params) => api.get('/steam-cube-testing/steamCubeTestingData', { params }),
    },

    // ================= Stress Bench / Mould Master =================
    getAllStressBenches: () => getWithCache('/stress-bench/getAll'),
    getStressBenchById: (id) => api.get(`/stress-bench/get/${id}`),
    createStressBench: (payload) => api.post('/stress-bench/create', payload),
    updateStressBench: (id, payload) => api.put(`/stress-bench/update/${id}`, payload),
    deleteStressBench: (id) => api.delete(`/stress-bench/delete/${id}`),

    // ================= Bench / Mould Shift Inspection =================
    getAllBenchMouldInspections: () => getWithCache('/bench-mould-inspection/get-all'),
    getBenchMouldInspectionById: (id) => api.get(`/bench-mould-inspection/get/${id}`),
    createBenchMouldInspection: (payload) => api.post('/bench-mould-inspection/create', payload),
    updateBenchMouldInspection: (id, payload) => api.put(`/bench-mould-inspection/update/${id}`, payload),
    deleteBenchMouldInspection: (id) => api.delete(`/bench-mould-inspection/delete/${id}`),

    // ================= Stress Bench / Long Line Update (IE Verification) =================
    getBenchMouldStressLongLineById: (id) => api.get(`/bench-mould-stress-longline/get/${id}`),
    updateBenchMouldStressLongLine: (id, payload) => api.put(`/bench-mould-stress-longline/update/${id}`, payload),

    // ================= Wire Tensioning =================
    getAllWireTensioning: () => getWithCache('/wire-tensioning/get-all'),
    getWireTensioningById: (id) => api.get(`/wire-tensioning/get/${id}`),
    createWireTensioning: (payload) => api.post('/wire-tensioning/create', payload),
    updateWireTensioning: (id, payload) => api.put(`/wire-tensioning/update/${id}`, payload),
    deleteWireTensioning: (id) => api.delete(`/wire-tensioning/delete/${id}`),
    getWireTensioningTodayRecord: (params) => api.get('/wire-tensioning/wireTensioningData', { params }),

    // ================= Compaction (Vibrator Report) =================
    getAllCompaction: () => getWithCache('/compaction/getAll'),
    getCompactionById: (id) => api.get(`/compaction/${id}`),
    createCompaction: (payload) => api.post('/compaction/create', payload),
    updateCompaction: (id, payload) => api.put(`/compaction/update/${id}`, payload),
    deleteCompaction: (id) => api.delete(`/compaction/delete/${id}`),
    getCompactionTodayRecord: (params) => api.get('/compaction/compactionData', { params }),

    // ================= Steam Curing =================
    getAllSteamCuring: () => getWithCache('/steam-curing/getAll'),
    getSteamCuringById: (id) => api.get(`/steam-curing/${id}`),
    createSteamCuring: (payload) => api.post('/steam-curing/create', payload),
    updateSteamCuring: (id, payload) => api.put(`/steam-curing/update/${id}`, payload),
    deleteSteamCuring: (id) => api.delete(`/steam-curing/delete/${id}`),
    getSteamCuringTodayRecord: (params) => api.get('/steam-curing/steamCuringData', { params }),

    // ================= Batch Weighment =================
    getAllBatchWeighment: () => getWithCache('/batch-weighment/get-all'),
    getBatchWeighmentById: (id) => api.get(`/batch-weighment/get/${id}`),
    createBatchWeighment: (payload) => api.post('/batch-weighment/create', payload),
    updateBatchWeighment: (id, payload) => api.put(`/batch-weighment/update/${id}`, payload),
    deleteBatchWeighment: (id) => api.delete(`/batch-weighment/delete/${id}`),
    getBatchWeighmentTodayRecord: (params) => api.get('/batch-weighment/batchWeighmentData', { params }),

    // ================= Inventory – Cement =================
    getAllCementInventory: () => api.get('/inventory/cement/all'),
    getCementInventoryById: (id) => api.get(`/inventory/cement/${id}`),
    createCementInventory: (payload) => api.post('/inventory/cement/create', payload),
    updateCementInventory: (id, payload) => api.put(`/inventory/cement/update/${id}`, payload),
    deleteCementInventory: (id) => api.delete(`/inventory/cement/delete/${id}`),

    // ================= Inventory – HTS Wire =================
    getAllHtsWireInventory: () => api.get('/inventory/hts-wire/all'),
    getHtsWireInventoryById: (id) => api.get(`/inventory/hts-wire/${id}`),
    createHtsWireInventory: (payload) => api.post('/inventory/hts-wire/create', payload),
    updateHtsWireInventory: (id, payload) => api.put(`/inventory/hts-wire/update/${id}`, payload),
    deleteHtsWireInventory: (id) => api.delete(`/inventory/hts-wire/delete/${id}`),

    // ================= Inventory – Aggregate =================
    getAllAggregateInventory: () => api.get('/inventory/aggregate/all'),
    getAggregateInventoryById: (id) => api.get(`/inventory/aggregate/${id}`),
    createAggregateInventory: (payload) => api.post('/inventory/aggregate/create', payload),
    updateAggregateInventory: (id, payload) => api.put(`/inventory/aggregate/update/${id}`, payload),
    deleteAggregateInventory: (id) => api.delete(`/inventory/aggregate/delete/${id}`),

    // // ================= Inventory – Admixture =================
    // getAllAdmixtureInventory: () => api.get('/inventory/admixture/all'),
    // getAdmixtureInventoryById: (id) => api.get(`/inventory/admixture/${id}`),
    // createAdmixtureInventory: (payload) => api.post('/inventory/admixture/create', payload),
    // updateAdmixtureInventory: (id, payload) => api.put(`/inventory/admixture/update/${id}`, payload),
    // deleteAdmixtureInventory: (id) => api.delete(`/inventory/admixture/delete/${id}`),

    // ================= Inventory – SGCI Insert =================
    getAllSgciInventory: () => api.get('/inventory/sgci/all'),
    getSgciInventoryById: (id) => api.get(`/inventory/sgci/${id}`),
    createSgciInventory: (payload) => api.post('/inventory/sgci/create', payload),
    updateSgciInventory: (id, payload) => api.put(`/inventory/sgci/update/${id}`, payload),
    deleteSgciInventory: (id) => api.delete(`/inventory/sgci/delete/${id}`),

    // ================= Sleeper Workflow =================

    /**
     * Initiates workflow when vendor submits a form record.
     * Called from VENDOR side only, NOT from IE dashboard.
     */
    initiateWorkflow: (requestId, moduleId, workflowId, createdBy) =>
        api.post(
            `/sleeper-workflow/initiateWorkflow?requestId=${requestId}&moduleId=${moduleId}&workflowId=${workflowId}&createdBy=${createdBy}`,
            null
        ),

    /**
     * IE Dashboard: fetch all pending workflow transitions for a given role.
     * @param {string} roleName - e.g. "IE"
     * Returns: [{ workflowTransitionId, moduleId, requestId, assignedTo, ... }]
     */
    getAllPendingWorkflowTransitions: (roleName = 'IE', userId = '', plantId = '') =>
        api.get(`/sleeper-workflow/allPendingWorkflowTransition?roleName=${roleName}${userId ? `&assignedTo=${userId}` : ''}${plantId ? `&plantId=${plantId}` : ''}`),

    /**
     * IE Action: Verify or Request Change on a workflow transition.
     * @param {object} payload - { workflowTransitionId, action, actionBy, remarks }
     *   action = "VERIFY" | "REQUEST_BACK"
     */
    performTransitionAction: (payload) =>
        api.post('/sleeper-workflow/performTransitionAction', payload),

    // ── Module getById APIs (used by IE dashboard to fetch record details) ──
    // moduleId=1  PLANT_PROFILE
    // getPlantProfileById:       (id) => api.get(`/plant-profile/getById/${id}`),
    getPlantProfileById: (id) => api.get(`/plant-profile/${id}`),
    getDistinctShedsByVendorCode: (vendorCode) => api.get(`/plant-profile/vendor/${vendorCode}/sheds`),
    getPlantSheds: (vendorId, plantId) => api.get(`/plant-profile/vendor/%7BvendorId%7D/%7BplantId%7D/sheds?vendorId=${vendorId}&plantId=${encodeURIComponent(plantId)}`),

    // moduleId=2  STRESS_BENCH_MASTER
    getBenchMouldMasterById: (id) => api.get(`/stress-bench/get/${id}`),

    // moduleId=3  RAW_MATERIAL_SOURCE
    getRawMaterialSourceById: (id) => api.get(`/raw-material-source/${id}`),

    // moduleId=4  MIX_DESIGN
    getMixDesignById: (id) => api.get(`/mix-design/${id}`),
    getVerifiedMixDesignIdentifications: () => api.get('/mix-design/verified-identifications'),
    getApprovedMixDesigns: (moduleId = 4, vendorId = '', plantId = '') => api.get(`/mix-design/approvedMixDesign?moduleId=${moduleId}${vendorId ? `&vendorId=${vendorId}` : ''}${plantId ? `&plantId=${plantId}` : ''}`),

    // moduleId=5  HTS Wire
    getHtsWireRecordById: (id) => api.get(`/hts-wire/${id}`),

    // moduleId=6  Cement
    getCementRecordById: (id) => api.get(`/cement/${id}`),

    // moduleId=7  Admixture
    getAdmixtureRecordById: (id) => api.get(`/admixture/${id}`),

    // moduleId=8  Aggregates
    getAggregateRecordById: (id) => api.get(`/aggregates/${id}`),

    // moduleId=9  SGCI Insert
    getSgciRecordById: (id) => api.get(`/sgci-insert/${id}`),

    // moduleId=10 Dowel
    getDowelRecordById: (id) => api.get(`/dowel/${id}`),

    getProductionDeclarationRecordById: (id) => api.get(`/production-declaration/${id}`),
    getVerifiedProductionDeclarations: () => api.get('/production-declaration/verified-declarations'),
    getAllVerifedWaterBatchs: (params = {}) => api.get('/production-declaration/getAllVerifedWaterBatchs', { params }),
    getAllProductionBatches: (vendorId, castingDate, plantId, productionUnit) =>
        api.get('/production-declaration/getAll/batches', {
            params: { vendorId, castingDate, plantId, productionUnit }
        }),
    getProductionBatchesWithId: (vendorId, castingDate, plantId, productionUnit) =>
        api.get('/production-declaration/getAll/batchesWithId', {
            params: { vendorId, castingDate, plantId, productionUnit }
        }),
    getAllProductionBenches: (batchNo, productionUnit) => api.get('/production-declaration/getAll/benches', { params: { batchNo, productionUnit } }),
    getAllProductionSleeperTypes: (batchNo, benchNo, productionUnit) => api.get('/production-declaration/getAll/sleeper-types', { params: { batchNo, benchNo, productionUnit } }),
    getAllProductionSleepers: (batchNo, benchNo, sleeperType, productionUnit) => api.get('/production-declaration/getAll/sleepers', { params: { batchNo, benchNo, sleeperType, productionUnit } }),

    getAllWorkflowTransitions: (roleName = 'IE', userId = '') =>
        api.get(`/sleeper-workflow/allWorkflowTransition?roleName=${roleName}${userId ? `&assignedTo=${userId}` : ''}`),


    // ================= POI IE Mapping ================= //
    getCompanyUnitsByUser: (userId) => api.get(`/sleeper-mapping/company-units/${userId}`),

    // ================= Final Inspection Controller ================= //
    getFinalInspectionBatches: (moduleId = 1, params = {}) => api.get(`/FinalInspectionController/inspection/batches/${moduleId}`, { 
        params: { ...params, moduleId } 
    }),
    getFinalInspectionBatchDetail: (batchId, moduleId = 1) => api.get(`/FinalInspectionController/inspection/batch?batchId=${batchId}&moduleId=${moduleId}`),
    saveFinalInspection: (payload) => api.post('/FinalInspectionController/save', payload),
    updateInspectionSleepers: (payload) => api.put('/FinalInspectionController/updateInspectionSleepers', payload),
    submitInspectionCall: (payload) => api.post('/FinalInspectionController/submit-inspection-call', payload),
    getInspectionCalls: (userId) => api.get(`/FinalInspectionController/inspection-calls?userId=${userId}`),
    getCompletedBatches: (sleeperType, userId) => api.get(`/FinalInspectionController/completed-batches?sleeperType=${sleeperType}&userId=${userId}`),

    // ================= Moment of Resistance (MR) =================
    createMRRecord: (payload) => api.post('/moment-of-resistance/create', payload),
    updateMRRecord: (id, payload) => api.put(`/moment-of-resistance/update/${id}`, payload),
    getMRRecordById: (id) => api.get(`/moment-of-resistance/${id}`),
    getMRTodayRecords: (params) => api.get('/moment-of-resistance/mrTodayRecord', { params }),
    getAllMRRecords: () => getWithCache('/moment-of-resistance/all'),
    deleteMRRecord: (id) => api.delete(`/moment-of-resistance/delete/${id}`),

    // ================= Moment of Resistance Testing (MR Testing) =================
    createMRTest: (payload) => api.post('/mr-testing/create', payload),
    updateMRTest: (id, payload) => api.put(`/mr-testing/update/${id}`, payload),
    getMRTestById: (id) => api.get(`/mr-testing/${id}`),
    getMRTestTodayRecords: (params) => api.get('/mr-testing/mrTestTodayRecord', { params }),
    getAllMRTests: () => getWithCache('/mr-testing/all'),
    deleteMRTest: (id) => api.delete(`/mr-testing/delete/${id}`),

    // ================= Modulus of Rupture (MOR) =================
    // Sample Declaration
    getAllMORSamples: () => api.get('/FinalInspectionController'),
    getMORSampleById: (id) => api.get(`/FinalInspectionController/${id}`),
    createMORSample: (payload) => api.post('/FinalInspectionController', payload),
    updateMORSample: (id, payload) => api.put(`/FinalInspectionController/${id}`, payload),
    deleteMORSample: (id) => api.delete(`/FinalInspectionController/${id}`),

    // Test Results
    getAllMORTests: () => api.get('/mor-test'),
    getMORTestById: (id) => api.get(`/mor-test/${id}`),
    createMORTest: (payload) => api.post('/mor-test', payload),
    updateMORTest: (id, payload) => api.put(`/mor-test/${id}`, payload),
    deleteMORTest: (id) => api.delete(`/mor-test/${id}`),

    // ================= Modulus of Failure (MF) =================
    // Sample Declaration
    getAllMFSamples: () => api.get('/modulus-of-failure'),
    getMFSampleById: (id) => api.get(`/modulus-of-failure/${id}`),
    createMFSample: (payload) => api.post('/modulus-of-failure', payload),
    updateMFSample: (id, payload) => api.put(`/modulus-of-failure/${id}`, payload),
    deleteMFSample: (id) => api.delete(`/modulus-of-failure/${id}`),

    // Test Details
    getAllMFTests: () => api.get('/mf-test-details'),
    getMFTestById: (id) => api.get(`/mf-test-details/${id}`),
    createMFTest: (payload) => api.post('/mf-test-details', payload),
    updateMFTest: (id, payload) => api.put(`/mf-test-details/${id}`, payload),
    deleteMFTest: (id) => api.delete(`/mf-test-details/${id}`),
};