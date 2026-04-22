import { API_BASE_URL, getAuthHeaders, handleResponse } from './apiConfig';

/**
 * Service for fetching Annexure-related data from the backend
 */
export const annexureService = {
    /**
     * Fetches Chemical Analysis data for a specific Inspection Call
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The chemical analysis report data
     */
    getChemicalAnalysis: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/chemical-analysis/${callNo}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error fetching Chemical Analysis for call ${callNo}:`, error);
            throw error;
        }
    },

    /**
     * Fetches Dimensional Check data for a specific Inspection Call
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The dimensional check report data
     */
    getDimensionalCheck: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/dimensional-check/${callNo}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error fetching Dimensional Check for call ${callNo}:`, error);
            throw error;
        }
    },

    /**
     * Fetches Final chemical Analysis data (Annexure-VI)
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The final chemical analysis data
     */
    getFinalChemicalAnalysis: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-chemical-analysis/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching final chemical analysis:', error);
            throw error;
        }
    },

    /**
     * Fetches Final Hardness Test data (Annexure-VIII)
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The final hardness test data
     */
    getFinalHardnessTest: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-hardness-test/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error fetching Final Hardness Test for call ${callNo}:`, error);
            throw error;
        }
    },

    /**
     * Fetches Final Toe Load Test data (Annexure-XI)
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The final toe load test data
     */
    getFinalToeLoadTest: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-toe-load-test/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error fetching Final Toe Load Test for call ${callNo}:`, error);
            throw error;
        }
    },

    getFinalWeightTest: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-weight-test/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching Final Weight Test data:", error);
            throw error;
        }
    },

    getFinalInclusion: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-inclusion/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching Final Inclusion Annexure data:", error);
            throw error;
        }
    },

    getFinalApplicationDeflection: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-application-deflection/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching Final Application & Deflection data:", error);
            throw error;
        }
    }
};
