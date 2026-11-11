import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './UdmRejectionDashboard.css';
import { syncUdmRejections, getUdmSyncHistory } from '../../services/udmRejectionService';
import { getUdmComplaintList, downloadMergedComplaintPdf } from '../../services/udmComplaintService';
import {
    ComplaintStatusChip, ComplaintActionFooter, ComplaintTimeline, SendToCmModal, CloseComplaintModal,
    useToast, isClosed, COMPLAINT_STATUS,
} from './UdmComplaintActions';
import { CmActionButton, ComplaintDocuments } from './UdmCmStageForms';
import { SbuReviewButton, RbReviewButton } from './UdmSbuReview';

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

/** Dashboard mode → server list "view" (the backend checks the user holds that role). */
const VIEW_OF_MODE = { complaintCell: 'cc', cm: 'cm', sbu: 'sbu', rb: 'rb', board: 'board' };
const EXPORT_PAGE_SIZE = 500;
const EMPTY_COUNTS = { pendingCount: 0, closedCount: 0, mineCount: 0, allCount: 0 };

/* ─── Main ──────────────────────────────────────────────────────── */
/**
 * mode:
 *  - 'board'         Railway Board / default: view only (tabs + status)
 *  - 'complaintCell' Complaint Cell: can Send to CM / Close from the View modal
 *  - 'cm'            Controlling Manager: only complaints assigned to the logged-in CM, view only
 */
export default function UdmRejectionDashboard({ mode = 'board' }) {
    const canAct = mode === 'complaintCell';
    const cmMode = mode === 'cm';
    const sbuMode = mode === 'sbu';
    const rbMode = mode === 'rb';
    const reviewerMode = sbuMode || rbMode;   // "Pending with Me" = waiting for this role's review
    const ccMode = canAct;                    // Complaint Cell: "Pending with Me" = not forwarded yet
    const pendingWithMeMode = reviewerMode || ccMode;
    const personalMode = cmMode || pendingWithMeMode;   // "mine" vs "all" scope toolbar
    const currentUserId = (() => { try { return Number(localStorage.getItem('userId')) || null; } catch (_) { return null; } })();

    const [tab,      setTab]      = useState('pending');
    const [cmScope,  setCmScope]  = useState('mine'); // CM only: 'mine' | 'all'
    const [sendFor,  setSendFor]  = useState(null);
    const [closeFor, setCloseFor] = useState(null);
    const [tlKey,    setTlKey]    = useState(0);
    const toast = useToast();

    const [rows,          setRows]          = useState([]);            // current server page
    const [total,         setTotal]         = useState(0);             // rows in current scope + tab + search
    const [totalPages,    setTotalPages]    = useState(1);
    const [counts,        setCounts]        = useState(EMPTY_COUNTS);
    const [reloadKey,     setReloadKey]     = useState(0);
    const [search,        setSearch]        = useState('');
    const [debouncedQ,    setDebouncedQ]    = useState('');
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
    const [showHistory,   setShowHistory]   = useState(false);

    const view  = VIEW_OF_MODE[mode] || 'board';
    const scope = personalMode ? cmScope : 'all';

    // Search is sent to the server after the user pauses typing
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    /** One page of the role-scoped list + badge counts (server-side paging / filtering). */
    useEffect(() => {
        let alive = true;
        setLoading(true); setError(null);
        getUdmComplaintList({ view, scope, tab, page: page - 1, size: pageSize, q: debouncedQ })
            .then(d => {
                if (!alive) return;
                setRows(d?.content || []);
                setTotal(d?.totalElements || 0);
                setTotalPages(Math.max(1, d?.totalPages || 1));
                setCounts({ ...EMPTY_COUNTS, ...(d || {}) });
                if (d && typeof d.page === 'number' && d.page + 1 !== page) setPage(d.page + 1);
            })
            .catch(e => { if (alive) { setRows([]); setTotal(0); setError(e.message || 'Failed to fetch rejection data.'); } })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [view, scope, tab, page, pageSize, debouncedQ, reloadKey]);

    const fetchData = useCallback(() => setReloadKey(k => k + 1), []);

    /** Every row of the current scope + tab + search (for Excel / PDF), fetched page by page. */
    const fetchAllForExport = async () => {
        const all = [];
        for (let p = 0; p < 200; p++) {
            const d = await getUdmComplaintList({ view, scope, tab, page: p, size: EXPORT_PAGE_SIZE, q: debouncedQ });
            all.push(...(d?.content || []));
            if (!d || p + 1 >= (d.totalPages || 1)) break;
        }
        return all;
    };

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
            if (res.status === 'FAILED') {
                // Show why it failed (CRIS login, CRIS down, save error...) instead of "no data"
                setError(`Sync failed: ${res.errorMessage || 'unknown reason'}`);
            } else if (saved === 0) {
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

    const exportExcel = async () => {
        let all;
        try { all = await fetchAllForExport(); } catch (e) { toast.show(e.message || 'Export failed.', 'error'); return; }
        const data = all.map((r, i) => ({
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
            'Complaint Status':    (COMPLAINT_STATUS[r.complaintStatus] || {}).label || r.complaintStatus || '',
            'Assigned RIO':        r.assignedRio      || '',
            'Assigned CM':         r.assignedCmName   || '',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'UDM Rejections');

        // Auto column widths
        const cols = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length, 14) }));
        ws['!cols'] = cols;

        const filename = `UDM_Rejections_${tab}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    // CM can view all rejections, but may act only on those assigned to them
    const isAssignedToMe = r => Boolean(currentUserId && Number(r?.assignedCmUserId) === currentUserId);
    // SBU Head: complaints waiting for SBU review (any SBU Head can act)
    const isPendingWithSbu = r => ['CAPA_SUBMITTED', 'RETURNED_TO_SBU'].includes(r?.complaintStatus);
    // Railway Board: complaints forwarded by the SBU Head (any Railway Board user can act)
    const isPendingWithRb = r => r?.complaintStatus === 'SENT_TO_RAILWAY_BOARD';
    // Complaint Cell: not yet forwarded to a CM
    const isPendingWithCc = r => (r?.complaintStatus || 'PENDING_WITH_COMPLAINT_CELL') === 'PENDING_WITH_COMPLAINT_CELL';
    const isMine = cmMode ? isAssignedToMe : rbMode ? isPendingWithRb : ccMode ? isPendingWithCc : isPendingWithSbu;
    // Badge counts come from the server (role-scoped; "mine" closed for SBU/RB = closed after their review)
    const assignedCount = counts.mineCount;
    const allCount      = counts.allCount;
    const pendingCount  = counts.pendingCount;
    const closedCount   = counts.closedCount;

    /** Apply a complaint action result to the row in place (no full reload). */
    const applyActionResult = (res, message) => {
        if (res && res.udmRejectionId != null) {
            const patch = {
                complaintStatus:  res.complaintStatus,
                pendingWith:      res.pendingWith,
                assignedRio:      res.assignedRio,
                assignedCmUserId: res.assignedCmUserId,
                assignedCmName:   res.assignedCmName,
                complaintRemarks: res.lastRemarks,
            };
            setRows(prev => prev.map(x => (x.id === res.udmRejectionId ? { ...x, ...patch } : x)));
            setDetail(d => (d && d.id === res.udmRejectionId ? { ...d, ...patch } : d));
        }
        setSendFor(null);
        setCloseFor(null);
        setTlKey(k => k + 1);
        setReloadKey(k => k + 1);   // row may move tab / scope: refresh page + counts from the server
        toast.show(message);
    };

    const downloadPdf = async () => {
        let visible;
        try { visible = await fetchAllForExport(); } catch (e) { toast.show(e.message || 'Export failed.', 'error'); return; }
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('UDM / IMMS Consignee Rejections', 40, 36);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}  ·  Total records: ${total}`, 40, 52);

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

    // Server-side paging: rows already hold just this page
    const safePage = Math.min(page, totalPages);
    const pageRows = rows;

    const handleSearch   = v => { setSearch(v); setPage(1); };
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
                {personalMode ? (
                    /* ── CM / SBU toolbar: scope tabs + exports / status + search ── */
                    <div className="ucm-head">
                        <div className="ucm-row">
                            <div className="ucm-scope" role="tablist" aria-label="Complaint scope">
                                <button type="button" role="tab" aria-selected={cmScope === 'mine'}
                                    className={`ucm-scope-tab ${cmScope === 'mine' ? 'on' : ''}`}
                                    onClick={() => { setCmScope('mine'); setPage(1); }}>
                                    <i className={`fa-solid ${pendingWithMeMode ? 'fa-user-shield' : 'fa-user-check'}`} /> {pendingWithMeMode ? 'Pending with Me' : 'Assigned to Me'}
                                    <span className="ucm-count">{assignedCount}</span>
                                </button>
                                <button type="button" role="tab" aria-selected={cmScope === 'all'}
                                    className={`ucm-scope-tab ${cmScope === 'all' ? 'on' : ''}`}
                                    onClick={() => { setCmScope('all'); setPage(1); }}>
                                    <i className="fa-solid fa-layer-group" /> All Rejections
                                    <span className="ucm-count">{allCount}</span>
                                </button>
                            </div>
                            {(total > 0 || ccMode) && (
                                <div className="ucm-exports">
                                    {ccMode && (
                                        <button className="btn-udm-sync" onClick={openSyncModal} disabled={syncing || loading}>
                                            <i className="fa-solid fa-rotate" /> <span>Manual Sync</span>
                                        </button>
                                    )}
                                    {total > 0 && (<>
                                        <button className="btn-udm-pdf" onClick={downloadPdf}>
                                            <i className="fa-solid fa-file-pdf" /> <span>PDF</span>
                                        </button>
                                        <button className="btn-udm-excel" onClick={exportExcel}>
                                            <i className="fa-solid fa-file-excel" /> <span>Excel</span>
                                        </button>
                                    </>)}
                                </div>
                            )}
                        </div>
                        <div className="ucm-row ucm-row-filters">
                            <div className="ucx-tabs" role="tablist" aria-label="Complaint status">
                                <button type="button" role="tab" aria-selected={tab === 'pending'}
                                    className={`ucx-tab ${tab === 'pending' ? 'is-active' : ''}`}
                                    onClick={() => { setTab('pending'); setPage(1); }}>
                                    <i className="fa-solid fa-hourglass-half" /> Pending <span className="ucx-tab-count">{pendingCount}</span>
                                </button>
                                <button type="button" role="tab" aria-selected={tab === 'closed'}
                                    className={`ucx-tab ${tab === 'closed' ? 'is-active' : ''}`}
                                    onClick={() => { setTab('closed'); setPage(1); }}>
                                    <i className="fa-solid fa-circle-check" /> Closed <span className="ucx-tab-count">{closedCount}</span>
                                </button>
                            </div>
                            <span className="ucm-showing">Showing <strong>{total}</strong> {tab === 'closed' ? 'closed' : 'pending'}</span>
                            <div className="udm-gsearch-wrap ucm-search">
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
                    </div>
                ) : (
                <div className="udm-panel-head">
                    <div className="udm-panel-head-left">
                        <div className="udm-panel-title">
                            <i className="fa-solid fa-table-list" style={{ color:'#94a3b8' }} />
                            Rejection Records
                            <span className="udm-count-pill">{total}</span>
                        </div>
                        <div className="ucx-tabs" role="tablist" aria-label="Complaint status">
                            <button type="button" role="tab" aria-selected={tab === 'pending'}
                                className={`ucx-tab ${tab === 'pending' ? 'is-active' : ''}`}
                                onClick={() => { setTab('pending'); setPage(1); }}>
                                <i className="fa-solid fa-hourglass-half" /> Pending <span className="ucx-tab-count">{pendingCount}</span>
                            </button>
                            <button type="button" role="tab" aria-selected={tab === 'closed'}
                                className={`ucx-tab ${tab === 'closed' ? 'is-active' : ''}`}
                                onClick={() => { setTab('closed'); setPage(1); }}>
                                <i className="fa-solid fa-circle-check" /> Closed <span className="ucx-tab-count">{closedCount}</span>
                            </button>
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
                        {/* Sync History button hidden for now; runs are still recorded in udm_sync_log.
                            To show it again, render a button that calls setShowHistory(true). */}
                        {total > 0 && (<>
                            <button className="btn-udm-pdf" onClick={downloadPdf}>
                                <i className="fa-solid fa-file-pdf" /> Download PDF
                            </button>
                            <button className="btn-udm-excel" onClick={exportExcel}>
                                <i className="fa-solid fa-file-excel" /> Export Excel
                            </button>
                        </>)}
                    </div>
                </div>
                )}

                <div className="udm-scroll">
                    {loading ? (
                        <div className="udm-state-box">
                            <div className="st-icon">
                                <i className="fa-solid fa-circle-notch fa-spin" style={{ color:'#3b82f6' }} />
                            </div>
                            <h4>Loading records…</h4>
                            <p>Fetching rejection data from the database.</p>
                        </div>
                    ) : total === 0 ? (
                        <div className="udm-state-box">
                            <div className="st-icon"><i className="fa-solid fa-inbox" /></div>
                            <h4>{search ? 'No matching records' : tab === 'closed' ? 'No closed complaints'
                                : cmMode ? 'No complaints assigned to you' : pendingWithMeMode && cmScope === 'mine' ? 'Nothing pending with you' : 'No records found'}</h4>
                            <p>
                                {search ? 'Try a different search.'
                                    : tab === 'closed' ? 'Complaints approved by the Railway Board or closed by the Complaint Cell will appear here.'
                                    : cmMode ? 'Complaints sent to you by the Complaint Cell will appear here.'
                                    : sbuMode ? 'Complaints with CAPA submitted by the CM will appear here for your review.'
                                    : rbMode ? 'Complaints forwarded by the SBU Head will appear here for approval.'
                                    : ccMode && cmScope === 'mine' ? 'New UDM complaints that are not yet forwarded to a CM will appear here.'
                                    : <>No rejections have been synced yet. Enter a date and click <strong>Manual Sync</strong> to fetch from CRIS.</>}
                            </p>
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
                                    <th>Status</th>
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
                                        <td className="ucx-td-status">
                                            <ComplaintStatusChip r={r} />
                                            {personalMode && cmScope === 'all' && isMine(r) && (
                                                <span className="ucx-mine-badge"><i className="fa-solid fa-user-check" /> {ccMode ? 'To forward' : reviewerMode ? 'Awaiting your review' : 'Assigned to you'}</span>
                                            )}
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
                {total > 0 && (
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
                                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, total)} of {total}
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

            {/* Portals: some dashboards wrap this screen in an animated (transformed) container, which would make
                a position:fixed overlay size itself to that container instead of the window → bottom cut off. */}
            {detail && createPortal(
                <DetailModal
                    r={detail}
                    onClose={() => setDetail(null)}
                    canAct={canAct}
                    viewOnlyNote={cmMode && !isAssignedToMe(detail)
                        ? 'View only — this complaint is not assigned to you.'
                        : ''}
                    cmAct={cmMode && isAssignedToMe(detail) && !isClosed(detail)}
                    sbuAct={sbuMode && isPendingWithSbu(detail)}
                    rbAct={rbMode && isPendingWithRb(detail)}
                    onCmDone={applyActionResult}
                    timelineKey={tlKey}
                    onSend={() => setSendFor(detail)}
                    onCloseComplaint={() => setCloseFor(detail)}
                />,
                document.body
            )}
            {sendFor && createPortal(<SendToCmModal r={sendFor} onCancel={() => setSendFor(null)} onDone={applyActionResult} />, document.body)}
            {closeFor && createPortal(<CloseComplaintModal r={closeFor} onCancel={() => setCloseFor(null)} onDone={applyActionResult} />, document.body)}
            {toast.node && createPortal(toast.node, document.body)}

            {showHistory && <SyncHistoryModal onClose={() => setShowHistory(false)} />}

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

/* ─── Download Merged PDF (rejection PDF + timeline + documents) ─── */
function MergedPdfButton({ r }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const download = async () => {
        if (busy) return;
        setBusy(true); setErr('');
        try {
            const { blob, fileName } = await downloadMergedComplaintPdf(r.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e) {
            setErr(e.message || 'Could not prepare the merged PDF.');
        } finally {
            setBusy(false);
        }
    };
    return (
        <button type="button" className="udm-dm-pdf udm-dm-merged" onClick={download} disabled={busy}
            title={err || 'Download one PDF: rejection document + complaint timeline + uploaded documents'}>
            {busy ? <span className="ucx-spinner" /> : <i className={`fa-solid ${err ? 'fa-circle-exclamation' : 'fa-file-zipper'}`} />}
            <span>{busy ? 'Preparing…' : 'Merged PDF'}</span>
        </button>
    );
}
MergedPdfButton.propTypes = { r: PropTypes.object.isRequired };

/* ─── Detail Modal ───────────────────────────────────────────── */
function DetailModal({ r, onClose, canAct = false, viewOnlyNote = '', cmAct = false, sbuAct = false, rbAct = false, onCmDone, timelineKey = 0, onSend, onCloseComplaint }) {
    const pdfUrl   = r.pdfPath
        ? (r.pdfPath.startsWith('http') ? r.pdfPath : `${IREPS_BASE}${r.pdfPath}`)
        : null;
    const typeSlug = (r.typeOfRejection || '').toLowerCase();
    const qty      = r.rejectedQty ? `${Number(r.rejectedQty).toLocaleString('en-IN')} ${r.uom || ''}` : null;
    const [tab, setTab] = useState('details');

    return (
        <div className="udm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="udm-modal udm-dm" role="dialog" aria-modal="true" aria-labelledby="udm-dm-title">

                {/* ── Light header ── */}
                <div className="udm-dm-head">
                    <div className="udm-dm-top">
                        <span className="udm-dm-icon"><i className="fa-solid fa-triangle-exclamation" /></span>
                        <div className="udm-dm-titles">
                            <h3 id="udm-dm-title">Consignee Rejection</h3>
                            <div className="udm-dm-chips">
                                {r.rejectionNumber && <span className="udm-dm-chip mono">{r.rejectionNumber}</span>}
                                {r.typeOfRejection && (
                                    <span className={`udm-dm-chip ${typeSlug === 'warranty' ? 'red' : typeSlug === 'initial' ? 'amber' : ''}`}>
                                        {r.typeOfRejection}
                                    </span>
                                )}
                                {r.source && <span className="udm-dm-chip">{r.source}</span>}
                                {r.status && <span className="udm-dm-chip red"><i className="fa-solid fa-circle" style={{ fontSize: 6 }} /> {r.status === 'RJ' ? 'Rejected' : r.status}</span>}
                            </div>
                        </div>
                        <div className="udm-dm-tools">
                            {pdfUrl && (
                                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="udm-dm-pdf" title="View Rejection Document (PDF)">
                                    <i className="fa-solid fa-file-pdf" /><span>PDF</span>
                                </a>
                            )}
                            <MergedPdfButton r={r} />
                            <button type="button" className="udm-dm-x" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
                        </div>
                    </div>

                    {/* KPI tiles */}
                    <div className="udm-dm-kpis">
                        <div className="udm-dm-kpi"><span>Rejected Qty</span><strong className="blue">{qty || '—'}</strong></div>
                        <div className="udm-dm-kpi"><span>Rejection Value</span><strong className="green">{fmtVal(r.rejectionValue) || '—'}</strong></div>
                        <div className="udm-dm-kpi"><span>Rejection Date</span><strong>{fmtDate(r.rejectionDate) || '—'}</strong></div>
                        <div className="udm-dm-kpi"><span>IC Number</span><strong title={r.icNumber}>{r.icNumber || '—'}</strong></div>
                    </div>

                    {/* Tabs */}
                    <div className="udm-dm-tabs" role="tablist">
                        <button type="button" role="tab" aria-selected={tab === 'details'}
                            className={`udm-dm-tab ${tab === 'details' ? 'on' : ''}`} onClick={() => setTab('details')}>
                            <i className="fa-solid fa-list-ul" /> Details
                        </button>
                        <button type="button" role="tab" aria-selected={tab === 'timeline'}
                            className={`udm-dm-tab ${tab === 'timeline' ? 'on' : ''}`} onClick={() => setTab('timeline')}>
                            <i className="fa-solid fa-timeline" /> Complaint Timeline
                        </button>
                        <button type="button" role="tab" aria-selected={tab === 'documents'}
                            className={`udm-dm-tab ${tab === 'documents' ? 'on' : ''}`} onClick={() => setTab('documents')}>
                            <i className="fa-solid fa-folder-open" /> Documents
                        </button>
                    </div>
                </div>

                {/* ── Scrollable body ── */}
                <div className="udm-dm-body">
                    {tab === 'details' ? (
                        <>
                            {r.reasonForRejection && (
                                <div className="udm-dm-reason">
                                    <i className="fa-solid fa-circle-exclamation" />
                                    <div>
                                        <span>Reason for Rejection</span>
                                        <p>{r.reasonForRejection}</p>
                                    </div>
                                </div>
                            )}

                            <div className="udm-dm-grid2">
                                <div className="udm-msect">
                                    <div className="udm-msect-title"><i className="fa-solid fa-circle-info" /> Rejection</div>
                                    <div className="udm-fg">
                                        <Fv l="Inspection Agency"   v={r.inspectionAgency} />
                                        <Fv l="Consignee"           v={r.consignee} />
                                        <Fv l="Material Recd. Date" v={fmtDate(r.materialReceivedDate)} />
                                    </div>
                                </div>
                                <div className="udm-msect">
                                    <div className="udm-msect-title"><i className="fa-solid fa-industry" /> Vendor / Supplier</div>
                                    <div className="udm-fg">
                                        <Fv l="Vendor Code" v={cleanVCode(r.vendorCode)} />
                                        <Fv l="Firm Name"   v={r.vendorName} />
                                        <Fv l="UOM"         v={r.uom} />
                                    </div>
                                </div>
                            </div>

                            <div className="udm-msect">
                                <div className="udm-msect-title"><i className="fa-solid fa-file-contract" /> PO &amp; Inspection</div>
                                <div className="udm-fg">
                                    <Fv l="PO Number"     v={r.poNumber} />
                                    <Fv l="PO Date"       v={fmtDate(r.poDate)} />
                                    <Fv l="PO Serial No." v={r.poSerialNumber} />
                                    <Fv l="PL Number"     v={r.plNumber} />
                                    <Fv l="IC Date"       v={fmtDate(r.icDate)} />
                                </div>
                                {r.itemDescription && (
                                    <details className="udm-dm-desc">
                                        <summary>Item Description</summary>
                                        <p>{r.itemDescription}</p>
                                    </details>
                                )}
                            </div>
                        </>
                    ) : tab === 'timeline' ? (
                        <div className="udm-msect udm-dm-tl">
                            <ComplaintTimeline rejectionId={r.id} refreshKey={timelineKey} receivedDate={r.fetchedDate} />
                        </div>
                    ) : (
                        <div className="udm-msect udm-dm-tl">
                            <ComplaintDocuments rejectionId={r.id} refreshKey={timelineKey} />
                        </div>
                    )}
                </div>

                {/* Complaint status + actions (Send to CM / Close for Complaint Cell) */}
                <ComplaintActionFooter r={r} canAct={canAct} viewOnlyNote={viewOnlyNote} onSend={onSend} onClose={onCloseComplaint}
                    extraActions={cmAct ? <CmActionButton r={r} refreshKey={timelineKey} onDone={onCmDone} />
                        : sbuAct ? <SbuReviewButton r={r} refreshKey={timelineKey} onDone={onCmDone} />
                        : rbAct ? <RbReviewButton r={r} refreshKey={timelineKey} onDone={onCmDone} /> : null} />
            </div>
        </div>
    );
}

DetailModal.propTypes = {
    r: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    canAct: PropTypes.bool,
    viewOnlyNote: PropTypes.string,
    cmAct: PropTypes.bool,
    sbuAct: PropTypes.bool,
    rbAct: PropTypes.bool,
    onCmDone: PropTypes.func,
    timelineKey: PropTypes.number,
    onSend: PropTypes.func,
    onCloseComplaint: PropTypes.func,
};
UdmRejectionDashboard.propTypes = { mode: PropTypes.oneOf(['board', 'complaintCell', 'cm', 'sbu', 'rb']) };
F.propTypes          = { l: PropTypes.string.isRequired, v: PropTypes.any };
Dropdown.propTypes   = {
    label: PropTypes.string, value: PropTypes.string,
    onChange: PropTypes.func.isRequired, options: PropTypes.array.isRequired,
    placeholder: PropTypes.string, minWidth: PropTypes.number,
};

/* ─── Sync history (daily scheduler + manual syncs) ──────────── */
const SYNC_STATUS = {
    SUCCESS: { label: 'Success', bg: '#dcfce7', color: '#166534' },
    NO_DATA: { label: 'No data', bg: '#f1f5f9', color: '#475569' },
    PARTIAL: { label: 'Partial', bg: '#fef3c7', color: '#92400e' },
    FAILED:  { label: 'Failed',  bg: '#fee2e2', color: '#991b1b' },
    RUNNING: { label: 'Running', bg: '#dbeafe', color: '#1e40af' },
};

// Times come with their offset; always show them in IST
const fmtIst = s => {
    if (!s) return '—';
    const d = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(s) ? s : `${s}+05:30`);
    return isNaN(d) ? s : d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

const thS = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', position: 'sticky', top: 0 };
const tdS = { padding: '10px 12px', fontSize: 13, color: '#1e293b', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };

function SyncHistoryModal({ onClose }) {
    const [runs, setRuns]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    const load = useCallback(() => {
        setLoading(true); setError(null);
        getUdmSyncHistory(50)
            .then(d => setRuns(Array.isArray(d) ? d : []))
            .catch(e => setError(e.message || 'Failed to load sync history.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="udm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="udm-modal" style={{ maxWidth: 1100, width: '100%' }}>
                <div className="udm-mhead">
                    <div className="udm-mhead-top">
                        <div className="udm-mhead-text">
                            <h3>
                                <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8, fontSize: 15 }} />
                                Sync History
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                                Every CRIS sync: the daily 02:00 run and manual syncs, latest first (times in IST).
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-mclose" onClick={load} title="Refresh" disabled={loading}>
                                <i className={`fa-solid fa-rotate${loading ? ' fa-spin' : ''}`} />
                            </button>
                            <button className="btn-mclose" onClick={onClose} title="Close">
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="udm-mbody" style={{ padding: 0, maxHeight: '65vh', overflow: 'auto' }}>
                    {error && (
                        <div className="udm-error" style={{ margin: 16 }}>
                            <i className="fa-solid fa-circle-exclamation" /> {error}
                        </div>
                    )}
                    {!error && loading && runs.length === 0 && (
                        <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading sync history…</div>
                    )}
                    {!error && !loading && runs.length === 0 && (
                        <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                            No sync runs recorded yet. The next daily run (02:00) or a Manual Sync will appear here.
                        </div>
                    )}
                    {runs.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                            <thead>
                                <tr>
                                    <th style={thS}>Started</th>
                                    <th style={thS}>Rejection Date</th>
                                    <th style={thS}>Triggered By</th>
                                    <th style={thS}>Status</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>Received</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>New</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>Updated</th>
                                    <th style={{ ...thS, textAlign: 'right' }}>Failed</th>
                                    <th style={thS}>Reason / Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {runs.map(r => {
                                    const st = SYNC_STATUS[r.status] || { label: r.status || '—', bg: '#f1f5f9', color: '#475569' };
                                    return (
                                        <tr key={r.id}>
                                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                                                {fmtIst(r.startedAt)}
                                                {r.durationMs != null && (
                                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{(r.durationMs / 1000).toFixed(1)} s</div>
                                                )}
                                            </td>
                                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{r.syncDate || '—'}</td>
                                            <td style={tdS}>
                                                {r.triggerType === 'SCHEDULER'
                                                    ? <span><i className="fa-solid fa-robot" style={{ marginRight: 6, color: '#64748b' }} />Daily scheduler</span>
                                                    : <span><i className="fa-solid fa-user" style={{ marginRight: 6, color: '#64748b' }} />{r.triggeredBy || 'Manual'}</span>}
                                            </td>
                                            <td style={tdS}>
                                                <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ ...tdS, textAlign: 'right' }}>{r.recordsReceived ?? '—'}</td>
                                            <td style={{ ...tdS, textAlign: 'right' }}>{r.recordsNew ?? '—'}</td>
                                            <td style={{ ...tdS, textAlign: 'right' }}>{r.recordsUpdated ?? '—'}</td>
                                            <td style={{ ...tdS, textAlign: 'right', color: r.recordsFailed ? '#b91c1c' : undefined }}>{r.recordsFailed ?? '—'}</td>
                                            <td style={{ ...tdS, maxWidth: 360, wordBreak: 'break-word', color: r.status === 'FAILED' ? '#b91c1c' : '#475569' }}>
                                                {r.errorMessage || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

SyncHistoryModal.propTypes = { onClose: PropTypes.func.isRequired };
