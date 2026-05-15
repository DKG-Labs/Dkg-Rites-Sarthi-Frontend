import { getBaseUrl, API_ENDPOINTS } from './apiConfig';
import { getStoredUser } from './authService';

export const fetchPendingWorkflowTransitions = async (roleName) => {
  try {
    const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.ALL_PENDING_TRANSITIONS}?roleName=${encodeURIComponent(roleName)}`);
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

export const fetchCompletedCalls = async () => {
  try {
    const user = getStoredUser();
    if (!user || !user.userId) {
      console.warn('No user found in storage for completed calls fetch');
      return [];
    }
    const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.ALL_COMPLETED_CALLS}?userId=${user.userId}`);
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
    const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_WORKFLOW.PERFORM_TRANSITION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(actionData)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error performing transition:', error);
    throw error;
  }
};
