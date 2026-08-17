/**
 * Authentication Service
 * Handles login API calls and token management
 */

import { API_BASE_URL } from './apiConfig';

/**
 * Hardcoded credentials for CM, CallDesk, and Finance users
 */
const HARDCODED_USERS = {
  'Cm': {
    password: 'password',
    userData: {
      userId: 'Cm',
      userName: 'Controlling Manager',
      roleName: 'CM',
      token: 'cm-mock-token-' + Date.now()
    }
  },
  'CallDesk': {
    password: 'password',
    userData: {
      userId: 'CallDesk',
      userName: 'Call Desk Officer',
      roleName: 'CALL_DESK',
      token: 'calldesk-mock-token-' + Date.now()
    }
  },
  'Finance': {
    password: 'password',
    userData: {
      userId: 'Finance',
      userName: 'Finance Officer',
      roleName: 'Finance',
      token: 'finance-mock-token-' + Date.now()
    }
  },
  'Rail SMS': {
    password: 'password',
    userData: {
      userId: 'Rail SMS',
      userName: 'Rail SMS Officer',
      roleName: 'Rail SMS',
      token: 'sms-mock-token-' + Date.now()
    }
  },
  'Railwayboard': {
    password: 'password',
    userData: {
      userId: 'Railwayboard',
      userName: 'Railway Board Member',
      roleName: 'RAILWAY_BOARD',
      token: 'railwayboard-mock-token-' + Date.now()
    }
  },
  'Admin': {
    password: 'password',
    userData: {
      userId: 'Admin',
      userName: 'System Admin',
      roleName: 'ADMIN',
      token: 'admin-mock-token-' + Date.now()
    }
  },
  'Railpad-IE': {
    password: 'password',
    userData: {
      userId: 'Railpad-IE',
      userName: 'Railpad IE Officer',
      roleName: 'Railpad IE',
      token: 'railpad-mock-token-' + Date.now()
    }
  }
};

/**
 * Login user with userId and password
 * @param {string} userId - User ID
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response with user data and token
 */
export const loginUser = async (userId, password) => {
  // Check for hardcoded CM and CallDesk users first
  if (HARDCODED_USERS[userId]) {
    if (HARDCODED_USERS[userId].password === password) {
      console.log(`✅ Hardcoded login successful for ${userId}`);
      return HARDCODED_USERS[userId].userData;
    } else {
      throw new Error('Invalid password');
    }
  }

  // For other users (IE), call the real API
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/loginBasedOnType`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginType: "IE",
        loginId: userId,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.responseStatus?.message || 'Invalid login credentials');
    }

    // Check for successful status (statusCode === 0 means success)
    if (data.responseStatus?.statusCode !== 0) {
      throw new Error(data.responseStatus?.message || 'Login failed');
    }

    // Return the responseData containing user info and token
    const responseData = data.responseData;
    responseData.loginId = userId; // attach the input loginId
    return responseData;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (identifier, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.responseStatus?.message || 'Password reset failed');
    }

    if (data.responseStatus?.statusCode !== 0) {
      throw new Error(data.responseStatus?.message || 'Password reset failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Helper to wipe all temporary inspection and dashboard caches from storage
 */
export const clearAllInspectionStorageCaches = () => {
  try {
    sessionStorage.clear();
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith('process_') ||
        key.startsWith('processProductionLinesData') ||
        key.startsWith('processSelected') ||
        key.startsWith('processManufactured') ||
        key.startsWith('processFinal') ||
        key.startsWith('processCall') ||
        key.startsWith('additionalInitiatedCalls') ||
        key.startsWith('chemicalAnalysisData_') ||
        key.startsWith('hardnessTestData_') ||
        key.startsWith('inclusionRatingData_') ||
        key.startsWith('fpPackedInHDPE_') ||
        key.startsWith('fpCleanedWithCoating_') ||
        key.startsWith('fpLotInspectionData_') ||
        key.startsWith('finalDecisionData_') ||
        key.startsWith('deflectionTestData_') ||
        key.startsWith('toeLoadTestData_') ||
        key.startsWith('visualDimensionalData_') ||
        key.startsWith('weightTestData_') ||
        key.startsWith('raw_') ||
        key.startsWith('dim_') ||
        key.startsWith('mat_') ||
        key.startsWith('pack_') ||
        key.startsWith('cal_') ||
        key.startsWith('correction_slip_') ||
        key.startsWith('call_status_')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    console.log(`🧹 Cleared ${keysToRemove.length} temporary inspection caches for clean user switch/logout`);
  } catch (e) {
    console.error('Error clearing inspection caches:', e);
  }
};

/**
 * Store authentication data in localStorage
 * @param {Object} authData - Authentication data from login response
 */
export const storeAuthData = (authData) => {
  const previousUserId = localStorage.getItem('lastLoggedInUserId') || localStorage.getItem('userId');
  const previousLoginId = localStorage.getItem('lastLoggedInLoginId') || localStorage.getItem('loginId');
  const currentUserId = String(authData.userId || '');
  const currentLoginId = String(authData.loginId || '');

  // If a different user is logging in on the same machine, clear session state so new user starts clean
  if (previousUserId && (previousUserId !== currentUserId || (currentLoginId && previousLoginId && previousLoginId !== currentLoginId))) {
    console.log(`🔄 User switched on same machine (${previousUserId} -> ${currentUserId}) - resetting active session`);
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing session on user switch:', e);
    }
  }

  localStorage.setItem('lastLoggedInUserId', currentUserId);
  if (currentLoginId) localStorage.setItem('lastLoggedInLoginId', currentLoginId);
  localStorage.setItem('authToken', authData.token);
  localStorage.setItem('userId', authData.userId);
  if (authData.loginId) localStorage.setItem('loginId', authData.loginId);
  localStorage.setItem('userName', authData.userName);
  localStorage.setItem('roleName', authData.roleName);
  localStorage.setItem('shortName', authData.shortName || '');  // IE short name for IC generation
  localStorage.setItem('rio', authData.rio || '');  // RIO for Call Desk filtering
  localStorage.setItem('employeeCode', authData.employeeCode || ''); // Real employee code
};

/**
 * Get stored authentication token
 * @returns {string|null} JWT token or null if not logged in
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Get stored user data
 * @returns {Object|null} User data or null if not logged in
 */
export const getStoredUser = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  return {
    userId: localStorage.getItem('userId'),
    loginId: localStorage.getItem('loginId'),
    userName: localStorage.getItem('userName'),
    roleName: localStorage.getItem('roleName'),
    shortName: localStorage.getItem('shortName'),
    rio: localStorage.getItem('rio'),
    employeeCode: localStorage.getItem('employeeCode'),
    token: token,
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

/**
 * Logout user - clear auth credentials
 * Preserves inspection drafts for the same user while keeping lastLoggedInUserId
 * so storeAuthData can purge caches if a different user logs in next.
 */
export const logoutUser = () => {
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error('Error clearing storage on logout:', e);
  }

  // Preserve lastLoggedInUserId & lastLoggedInLoginId to detect if a different user logs in next
  const lastUserId = localStorage.getItem('userId') || localStorage.getItem('lastLoggedInUserId');
  const lastLoginId = localStorage.getItem('loginId') || localStorage.getItem('lastLoggedInLoginId');
  if (lastUserId) localStorage.setItem('lastLoggedInUserId', lastUserId);
  if (lastLoginId) localStorage.setItem('lastLoggedInLoginId', lastLoginId);

  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('loginId');
  localStorage.removeItem('userName');
  localStorage.removeItem('roleName');
  localStorage.removeItem('shortName');
  localStorage.removeItem('rio');
  localStorage.removeItem('employeeCode');
};

/**
 * Get authorization header for API requests
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

