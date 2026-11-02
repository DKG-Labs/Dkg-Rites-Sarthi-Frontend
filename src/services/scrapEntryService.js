import { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

const BASE = `${API_BASE_URL}/api/scrap-entry`;

/**
 * Converts a direct Azure Blob URL for a scrap image into a backend proxy URL.
 * Required because the scrap-images container has public access disabled (409).
 */
export const scrapImageProxyUrl = (blobUrl) => {
  if (!blobUrl) return blobUrl;
  // Already a proxy URL — don't double-wrap
  if (blobUrl.startsWith('/') || blobUrl.includes('/api/scrap-entry/image-proxy')) return blobUrl;
  return `${BASE}/image-proxy?url=${encodeURIComponent(blobUrl)}`;
};

/**
 * <img> replacement that fetches the scrap image-proxy URL with an auth token.
 * Browser <img> tags cannot send Authorization headers, causing 401 on protected endpoints.
 */
export function AuthedImg({ src, alt, ...props }) {
  const [blobSrc, setBlobSrc] = useState(null);

  useEffect(() => {
    if (!src) return;
    // base64 data URIs and local blobs don't need auth — render directly
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setBlobSrc(src);
      return;
    }
    let objectUrl;
    fetch(src, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.blob() : Promise.reject(r.status))
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setBlobSrc(objectUrl);
      })
      .catch(() => setBlobSrc(null));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);

  if (!blobSrc) return null;
  return <img src={blobSrc} alt={alt} {...props} />;
}

export const getMappedPlants = async (ieUserId, ieType) => {
  const res = await fetch(`${BASE}/plants?ieUserId=${ieUserId}&ieType=${ieType}`);
  if (!res.ok) throw new Error('Failed to fetch mapped plants');
  return res.json();
};

export const getLedger = async (poiCode, unitLineShed) => {
  const params = new URLSearchParams({ poiCode });
  if (unitLineShed) params.set('unitLineShed', unitLineShed);
  const res = await fetch(`${BASE}/ledger?${params}`);
  if (!res.ok) throw new Error('Failed to fetch ledger');
  return res.json();
};

export const getPendingQty = async (poiCode, date) => {
  const params = new URLSearchParams({ poiCode });
  if (date) params.set('date', date);
  const res = await fetch(`${BASE}/pending-qty?${params}`);
  if (!res.ok) throw new Error('Failed to fetch pending qty');
  return res.json();
};

const extractErrorMessage = (err, fallback) =>
  err?.responseStatus?.message || err?.message || fallback;

export const addScrapEntry = async (payload) => {
  const res = await fetch(`${BASE}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, 'Failed to add disposal entry'));
  }
  return res.json();
};

export const updateScrapEntry = async (id, payload) => {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, 'Failed to update disposal entry'));
  }
  return res.json();
};

export const deleteScrapEntry = async (id, reason, actionBy) => {
  const params = new URLSearchParams({ reason, actionBy });
  const res = await fetch(`${BASE}/${id}?${params}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, 'Failed to delete disposal entry'));
  }
};

export const getBoardSummary = async (productType = 'ERC') => {
  const res = await fetch(`${BASE}/board-summary?productType=${productType}`);
  if (!res.ok) throw new Error('Failed to fetch board summary');
  return res.json();
};

export const getRejectionBreakup = async (poiCode, date, stage, shift, lineName) => {
  const params = new URLSearchParams({ poiCode, date, stage });
  if (shift) params.set('shift', shift);
  if (lineName) params.set('lineName', lineName);
  const res = await fetch(`${BASE}/rejection-breakup?${params}`);
  if (!res.ok) throw new Error('Failed to fetch rejection breakup');
  return res.json();
};
