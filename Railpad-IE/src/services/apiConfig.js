// API Configuration
// Base URL configuration for different environments

export const getBaseUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? "http://localhost:8080/sarthi-backend/api"
    : "https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api";
};
// export const API_BASE_URL = "https://api.ritesqasarthi.com/sarthi-backend/api";
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
    MAPPED_PLANT_IDS: '/railpad-workflow/mapped-plant-ids'
  },
  PRODUCTION_DECLARATION: {
    GET_BY_ID: '/rail-production-declaration'
  },
  IE_PRODUCTION_VERIFICATION: {
    SAVE: '/ie-production-verification',
    GET_BY_REQUEST_ID: '/ie-production-verification/request',
    DELETE: '/ie-production-verification/request'
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
