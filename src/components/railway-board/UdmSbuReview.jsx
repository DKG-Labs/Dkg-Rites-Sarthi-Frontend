import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { getSbuContext, submitSbuReview, getComplaintStages } from '../../services/udmComplaintService';
import './UdmComplaintActions.css';
import './UdmCmStageForms.css';

/* SBU Head review (SRS §5 stage 6): Forward to Railway Board, or Return to CM for rework. */

const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
};
const yn = (v) => (v === 'Y' ? 'Yes' : v === 'N' ? 'No' : '—');

/* ─── Button in the View footer (only when the SBU Head can act now) ─ */
export function SbuReviewButton({ r, refreshKey, onDone }) {
    const [ctx, setCtx] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let alive = true;
        setCtx(null);
        getSbuContext(r.id).then(d => { if (alive) setCtx(d); }).catch(() => { if (alive) setCtx({ canAct: false }); });
        return () => { alive = false; };
    }, [r.id, r.complaintStatus, refreshKey]);

    if (!ctx) return <span className="ucm-act-loading"><span className="ucx-spinner" /> Checking actions…</span>;
    if (!ctx.canAct) return null;
    return (
        <>
            <button type="button" className="ucx-btn ucx-btn-primary" onClick={() => setOpen(true)}>
                <i className="fa-solid fa-user-shield" /> Review &amp; Decide
            </button>
            {open && createPortal(
                <SbuReviewModal r={r} ctx={ctx} onCancel={() => setOpen(false)}
                    onDone={(res, msg) => { setOpen(false); onDone(res, msg); }} />,
                document.body
            )}
        </>
    );
}
SbuReviewButton.propTypes = { r: PropTypes.object.isRequired, refreshKey: PropTypes.number, onDone: PropTypes.func.isRequired };

/* ─── Review modal ─────────────────────────────────────────────────── */
function SbuReviewModal({ r, ctx, onCancel, onDone }) {
    const [stages, setStages] = useState(null);
    const [decision, setDecision] = useState('');
    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        let alive = true;
        getComplaintStages(r.id)
            .then(d => { if (alive) setStages(Array.isArray(d) ? d : []); })
            .catch(() => { if (alive) setStages([]); });
        return () => { alive = false; };
    }, [r.id]);

    const isReturn = decision === 'RETURN';
    const missing = !decision || (isReturn && !remarks.trim());

    const submit = async () => {
        if (missing || saving) return;
        setSaving(true); setErr('');
        try {
            const res = await submitSbuReview(r.id, { decision, remarks: remarks.trim() });
            onDone(res, isReturn ? 'Returned to CM for rework.' : 'Forwarded to Railway Board.');
        } catch (e) {
            setErr(e.message || 'Could not save. Please try again.');
            setSaving(false);
        }
    };

    // Latest submission of each stage (rework rounds replace RCA/CAPA)
    const latest = (name) => (stages || []).filter(s => s.stage === name).slice(-1)[0];
    const decisionStage = latest('DECISION');
    const jiStage = latest('JI_COMPLETE');
    const auditStage = latest('AUDIT_COMPLETE');
    const rca = latest('RCA');
    const capa = latest('CAPA');

    return (
        <div className="ucx-overlay ucm-overlay" onClick={e => e.target === e.currentTarget && !saving && onCancel()}>
            <div className="ucx-dialog ucm-dialog" role="dialog" aria-modal="true" aria-labelledby="usb-title">
                <div className="ucm-head">
                    <div className="ucm-head-top">
                        <span className="ucm-head-icon usb-icon"><i className="fa-solid fa-user-shield" /></span>
                        <div className="ucm-head-text">
                            <h4 id="usb-title">SBU Head Review{ctx.currentRound > 1 ? ` · Round ${ctx.currentRound}` : ''}</h4>
                            <p title={r.vendorName}>
                                <span className="ucm-head-no">{r.rejectionNumber}</span>
                                {r.vendorName && <span className="ucm-head-vendor">{r.vendorName}</span>}
                            </p>
                        </div>
                        <button type="button" className="ucx-x" onClick={onCancel} disabled={saving} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
                    </div>
                </div>

                <div className="ucx-dialog-body ucm-body">
                    {ctx.returnedRemarks && (
                        <div className="usb-returned">
                            <i className="fa-solid fa-rotate-left" />
                            <div><strong>Returned by Railway Board</strong><span>{ctx.returnedRemarks}</span></div>
                        </div>
                    )}

                    {/* CM work summary */}
                    <div className="ucm-card">
                        <div className="ucm-card-head">
                            <span className="ucm-card-icon"><i className="fa-solid fa-clipboard-list" /></span>
                            <div className="ucm-card-title">
                                <strong>Controlling Manager's submission</strong>
                                <small>{r.assignedCmName || 'CM'}{r.assignedRio ? ` · RIO ${r.assignedRio}` : ''}</small>
                            </div>
                        </div>
                        {stages === null ? (
                            <div className="ucx-tl"><span className="ucx-skel" style={{ width: '70%' }} /><span className="ucx-skel" style={{ width: '55%' }} /><span className="ucx-skel" style={{ width: '62%' }} /></div>
                        ) : (
                            <dl className="usb-sum">
                                <SumRow label="Path" value={decisionStage ? (decisionStage.path === 'JI' ? 'Joint Inspection' : 'Audit of Record / Firm') : '—'} />
                                {decisionStage?.path === 'JI' && <SumRow label="JI team" value={decisionStage.jiTeam} />}
                                {jiStage && <SumRow label="JI" value={`${fmtDate(jiStage.stageDate)} · ${jiStage.jiOutcome || '—'}`} />}
                                {auditStage && <SumRow label="Audit" value={`${auditStage.auditType || '—'} · ${fmtDate(auditStage.stageDate)}`} />}
                                {auditStage?.findings && <SumRow label="Findings" value={auditStage.findings} />}
                                <SumRow label="Attributable to" value={(jiStage || auditStage)?.attributableTo} />
                                <SumRow label="Root cause" value={rca?.rootCause} />
                                <SumRow label="Corrective" value={capa?.correctiveActions} chips />
                                <SumRow label="Preventive" value={capa?.preventiveActions} chips />
                                <SumRow label="Vendor compliance" value={capa ? yn(capa.vendorCompliance) : null} />
                                <SumRow label="CAPA implemented" value={capa ? yn(capa.capaImplemented) : null} />
                            </dl>
                        )}
                        <div className="usb-docs-hint"><i className="fa-solid fa-folder-open" /> Reports &amp; evidence are in the <strong>Documents</strong> tab.</div>
                    </div>

                    {/* Decision */}
                    <div className="ucx-field">
                        <label>Recommendation <span className="ucx-req">*</span></label>
                        <div className="ucm-seg" role="radiogroup">
                            <button type="button" role="radio" aria-checked={decision === 'FORWARD'}
                                className={`ucm-seg-btn ${decision === 'FORWARD' ? 'on' : ''}`} onClick={() => setDecision('FORWARD')}>
                                <i className="fa-solid fa-landmark" /> Forward to Railway Board
                            </button>
                            <button type="button" role="radio" aria-checked={decision === 'RETURN'}
                                className={`ucm-seg-btn usb-return ${decision === 'RETURN' ? 'on' : ''}`} onClick={() => setDecision('RETURN')}>
                                <i className="fa-solid fa-rotate-left" /> Return to CM for Rework
                            </button>
                        </div>
                    </div>

                    <div className="ucx-field">
                        <label>Remarks {isReturn ? <span className="ucx-req">*</span> : <span className="ucx-opt">(optional)</span>}</label>
                        <textarea rows={3} maxLength={500} value={remarks} onChange={e => setRemarks(e.target.value)}
                            placeholder={isReturn ? 'What should the CM rework in RCA / CAPA?' : 'Add a note for the Railway Board (optional)…'} />
                        <span className="ucx-count">{remarks.length}/500</span>
                    </div>

                    {isReturn && (
                        <div className="ucm-note"><i className="fa-solid fa-circle-info" /> The CM will resubmit RCA and CAPA as round {(ctx.currentRound || 1) + 1}.</div>
                    )}
                    {err && <div className="ucx-err"><i className="fa-solid fa-circle-exclamation" /> {err}</div>}
                </div>

                <div className="ucx-dialog-foot ucm-foot">
                    <button type="button" className="ucx-btn ucx-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
                    <button type="button" className={`ucx-btn ${isReturn ? 'ucx-btn-danger' : 'ucx-btn-primary'}`} onClick={submit} disabled={missing || saving}
                        title={missing ? (isReturn ? 'Remarks are required to return' : 'Choose a recommendation') : ''}>
                        {saving ? <><span className="ucx-spinner ucm-spin-white" /> Saving…</>
                            : isReturn ? <><i className="fa-solid fa-rotate-left" /> Return to CM</>
                                : <><i className="fa-solid fa-paper-plane" /> {decision === 'FORWARD' ? 'Forward to Railway Board' : 'Submit'}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
SbuReviewModal.propTypes = { r: PropTypes.object.isRequired, ctx: PropTypes.object.isRequired, onCancel: PropTypes.func.isRequired, onDone: PropTypes.func.isRequired };

function SumRow({ label, value, chips }) {
    const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
    return (
        <div className="usb-row">
            <dt>{label}</dt>
            <dd>
                {empty ? <span className="usb-na">—</span>
                    : chips && Array.isArray(value) ? <span className="usb-chips">{value.map(v => <span key={v} className="usb-chip">{v}</span>)}</span>
                        : value}
            </dd>
        </div>
    );
}
SumRow.propTypes = { label: PropTypes.string, value: PropTypes.any, chips: PropTypes.bool };
