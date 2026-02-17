import { API_BASE_URL } from './apiConfig';
import { getAuthHeaders, handleResponse } from './apiConfig';

/**
 * Get Final Product Dashboard data by call number
 * Optimized endpoint that returns all dashboard data in one call
 * GET /api/final-material/dashboard/{callNo}
 */
export const getFinalDashboardData = async (callNo) => {
  try {
    console.log(`📡 Fetching Final Product dashboard data for call: ${callNo}`);
    const url = `${API_BASE_URL}/api/final-material/dashboard/${callNo}`;
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    console.log(`📊 Response status: ${response.status}`);

    const result = await handleResponse(response);
    console.log(`✅ Final Product dashboard data fetched:`, result.responseData);
    return result.responseData;
  } catch (error) {
    console.error(`❌ Error fetching Final Product dashboard data:`, error);
    throw error;
  }
};

/**
 * Get Final Product inspection call details by call number
 * Fetches inspection call, final details, lot details, and PO data
 * GET /api/final-material/inspection/{callNo}
 * @deprecated Use getFinalDashboardData instead for better performance
 */
export const getFinalInspectionCallDetails = async (callNo) => {
  try {
    console.log(`📡 Fetching Final Product inspection details for call: ${callNo}`);
    const url = `${API_BASE_URL}/api/final-material/inspection/${callNo}`;
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    console.log(`📊 Response status: ${response.status}`);

    const result = await handleResponse(response);
    console.log(`✅ Final Product inspection details fetched:`, result.responseData);
    return result.responseData;
  } catch (error) {
    console.error(`❌ Error fetching Final Product inspection details:`, error);
    throw error;
  }
};

/**
 * Get PO data for Final Product inspection
 * Includes all sections and lot details
 * GET /api/po-data/sections?poNo={poNo}&requestId={callNo}
 */
export const getFinalPoData = async (poNo, callNo) => {
  try {
    console.log(`📋 Fetching PO data for PO: ${poNo}, Call: ${callNo}`);
    const url = `${API_BASE_URL}/api/po-data/sections?poNo=${poNo}&requestId=${callNo}`;
    console.log(`📍 URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    console.log(`📊 Response status: ${response.status}`);

    const result = await handleResponse(response);
    console.log(`✅ PO data fetched:`, result.responseData);
    return result.responseData;
  } catch (error) {
    console.error(`❌ Error fetching PO data:`, error);
    // Return empty object instead of throwing to allow dashboard to continue
    console.warn(`⚠️ Continuing without PO data`);
    return {};
  }
};

/**
 * Get Final Product lots for a specific inspection call
 * Extracts lot details from the inspection call data
 */
export const getFinalLots = async (callNo) => {
  try {
    console.log(`📦 Fetching Final Product lots for call: ${callNo}`);
    const inspectionData = await getFinalInspectionCallDetails(callNo);

    console.log(`📋 Inspection data received:`, inspectionData);
    console.log(`📋 Inspection data keys:`, inspectionData ? Object.keys(inspectionData) : 'null');

    // Extract lot details from the response
    // Backend returns finalLotDetails (not lotDetails)
    if (inspectionData && inspectionData.finalLotDetails && Array.isArray(inspectionData.finalLotDetails)) {
      console.log(`✅ Found ${inspectionData.finalLotDetails.length} lots`);
      const mappedLots = inspectionData.finalLotDetails.map(lot => ({
        lotNo: lot.lotNumber,
        heatNo: lot.heatNumber,
        lotSize: lot.offeredQty || 0,
        manufacturer: lot.manufacturer,
        manufacturerHeat: lot.manufacturerHeat
      }));
      console.log(`✅ Mapped lots:`, mappedLots);
      return mappedLots;
    } else {
      console.warn(`⚠️ No finalLotDetails found in inspection data`);
      console.warn(`⚠️ Available keys:`, inspectionData ? Object.keys(inspectionData) : 'null');
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching Final Product lots:', error);
    throw error;
  }
};

/**
 * Get Final Product inspection results (test results per lot)
 * For now, returns empty object - will be populated as tests are completed
 */
export const getFinalInspectionResults = async (callNo) => {
  try {
    console.log(`🧪 Fetching Final Product inspection results for call: ${callNo}`);
    const inspectionData = await getFinalInspectionCallDetails(callNo);

    // Build test results from lot details
    const results = {};
    if (inspectionData && inspectionData.finalLotDetails && Array.isArray(inspectionData.finalLotDetails)) {
      console.log(`📊 Building test results for ${inspectionData.finalLotDetails.length} lots`);
      inspectionData.finalLotDetails.forEach(lot => {
        results[lot.lotNumber] = {
          visualDim: "PENDING",
          hardness: "PENDING",
          inclusion: "PENDING",
          deflection: "PENDING",
          toeLoad: "PENDING",
          weight: "PENDING",
          chemical: "PENDING"
        };
      });
      console.log(`✅ Test results built:`, results);
    }
    return results;
  } catch (error) {
    console.error('❌ Error fetching Final Product inspection results:', error);
    throw error;
  }
};

/**
 * Save Final Product inspection data (dashboard draft)
 * Stores inspection data locally until finish is called
 * TODO: Implement backend endpoint POST /api/final-material/inspection/save
 */
export const saveFinalInspectionData = async (callNo, inspectionData) => {
  try {
    // For now, store in localStorage as a draft
    const draftKey = `final_inspection_draft_${callNo}`;
    localStorage.setItem(draftKey, JSON.stringify({
      callNo,
      data: inspectionData,
      savedAt: new Date().toISOString()
    }));

    console.log('✅ Final Product inspection draft saved locally for call:', callNo);
    return { success: true, message: 'Draft saved successfully' };
  } catch (error) {
    console.error('Error saving Final Product inspection draft:', error);
    throw error;
  }
};

/**
 * Finish Final Product inspection - submit all data
 * TODO: Implement backend endpoint POST /api/final-material/inspection/finish
 */
export const finishFinalInspection = async (callNo, inspectionData) => {
  try {
    // For now, log the data that would be submitted
    console.log('📤 Finishing Final Product inspection for call:', callNo);
    console.log('📋 Inspection data:', inspectionData);

    // Clear the draft
    const draftKey = `final_inspection_draft_${callNo}`;
    localStorage.removeItem(draftKey);

    // TODO: Replace with actual backend call when endpoint is ready
    // const response = await fetch(`${API_BASE_URL}/api/final-material/inspection/finish`, {
    //   method: 'POST',
    //   headers: getAuthHeaders(),
    //   body: JSON.stringify({
    //     inspectionCallNo: callNo,
    //     ...inspectionData
    //   })
    // });
    // const result = await handleResponse(response);
    // return result.responseData;

    return { success: true, message: 'Final Product inspection finished successfully' };
  } catch (error) {
    console.error('Error finishing Final Product inspection:', error);
    throw error;
  }
};

/**
 * Get Final Product inspection summary (pre-inspection data)
 * Extracts summary from the inspection call data
 */
export const getFinalInspectionSummary = async (callNo) => {
  try {
    const inspectionData = await getFinalInspectionCallDetails(callNo);

    // Extract summary from final inspection details
    // Backend returns finalInspectionDetails
    if (inspectionData && inspectionData.finalInspectionDetails) {
      return inspectionData.finalInspectionDetails;
    }
    return {};
  } catch (error) {
    console.error('Error fetching Final Product inspection summary:', error);
    return {};
  }
};

/**
 * Save cumulative results to backend
 * POST /api/final-inspection/dashboard-results/cumulative-results
 */
export const saveCumulativeResults = async (cumulativeData) => {
  try {
    console.log('📤 Saving cumulative results:', cumulativeData);
    const url = `${API_BASE_URL}/api/final-inspection/dashboard-results/cumulative-results`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cumulativeData)
    });

    const result = await handleResponse(response);
    console.log('✅ Cumulative results saved:', result.responseData);
    return result.responseData;
  } catch (error) {
    console.error('❌ Error saving cumulative results:', error);
    throw error;
  }
};

/**
 * Save inspection summary to backend
 * POST /api/final-inspection/dashboard-results/inspection-summary
 */
export const saveInspectionSummary = async (summaryData) => {
  try {
    console.log('📤 Saving inspection summary:', summaryData);
    const url = `${API_BASE_URL}/api/final-inspection/dashboard-results/inspection-summary`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(summaryData)
    });

    const result = await handleResponse(response);
    console.log('✅ Inspection summary saved:', result.responseData);
    return result.responseData;
  } catch (error) {
    console.error('❌ Error saving inspection summary:', error);
    throw error;
  }
};

/**
 * Save lot results to backend
 * POST /api/final-inspection/dashboard-results/lot-results
 */
export const saveLotResults = async (lotResultsData) => {
  try {
    console.log('📤 Saving lot results:', lotResultsData);
    const url = `${API_BASE_URL}/api/final-inspection/dashboard-results/lot-results`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(lotResultsData)
    });

    const result = await handleResponse(response);
    console.log('✅ Lot results saved:', result.responseData);
    return result.responseData;
  } catch (error) {
    console.error('❌ Error saving lot results:', error);
    throw error;
  }
};

/**
 * Get cumulative results from backend
 * GET /api/final-inspection/dashboard-results/cumulative-results/{callNo}
 */
export const getCumulativeResults = async (callNo) => {
  try {
    console.log('📥 Fetching cumulative results for call:', callNo);
    const url = `${API_BASE_URL}/api/final-inspection/dashboard-results/cumulative-results/${callNo}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    console.log('✅ Cumulative results fetched:', result.responseData);
    return result.responseData;
  } catch (error) {
    console.error('❌ Error fetching cumulative results:', error);
    return null;
  }
};

/**
 * Get inspection summary from backend
 * GET /api/final-inspection/dashboard-results/inspection-summary/{callNo}
 */
export const getInspectionSummary = async (callNo) => {
  try {
    console.log('📥 Fetching inspection summary for call:', callNo);
    const url = `${API_BASE_URL}/api/final-inspection/dashboard-results/inspection-summary/${callNo}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    console.log('✅ Inspection summary fetched:', result.responseData);
    return result.responseData;
  } catch (error) {
    console.error('❌ Error fetching inspection summary:', error);
    return null;
  }
};

/**
 * Get lot results from backend
 * GET /api/final-inspection/dashboard-results/lot-results/{callNo}
 */
export const getLotResults = async (callNo) => {
  try {
    console.log('📥 Fetching lot results for call:', callNo);
    const url = `${API_BASE_URL}/api/final-inspection/dashboard-results/lot-results/${callNo}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const result = await handleResponse(response);
    console.log('✅ Lot results fetched:', result.responseData);
    return result.responseData;
  } catch (error) {
    console.error('❌ Error fetching lot results:', error);
    return [];
  }
};

