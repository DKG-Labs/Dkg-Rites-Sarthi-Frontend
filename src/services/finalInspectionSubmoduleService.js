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
 * Enrich payload with userId and inspectionDate
 * @param {Object} data - Original data object
 * @returns {Object} Data with audit and date fields added
 */
const enrichPayload = (data) => {
  const userId = getCurrentUserId();
  const inspectionDate = sessionStorage.getItem('inspectionDate');
  return {
    ...data,
    createdBy: userId,
    updatedBy: userId,
    dateOfInspection: inspectionDate
  };
};

/**
 * Save Calibration & Documents data
 * POST /api/final-inspection/submodules/calibration-documents
 */
export const saveCalibrationDocuments = async (data) => {
  try {
    const url = `${API_BASE_URL}/api/final-inspection/submodules/calibration-documents`;
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    const payload = enrichPayload(data);
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
    // Special handler for Visual Inspection data (NEW consolidated endpoint - PARALLEL EXECUTION)
    const saveVisualInspectionData = async () => {
      try {
        const storedData = localStorage.getItem(`visualDimensionalData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping Visual Inspection - no data found`);
          results.skipped.push('Visual Inspection');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving Visual Inspection data:`, data);

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

        // Save each lot's visual inspection data
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";

          // Only save if there's actual visual data
          if (lotData.visualR1 !== "" || lotData.visualR2 !== "" || lotData.visualRemark !== "") {
            const r1 = parseInt(lotData.visualR1) || 0;
            const r2 = parseInt(lotData.visualR2) || 0;
            const totalRejected = r1 + r2;

            const visualPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              firstSampleRejected: r1,
              secondSampleRejected: r2,
              totalRejected: totalRejected,
              remarks: lotData.visualRemark || "",
              status: totalRejected > 0 ? "NOT OK" : "OK"
            };

            promises.push(
              saveVisualInspection(visualPayload).then(() => {
                console.log(`✅ Visual Inspection saved for lot ${lotNo}`);
              })
            );
          }
        }

        // Execute all promises in parallel
        await Promise.all(promises);
        results.success.push('Visual Inspection');
      } catch (error) {
        console.error(`❌ Error saving Visual Inspection:`, error);
        results.failed.push({ module: 'Visual Inspection', error: error.message });
      }
    };

    // Special handler for NEW submodules (Inclusion, Decarb, Micro, Defects - PARALLEL EXECUTION)
    const saveNewSubmodulesData = async () => {
      try {
        const storedData = localStorage.getItem(`inclusionRatingData_${callNo}`);
        if (!storedData) {
          console.log(`⏭️  Skipping New Submodules (Inclusion/Decarb/Micro/Defects) - no data found`);
          results.skipped.push('Inclusion Rating Tests');
          return;
        }

        const data = JSON.parse(storedData);
        console.log(`📤 Saving New Submodules data:`, data);

        // Get lot details from sessionStorage to retrieve heatNo and quantity for each lot
        let lotDetailsMap = {};
        let ercType = "MK-III";
        try {
          const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
          if (fpDashboardCache) {
            const cacheData = JSON.parse(fpDashboardCache);
            const dashboardData = cacheData[callNo]?.dashboardData || cacheData[callNo] || {};
            ercType = dashboardData.inspectionCall?.ercType || dashboardData.ercType || "MK-III";
            
            const finalLotDetails = cacheData[callNo]?.finalLotDetails || dashboardData.finalLotDetails || [];
            finalLotDetails.forEach(lot => {
              lotDetailsMap[lot.lotNo || lot.lotNumber] = {
                heatNo: lot.heatNo || lot.heatNumber,
                qty: lot.lotSize || lot.offeredQty || 0
              };
            });
          }
        } catch (e) {
          console.warn('Could not retrieve lot details from cache:', e);
        }

        const maxDecarb = ercType.includes('MK-V') ? 0.23 : 0.15;
        const promises = [];
        let hasDecarb = false, hasInclusion = false, hasMicrostructure = false, hasDefects = false;

        // Process each lot
        for (const [lotNo, lotData] of Object.entries(data)) {
          const heatNo = lotDetailsMap[lotNo]?.heatNo || "";
          const qty = lotDetailsMap[lotNo]?.qty || 0;

          // 1. Depth of Decarburization
          const decarb1st = lotData.decarb1st || [];
          const decarb2nd = lotData.decarb2nd || [];
          if (decarb1st.length > 0 || decarb2nd.length > 0) {
            hasDecarb = true;
            const decarbSamples = [];
            let rejectedCount = 0;

            decarb1st.forEach((v, index) => {
              if (v !== "") {
                const val = parseFloat(v);
                if (val > maxDecarb) rejectedCount++;
                decarbSamples.push({ samplingNo: 1, sampleNo: index + 1, sampleValue: val });
              }
            });
            decarb2nd.forEach((v, index) => {
              if (v !== "") {
                const val = parseFloat(v);
                if (val > maxDecarb) rejectedCount++;
                decarbSamples.push({ samplingNo: 2, sampleNo: index + 1, sampleValue: val });
              }
            });

            if (decarbSamples.length > 0) {
              promises.push(
                saveDepthOfDecarburization({
                  inspectionCallNo: callNo,
                  lotNo: lotNo,
                  heatNo: heatNo,
                  sampleSize: decarbSamples.length,
                  qty: qty,
                  remarks: lotData.decarbRemarks || "",
                  status: rejectedCount > 0 ? "NOT OK" : "OK",
                  rejected: rejectedCount,
                  samples: decarbSamples
                }).then(() => console.log(`✅ Depth of Decarburization saved for lot ${lotNo}`))
              );
            }
          }

          // 2. Inclusion Rating
          const inclusion1st = lotData.inclusion1st || [];
          const inclusion2nd = lotData.inclusion2nd || [];
          if (inclusion1st.length > 0 || inclusion2nd.length > 0) {
            hasInclusion = true;
            const inclusionSamples = [];
            let rejectedCount = 0;

            const processInclusionSample = (s, samplingNo, index) => {
              if (!s || typeof s !== 'object') return;
              const sample = {
                samplingNo: samplingNo,
                sampleNo: index + 1,
                sampleValueA: s.A || "", sampleTypeA: s.typeA || "",
                sampleValueB: s.B || "", sampleTypeB: s.typeB || "",
                sampleValueC: s.C || "", sampleTypeC: s.typeC || "",
                sampleValueD: s.D || "", sampleTypeD: s.typeD || ""
              };
              
              if (parseFloat(s.A) > 2.0 || parseFloat(s.B) > 2.0 || parseFloat(s.C) > 2.0 || parseFloat(s.D) > 2.0) {
                rejectedCount++;
              }
              inclusionSamples.push(sample);
            };

            inclusion1st.forEach((s, i) => processInclusionSample(s, 1, i));
            inclusion2nd.forEach((s, i) => processInclusionSample(s, 2, i));

            if (inclusionSamples.length > 0) {
              promises.push(
                saveInclusionRatingNew({
                  inspectionCallNo: callNo,
                  lotNo: lotNo,
                  heatNo: heatNo,
                  sampleSize: inclusionSamples.length,
                  samplingType: "Random",
                  remarks: lotData.inclusionRemarks || "",
                  status: rejectedCount > 0 ? "NOT OK" : "OK",
                  rejected: rejectedCount,
                  samples: inclusionSamples
                }).then(() => console.log(`✅ Inclusion Rating saved for lot ${lotNo}`))
              );
            }
          }

          // 3. Microstructure Test
          const micro1st = lotData.microstructure1st || [];
          const micro2nd = lotData.microstructure2nd || [];
          if (micro1st.length > 0 || micro2nd.length > 0) {
            hasMicrostructure = true;
            const microSamples = [];
            let rejectedCount = 0;

            micro1st.forEach((v, index) => {
              if (v !== "") {
                if (v === 'Not Tempered Martensite') rejectedCount++;
                microSamples.push({ samplingNo: 1, sampleNo: index + 1, sampleType: v });
              }
            });
            micro2nd.forEach((v, index) => {
              if (v !== "") {
                if (v === 'Not Tempered Martensite') rejectedCount++;
                microSamples.push({ samplingNo: 2, sampleNo: index + 1, sampleType: v });
              }
            });

            if (microSamples.length > 0) {
              promises.push(
                saveMicrostructureTest({
                  inspectionCallNo: callNo,
                  lotNo: lotNo,
                  heatNo: heatNo,
                  sampleSize: microSamples.length,
                  qty: qty,
                  remarks: lotData.microstructureRemarks || "",
                  status: rejectedCount > 0 ? "NOT OK" : "OK",
                  rejected: rejectedCount,
                  samples: microSamples
                }).then(() => console.log(`✅ Microstructure Test saved for lot ${lotNo}`))
              );
            }
          }

          // 4. Freedom from Defects
          const defects1st = lotData.defects1st || [];
          const defects2nd = lotData.defects2nd || [];
          if (defects1st.length > 0 || defects2nd.length > 0) {
            hasDefects = true;
            const defectSamples = [];
            let rejectedCount = 0;

            defects1st.forEach((v, index) => {
              if (v !== "") {
                if (v === 'NOT OK') rejectedCount++;
                defectSamples.push({ samplingNo: 1, sampleNo: index + 1, sampleType: v });
              }
            });
            defects2nd.forEach((v, index) => {
              if (v !== "") {
                if (v === 'NOT OK') rejectedCount++;
                defectSamples.push({ samplingNo: 2, sampleNo: index + 1, sampleType: v });
              }
            });

            if (defectSamples.length > 0) {
              promises.push(
                saveFreedomFromDefectsTest({
                  inspectionCallNo: callNo,
                  lotNo: lotNo,
                  heatNo: heatNo,
                  sampleSize: defectSamples.length,
                  qty: qty,
                  remarks: lotData.defectsRemarks || "",
                  status: rejectedCount > 0 ? "NOT OK" : "OK",
                  rejected: rejectedCount,
                  samples: defectSamples
                }).then(() => console.log(`✅ Freedom from Defects saved for lot ${lotNo}`))
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
              const totalRejected = (lotData.dimGo1 || 0) + (lotData.dimNoGo1 || 0) + (lotData.dimFlat1 || 0) +
                (lotData.dimGo2 || 0) + (lotData.dimNoGo2 || 0) + (lotData.dimFlat2 || 0);

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
                totalRejected: totalRejected,
                remarks: lotData.dimRemark || "",
                status: totalRejected > 0 ? "NOT OK" : "OK"
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

            const totalRejected = samples.filter(s => s.isRejected).length;

            const hardnessPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              qtyNo: qtyNo,
              remarks: lotData.remarks || "",
              status: samples.length > 0 ? (totalRejected > 0 ? "NOT OK" : "OK") : "PENDING",
              rejected: totalRejected,
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

          // Get spring type from cache to determine weight tolerance
          let springType = "MK-III"; // Default
          try {
            const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
            if (fpDashboardCache) {
              const cacheData = JSON.parse(fpDashboardCache);
              springType = cacheData[callNo]?.dashboardData?.inspectionCall?.ercType || 
                           cacheData[callNo]?.inspectionCall?.ercType || 
                           "MK-III";
            }
          } catch (e) {
            console.warn('Could not retrieve ercType from cache:', e);
          }

          // Tolerance values (Must match FinalWeightTestPage.jsx)
          const TOLERANCE = {
            "MK-III": { min: 904, max: 937 },
            "MK-V": { min: 1068, max: 1108 },
            "ERC-J": { min: 904, max: 937 }
          };

          // Normalize type
          const normalType = (springType || "").toUpperCase().replace(/[\s-]/g, '');
          let finalType = "MK-III";
          if (normalType.includes("MKV")) finalType = "MK-V";
          else if (normalType.includes("ERCJ")) finalType = "ERC-J";
          
          const limits = TOLERANCE[finalType] || TOLERANCE["MK-III"];

          // Only save if there's actual data
          if (lotData.weight1st?.some(v => v !== "") || lotData.weight2nd?.some(v => v !== "") || lotData.remarks !== "") {
            // Transform frontend format to backend format
            const samples = [];
            let r1 = 0;
            let r2 = 0;

            // Add 1st sampling samples
            if (lotData.weight1st && Array.isArray(lotData.weight1st)) {
              lotData.weight1st.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  const rejected = numValue < limits.min || numValue > limits.max;
                  if (rejected) r1++;
                  samples.push({
                    samplingNo: 1,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: rejected
                  });
                }
              });
            }

            // Add 2nd sampling samples
            if (lotData.weight2nd && Array.isArray(lotData.weight2nd)) {
              lotData.weight2nd.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  const rejected = numValue < limits.min || numValue > limits.max;
                  if (rejected) r2++;
                  samples.push({
                    samplingNo: 2,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: rejected
                  });
                }
              });
            }

            // Calculate status based on common AQL patterns (simplified or passed from UI if possible)
            // But for now, we'll just determine OK/NOT OK based on whether ANY sample is rejected 
            // and if all required samples are present.
            // A more robust way is to use the calculated 'result' from the UI if we had it in storage.
            // Since we don't store the result in localStorage, we do a basic Check:
            const totalRejected = r1 + r2;
            let finalStatus = "PENDING";
            
            // If data exists, mark it as OK or NOT OK
            if (samples.length > 0) {
                // If any rejection exists, it's at least potentially NOT OK.
                // In the interest of safety and mirroring the UI which the user sees,
                // we'll mark it NOT OK if there are rejections exceeding typical AQL (usually Ac=0 for first sampling in these tests)
                // Actually, let's just use the presence of rejections to flag it for inspector review as NOT OK.
                finalStatus = totalRejected > 0 ? "NOT OK" : "OK";
            }

            const weightPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              qtyNo: qtyNo,
              remarks: lotData.remarks || "",
              status: finalStatus,
              rejected: totalRejected,
              samples: samples
            };

            promises.push(
              saveWeightTest(weightPayload).then(() => {
                console.log(`✅ Weight Test saved for lot ${lotNo} with status ${finalStatus}`);
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

          // Get spring type from cache to determine toe load tolerance
          let springType = "MK-III"; // Default
          try {
            const fpDashboardCache = sessionStorage.getItem('fpDashboardDataCache');
            if (fpDashboardCache) {
              const cacheData = JSON.parse(fpDashboardCache);
              springType = cacheData[callNo]?.dashboardData?.inspectionCall?.ercType || 
                           cacheData[callNo]?.inspectionCall?.ercType || 
                           "MK-III";
            }
          } catch (e) {
            console.warn('Could not retrieve ercType from cache:', e);
          }

          // Tolerance values (Must match FinalToeLoadTestPage.jsx)
          const TOLERANCES = {
            "MK-III": { min: 850, max: 1100 },
            "MK-V": { min: 1200, max: 1500 },
            "ERC-J": { min: 650, max: Infinity }
          };

          // Normalize type
          const normalType = (springType || "").toUpperCase().replace(/[\s-]/g, '');
          let finalType = "MK-III";
          if (normalType.includes("MKV")) finalType = "MK-V";
          else if (normalType.includes("ERCJ")) finalType = "ERC-J";
          
          const limits = TOLERANCES[finalType] || TOLERANCES["MK-III"];

          // Only save if there's actual data
          if (lotData.toe1st?.some(v => v !== "") || lotData.toe2nd?.some(v => v !== "") || lotData.remarks !== "") {
            // Transform frontend format to backend format
            const samples = [];
            let totalRejected = 0;

            // Add 1st sampling samples
            if (lotData.toe1st && Array.isArray(lotData.toe1st)) {
              lotData.toe1st.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  let rejected = false;
                  if (finalType === "ERC-J") {
                      rejected = numValue <= limits.min;
                  } else {
                      rejected = numValue < limits.min || numValue > limits.max;
                  }
                  if (rejected) totalRejected++;
                  samples.push({
                    samplingNo: 1,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: rejected
                  });
                }
              });
            }

            // Add 2nd sampling samples
            if (lotData.toe2nd && Array.isArray(lotData.toe2nd)) {
              lotData.toe2nd.forEach((value, index) => {
                if (value !== "") {
                  const numValue = parseFloat(value);
                  let rejected = false;
                  if (finalType === "ERC-J") {
                      rejected = numValue <= limits.min;
                  } else {
                      rejected = numValue < limits.min || numValue > limits.max;
                  }
                  if (rejected) totalRejected++;
                  samples.push({
                    samplingNo: 2,
                    sampleNo: index + 1,
                    sampleValue: numValue,
                    isRejected: rejected
                  });
                }
              });
            }

            // Calculate status
            let finalStatus = "PENDING";
            if (samples.length > 0) {
                // If any rejection exists, mark as NOT OK.
                // Note: The UI has complex AQL logic, but for simple storage validation, 
                // we'll flag any rejection as potentially NOT OK in the core status field.
                finalStatus = totalRejected > 0 ? "NOT OK" : "OK";
            }

            const toeLoadPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              qtyNo: qtyNo,
              remarks: lotData.remarks || "",
              status: finalStatus,
              rejected: totalRejected,
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

            // Calculate total rejected and status
            let totalRejectedInSamples = 0;
            dimSamples.forEach(s => {
              totalRejectedInSamples += (s.goGaugeFailed || 0) + (s.noGoGaugeFailed || 0) + (s.flatnessFailed || 0);
            });

            const dimPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              sampleSize: sampleSize,
              remarks: lotData.dimRemarks || "",
              status: dimSamples.length > 0 ? (totalRejectedInSamples > 0 ? "NOT OK" : "OK") : "PENDING",
              rejected: totalRejectedInSamples,
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

            // Calculate total rejected and status
            let totalRejected = 0;
            deflSamples.forEach(s => {
              totalRejected += (s.noOfSamplesFailed || 0);
            });

            const deflPayload = {
              inspectionCallNo: callNo,
              lotNo: lotNo,
              heatNo: heatNo,
              sampleSize: sampleSize,
              remarks: lotData.deflectionRemarks || "",
              status: totalRejected > 0 ? "NOT OK" : "OK",
              rejected: totalRejected,
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
      saveVisualInspectionData(),
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
    const url = `${API_BASE_URL}/api/final-inspection/submodules/ladle-values/${encodeURIComponent(callNo)}`;
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

/**
 * Get IC Report Data (with optional digital signature request)
 * GET /api/certificate/report-data
 * 
 * @param {Object} params - Report parameters (CaseNO, CallSNo, BkNo, SetNo, isDigitallySign, etc.)
 */
export const getICReportData = async (params) => {
  try {
    const url = `${API_BASE_URL}/api/certificate/report-data`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching IC report data:', error);
    throw error;
  }
};
