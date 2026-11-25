import React from 'react';

/*
 * An IE may act only on calls of their own RIO. The IBS case number starts with the RIO letter
 * (E25100017 → ERIO), so ERIO → case must start with E.
 * Returns null when allowed (or nothing to compare: no case number yet / no RIO stored for the user),
 * otherwise { ieRio, caseNo, caseRio } for the message. A comma list of case numbers is allowed if any matches.
 */
const RIO_NAMES = { N: 'NRIO', E: 'ERIO', W: 'WRIO', S: 'SRIO', C: 'CRIO' };

export const normalizeRioLetter = (rioStr) => {
  if (!rioStr) return '';
  const r = String(rioStr).trim().toUpperCase();
  if (!r) return '';
  if (r === 'ER' || r === 'ERIO' || r.includes('EAST') || r.includes('KOLKATA')) return 'E';
  if (r === 'WR' || r === 'WRIO' || r.includes('WEST') || r.includes('MUMBAI')) return 'W';
  if (r === 'NR' || r === 'NRIO' || r === 'NIRIO' || r.includes('NORTH') || r.includes('DELHI')) return 'N';
  if (r === 'SR' || r === 'SRIO' || r.includes('SOUTH') || r.includes('CHENNAI')) return 'S';
  if (r === 'CR' || r === 'CRIO' || r.includes('CENT') || r.includes('BHILAI') || r.includes('RAIPUR')) return 'C';
  const ch = r.charAt(0);
  return /[A-Z]/.test(ch) ? ch : '';
};

export const getStoredIeRio = () => {
  try {
    const curUserId = String(localStorage.getItem('userId') || '').trim();
    const rioUserId = String(localStorage.getItem('rioUserId') || '').trim();
    if (curUserId && rioUserId && curUserId !== rioUserId) {
      return '';
    }
    return (
      localStorage.getItem('rio') ||
      sessionStorage.getItem('rio') ||
      localStorage.getItem('region') ||
      sessionStorage.getItem('region') ||
      ''
    ).trim().toUpperCase();
  } catch (e) {
    return '';
  }
};

let pendingProfileRioPromise = null;

/**
 * Ensures `localStorage.rio` is populated for the active logged-in IE by querying the user profile endpoint if missing or stale.
 */
export const ensureIeRioStored = async (profileUrl, headers = {}) => {
  const existing = getStoredIeRio();
  const curUserId = (() => {
    try { return String(localStorage.getItem('userId') || '').trim(); } catch (e) { return ''; }
  })();
  const rioUserId = (() => {
    try { return String(localStorage.getItem('rioUserId') || '').trim(); } catch (e) { return ''; }
  })();
  if (existing && (!curUserId || rioUserId === curUserId)) return existing;
  const token = (() => {
    try { return localStorage.getItem('authToken') || localStorage.getItem('token') || ''; } catch (e) { return ''; }
  })();
  if (!token || !profileUrl) return '';
  if (pendingProfileRioPromise) return pendingProfileRioPromise;

  pendingProfileRioPromise = (async () => {
    try {
      const resp = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          ...headers,
        },
      });
      if (!resp.ok) return '';
      const json = await resp.json();
      const region = json?.responseData?.region || json?.responseData?.rio || json?.region || json?.rio || '';
      const clean = String(region).trim();
      if (clean) {
        try {
          localStorage.setItem('rio', clean);
          if (curUserId) localStorage.setItem('rioUserId', curUserId);
        } catch (e) { /* ignore */ }
      }
      return clean.toUpperCase();
    } catch (e) {
      return '';
    } finally {
      pendingProfileRioPromise = null;
    }
  })();

  return pendingProfileRioPromise;
};

export const getCaseRioMismatch = (call, overrideCaseNo = null) => {
  const ieRio = getStoredIeRio();
  const ieLetter = normalizeRioLetter(ieRio);
  const raw = String(
    (overrideCaseNo && overrideCaseNo !== '-' && overrideCaseNo !== 'N/A' ? overrideCaseNo : '') ||
    call?.caseNo ||
    call?.ibsCaseNo ||
    call?.case_no ||
    call?.ibs_case_no ||
    call?.ibsCaseNumber ||
    call?.poData?.ibsCaseNo ||
    call?.poHeader?.caseNo ||
    ''
  ).trim().toUpperCase();
  if (!ieLetter || !raw || raw === '-' || raw === 'N/A') return null;

  const cases = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== '-' && s !== 'N/A');
  if (cases.length === 0) return null;

  if (cases.some((c) => c.charAt(0) === ieLetter || !/[A-Z]/.test(c.charAt(0)))) return null;
  const caseLetter = cases[0].charAt(0);
  const ieDisplay = RIO_NAMES[ieLetter] || ieRio;
  return {
    ieRio: ieDisplay,
    caseNo: cases[0],
    caseRio: RIO_NAMES[caseLetter] || `${caseLetter} region`,
  };
};

export const formatCaseRioError = (mismatch) =>
  `Case No. ${mismatch.caseNo} belongs to ${mismatch.caseRio}, but you are mapped to ${mismatch.ieRio}. Cross-RIO inspection is not allowed even after reassignment. Ask the Call Desk / CM to correct the case number or reassign this call.`;

/** Disabled action button + short message, shown instead of the normal action button. */
export const CaseRioLockedAction = ({ mismatch, label = 'VIEW ACTIONS', align = 'right' }) => {
  const why = formatCaseRioError(mismatch);
  const isLeft = align === 'left';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        gap: '4px',
        maxWidth: '210px',
        marginLeft: isLeft ? 0 : 'auto',
      }}
    >
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={why}
        onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          background: '#e2e8f0',
          color: '#94a3b8',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'not-allowed',
          whiteSpace: 'nowrap',
        }}
      >
        🔒 {label}
      </button>
      <span
        title={why}
        style={{
          fontSize: '11px',
          lineHeight: 1.3,
          color: '#b45309',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '6px',
          padding: '3px 6px',
          textAlign: isLeft ? 'left' : 'right',
        }}
      >
        Case No. is of {mismatch.caseRio}; you are {mismatch.ieRio}. Actions disabled.
      </span>
    </div>
  );
};

/** Prominent authorization banner for detail modals and inspection dashboards. */
export const CaseRioBanner = ({ mismatch }) => {
  if (!mismatch) return null;
  return (
    <div
      role="alert"
      style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderLeft: '4px solid #dc2626',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
        color: '#991b1b',
        fontSize: '13px',
        lineHeight: 1.45,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1.2 }}>🔒</span>
      <div>
        <strong style={{ display: 'block', marginBottom: '2px', color: '#7f1d1d' }}>
          Cross-RIO Inspection Blocked ({mismatch.caseRio} Case vs {mismatch.ieRio} Profile)
        </strong>
        <span>{formatCaseRioError(mismatch)}</span>
      </div>
    </div>
  );
};
