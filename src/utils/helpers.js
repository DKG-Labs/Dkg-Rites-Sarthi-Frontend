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

  // If already in dd/MM/yyyy format, return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }

  // Try to parse the date
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Format to dd/MM/yyyy
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Convert date from dd/MM/yyyy format to yyyy-MM-dd (ISO format) for backend
 * @param {string} dateStr - Date in dd/MM/yyyy format
 * @returns {string|null} Date in yyyy-MM-dd format or null if invalid
 */
export const convertDDMMYYYYtoISO = (dateStr) => {
  if (!dateStr || dateStr === '-' || dateStr.trim() === '') return null;

  // If already in ISO format (yyyy-MM-dd), return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Convert dd/MM/yyyy to yyyy-MM-dd
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
};

/**
 * Convert date from yyyy-MM-dd (ISO format) to dd/MM/yyyy for display
 * @param {string} dateStr - Date in yyyy-MM-dd format
 * @returns {string} Date in dd/MM/yyyy format
 */
export const convertISOtoDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-';

  // If already in dd/MM/yyyy format, return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Convert yyyy-MM-dd to dd/MM/yyyy
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
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
