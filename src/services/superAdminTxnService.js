import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// Super Admin – Cancel Last Transaction of an ERC / Sleeper / Rail Pad call
const BASE = `${API_BASE_URL}/api/super-admin/transactions`;

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body?.data;
};

export const getCallTransactions = async (callNo) => {
  const res = await fetch(`${BASE}?callNo=${encodeURIComponent(callNo.trim())}`, { headers: getAuthHeaders() });
  return handle(res);
};

export const deleteLatestTransaction = async (callNo, transitionId, remarks) => {
  const res = await fetch(`${BASE}/${transitionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ callNo: callNo.trim(), remarks: remarks.trim() }),
  });
  return handle(res);
};

export const getCancelHistory = async ({ callNo = '', page = 0, size = 20 } = {}) => {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (callNo.trim()) q.append('callNo', callNo.trim());
  const res = await fetch(`${BASE}/history?${q.toString()}`, { headers: getAuthHeaders() });
  return handle(res);
};
