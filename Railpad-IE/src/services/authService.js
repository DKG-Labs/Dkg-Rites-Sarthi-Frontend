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

export const sendForgotPasswordOtp = async (identifier) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.responseStatus?.message || data.message || 'Failed to send OTP');
    }

    if (data.responseStatus && data.responseStatus.statusCode !== 0) {
      throw new Error(data.responseStatus.message || 'Failed to send OTP');
    }

    return data.responseData;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (identifier, newPassword, transactionId, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, newPassword, transactionId, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.responseStatus?.message || data.message || 'Password reset failed');
    }

    if (data.responseStatus && data.responseStatus.statusCode !== 0) {
      throw new Error(data.responseStatus.message || 'Password reset failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const storeAuthData = (authData) => {
  if (!authData) return;
  const token = authData.token || '';
  if (token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
    localStorage.setItem('railpad_token', token);
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('railpad_token', token);
  }
  localStorage.setItem('userId', authData.userId);
  localStorage.setItem('userName', authData.userName);
  const roles = Array.isArray(authData.roleName)
    ? authData.roleName.join(',')
    : String(authData.roleName || '');
  localStorage.setItem('roleName', roles);
  if (authData.employeeCode) {
    localStorage.setItem('employeeCode', authData.employeeCode);
  }
};

export const getAuthToken = () => {
  return (
    localStorage.getItem('railpad_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('railpad_token') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('token') ||
    null
  );
};

export const getStoredUser = () => {
  const token = getAuthToken();
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
  return !!getAuthToken();
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('railpad_token');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('railpad_token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('roleName');
  localStorage.removeItem('employeeCode');
};
