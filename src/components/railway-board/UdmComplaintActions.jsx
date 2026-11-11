import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { SearchableDropdown } from './SharedComponents';
import {
    getComplaintRios, getComplaintCmsByRio, sendComplaintToCm, closeComplaint, getComplaintHistory,
} from '../../services/udmComplaintService';
import './UdmComplaintActions.css';

/* ─── Status meta (single source for chip text/colour) ─────────────── */
export const COMPLAINT_STATUS = {
    PENDING_WITH_COMPLAINT_CELL: { label: 'Pending with Complaint Cell', tone: 'amber', icon: 'fa-hourglass-half' },
    SENT_TO_CM:                  { label: 'Sent to CM',                  tone: 'blue',  icon: 'fa-paper-plane' },
    JI_SCHEDULED:                { label: 'JI Scheduled',                tone: 'blue',  icon: 'fa-calendar-check' },
    JI_COMPLETED:                { label: 'JI Completed',                tone: 'blue',  icon: 'fa-clipboard-check' },
    AUDIT_IN_PROGRESS:           { label: 'Audit in Progress',           tone: 'blue',  icon: 'fa-magnifying-glass' },
    AUDIT_COMPLETED:             { label: 'Audit Completed',             tone: 'blue',  icon: 'fa-clipboard-check' },
    RCA_SUBMITTED:               { label: 'RCA Submitted',               tone: 'blue',  icon: 'fa-sitemap' },
    CAPA_SUBMITTED:              { label: 'Pending with SBU Head',       tone: 'amber', icon: 'fa-user-shield' },
    CLOSED:                      { label: 'Closed',                      tone: 'green', icon: 'fa-circle-check' },
};

export const isClosed = (r) => (r?.complaintStatus || 'PENDING_WITH_COMPLAINT_CELL') === 'CLOSED';

export function ComplaintStatusChip({ r, compact = false }) {
    const key = r?.complaintStatus || 'PENDING_WITH_COMPLAINT_CELL';
    const meta = COMPLAINT_STATUS[key] || { label: key, tone: 'slate', icon: 'fa-circle' };
    return (
        <div className="ucx-status">
            <span className={`ucx-chip ucx-${meta.tone}`}>
                <i className={`fa-solid ${meta.icon}`} /> {meta.label}
            </span>
            {!compact && key !== 'PENDING_WITH_COMPLAINT_CELL' && key !== 'CLOSED' && (r.assignedCmName || r.assignedRio) && (
                <span className="ucx-status-sub" title={r.assignedCmName}>
                    {r.assignedCmName || 'CM'}{r.assignedRio ? ` · ${r.assignedRio}` : ''}
                </span>
            )}
        </div>
    );
}
ComplaintStatusChip.propTypes = { r: PropTypes.object, compact: PropTypes.bool };

/* ─── Toast (no extra dependency) ──────────────────────────────────── */
export function useToast() {
    const [toast, setToast] = useState(null);
    const show = useCallback((message, type = 'success') => {
        setToast({ message, type, id: Date.now() });
    }, []);
    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);
    const node = toast ? (
        <div className={`ucx-toast ucx-toast-${toast.type}`} role="status" aria-live="polite" key={toast.id}>
            <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} />
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss"><i className="fa-solid fa-xmark" /></button>
        </div>
    ) : null;
    return { show, node };
}

/* ─── Footer shown inside the View modal ───────────────────────────── */
export function ComplaintActionFooter({ r, canAct, viewOnlyNote, extraActions, onSend, onClose }) {
    const closed = isClosed(r);
    const key = r?.complaintStatus || 'PENDING_WITH_COMPLAINT_CELL';
    const meta = COMPLAINT_STATUS[key] || { label: key, tone: 'slate', icon: 'fa-circle' };
    const assignee = key !== 'PENDING_WITH_COMPLAINT_CELL' && key !== 'CLOSED' && (r.assignedCmName || r.assignedRio)
        ? `${r.assignedCmName || 'CM'}${r.assignedRio ? ` · RIO ${r.assignedRio}` : ''}`
        : '';
    return (
        <div className="ucx-foot">
            <div className={`ucx-foot-card ucx-foot-${meta.tone}`}>
                <span className="ucx-foot-icon"><i className={`fa-solid ${meta.icon}`} /></span>
                <div className="ucx-foot-text">
                    <div className="ucx-foot-row">
                        <span className="ucx-foot-label">Complaint status</span>
                        <span className={`ucx-chip ucx-${meta.tone}`}>{meta.label}</span>
                    </div>
                    {(assignee || r.complaintRemarks) && (
                        <div className="ucx-foot-sub">
                            {assignee && (
                                <span className="ucx-foot-who" title={assignee}>
                                    <i className="fa-solid fa-user-tie" /> {assignee}
                                </span>
                            )}
                            {r.complaintRemarks && (
                                <span className="ucx-foot-note" title={r.complaintRemarks}>
                                    <i className="fa-regular fa-comment-dots" /> {r.complaintRemarks}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {viewOnlyNote && (
                <span className="ucx-viewonly"><i className="fa-solid fa-eye" /> {viewOnlyNote}</span>
            )}
            {extraActions && <div className="ucx-foot-actions">{extraActions}</div>}
            {canAct && !closed && (
                <div className="ucx-foot-actions">
                    <button type="button" className="ucx-btn ucx-btn-ghost-danger" onClick={onClose}>
                        <i className="fa-solid fa-lock" /> Close
                    </button>
                    <button type="button" className="ucx-btn ucx-btn-primary" onClick={onSend}>
                        <i className="fa-solid fa-paper-plane" /> {r.complaintStatus === 'SENT_TO_CM' ? 'Re-assign CM' : 'Send to Controlling Manager'}
                    </button>
                </div>
            )}
        </div>
    );
}
ComplaintActionFooter.propTypes = {
    r: PropTypes.object.isRequired, canAct: PropTypes.bool, viewOnlyNote: PropTypes.string, extraActions: PropTypes.node,
    onSend: PropTypes.func, onClose: PropTypes.func,
};

/* ─── Timeline (history) inside the View modal ─────────────────────── */
const ACTION_LABEL = {
    UDM_COMPLAINT_RECEIVED: 'Received from UDM',
    CC_SEND_TO_CM: 'Sent to Controlling Manager',
    CC_CLOSE_COMPLAINT: 'Closed by Complaint Cell',
    CM_SCHEDULE_JI: 'Joint Inspection Scheduled',
    CM_START_AUDIT: 'Audit Started',
    CM_COMPLETE_JI: 'Joint Inspection Completed',
    CM_COMPLETE_AUDIT: 'Audit Completed',
    CM_SUBMIT_RCA: 'RCA Submitted',
    CM_SUBMIT_CAPA: 'CAPA Submitted · Sent to SBU Head',
};
const ACTION_META = {
    UDM_COMPLAINT_RECEIVED: { icon: 'fa-inbox', tone: 'amber' },
    CC_SEND_TO_CM: { icon: 'fa-paper-plane', tone: 'blue' },
    CC_CLOSE_COMPLAINT: { icon: 'fa-lock', tone: 'green' },
    CM_SCHEDULE_JI: { icon: 'fa-calendar-check', tone: 'blue' },
    CM_START_AUDIT: { icon: 'fa-magnifying-glass', tone: 'blue' },
    CM_COMPLETE_JI: { icon: 'fa-clipboard-check', tone: 'blue' },
    CM_COMPLETE_AUDIT: { icon: 'fa-clipboard-check', tone: 'blue' },
    CM_SUBMIT_RCA: { icon: 'fa-sitemap', tone: 'blue' },
    CM_SUBMIT_CAPA: { icon: 'fa-shield-halved', tone: 'amber' },
};
const fmtDT = (s) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

export function ComplaintTimeline({ rejectionId, refreshKey }) {
    const [items, setItems] = useState(null);
    useEffect(() => {
        let alive = true;
        if (!rejectionId) { setItems([]); return undefined; }
        setItems(null);
        getComplaintHistory(rejectionId)
            .then(d => { if (alive) setItems(Array.isArray(d) ? d : []); })
            .catch(() => { if (alive) setItems([]); });
        return () => { alive = false; };
    }, [rejectionId, refreshKey]);

    if (items === null) {
        return <div className="ucx-tl"><span className="ucx-skel" style={{ width: '60%' }} /><span className="ucx-skel" style={{ width: '40%' }} /></div>;
    }
    if (items.length === 0) {
        return <div className="ucx-tl-empty"><i className="fa-regular fa-clock" /> No actions yet — pending with Complaint Cell.</div>;
    }
    return (
        <ol className="ucx-tl">
            {items.map((h, i) => {
                const meta = ACTION_META[h.action] || { icon: 'fa-circle-dot', tone: 'slate' };
                const title = ACTION_LABEL[h.action] || h.action;
                // Skip remark when it just repeats the title (e.g. "Received from UDM")
                const showRemarks = h.remarks && h.remarks.trim().toLowerCase() !== String(title).toLowerCase();
                const isLatest = i === items.length - 1;
                return (
                    <li key={i} className={`ucx-tl-item ${isLatest ? 'is-latest' : ''}`}>
                        <span className={`ucx-tl-icon ucx-tl-${meta.tone}`}><i className={`fa-solid ${meta.icon}`} /></span>
                        <div className="ucx-tl-card">
                            <div className="ucx-tl-head">
                                <span className="ucx-tl-title">{title}</span>
                                {isLatest && <span className="ucx-tl-latest">Latest</span>}
                                <span className="ucx-tl-time"><i className="fa-regular fa-clock" /> {fmtDT(h.actionDate)}</span>
                            </div>
                            {h.assignedRio && (
                                <div className="ucx-tl-tags">
                                    <span className="ucx-tl-tag"><i className="fa-solid fa-building-shield" /> RIO {h.assignedRio}</span>
                                </div>
                            )}
                            {showRemarks && (
                                <div className="ucx-tl-remarks"><i className="fa-regular fa-comment-dots" /> {h.remarks}</div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
ComplaintTimeline.propTypes = { rejectionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), refreshKey: PropTypes.number };

/* ─── Send to Controlling Manager modal ─────────────────────────────── */
export function SendToCmModal({ r, onCancel, onDone }) {
    const [rios, setRios] = useState([]);
    const [rio, setRio] = useState(r.assignedRio || '');
    const [cms, setCms] = useState([]);
    const [cmUserId, setCmUserId] = useState('');
    const [remarks, setRemarks] = useState('');
    const [loadingRios, setLoadingRios] = useState(true);
    const [loadingCms, setLoadingCms] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        getComplaintRios()
            .then(d => setRios(Array.isArray(d) ? d : []))
            .catch(e => setErr(e.message || 'Could not load RIOs.'))
            .finally(() => setLoadingRios(false));
    }, []);

    useEffect(() => {
        setCmUserId('');
        setCms([]);
        if (!rio) return;
        setLoadingCms(true);
        getComplaintCmsByRio(rio)
            .then(d => setCms(Array.isArray(d) ? d : []))
            .catch(e => setErr(e.message || 'Could not load Controlling Managers.'))
            .finally(() => setLoadingCms(false));
    }, [rio]);

    const submit = async () => {
        if (!rio || !cmUserId || saving) return;
        setSaving(true); setErr('');
        try {
            const res = await sendComplaintToCm(r.id, { rio, cmUserId: Number(cmUserId), remarks: remarks.trim() });
            onDone(res, 'Complaint sent to Controlling Manager.');
        } catch (e) {
            setErr(e.message || 'Could not send the complaint.');
            setSaving(false);
        }
    };

    const cmOptions = cms.map(c => ({
        value: String(c.userId),
        label: c.employeeCode ? `${c.name} (${c.employeeCode})` : c.name,
    }));

    return (
        <div className="ucx-overlay" onClick={e => e.target === e.currentTarget && !saving && onCancel()}>
            <div className="ucx-dialog" role="dialog" aria-modal="true" aria-labelledby="ucx-send-title">
                <div className="ucx-dialog-head">
                    <span className="ucx-dialog-icon ucx-icon-blue"><i className="fa-solid fa-paper-plane" /></span>
                    <div>
                        <h4 id="ucx-send-title">Send to Controlling Manager</h4>
                        <p>Rejection <strong>{r.rejectionNumber}</strong>{r.vendorName ? ` · ${r.vendorName}` : ''}</p>
                    </div>
                    <button type="button" className="ucx-x" onClick={onCancel} disabled={saving} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
                </div>

                <div className="ucx-dialog-body">
                    <div className="ucx-field">
                        <label><i className="fa-solid fa-building-shield" /> RIO <span className="ucx-req">*</span></label>
                        {loadingRios ? (
                            <div className="ucx-dd-loading" role="status" aria-live="polite">
                                <span className="ucx-spinner" /> Loading RIOs…
                            </div>
                        ) : (
                            <SearchableDropdown
                                value={rio}
                                onChange={setRio}
                                options={rios.map(x => ({ label: x, value: x }))}
                                placeholder={rios.length ? 'Select RIO' : 'No RIO with a Controlling Manager'}
                            />
                        )}
                    </div>

                    <div className="ucx-field">
                        <label><i className="fa-solid fa-user-tie" /> Controlling Manager <span className="ucx-req">*</span></label>
                        {loadingCms ? (
                            <div className="ucx-dd-loading" role="status" aria-live="polite">
                                <span className="ucx-spinner" /> Loading Controlling Managers…
                            </div>
                        ) : (
                            <div className={!rio ? 'ucx-disabled' : ''}>
                                <SearchableDropdown
                                    value={cmUserId}
                                    onChange={setCmUserId}
                                    options={cmOptions}
                                    placeholder={!rio ? 'Select a RIO first' : (cmOptions.length ? 'Select Controlling Manager' : 'No Controlling Manager in this RIO')}
                                />
                            </div>
                        )}
                    </div>

                    <div className="ucx-field">
                        <label><i className="fa-regular fa-comment" /> Remarks <span className="ucx-opt">(optional)</span></label>
                        <textarea rows={3} maxLength={500} value={remarks} onChange={e => setRemarks(e.target.value)}
                            placeholder="Add a note for the Controlling Manager…" />
                        <span className="ucx-count">{remarks.length}/500</span>
                    </div>

                    {err && <div className="ucx-err"><i className="fa-solid fa-circle-exclamation" /> {err}</div>}
                </div>

                <div className="ucx-dialog-foot">
                    <button type="button" className="ucx-btn ucx-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
                    <button type="button" className="ucx-btn ucx-btn-primary" onClick={submit} disabled={!rio || !cmUserId || saving}>
                        <i className={saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'} />
                        {saving ? 'Sending…' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}
SendToCmModal.propTypes = { r: PropTypes.object.isRequired, onCancel: PropTypes.func.isRequired, onDone: PropTypes.func.isRequired };

/* ─── Close complaint modal ─────────────────────────────────────────── */
export function CloseComplaintModal({ r, onCancel, onDone }) {
    const [remarks, setRemarks] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const submit = async () => {
        if (!remarks.trim() || saving) return;
        setSaving(true); setErr('');
        try {
            const res = await closeComplaint(r.id, remarks.trim());
            onDone(res, 'Complaint closed.');
        } catch (e) {
            setErr(e.message || 'Could not close the complaint.');
            setSaving(false);
        }
    };

    return (
        <div className="ucx-overlay" onClick={e => e.target === e.currentTarget && !saving && onCancel()}>
            <div className="ucx-dialog ucx-dialog-sm" role="dialog" aria-modal="true" aria-labelledby="ucx-close-title">
                <div className="ucx-dialog-head">
                    <span className="ucx-dialog-icon ucx-icon-red"><i className="fa-solid fa-lock" /></span>
                    <div>
                        <h4 id="ucx-close-title">Close complaint?</h4>
                        <p>Rejection <strong>{r.rejectionNumber}</strong> will move to the Closed tab.</p>
                    </div>
                    <button type="button" className="ucx-x" onClick={onCancel} disabled={saving} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
                </div>
                <div className="ucx-dialog-body">
                    <div className="ucx-field">
                        <label><i className="fa-regular fa-comment" /> Reason for closing <span className="ucx-req">*</span></label>
                        <textarea rows={3} maxLength={500} value={remarks} onChange={e => setRemarks(e.target.value)}
                            placeholder="e.g. Not attributable to RITES / duplicate complaint…" autoFocus />
                        <span className="ucx-count">{remarks.length}/500</span>
                    </div>
                    {err && <div className="ucx-err"><i className="fa-solid fa-circle-exclamation" /> {err}</div>}
                </div>
                <div className="ucx-dialog-foot">
                    <button type="button" className="ucx-btn ucx-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
                    <button type="button" className="ucx-btn ucx-btn-danger" onClick={submit} disabled={!remarks.trim() || saving}>
                        <i className={saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-lock'} />
                        {saving ? 'Closing…' : 'Close complaint'}
                    </button>
                </div>
            </div>
        </div>
    );
}
CloseComplaintModal.propTypes = { r: PropTypes.object.isRequired, onCancel: PropTypes.func.isRequired, onDone: PropTypes.func.isRequired };
