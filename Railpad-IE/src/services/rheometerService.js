import { getBaseUrl } from './apiConfig';

const handleApiError = async (response, defaultMessage) => {
  if (response.status === 404) {
    throw new Error("Service endpoint not found. Please restart the backend server to apply the latest changes.");
  }
  // The backend answers errors as JSON ({ message } / { responseStatus.message }) or as plain text.
  // Read the body once and show the real reason; never a browser-specific "JSON.parse" error.
  let text = '';
  try { text = (await response.text()) || ''; } catch (e) { /* no body */ }
  let message = '';
  try {
    const data = JSON.parse(text);
    message = data?.message || data?.responseStatus?.message || data?.error || '';
  } catch (e) {
    const t = text.trim();
    if (t && !t.startsWith('<') && t.length <= 500) message = t;   // plain-text reason, not an HTML error page
  }
  throw new Error(message || defaultMessage);
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

  getRheometerList: async (plantId, vendorCode, fromDate, toDate) => {
    let url = `${getBaseUrl()}/railpad-workflow/rheometer/list?plantId=${encodeURIComponent(plantId)}&vendorCode=${encodeURIComponent(vendorCode)}`;
    if (fromDate) url += `&fromDate=${encodeURIComponent(fromDate)}`;
    if (toDate) url += `&toDate=${encodeURIComponent(toDate)}`;
    const response = await fetch(url);
    if (!response.ok) {
        await handleApiError(response, 'Failed to fetch rheometer test records');
    }
    return response.json();
  }
};
