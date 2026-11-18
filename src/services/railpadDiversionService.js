import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// Rail Pad Material Diversion — CM / SBU Head side. Acting user comes from the login token.
const BASE = `${API_BASE_URL}/api/railpad/diversion`;

const call = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...(options.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json?.responseStatus && json.responseStatus.statusCode && json.responseStatus.statusCode !== 0)) {
    throw new Error(json?.responseStatus?.message || json?.message || 'Request failed');
  }
  return json?.responseData;
};

const railpadDiversionService = {
  getCmPending: () => call('/cm/pending-requests'),
  getCmActioned: () => call('/cm/approved-requests'),
  getSbuPending: () => call('/sbu/pending-requests'),
  getSbuActioned: () => call('/sbu/approved-requests'),
  getHistory: (id) => call(`/history/${id}`),
  cmApprove: (requestId, assignedIeUserId, remarks) => call('/cm/approve', { method: 'POST', body: JSON.stringify({ requestId, assignedIeUserId, remarks }) }),
  cmSendToSbu: (requestId, remarks) => call('/cm/send-to-sbu', { method: 'POST', body: JSON.stringify({ requestId, remarks }) }),
  cmReturn: (requestId, remarks) => call('/cm/return', { method: 'POST', body: JSON.stringify({ requestId, remarks }) }),
  sbuApprove: (requestId, assignedIeUserId, remarks) => call('/sbu/approve', { method: 'POST', body: JSON.stringify({ requestId, assignedIeUserId, remarks }) }),
  sbuReturn: (requestId, remarks) => call('/sbu/return', { method: 'POST', body: JSON.stringify({ requestId, remarks }) }),
  /** Railway permission letter as a blob URL (private storage, streamed with the token). */
  openLetter: async (id) => {
    const res = await fetch(`${BASE}/doc/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Could not open the railway permission letter');
    return URL.createObjectURL(await res.blob());
  },
  /** Rail Pad IEs who can issue the diverted IC. */
  getRailIes: async () => {
    const roles = ['Rail Main IE', 'Rail Process IE'];
    const lists = await Promise.all(roles.map((r) =>
      fetch(`${API_BASE_URL}/api/auth/api/users/by-role?roleName=${encodeURIComponent(r)}`, { headers: getAuthHeaders() })
        .then((x) => x.json()).then((j) => (j?.responseData || j || []).map((u) => ({ ...u, roleName: r })))
        .catch(() => [])));
    const seen = new Set();
    return lists.flat().filter((u) => { const k = u.userId || u.id; if (!k || seen.has(k)) return false; seen.add(k); return true; });
  },
};

export default railpadDiversionService;
