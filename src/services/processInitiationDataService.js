/**
 * Service for Process Material Inspection Initiation Data
 * Fetches Section A (PO Info), Section B (IC Details), and Section C (RM IC Heat Numbers)
 * from the database for Process material inspection initiation page
 */

import { getAuthToken } from './authService';
import { API_BASE_URL as API_ROOT } from './apiConfig';

const API_BASE_URL = `${API_ROOT}/api/process-material/initiation`;

/**
 * Get auth headers with JWT token
 */
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Handle API response and surface errors
 */
const handleResponse = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch (e) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText} - ${text}`);
  }
  if (!response.ok) {
    const serverMsg = body && (body.responseStatus?.message || body.message || body.error || JSON.stringify(body));
    throw new Error(`HTTP ${response.status} ${response.statusText} - ${serverMsg}`);
  }
  return body;
};

/**
 * Fetch Process material inspection initiation data by call number
 * Returns Section A (PO Info), Section B (IC Details), and Section C (RM IC Heat Numbers)
 * 
 * @param {string} callNo - Process Inspection Call Number (e.g., "EP-01080014")
 * @returns {Promise<Object>} Initiation data with all sections
 * 
 * Response structure:
 * {
 *   responseStatus: { statusCode: 0, message: "Success" },
 *   responseData: {
 *     // Section A: PO Information
 *     poNo: "AA195118100297",
 *     poDate: "23/11/2019",
 *     poDescription: "PNEUMATIC DRILL...",
 *     poQty: 5,
 *     poUnit: "Nos.",
 *     amendmentNo: "AMD-001",
 *     amendmentDate: "15/12/2019",
 *     vendorName: "ABC Industries",
 *     vendorCode: "V-13104",
 *     consignee: "SS/W-M/C/KGP",
 *     deliveryDate: "11/02/2020",
 *     purchasingAuthority: "YOGESH KUMAR SINGH~AMM(WS)/KGP~19~#",
 *     billPayingOfficer: "BPO-001",
 *     
 *     // Section B: Inspection Call Details
 *     callNo: "EP-01080014",
 *     callDate: "01/02/2026",
 *     desiredInspectionDate: "03/02/2026",
 *     typeOfCall: "Process",
 *     placeOfInspection: "Factory",
 *     companyName: "SHIVAM HIGHRISE PVT. LTD",
 *     unitName: "Unit 1",
 *     unitAddress: "123 Industrial Area, Bangalore",
 *     
 *     // Section C: RM IC Heat Information
 *     rmIcHeatInfoList: [
 *       {
 *         rmIcNumber: "RM-IC-001",
 *         heatNumber: "HEAT-12345",
 *         manufacturer: "ABC Steel",
 *         lotNumber: "LOT-001",
 *         qtyAccepted: 100
 *       }
 *     ]
 *   }
 * }
 */
export const fetchProcessInitiationData = async (callNo) => {
  if (!callNo) {
    throw new Error('Call Number is required');
  }

  console.log(`🔵 Fetching Process initiation data for call: ${callNo}`);
  
  const response = await fetch(`${API_BASE_URL}/call/${encodeURIComponent(callNo)}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const result = await handleResponse(response);
  console.log('✅ Process initiation data fetched:', result.responseData);
  
  return result.responseData;
};

