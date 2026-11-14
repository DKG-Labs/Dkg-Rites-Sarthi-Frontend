import { PRODUCT_TYPE_DISPLAY_NAMES } from '../data/mockData';
import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../services/apiConfig';

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
 * Extracts and formats Call Date (DD-MM-YYYY) from Call No using MMDDYY nomenclature.
 * Example: ER-0722260005 -> MMDDYY = 07 (July), 22 (Day), 26 (Year 2026) -> 22-07-2026
 * Example: W/EP-0721260003/DKV -> MMDDYY = 07 (July), 21 (Day), 26 (Year 2026) -> 21-07-2026
 */
export const getCallDateFromCallNo = (callNo, fallbackDate) => {
  if (callNo && typeof callNo === 'string') {
    const match = callNo.match(/(?:[A-Z0-9/]+-)?(\d{2})(\d{2})(\d{2})\d*/);
    if (match) {
      const mm = parseInt(match[1], 10);
      const dd = parseInt(match[2], 10);
      const yy = parseInt(match[3], 10);

      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        const fullYear = 2000 + yy;
        const mmStr = String(mm).padStart(2, '0');
        const ddStr = String(dd).padStart(2, '0');
        return `${ddStr}-${mmStr}-${fullYear}`;
      }
    }
  }

  return fallbackDate ? formatDate(fallbackDate) : '-';
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

/**
 * Clean up Vendor Name by stripping out street address, plot numbers,
 * industrial areas, PIN codes, and city suffixes from IREPS / Railway PO strings.
 * Keeps the clean legal company name (e.g. "AVDESH TRACKS PRIVATE LIMITED",
 * "KALIMATA VYAPAAR PRIVATE LIMITED", "VEDKIRAN STEEL INDUSTRIES PVT. LTD.").
 * 
 * @param {string} vendor - Raw vendor string from database / IREPS
 * @returns {string} Clean vendor name
 */
export const extractVendorName = (vendor) => {
  if (!vendor || typeof vendor !== 'string') return vendor || '-';
  let str = vendor.trim();
  if (!str || str === '-' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return '-';

  // 1. If contains newline, take the first line
  if (str.includes('\n')) {
    str = str.split('\n')[0].trim();
  }
  if (str.includes('\r')) {
    str = str.split('\r')[0].trim();
  }

  // 2. If contains tilde (~), IREPS commonly uses "NAME~STREET ADDRESS"
  if (str.includes('~')) {
    str = str.split('~')[0].trim();
  }

  // 3. Cut off at explicit facility / location labels like WORKS:, FACTORY:, PLANT:, REGD OFFICE:, ADDRESS:
  const labelMatch = str.match(/\b(WORKS|FACTORY|PLANT|REGD\.?\s*OFFICE|OFFICE|ADDRESS|UNIT\s*[-–:]|UNIT\s*NO)\s*[:–-]/i);
  if (labelMatch && labelMatch.index > 3) {
    str = str.substring(0, labelMatch.index).trim();
  }

  // 4. If string contains company legal entity suffixes followed by punctuation/spaces and address
  // E.g.: "VEDKIRAN STEEL INDUSTRIES PVT. LTD.,-NEW DELHI" -> "VEDKIRAN STEEL INDUSTRIES PVT. LTD."
  // E.g.: "AVDESH TRACKS PRIVATE LIMITED - MOHALI" -> "AVDESH TRACKS PRIVATE LIMITED"
  // E.g.: "KALIMATA VYAPAAR PRIVATE LIMITED-KOLKATA" -> "KALIMATA VYAPAAR PRIVATE LIMITED"
  // E.g.: "M/S. BRIDGE TRACK & TOWER PVT. LTD., URLA INDUSTRIAL ESTATE..." -> "M/S. BRIDGE TRACK & TOWER PVT. LTD."
  const legalSuffixRegex = /^(.*?\b(?:PVT\.?\s*LTD\.?|PRIVATE\s+LIMITED|LTD\.?|LIMITED|\(P\)\s*LTD\.?|LLP|INC\.?|CORP\.?))(?:\s*[-–,\u002F].*|$)/i;
  const legalMatch = str.match(legalSuffixRegex);
  if (legalMatch && legalMatch[1] && legalMatch[1].trim().length >= 3) {
    return legalMatch[1].trim().replace(/[-–,\s]+$/, '');
  }

  // 5. Look for address-specific starting keywords after a comma, dash, or hyphen
  // E.g. "ADINATH INDUSTRIES-PLOT NO. 14..."
  // E.g. "ABC ENTERPRISES, NEAR RAILWAY..."
  const addressKeywordRegex = /[-–,]\s*(?:PLOT|SHED|SECTOR|PHASE|INDL|INDUSTRIAL|VILL|VILLAGE|POST|DIST|DISTT|TALUKA|TEHSIL|ROAD|STREET|LANE|NEAR|OPP|OPPOSITE|BEHIND|SURVEY|KHASRA|GATE|KILA|GALI|FLOOR|BLOCK|CITY|PIN|PO\b|P\.O\.|AT\b|NH\b|STATE|MOHALI|DELHI|KOLKATA|MUMBAI|CHENNAI|HYDERABAD|BANGALORE|NAGPUR|RAIPUR|BILASPUR|KANPUR|LUCKNOW|JAIPUR|AHMEDABAD|PATNA|BHOPAL|JABALPUR|PUNE|SECUNDERABAD|GUWAHATI)\b.*$/i;
  if (addressKeywordRegex.test(str)) {
    str = str.replace(addressKeywordRegex, '').trim();
  }

  // 6. If contains " - " (space hyphen space) or " – ", usually separates company name from city/location
  // E.g. "ADINATH INDUSTRIES - MOHALI" -> "ADINATH INDUSTRIES"
  if (str.includes(' - ') || str.includes(' – ')) {
    const parts = str.split(/\s+[-–]\s+/);
    if (parts[0] && parts[0].trim().length >= 3) {
      str = parts[0].trim();
    }
  }

  // 7. If contains hyphen without spaces after a known company keyword like INDUSTRIES, ENTERPRISES, CORPORATION, STEEL, TRACKS, etc.
  // E.g. "ADINATH INDUSTRIES-MOHALI" -> "ADINATH INDUSTRIES"
  const companyWordHyphenRegex = /^(.*?\b(?:INDUSTRIES|ENTERPRISES|CORPORATION|CORP|STEEL|TRACKS|SYSTEMS|PRODUCTS|INFRA|ENGINEERING|ENGINEERS|TECH|TECHNOLOGIES|CASTINGS|FORGINGS|ALLOYS|METALS|WIRES|FASTENERS|FABRICATORS|RUBBER|POLYMERS|SLEEPERS|CONCRETE))\s*[-–].*$/i;
  const compMatch = str.match(companyWordHyphenRegex);
  if (compMatch && compMatch[1] && compMatch[1].trim().length >= 3) {
    str = compMatch[1].trim();
  }

  // 8. If contains comma followed by location/address
  // E.g. "ABC COMPANY, 140507" or "ABC COMPANY, INDUSTRIAL AREA"
  if (str.includes(',')) {
    const firstPart = str.split(',')[0].trim();
    if (firstPart.length >= 6 && /\s/.test(firstPart)) {
      str = firstPart;
    }
  }

  // Clean trailing punctuation and spaces
  str = str.replace(/[-.,–\s]+$/, '').trim();

  return str || vendor;
};

/**
 * Downloads or opens the CRIS / IREPS PO document for a given PO number.
 * Hits /api/vendor/po-pdf-path to get the official PDF URL and proxies it via /api/vendor/proxy-pdf.
 *
 * @param {string} rawPoNo - Raw PO Number
 * @param {string} [existingPdfPath] - Optional pre-loaded PDF path
 * @param {function} [setDownloadingPo] - Optional state setter to show loading spinner
 * @param {function} [onNotification] - Optional custom toast notification callback
 */
export const downloadCrisPoDocument = async (rawPoNo, existingPdfPath, setDownloadingPo, onNotification) => {
  if (!rawPoNo) {
    notify('PO number not found', 'error', onNotification);
    return;
  }

  const barePoNo = rawPoNo.includes('/') ? rawPoNo.split('/')[0].trim() : String(rawPoNo).trim();

  if (setDownloadingPo) setDownloadingPo(rawPoNo);

  try {
    let pdfPath = existingPdfPath;

    if (!pdfPath) {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/po-pdf-path`, {
        params: { rawPoNo: barePoNo },
        headers: getAuthHeaders()
      });
      pdfPath = response.data?.responseData;
    }

    if (!pdfPath) {
      notify(`No CRIS PO document found for PO #${rawPoNo}`, 'warning', onNotification);
      return;
    }

    if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
      const proxyUrl = `${API_BASE_URL}/api/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = `PO_${barePoNo}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(pdfPath, '_blank');
    }
  } catch (err) {
    console.error('Error downloading CRIS PO document:', err);
    notify(`Failed to download CRIS PO document for #${rawPoNo}`, 'error', onNotification);
  } finally {
    if (setDownloadingPo) setDownloadingPo(null);
  }
};

const notify = (msg, type = 'info', customCb) => {
  if (typeof customCb === 'function') {
    customCb(msg, type);
    return;
  }
  if (typeof window !== 'undefined') {
    showFloatingToast(msg, type);
  }
};

/**
 * Lightweight floating toast notification that disappears after 3.5s
 */
export const showFloatingToast = (text, type = 'info') => {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('sarthi-cris-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'sarthi-cris-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '28px';
  toast.style.right = '28px';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '10px';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '600';
  toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.2)';
  toast.style.zIndex = '99999';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.transition = 'all 0.25s ease';

  if (type === 'error') {
    toast.style.backgroundColor = '#fef2f2';
    toast.style.color = '#991b1b';
    toast.style.border = '1.5px solid #fecaca';
    toast.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="font-size: 16px; color: #dc2626;"></i> <span>${text}</span>`;
  } else if (type === 'warning') {
    toast.style.backgroundColor = '#fffbeb';
    toast.style.color = '#92400e';
    toast.style.border = '1.5px solid #fde68a';
    toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="font-size: 16px; color: #d97706;"></i> <span>${text}</span>`;
  } else {
    toast.style.backgroundColor = '#f0fdf4';
    toast.style.color = '#166534';
    toast.style.border = '1.5px solid #bbf7d0';
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="font-size: 16px; color: #16a34a;"></i> <span>${text}</span>`;
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};
