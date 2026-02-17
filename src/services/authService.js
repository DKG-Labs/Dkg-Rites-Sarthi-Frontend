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
  'Railwayboard': {
    password: 'password',
    userData: {
      userId: 'Railwayboard',
      userName: 'Railway Board Member',
      roleName: 'RAILWAY_BOARD',
      token: 'railwayboard-mock-token-' + Date.now()
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
    return data.responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Store authentication data in localStorage
 * @param {Object} authData - Authentication data from login response
 */
export const storeAuthData = (authData) => {
  localStorage.setItem('authToken', authData.token);
  localStorage.setItem('userId', authData.userId);
  localStorage.setItem('userName', authData.userName);
  localStorage.setItem('roleName', authData.roleName);
  localStorage.setItem('shortName', authData.shortName || '');  // IE short name for IC generation
  localStorage.setItem('rio', authData.rio || '');  // RIO for Call Desk filtering
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
    userName: localStorage.getItem('userName'),
    roleName: localStorage.getItem('roleName'),
    shortName: localStorage.getItem('shortName'),
    rio: localStorage.getItem('rio'),
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
 * Logout user - clear all auth data
 */
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('roleName');
  localStorage.removeItem('shortName');
  localStorage.removeItem('rio');
};

/**
 * Get authorization header for API requests
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

