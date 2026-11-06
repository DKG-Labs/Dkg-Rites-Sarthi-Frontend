import { useEffect, useState, createElement } from 'react';
import { api } from './api';

// Sleeper Rejection Basket / Scrap Verification / Scrap Ledger  (backend: /api/sleeper-scrap)
const BASE = '/sleeper-scrap';

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

/**
 * One network call per identical GET while it is in flight. React StrictMode (dev) mounts every component
 * twice, which would otherwise fire each on-mount request twice; callers share the same promise instead.
 */
const inflight = new Map();
const getOnce = (url, params) => {
  const key = `${url}?${new URLSearchParams(params || {}).toString()}`;
  if (inflight.has(key)) return inflight.get(key);
  const p = api.get(url, params ? { params } : undefined).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
};

/** Plant-wise summary (IE: mapped plants; others: all plants with data) */
export const getSleeperBasket = () => getOnce(`${BASE}/basket`);

/** Pending (rejected, not yet scrapped) sleepers of a plant */
export const getPendingSleepers = (plantId) => getOnce(`${BASE}/pending`, { plantId });

/** Scrap ledger with running balance */
export const getSleeperLedger = (plantId, filters = {}) => getOnce(`${BASE}/ledger`, clean({ plantId, ...filters }));

export const getSleeperScrapVerification = (id) => getOnce(`${BASE}/verification/${id}`);

export const addSleeperScrapVerification = (payload) => api.post(`${BASE}/verification`, payload);

export const updateSleeperScrapVerification = (id, payload) => api.put(`${BASE}/verification/${id}`, payload);

export const deleteSleeperScrapVerification = (id, reason) =>
  api.delete(`${BASE}/verification/${id}`, { params: { reason } });

/** Scrap photos are in a private container: load them through the backend proxy with the login token */
const fetchScrapPhoto = async (url) => {
  const blob = await api.get('/scrap-entry/image-proxy', { params: { url }, responseType: 'blob' });
  return URL.createObjectURL(blob);
};

/** <img> that loads a private scrap photo (or shows a local base64 / blob preview directly) */
export function AuthedImg({ src, alt, ...props }) {
  const [blobSrc, setBlobSrc] = useState(null);
  const isLocal = !!src && (src.startsWith('data:') || src.startsWith('blob:'));

  useEffect(() => {
    if (!src || isLocal) return undefined;
    let alive = true;
    let objectUrl;
    fetchScrapPhoto(src)
      .then(u => {
        objectUrl = u;
        if (alive) setBlobSrc(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => alive && setBlobSrc(null));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, isLocal]);

  const shown = isLocal ? src : blobSrc;
  if (!shown) return null;
  return createElement('img', { src: shown, alt, ...props });
}
