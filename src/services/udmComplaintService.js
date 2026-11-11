import { API_BASE_URL, getAuthHeaders, handleResponse } from './apiConfig';

/** Backend wraps payloads as { responseStatus, responseData }. */
const unwrap = (res) => (res && Object.prototype.hasOwnProperty.call(res, 'responseData') ? res.responseData : res);

const BASE = `${API_BASE_URL}/api/udm-complaints`;

/**
 * Role-scoped, server-paginated complaint list.
 * view: 'cc' | 'cm' | 'sbu' | 'rb' | 'board' (backend checks the user holds that role)
 * scope: 'mine' | 'all'; tab: 'pending' | 'closed'; page: 0-based.
 * Returns { content, page, size, totalElements, totalPages, pendingCount, closedCount, mineCount, allCount }.
 */
export const getUdmComplaintList = ({ view = 'board', scope = 'all', tab = 'pending', page = 0, size = 10, q = '' } = {}) => {
    const params = new URLSearchParams({ view, scope, tab, page: String(page), size: String(size) });
    if (q) params.set('q', q);
    return fetch(`${BASE}/list?${params.toString()}`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);
};

/** RIOs that have at least one Controlling Manager. */
export const getComplaintRios = () =>
    fetch(`${BASE}/rios`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);

/** Controlling Managers of a RIO: [{ userId, name, employeeCode }]. */
export const getComplaintCmsByRio = (rio) =>
    fetch(`${BASE}/cms?rio=${encodeURIComponent(rio)}`, { headers: getAuthHeaders() })
        .then(handleResponse).then(unwrap);

/** Complaint Cell → send to Controlling Manager (transaction CC_SEND_TO_CM). */
export const sendComplaintToCm = (rejectionId, { rio, cmUserId, remarks }) =>
    fetch(`${BASE}/${rejectionId}/send-to-cm`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rio, cmUserId, remarks }),
    }).then(handleResponse).then(unwrap);

/** Complaint Cell → close (transaction CC_CLOSE_COMPLAINT). */
export const closeComplaint = (rejectionId, remarks) =>
    fetch(`${BASE}/${rejectionId}/close`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
    }).then(handleResponse).then(unwrap);

/** Timeline of a complaint. */
export const getComplaintHistory = (rejectionId) =>
    fetch(`${BASE}/${rejectionId}/history`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);

/* ─── Phase 2: Controlling Manager stages ─────────────────────────── */

/** Headers for multipart: let the browser set the multipart boundary. */
const multipartHeaders = () => {
    const h = getAuthHeaders();
    delete h['Content-Type'];
    return h;
};

/** Sends { data (JSON part), file (optional PDF) } as multipart/form-data. */
const postMultipart = (url, data, file) => {
    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (file) fd.append('file', file);
    return fetch(url, { method: 'POST', headers: multipartHeaders(), body: fd }).then(handleResponse).then(unwrap);
};

/** Status, canAct, nextStage, 90-day flag and dropdown values for the CM forms. */
export const getCmContext = (rejectionId) =>
    fetch(`${BASE}/${rejectionId}/cm-context`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);

/** JI team options: [{ userId, name, employeeCode, region, type: 'CM'|'IE' }] — CMs of the RIO + all IEs (no Process IE). */
export const getJiTeamOptions = (rejectionId) =>
    fetch(`${BASE}/${rejectionId}/cm/ji-team-options`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);

/** CM Decision: { path: 'JI'|'AUDIT', jiDate, jiTeamUserIds, jiTeamOthers, flagFailed90, flagQtyOver5, flagCritical, remarks }. */
export const submitCmDecision = (rejectionId, payload) =>
    fetch(`${BASE}/${rejectionId}/cm/decision`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    }).then(handleResponse).then(unwrap);

/** Complete JI — JI Report PDF required. */
export const submitCmCompleteJi = (rejectionId, payload, file) =>
    postMultipart(`${BASE}/${rejectionId}/cm/complete-ji`, payload, file);

/** Complete Audit — Audit Report PDF required. */
export const submitCmCompleteAudit = (rejectionId, payload, file) =>
    postMultipart(`${BASE}/${rejectionId}/cm/complete-audit`, payload, file);

/** RCA — evidence PDF optional. */
export const submitCmRca = (rejectionId, payload, file) =>
    postMultipart(`${BASE}/${rejectionId}/cm/rca`, payload, file);

/** CAPA — evidence PDF optional; moves the complaint to SBU Head. */
export const submitCmCapa = (rejectionId, payload, file) =>
    postMultipart(`${BASE}/${rejectionId}/cm/capa`, payload, file);

/* ─── Phase 3a: SBU Head review ───────────────────────────────────── */

/** { complaintStatus, canAct, currentRound, returnedRemarks } for the logged-in SBU Head. */
export const getSbuContext = (rejectionId) =>
    fetch(`${BASE}/${rejectionId}/sbu-context`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);

/** SBU Head review: { decision: 'FORWARD'|'RETURN', remarks } (remarks mandatory for RETURN). */
export const submitSbuReview = (rejectionId, { decision, remarks }) =>
    fetch(`${BASE}/${rejectionId}/sbu/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision, remarks }),
    }).then(handleResponse).then(unwrap);

/* ─── Phase 3b: Railway Board review ──────────────────────────────── */

/** { complaintStatus, canAct, currentRound } for the logged-in Railway Board user. */
export const getRbContext = (rejectionId) =>
    fetch(`${BASE}/${rejectionId}/rb-context`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);

/** Railway Board review: { decision: 'APPROVE'|'RETURN', remarks } (APPROVE closes; remarks mandatory for RETURN). */
export const submitRbReview = (rejectionId, { decision, remarks }) =>
    fetch(`${BASE}/${rejectionId}/rb/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ decision, remarks }),
    }).then(handleResponse).then(unwrap);

/** Submitted CM stage details. */
export const getComplaintStages = (rejectionId) =>
    fetch(`${BASE}/${rejectionId}/stages`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);

/** Documents of a complaint: [{ id, stage, docType, fileName, sizeBytes, uploadedAt }]. */
export const getComplaintDocuments = (rejectionId) =>
    fetch(`${BASE}/${rejectionId}/documents`, { headers: getAuthHeaders() }).then(handleResponse).then(unwrap);

/**
 * Merged PDF (original rejection PDF + timeline report + uploaded documents in workflow order).
 * Returns { blob, fileName }.
 */
export const downloadMergedComplaintPdf = async (rejectionId) => {
    const res = await fetch(`${BASE}/${rejectionId}/merged-pdf`, { headers: multipartHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.errorMessage || err?.responseStatus?.message || `HTTP ${res.status}`);
    }
    const cd = res.headers.get('Content-Disposition') || '';
    const m = /filename="?([^";]+)"?/i.exec(cd);
    return { blob: await res.blob(), fileName: m ? m[1] : `UDM_Complaint_${rejectionId}.pdf` };
};

/** Downloads a document as a Blob (sent with the auth header; container stays private). */
export const downloadComplaintDocument = async (documentId) => {
    const res = await fetch(`${BASE}/documents/${documentId}/download`, { headers: multipartHeaders() });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.errorMessage || `HTTP ${res.status}`);
    }
    return res.blob();
};
