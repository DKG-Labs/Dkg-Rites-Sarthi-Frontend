import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/rail-visual-inspection';

const handleApiError = (error, defaultMessage) => {
  if (error.response && error.response.data && error.response.data.error) {
    throw new Error(error.response.data.error);
  } else if (error.response && error.response.data && error.response.data.message) {
    throw new Error(error.response.data.message);
  }
  throw new Error(defaultMessage);
};

export const visualInspectionService = {
  create: async (data) => {
    try {
      const response = await axios.post(BASE_URL, data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create visual inspection record');
    }
  },

  update: async (id, data) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update visual inspection record');
    }
  },

  getList: async (plantId, vendorCode) => {
    try {
      const response = await axios.get(`${BASE_URL}/${plantId}/${vendorCode}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch visual inspection records');
    }
  },

  delete: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to delete visual inspection record');
    }
  }
};
