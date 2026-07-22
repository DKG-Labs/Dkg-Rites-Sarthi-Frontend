import { getBaseUrl } from './apiConfig';

const handleApiError = async (response, defaultMessage) => {
  if (response.status === 404) {
    throw new Error("Service endpoint not found. Please restart the backend server to apply the latest changes.");
  }

  try {
    const errorText = await response.text();
    // Try to parse it as JSON
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

export const rheometerService = {
  createRheometer: async (data) => {
    const response = await fetch(`${getBaseUrl()}/railpad-workflow/rheometer/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        await handleApiError(response, 'Failed to create rheometer test record');
    }
    return response.json();
  },

  updateRheometer: async (id, data) => {
    const response = await fetch(`${getBaseUrl()}/railpad-workflow/rheometer/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
        await handleApiError(response, 'Failed to update rheometer test record');
    }
    return response.json();
  },

  deleteRheometer: async (id) => {
    const response = await fetch(`${getBaseUrl()}/railpad-workflow/rheometer/delete/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
        await handleApiError(response, 'Failed to delete rheometer test record');
    }
    return response.text();
  },

  getRheometerList: async (plantId, vendorCode) => {
    const response = await fetch(
      `${getBaseUrl()}/railpad-workflow/rheometer/list?plantId=${encodeURIComponent(plantId)}&vendorCode=${encodeURIComponent(vendorCode)}`
    );
    if (!response.ok) {
        await handleApiError(response, 'Failed to fetch rheometer test records');
    }
    return response.json();
  }
};
