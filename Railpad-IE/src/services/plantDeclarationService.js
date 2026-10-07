import { getBaseUrl } from './apiConfig';

export const plantSetupService = {
  getByPlantId: async (plantId) => {
    const response = await fetch(`${getBaseUrl()}/rail-plant-setup/plant?plantId=${encodeURIComponent(plantId)}`);
    if (!response.ok) throw new Error('Failed to fetch entries by plant ID');
    return response.json();
  },
  getById: async (id) => {
    const response = await fetch(`${getBaseUrl()}/rail-plant-setup/${id}`);
    if (!response.ok) throw new Error('Failed to fetch setup by ID');
    return response.json();
  },
  unblock: async (id, unblockData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const response = await fetch(`${getBaseUrl()}/rail-plant-setup/unblock/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(unblockData || {})
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.responseStatus?.message || errData.message || 'Failed to unblock plant setup');
    }
    return response.json();
  }
};

export const rawMaterialService = {
  getByPlantId: async (plantId) => {
    const response = await fetch(`${getBaseUrl()}/rail-raw-material-source/plant?plantId=${encodeURIComponent(plantId)}`);
    if (!response.ok) throw new Error('Failed to fetch entries by plant ID');
    return response.json();
  },
  getById: async (id) => {
    const response = await fetch(`${getBaseUrl()}/rail-raw-material-source/${id}`);
    if (!response.ok) throw new Error('Failed to fetch raw material source by ID');
    return response.json();
  },
  unblock: async (id, unblockData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const response = await fetch(`${getBaseUrl()}/rail-raw-material-source/unblock/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(unblockData || {})
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.responseStatus?.message || errData.message || 'Failed to unblock raw material source');
    }
    return response.json();
  }
};

export const productRecipeService = {
  getByPlantId: async (plantId) => {
    const response = await fetch(`${getBaseUrl()}/rail-product-recipe/plant?plantId=${encodeURIComponent(plantId)}`);
    if (!response.ok) throw new Error('Failed to fetch entries by plant ID');
    return response.json();
  },
  getById: async (id) => {
    const response = await fetch(`${getBaseUrl()}/rail-product-recipe/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product recipe by ID');
    return response.json();
  },
  unblock: async (id, unblockData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const response = await fetch(`${getBaseUrl()}/rail-product-recipe/unblock/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(unblockData || {})
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.responseStatus?.message || errData.message || 'Failed to unblock product recipe');
    }
    return response.json();
  }
};

export const approvedAshSGService = {
  getByPlantId: async (plantId) => {
    const response = await fetch(`${getBaseUrl()}/rail-approved-ash-sg/plant?plantId=${encodeURIComponent(plantId)}`);
    if (!response.ok) throw new Error('Failed to fetch entries by plant ID');
    return response.json();
  },
  getById: async (id) => {
    const response = await fetch(`${getBaseUrl()}/rail-approved-ash-sg/${id}`);
    if (!response.ok) throw new Error('Failed to fetch ash baseline by ID');
    return response.json();
  },
  unblock: async (id, unblockData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const response = await fetch(`${getBaseUrl()}/rail-approved-ash-sg/unblock/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(unblockData || {})
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.responseStatus?.message || errData.message || 'Failed to unblock ash & SG baseline');
    }
    return response.json();
  }
};

export const approvedQAPService = {
  getByPlantId: async (plantId) => {
    const response = await fetch(`${getBaseUrl()}/rail-approved-qap/plant?plantId=${encodeURIComponent(plantId)}`);
    if (!response.ok) throw new Error('Failed to fetch entries by plant ID');
    return response.json();
  },
  getById: async (id) => {
    const response = await fetch(`${getBaseUrl()}/rail-approved-qap/${id}`);
    if (!response.ok) throw new Error('Failed to fetch QAP by ID');
    return response.json();
  },
  unblock: async (id, unblockData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const response = await fetch(`${getBaseUrl()}/rail-approved-qap/unblock/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(unblockData || {})
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.responseStatus?.message || errData.message || 'Failed to unblock QAP');
    }
    return response.json();
  }
};
