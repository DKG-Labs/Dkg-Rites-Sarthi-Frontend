import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import {
    getSbuContext, submitSbuReview, getRbContext, submitRbReview, getComplaintStages,
} from '../../services/udmComplaintService';
import './UdmComplaintActions.css';
import './UdmCmStageForms.css';

/*
 * Reviewer step for UDM complaints (one component, two roles):
 *  - SBU Head (SRS stage 6):      Forward to Railway Board  |  Return to CM for rework
 *  - Railway Board (SRS stage 7): Approve & Close           |  Return to SBU Head
 */

const REVIEWERS = {
    SBU: {
        getCtx: getSbuContext,
        submit: submitSbuReview,
        title: 'SBU Head Review',
        icon: 'fa-user-shield',
        button: 'Review & Decide',
        primary: { value: 'FORWARD', label: 'Forward to Railway Board', icon: 'fa-landmark', btn: 'Forward to Railway Board', done: 'Forwarded to Railway Board.' },
        ret: {
            label: 'Return to CM for Rework', btn: 'Return to CM', done: 'Returned to CM for rework.',
            placeholder: 'What should the CM rework in RCA / CAPA?',
            note: (round) => `The CM will resubmit RCA and CAPA as round ${(round || 1) + 1}.`,
        },
        primaryPlaceholder: 'Add a note for the Railway Board (optional)…',
        returnedBanner: 'Returned by Railway Board',
    },
    RB: {
        getCtx: getRbContext,
        submit: submitRbReview,
        title: 'Railway Board Review',
        icon: 'fa-landmark',
        button: 'Review & Decide',
        primary: { value: 'APPROVE', label: 'Approve & Close', icon: 'fa-circle-check', btn: 'Approve & Close', done: 'Complaint approved and closed.' },
        ret: {
            label: 'Return to SBU Head', btn: 'Return to SBU Head', done: 'Returned to SBU Head.',
            placeholder: 'Why is it being returned to the SBU Head?',
            note: () => 'The SBU Head will re-forward it or send it to the CM for rework.',
        },
        primaryPlaceholder: 'Closure remarks (optional)…',
        returnedBanner: null,
    },
};

const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
};
const yn = (v) => (v === 'Y' ? 'Yes' : v === 'N' ? 'No' : '—');

/* ─── Button in the View footer (only when the user can act now) ──── */
export function ReviewButton({ reviewer, r, refreshKey, onDone }) {
    const cfg = REVIEWERS[reviewer];
    const [ctx, setCtx] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let alive = true;
        setCtx(null);
        cfg.getCtx(r.id).then(d => { if (alive) setCtx(d); }).catch(() => { if (alive) setCtx({ canAct: false }); });
        return () => { alive = false; };
    }, [cfg, r.id, r.complaintStatus, refreshKey]);

    if (!ctx) return <span className="ucm-act-loading"><span className="ucx-spinner" /> Checking actions…</span>;
    if (!ctx.canAct) return null;
    return (
        <>
            <button type="button" className="ucx-btn ucx-btn-primary" onClick={() => setOpen(true)}>
                <i className={`fa-solid ${cfg.icon}`} /> {cfg.button}
            </button>
            {open && createPortal(
                <ReviewModal cfg={cfg} r={r} ctx={ctx} onCancel={() => setOpen(false)}
                    onDone={(res, msg) => { setOpen(false); onDone(res, msg); }} />,
                document.body
            )}
        </>
    );
}
ReviewButton.propTypes = {
    reviewer: PropTypes.oneOf(['SBU', 'RB']).isRequired,
    r: PropTypes.object.isRequired, refreshKey: PropTypes.number, onDone: PropTypes.func.isRequired,
};

export const SbuReviewButton = (props) => <ReviewButton reviewer="SBU" {...props} />;
export const RbReviewButton = (props) => <ReviewButton reviewer="RB" {...props} />;

/* ─── Review modal ─────────────────────────────────────────────────── */
function ReviewModal({ cfg, r, ctx, onCancel, onDone }) {
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
            const res = await cfg.submit(r.id, { decision, remarks: remarks.trim() });
            onDone(res, isReturn ? cfg.ret.done : cfg.primary.done);
        } catch (e) {
            setErr(e.message || 'Could not save. Please try again.');
            setSaving(false);
        }
    };

    // Latest submission of each stage (rework rounds replace earlier RCA / CAPA)
    const latest = (name) => (stages || []).filter(s => s.stage === name).slice(-1)[0];
    const decisionStage = latest('DECISION');
    const jiStage = latest('JI_COMPLETE');
    const auditStage = latest('AUDIT_COMPLETE');
    const rca = latest('RCA');
    const capa = latest('CAPA');
    const sbu = latest('SBU_REVIEW');

    return (
        <div className="ucx-overlay ucm-overlay" onClick={e => e.target === e.currentTarget && !saving && onCancel()}>
            <div className="ucx-dialog ucm-dialog" role="dialog" aria-modal="true" aria-labelledby="urv-title">
                <div className="ucm-head">
                    <div className="ucm-head-top">
                        <span className="ucm-head-icon usb-icon"><i className={`fa-solid ${cfg.icon}`} /></span>
                        <div className="ucm-head-text">
                            <h4 id="urv-title">{cfg.title}{ctx.currentRound > 1 ? ` · Round ${ctx.currentRound}` : ''}</h4>
                            <p title={r.vendorName}>
                                <span className="ucm-head-no">{r.rejectionNumber}</span>
                                {r.vendorName && <span className="ucm-head-vendor">{r.vendorName}</span>}
                            </p>
                        </div>
                        <button type="button" className="ucx-x" onClick={onCancel} disabled={saving} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
                    </div>
                </div>

                <div className="ucx-dialog-body ucm-body">
                    {cfg.returnedBanner && ctx.returnedRemarks && (
                        <div className="usb-returned">
                            <i className="fa-solid fa-rotate-left" />
                            <div><strong>{cfg.returnedBanner}</strong><span>{ctx.returnedRemarks}</span></div>
                        </div>
                    )}

                    {/* Submission summary */}
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
                                {cfg === REVIEWERS.RB && <SumRow label="SBU Head remarks" value={sbu?.remarks} />}
                            </dl>
                        )}
                        <div className="usb-docs-hint"><i className="fa-solid fa-folder-open" /> Reports &amp; evidence are in the <strong>Documents</strong> tab.</div>
                    </div>

                    {/* Decision */}
                    <div className="ucx-field">
                        <label>Decision <span className="ucx-req">*</span></label>
                        <div className="ucm-seg" role="radiogroup">
                            <button type="button" role="radio" aria-checked={decision === cfg.primary.value}
                                className={`ucm-seg-btn ${decision === cfg.primary.value ? 'on' : ''}`} onClick={() => setDecision(cfg.primary.value)}>
                                <i className={`fa-solid ${cfg.primary.icon}`} /> {cfg.primary.label}
                            </button>
                            <button type="button" role="radio" aria-checked={isReturn}
                                className={`ucm-seg-btn usb-return ${isReturn ? 'on' : ''}`} onClick={() => setDecision('RETURN')}>
                                <i className="fa-solid fa-rotate-left" /> {cfg.ret.label}
                            </button>
                        </div>
                    </div>

                    <div className="ucx-field">
                        <label>Remarks {isReturn ? <span className="ucx-req">*</span> : <span className="ucx-opt">(optional)</span>}</label>
                        <textarea rows={3} maxLength={500} value={remarks} onChange={e => setRemarks(e.target.value)}
                            placeholder={isReturn ? cfg.ret.placeholder : cfg.primaryPlaceholder} />
                        <span className="ucx-count">{remarks.length}/500</span>
                    </div>

                    {isReturn && <div className="ucm-note"><i className="fa-solid fa-circle-info" /> {cfg.ret.note(ctx.currentRound)}</div>}
                    {err && <div className="ucx-err"><i className="fa-solid fa-circle-exclamation" /> {err}</div>}
                </div>

                <div className="ucx-dialog-foot ucm-foot">
                    <button type="button" className="ucx-btn ucx-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
                    <button type="button" className={`ucx-btn ${isReturn ? 'ucx-btn-danger' : 'ucx-btn-primary'}`} onClick={submit} disabled={missing || saving}
                        title={missing ? (isReturn ? 'Remarks are required to return' : 'Choose a decision') : ''}>
                        {saving ? <><span className="ucx-spinner ucm-spin-white" /> Saving…</>
                            : isReturn ? <><i className="fa-solid fa-rotate-left" /> {cfg.ret.btn}</>
                                : <><i className={`fa-solid ${decision ? cfg.primary.icon : 'fa-check'}`} /> {decision ? cfg.primary.btn : 'Submit'}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
ReviewModal.propTypes = {
    cfg: PropTypes.object.isRequired, r: PropTypes.object.isRequired, ctx: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired, onDone: PropTypes.func.isRequired,
};

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
