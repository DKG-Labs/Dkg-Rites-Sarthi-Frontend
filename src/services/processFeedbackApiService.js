import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from './apiConfig';

/**
 * Service for Process IE Feedback / Discrepancy Module APIs
 */
export const processFeedbackApiService = {
  
  /**
   * Fetch Vendors by Product Type
   * @param {string} productType (ERC, Sleeper, Rail Pad)
   */
  fetchVendorsByProduct: async (productType) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback-workflow/vendors`, {
        params: { productType }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      throw error;
    }
  },

  /**
   * Fetch Plants by Vendor Code
   * @param {string} vendorCode 
   */
  fetchPlantsByVendor: async (vendorCode) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback-workflow/plants`, {
        params: { vendorCode }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching plants:", error);
      throw error;
    }
  },

  /**
   * Fetch POs by Vendor Code and Product Type
   * @param {string} vendorCode 
   * @param {string} productType 
   */
  fetchPOsByVendorAndProduct: async (vendorCode, productType) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.VENDOR}/poData`, {
        params: { vendorCode, vendorType: productType }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching POs:", error);
      throw error;
    }
  },

  /**
   * Create a new Process Inspection Discrepancy
   * @param {Object} discrepancyData 
   * @param {File} selectedFile 
   * @param {string} poiCode 
   */
  createDiscrepancy: async (discrepancyData, selectedFile, poiCode) => {
    try {
      console.log("Submitting Discrepancy Payload:", discrepancyData); // Added for visibility
      const formData = new FormData();
      formData.append("discrepancy", new Blob([JSON.stringify(discrepancyData)], { type: "application/json" }));
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/feedback-workflow/create-discrepancy?poiCode=${poiCode}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating discrepancy:", error);
      throw error;
    }
  },

  /**
   * Fetch Pending Discrepancies
   */
  fetchPendingDiscrepancies: async (roleId, productType = '') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback-workflow/pending`, {
        params: { roleId, productType }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching pending discrepancies:", error);
      throw error;
    }
  },

  /**
   * Fetch Completed Discrepancies
   */
  fetchCompletedDiscrepancies: async (productType = '') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback-workflow/feedbacks/completed`, {
        params: { productType }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching completed discrepancies:", error);
      throw error;
    }
  },

  /**
   * Download Document
   */
  downloadDocument: async (discrepancyNo) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback-workflow/download-document/${discrepancyNo}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error("Error downloading document:", error);
      throw error;
    }
  }

};

export default processFeedbackApiService;
