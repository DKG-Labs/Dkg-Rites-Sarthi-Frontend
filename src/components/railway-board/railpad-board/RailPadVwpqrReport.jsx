import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel } from '../SharedComponents';
import Pagination from '../../Pagination';
import reportService from '../../../services/reportService';
import '../erc-board/ProcessInspectionQualityTable.css';
import './RailPadQualityReport.css';

const COLS = 6;

// rejectionPercent may arrive as number or "0.92%"
const toPct = (v) => {
    const n = parseFloat(String(v ?? '').replace('%', ''));
    return Number.isFinite(n) ? n : 0;
};

const RailPadVwpqrReport = ({ refreshTick = 0 }) => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filters state
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Load report data when filters change
    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const params = { startDate, endDate };
                const res = await reportService.getRailPadVendorWiseQualityReport(params);
                const data = res?.responseData || res || [];
                setReportData(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching VWPQR report:", err);
                setReportData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [startDate, endDate, refreshTick]);

    useEffect(() => { setPage(0); }, [searchQuery, startDate, endDate, refreshTick]);

    const filteredData = reportData.filter(r =>
        !searchQuery || (r.manufacture || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const pageStart = page * rowsPerPage;
    const pagedData = filteredData.slice(pageStart, pageStart + rowsPerPage);

    const totals = filteredData.reduce((a, r) => {
        a.inspected += Number(r.totalInspected) || 0;
        a.accepted += Number(r.totalAccepted) || 0;
        a.rejected += Number(r.totalRejected) || 0;
        return a;
    }, { inspected: 0, accepted: 0, rejected: 0 });
    const overallPct = totals.inspected > 0 ? (totals.rejected * 100) / totals.inspected : 0;

    const handleExport = () => {
        const headers = [
            { label: 'MANUFACTURER & PLANT', key: 'manufacture' },
            { label: 'TOTAL INSPECTED (NOS.)', key: 'totalInspected' },
            { label: 'TOTAL ACCEPTED (NOS.)', key: 'totalAccepted' },
            { label: 'TOTAL REJECTED (NOS.)', key: 'totalRejected' },
            { label: 'REJECTION %', key: 'rejectionPercent' }
        ];
        downloadExcel(filteredData, headers, 'RailPad_Vendor_Wise_Process_Quality_Report');
    };

    const num = (v) => (Number(v) || 0).toLocaleString();
    const tone = (p) => p >= 2
        ? { color: '#b91c1c', background: 'rgba(254, 226, 226, 0.85)', borderColor: 'rgba(252, 165, 165, 0.6)', bar: 'linear-gradient(90deg,#f87171,#ef4444)' }
        : p >= 1
            ? { color: '#b45309', background: 'rgba(254, 243, 199, 0.9)', borderColor: 'rgba(252, 211, 77, 0.6)', bar: 'linear-gradient(90deg,#fbbf24,#f59e0b)' }
            : { color: '#15803d', background: 'rgba(220, 252, 231, 0.85)', borderColor: 'rgba(134, 239, 172, 0.7)', bar: 'linear-gradient(90deg,#22c55e,#0d9488)' };

    // Split "Firm, Firm-City - Plant" into a bold vendor + muted plant line
    const splitName = (s) => {
        const txt = s || '';
        const i = txt.lastIndexOf(' - ');
        return i > 0 ? [txt.slice(0, i), txt.slice(i + 3)] : [txt, ''];
    };

    const kpis = [
        { label: 'Vendors / Plants', value: filteredData.length.toLocaleString(), icon: 'fa-industry', tone: '#7c3aed' },
        { label: 'Total Inspected', value: `${num(totals.inspected)} Nos.`, icon: 'fa-magnifying-glass', tone: '#1d4ed8' },
        { label: 'Total Accepted', value: `${num(totals.accepted)} Nos.`, icon: 'fa-circle-check', tone: '#15803d' },
        { label: 'Overall Rejection', value: `${overallPct.toFixed(2)}%`, icon: 'fa-triangle-exclamation', tone: '#b91c1c' },
    ];

    return (
        <div className="piq-container rpq-glass">
            {/* Top Toolbar */}
            <div className="piq-topbar">
                <div className="piq-title-area">
                    <h2 className="piq-heading">Vendor Wise Process Quality Report</h2>
                    <span className="piq-badge">{loading ? '…' : `${filteredData.length} Vendors`}</span>
                </div>
                <div className="piq-controls-row">
                    <div className="piq-filters-inline">
                        <div className="piq-date-field">
                            <label>From</label>
                            <input type="date" className="piq-input" value={startDate} max={endDate}
                                onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="piq-date-field">
                            <label>To</label>
                            <input type="date" className="piq-input" value={endDate} min={startDate}
                                onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="piq-actions-inline">
                        <div className="piq-search-box">
                            <i className="fa-solid fa-search piq-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search manufacturer / plant..."
                                className="piq-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="piq-search-clear" onClick={() => setSearchQuery('')}>×</button>
                            )}
                        </div>
                        <ExportButton label="Download Summary" onClick={handleExport} />
                    </div>
                </div>
            </div>

            {/* KPI cards */}
            <div className="rp-kpis">
                {kpis.map(k => (
                    <div key={k.label} className="rp-kpi">
                        <span className="rp-kpi-icon" style={{ color: k.tone, background: `${k.tone}14` }}>
                            <i className={`fa-solid ${k.icon}`}></i>
                        </span>
                        <div className="rp-kpi-text">
                            <span className="rp-kpi-label">{k.label}</span>
                            {loading
                                ? <span className="rpq-skeleton" style={{ width: '90px', height: '16px' }}></span>
                                : <strong className="rp-kpi-value">{k.value}</strong>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Table */}
            <div className="piq-table-wrapper" style={{ overflowX: 'auto', maxHeight: '620px', overflowY: 'auto', position: 'relative' }}>
                {loading && (
                    <div className="rpq-loading-overlay" role="status" aria-live="polite">
                        <div className="rpq-loading-card" style={{ marginTop: '170px' }}>
                            <span className="rpq-loading-ring"></span>
                            <div className="rpq-loading-text">
                                <strong>Fetching report</strong>
                                <span>Vendor wise process quality
                                    <span className="rpq-loading-dots"><span></span><span></span><span></span></span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {!loading && filteredData.length === 0 && (
                    <div className="rpq-loading-overlay" role="status">
                        <div className="rpq-loading-card rpq-empty-card" style={{ marginTop: '110px' }}>
                            <span className="rpq-empty-icon"><i className="fa-solid fa-inbox"></i></span>
                            <div className="rpq-loading-text">
                                <strong>No records found</strong>
                                <span>Try a different date range or search.</span>
                            </div>
                        </div>
                    </div>
                )}

                <table style={{ minWidth: '1000px', width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                            <th style={{ ...thBase, width: '56px' }}>S.No.</th>
                            <th style={{ ...thBase, textAlign: 'left' }}>Manufacturer &amp; Plant</th>
                            <th style={thBlue}>Total Inspected <small>(Nos.)</small></th>
                            <th style={thGreen}>Total Accepted <small>(Nos.)</small></th>
                            <th style={thRed}>Total Rejected <small>(Nos.)</small></th>
                            <th style={thOrange}>Rejection %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 8 }).map((_, r) => (
                                <tr key={`sk-${r}`} className="rpq-skeleton-row" style={{ animationDelay: `${r * 0.06}s` }}>
                                    {Array.from({ length: COLS }).map((__, c) => (
                                        <td key={c} style={tdCell}>
                                            <span className="rpq-skeleton" style={{ width: `${Math.max(24, (c === 1 ? 320 : 80) - ((r * 13 + c * 7) % 30))}px` }}></span>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : pagedData.length === 0 ? (
                            <tr>
                                <td colSpan={COLS} style={{ height: '120px', border: 'none', background: 'transparent' }}></td>
                            </tr>
                        ) : (
                            pagedData.map((row, i) => {
                                const p = toPct(row.rejectionPercent);
                                const t = tone(p);
                                const [vendor, plant] = splitName(row.manufacture);
                                return (
                                    <tr key={`${row.manufacture || ''}-${pageStart + i}`} className="piq-row">
                                        <td style={{ ...tdCell, color: '#94a3b8', fontWeight: 600 }}>{pageStart + i + 1}</td>
                                        <td style={{ ...tdCell, textAlign: 'left', whiteSpace: 'normal', minWidth: '320px' }}>
                                            <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{vendor}</div>
                                            {plant && (
                                                <div style={{ marginTop: '2px', fontSize: '11px', color: '#64748b' }}>
                                                    <i className="fa-solid fa-location-dot" style={{ color: '#16a34a', marginRight: '5px' }}></i>{plant}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ ...tdCell, background: '#eff6ff', color: '#1e293b', fontWeight: 600 }}>{num(row.totalInspected)}</td>
                                        <td style={{ ...tdCell, background: '#f0fdf4', color: '#15803d', fontWeight: 700 }}>{num(row.totalAccepted)}</td>
                                        <td style={{ ...tdCell, background: '#fff1f2', color: '#be123c', fontWeight: 600 }}>{num(row.totalRejected)}</td>
                                        <td style={{ ...tdCell, minWidth: '170px' }}>
                                            <div className="rp-progress">
                                                <div className="rp-progress-track">
                                                    <div className="rp-progress-fill" style={{ width: `${Math.min(100, p * 20)}%`, background: t.bar }}></div>
                                                </div>
                                                <span className="rp-chip" style={{ color: t.color, background: t.background, borderColor: t.borderColor }}>
                                                    {p.toFixed(2)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && filteredData.length > 0 && (
                <div className="piq-pagination-wrapper">
                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(filteredData.length / rowsPerPage)}
                        start={pageStart}
                        end={Math.min(pageStart + rowsPerPage, filteredData.length)}
                        totalCount={filteredData.length}
                        onPageChange={setPage}
                        rows={rowsPerPage}
                        onRowsChange={(n) => { setRowsPerPage(n); setPage(0); }}
                    />
                </div>
            )}
        </div>
    );
};

/* Header cells: light pastel tints, same palette as the other Rail Pad reports */
const thBase = {
    padding: '12px 10px',
    fontWeight: '700',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'center',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
    color: '#334155',
    '--rpq-th': '#334155',
};
const thGreen = { ...thBase, background: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)', color: '#166534', '--rpq-th': '#166534' };
const thBlue = { ...thBase, background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', '--rpq-th': '#1e40af' };
const thRed = { ...thBase, background: 'linear-gradient(180deg, #ffe4e6 0%, #fecdd3 100%)', color: '#be123c', '--rpq-th': '#be123c' };
const thOrange = { ...thBase, background: 'linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%)', color: '#9a3412', '--rpq-th': '#9a3412' };

const tdCell = {
    padding: '11px 10px',
    textAlign: 'center',
    borderBottom: '1px solid #f1f5f9',
    borderRight: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    fontSize: '12px',
    color: '#334155',
};

export default RailPadVwpqrReport;
