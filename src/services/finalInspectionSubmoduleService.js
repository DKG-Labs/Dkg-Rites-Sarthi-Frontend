import { API_BASE_URL } from './apiConfig';
import { getAuthHeaders, handleResponse } from './apiConfig';

/**
 * Get current user ID from localStorage
 * @returns {string} User ID or 'system' as fallback
 */
const getCurrentUserId = () => {
  const userId = localStorage.getItem('userId');
  return userId || 'system';
};

/**
 * Add createdBy field for new records (first save)
 * @param {Object} data - Original data object
 * @returns {Object} Data with createdBy field added
 */
const addCreatedByField = (data) => {
  const userId = getCurrentUserId();
  return {
    ...data,
    createdBy: userId
  };
};

/**
 * Save Calibration & Documents data
 * POST /api/final-inspection/submodules/calibration-documents
 */
export const saveCalibrationDocuments = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/calibration-documents`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving calibration documents:', error);
    throw error;
  }
};

/**
 * Save Visual Inspection data (NEW ENDPOINT)
 * POST /api/final-material/visual-inspection
 * Transforms frontend format to backend format
 */
export const saveVisualInspection = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-material/visual-inspection`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving visual inspection data:', error);
    throw error;
  }
};

/**
 * Save Dimensional Inspection data (NEW CONSOLIDATED ENDPOINT)
 * POST /api/final-inspection/submodules/dimensional-inspection
 * Uses parent-child structure with samples array
 */
export const saveDimensionalInspection = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/dimensional-inspection`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving dimensional inspection data:', error);
    throw error;
  }
};

/**
 * Save Dimensional Inspection data (FLAT STRUCTURE - FOR VISUAL INSPECTION PAGE)
 * POST /api/final-inspection/submodules/dimensional-inspection-flat
 * Uses flat structure with individual fields for 1st and 2nd sampling
 * Supports UPSERT pattern for pause/resume functionality
 */
export const saveDimensionalInspectionFlat = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/dimensional-inspection-flat`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving dimensional inspection (flat) data:', error);
    throw error;
  }
};

/**
 * Save Chemical Analysis data
 * POST /api/final-inspection/submodules/chemical-analysis
 */
export const saveChemicalAnalysis = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/chemical-analysis`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving chemical analysis data:', error);
    throw error;
  }
};

/**
 * Get Chemical Analysis data by Call Number
 * Fetches product values (final composition analysis) that were already entered
 * GET /api/final-inspection/submodules/chemical-analysis/call/{callNo}
 */
export const getChemicalAnalysisByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/chemical-analysis/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving chemical analysis data:', error);
    throw error;
  }
};

/**
 * Save or update Hardness Test data (NEW TWO-TABLE DESIGN)
 * POST /api/final-inspection/submodules/hardness-test
 *
 * Supports both first save (create) and subsequent saves (pause/resume).
 * Request format:
 * {
 *   "inspectionCallNo": "EP-01090004",
 *   "lotNo": "lot2",
 *   "heatNo": "T844929",
 *   "qtyNo": 81,
 *   "remarks": "Paused after 1st sampling",
 *   "samples": [
 *     { "samplingNo": 1, "sampleNo": 1, "sampleValue": 0.40, "isRejected": true },
 *     { "samplingNo": 1, "sampleNo": 2, "sampleValue": 0.50, "isRejected": true }
 *   ]
 * }
 */
export const saveHardnessTest = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/hardness-test`;
    const userId = getCurrentUserId();
    const payload = {
      ...data,
      createdBy: userId,
      updatedBy: userId
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving hardness test data:', error);
    throw error;
  }
};

/**
 * Get all hardness tests for an inspection call
 * GET /api/final-inspection/submodules/hardness-test/call/{callNo}
 * @param {string} callNo - Inspection call number
 */
export const getHardnessTestsByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/hardness-test/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching hardness test data:', error);
    throw error;
  }
};

/**
 * Save Inclusion Rating data (OLD - DEPRECATED)
 * POST /api/final-inspection/submodules/inclusion-rating
 * @deprecated Use saveInclusionRatingNew instead
 */
export const saveInclusionRating = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/inclusion-rating`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving inclusion rating data:', error);
    throw error;
  }
};

/**
 * Save Inclusion Rating data for multiple samples (OLD - DEPRECATED)
 * POST /api/final-inspection/submodules/inclusion-rating/batch
 * @deprecated Use saveInclusionRatingNew instead
 */
export const saveInclusionRatingBatch = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/inclusion-rating/batch`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving inclusion rating batch data:', error);
    throw error;
  }
};

/**
 * Save Depth of Decarburization test (NEW - Parent-Child Structure)
 * POST /api/final-inspection/submodules/depth-of-decarburization
 */
export const saveDepthOfDecarburization = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/depth-of-decarburization`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving depth of decarburization test:', error);
    throw error;
  }
};

/**
 * Save Inclusion Rating test (NEW - Parent-Child Structure)
 * POST /api/final-inspection/submodules/inclusion-rating-new
 */
export const saveInclusionRatingNew = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/inclusion-rating-new`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving inclusion rating test:', error);
    throw error;
  }
};

/**
 * Save Microstructure test (NEW - Parent-Child Structure)
 * POST /api/final-inspection/submodules/microstructure-test
 */
export const saveMicrostructureTest = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/microstructure-test`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving microstructure test:', error);
    throw error;
  }
};

/**
 * Save Freedom from Defects test (NEW - Parent-Child Structure)
 * POST /api/final-inspection/submodules/freedom-from-defects-test
 */
export const saveFreedomFromDefectsTest = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/freedom-from-defects-test`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving freedom from defects test:', error);
    throw error;
  }
};

/**
 * Save Application Deflection data
 * POST /api/final-inspection/submodules/application-deflection
 */
export const saveApplicationDeflection = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/application-deflection`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving application deflection data:', error);
    throw error;
  }
};

/**
 * Get Dimensional Inspection tests by Call Number (PARENT-CHILD STRUCTURE)
 * GET /api/final-inspection/submodules/dimensional-inspection/call/{callNo}
 */
export const getDimensionalInspectionByCallNo = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/dimensional-inspection/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving dimensional inspection tests:', error);
    throw error;
  }
};

/**
 * Get Dimensional Inspection (FLAT STRUCTURE) by Call Number
 * GET /api/final-inspection/submodules/dimensional-inspection-flat/call/{callNo}
 * Used by Final Visual Inspection page
 */
export const getDimensionalInspectionFlatByCallNo = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/dimensional-inspection-flat/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving dimensional inspection (flat) tests:', error);
    throw error;
  }
};

/**
 * Get Application Deflection tests by Call Number
 * GET /api/final-inspection/submodules/application-deflection/call/{callNo}
 */
export const getApplicationDeflectionByCallNo = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/application-deflection/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving application deflection tests:', error);
    throw error;
  }
};

/**
 * Save Weight Test data
 * POST /api/final-inspection/submodules/weight-test
 */
export const saveWeightTest = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/weight-test`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving weight test data:', error);
    throw error;
  }
};

/**
 * Get all weight tests for an inspection call
 * GET /api/final-inspection/submodules/weight-test/call/{callNo}
 * @param {string} callNo - Inspection call number
 */
export const getWeightTestsByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/weight-test/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching weight test data:', error);
    throw error;
  }
};

/**
 * Save Toe Load Test data
 * POST /api/final-inspection/submodules/toe-load-test
 */
export const saveToeLoadTest = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/toe-load-test`;
    const payload = addCreatedByField(data);
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error saving toe load test data:', error);
    throw error;
  }
};

/**
 * Get all toe load tests for an inspection call
 * GET /api/final-inspection/submodules/toe-load-test/call/{callNo}
 * @param {string} callNo - Inspection call number
 */
export const getToeLoadTestsByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/toe-load-test/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching toe load test data:', error);
    throw error;
  }
};

/**
 * Finish Inspection - Save all submodule data to backend
 * Collects all inspection data from localStorage and saves to database
 *
 * For Visual & Dimensional data:
 * - Reads from localStorage: visualDimensionalData_${callNo}
 * - Splits into two separate API calls:
 *   1. Visual data → POST /api/final-material/visual-inspection
 *   2. Dimensional data → POST /api/final-material/dimensional-inspection
 * - Transforms field names from frontend format to backend format
 */
export const finishInspection = async (callNo) => {
  try {
    console.log(`🔄 Starting finish inspection process for call: ${callNo}`);

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Helper function to get and save data for a submodule (PARALLEL EXECUTION)
    const saveSubmoduleData = async (storageKey, apiFunction, moduleName) => {
      try {
        const storedData = localStorage.getItem(storageKey);
        if (!storedData) {
          console.log(`⏭️  Skipping ${moduleName} - no data found`);
          results.skipped.push(moduleName);
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving ${moduleName} data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo and qtyNo for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber,
                qtyNo: lot.lotSize || lot.offeredQty || 0
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";
          const qtyNo = lotDetailsMap[lotNo]?.qtyNo || 0;

          const payload = {
            inspectionCallNo: callNo,
            lotNo: lotNo,
            heatNo: heatNo,
            qtyNo: qtyNo,
            ...lotData
          };

          // Collect promise instead of awaiting
          promises.push(
            apiFunction(payload).then(() => {
              console.log(`✅ ${moduleName} saved for lot ${lotNo}`);
            })
          );
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push(moduleName);
      } catch (error) {
        console.error(`❌ Error saving ${moduleName}:`, error);
        results.failed.push({ module: moduleName, error: error.message });
      }
    };

    // Special handler for Visual & Dimensional data (split into two endpoints - PARALLEL EXECUTION)
    // Note: This function is defined but not currently used in the save flow
    /*
    const saveVisualDimensionalData = async () => {
      try {
        const storedData = localStorage.getItem(`visualDimensionalData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Visual & Dimensional - no data found`);
          results.skipped.push('Visual & Dimensional');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Visual & Dimensional data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];

        // Save each lot's data - split into visual and dimensional
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";

          // Save visual inspection data
          if (lotData.visualR1 !== "" || lotData.visualR2 !== "" || lotData.visualRemark !== "") {
            const visualPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              firstSampleRejected: lotData.visualR1 || 0,
              secondSampleRejected: lotData.visualR2 || 0,
              totalRejected: (lotData.visualR1 || 0) + (lotData.visualR2 || 0),
              remarks: lotData.visualRemark || "",
              status: "PENDING"
            };
            promises.push(
              saveVisualInspection(visualPayload).then(() => {
                console.log(`✅ Visual Inspection saved for lot ${lotNo}`);
              })
            );
          }

          // Save dimensional inspection data
          if (lotData.dimGo1 !== "" || lotData.dimNoGo1 !== "" || lotData.dimFlat1 !== "" ||
              lotData.dimGo2 !== "" || lotData.dimNoGo2 !== "" || lotData.dimFlat2 !== "" ||
              lotData.dimRemark !== "") {
            const dimensionalPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              firstSampleGoGaugeFail: lotData.dimGo1 || 0,
              firstSampleNoGoFail: lotData.dimNoGo1 || 0,
              firstSampleFlatBearingFail: lotData.dimFlat1 || 0,
              secondSampleGoGaugeFail: lotData.dimGo2 || 0,
              secondSampleNoGoFail: lotData.dimNoGo2 || 0,
              secondSampleFlatBearingFail: lotData.dimFlat2 || 0,
              totalRejected: (lotData.dimGo1 || 0) + (lotData.dimNoGo1 || 0) + (lotData.dimFlat1 || 0) +
                            (lotData.dimGo2 || 0) + (lotData.dimNoGo2 || 0) + (lotData.dimFlat2 || 0),
              remarks: lotData.dimRemark || "",
              status: "PENDING"
            };
            promises.push(
              saveDimensionalInspection(dimensionalPayload).then(() => {
                console.log(`✅ Dimensional Inspection saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Visual & Dimensional');
      } catch (error) {
        console.error(`❌ Error saving Visual & Dimensional:`, error);
        results.failed.push({ module: 'Visual & Dimensional', error: error.message });
      }
    };
    */

    // Special handler for Dimensional Inspection Flat data (FLAT STRUCTURE - FOR VISUAL INSPECTION PAGE)
    const saveDimensionalInspectionFlatData = async () => {
      try {
        const storedData = localStorage.getItem(`visualDimensionalData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Dimensional Inspection (Flat) - no data found`);
          results.skipped.push('Dimensional Inspection (Flat)');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Dimensional Inspection (Flat) data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];

        // Save each lot's dimensional inspection (flat) data
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";

          // Only save if there's actual dimensional data
          if (lotData.dimGo1 !== "" || lotData.dimNoGo1 !== "" || lotData.dimFlat1 !== "" ||
              lotData.dimGo2 !== "" || lotData.dimNoGo2 !== "" || lotData.dimFlat2 !== "" ||
              lotData.dimRemark !== "") {
            const dimensionalFlatPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              firstSampleGoGaugeFail: lotData.dimGo1 || 0,
              firstSampleNoGoFail: lotData.dimNoGo1 || 0,
              firstSampleFlatBearingFail: lotData.dimFlat1 || 0,
              secondSampleGoGaugeFail: lotData.dimGo2 || 0,
              secondSampleNoGoFail: lotData.dimNoGo2 || 0,
              secondSampleFlatBearingFail: lotData.dimFlat2 || 0,
              totalRejected: (lotData.dimGo1 || 0) + (lotData.dimNoGo1 || 0) + (lotData.dimFlat1 || 0) +
                            (lotData.dimGo2 || 0) + (lotData.dimNoGo2 || 0) + (lotData.dimFlat2 || 0),
              remarks: lotData.dimRemark || "",
              status: "PENDING"
            };
            promises.push(
              saveDimensionalInspectionFlat(dimensionalFlatPayload).then(() => {
                console.log(`✅ Dimensional Inspection (Flat) saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Dimensional Inspection (Flat)');
      } catch (error) {
        console.error(`❌ Error saving Dimensional Inspection (Flat):`, error);
        results.failed.push({ module: 'Dimensional Inspection (Flat)', error: error.message });
      }
    };

    // Special handler for Hardness Test data (needs heatNo and samples transformation - PARALLEL EXECUTION)
    const saveHardnessTestData = async () => {
      try {
        const storedData = localStorage.getItem(`hardnessTestData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Hardness Test - no data found`);
          results.skipped.push('Hardness Test');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Hardness Test data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo and qtyNo for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber,
                qtyNo: lot.lotSize || lot.offeredQty || 0
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];

        // Save each lot's hardness test data
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";
          const qtyNo = lotDetailsMap[lotNo]?.qtyNo || 0;

          // Only save if there's actual data
          if (lotData.hardness1st?.some(v => v !== "") || lotData.hardness2st?.some(v => v !== "") || lotData.remarks !== "") {
            // Transform frontend format to backend format
            const samples = [];

            // Add 1st sampling samples
            if (lotData.hardness1st && Array.isArray(lotData.hardness1st)) {
              lotData.hardness1st.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  samples.push({
                    samplingNo: 1,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: numValue < 40 || numValue > 44 // Rejection criteria for hardness
                  });
                }
              });
            }

            // Add 2nd sampling samples
            if (lotData.hardness2nd && Array.isArray(lotData.hardness2nd)) {
              lotData.hardness2nd.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  samples.push({
                    samplingNo: 2,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: numValue < 40 || numValue > 44 // Rejection criteria for hardness
                  });
                }
              });
            }

            const hardnessPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              qtyNo: qtyNo,
              remarks: lotData.remarks || "",
              status: "PENDING",
              samples: samples
            };

            promises.push(
              saveHardnessTest(hardnessPayload).then(() => {
                console.log(`✅ Hardness Test saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Hardness Test');
      } catch (error) {
        console.error(`❌ Error saving Hardness Test:`, error);
        results.failed.push({ module: 'Hardness Test', error: error.message });
      }
    };

    // Special handler for Weight Test data (needs heatNo, qtyNo and samples transformation - PARALLEL EXECUTION)
    const saveWeightTestData = async () => {
      try {
        const storedData = localStorage.getItem(`weightTestData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Weight Test - no data found`);
          results.skipped.push('Weight Test');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Weight Test data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo and qtyNo for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber,
                qtyNo: lot.lotSize || lot.offeredQty || 0
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];

        // Save each lot's weight test data
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";
          const qtyNo = lotDetailsMap[lotNo]?.qtyNo || 0;

          // Only save if there's actual data
          if (lotData.weight1st?.some(v => v !== "") || lotData.weight2nd?.some(v => v !== "") || lotData.remarks !== "") {
            // Transform frontend format to backend format
            const samples = [];

            // Add 1st sampling samples
            if (lotData.weight1st && Array.isArray(lotData.weight1st)) {
              lotData.weight1st.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  samples.push({
                    samplingNo: 1,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: false // Will be determined by backend based on tolerance
                  });
                }
              });
            }

            // Add 2nd sampling samples
            if (lotData.weight2nd && Array.isArray(lotData.weight2nd)) {
              lotData.weight2nd.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  samples.push({
                    samplingNo: 2,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: false // Will be determined by backend based on tolerance
                  });
                }
              });
            }

            const weightPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              qtyNo: qtyNo,
              remarks: lotData.remarks || "",
              status: "PENDING",
              samples: samples
            };

            promises.push(
              saveWeightTest(weightPayload).then(() => {
                console.log(`✅ Weight Test saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Weight Test');
      } catch (error) {
        console.error(`❌ Error saving Weight Test:`, error);
        results.failed.push({ module: 'Weight Test', error: error.message });
      }
    };

    // Special handler for Toe Load Test data (needs heatNo, qtyNo and samples transformation - PARALLEL EXECUTION)
    const saveToeLoadTestData = async () => {
      try {
        const storedData = localStorage.getItem(`toeLoadTestData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Toe Load Test - no data found`);
          results.skipped.push('Toe Load Test');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Toe Load Test data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo and qtyNo for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber,
                qtyNo: lot.lotSize || lot.offeredQty || 0
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];

        // Save each lot's toe load test data
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";
          const qtyNo = lotDetailsMap[lotNo]?.qtyNo || 0;

          // Only save if there's actual data
          if (lotData.toe1st?.some(v => v !== "") || lotData.toe2nd?.some(v => v !== "") || lotData.remarks !== "") {
            // Transform frontend format to backend format
            const samples = [];

            // Add 1st sampling samples
            if (lotData.toe1st && Array.isArray(lotData.toe1st)) {
              lotData.toe1st.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  samples.push({
                    samplingNo: 1,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: false // Will be determined by backend based on tolerance
                  });
                }
              });
            }

            // Add 2nd sampling samples
            if (lotData.toe2nd && Array.isArray(lotData.toe2nd)) {
              lotData.toe2nd.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  samples.push({
                    samplingNo: 2,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: false // Will be determined by backend based on tolerance
                  });
                }
              });
            }

            const toeLoadPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              qtyNo: qtyNo,
              remarks: lotData.remarks || "",
              status: "PENDING",
              samples: samples
            };

            promises.push(
              saveToeLoadTest(toeLoadPayload).then(() => {
                console.log(`✅ Toe Load Test saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Toe Load Test');
      } catch (error) {
        console.error(`❌ Error saving Toe Load Test:`, error);
        results.failed.push({ module: 'Toe Load Test', error: error.message });
      }
    };

    // Special handler for new submodules (split from combined inclusion rating data - PARALLEL EXECUTION)
    const saveNewSubmodulesData = async () => {
      try {
        const storedData = localStorage.getItem(`inclusionRatingData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping new submodules - no data found`);
          results.skipped.push('Depth of Decarburization', 'Inclusion Rating', 'Microstructure Test', 'Freedom from Defects');
          return;
        }

        const data = JSON.parse(storedData);

        // Get lot details from sessionStorage
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber,
                qtyNo: lot.lotSize || lot.offeredQty || 0
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Track which submodules had data and collect promises
        let hasDecarb = false, hasInclusion = false, hasMicrostructure = false, hasDefects = false;
        const promises = [];

        // Process each lot and split into 4 separate submodules
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";
          const qtyNo = lotDetailsMap[lotNo]?.qtyNo || 0;
          const sampleSize = lotData.microstructure1st?.length || 0;

          // 1. DEPTH OF DECARBURIZATION
          if (lotData.decarb1st || lotData.decarb2nd) {
            const decarbSamples = [];

            // Add 1st sampling samples
            if (lotData.decarb1st && Array.isArray(lotData.decarb1st)) {
              lotData.decarb1st.forEach((value, index) => {
                if (value !== "") {
                  decarbSamples.push({
                    samplingNo: 1,
                    sampleNo: index + 1,
                    sampleValue: value
                  });
                }
              });
            }

            // Add 2nd sampling samples
            if (lotData.decarb2nd && Array.isArray(lotData.decarb2nd)) {
              lotData.decarb2nd.forEach((value, index) => {
                if (value !== "") {
                  decarbSamples.push({
                    samplingNo: 2,
                    sampleNo: index + 1,
                    sampleValue: value
                  });
                }
              });
            }

            if (decarbSamples.length > 0) {
              const decarbPayload = {
                inspectionCallNo: callNo,
                lotNo: lotNo,
                heatNo: heatNo,
                sampleSize: sampleSize,
                qty: qtyNo,
                remarks: lotData.decarbRemarks || "",
                status: "PENDING",
                samples: decarbSamples
              };
              promises.push(
                // eslint-disable-next-line no-loop-func
                saveDepthOfDecarburization(decarbPayload).then(() => {
                  hasDecarb = true;
                  console.log(`✅ Depth of Decarburization saved for lot ${lotNo}`);
                })
              );
            }
          }

          // 2. INCLUSION RATING (NEW)
          if (lotData.inclusion1st || lotData.inclusion2nd) {
            const inclusionSamples = [];

            // Add 1st sampling samples
            if (lotData.inclusion1st && Array.isArray(lotData.inclusion1st)) {
              lotData.inclusion1st.forEach((value, index) => {
                if (value && (value.A || value.B || value.C || value.D)) {
                  inclusionSamples.push({
                    samplingNo: 1,
                    sampleNo: index + 1,
                    sampleValueA: value.A || "",
                    sampleValueB: value.B || "",
                    sampleValueC: value.C || "",
                    sampleValueD: value.D || ""
                  });
                }
              });
            }

            // Add 2nd sampling samples
            if (lotData.inclusion2nd && Array.isArray(lotData.inclusion2nd)) {
              lotData.inclusion2nd.forEach((value, index) => {
                if (value && (value.A || value.B || value.C || value.D)) {
                  inclusionSamples.push({
                    samplingNo: 2,
                    sampleNo: index + 1,
                    sampleValueA: value.A || "",
                    sampleValueB: value.B || "",
                    sampleValueC: value.C || "",
                    sampleValueD: value.D || ""
                  });
                }
              });
            }

            if (inclusionSamples.length > 0) {
              const inclusionPayload = {
                inspectionCallNo: callNo,
                lotNo: lotNo,
                heatNo: heatNo,
                sampleSize: sampleSize,
                samplingType: "STANDARD",
                remarks: lotData.inclusionRemarks || "",
                status: "PENDING",
                samples: inclusionSamples
              };
              promises.push(
                // eslint-disable-next-line no-loop-func
                saveInclusionRatingNew(inclusionPayload).then(() => {
                  hasInclusion = true;
                  console.log(`✅ Inclusion Rating saved for lot ${lotNo}`);
                })
              );
            }
          }

          // 3. MICROSTRUCTURE TEST
          if (lotData.microstructure1st || lotData.microstructure2nd) {
            const microstructureSamples = [];

            // Add 1st sampling samples
            if (lotData.microstructure1st && Array.isArray(lotData.microstructure1st)) {
              lotData.microstructure1st.forEach((value, index) => {
                if (value !== "") {
                  microstructureSamples.push({
                    sampleNo: index + 1,
                    sampleType: value
                  });
                }
              });
            }

            if (microstructureSamples.length > 0) {
              const microstructurePayload = {
                inspectionCallNo: callNo,
                lotNo: lotNo,
                heatNo: heatNo,
                sampleSize: sampleSize,
                qty: qtyNo,
                remarks: lotData.microstructureRemarks || "",
                status: "PENDING",
                samples: microstructureSamples
              };
              promises.push(
                // eslint-disable-next-line no-loop-func
                saveMicrostructureTest(microstructurePayload).then(() => {
                  hasMicrostructure = true;
                  console.log(`✅ Microstructure Test saved for lot ${lotNo}`);
                })
              );
            }
          }

          // 4. FREEDOM FROM DEFECTS
          if (lotData.defects1st || lotData.defects2nd) {
            const defectsSamples = [];

            // Add 1st sampling samples
            if (lotData.defects1st && Array.isArray(lotData.defects1st)) {
              lotData.defects1st.forEach((value, index) => {
                if (value !== "") {
                  defectsSamples.push({
                    samplingNo: 1,
                    sampleNo: index + 1,
                    sampleType: value
                  });
                }
              });
            }

            // Add 2nd sampling samples
            if (lotData.defects2nd && Array.isArray(lotData.defects2nd)) {
              lotData.defects2nd.forEach((value, index) => {
                if (value !== "") {
                  defectsSamples.push({
                    samplingNo: 2,
                    sampleNo: index + 1,
                    sampleType: value
                  });
                }
              });
            }

            if (defectsSamples.length > 0) {
              const defectsPayload = {
                inspectionCallNo: callNo,
                lotNo: lotNo,
                heatNo: heatNo,
                sampleSize: sampleSize,
                qty: qtyNo,
                remarks: lotData.defectsRemarks || "",
                status: "PENDING",
                samples: defectsSamples
              };
              promises.push(
                // eslint-disable-next-line no-loop-func
                saveFreedomFromDefectsTest(defectsPayload).then(() => {
                  hasDefects = true;
                  console.log(`✅ Freedom from Defects saved for lot ${lotNo}`);
                })
              );
            }
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);

        // Add to results only if data was found
        if (hasDecarb) results.success.push('Depth of Decarburization');
        if (hasInclusion) results.success.push('Inclusion Rating');
        if (hasMicrostructure) results.success.push('Microstructure Test');
        if (hasDefects) results.success.push('Freedom from Defects');
      } catch (error) {
        console.error(`❌ Error saving new submodules:`, error);
        results.failed.push({ module: 'New Submodules', error: error.message });
      }
    };

    // Special handler for Chemical Analysis data (needs field name transformation - PARALLEL EXECUTION)
    const saveChemicalAnalysisData = async () => {
      try {
        const storedData = localStorage.getItem(`chemicalAnalysisData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Chemical Analysis - no data found`);
          results.skipped.push('Chemical Analysis');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Chemical Analysis data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];

        // Save each lot's chemical analysis data
        for (const [lotNo, lotData] of Object.entries(data.chemValues || {})) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";

          // Only save if there's actual data
          if (Object.values(lotData).some(v => v !== "" && v !== null && v !== undefined)) {
            // Transform frontend format (c, si, mn, s, p) to backend format
            const chemicalPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              carbonPercent: lotData.c ? parseFloat(lotData.c) : null,
              siliconPercent: lotData.si ? parseFloat(lotData.si) : null,
              manganesePercent: lotData.mn ? parseFloat(lotData.mn) : null,
              sulphurPercent: lotData.s ? parseFloat(lotData.s) : null,
              phosphorusPercent: lotData.p ? parseFloat(lotData.p) : null,
              remarks: data.remarks?.[lotNo] || ""
            };

            promises.push(
              saveChemicalAnalysis(chemicalPayload).then(() => {
                console.log(`✅ Chemical Analysis saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Chemical Analysis');
      } catch (error) {
        console.error(`❌ Error saving Chemical Analysis:`, error);
        results.failed.push({ module: 'Chemical Analysis', error: error.message });
      }
    };

    // Special handler for Dimensional Inspection data (new parent-child structure with samples - PARALLEL EXECUTION)
    const saveDimensionalInspectionData = async () => {
      try {
        const storedData = localStorage.getItem(`deflectionTestData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Dimensional Inspection - no data found`);
          results.skipped.push('Dimensional Inspection');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Dimensional Inspection data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo and sampleSize for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber,
                sampleSize: lot.lotSize || lot.offeredQty || 0
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];

        // Save each lot's dimensional inspection data
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";
          const sampleSize = lotDetailsMap[lotNo]?.sampleSize || 0;

          // Only save if there's actual dimensional data
          if (lotData.dimGo1 !== "" || lotData.dimNoGo1 !== "" || lotData.dimFlat1 !== "" ||
              lotData.dimGo2 !== "" || lotData.dimNoGo2 !== "" || lotData.dimFlat2 !== "" ||
              lotData.dimRemarks !== "") {

            const dimSamples = [];

            // Add 1st sampling - NEW SCHEMA: goGaugeFailed, noGoGaugeFailed, flatnessFailed
            if (lotData.dimGo1 !== "" || lotData.dimNoGo1 !== "" || lotData.dimFlat1 !== "") {
              dimSamples.push({
                samplingNo: 1,
                goGaugeFailed: parseInt(lotData.dimGo1) || 0,
                noGoGaugeFailed: parseInt(lotData.dimNoGo1) || 0,
                flatnessFailed: parseInt(lotData.dimFlat1) || 0
              });
            }

            // Add 2nd sampling - NEW SCHEMA: goGaugeFailed, noGoGaugeFailed, flatnessFailed
            if (lotData.dimGo2 !== "" || lotData.dimNoGo2 !== "" || lotData.dimFlat2 !== "") {
              dimSamples.push({
                samplingNo: 2,
                goGaugeFailed: parseInt(lotData.dimGo2) || 0,
                noGoGaugeFailed: parseInt(lotData.dimNoGo2) || 0,
                flatnessFailed: parseInt(lotData.dimFlat2) || 0
              });
            }

            const dimPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              sampleSize: sampleSize,
              remarks: lotData.dimRemarks || "",
              status: "PENDING",
              samples: dimSamples
            };

            promises.push(
              saveDimensionalInspection(dimPayload).then(() => {
                console.log(`✅ Dimensional Inspection saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Dimensional Inspection');
      } catch (error) {
        console.error(`❌ Error saving Dimensional Inspection:`, error);
        results.failed.push({ module: 'Dimensional Inspection', error: error.message });
      }
    };

    // Special handler for Application Deflection data (new parent-child structure with samples - PARALLEL EXECUTION)
    const saveApplicationDeflectionData = async () => {
      try {
        const storedData = localStorage.getItem(`deflectionTestData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Application Deflection - no data found`);
          results.skipped.push('Application Deflection');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Application Deflection data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo and sampleSize for each lot
        let lotDetailsMap = {};
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber,
                sampleSize: lot.lotSize || lot.offeredQty || 0
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        // Collect all promises for parallel execution
        const promises = [];

        // Save each lot's application deflection data
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";
          const sampleSize = lotDetailsMap[lotNo]?.sampleSize || 0;

          // Only save if there's actual deflection data
          if (lotData.deflectionR1 !== "" || lotData.deflectionR2 !== "" || lotData.deflectionRemarks !== "") {

            const deflSamples = [];

            // Add 1st sampling - NEW SCHEMA: noOfSamplesFailed
            if (lotData.deflectionR1 !== "") {
              deflSamples.push({
                samplingNo: 1,
                noOfSamplesFailed: parseInt(lotData.deflectionR1) || 0
              });
            }

            // Add 2nd sampling - NEW SCHEMA: noOfSamplesFailed
            if (lotData.deflectionR2 !== "") {
              deflSamples.push({
                samplingNo: 2,
                noOfSamplesFailed: parseInt(lotData.deflectionR2) || 0
              });
            }

            const deflPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              sampleSize: sampleSize,
              remarks: lotData.deflectionRemarks || "",
              status: "PENDING",
              samples: deflSamples
            };

            promises.push(
              saveApplicationDeflection(deflPayload).then(() => {
                console.log(`✅ Application Deflection saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Application Deflection');
      } catch (error) {
        console.error(`❌ Error saving Application Deflection:`, error);
        results.failed.push({ module: 'Application Deflection', error: error.message });
      }
    };

    // Save all submodule data in parallel for maximum performance
    await Promise.all([
      // NOTE: saveVisualDimensionalData() is DEPRECATED - use saveDimensionalInspectionData() instead
      // saveVisualDimensionalData(),
      saveDimensionalInspectionFlatData(),
      saveHardnessTestData(),
      saveWeightTestData(),
      saveToeLoadTestData(),
      // New parent-child structure submodules (split from combined inclusion rating data)
      saveNewSubmodulesData(),
      // New consolidated endpoints for dimensional inspection and application deflection
      saveDimensionalInspectionData(),
      saveApplicationDeflectionData(),
      // Legacy submodules
      saveChemicalAnalysisData(),
      saveSubmoduleData(`calibrationDocumentsData_${callNo}`, saveCalibrationDocuments, 'Calibration & Documents')
    ]);

    console.log('📊 Finish Inspection Results:', results);
    return results;
  } catch (error) {
    console.error('Error during finish inspection:', error);
    throw error;
  }
};

/**
 * Get Depth of Decarburization tests by Call Number
 * GET /api/final-inspection/submodules/depth-of-decarburization/call/{callNo}
 */
export const getDepthOfDecarburizationByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/depth-of-decarburization/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving depth of decarburization tests:', error);
    throw error;
  }
};

/**
 * Get Inclusion Rating tests by Call Number
 * GET /api/final-inspection/submodules/inclusion-rating-new/call/{callNo}
 */
export const getInclusionRatingByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/inclusion-rating-new/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving inclusion rating tests:', error);
    throw error;
  }
};

/**
 * Get Microstructure tests by Call Number
 * GET /api/final-inspection/submodules/microstructure-test/call/{callNo}
 */
export const getMicrostructureTestByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/microstructure-test/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving microstructure tests:', error);
    throw error;
  }
};

/**
 * Get Freedom from Defects tests by Call Number
 * GET /api/final-inspection/submodules/freedom-from-defects-test/call/{callNo}
 */
export const getFreedomFromDefectsTestByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/freedom-from-defects-test/call/${encodeURIComponent(callNo)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving freedom from defects tests:', error);
    throw error;
  }
};

/**
 * Get Ladle Values by Call Number
 * Fetches chemical composition values from vendor's ladle analysis
 * GET /api/final-inspection/submodules/ladle-values/{callNo}
 */
export const getLadleValuesByCall = async (callNo) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/ladle-values/${callNo}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error retrieving ladle values:', error);
    throw error;
  }
};
