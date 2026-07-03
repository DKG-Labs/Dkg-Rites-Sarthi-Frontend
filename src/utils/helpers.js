import { PRODUCT_TYPE_DISPLAY_NAMES } from '../data/mockData';

export const getProductTypeDisplayName = (productType) => {
  return PRODUCT_TYPE_DISPLAY_NAMES[productType] || productType;
};

export const getProductTypeInternalValue = (displayName) => {
  const entry = Object.entries(PRODUCT_TYPE_DISPLAY_NAMES).find(([key, value]) => value === displayName);
  return entry ? entry[0] : displayName;
};

export const calculateDaysLeft = (dueDate) => {
  const today = new Date('2025-11-14');
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diff;
};

export const formatDate = (dateString) => {
  if (!dateString || dateString === '-' || dateString === 'N/A') return '-';

  // If already in dd-mm-yyyy format, return as-is
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    return dateString;
  }

  // If already in dd/MM/yyyy format, convert to dd-mm-yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString.replace(/\//g, '-');
  }

  // Try to parse the date
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Format to dd-mm-yyyy
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Convert date from dd-mm-yyyy or dd/MM/yyyy format to yyyy-MM-dd (ISO format) for backend
 * @param {string} dateStr - Date in dd-mm-yyyy or dd/MM/yyyy format
 * @returns {string|null} Date in yyyy-MM-dd format or null if invalid
 */
export const convertDDMMYYYYtoISO = (dateStr) => {
  if (!dateStr || dateStr === '-' || dateStr.trim() === '') return null;

  // If already in ISO format (yyyy-MM-dd), return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Convert dd-mm-yyyy or dd/MM/yyyy to yyyy-MM-dd
  const separator = dateStr.includes('/') ? '/' : '-';
  const parts = dateStr.split(separator);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
};

/**
 * Convert date from yyyy-MM-dd (ISO format) to dd-mm-yyyy for display
 * @param {string} dateStr - Date in yyyy-MM-dd format
 * @returns {string} Date in dd-mm-yyyy format
 */
export const convertISOtoDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-';

  // If already in dd-mm-yyyy format, return as-is
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // If already in dd/MM/yyyy format, convert to dd-mm-yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr.replace(/\//g, '-');
  }

  // Convert yyyy-MM-dd to dd-mm-yyyy
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  return dateStr;
};

export const getHourLabels = (shift) => {
  // Normalize shift input to handle cases like "General", "A Shift", etc.
  const normalizedShift = (shift || 'A').toString().trim().toUpperCase();

  const SHIFT_STARTS = {
    'A': { h: 6, m: 0 },
    'B': { h: 14, m: 0 },
    'C': { h: 22, m: 0 },
    'G': { h: 9, m: 0 },
    'GENERAL': { h: 9, m: 0 }
  };

  const pad = (n) => n.toString().padStart(2, '0');
  const format = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = (h % 12) || 12;
    return `${displayHour}:${pad(m)} ${period}`;
  };

  const addHours = (h, m, dh) => {
    let totalMinutes = h * 60 + m + (dh * 60);
    let newTotalMinutes = totalMinutes % (24 * 60);
    if (newTotalMinutes < 0) newTotalMinutes += (24 * 60);
    return {
      h: Math.floor(newTotalMinutes / 60),
      m: newTotalMinutes % 60
    };
  };

  // Find the appropriate start time, defaulting to Shift A if not found
  let s = SHIFT_STARTS[normalizedShift];

  // Also check if the input starts with A, B, C or G (e.g. "A Shift")
  if (!s) {
    if (normalizedShift.startsWith('A')) s = SHIFT_STARTS.A;
    else if (normalizedShift.startsWith('B')) s = SHIFT_STARTS.B;
    else if (normalizedShift.startsWith('C')) s = SHIFT_STARTS.C;
    else if (normalizedShift.startsWith('G')) s = SHIFT_STARTS.G;
    else s = SHIFT_STARTS.A; // Default fallback
  }

  const labels = [];
  for (let i = 0; i < 8; i++) {
    const start = addHours(s.h, s.m, i);
    const end = addHours(s.h, s.m, i + 1);
    labels.push(`${format(start.h, start.m)} - ${format(end.h, end.m)}`);
  }
  return labels;
};

/**
 * Standardize PO Number and Serial display format: "RlyShortName / PO Number / Serial"
 * Handles cases where serial already contains the PO Number as a prefix.
 * @param {string} poNo - The base PO Number
 * @param {string} serial - The serial number or full PO/serial string
 * @param {string} [rlyShortName] - Optional railway short name to prepend (e.g. "SCR")
 * @returns {string} Formatted string e.g. "SCR / 60256836107122 / 004"
 */
export const formatPoNoWithSerial = (poNo, serial, rlyShortName) => {
  if (!serial && !poNo) return 'N/A';

  // Clean strings
  const p = poNo ? String(poNo).trim() : '';
  const s = serial ? String(serial).trim() : '';
  const rly = rlyShortName ? String(rlyShortName).trim() : '';

  // Extract the clean serial suffix
  let cleanSerial = s;
  if (s && p && s.includes(p)) {
    const parts = s.split('/');
    cleanSerial = parts[parts.length - 1]; // e.g. "60256836107122/004" -> "004"
  }

  return [rly, p, cleanSerial].filter(Boolean).join(' / ');
};

/**
 * Extracts only the numeric PO number from a formatted PO string.
 * Example: "SCR / 60256836107122 / 004" -> "60256836107122"
 * Example: "60256836107122" -> "60256836107122"
 * @param {string} formattedPoNo - The formatted PO string
 * @returns {string} The numeric PO number
 */
export const extractNumericPoNo = (formattedPoNo) => {
  if (!formattedPoNo) return '';
  const str = String(formattedPoNo);

  // If it's already just numbers, return as is
  if (/^\d+$/.test(str.trim())) return str.trim();

  // Split by common separators
  const parts = str.split('/').map(p => p.trim());

  // Look for the longest numeric part (usually the PO number)
  let numericPart = '';
  parts.forEach(part => {
    if (/^\d+$/.test(part) && part.length > numericPart.length) {
      numericPart = part;
    }
  });

  return numericPart || str;
};

/**
 * Format a number to a fixed number of decimal places.
 * If the value is not a number, returns the original value or '0' if it's null/undefined.
 * @param {number|string} value - The value to format
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatDecimal = (value, decimals = 2) => {
  if (value === undefined || value === null || value === '' || value === '-') return value || '0';
  const num = Number(value);
  if (isNaN(num)) return value;

  // Using Intl.NumberFormat for better localization support if needed, 
  // but toFixed(2) is requested for capping.
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};
/**
 * Get current date in IST (YYYY-MM-DD)
 * @returns {string} Current date in YYYY-MM-DD
 */
export const getISTDateOnly = () => {
    // Current date/time in UTC
    const date = new Date();
    // Offset for IST (UTC+5:30) in milliseconds
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    // Calculate IST date/time
    const istDate = new Date(date.getTime() + IST_OFFSET);
    // Return in YYYY-MM-DD format
    return istDate.toISOString().split('T')[0];
};

/**
 * Clean up raw backend HTTP/JSON error messages to display user-friendly output
 * @param {string|Error} error - Raw error string or object
 * @returns {string} Clean error message
 */
export const getCleanErrorMessage = (error) => {
  if (!error) return 'Unknown error occurred';
  let msg = typeof error === 'string' ? error : (error.message || String(error));

  try {
    // Look for JSON string inside the message
    const jsonMatch = msg.match(/\{.*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const extracted = parsed.responseStatus?.message || parsed.message || parsed.error || parsed.errorMessage;
      if (extracted) {
        // Replace the matched JSON segment with the clean message
        msg = msg.replace(jsonMatch[0], extracted);
      }
    }
  } catch (e) {
    // ignore parsing failure
  }

  // Remove HTTP error code details and separators from prefix/message
  msg = msg
    .replace(/HTTP\s+\d+\s+[\w\s]+-\s*/gi, '') // E.g. "HTTP 500 Internal Server Error - "
    .replace(/HTTP\s+\d+\s*-\s*/gi, '')       // E.g. "HTTP 500 - "
    .trim();

  return msg;
};
