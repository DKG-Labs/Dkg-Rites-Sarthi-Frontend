import { getBaseUrl } from './apiConfig';

/**
 * Login user with loginId, password and loginType
 */
export const loginUser = async (loginId, password, loginType = 'IE') => {
  try {
    const response = await fetch(`${getBaseUrl()}/auth/loginBasedOnType`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginType,
        loginId,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.responseStatus?.message || 'Invalid login credentials');
    }

    if (data.responseStatus?.statusCode !== 0) {
      throw new Error(data.responseStatus?.message || 'Login failed');
    }

    return data.responseData;
  } catch (error) {
    throw error;
  }
};

export const storeAuthData = (authData) => {
  localStorage.setItem('authToken', authData.token);
  localStorage.setItem('userId', authData.userId);
  localStorage.setItem('userName', authData.userName);
  localStorage.setItem('roleName', authData.roleName);
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const getStoredUser = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  return {
    userId: localStorage.getItem('userId'),
    userName: localStorage.getItem('userName'),
    roleName: localStorage.getItem('roleName'),
    employeeCode: localStorage.getItem('employeeCode'),
    token: token,
  };
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('roleName');
};
