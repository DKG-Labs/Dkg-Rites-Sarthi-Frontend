import { API_BASE_URL, getAuthHeaders } from './apiConfig';

const BASE = `${API_BASE_URL}/api/admin/ic`;

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.responseStatus?.message || body?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body?.responseData;
};

export const getIcDetails = async (callNo) => {
  const res = await fetch(`${BASE}/get-details?callNo=${encodeURIComponent(callNo.trim())}`, {
    headers: getAuthHeaders(),
  });
  return handle(res);
};

export const updateIcDate = async (callNo, newDate) => {
  const res = await fetch(`${BASE}/update-date`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ callNo: callNo.trim(), newDate }),
  });
  return handle(res);
};

export const getIcViewUrl = (icLink) => (icLink ? `${API_BASE_URL}${icLink}` : '');
