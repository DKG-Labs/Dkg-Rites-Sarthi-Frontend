import { getBaseUrl } from './apiConfig';
import { getStoredUser } from './authService';

export const finalTensionSetService = {
  save: async (payload) => {
    const user = getStoredUser();
    const userId = user ? user.userId : null;
    const body = {
      ...payload,
      userId: userId ? parseInt(userId, 10) : null
    };

    const response = await fetch(`${getBaseUrl()}/final-tension-set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Failed to save final tension set details');
    const data = await response.json();
    return data.responseData;
  },

  getByCallAndLot: async (callNo, lotNo) => {
    const response = await fetch(`${getBaseUrl()}/final-tension-set/call/${encodeURIComponent(callNo)}/lot/${encodeURIComponent(lotNo)}`);
    if (!response.ok) throw new Error('Failed to fetch final tension set for call and lot');
    const data = await response.json();
    return data.responseData;
  },

  getByCallNo: async (callNo) => {
    const response = await fetch(`${getBaseUrl()}/final-tension-set/call/${encodeURIComponent(callNo)}`);
    if (!response.ok) throw new Error('Failed to fetch final tension set for call');
    const data = await response.json();
    return data.responseData || [];
  }
};
