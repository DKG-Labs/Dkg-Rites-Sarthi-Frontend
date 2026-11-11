/**
 * Call Desk Module Helper Functions
 * Utility functions for the Call Desk Module
 */

/**
 * Format date to dd/MM/yyyy
 */
export const formatDate = (date) => {
  if (!date || date === '-' || date === 'N/A') return '-';

  // If already in dd/MM/yyyy format, return as-is
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }

  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return '-';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date and time to dd/MM/yyyy HH:mm
 */
export const formatDateTime = (date) => {
  if (!date || date === '-' || date === 'N/A') return '-';

  // If already in dd/MM/yyyy HH:mm format, return as-is
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return '-';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Get relative time (e.g., "2 days ago")
 */
export const getRelativeTime = (date) => {
  if (!date) return '-';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2 - d1);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Filter array by search term
 */
export const filterBySearch = (items, searchTerm, fields) => {
  if (!searchTerm) return items;
  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    fields.some(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return value?.toString().toLowerCase().includes(term);
    })
  );
};

/**
 * Sort array by field
 */
export const sortByField = (items, field, direction = 'asc') => {
  return [...items].sort((a, b) => {
    const aVal = field.split('.').reduce((obj, key) => obj?.[key], a);
    const bVal = field.split('.').reduce((obj, key) => obj?.[key], b);
    
    if (aVal === bVal) return 0;
    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
};

/**
 * Paginate array
 */
export const paginate = (items, page, pageSize) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Normalize an RIO string or name to its canonical short code (ER, WR, NR, SR, CR)
 */
export const normalizeRio = (rioStr) => {
  if (!rioStr) return '';
  const r = String(rioStr).trim().toUpperCase();
  if (r === 'ER' || r === 'ERIO' || r.includes('EAST') || r.includes('KOLKATA')) return 'ER';
  if (r === 'WR' || r === 'WRIO' || r.includes('WEST') || r.includes('MUMBAI')) return 'WR';
  if (r === 'NR' || r === 'NRIO' || r.includes('NORTH') || r.includes('DELHI')) return 'NR';
  if (r === 'SR' || r === 'SRIO' || r.includes('SOUTH') || r.includes('CHENNAI')) return 'SR';
  if (r === 'CR' || r === 'CRIO' || r.includes('CENT') || r.includes('BHILAI') || r.includes('RAIPUR')) return 'CR';
  return r.replace('RIO', '').replace('REGION', '').trim();
};

/**
 * Return true when no target RIO is set (e.g. Super Admin), or when at least one
 * comma-separated segment in itemRio normalizes to the same RIO code as targetRio.
 */
export const isRioMatching = (targetRio, itemRio) => {
  if (!targetRio || !String(targetRio).trim()) return true;
  const normalizedTarget = normalizeRio(targetRio);
  if (!normalizedTarget) return true;
  if (!itemRio || !String(itemRio).trim()) return false;
  return String(itemRio)
    .split(',')
    .some((part) => {
      const normalizedPart = normalizeRio(part);
      return Boolean(normalizedPart) && normalizedPart === normalizedTarget;
    });
};

/**
 * Resolve the active Call Desk RIO: prefers logged-in user's RIO and falls back
 * to the supplied call RIO when the user's RIO is not set.
 */
export const getEffectiveCallDeskRio = (fallbackRio = '') => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const token = window.localStorage.getItem('authToken');
    const userRio = token ? window.localStorage.getItem('rio') : '';
    if (userRio && userRio.trim()) {
      return userRio.trim();
    }
  }
  return fallbackRio ? String(fallbackRio).trim() : '';
};

const normalizeProductToken = (productStr) => {
  if (!productStr) return '';
  const p = String(productStr).trim().toUpperCase().replace(/[_-]+/g, ' ');
  if (p === 'ERC' || p.startsWith('ER') || p.startsWith('EF') || p.startsWith('EP') || p.includes('ERC')) return 'ERC';
  if (p === 'SLEEPER' || p.startsWith('SF') || p.startsWith('SR') || p.startsWith('SP') || p.includes('SLEEPER')) return 'SLEEPER';
  if (p === 'RAILPAD' || p === 'RAIL PAD' || p.startsWith('RP') || p.includes('RAIL')) return 'RAILPAD';
  return p;
};

/**
 * Determine canonical { product, ieRole } ('ERC' | 'SLEEPER' | 'RAILPAD', 'MAIN_IE' | 'PROCESS_IE')
 * for an inspection call.
 */
export const getCallProductAndIeRole = (call) => {
  const callNo = String(call?.callNumber || call?.callNo || call?.requestId || '').trim().toUpperCase();
  const productHint = String(call?.product || call?.productType || '').trim().toUpperCase();
  const stageHint = String(call?.stage || call?.stageOfInspection || call?.productStage || '').trim().toUpperCase();

  let product = '';
  if (callNo.startsWith('SF') || callNo.startsWith('SR') || callNo.startsWith('SP')) {
    product = 'SLEEPER';
  } else if (callNo.startsWith('RP') || callNo.startsWith('RF')) {
    product = 'RAILPAD';
  } else if (callNo.startsWith('ER') || callNo.startsWith('EF') || callNo.startsWith('EP')) {
    product = 'ERC';
  } else if (productHint.includes('SLEEPER')) {
    product = 'SLEEPER';
  } else if (productHint.includes('RAIL')) {
    product = 'RAILPAD';
  } else if (productHint.includes('ERC')) {
    product = 'ERC';
  }

  let ieRole = 'MAIN_IE';
  if (product === 'RAILPAD') {
    ieRole = callNo.startsWith('RPP') ? 'PROCESS_IE' : 'MAIN_IE';
  } else if (product === 'SLEEPER') {
    ieRole = (callNo.startsWith('SP') || stageHint.includes('PROCESS')) ? 'PROCESS_IE' : 'MAIN_IE';
  } else {
    ieRole = (callNo.startsWith('EP') || stageHint.includes('PROCESS')) ? 'PROCESS_IE' : 'MAIN_IE';
  }

  return { product, ieRole };
};

const isSingleIeRoleMatching = (role, userProductType, targetProduct, targetIeRole) => {
  const r = String(role || '').trim().toUpperCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!r || r.includes('VENDOR') || r.includes('FINANCE') || r.includes('ADMIN')
    || r.includes('HELP DESK') || r.includes('CONTROL MANAGER') || r.includes('SBU')
    || r.includes('RAILWAY') || r.includes('BOARD') || r === 'SMS') {
    return false;
  }

  let resolvedProduct = null;
  let resolvedRole = null;
  let productFromRoleName = false;

  if (r === 'ERC IE' || r === 'ERC MAIN IE') {
    resolvedProduct = 'ERC';
    resolvedRole = 'MAIN_IE';
    productFromRoleName = true;
  } else if (r === 'IE' || r === 'IE SECONDARY' || r === 'SECONDARY IE' || r === 'INSPECTING ENGINEER') {
    resolvedProduct = 'ERC';
    resolvedRole = 'MAIN_IE';
  } else if (r === 'ERC PROCESS IE' || r === 'PROCESS INSPECTING ENGINEER ERC') {
    resolvedProduct = 'ERC';
    resolvedRole = 'PROCESS_IE';
    productFromRoleName = true;
  } else if (r === 'PROCESS IE' || r === 'PROCESS INSPECTING ENGINEER') {
    resolvedProduct = 'ERC';
    resolvedRole = 'PROCESS_IE';
  } else if (r === 'SLEEPER MAIN IE' || r === 'SLEEPER IE' || r === 'PSC SLEEPER MAIN IE' || r === 'SLEEPER INSPECTING ENGINEER') {
    resolvedProduct = 'SLEEPER';
    resolvedRole = 'MAIN_IE';
    productFromRoleName = true;
  } else if (r === 'MAIN IE') {
    resolvedProduct = 'SLEEPER';
    resolvedRole = 'MAIN_IE';
  } else if (r === 'SLEEPER PROCESS IE' || r === 'PROCESS INSPECTING ENGINEER PSC SLEEPER') {
    resolvedProduct = 'SLEEPER';
    resolvedRole = 'PROCESS_IE';
    productFromRoleName = true;
  } else if (r === 'RAIL MAIN IE' || r === 'RAILPAD MAIN IE' || r === 'RAIL IE' || r === 'RAILPAD IE') {
    resolvedProduct = 'RAILPAD';
    resolvedRole = 'MAIN_IE';
    productFromRoleName = true;
  } else if (r === 'RAIL PROCESS IE' || r === 'RAILPAD PROCESS IE') {
    resolvedProduct = 'RAILPAD';
    resolvedRole = 'PROCESS_IE';
    productFromRoleName = true;
  }

  if (!productFromRoleName && userProductType && String(userProductType).trim()) {
    const tokens = String(userProductType).split(',').map(normalizeProductToken).filter(Boolean);
    if (tokens.length > 0) {
      if (targetProduct && tokens.includes(targetProduct)) {
        resolvedProduct = targetProduct;
      } else if (targetProduct) {
        return false;
      }
    }
  }

  if (!resolvedRole) return false;
  if (targetProduct && targetProduct !== resolvedProduct) return false;
  if (targetIeRole && targetIeRole !== resolvedRole) return false;
  return true;
};

/**
 * Filter an IE user object by target Product ('ERC' | 'SLEEPER' | 'RAILPAD')
 * and target IE Role ('MAIN_IE' | 'PROCESS_IE').
 */
export const isProductAndIeRoleMatching = (ieUser, targetProduct, targetIeRole) => {
  if (!targetProduct && !targetIeRole) return true;
  if (!ieUser) return false;

  const roles = [];
  if (Array.isArray(ieUser.roleNames)) {
    ieUser.roleNames.forEach((r) => {
      if (r && String(r).trim()) roles.push(String(r).trim());
    });
  }
  const roleCsv = ieUser.roleName || ieUser.role || '';
  if (roles.length === 0 && roleCsv) {
    String(roleCsv).split(',').forEach((r) => {
      if (r && r.trim()) roles.push(r.trim());
    });
  }
  if (roles.length === 0) return false;

  const userProductType = ieUser.productType || '';
  return roles.some((role) => isSingleIeRoleMatching(role, userProductType, targetProduct, targetIeRole));
};

