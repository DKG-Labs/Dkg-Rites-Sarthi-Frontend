import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { SearchableDropdown } from './SharedComponents';
import {
    getCmContext, getJiTeamOptions, submitCmDecision, submitCmCompleteJi, submitCmCompleteAudit, submitCmRca, submitCmCapa,
    getComplaintDocuments, downloadComplaintDocument,
} from '../../services/udmComplaintService';
import './UdmComplaintActions.css';
import './UdmCmStageForms.css';

/* Controlling Manager stage forms (SRS §5, stages 3–5) + Documents list. */

const MAX_PDF_BYTES = 5 * 1024 * 1024;

const STAGE_META = {
    DECISION:       { title: 'CM Decision',               button: 'Take Decision',     icon: 'fa-code-branch' },
    JI_COMPLETE:    { title: 'Complete Joint Inspection', button: 'Complete JI',       icon: 'fa-clipboard-check' },
    AUDIT_COMPLETE: { title: 'Complete Audit',            button: 'Complete Audit',    icon: 'fa-clipboard-check' },
    RCA:            { title: 'Root Cause Analysis',       button: 'Submit RCA',        icon: 'fa-sitemap' },
    CAPA:           { title: 'Corrective & Preventive Action', button: 'Submit CAPA',  icon: 'fa-shield-halved' },
};

/** Progress steps shown at the top of every CM form. */
const steps = (stage, path) => {
    const mid = stage === 'AUDIT_COMPLETE' || path === 'AUDIT' ? 'Audit' : stage === 'JI_COMPLETE' || path === 'JI' ? 'Joint Inspection' : 'JI / Audit';
    const order = ['DECISION', 'MID', 'RCA', 'CAPA'];
    const at = stage === 'JI_COMPLETE' || stage === 'AUDIT_COMPLETE' ? 'MID' : stage;
    const idx = order.indexOf(at);
    return [['Decision'], [mid], ['RCA'], ['CAPA']].map(([label], i) => ({
        label, state: i < idx ? 'done' : i === idx ? 'now' : 'next',
    }));
};

const DOC_LABEL = {
    JI_REPORT: 'JI Report', AUDIT_REPORT: 'Audit Report', RCA_EVIDENCE: 'RCA Evidence', CAPA_EVIDENCE: 'CAPA Evidence',
};

const todayIst = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // yyyy-mm-dd
const toOptions = (list) => (list || []).map(v => ({ label: v, value: v }));
const fmtSize = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/* ─── Action button shown in the View footer for the assigned CM ──── */
export function CmActionButton({ r, refreshKey, onDone }) {
    const [ctx, setCtx] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let alive = true;
        setCtx(null);
        getCmContext(r.id).then(d => { if (alive) setCtx(d); }).catch(() => { if (alive) setCtx({ canAct: false }); });
        return () => { alive = false; };
    }, [r.id, r.complaintStatus, refreshKey]);

    if (!ctx) return <span className="ucm-act-loading"><span className="ucx-spinner" /> Checking actions…</span>;
    if (!ctx.canAct || !STAGE_META[ctx.nextStage]) return null;
    const meta = STAGE_META[ctx.nextStage];
    return (
        <>
            <button type="button" className="ucx-btn ucx-btn-primary" onClick={() => setOpen(true)}>
                <i className={`fa-solid ${meta.icon}`} /> {meta.button}
            </button>
            {/* Portal: the View popup is animated + overflow:hidden, which would trap and clip a fixed overlay */}
            {open && createPortal(
                <CmStageModal r={r} ctx={ctx} onCancel={() => setOpen(false)}
                    onDone={(res, msg) => { setOpen(false); onDone(res, msg); }} />,
                document.body
            )}
        </>
    );
}
CmActionButton.propTypes = { r: PropTypes.object.isRequired, refreshKey: PropTypes.number, onDone: PropTypes.func.isRequired };

/* ─── One modal, form chosen by ctx.nextStage ─────────────────────── */
function CmStageModal({ r, ctx, onCancel, onDone }) {
    const stage = ctx.nextStage;
    const meta = STAGE_META[stage];
    const dd = ctx.dropdowns || {};
    const [f, setF] = useState({
        path: '', jiDate: '', jiTeamUserIds: [], jiTeamOthers: '',
        flagFailed90: ctx.failedWithin90Days === true, flagQtyOver5: false, flagCritical: false,
        actualJiDate: '', jiOutcome: '', attributableTo: '',
        auditType: '', auditDate: '', findings: '',
        rootCause: '', correctiveActions: [], preventiveActions: [], vendorCompliance: '', capaImplemented: '',
        remarks: '',
    });
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const set = (k) => (v) => setF(p => ({ ...p, [k]: v && v.target ? v.target.value : v }));

    const fileRequired = stage === 'JI_COMPLETE' || stage === 'AUDIT_COMPLETE';
    const missing = (() => {
        switch (stage) {
            case 'DECISION': return !f.path || (f.path === 'JI' && (!f.jiDate || !f.jiTeamUserIds.length));
            case 'JI_COMPLETE': return !f.actualJiDate || !f.jiOutcome || !f.attributableTo || !file;
            case 'AUDIT_COMPLETE': return !f.auditType || !f.auditDate || !f.findings.trim() || !f.attributableTo || !file;
            case 'RCA': return !f.rootCause;
            case 'CAPA': return !f.correctiveActions.length || !f.preventiveActions.length || !f.vendorCompliance || !f.capaImplemented;
            default: return true;
        }
    })();

    const submit = async () => {
        if (missing || saving) return;
        setSaving(true); setErr('');
        try {
            let res;
            const remarks = f.remarks.trim();
            if (stage === 'DECISION') {
                res = await submitCmDecision(r.id, {
                    path: f.path, jiDate: f.path === 'JI' ? f.jiDate : null,
                    jiTeamUserIds: f.path === 'JI' ? f.jiTeamUserIds : [],
                    jiTeamOthers: f.path === 'JI' ? f.jiTeamOthers.trim() : null,
                    flagFailed90: f.flagFailed90, flagQtyOver5: f.flagQtyOver5, flagCritical: f.flagCritical, remarks,
                });
            } else if (stage === 'JI_COMPLETE') {
                res = await submitCmCompleteJi(r.id, { actualJiDate: f.actualJiDate, jiOutcome: f.jiOutcome, attributableTo: f.attributableTo, remarks }, file);
            } else if (stage === 'AUDIT_COMPLETE') {
                res = await submitCmCompleteAudit(r.id, { auditType: f.auditType, auditDate: f.auditDate, findings: f.findings.trim(), attributableTo: f.attributableTo, remarks }, file);
            } else if (stage === 'RCA') {
                res = await submitCmRca(r.id, { rootCause: f.rootCause, remarks }, file);
            } else {
                res = await submitCmCapa(r.id, {
                    correctiveActions: f.correctiveActions, preventiveActions: f.preventiveActions,
                    vendorCompliance: f.vendorCompliance, capaImplemented: f.capaImplemented, remarks,
                }, file);
            }
            onDone(res, `${meta.title} saved.`);
        } catch (e) {
            setErr(e.message || 'Could not save. Please try again.');
            setSaving(false);
        }
    };

    return (
        <div className="ucx-overlay ucm-overlay" onClick={e => e.target === e.currentTarget && !saving && onCancel()}>
            <div className="ucx-dialog ucm-dialog" role="dialog" aria-modal="true" aria-labelledby="ucm-form-title">
                <div className="ucm-head">
                    <div className="ucm-head-top">
                        <span className="ucm-head-icon"><i className={`fa-solid ${meta.icon}`} /></span>
                        <div className="ucm-head-text">
                            <h4 id="ucm-form-title">{meta.title}</h4>
                            <p title={r.vendorName}>
                                <span className="ucm-head-no">{r.rejectionNumber}</span>
                                {r.vendorName && <span className="ucm-head-vendor">{r.vendorName}</span>}
                            </p>
                        </div>
                        <button type="button" className="ucx-x" onClick={onCancel} disabled={saving} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
                    </div>
                    <ol className="ucm-steps" aria-label="Progress">
                        {steps(stage, f.path).map((s, i) => (
                            <li key={i} className={`ucm-step is-${s.state}`}>
                                <span className="ucm-step-dot">{s.state === 'done' ? <i className="fa-solid fa-check" /> : i + 1}</span>
                                <span className="ucm-step-label">{s.label}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="ucx-dialog-body ucm-body">
                    {ctx.returnedRemarks && (
                        <div className="ucm-returned">
                            <i className="fa-solid fa-rotate-left" />
                            <div>
                                <strong>Returned by SBU Head · Round {ctx.currentRound || 2}</strong>
                                <span>{ctx.returnedRemarks}</span>
                            </div>
                        </div>
                    )}
                    {stage === 'DECISION' && (
                        <>
                            <div className="ucm-flags">
                                <div className="ucm-flags-title"><i className="fa-solid fa-lightbulb" /> Joint Inspection is recommended if any of these apply</div>
                                <Check label={`Failed within 90 days${ctx.daysToFailure != null ? ` (${ctx.daysToFailure} days)` : ' (dates not available)'}`}
                                    checked={f.flagFailed90} onChange={set('flagFailed90')} auto={ctx.failedWithin90Days === true} />
                                <Check label="Quantity rejected is more than 5% of quantity passed" checked={f.flagQtyOver5} onChange={set('flagQtyOver5')} />
                                <Check label="Critical & needs investigation" checked={f.flagCritical} onChange={set('flagCritical')} />
                            </div>
                            <Field label="Next step" req>
                                <div className="ucm-seg" role="radiogroup">
                                    {[['JI', 'fa-people-group', 'Joint Inspection'], ['AUDIT', 'fa-magnifying-glass', 'Audit of Record / Firm']].map(([v, ic, l]) => (
                                        <button key={v} type="button" role="radio" aria-checked={f.path === v}
                                            className={`ucm-seg-btn ${f.path === v ? 'on' : ''}`} onClick={() => set('path')(v)}>
                                            <i className={`fa-solid ${ic}`} /> {l}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                            {f.path === 'JI' && (
                                <>
                                    <Field label="JI date" req><input type="date" className="ucm-input ucm-input-date" value={f.jiDate} onChange={set('jiDate')} /></Field>
                                    <Field label="JI team" req>
                                        <JiTeamPicker rejectionId={r.id} value={f.jiTeamUserIds} onChange={set('jiTeamUserIds')} />
                                    </Field>
                                    <Field label="Other members" opt>
                                        <input type="text" className="ucm-input" maxLength={300}
                                            placeholder="e.g. Consignee / vendor representatives" value={f.jiTeamOthers} onChange={set('jiTeamOthers')} />
                                    </Field>
                                </>
                            )}
                        </>
                    )}

                    {stage === 'JI_COMPLETE' && (
                        <>
                            <div className="ucm-grid">
                                <Field label="Actual JI date" req><input type="date" className="ucm-input" max={todayIst()} value={f.actualJiDate} onChange={set('actualJiDate')} /></Field>
                                <Field label="JI outcome" req><SearchableDropdown value={f.jiOutcome} onChange={set('jiOutcome')} options={toOptions(dd.JI_OUTCOME)} placeholder="Select outcome" /></Field>
                            </div>
                            <Field label="Attributable to" req><SearchableDropdown value={f.attributableTo} onChange={set('attributableTo')} options={toOptions(dd.ATTRIBUTABLE_TO)} placeholder="Select" /></Field>
                            <PdfPicker label="JI Report" required file={file} onChange={setFile} />
                        </>
                    )}

                    {stage === 'AUDIT_COMPLETE' && (
                        <>
                            <div className="ucm-grid">
                                <Field label="Audit type" req><SearchableDropdown value={f.auditType} onChange={set('auditType')} options={toOptions(dd.AUDIT_TYPE)} placeholder="Select audit type" /></Field>
                                <Field label="Audit date" req><input type="date" className="ucm-input" max={todayIst()} value={f.auditDate} onChange={set('auditDate')} /></Field>
                            </div>
                            <Field label="Findings" req>
                                <textarea rows={3} maxLength={1000} value={f.findings} onChange={set('findings')} placeholder="Key audit findings…" />
                            </Field>
                            <Field label="Attributable to" req><SearchableDropdown value={f.attributableTo} onChange={set('attributableTo')} options={toOptions(dd.ATTRIBUTABLE_TO)} placeholder="Select" /></Field>
                            <PdfPicker label="Audit Report" required file={file} onChange={setFile} />
                        </>
                    )}

                    {stage === 'RCA' && (
                        <>
                            <Field label="Root cause" req><SearchableDropdown value={f.rootCause} onChange={set('rootCause')} options={toOptions(dd.ROOT_CAUSE)} placeholder="Select root cause" /></Field>
                            <PdfPicker label="Evidence" file={file} onChange={setFile} />
                        </>
                    )}

                    {stage === 'CAPA' && (
                        <>
                            <ChipCard icon="fa-screwdriver-wrench" title="Corrective action" options={dd.CORRECTIVE_ACTION}
                                value={f.correctiveActions} onChange={set('correctiveActions')} />
                            <ChipCard icon="fa-shield-halved" title="Preventive action" options={dd.PREVENTIVE_ACTION}
                                value={f.preventiveActions} onChange={set('preventiveActions')} />
                            <div className="ucm-card">
                                <YesNoRow icon="fa-industry" label="Vendor compliance" value={f.vendorCompliance} onChange={set('vendorCompliance')} />
                                <YesNoRow icon="fa-circle-check" label="CAPA implemented" value={f.capaImplemented} onChange={set('capaImplemented')} />
                            </div>
                            <PdfPicker label="Evidence" file={file} onChange={setFile} />
                            <div className="ucm-note"><i className="fa-solid fa-circle-info" /> After CAPA the complaint goes to the SBU Head for review.</div>
                        </>
                    )}

                    <Field label="Remarks" opt>
                        <textarea rows={2} maxLength={500} value={f.remarks} onChange={set('remarks')} placeholder="Add a note (optional)…" />
                    </Field>

                    {err && <div className="ucx-err"><i className="fa-solid fa-circle-exclamation" /> {err}</div>}
                </div>

                <div className="ucx-dialog-foot ucm-foot">
                    <button type="button" className="ucx-btn ucx-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
                    <button type="button" className="ucx-btn ucx-btn-primary" onClick={submit} disabled={missing || saving}
                        title={missing ? (fileRequired && !file ? 'Fill all required fields and attach the report (PDF)' : 'Fill all required fields') : ''}>
                        {saving ? <><span className="ucx-spinner ucm-spin-white" /> Saving…</> : <><i className="fa-solid fa-check" /> Submit</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
CmStageModal.propTypes = { r: PropTypes.object.isRequired, ctx: PropTypes.object.isRequired, onCancel: PropTypes.func.isRequired, onDone: PropTypes.func.isRequired };

/* ─── Small form pieces ─────────────────────────────────────────── */
function Field({ label, req, opt, children }) {
    return (
        <div className="ucx-field">
            <label>{label} {req && <span className="ucx-req">*</span>}{opt && <span className="ucx-opt">(optional)</span>}</label>
            {children}
        </div>
    );
}
Field.propTypes = { label: PropTypes.string, req: PropTypes.bool, opt: PropTypes.bool, children: PropTypes.node };

function Check({ label, checked, onChange, auto }) {
    return (
        <label className={`ucm-check ${checked ? 'on' : ''}`}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="ucm-check-box"><i className="fa-solid fa-check" /></span>
            <span>{label}</span>
            {auto && <span className="ucm-auto">Auto</span>}
        </label>
    );
}
Check.propTypes = { label: PropTypes.string, checked: PropTypes.bool, onChange: PropTypes.func, auto: PropTypes.bool };

/** JI team: searchable multi-select of all CMs + all IEs (ERC / Sleeper / Rail Pad; no Process IE). */
function JiTeamPicker({ rejectionId, value = [], onChange }) {
    const [opts, setOpts] = useState(null);
    const [err, setErr] = useState('');
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL | CM | IE

    useEffect(() => {
        let alive = true;
        getJiTeamOptions(rejectionId)
            .then(d => { if (alive) setOpts(Array.isArray(d) ? d : []); })
            .catch(e => { if (alive) { setOpts([]); setErr(e.message || 'Could not load JI team list.'); } });
        return () => { alive = false; };
    }, [rejectionId]);

    if (opts === null) return <div className="ucx-dd-loading" role="status"><span className="ucx-spinner" /> Loading IEs &amp; Controlling Managers…</div>;
    if (err) return <div className="ucx-err"><i className="fa-solid fa-circle-exclamation" /> {err}</div>;

    const byId = new Map(opts.map(o => [o.userId, o]));
    const selected = value.map(id => byId.get(id)).filter(Boolean);
    const needle = q.trim().toLowerCase();
    const list = opts.filter(o =>
        (filter === 'ALL' || o.type === filter) &&
        (!needle || `${o.name} ${o.employeeCode} ${o.region}`.toLowerCase().includes(needle)));
    const toggle = (id) => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
    const counts = { ALL: opts.length, CM: opts.filter(o => o.type === 'CM').length, IE: opts.filter(o => o.type === 'IE').length };

    return (
        <div className="ucm-team">
            {selected.length > 0 && (
                <div className="ucm-team-sel">
                    {selected.map(o => (
                        <span key={o.userId} className={`ucm-team-tag ${o.type === 'CM' ? 'cm' : ''}`}>
                            {o.name}<em>{o.type}</em>
                            <button type="button" onClick={() => toggle(o.userId)} aria-label={`Remove ${o.name}`}><i className="fa-solid fa-xmark" /></button>
                        </span>
                    ))}
                </div>
            )}
            <div className="ucm-team-box">
                <div className="ucm-team-search">
                    <i className="fa-solid fa-magnifying-glass" />
                    <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, employee code or RIO…" />
                    <span className="ucm-team-count">{value.length} selected</span>
                </div>
                <div className="ucm-team-filters">
                    {[['ALL', 'All'], ['CM', 'Controlling Managers'], ['IE', 'IEs']].map(([k, l]) => (
                        <button key={k} type="button" className={`ucm-team-filter ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
                            {l} <span>{counts[k]}</span>
                        </button>
                    ))}
                </div>
                <ul className="ucm-team-list" role="listbox" aria-multiselectable="true">
                    {list.length === 0 && <li className="ucm-team-empty">No matching people.</li>}
                    {list.map(o => {
                        const on = value.includes(o.userId);
                        return (
                            <li key={o.userId} role="option" aria-selected={on}>
                                <button type="button" className={`ucm-team-row ${on ? 'on' : ''}`} onClick={() => toggle(o.userId)}>
                                    <span className="ucm-check-box"><i className="fa-solid fa-check" /></span>
                                    <span className="ucm-team-name">
                                        <strong>{o.name}</strong>
                                        <small>{o.employeeCode || '—'}{o.region ? ` · ${o.region}` : ''}</small>
                                    </span>
                                    <span className={`ucm-team-type ${o.type === 'CM' ? 'cm' : ''}`}>{o.type === 'CM' ? 'Controlling Manager' : 'IE'}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
JiTeamPicker.propTypes = { rejectionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), value: PropTypes.array, onChange: PropTypes.func };

/** Card wrapping a chip multi-select with a title and selected count. */
function ChipCard({ icon, title, options, value, onChange }) {
    return (
        <div className={`ucm-card ${value.length ? 'is-set' : ''}`}>
            <div className="ucm-card-head">
                <span className="ucm-card-icon"><i className={`fa-solid ${icon}`} /></span>
                <div className="ucm-card-title">
                    <strong>{title} <span className="ucx-req">*</span></strong>
                    <small>Select all that apply{value.includes('Nil') ? '' : ' · “Nil” if none'}</small>
                </div>
                <span className={`ucm-card-count ${value.length ? 'on' : ''}`}>{value.length} selected</span>
            </div>
            <ChipMulti options={options} value={value} onChange={onChange} />
        </div>
    );
}
ChipCard.propTypes = { icon: PropTypes.string, title: PropTypes.string, options: PropTypes.array, value: PropTypes.array, onChange: PropTypes.func };

/** One Yes / No question as a compact row. */
function YesNoRow({ icon, label, value, onChange }) {
    return (
        <div className="ucm-yn-row">
            <span className="ucm-yn-label"><i className={`fa-solid ${icon}`} /> {label} <span className="ucx-req">*</span></span>
            <div className="ucm-yn" role="radiogroup" aria-label={label}>
                {[['Y', 'Yes', 'fa-check'], ['N', 'No', 'fa-xmark']].map(([v, l, ic]) => (
                    <button key={v} type="button" role="radio" aria-checked={value === v}
                        className={`ucm-yn-btn ${v === 'Y' ? 'yes' : 'no'} ${value === v ? 'on' : ''}`} onClick={() => onChange(v)}>
                        <i className={`fa-solid ${ic}`} /> {l}
                    </button>
                ))}
            </div>
        </div>
    );
}
YesNoRow.propTypes = { icon: PropTypes.string, label: PropTypes.string, value: PropTypes.string, onChange: PropTypes.func };

/** Multi-select chips; "Nil" is exclusive. */
function ChipMulti({ options = [], value = [], onChange }) {
    const toggle = (v) => {
        if (value.includes(v)) return onChange(value.filter(x => x !== v));
        if (v === 'Nil') return onChange(['Nil']);
        return onChange([...value.filter(x => x !== 'Nil'), v]);
    };
    return (
        <div className="ucm-chips">
            {options.map(o => (
                <button key={o} type="button" aria-pressed={value.includes(o)}
                    className={`ucm-chip ${value.includes(o) ? 'on' : ''} ${o === 'Nil' ? 'nil' : ''}`} onClick={() => toggle(o)}>
                    <i className={`fa-solid ${value.includes(o) ? 'fa-check' : 'fa-plus'}`} /> {o}
                </button>
            ))}
        </div>
    );
}
ChipMulti.propTypes = { options: PropTypes.array, value: PropTypes.array, onChange: PropTypes.func };

/** PDF only, max 5 MB (checked again on the server). */
function PdfPicker({ label, required, file, onChange }) {
    const ref = useRef(null);
    const [err, setErr] = useState('');
    const pick = (e) => {
        const fl = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!fl) return;
        if (!/\.pdf$/i.test(fl.name) || (fl.type && fl.type !== 'application/pdf')) { setErr('Only PDF files are allowed.'); return; }
        if (fl.size > MAX_PDF_BYTES) { setErr(`File is ${fmtSize(fl.size)}. Maximum size is 5 MB.`); return; }
        setErr(''); onChange(fl);
    };
    return (
        <div className="ucx-field">
            <label>{label} {required ? <span className="ucx-req">*</span> : <span className="ucx-opt">(optional)</span>}</label>
            <input ref={ref} type="file" accept="application/pdf,.pdf" hidden onChange={pick} />
            {file ? (
                <div className="ucm-file">
                    <i className="fa-solid fa-file-pdf" />
                    <div className="ucm-file-text"><strong title={file.name}>{file.name}</strong><span>{fmtSize(file.size)}</span></div>
                    <button type="button" className="ucx-x" onClick={() => onChange(null)} aria-label="Remove file"><i className="fa-solid fa-xmark" /></button>
                </div>
            ) : (
                <button type="button" className="ucm-drop" onClick={() => ref.current && ref.current.click()}>
                    <i className="fa-solid fa-cloud-arrow-up" />
                    <span><strong>Choose PDF</strong> · max 5 MB</span>
                </button>
            )}
            {err && <span className="ucm-file-err"><i className="fa-solid fa-circle-exclamation" /> {err}</span>}
        </div>
    );
}
PdfPicker.propTypes = { label: PropTypes.string, required: PropTypes.bool, file: PropTypes.object, onChange: PropTypes.func };

/* ─── Documents tab ───────────────────────────────────────────────── */
export function ComplaintDocuments({ rejectionId, refreshKey }) {
    const [docs, setDocs] = useState(null);
    const [busy, setBusy] = useState(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        let alive = true;
        setDocs(null);
        getComplaintDocuments(rejectionId)
            .then(d => { if (alive) setDocs(Array.isArray(d) ? d : []); })
            .catch(() => { if (alive) setDocs([]); });
        return () => { alive = false; };
    }, [rejectionId, refreshKey]);

    const open = async (d) => {
        setBusy(d.id); setErr('');
        // Open the tab synchronously (inside the click) so pop-up blockers allow it
        const win = window.open('', '_blank');
        try {
            const blob = await downloadComplaintDocument(d.id);
            const url = URL.createObjectURL(blob);
            if (win) win.location.href = url; else window.location.assign(url);
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e) {
            if (win) win.close();
            setErr(e.message || 'Could not open the document.');
        } finally {
            setBusy(null);
        }
    };

    if (docs === null) return <div className="ucx-tl"><span className="ucx-skel" style={{ width: '70%' }} /><span className="ucx-skel" style={{ width: '50%' }} /></div>;
    if (docs.length === 0) return <div className="ucx-tl-empty"><i className="fa-regular fa-folder-open" /> No documents uploaded yet.</div>;
    return (
        <div className="ucm-docs">
            {docs.map(d => (
                <div key={d.id} className="ucm-doc">
                    <span className="ucm-doc-icon"><i className="fa-solid fa-file-pdf" /></span>
                    <div className="ucm-doc-text">
                        <strong title={d.fileName}>{d.fileName}</strong>
                        <span>{DOC_LABEL[d.docType] || d.docType} · {fmtSize(d.sizeBytes || 0)}
                            {d.uploadedAt ? ` · ${new Date(d.uploadedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                    </div>
                    <button type="button" className="ucx-btn ucx-btn-ghost ucm-doc-btn" onClick={() => open(d)} disabled={busy === d.id}>
                        {busy === d.id ? <span className="ucx-spinner" /> : <i className="fa-solid fa-up-right-from-square" />} View
                    </button>
                </div>
            ))}
            {err && <div className="ucx-err"><i className="fa-solid fa-circle-exclamation" /> {err}</div>}
        </div>
    );
}
ComplaintDocuments.propTypes = { rejectionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), refreshKey: PropTypes.number };
