/**
 * Certificate Service (Mocked for Railpad Frontend Focus)
 * Simulates API interactions for issuing Railpad Final Inspection Certificates.
 */

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

import { getBaseUrl } from './apiConfig';

// Helper to get stored edits/drafts
const getStorageKey = (icNumber, type) => `railpad_ic_${type}_${icNumber}`;

/**
 * Generate Final Product certificate data
 * @param {string} icNumber
 * @returns {Promise<Object>} Certificate data
 */
export const generateFinalProductCertificate = async (icNumber) => {
  await delay(400);
  console.log('🔍 [MOCK] Fetching certificate data for:', icNumber);
  
  // Default raw/base details from user specifications & image
  const defaultData = {
    certificateNo: icNumber || "C/SECR/C26030056/AI01",
    certificateDate: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
    bookNo: "002",
    setNo: "004",
    offeredInstNo: "1",
    passedInstNo: "1ST & FINAL",
    contractor: "M/s MG Rubber Plot No 633/3 Village Sankra Post Somani District Rajnandgaon Chhattisgarh-491441 RAINANDGAON",
    placeOfInspection: "M/s MG Rubber Plot No 633/3 Village Sankra Post Somani District Rajnandgaon Chhattisgarh-491441 RAINANDGAON",
    contractRef: "PO NO. 06260116100764 dated 05/03/2026\nUpto Latest 4 Amendments\nM.A.NO. 000977 dated 27/04/2026\nRB LETTER NO. 2024/RS(G)/779/12(E3462675) dated 19/12/2025\nRB LETTER NO. 2024/RS(G)/779/12 dated 16/10/2025\nRB LETTER NO. 2022/RS(G)/779/8 dated 18/03/2024",
    billPayingOfficer: "PFA/SECR/BILASPUR(A1001)-IPAS AU CODE:3401-SECR",
    consignee: "GSD/SECR/RAIPUR",
    purchasingAuthority: "PCMM/SECR/BILASPUR",
    itemNo: "1",
    description: "COMPOSITE GROOVED RUBBER SOLE PLATES 10 MM THICK FOR WIDER PSC SLEEPERS TO USE WITH 60KG [UIC] & 52KG RAILS TO RDSO DRG NO T-8747, WITH LATEST ALTERATION IF ANY, SPECIFICATION: IRS T 55-2025 WITH LATEST ALTERATIONS. THE TERM \"LATEST ALTERATIONS\" WHEREVER USED WILL MEAN THE ALTERATION UP TO 5 DAYS BEFORE ACTUAL DATE OF OPENING OF TENDER.",
    qtyOnOrder: 150000,
    qtyOfferedPreviously: "NIL",
    qtyPassedPreviously: "NIL",
    qtyNowOffered: 150000,
    qtyNowPassed: 150000,
    qtyNowRejected: "NIL",
    qtyStillDue: "NIL",
    quantityNowPassedText: "QUANTITY NOW PASSED: ONE LAKH FIFTY THOUSAND NOS. ONLY INCLUDING THREE HUNDRED NOS. DESTROYED IN TESTING AND REMNANT PIECE DULY SEALED WITH LOT TO BE DESPATCHED TO CONSIGNEE. MARKING- MG 05-26 OR 06-26, RDSO DRG. NO. RT-8747 (PACKING LIST AS PER ANNEXURE 'W' ATTACHED) NOTE:- PROCESS INSPECTION WAS CONDUCTED AS PER RAILWAY BOARD LETTER NO. 2024/RS(G)/779/12 DATED 16.10.2025 AND CERTIFIED VIDE PROCESS INSPECTION CERTIFICATE NO. C/C26030056/065 DATED 10.06.2026 (BOOK NO./SET NO.- P001/002). MATERIAL ACCEPTED VIDE JOINT INSPECTION REPORT NO. MG/CGRSP10MM/26-27/02 DATED 23.06.2026",
    noOfItemsChecked: "ONE",
    dateOfCall: "15/06/2026",
    noOfVisits: "FIVE",
    datesOfInspection: "18/06/2026,19/06/2026,20/06/2026,22/06/2026,23/06/2026",
    trRecDate: "N/A",
    sealingPattern: "RITES HOLOGRAM HAS BEEN AFFIXED ON THE LEAD SEAL ,TIED WITH SEALING WIRE TO THE PACKING STRIP OF EACH CORRUGATED BOX.",
    facsimileText: "RITES HOLOGRAM SEAL",
    reasonsForRejection: "N/A",
    inspectingEngineer: "AVINISH KUMAR JAISWAL",
    lotDetails: [
      { lotNo: "1", heatNo: "H-CGRSP-01", manufacturer: "M/s MG Rubber", offeredQty: 30000, acceptedQty: 30000, rejectedQty: 0, status: "ACCEPTED" },
      { lotNo: "2", heatNo: "H-CGRSP-02", manufacturer: "M/s MG Rubber", offeredQty: 30000, acceptedQty: 30000, rejectedQty: 0, status: "ACCEPTED" },
      { lotNo: "3", heatNo: "H-CGRSP-03", manufacturer: "M/s MG Rubber", offeredQty: 30000, acceptedQty: 30000, rejectedQty: 0, status: "ACCEPTED" },
      { lotNo: "4", heatNo: "H-CGRSP-04", manufacturer: "M/s MG Rubber", offeredQty: 30000, acceptedQty: 30000, rejectedQty: 0, status: "ACCEPTED" },
      { lotNo: "5", heatNo: "H-CGRSP-05", manufacturer: "M/s MG Rubber", offeredQty: 30000, acceptedQty: 30000, rejectedQty: 0, status: "ACCEPTED" }
    ]
  };

  // Check if there are saved edits or draft changes in localStorage
  const savedChanges = localStorage.getItem(getStorageKey(icNumber, 'draft'));
  const savedEdits = localStorage.getItem(getStorageKey(icNumber, 'edit'));

  const parsedChanges = savedChanges ? JSON.parse(savedChanges) : (savedEdits ? JSON.parse(savedEdits) : null);
  
  if (parsedChanges) {
    return { ...defaultData, ...parsedChanges };
  }

  return defaultData;
};

/**
 * Generate Railpad Inspection Certificate Details from Backend
 * @param {string} icNumber
 * @returns {Promise<Object>} Certificate data
 */
export const generateRailpadIcDetails = async (icNumber) => {
  try {
    console.log('🔍 Fetching RailPad IC details for:', icNumber);
    const response = await fetch(`${getBaseUrl()}/rail-inspection-call/ic-details?callNo=${encodeURIComponent(icNumber)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch IC Details: ${response.status}`);
    }
    const data = await response.json();
    return data.responseData || data;
  } catch (err) {
    console.error('❌ Error fetching RailPad IC details:', err);
    throw err;
  }
};

/**
 * Fetch Process Inspection Details from Backend
 * @param {string} callNo
 * @returns {Promise<Object>} Process Inspection data
 */
export const getProcessInspectionResult = async (callNo) => {
  try {
    const response = await fetch(`${getBaseUrl()}/rail-inspection-call/process/inspect/${encodeURIComponent(callNo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    if (!response.ok) {
      if (response.status === 404 || response.status === 204) return null;
      throw new Error(`Failed to fetch Process Inspection Details: ${response.status}`);
    }
    const data = await response.json();
    return data.responseData || data;
  } catch (err) {
    console.error('❌ Error fetching Process Inspection details:', err);
    return null;
  }
};

/**
 * Fetch Inspection Call Summary Details
 * @param {string} callNo
 * @returns {Promise<Object>} Summary data
 */
export const getInspectionCallSummary = async (callNo) => {
  try {
    const response = await fetch(`${getBaseUrl()}/rail-inspection-call/summary/${encodeURIComponent(callNo)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    if (!response.ok) {
      if (response.status === 404 || response.status === 204) return null;
      throw new Error(`Failed to fetch Inspection Call Summary: ${response.status}`);
    }
    const data = await response.json();
    return data.responseData || data;
  } catch (err) {
    console.error('❌ Error fetching Inspection Call Summary details:', err);
    return null;
  }
};

/**
 * Save or update Final IC Edit Data (Final Saved Version)
 * @param {Object} payload 
 */
export const saveFinalIcEditData = async (payload) => {
  try {
    const response = await fetch(`${getBaseUrl()}/railpad-final-ic-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save IC edit data');
    const result = await response.json();
    return result.responseData || result;
  } catch (error) {
    console.error('Error saving IC edit data:', error);
    throw error;
  }
};

/**
 * Get Final IC Edit Data
 * @param {string} icNumber 
 */
export const getFinalIcEditData = async (icNumber) => {
  try {
    const response = await fetch(`${getBaseUrl()}/railpad-final-ic-edit/${encodeURIComponent(icNumber)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    if (response.status === 204) return null; // No content
    if (!response.ok) throw new Error('Failed to fetch IC edit data');
    const result = await response.json();
    return result.responseData || null;
  } catch (error) {
    console.error('Error fetching IC edit data:', error);
    return null;
  }
};

/**
 * Save or update Final IC Save Changes Data (Drafts)
 * @param {Object} payload 
 */
export const saveFinalIcSaveChanges = async (payload) => {
  try {
    const response = await fetch(`${getBaseUrl()}/railpad-final-ic-save-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save draft IC changes');
    const result = await response.json();
    return result.responseData || result;
  } catch (error) {
    console.error('Error saving draft IC changes:', error);
    throw error;
  }
};

/**
 * Get Final IC Save Changes Data (Draft)
 * @param {string} icNumber 
 */
export const getFinalIcSaveChanges = async (icNumber) => {
  try {
    const response = await fetch(`${getBaseUrl()}/railpad-final-ic-save-changes/${encodeURIComponent(icNumber)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    if (response.status === 204) return null; // No content
    if (!response.ok) throw new Error('Failed to fetch draft IC changes');
    const result = await response.json();
    return result.responseData || null;
  } catch (error) {
    console.error('Error fetching draft IC changes:', error);
    return null;
  }
};

/**
 * Validate Book No and Set No via Mock Backend
 * @param {string} empNo
 * @param {string} bookNo
 * @param {string} setNo
 * @param {string} status "F" for Final
 */
export const validateBookSetNo = async (empNo, bookNo, setNo, status = "F") => {
  await delay(400);
  console.log(`🔍 [MOCK] Validating Book/Set: ${bookNo}/${setNo} for Emp: ${empNo}`);
  
  // Basic validation: Allow if both are valid numbers
  const isBookNum = /^\d+$/.test(bookNo);
  const isSetNum = /^\d+$/.test(setNo);

  if (isBookNum && isSetNum) {
    return {
      resultFlag: 1,
      message: "Validation Successful"
    };
  } else {
    return {
      resultFlag: 0,
      message: "Invalid Book/Set format. Must be numeric."
    };
  }
};

/**
 * Upload Signed IC to Azure Blob Storage
 * @param {Object} payload { icNumber, signedData, fileName, uploadedBy }
 * @returns {Promise<Object>} Upload response
 */
export const uploadSignedCertificate = async (payload) => {
  await delay(500);
  console.log('📤 [MOCK] Uploading signed certificate to Azure for IC:', payload.icNumber);
  localStorage.setItem(`signed_cert_${payload.icNumber}`, JSON.stringify(payload));
  return { success: true, message: "Signed certificate uploaded successfully" };
};

// ─── Process IC Save Changes ──────────────────────────────────────────────────

/**
 * Fetch Process IC Save Changes (draft edits)
 * @param {string} icNumber
 */
export const getProcessIcSaveChanges = async (icNumber) => {
  try {
    const response = await fetch(`${getBaseUrl()}/railpad-process-ic/save-changes/${encodeURIComponent(icNumber)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    if (!response.ok) { if (response.status === 404) return null; throw new Error(`Failed: ${response.status}`); }
    const data = await response.json();
    return data.responseData || null;
  } catch (err) {
    console.error('❌ Error fetching Process IC Save Changes:', err);
    return null;
  }
};

/**
 * Save Process IC draft edits (Save Changes button)
 * @param {Object} payload RailpadProcessIcEditDTO
 */
export const saveProcessIcSaveChanges = async (payload) => {
  try {
    const response = await fetch(`${getBaseUrl()}/railpad-process-ic/save-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save Process IC changes');
    const result = await response.json();
    return result.responseData || result;
  } catch (err) {
    console.error('❌ Error saving Process IC changes:', err);
    throw err;
  }
};

// ─── Process IC E-Sign ────────────────────────────────────────────────────────

/**
 * Fetch Process IC E-Sign data (signed final version)
 * @param {string} icNumber
 */
export const getProcessIcEditData = async (icNumber) => {
  try {
    const response = await fetch(`${getBaseUrl()}/railpad-process-ic/edit/${encodeURIComponent(icNumber)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    if (!response.ok) { if (response.status === 404) return null; throw new Error(`Failed: ${response.status}`); }
    const data = await response.json();
    return data.responseData || null;
  } catch (err) {
    console.error('❌ Error fetching Process IC Edit data:', err);
    return null;
  }
};

/**
 * Save Process IC e-sign data (E-Sign IC button)
 * @param {Object} payload RailpadProcessIcEditDTO
 */
export const saveProcessIcEditData = async (payload) => {
  try {
    const response = await fetch(`${getBaseUrl()}/railpad-process-ic/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to save Process IC e-sign data');
    const result = await response.json();
    return result.responseData || result;
  } catch (err) {
    console.error('❌ Error saving Process IC e-sign data:', err);
    throw err;
  }
};

