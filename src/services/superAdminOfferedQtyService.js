import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// Super Admin – change offered qty of ERC calls (ER per heat, EP / EF per lot)
const BASE = `${API_BASE_URL}/api/super-admin/offered-qty`;

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) throw new Error(body?.message || `Request failed (${res.status})`);
  return body?.data;
};

export const searchErcCalls = async ({ type, q = '', page = 0, size = 20, signal }) => {
  const p = new URLSearchParams({ type, page: String(page), size: String(size) });
  if (q.trim()) p.append('q', q.trim());
  return handle(await fetch(`${BASE}/calls?${p}`, { headers: getAuthHeaders(), signal }));
};

export const getCallOfferedQty = async (callNo) =>
  handle(await fetch(`${BASE}/${encodeURIComponent(callNo)}`, { headers: getAuthHeaders() }));

export const updateCallOfferedQty = async (callNo, items, remarks) =>
  handle(await fetch(`${BASE}/${encodeURIComponent(callNo)}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ items, remarks: remarks.trim() }),
  }));

export const getOfferedQtyHistory = async ({ callNo = '', page = 0, size = 20 } = {}) => {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (callNo.trim()) p.append('callNo', callNo.trim());
  return handle(await fetch(`${BASE}/history?${p}`, { headers: getAuthHeaders() }));
};
