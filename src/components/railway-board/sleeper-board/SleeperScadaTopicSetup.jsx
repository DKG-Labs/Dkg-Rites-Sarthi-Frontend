import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '../../../services/apiConfig';

/*
 * Sleeper SCADA Topic Setup.
 * Each plant row holds the gateway codes; the gateway publishes 9 topics per line:
 *   SPLR/<vendor short name>/<plant short name>/<line id>/<STAGE>     e.g. SPLR/MBSL/MBKRSA/U1/BATCHING
 * The SCADA Live Monitor dropdowns use the same rows.
 */

const BASE = () => `${API_BASE_URL}/api/sleeper/scada-mapping`;
const EMPTY = { vendorShortName: '', vendorName: '', plantShortName: '', plantName: '', lineIds: 'U1' };

const errorText = async (res, fallback) => {
    try { const j = await res.json(); return j?.message || j?.responseStatus?.message || fallback; } catch { return fallback; }
};

const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
    modal: { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 1000, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,.2)' },
    head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' },
    body: { padding: '16px 20px', overflowY: 'auto', display: 'grid', gap: 16 },
    th: { textAlign: 'left', padding: '9px 10px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '9px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 13, verticalAlign: 'top' },
    input: { width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' },
    label: { display: 'grid', gap: 4, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' },
    btn: { border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    code: { fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12.5 },
};

const SleeperScadaTopicSetup = ({ onClose, onChanged }) => {
    const [rows, setRows] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState(null);          // null = closed; {id?, ...} = add / edit
    const [saving, setSaving] = useState(false);
    const [openTopics, setOpenTopics] = useState(null); // row id whose topics are shown
    const [copied, setCopied] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(BASE(), { headers: getAuthHeaders() });
            if (!res.ok) throw new Error(await errorText(res, `Could not load topic setup (${res.status})`));
            const json = await res.json();
            setRows(json?.responseData?.mappings || []);
            setStages(json?.responseData?.stages || []);
        } catch (e) {
            setError(e.message || 'Could not load topic setup');
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            const isEdit = Boolean(form.id);
            const res = await fetch(isEdit ? `${BASE()}/${form.id}` : BASE(), {
                method: isEdit ? 'PUT' : 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error(await errorText(res, 'Could not save'));
            setForm(null);
            await load();
            onChanged && onChanged();
        } catch (e) {
            setError(e.message || 'Could not save');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (row) => {
        setError('');
        try {
            const res = await fetch(`${BASE()}/${row.id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!res.ok) throw new Error(await errorText(res, 'Could not remove'));
            await load();
            onChanged && onChanged();
        } catch (e) {
            setError(e.message || 'Could not remove');
        }
    };

    const copy = async (text, key) => {
        try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500); }
        catch { setError('Copy is not allowed here; select the text and copy it.'); }
    };

    const previewBase = form ? `SPLR/${(form.vendorShortName || '<VENDOR>').toUpperCase()}/${(form.plantShortName || '<PLANT>').toUpperCase()}/${((form.lineIds || '').split(/[,\s]+/).filter(Boolean)[0] || '<LINE>').toUpperCase()}` : '';

    return (
        <div style={S.overlay} role="dialog" aria-modal="true">
            <div style={S.modal}>
                <div style={S.head}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#166534' }}>SCADA Topic Setup — Sleeper</div>
                        <div style={{ fontSize: 12.5, color: '#64748b' }}>Gateway topics: <span style={S.code}>SPLR/&lt;vendor&gt;/&lt;plant&gt;/&lt;line&gt;/&lt;STAGE&gt;</span> · {stages.length || 9} stages per line</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" style={{ ...S.btn, background: '#10b981', color: '#fff' }} onClick={() => setForm({ ...EMPTY })}>+ Add Plant</button>
                        <button type="button" style={{ ...S.btn, background: '#f1f5f9', color: '#0f172a' }} onClick={onClose}>Close</button>
                    </div>
                </div>

                <div style={S.body}>
                    {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}

                    {form && (
                        <div style={{ border: '1px solid #a7f3d0', background: '#f0fdf4', borderRadius: 10, padding: 14, display: 'grid', gap: 12 }}>
                            <div style={{ fontWeight: 800, color: '#166534' }}>{form.id ? 'Edit plant codes' : 'Add plant'}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                <label style={S.label}>Vendor short name *
                                    <input style={S.input} value={form.vendorShortName} placeholder="e.g. MBSL" onChange={e => setForm({ ...form, vendorShortName: e.target.value })} />
                                </label>
                                <label style={S.label}>Vendor name
                                    <input style={S.input} value={form.vendorName || ''} placeholder="Full company name" onChange={e => setForm({ ...form, vendorName: e.target.value })} />
                                </label>
                                <label style={S.label}>Plant short name *
                                    <input style={S.input} value={form.plantShortName} placeholder="e.g. MBKRSA" onChange={e => setForm({ ...form, plantShortName: e.target.value })} />
                                </label>
                                <label style={S.label}>Plant name
                                    <input style={S.input} value={form.plantName || ''} placeholder="Unit / plant name" onChange={e => setForm({ ...form, plantName: e.target.value })} />
                                </label>
                                <label style={S.label}>Line IDs *
                                    <input style={S.input} value={form.lineIds} placeholder="e.g. U1 or U1,U2" onChange={e => setForm({ ...form, lineIds: e.target.value })} />
                                </label>
                            </div>
                            <div style={{ fontSize: 12.5, color: '#475569' }}>Topics will start with <span style={S.code}>{previewBase}/…</span></div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" style={{ ...S.btn, background: '#f1f5f9', color: '#0f172a' }} onClick={() => setForm(null)}>Cancel</button>
                                <button type="button" disabled={saving} style={{ ...S.btn, background: saving ? '#86efac' : '#16a34a', color: '#fff' }} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading…</div>
                    ) : rows.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No plants set up yet. Click <strong>+ Add Plant</strong> to add the first one.</div>
                    ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr><th style={S.th}>Vendor</th><th style={S.th}>Plant</th><th style={S.th}>Lines</th><th style={S.th}>Topic prefix</th><th style={S.th}>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {rows.map(r => {
                                        const allTopics = Object.values(r.topics || {}).flat();
                                        return (
                                            <React.Fragment key={r.id}>
                                                <tr>
                                                    <td style={S.td}><strong>{r.vendorShortName}</strong><div style={{ color: '#64748b', fontSize: 12 }}>{r.vendorName || ''}</div></td>
                                                    <td style={S.td}><strong>{r.plantShortName}</strong><div style={{ color: '#64748b', fontSize: 12 }}>{r.plantName || ''}</div></td>
                                                    <td style={S.td}>{(r.lineIds || []).join(', ')}</td>
                                                    <td style={{ ...S.td, ...S.code }}>SPLR/{r.vendorShortName}/{r.plantShortName}/&lt;line&gt;/…</td>
                                                    <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                                                        <button type="button" style={{ ...S.btn, background: '#ecfdf5', color: '#166534', marginRight: 6 }} onClick={() => setOpenTopics(openTopics === r.id ? null : r.id)}>{openTopics === r.id ? 'Hide topics' : `View ${allTopics.length} topics`}</button>
                                                        <button type="button" style={{ ...S.btn, background: '#eff6ff', color: '#1d4ed8', marginRight: 6 }} onClick={() => setForm({ id: r.id, vendorShortName: r.vendorShortName, vendorName: r.vendorName || '', plantShortName: r.plantShortName, plantName: r.plantName || '', lineIds: (r.lineIds || []).join(',') })}>Edit</button>
                                                        <button type="button" style={{ ...S.btn, background: '#fee2e2', color: '#b91c1c' }} onClick={() => remove(r)}>Remove</button>
                                                    </td>
                                                </tr>
                                                {openTopics === r.id && (
                                                    <tr>
                                                        <td colSpan={5} style={{ ...S.td, background: '#f8fafc' }}>
                                                            {Object.entries(r.topics || {}).map(([line, topics]) => (
                                                                <div key={line} style={{ marginBottom: 10 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                                                        <strong>Line {line}</strong>
                                                                        <button type="button" style={{ ...S.btn, padding: '4px 10px', fontSize: 12, background: '#10b981', color: '#fff' }} onClick={() => copy(topics.join('\n'), `${r.id}-${line}`)}>{copied === `${r.id}-${line}` ? 'Copied' : 'Copy all'}</button>
                                                                    </div>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
                                                                        {topics.map(t => (
                                                                            <div key={t} style={{ ...S.code, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 8px', userSelect: 'all', overflowWrap: 'anywhere' }}>{t}</div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SleeperScadaTopicSetup;
