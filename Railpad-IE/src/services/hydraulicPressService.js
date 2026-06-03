import { getBaseUrl } from './apiConfig';
import { getStoredUser } from './authService';

export const hydraulicPressService = {
  getByShiftAndDate: async (plantId, shift, date) => {
    const response = await fetch(
      `${getBaseUrl()}/hydraulic-press/shift?plantId=${encodeURIComponent(plantId)}&shift=${encodeURIComponent(shift)}&castingDate=${encodeURIComponent(date)}`
    );
    if (!response.ok) throw new Error('Failed to fetch hydraulic press records');
    const data = await response.json();
    return data.responseData || [];
  },

  create: async (payload) => {
    const user = getStoredUser();
    const createdBy = user ? user.userId : null;
    const body = {
      ...payload,
      createdBy: createdBy ? parseInt(createdBy, 10) : null
    };

    const response = await fetch(`${getBaseUrl()}/hydraulic-press`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Failed to create hydraulic press record');
    const data = await response.json();
    return data.responseData;
  },

  update: async (id, payload) => {
    const user = getStoredUser();
    const updatedBy = user ? user.userId : null;
    const body = {
      ...payload,
      updatedBy: updatedBy ? parseInt(updatedBy, 10) : null
    };

    const response = await fetch(`${getBaseUrl()}/hydraulic-press/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Failed to update hydraulic press record');
    const data = await response.json();
    return data.responseData;
  },

  delete: async (id) => {
    const response = await fetch(`${getBaseUrl()}/hydraulic-press/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete hydraulic press record');
    const data = await response.json();
    return data.responseData;
  }
};
