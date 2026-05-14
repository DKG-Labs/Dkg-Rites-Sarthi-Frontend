import { getBaseUrl, API_ENDPOINTS, getDefaultHeaders } from './apiConfig';
import { getAuthToken } from './authService';

const getHeaders = () => {
  const token = getAuthToken();
  return getDefaultHeaders(token);
};

export const scheduleInspection = async (scheduleData) => {
  const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_SCHEDULE.SCHEDULE}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(scheduleData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.responseStatus?.message || 'Failed to schedule inspection');
  }

  const data = await response.json();
  return data.responseData;
};

export const rescheduleInspection = async (scheduleData) => {
  const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_SCHEDULE.RESCHEDULE}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(scheduleData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.responseStatus?.message || 'Failed to reschedule inspection');
  }

  const data = await response.json();
  return data.responseData;
};

export const getScheduleByCallNo = async (callNo) => {
  const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_SCHEDULE.BASE}/${callNo}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.responseData;
};

export const getScheduleCountByDate = async (date) => {
  const response = await fetch(`${getBaseUrl()}${API_ENDPOINTS.RAILPAD_SCHEDULE.COUNT_BY_DATE}?date=${date}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.responseData || 0;
};
