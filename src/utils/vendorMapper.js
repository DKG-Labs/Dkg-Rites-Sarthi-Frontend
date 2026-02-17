/**
 * Vendor Code to Vendor Name Mapper
 * Maps vendor codes (from API) to display names
 */

/**
 * Vendor code to name mapping
 * Format: vendorCode (without colon) -> vendor name
 */
const VENDOR_CODE_MAP = {
  '13104': 'SHIVAM HIGHRISE PVT. LTD',
  // Add more vendor codes here as needed
};

/**
 * Get vendor name from vendor code
 * Handles both formats: ":13104" and "13104"
 * 
 * @param {string} vendorCode - Vendor code (with or without colon prefix)
 * @returns {string} Vendor display name
 */
export const getVendorNameFromCode = (vendorCode) => {
  if (!vendorCode || typeof vendorCode !== 'string') {
    return '-';
  }

  // Remove colon prefix if present
  const cleanCode = vendorCode.startsWith(':') ? vendorCode.substring(1) : vendorCode;

  // Look up in mapping
  const vendorName = VENDOR_CODE_MAP[cleanCode];

  // Return mapped name or original value if not found
  return vendorName || vendorCode;
};

/**
 * Check if a vendor name is a vendor code (starts with colon)
 * 
 * @param {string} vendorName - Vendor name from API
 * @returns {boolean} True if it's a vendor code
 */
export const isVendorCode = (vendorName) => {
  return vendorName && typeof vendorName === 'string' && vendorName.startsWith(':');
};

/**
 * Process vendor name - convert code to name if needed
 * 
 * @param {string} vendorName - Vendor name from API
 * @returns {string} Processed vendor name
 */
export const processVendorName = (vendorName) => {
  if (!vendorName || typeof vendorName !== 'string') {
    return '-';
  }

  // If it's a vendor code (starts with :), convert it
  if (isVendorCode(vendorName)) {
    return getVendorNameFromCode(vendorName);
  }

  // Otherwise return as-is
  return vendorName;
};

