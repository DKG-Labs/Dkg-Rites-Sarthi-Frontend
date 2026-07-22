import { getBaseUrl } from './apiConfig';

const handleApiError = async (response, defaultMessage) => {
  if (response.status === 404) {
    throw new Error("Service endpoint not found. Please restart the backend server to apply the latest changes.");
  }

  try {
    const errorText = await response.text();
    const errorData = JSON.parse(errorText);
    if (errorData.message) throw new Error(errorData.message);
    if (errorData.responseStatus && errorData.responseStatus.message) {
      throw new Error(errorData.responseStatus.message);
    }
    throw new Error(defaultMessage);
  } catch (e) {
    if (e.message !== defaultMessage && !e.message.includes("Unexpected token")) {
      throw e;
    }
    throw new Error(defaultMessage);
  }
};

export const mouldVerificationService = {
  createMouldVerification: async (data) => {
    const response = await fetch(`${getBaseUrl()}/railpad-workflow/mould-verification/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        await handleApiError(response, 'Failed to save mould verification. Please try again.');
    }
    return response.json();
  },

  updateMouldVerification: async (id, data) => {
    const response = await fetch(`${getBaseUrl()}/railpad-workflow/mould-verification/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        await handleApiError(response, 'Failed to update mould verification. Please try again.');
    }
    return response.json();
  },

  deleteMouldVerification: async (id) => {
    const response = await fetch(`${getBaseUrl()}/railpad-workflow/mould-verification/delete/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
        await handleApiError(response, 'Failed to delete mould verification. Please try again.');
    }
    return response.text();
  },

  getMouldVerificationsList: async (plantId, vendorCode) => {
    const response = await fetch(
      `${getBaseUrl()}/railpad-workflow/mould-verification/list?plantId=${encodeURIComponent(plantId)}&vendorCode=${encodeURIComponent(vendorCode)}`
    );
    if (!response.ok) {
        await handleApiError(response, 'Failed to fetch mould verification records.');
    }
    return response.json();
  }
};
