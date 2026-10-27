import axios from 'axios';
import { getBaseUrl } from './apiConfig';

const getBase = () => `${getBaseUrl()}/rail-visual-inspection`;

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
      const response = await axios.post(getBase(), data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create visual inspection record');
    }
  },

  update: async (id, data) => {
    try {
      const response = await axios.put(`${getBase()}/${id}`, data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update visual inspection record');
    }
  },

  getList: async (plantId, vendorCode, fromDate, toDate) => {
    try {
      // Use query parameter endpoint /list to safely handle slashes in plantId (e.g. 26002/Howrah)
      const params = { plantId, vendorCode };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const response = await axios.get(`${getBase()}/list`, { params });
      return response.data || [];
    } catch (error) {
      try {
        const response2 = await axios.get(`${getBase()}/${plantId}/${vendorCode}`);
        return response2.data || [];
      } catch (err2) {
        console.warn('Failed to fetch visual inspection records:', error);
        return [];
      }
    }
  },

  delete: async (id) => {
    try {
      const response = await axios.delete(`${getBase()}/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to delete visual inspection record');
    }
  }
};
