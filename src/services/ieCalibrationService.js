/**
 * IE Calibration Service
 * 
 * Fetches vendor calibration records for display in the IE (Inspection Engineer) module,
 * and saves IE calibration inspection observations.
 * 
 * APIs used:
 *   GET  /api/vendor/calibration/allCalibrations/{vendorCode}
 *   POST /api/vendor/calibration/ie-calibration-inspection
 */

import { API_ENDPOINTS, getAuthHeaders } from './apiConfig';

const BASE = API_ENDPOINTS.VENDOR_CALIBRATION;

/**
 * Compute days until a date expires
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {number} Days remaining (negative if expired)
 */
const getDaysUntilExpiry = (dateStr) => {
  if (!dateStr) return -999;
  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
};

/**
 * Compute calibration status based on due date and notification window
 * @param {string} dueDate - Due date string
 * @param {number} notificationDays - Notification window in days (default 30)
 * @returns {string} 'Valid' | 'Expiring Soon' | 'Expired'
 */
const computeCalibrationStatus = (dueDate, notificationDays = 30) => {
  const daysLeft = getDaysUntilExpiry(dueDate);
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= notificationDays) return 'Expiring Soon';
  return 'Valid';
};

/**
 * Flatten vendor calibration header+detail response into a flat list of rows
 * suitable for table display (same structure as the vendor dashboard's unified table).
 *
 * @param {Array} headers - Array of VendorCalibrationHeaderResponseDto
 * @returns {Array} Flat list of detail rows with category and header info merged in
 */
const flattenCalibrationData = (headers) => {
  if (!headers || !Array.isArray(headers)) return [];

  const rows = [];
  headers.forEach((header) => {
    const category = header.category || 'Instrument';
    const details = header.details || [];

    details.forEach((detail) => {
      const dueDate = detail.calibrationDueDate;
      const notifDays = detail.notificationDays || 30;
      const daysLeft = getDaysUntilExpiry(dueDate);
      const status = computeCalibrationStatus(dueDate, notifDays);

      rows.push({
        // Header-level info
        headerId: header.id,
        category,
        certificateFilePath: header.certificateFilePath,
        // Detail-level info
        detailId: detail.id,
        instrumentName: detail.instrumentName || '',
        capacity: detail.capacity || '',
        description: detail.description || '',
        usedFor: detail.usedFor || '',
        serialNumber: detail.serialNumber || '',
        calibrationCertificateNo: detail.calibrationCertificateNo || '',
        calibrationDate: detail.calibrationDate || '',
        calibrationDueDate: dueDate || '',
        certifyingLabName: detail.certifyingLabName || '',
        accreditationAgency: detail.accreditationAgency || '',
        notificationDays: notifDays,
        calibrationStatus: status,
        daysLeft,
      });
    });
  });

  return rows;
};

/**
 * Fetch all calibration records for a vendor.
 * Used by the IE module to display calibration data during inspection.
 *
 * @param {string} vendorCode - The vendor code (typically from selectedCall.createdBy)
 * @returns {Promise<{ success: boolean, data: Array, raw: Array, error?: string }>}
 */
export const fetchVendorCalibrations = async (callNo) => {
  if (!callNo) {
    return { success: false, data: [], raw: [], error: 'No call number provided' };
  }

  try {
    const url = `${BASE}/by-call/${encodeURIComponent(callNo)}`;
    console.log('🔧 IE Calibration: Fetching vendor calibrations for call no:', callNo);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calibrations: HTTP ${response.status}`);
    }

    const data = await response.json();
    const headers = data.responseData || [];

    console.log(`✅ IE Calibration: Received ${headers.length} calibration groups`);

    const flatRows = flattenCalibrationData(headers);
    console.log(`✅ IE Calibration: Flattened to ${flatRows.length} instrument rows`);

    return {
      success: true,
      data: flatRows,
      raw: headers,
    };
  } catch (error) {
    console.error('❌ IE Calibration: Error fetching vendor calibrations:', error);
    return {
      success: false,
      data: [],
      raw: [],
      error: error.message || 'Failed to fetch calibration records',
    };
  }
};

/**
 * Save IE calibration inspection record.
 * Called when the IE saves/submits their calibration inspection for a call.
 *
 * @param {{ callNo: string, poNumber: string, vendorCode: string }} payload
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export const saveIeCalibrationInspection = async (payload) => {
  try {
    const url = `${BASE}/ie-calibration-inspection`;
    console.log('🔧 IE Calibration: Saving inspection:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to save inspection: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ IE Calibration: Inspection saved:', data);

    return {
      success: true,
      data: data.responseData,
    };
  } catch (error) {
    console.error('❌ IE Calibration: Error saving inspection:', error);
    return {
      success: false,
      error: error.message || 'Failed to save calibration inspection',
    };
  }
};

/**
 * Fetch IE's previously saved calibration inspection by call number.
 *
 * @param {string} callNo - The inspection call number
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export const fetchIeCalibrationInspection = async (callNo) => {
  if (!callNo) {
    return { success: false, error: 'No call number provided' };
  }

  try {
    const url = `${BASE}/ie-calibration-inspection/${encodeURIComponent(callNo)}`;
    console.log('🔧 IE Calibration: Fetching inspection for call:', callNo);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch inspection: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ IE Calibration: Fetched inspection:', data);

    return {
      success: true,
      data: data.responseData,
    };
  } catch (error) {
    console.error('❌ IE Calibration: Error fetching inspection:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch calibration inspection',
    };
  }
};

export { getDaysUntilExpiry, computeCalibrationStatus, flattenCalibrationData };

/**
 * Lookup vendor code from vendor_master by manufacturer/vendor name.
 * Used by the IE module to resolve the manufacturer name on the inspection call
 * to the vendor code needed for the calibration API.
 *
 * @param {string} vendorName - The manufacturer/vendor name (e.g., "KALIMATA ISPAT INDUSTRIES PVT LTD-KOLKATA")
 * @returns {Promise<{ success: boolean, vendorCode?: string, vendorName?: string, error?: string }>}
 */
export const lookupVendorCodeByName = async (vendorName) => {
  if (!vendorName) {
    return { success: false, error: 'No vendor name provided' };
  }

  try {
    const url = `${BASE}/vendor-code-by-name?vendorName=${encodeURIComponent(vendorName)}`;
    console.log('🔧 IE Calibration: Looking up vendor code for:', vendorName);

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Vendor not found in vendor master' };
      }
      throw new Error(`Lookup failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data.responseData;

    if (result && result.vendorCode) {
      console.log('✅ IE Calibration: Resolved vendor code:', result.vendorCode, 'for name:', result.vendorName);
      return {
        success: true,
        vendorCode: result.vendorCode,
        vendorName: result.vendorName,
      };
    }

    return { success: false, error: 'Vendor code not found' };
  } catch (error) {
    console.error('❌ IE Calibration: Error looking up vendor code:', error);
    return { success: false, error: error.message || 'Failed to lookup vendor code' };
  }
};
