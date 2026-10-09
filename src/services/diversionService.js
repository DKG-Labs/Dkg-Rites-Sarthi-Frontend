import { API_BASE_URL, getAuthHeaders, handleResponse } from './apiConfig';

const BASE_URL = `${API_BASE_URL}/api/erc/diversion`;

export const diversionService = {
  // 1. CM Actions
  getPendingCmRequests: async () => {
    const response = await fetch(`${BASE_URL}/cm/pending-requests`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  cmApprove: async ({ diversionId, actionRemarks, actionBy, actionByRole }) => {
    const response = await fetch(`${BASE_URL}/cm/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        diversionId,
        actionRemarks,
        actionBy,
        actionByRole: actionByRole || 'CONTROLLING_MANAGER'
      })
    });
    return handleResponse(response);
  },

  cmReturn: async ({ diversionId, actionRemarks, actionBy, actionByRole }) => {
    const response = await fetch(`${BASE_URL}/cm/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        diversionId,
        actionRemarks,
        actionBy,
        actionByRole: actionByRole || 'CONTROLLING_MANAGER'
      })
    });
    return handleResponse(response);
  },

  // 2. SBU Head Actions
  getPendingSbuRequests: async () => {
    const response = await fetch(`${BASE_URL}/sbu/pending-requests`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  sbuApprove: async ({ diversionId, actionRemarks, actionBy, actionByRole }) => {
    const response = await fetch(`${BASE_URL}/sbu/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        diversionId,
        actionRemarks,
        actionBy,
        actionByRole: actionByRole || 'SBU_HEAD'
      })
    });
    return handleResponse(response);
  },

  sbuReturn: async ({ diversionId, actionRemarks, actionBy, actionByRole }) => {
    const response = await fetch(`${BASE_URL}/sbu/return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        diversionId,
        actionRemarks,
        actionBy,
        actionByRole: actionByRole || 'SBU_HEAD'
      })
    });
    return handleResponse(response);
  },

  // 3. Workflow History & Lineage
  getDiversionHistory: async (diversionId) => {
    const response = await fetch(`${BASE_URL}/history/${diversionId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getCallSourceReference: async (callId) => {
    const response = await fetch(`${BASE_URL}/call-source-reference/${callId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export default diversionService;
