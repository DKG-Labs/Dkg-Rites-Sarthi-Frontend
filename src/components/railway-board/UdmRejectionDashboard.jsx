import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx';
import './UdmRejectionDashboard.css';
import { getUdmRejections } from '../../services/udmRejectionService';

const IREPS_BASE = 'https://ireps.gov.in';

/* ─── Searchable Dropdown ──────────────────────────────────────── */
const Dropdown = ({ label, value = '', onChange, options, placeholder, minWidth = 120 }) => {
    const [open, setOpen]   = useState(false);
    const [q, setQ]         = useState('');
    const ref               = useRef(null);

    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const filtered   = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
    const selected   = options.find(o => o.value === value);
    const showSearch = options.length > 8;

    return (
        <div className="udm-filter-field">
            {label && <label>{label}</label>}
            <div className="udm-dd-wrap" ref={ref} style={{ minWidth }}>
                <div
                    className={`udm-dd-trigger${open ? ' open' : ''}`}
                    tabIndex={0}
                    onClick={() => { setOpen(!open); setQ(''); }}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(!open)}
                >
                    <span>{selected ? selected.label : placeholder}</span>
                    <span className="chevron" />
                </div>

                {open && (
                    <div className="udm-dd-panel">
                        {showSearch && (
                            <div className="udm-dd-search-row">
                                <i className="fa-solid fa-magnifying-glass" />
                                <input
                                    autoFocus
                                    placeholder="Search…"
                                    value={q}
                                    onChange={e => setQ(e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        )}
                        <div className="udm-dd-list">
                            {filtered.length === 0
                                ? <div className="udm-dd-none">No results</div>
                                : filtered.map(opt => (
                                    <div
                                        key={opt.value}
                                        className={`udm-dd-opt${value === opt.value ? ' sel' : ''}`}
                                        onClick={() => { onChange(opt.value); setOpen(false); setQ(''); }}
                                    >
                                        {opt.label}
                                        {value === opt.value && <i className="fa-solid fa-check tick" />}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Constants ─────────────────────────────────────────────────── */

const EMPTY_F = () => ({ rejDate: '', poNo: '', vendorCode: '', type: '', inspAgency: '' });

/* ─── Helpers ───────────────────────────────────────────────────── */
const fmtDate = str => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

const fmtVal = val => {
    if (!val) return null;
    const n = parseFloat(val);
    return isNaN(n) ? val : `₹ ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const cleanVCode = v => v ? v.replace(/^:/, '') : null;


const CACHE_KEY = 'udm_cache';

const saveCache = (rows, appliedDate) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rows, appliedDate, ts: Date.now() }));
    } catch (_) {}
};

const loadCache = () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
};

/* ─── Main ──────────────────────────────────────────────────────── */
export default function UdmRejectionDashboard() {
    const cached = loadCache();

    const [rows,          setRows]          = useState(cached?.rows  || []);
    const [draft,         setDraft]         = useState(() => ({ ...EMPTY_F(), rejDate: cached?.appliedDate || '' }));
    const [appliedDate,   setAppliedDate]   = useState(cached?.appliedDate || '');
    const [search,        setSearch]        = useState('');
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState(null);
    const [detail,        setDetail]        = useState(null);
    const [hasFetched,    setHasFetched]    = useState(!!cached);

    const fetchData = useCallback(async (f) => {
        setLoading(true); setError(null);
        try {
            const apiFilters = {
                ...(f.rejDate    && { rejDate:    f.rejDate }),
                ...(f.poNo       && { poNo:       f.poNo }),
                ...(f.vendorCode && { vendorCode: f.vendorCode }),
                ...(f.type       && { type:       f.type }),
            };
            const data    = await getUdmRejections(apiFilters);
            const newRows = data || [];
            const newDate = f.rejDate || '';
            setRows(newRows);
            setAppliedDate(newDate);
            setHasFetched(true);
            saveCache(newRows, newDate);
        } catch (e) { setError(e.message || 'Failed to fetch rejection data.'); }
        finally     { setLoading(false); }
    }, []);

    // No auto-load — restore from cache on mount, user fetches fresh data manually

    const setF    = (k, v) => setDraft(p => ({ ...p, [k]: v }));
    const apply   = () => fetchData(draft);
    const clear   = () => { const d = EMPTY_F(); setDraft(d); setSearch(''); fetchData(d); };

    const exportExcel = () => {
        const data = visible.map((r, i) => ({
            '#':                   i + 1,
            'Rejection No.':       r.rejectionNumber  || '',
            'PO Number':           r.poNumber         || '',
            'PL Number':           r.plNumber         || '',
            'Type':                r.typeOfRejection  || '',
            'Item Description':    r.itemDescription  || '',
            'Firm Name':           r.vendorName       || '',
            'Vendor Code':         cleanVCode(r.vendorCode) || '',
            'Consignee':           r.consignee        || '',
            'Rejected Qty':        r.rejectedQty      || '',
            'UOM':                 r.uom              || '',
            'Rejection Value':     r.rejectionValue   || '',
            'Rejection Date':      r.rejectionDate    || '',
            'IC Number':           r.icNumber         || '',
            'IC Date':             r.icDate           || '',
            'Inspection Agency':   r.inspectionAgency || '',
            'Reason for Rejection':r.reasonForRejection || '',
            'Status':              r.status           || '',
            'Source':              r.source           || '',
            'Material Recd. Date': r.materialReceivedDate || '',
            'PO Serial No.':       r.poSerialNumber   || '',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'UDM Rejections');

        // Auto column widths
        const cols = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length, 14) }));
        ws['!cols'] = cols;

        const filename = `UDM_Rejections_${appliedDate || 'export'}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const visible = rows.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return [
            r.rejectionNumber, r.poNumber, r.plNumber, r.poSerialNumber,
            r.icNumber, r.icDate,
            r.vendorName, r.vendorCode, cleanVCode(r.vendorCode),
            r.consignee, r.itemDescription,
            r.typeOfRejection, r.inspectionAgency,
            r.rejectionDate, fmtDate(r.rejectionDate),
            r.reasonForRejection, r.status, r.source,
            r.rejectedQty, r.uom,
            r.rejectionValue, fmtVal(r.rejectionValue),
        ].some(v => (v || '').toString().toLowerCase().includes(q));
    });

    return (
        <div className="udm-root fade-in">

            {/* ── Intro row ── */}
            <div className="udm-intro">
                <div className="udm-intro-icon">
                    <i className="fa-solid fa-triangle-exclamation" />
                </div>
                <div className="udm-intro-copy">
                    <h2>UDM / IMMS Consignee Rejections</h2>
                    <p>
                        <span className="src-dot" />
                        Live data · CRIS IREPS Portal &nbsp;·&nbsp; ERC, PSC Sleepers &amp; Rail Pads
                        {hasFetched && appliedDate && (
                            <span className="applied-hint">
                                &nbsp;·&nbsp; Showing from <strong>{new Date(appliedDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong>
                            </span>
                        )}
                    </p>
                </div>
            </div>


            {/* ── Filter bar — date only ── */}
            <div className="udm-filters udm-filters-simple">
                <div className="udm-filter-field">
                    <label>
                        <i className="fa-regular fa-calendar" style={{marginRight:4}} />
                        Rejection Date
                    </label>
                    <input type="date" className="udm-input-base" value={draft.rejDate}
                        onChange={e => setF('rejDate', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && apply()}
                        style={{ minWidth: 160 }} />
                </div>

                <button className="btn-udm-apply" onClick={apply} disabled={loading}>
                    {loading
                        ? <><i className="fa-solid fa-circle-notch fa-spin" /> Fetching…</>
                        : <><i className="fa-solid fa-magnifying-glass" /> Fetch Records</>
                    }
                </button>

                <button className="btn-udm-clear" onClick={clear} disabled={loading}>
                    <i className="fa-solid fa-rotate-left" /> Reset
                </button>
            </div>

            {error && (
                <div className="udm-error">
                    <i className="fa-solid fa-circle-exclamation" /> {error}
                </div>
            )}

            {/* ── Table panel ── */}
            <div className="udm-panel">
                <div className="udm-panel-head">
                    <div className="udm-panel-title">
                        <i className="fa-solid fa-table-list" style={{ color:'#94a3b8' }} />
                        Rejection Records
                        <span className="udm-count-pill">{visible.length}</span>
                    </div>
                    <div className="udm-panel-head-right">
                        <div className="udm-gsearch-wrap">
                            <i className="fa-solid fa-magnifying-glass udm-gsearch-icon" />
                            <input
                                type="text"
                                className="udm-gsearch"
                                placeholder="Search rejection no., PO, IC, vendor…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button className="udm-gsearch-clear" onClick={() => setSearch('')}>
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            )}
                        </div>
                        {visible.length > 0 && (
                            <button className="btn-udm-excel" onClick={exportExcel}>
                                <i className="fa-solid fa-file-excel" /> Export Excel
                            </button>
                        )}
                    </div>
                </div>

                <div className="udm-scroll">
                    {loading ? (
                        <div className="udm-state-box">
                            <div className="st-icon">
                                <i className="fa-solid fa-circle-notch fa-spin" style={{ color:'#3b82f6' }} />
                            </div>
                            <h4>Fetching from CRIS IREPS…</h4>
                            <p>Connecting to the live portal. This may take a moment.</p>
                        </div>
                    ) : !hasFetched ? (
                        <div className="udm-state-box">
                            <div className="st-icon"><i className="fa-regular fa-calendar" style={{color:'#3b82f6'}} /></div>
                            <h4>Select a date to fetch records</h4>
                            <p>Enter a Rejection Date above and click <strong>Fetch Records</strong> to load data from CRIS IREPS.</p>
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="udm-state-box">
                            <div className="st-icon"><i className="fa-solid fa-inbox" /></div>
                            <h4>No records found</h4>
                            <p>No rejections found for the selected date. Try a different date.</p>
                        </div>
                    ) : (
                        <table className="udm-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Rejection No.</th>
                                    <th>Type</th>
                                    <th>Item</th>
                                    <th>Firm</th>
                                    <th>Consignee</th>
                                    <th>Rej. Qty</th>
                                    <th>Value</th>
                                    <th>Date</th>
                                    <th>IC No.</th>
                                    <th>Reason</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((r, i) => (
                                    <tr key={r.rejectionNumber || i}>
                                        <td className="td-muted td-num">{i + 1}</td>
                                        <td className="td-nowrap">
                                            <div className="td-main">{r.rejectionNumber || '—'}</div>
                                            {r.poNumber && <div className="td-sub">PO: {r.poNumber}</div>}
                                        </td>
                                        <td className="td-nowrap">
                                            {r.typeOfRejection
                                                ? <span className={`tbadge ${r.typeOfRejection.toLowerCase()}`}>{r.typeOfRejection}</span>
                                                : <span className="td-muted">—</span>}
                                        </td>
                                        <td className="td-clamp">
                                            <div className="td-main td-truncate" title={r.itemDescription}>{r.itemDescription || '—'}</div>
                                            {r.plNumber && <div className="td-sub">PL: {r.plNumber}</div>}
                                        </td>
                                        <td className="td-clamp">
                                            <div className="td-truncate td-main" title={r.vendorName}>{r.vendorName || '—'}</div>
                                            {r.vendorCode && <div className="td-sub">{cleanVCode(r.vendorCode)}</div>}
                                        </td>
                                        <td className="td-clamp">
                                            <div className="td-truncate" title={r.consignee}>{r.consignee || '—'}</div>
                                        </td>
                                        <td className="td-nowrap">
                                            {r.rejectedQty
                                                ? <><strong>{Number(r.rejectedQty).toLocaleString('en-IN')}</strong> <span className="td-sub" style={{display:'inline'}}>{r.uom}</span></>
                                                : <span className="td-muted">—</span>}
                                        </td>
                                        <td className="td-nowrap">
                                            {fmtVal(r.rejectionValue) || <span className="td-muted">—</span>}
                                        </td>
                                        <td className="td-nowrap">
                                            {fmtDate(r.rejectionDate) || <span className="td-muted">—</span>}
                                        </td>
                                        <td className="td-nowrap">{r.icNumber || <span className="td-muted">—</span>}</td>
                                        <td className="td-clamp">
                                            <div className="td-truncate" title={r.reasonForRejection}>
                                                {r.reasonForRejection || <span className="td-muted">—</span>}
                                            </div>
                                        </td>
                                        <td className="td-nowrap">
                                            <button className="btn-view" onClick={() => setDetail(r)}>
                                                <i className="fa-solid fa-arrow-up-right-from-square" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {detail && <DetailModal r={detail} onClose={() => setDetail(null)} />}
        </div>
    );
}

/* ─── Field item ─────────────────────────────────────────────── */
const F = ({ l, v }) => (
    <div className="udm-fitem">
        <div className="fl">{l}</div>
        <div className={`fv${!v ? ' na' : ''}`}>{v || 'N/A'}</div>
    </div>
);

/* ─── Field component with optional value class ─────────────── */
const Fv = ({ l, v, cls }) => (
    <div className="udm-fitem">
        <div className="fl">{l}</div>
        <div className={`fv${!v ? ' na' : cls ? ` ${cls}` : ''}`}>{v || 'N/A'}</div>
    </div>
);

/* ─── Detail Modal ───────────────────────────────────────────── */
function DetailModal({ r, onClose }) {
    const pdfUrl   = r.pdfPath ? `${IREPS_BASE}${r.pdfPath}` : null;
    const typeSlug = (r.typeOfRejection || '').toLowerCase();
    const qty      = r.rejectedQty ? `${Number(r.rejectedQty).toLocaleString('en-IN')} ${r.uom || ''}` : null;

    return (
        <div className="udm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="udm-modal">

                {/* ── Dark banner header ── */}
                <div className="udm-mhead">
                    <div className="udm-mhead-top">
                        <div className="udm-mhead-text">
                            <h3>
                                <i className="fa-solid fa-triangle-exclamation" style={{marginRight:8,color:'#f59e0b',fontSize:15}} />
                                Consignee Rejection
                            </h3>
                            <div className="udm-chips">
                                {r.rejectionNumber && <span className="udm-chip hl">{r.rejectionNumber}</span>}
                                {r.typeOfRejection && (
                                    <span className={`udm-chip ${typeSlug === 'warranty' ? 'warr' : typeSlug === 'initial' ? 'init' : ''}`}>
                                        {r.typeOfRejection}
                                    </span>
                                )}
                                {r.source && <span className="udm-chip">{r.source}</span>}
                                {r.status && <span className="udm-chip">{r.status === 'RJ' ? '● Rejected' : r.status}</span>}
                            </div>
                        </div>
                        <button className="btn-mclose" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
                    </div>

                    {/* Hero stats */}
                    <div className="udm-mhero">
                        <div className="udm-mhero-item">
                            <div className="udm-mhero-label">Rejected Quantity</div>
                            <div className="udm-mhero-value accent">{qty || '—'}</div>
                        </div>
                        <div className="udm-mhero-item">
                            <div className="udm-mhero-label">Rejection Value</div>
                            <div className="udm-mhero-value warn">{fmtVal(r.rejectionValue) || '—'}</div>
                        </div>
                        <div className="udm-mhero-item">
                            <div className="udm-mhero-label">Rejection Date</div>
                            <div className="udm-mhero-value">{fmtDate(r.rejectionDate) || '—'}</div>
                        </div>
                        <div className="udm-mhero-item">
                            <div className="udm-mhero-label">IC Number</div>
                            <div className="udm-mhero-value">{r.icNumber || '—'}</div>
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="udm-mbody">

                    {/* PDF link */}
                    {pdfUrl && (
                        <div className="udm-maction">
                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-pdf">
                                <i className="fa-solid fa-file-pdf" /> View Rejection Document (PDF)
                            </a>
                        </div>
                    )}

                    {/* Rejection info */}
                    <div className="udm-msect">
                        <div className="udm-msect-title">
                            <i className="fa-solid fa-circle-exclamation" /> Rejection Details
                        </div>
                        <div className="udm-fg">
                            <Fv l="Rejection No."        v={r.rejectionNumber} />
                            <Fv l="Type"                 v={r.typeOfRejection} />
                            <Fv l="Rejection Date"       v={fmtDate(r.rejectionDate)} />
                            <Fv l="Rejected Quantity"    v={qty} cls="accent" />
                            <Fv l="Rejection Value"      v={fmtVal(r.rejectionValue)} cls="money" />
                            <Fv l="Inspection Agency"    v={r.inspectionAgency} />
                            <Fv l="Status"               v={r.status === 'RJ' ? 'Rejected' : r.status} cls="badge-rj" />
                            <Fv l="Source"               v={r.source} />
                        </div>
                        {/* Reason — full width */}
                        {r.reasonForRejection && (
                            <div style={{ background:'#fff7ed', borderTop:'1px solid #fed7aa', padding:'10px 14px' }}>
                                <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color:'#f59e0b', marginBottom:4 }}>
                                    Reason for Rejection
                                </div>
                                <div style={{ fontSize:13, fontWeight:600, color:'#9a3412', lineHeight:1.5 }}>
                                    {r.reasonForRejection}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Consignee */}
                    <div className="udm-msect">
                        <div className="udm-msect-title">
                            <i className="fa-solid fa-location-dot" /> Consignee &amp; Delivery
                        </div>
                        <div className="udm-fg">
                            <Fv l="Consignee"            v={r.consignee} />
                            <Fv l="Material Recd. Date"  v={fmtDate(r.materialReceivedDate)} />
                        </div>
                    </div>

                    {/* PO & Inspection */}
                    <div className="udm-msect">
                        <div className="udm-msect-title">
                            <i className="fa-solid fa-file-contract" /> PO &amp; Inspection
                        </div>
                        <div className="udm-fg">
                            <Fv l="PO Number"       v={r.poNumber} />
                            <Fv l="PO Date"         v={fmtDate(r.poDate)} />
                            <Fv l="PO Serial No."   v={r.poSerialNumber} />
                            <Fv l="PL Number"       v={r.plNumber} />
                            <Fv l="IC Number"       v={r.icNumber} />
                            <Fv l="IC Date"         v={fmtDate(r.icDate)} />
                        </div>
                        {r.itemDescription && (
                            <div style={{ background:'#f8fafc', borderTop:'1px solid #f1f5f9', padding:'10px 14px' }}>
                                <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color:'#94a3b8', marginBottom:4 }}>
                                    Item Description
                                </div>
                                <div style={{ fontSize:12.5, color:'#334155', lineHeight:1.6 }}>{r.itemDescription}</div>
                            </div>
                        )}
                    </div>

                    {/* Vendor */}
                    <div className="udm-msect">
                        <div className="udm-msect-title">
                            <i className="fa-solid fa-industry" /> Vendor / Supplier
                        </div>
                        <div className="udm-fg">
                            <Fv l="Vendor Code" v={cleanVCode(r.vendorCode)} />
                            <Fv l="Firm Name"   v={r.vendorName} />
                            <Fv l="UOM"         v={r.uom} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

DetailModal.propTypes = { r: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired };
F.propTypes          = { l: PropTypes.string.isRequired, v: PropTypes.any };
Dropdown.propTypes   = {
    label: PropTypes.string, value: PropTypes.string,
    onChange: PropTypes.func.isRequired, options: PropTypes.array.isRequired,
    placeholder: PropTypes.string, minWidth: PropTypes.number,
};
