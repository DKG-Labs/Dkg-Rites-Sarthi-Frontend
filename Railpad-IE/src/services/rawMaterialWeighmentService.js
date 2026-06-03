import { getBaseUrl } from './apiConfig';
import { getStoredUser } from './authService';

export const rawMaterialWeighmentService = {
  getByShiftAndDate: async (plantId, shift, date) => {
    const response = await fetch(
      `${getBaseUrl()}/raw-material-weighment/shift?plantId=${encodeURIComponent(plantId)}&shift=${encodeURIComponent(shift)}&castingDate=${encodeURIComponent(date)}`
    );
    if (!response.ok) throw new Error('Failed to fetch raw material weighments');
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

    const response = await fetch(`${getBaseUrl()}/raw-material-weighment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Failed to create raw material weighment');
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

    const response = await fetch(`${getBaseUrl()}/raw-material-weighment/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Failed to update raw material weighment');
    const data = await response.json();
    return data.responseData;
  },

  delete: async (id) => {
    const response = await fetch(`${getBaseUrl()}/raw-material-weighment/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete raw material weighment');
    const data = await response.json();
    return data.responseData;
  }
};
