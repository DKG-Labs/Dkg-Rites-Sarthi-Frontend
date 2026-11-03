import { getBaseUrl, getDefaultHeaders } from './apiConfig';

// Rail Pad Rejection Basket / Scrap Verification / Scrap Ledger  (backend: /api/railpad-scrap)
const base = () => `${getBaseUrl()}/railpad-scrap`;

const toQuery = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? `?${new URLSearchParams(clean).toString()}` : '';
};

/** Reads the backend's error message (plain or wrapped in responseStatus) */
const handle = async (res) => {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const msg = data?.responseStatus?.message || data?.message || data?.error
      || `Request failed (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return data?.responseData !== undefined && data?.responseStatus ? data.responseData : data;
};

export const getRejectionBasket = (filters = {}) =>
  fetch(`${base()}/basket${toQuery(filters)}`, { headers: getDefaultHeaders() }).then(handle);

export const getRejectionHistory = (params) =>
  fetch(`${base()}/history${toQuery(params)}`, { headers: getDefaultHeaders() }).then(handle);

export const getScrapLedger = (params) =>
  fetch(`${base()}/ledger${toQuery(params)}`, { headers: getDefaultHeaders() }).then(handle);

export const getPendingScrap = (plantId, productType) =>
  fetch(`${base()}/pending${toQuery({ plantId, productType })}`, { headers: getDefaultHeaders() }).then(handle);

export const getScrapVerification = (id) =>
  fetch(`${base()}/verification/${id}`, { headers: getDefaultHeaders() }).then(handle);

export const addScrapVerification = (payload) =>
  fetch(`${base()}/verification`, {
    method: 'POST', headers: getDefaultHeaders(), body: JSON.stringify(payload),
  }).then(handle);

export const updateScrapVerification = (id, payload) =>
  fetch(`${base()}/verification/${id}`, {
    method: 'PUT', headers: getDefaultHeaders(), body: JSON.stringify(payload),
  }).then(handle);

export const deleteScrapVerification = (id, reason) =>
  fetch(`${base()}/verification/${id}${toQuery({ reason })}`, {
    method: 'DELETE', headers: getDefaultHeaders(),
  }).then(handle);

/** Photos are in a private container; fetch them with the login token and return a local object URL */
export const fetchScrapPhoto = async (url) => {
  const headers = { ...getDefaultHeaders() };
  delete headers['Content-Type'];
  const res = await fetch(`${getBaseUrl()}/scrap-entry/image-proxy?url=${encodeURIComponent(url)}`, { headers });
  if (!res.ok) throw new Error('Photo could not be loaded');
  return URL.createObjectURL(await res.blob());
};
