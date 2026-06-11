import { getBaseUrl } from './apiConfig';
import { getStoredUser } from './authService';

export const finalInspectionLotResultsService = {
  save: async (payload) => {
    const user = getStoredUser();
    const userId = user ? user.userId : null;
    const body = {
      ...payload,
      userId: userId ? parseInt(userId, 10) : null
    };

    const response = await fetch(`${getBaseUrl()}/final-inspection-lot-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Failed to save final inspection lot results');
    const data = await response.json();
    return data.responseData;
  },

  getByCallNo: async (callNo) => {
    const response = await fetch(`${getBaseUrl()}/final-inspection-lot-results/call/${encodeURIComponent(callNo)}`);
    if (!response.ok) throw new Error('Failed to fetch final inspection lot results for call');
    const data = await response.json();
    return data.responseData || [];
  }
};
