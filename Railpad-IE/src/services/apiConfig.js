// API Configuration
// Base URL configuration for different environments

export const getBaseUrl = () => {
  return "https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api";
};

// API Endpoints configuration
export const API_ENDPOINTS = {
  INSPECTION_CALLS: {
    GET_VENDOR_ICS: '/inspection-calls/vendor'
  }
};

// HTTP request timeout in milliseconds
export const REQUEST_TIMEOUT = 60000;

// Default headers for API requests
export const getDefaultHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};
