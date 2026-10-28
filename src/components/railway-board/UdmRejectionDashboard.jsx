import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './UdmRejectionDashboard.css';
import { getUdmRejections, syncUdmRejections } from '../../services/udmRejectionService';

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
    const [appliedDate,   setAppliedDate]   = useState(cached?.appliedDate || '');
    const [search,        setSearch]        = useState('');
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState(null);
    const [detail,        setDetail]        = useState(null);
    const [syncing,       setSyncing]       = useState(false);
    const [syncResult,    setSyncResult]    = useState(null);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [syncDate,      setSyncDate]      = useState('');
    const [syncNoData,    setSyncNoData]    = useState(false);
    const [page,          setPage]          = useState(1);
    const [pageSize,      setPageSize]      = useState(10);

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data    = await getUdmRejections({});
            const newRows = data || [];
            setRows(newRows);
            setAppliedDate('');
            saveCache(newRows, '');
        } catch (e) { setError(e.message || 'Failed to fetch rejection data.'); }
        finally     { setLoading(false); }
    }, []);

    // Auto-load all records on mount
    useEffect(() => { fetchData(); }, [fetchData]);

    const openSyncModal = () => {
        setSyncDate('');
        setSyncResult(null);
        setSyncNoData(false);
        setError(null);
        setShowSyncModal(true);
    };

    const handleSync = async () => {
        if (!syncDate) return;
        setSyncing(true); setSyncResult(null); setSyncNoData(false); setError(null);
        try {
            const res = await syncUdmRejections(syncDate);
            const saved = res.recordsSaved ?? 0;
            if (saved === 0) {
                setSyncNoData(true);
            } else {
                setShowSyncModal(false);
                setSyncResult(`Synced ${saved} record(s) for ${syncDate}`);
                setTimeout(() => setSyncResult(null), 5000);
                await fetchData();
            }
        } catch (e) {
            setError(e.message || 'Sync failed.');
        } finally {
            setSyncing(false);
        }
    };

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

    const downloadPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('UDM / IMMS Consignee Rejections', 40, 36);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}  ·  Total records: ${visible.length}`, 40, 52);

        autoTable(doc, {
            startY: 64,
            styles: { fontSize: 7.5, cellPadding: 4 },
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            head: [[
                '#', 'Rejection No.', 'Rejection Date', 'PO Number', 'Item Description',
                'Firm Name', 'Rej. Qty', 'UOM', 'Rej. Value', 'IC Number', 'IC Date',
                'Type', 'Status',
            ]],
            body: visible.map((r, i) => [
                i + 1,
                r.rejectionNumber  || '',
                r.rejectionDate    || '',
                r.poNumber         || '',
                r.itemDescription  || '',
                r.vendorName       || '',
                r.rejectedQty      || '',
                r.uom              || '',
                r.rejectionValue   || '',
                r.icNumber         || '',
                r.icDate           || '',
                r.typeOfRejection  || '',
                r.status           || '',
            ]),
            columnStyles: {
                0: { cellWidth: 22, halign: 'center' },
                4: { cellWidth: 120 },
                5: { cellWidth: 100 },
            },
        });

        doc.save(`UDM_Rejections_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
    const safePage   = Math.min(page, totalPages);
    const pageRows   = visible.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleSearch = v => { setSearch(v); setPage(1); };
    const handlePageSize = v => { setPageSize(Number(v)); setPage(1); };

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
                        Synced daily from CRIS IREPS &nbsp;·&nbsp; ERC, PSC Sleepers &amp; Rail Pads
                    </p>
                </div>
            </div>


            {syncResult && (
                <div className="udm-sync-success">
                    <i className="fa-solid fa-circle-check" /> {syncResult}
                </div>
            )}

            {error && (
                <div className="udm-error">
                    <i className="fa-solid fa-circle-exclamation" /> {error}
                </div>
            )}

            {/* ── Table panel ── */}
            <div className="udm-panel">
                <div className="udm-panel-head">
                    <div className="udm-panel-head-left">
                        <div className="udm-panel-title">
                            <i className="fa-solid fa-table-list" style={{ color:'#94a3b8' }} />
                            Rejection Records
                            <span className="udm-count-pill">{visible.length}</span>
                        </div>
                        <div className="udm-gsearch-wrap">
                            <i className="fa-solid fa-magnifying-glass udm-gsearch-icon" />
                            <input
                                type="text"
                                className="udm-gsearch"
                                placeholder="Search rejection no., PO, IC, vendor…"
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                            />
                            {search && (
                                <button className="udm-gsearch-clear" onClick={() => handleSearch('')}>
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="udm-panel-head-right">
                        <button className="btn-udm-sync" onClick={openSyncModal} disabled={syncing || loading}>
                            <i className="fa-solid fa-rotate" /> Manual Sync
                        </button>
                        {visible.length > 0 && (<>
                            <button className="btn-udm-pdf" onClick={downloadPdf}>
                                <i className="fa-solid fa-file-pdf" /> Download PDF
                            </button>
                            <button className="btn-udm-excel" onClick={exportExcel}>
                                <i className="fa-solid fa-file-excel" /> Export Excel
                            </button>
                        </>)}
                    </div>
                </div>

                <div className="udm-scroll">
                    {loading ? (
                        <div className="udm-state-box">
                            <div className="st-icon">
                                <i className="fa-solid fa-circle-notch fa-spin" style={{ color:'#3b82f6' }} />
                            </div>
                            <h4>Loading records…</h4>
                            <p>Fetching rejection data from the database.</p>
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="udm-state-box">
                            <div className="st-icon"><i className="fa-solid fa-inbox" /></div>
                            <h4>No records found</h4>
                            <p>No rejections have been synced yet. Enter a date and click <strong>Manual Sync</strong> to fetch from CRIS.</p>
                        </div>
                    ) : (
                        <table className="udm-table">
                            <thead>
                                <tr>
                                    <th style={{whiteSpace:'normal',textAlign:'center',lineHeight:1.3}}>Sr<br/>No.</th>
                                    <th>Rejection Details</th>
                                    <th>Item / PL No.</th>
                                    <th>Firm</th>
                                    <th>Qty / Value</th>
                                    <th>IC No. / Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((r, i) => (
                                    <tr key={r.rejectionNumber || i}>
                                        <td className="td-muted td-num">{(safePage - 1) * pageSize + i + 1}</td>
                                        <td>
                                            <div className="td-main">{r.rejectionNumber || '—'}</div>
                                            {r.rejectionDate && <div className="td-sub">{fmtDate(r.rejectionDate)}</div>}
                                            {(r.poNumber || r.poSerialNumber) && (
                                                <div className="td-sub">
                                                    {r.poNumber && <>PO: {r.poNumber}</>}
                                                    {r.poNumber && r.poSerialNumber && <> &nbsp;·&nbsp; </>}
                                                    {r.poSerialNumber && <>Sr: {r.poSerialNumber}</>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="td-clamp">
                                            <div className="td-main td-truncate" title={r.itemDescription}>{r.itemDescription || '—'}</div>
                                            {r.plNumber && <div className="td-sub">PL: {r.plNumber}</div>}
                                        </td>
                                        <td className="td-clamp">
                                            <div className="td-truncate td-main" title={r.vendorName}>{r.vendorName || '—'}</div>
                                            {r.vendorCode && <div className="td-sub">{cleanVCode(r.vendorCode)}</div>}
                                        </td>
                                        <td className="td-nowrap">
                                            {r.rejectedQty
                                                ? <div className="td-main">{Number(r.rejectedQty).toLocaleString('en-IN')} <span className="td-sub" style={{display:'inline'}}>{r.uom}</span></div>
                                                : <div className="td-muted">—</div>}
                                            {fmtVal(r.rejectionValue)
                                                ? <div className="td-sub">{fmtVal(r.rejectionValue)}</div>
                                                : null}
                                        </td>
                                        <td className="td-nowrap">
                                            {r.icNumber
                                                ? <div className="td-main">{r.icNumber}</div>
                                                : <div className="td-muted">—</div>}
                                            {r.icDate && <div className="td-sub">{fmtDate(r.icDate)}</div>}
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

                {/* ── Pagination bar ── */}
                {visible.length > 0 && (
                    <div className="udm-pagination">
                        <div className="udm-pg-left">
                            <span className="udm-pg-label">Rows per page</span>
                            <select
                                className="udm-pg-select"
                                value={pageSize}
                                onChange={e => handlePageSize(e.target.value)}
                            >
                                {[5, 10, 15, 20].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <span className="udm-pg-info">
                                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, visible.length)} of {visible.length}
                            </span>
                        </div>
                        <div className="udm-pg-right">
                            <button
                                className="udm-pg-btn"
                                onClick={() => setPage(1)}
                                disabled={safePage === 1}
                                title="First page"
                            >
                                <i className="fa-solid fa-angles-left" />
                            </button>
                            <button
                                className="udm-pg-btn"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                title="Previous page"
                            >
                                <i className="fa-solid fa-angle-left" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                .reduce((acc, p, idx, arr) => {
                                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, idx) =>
                                    p === '…'
                                        ? <span key={`e${idx}`} className="udm-pg-ellipsis">…</span>
                                        : <button
                                            key={p}
                                            className={`udm-pg-btn udm-pg-num${p === safePage ? ' active' : ''}`}
                                            onClick={() => setPage(p)}
                                        >{p}</button>
                                )
                            }
                            <button
                                className="udm-pg-btn"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                title="Next page"
                            >
                                <i className="fa-solid fa-angle-right" />
                            </button>
                            <button
                                className="udm-pg-btn"
                                onClick={() => setPage(totalPages)}
                                disabled={safePage === totalPages}
                                title="Last page"
                            >
                                <i className="fa-solid fa-angles-right" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {detail && <DetailModal r={detail} onClose={() => setDetail(null)} />}

            {showSyncModal && (
                <div className="udm-overlay" onClick={e => { if (e.target === e.currentTarget && !syncing) setShowSyncModal(false); }}>
                    <div className="udm-modal udm-sync-modal">
                        <div className="udm-mhead">
                            <div className="udm-mhead-top">
                                <div className="udm-mhead-text">
                                    <h3>
                                        <i className="fa-solid fa-rotate" style={{marginRight:8,fontSize:15}} />
                                        Manual Sync from CRIS
                                    </h3>
                                    <p style={{color:'#94a3b8',fontSize:12,marginTop:4}}>
                                        Select a date to fetch and store rejection records from CRIS IREPS.
                                    </p>
                                </div>
                                {!syncing && (
                                    <button className="btn-mclose" onClick={() => setShowSyncModal(false)}>
                                        <i className="fa-solid fa-xmark" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="udm-mbody" style={{padding:'20px 24px'}}>
                            <div className="udm-filter-field" style={{marginBottom:20}}>
                                <label style={{display:'block',marginBottom:6,fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                                    <i className="fa-regular fa-calendar" style={{marginRight:6}} />
                                    Rejection Date
                                </label>
                                <input
                                    type="date"
                                    className="udm-input-base"
                                    value={syncDate}
                                    onChange={e => { setSyncDate(e.target.value); setSyncNoData(false); setError(null); }}
                                    onKeyDown={e => e.key === 'Enter' && syncDate && handleSync()}
                                    disabled={syncing}
                                    style={{width:'100%',maxWidth:260}}
                                />
                            </div>

                            {syncNoData && (
                                <div className="udm-sync-nodata">
                                    <i className="fa-solid fa-circle-info" />
                                    <div>
                                        <div style={{fontWeight:700}}>No data found</div>
                                        <div style={{fontSize:11,marginTop:2,opacity:0.8}}>
                                            CRIS IREPS returned no rejection records for <strong>{syncDate}</strong>.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="udm-error" style={{marginBottom:16}}>
                                    <i className="fa-solid fa-circle-exclamation" /> {error}
                                </div>
                            )}

                            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                                <button className="btn-udm-clear" onClick={() => setShowSyncModal(false)} disabled={syncing}>
                                    Cancel
                                </button>
                                <button
                                    className="btn-udm-apply"
                                    onClick={handleSync}
                                    disabled={!syncDate || syncing}
                                    style={{minWidth:110}}
                                >
                                    {syncing
                                        ? <><i className="fa-solid fa-circle-notch fa-spin" /> Syncing…</>
                                        : <><i className="fa-solid fa-rotate" /> Sync</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
    const pdfUrl   = r.pdfPath
        ? (r.pdfPath.startsWith('http') ? r.pdfPath : `${IREPS_BASE}${r.pdfPath}`)
        : null;
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
