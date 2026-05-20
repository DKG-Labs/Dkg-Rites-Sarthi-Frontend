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
  }
};
