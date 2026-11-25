import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// Super Admin – temporary DP change of a PO serial (restored automatically after 2 hours)
const BASE = `${API_BASE_URL}/api/super-admin/dp-change`;

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) throw new Error(body?.message || `Request failed (${res.status})`);
  return body?.data;
};

/** PO dropdown page: { content: [{ poNo, poDate, vendorCode, vendorName, product, railway }], total, hasMore } */
export const searchPos = async ({ q = '', page = 0, size = 50, signal } = {}) => {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (q.trim()) p.append('q', q.trim());
  return handle(await fetch(`${BASE}/pos?${p}`, { headers: getAuthHeaders(), signal }));
};

/** PO summary + items [{ srNo, itemDesc, qty, uom, dp, extDp, activeChange }] */
export const getPoDp = async (poNo) =>
  handle(await fetch(`${BASE}/po?poNo=${encodeURIComponent(poNo)}`, { headers: getAuthHeaders() }));

export const applyDpChange = async ({ poNo, srNo, newDp, remarks }) =>
  handle(await fetch(`${BASE}/apply`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ poNo, srNo, newDp, remarks }),
  }));

export const revertDpChange = async (id) =>
  handle(await fetch(`${BASE}/${id}/revert`, { method: 'POST', headers: getAuthHeaders() }));

export const getActiveDpChanges = async () =>
  handle(await fetch(`${BASE}/active`, { headers: getAuthHeaders() }));

export const getDpChangeHistory = async ({ poNo = '', page = 0, size = 20 } = {}) => {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (poNo) p.append('poNo', poNo);
  return handle(await fetch(`${BASE}/history?${p}`, { headers: getAuthHeaders() }));
};
