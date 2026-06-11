import { getBaseUrl } from './apiConfig';
import { getStoredUser } from './authService';

export const finalSpecificGravityService = {
  save: async (payload) => {
    const user = getStoredUser();
    const userId = user ? user.userId : null;
    const body = {
      ...payload,
      userId: userId ? parseInt(userId, 10) : null
    };

    const response = await fetch(`${getBaseUrl()}/final-specific-gravity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Failed to save final specific gravity details');
    const data = await response.json();
    return data.responseData;
  },

  getByCallAndLot: async (callNo, lotNo) => {
    const response = await fetch(`${getBaseUrl()}/final-specific-gravity/call/${encodeURIComponent(callNo)}/lot/${encodeURIComponent(lotNo)}`);
    if (!response.ok) throw new Error('Failed to fetch final specific gravity for call and lot');
    const data = await response.json();
    return data.responseData;
  },

  getByCallNo: async (callNo) => {
    const response = await fetch(`${getBaseUrl()}/final-specific-gravity/call/${encodeURIComponent(callNo)}`);
    if (!response.ok) throw new Error('Failed to fetch final specific gravity for call');
    const data = await response.json();
    return data.responseData || [];
  }
};
