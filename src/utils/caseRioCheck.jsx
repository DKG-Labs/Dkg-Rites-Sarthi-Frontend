import React from 'react';

/*
 * An IE may act only on calls of their own RIO. The IBS case number starts with the RIO letter
 * (E25100017 → ERIO), so ERIO → case must start with E.
 * Returns null when allowed (or nothing to compare: no case number yet / no RIO stored for the user),
 * otherwise { ieRio, caseNo, caseRio } for the message. A comma list of case numbers is allowed if any matches.
 */
const RIO_NAMES = { N: 'NRIO', E: 'ERIO', W: 'WRIO', S: 'SRIO', C: 'CRIO' };

export const getCaseRioMismatch = (call) => {
  let ieRio = '';
  try { ieRio = (localStorage.getItem('rio') || '').trim().toUpperCase(); } catch (e) { ieRio = ''; }
  const raw = String(call?.caseNo || call?.ibsCaseNo || call?.case_no || call?.ibs_case_no || '').trim().toUpperCase();
  if (!ieRio || !raw || raw === '-' || raw === 'N/A') return null;
  const ieLetter = ieRio.charAt(0);
  const cases = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (cases.some((c) => c.charAt(0) === ieLetter || !/[A-Z]/.test(c.charAt(0)))) return null;
  const caseLetter = cases[0].charAt(0);
  return { ieRio, caseNo: cases[0], caseRio: RIO_NAMES[caseLetter] || `${caseLetter} region` };
};

/** Disabled action button + short message, shown instead of the normal action button. */
export const CaseRioLockedAction = ({ mismatch, label = 'VIEW ACTIONS' }) => {
  const why = `Case No. ${mismatch.caseNo} belongs to ${mismatch.caseRio}, but you are mapped to ${mismatch.ieRio}. Ask the Call Desk / CM to correct the case number or reassign this call.`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', maxWidth: '200px', marginLeft: 'auto' }}>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={why}
        onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}
        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#e2e8f0', color: '#94a3b8', fontSize: '11px', fontWeight: 700, cursor: 'not-allowed', whiteSpace: 'nowrap' }}
      >
        🔒 {label}
      </button>
      <span title={why} style={{ fontSize: '11px', lineHeight: 1.3, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 6px', textAlign: 'right' }}>
        Case No. is of {mismatch.caseRio}; you are {mismatch.ieRio}. Actions disabled.
      </span>
    </div>
  );
};
