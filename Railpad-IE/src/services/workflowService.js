import { getBaseUrl, API_ENDPOINTS } from './apiConfig';
import { getStoredUser } from './authService';

export const fetchPendingWorkflowTransitions = async (roleName, plantId = '') => {
  try {
    let url = `${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.ALL_PENDING_TRANSITIONS}?roleName=${encodeURIComponent(roleName)}`;
    if (plantId) {
      url += `&plantId=${encodeURIComponent(plantId)}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    if (data.responseStatus?.statusCode === 0) {
      return data.responseData || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching pending transitions:', error);
    return [];
  }
};

export const fetchMappedPlantIds = async (userId, ieType = 'Main IE') => {
  const cacheKey = `mappedPlantIds_${userId}_${ieType}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.MAPPED_PLANT_IDS}?userId=${userId}&ieType=${encodeURIComponent(ieType)}`);
    const data = await response.json();
    if (data.responseStatus?.statusCode === 0) {
      const plantIds = data.responseData || [];
      localStorage.setItem(cacheKey, JSON.stringify(plantIds));
      return plantIds;
    }
    return [];
  } catch (error) {
    console.error('Error fetching mapped plant IDs:', error);
    return [];
  }
};

export const fetchCompletedCalls = async (plantId = '') => {
  try {
    const user = getStoredUser();
    if (!user || !user.userId) {
      console.warn('No user found in storage for completed calls fetch');
      return [];
    }
    let url = `${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.ALL_COMPLETED_CALLS}?userId=${user.userId}`;
    if (plantId) {
      url += `&plantId=${encodeURIComponent(plantId)}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    if (data.responseStatus?.statusCode === 0) {
      return data.responseData || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching completed calls:', error);
    return [];
  }
};

export const performTransitionAction = async (actionData) => {
  try {
    let payload = { ...actionData };

    // Auto-resolve to latest active workflowTransitionId for this requestId if available
    if (payload.requestId) {
      try {
        const histResp = await fetch(`${getBaseUrl()}/railpad-workflow/WorkflowTransitionHistory?requestId=${encodeURIComponent(payload.requestId)}`);
        const histData = await histResp.json();
        if (histData.responseStatus?.statusCode === 0 && Array.isArray(histData.responseData) && histData.responseData.length > 0) {
          const latestTx = histData.responseData[histData.responseData.length - 1];
          const latestId = latestTx.workflowTransitionId || latestTx.id;
          if (latestId && latestId > (payload.workflowTransitionId || 0)) {
            console.log(`[WorkflowService] Auto-syncing workflowTransitionId from ${payload.workflowTransitionId} to latest ID ${latestId} for request ${payload.requestId}`);
            payload.workflowTransitionId = latestId;
          }
        }
      } catch (e) {
        console.warn('[WorkflowService] Failed to auto-sync workflow transition ID:', e);
      }
    }

    const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.PERFORM_TRANSITION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      let errorMsg = 'Failed to perform workflow transition';
      try {
        const errJson = await response.json();
        errorMsg = errJson?.responseStatus?.message || errJson?.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    const data = await response.json();
    if (data?.responseStatus && data.responseStatus.statusCode !== 0) {
      throw new Error(data.responseStatus.message || 'Workflow transition failed');
    }
    return data;
  } catch (error) {
    console.error('Error performing transition:', error);
    throw error;
  }
};
