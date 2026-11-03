import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// Rail Pad Rejection Basket for Railway Board / RITES Admin (read-only; backend allows all plants)
const base = () => `${API_BASE_URL}/api/railpad-scrap`;

const toQuery = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? `?${new URLSearchParams(clean).toString()}` : '';
};

const handle = async (res) => {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    throw new Error(data?.responseStatus?.message || data?.message || data?.error || `Request failed (HTTP ${res.status})`);
  }
  return data?.responseData !== undefined && data?.responseStatus ? data.responseData : data;
};

export const getRejectionBasket = (filters = {}) =>
  fetch(`${base()}/basket${toQuery(filters)}`, { headers: getAuthHeaders() }).then(handle);

export const getRejectionHistory = (params) =>
  fetch(`${base()}/history${toQuery(params)}`, { headers: getAuthHeaders() }).then(handle);

export const getScrapLedger = (params) =>
  fetch(`${base()}/ledger${toQuery(params)}`, { headers: getAuthHeaders() }).then(handle);

export const getPendingScrap = (plantId, productType) =>
  fetch(`${base()}/pending${toQuery({ plantId, productType })}`, { headers: getAuthHeaders() }).then(handle);

export const getScrapVerification = (id) =>
  fetch(`${base()}/verification/${id}`, { headers: getAuthHeaders() }).then(handle);

// Read-only here; scrap verifications are recorded by the Process IE in the Rail Pad IE app
const notAllowed = () => Promise.reject(new Error('Scrap verifications can only be recorded by the Process IE.'));
export const addScrapVerification = notAllowed;
export const updateScrapVerification = notAllowed;
export const deleteScrapVerification = notAllowed;

export const fetchScrapPhoto = async (url) => {
  const headers = { ...getAuthHeaders() };
  delete headers['Content-Type'];
  const res = await fetch(`${API_BASE_URL}/api/scrap-entry/image-proxy?url=${encodeURIComponent(url)}`, { headers });
  if (!res.ok) throw new Error('Photo could not be loaded');
  return URL.createObjectURL(await res.blob());
};
