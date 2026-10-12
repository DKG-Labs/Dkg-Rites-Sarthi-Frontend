// API Configuration
// Base URL configuration for different environments

export const getBaseUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? "http://localhost:8080/sarthi-backend/api"
    : "https://api.ritesqasarthi.com/sarthi-backend/api";
};

export const API_BASE_URL = "https://api.ritesqasarthi.com/sarthi-backend/api";

export const getCertificateStorageUrl = () => {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  return isLocal
    ? "https://api.ritesqasarthi.com/sarthi-backend/api/certificate-storage"
    : `${getBaseUrl()}/certificate-storage`;
};
// API Endpoints configuration
export const API_ENDPOINTS = {
  INSPECTION_CALLS: {
    GET_VENDOR_ICS: '/inspection-calls/vendor'
  },
  RAILPAD_WORKFLOW: {
    GET_MAPPED_COMPANIES: '/railpad-workflow/getMappedCompanyNames',
    GET_PLANTS_BY_COMPANY: '/railpad-workflow/getPlantsByCompanyName',
    ALL_PENDING_TRANSITIONS: '/railpad-workflow/allPendingWorkflowTransition',
    PERFORM_TRANSITION: '/railpad-workflow/performTransitionAction',
    ALL_COMPLETED_CALLS: '/railpad-workflow/allCompletedCalls',
    ALL_FINAL_COMPLETED_CALLS: '/railpad-workflow/allFInalCallCompletedCalls',
    ALL_CLOSED_CALLS: '/railpad-workflow/allClosedCalls',
    MAPPED_PLANT_IDS: '/railpad-workflow/mapped-plant-ids'
  },
  PRODUCTION_DECLARATION: {
    GET_BY_ID: '/rail-production-declaration'
  },
  IE_PRODUCTION_VERIFICATION: {
    SAVE: '/ie-production-verification',
    GET_BY_REQUEST_ID: '/ie-production-verification/request',
    DELETE: '/ie-production-verification/request',
    UNBLOCK: '/ie-production-verification/unblock'
  },
  RAILPAD_SCHEDULE: {
    BASE: '/rail-inspection-schedule',
    SCHEDULE: '/rail-inspection-schedule/schedule',
    RESCHEDULE: '/rail-inspection-schedule/reschedule',
    COUNT_BY_DATE: '/rail-inspection-schedule/count-by-date'
  },
  RAILPAD_INSPECTION_CALL: {
    GET_SUMMARY: '/rail-inspection-call/summary'
  },
  RAIL_INITIATION_VERIFICATION: {
    SUBMIT: '/rail-initiation-verification/submit',
    GET_BY_CALL_NO: '/rail-initiation-verification'
  }
};

// HTTP request timeout in milliseconds
export const REQUEST_TIMEOUT = 60000;

// Default headers for API requests
export const getDefaultHeaders = (tokenOrHeaders = null, extraHeaders = {}) => {
  let token = null;
  let customHeaders = {};

  if (typeof tokenOrHeaders === 'string') {
    token = tokenOrHeaders;
    customHeaders = extraHeaders || {};
  } else if (tokenOrHeaders && typeof tokenOrHeaders === 'object') {
    customHeaders = tokenOrHeaders;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders
  };

  const candidates = [
    token,
    localStorage.getItem('railpad_token'),
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    localStorage.getItem('sleeper_token'),
    sessionStorage.getItem('railpad_token'),
    sessionStorage.getItem('authToken'),
    sessionStorage.getItem('token')
  ];

  let effectiveToken = '';
  for (const candidate of candidates) {
    if (candidate) {
      const trimmed = String(candidate).trim();
      const lower = trimmed.toLowerCase();
      if (lower !== '' && lower !== 'null' && lower !== 'undefined' && lower !== 'bearer' && lower !== 'bearer null' && lower !== 'bearer undefined') {
        effectiveToken = trimmed.replace(/^Bearer\s+/i, '').trim();
        break;
      }
    }
  }

  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  return headers;
};
