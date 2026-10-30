import { API_BASE_URL } from './apiConfig';

const BASE = `${API_BASE_URL}/api/scrap-entry`;

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

export const addScrapEntry = async (payload) => {
  const res = await fetch(`${BASE}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add scrap entry');
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
    throw new Error(err.message || 'Failed to update scrap entry');
  }
  return res.json();
};

export const deleteScrapEntry = async (id, reason, actionBy) => {
  const params = new URLSearchParams({ reason, actionBy });
  const res = await fetch(`${BASE}/${id}?${params}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete scrap entry');
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
