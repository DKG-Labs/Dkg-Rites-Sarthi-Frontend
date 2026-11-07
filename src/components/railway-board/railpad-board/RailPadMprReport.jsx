import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel } from '../SharedComponents';
import Pagination from '../../Pagination';
import './RailPadSummary.css';
import '../erc-board/ProcessInspectionQualityTable.css';
import './RailPadQualityReport.css';

const COLS = 7;

const RailPadMprReport = ({ mprData = [], loading = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Format manufacturer name (take the first part before ~)
    const formatManufacturer = (name) => {
        if (!name) return 'N/A';
        return name.split('~')[0];
    };

    // Reset pagination when search or data changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery, mprData]);

    const data = Array.isArray(mprData) ? mprData : [];

    // Filter data based on search query
    const filteredData = data.filter((row) => {
        const query = searchQuery.toLowerCase();
        return (
            (row.rly || '').toLowerCase().includes(query) ||
            (row.poNo || '').toLowerCase().includes(query) ||
            (row.manufacturer || '').toLowerCase().includes(query)
        );
    });

    // Paginated subset of filtered data
    const pageStart = currentPage * rowsPerPage;
    const paginatedData = filteredData.slice(pageStart, pageStart + rowsPerPage);

    // KPI counts (PO counts only — quantities mix Nos. and Sets)
    const kpiCounts = filteredData.reduce((acc, r) => {
        acc.total += 1;
        if ((Number(r.dispatchedMonthly) || 0) > 0) acc.thisMonth += 1;
        if ((Number(r.poQty) || 0) > 0 && (Number(r.balance) || 0) <= 0) acc.completed += 1;
        return acc;
    }, { total: 0, thisMonth: 0, completed: 0 });
    const pendingPos = kpiCounts.total - kpiCounts.completed;

    const handleExport = () => {
        const exportColumns = [
            { label: 'Rly', key: 'rly' },
            { label: 'PO Number', key: 'poNo' },
            { label: 'Manufacturer', key: 'manufacturer' },
            { label: 'PO Qty', key: 'poQty' },
            { label: 'UOM', key: 'uom' },
            { label: 'Dispatched (Monthly)', key: 'dispatchedMonthly' },
            { label: 'Total Dispatched', key: 'totalDispatched' },
            { label: 'Balance', key: 'balance' }
        ];
        downloadExcel(filteredData, exportColumns, 'PO_Wise_Monthly_Progress_Report_Rail_Pad');
    };

    const num = (v) => (Number(v) || 0).toLocaleString();

    const kpis = [
        { label: 'Total POs', value: kpiCounts.total, icon: 'fa-file-contract', tone: '#1d4ed8' },
        { label: 'Dispatched This Period', value: kpiCounts.thisMonth, icon: 'fa-truck-fast', tone: '#0d9488' },
        { label: 'Fully Dispatched', value: kpiCounts.completed, icon: 'fa-circle-check', tone: '#15803d' },
        { label: 'Pending POs', value: pendingPos, icon: 'fa-hourglass-half', tone: '#b45309' },
    ];

    return (
        <div className="piq-container rpq-glass">
            {/* Top Toolbar */}
            <div className="piq-topbar">
                <div className="piq-title-area">
                    <h2 className="piq-heading">PO Wise Monthly Progress Report</h2>
                    <span className="piq-badge">{loading ? '…' : `${filteredData.length} POs`}</span>
                </div>
                <div className="piq-controls-row">
                    <div className="piq-filters-inline"></div>
                    <div className="piq-actions-inline">
                        <div className="piq-search-box">
                            <i className="fa-solid fa-search piq-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search PO / Rly / Manufacturer..."
                                className="piq-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="piq-search-clear" onClick={() => setSearchQuery('')}>×</button>
                            )}
                        </div>
                        <ExportButton onClick={handleExport} label="Download Excel" />
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
                                ? <span className="rpq-skeleton" style={{ width: '60px', height: '16px' }}></span>
                                : <strong className="rp-kpi-value">{k.value.toLocaleString()}</strong>}
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
                                <span>PO wise monthly progress
                                    <span className="rpq-loading-dots"><span></span><span></span><span></span></span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {!loading && filteredData.length === 0 && (
                    <div className="rpq-loading-overlay" role="status">
                        <div className="rpq-loading-card rpq-empty-card" style={{ marginTop: '120px' }}>
                            <span className="rpq-empty-icon"><i className="fa-solid fa-inbox"></i></span>
                            <div className="rpq-loading-text">
                                <strong>No records found</strong>
                                <span>Try a different date range, zone or search.</span>
                            </div>
                        </div>
                    </div>
                )}

                <table style={{ minWidth: '1100px', width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                            <th style={{ ...thBase, textAlign: 'left' }}>Rly + PO Number</th>
                            <th style={{ ...thBase, textAlign: 'left' }}>Manufacturer</th>
                            <th style={thBase}>PO Qty</th>
                            <th style={thBlue}>Dispatched (Monthly)</th>
                            <th style={thGreen}>Total Dispatched</th>
                            <th style={thOrange}>Balance</th>
                            <th style={thBase}>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 8 }).map((_, r) => (
                                <tr key={`sk-${r}`} className="rpq-skeleton-row" style={{ animationDelay: `${r * 0.06}s` }}>
                                    {Array.from({ length: COLS }).map((__, c) => (
                                        <td key={c} style={tdCell}>
                                            <span className="rpq-skeleton" style={{ width: `${Math.max(30, (c < 2 ? 170 : 80) - ((r * 13 + c * 7) % 30))}px` }}></span>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={COLS} style={{ height: '120px', border: 'none', background: 'transparent' }}></td>
                            </tr>
                        ) : (
                            paginatedData.map((row, idx) => {
                                const poQty = Number(row.poQty) || 0;
                                const total = Number(row.totalDispatched) || 0;
                                const balance = Number(row.balance) || 0;
                                const monthly = Number(row.dispatchedMonthly) || 0;
                                const pctDone = poQty > 0 ? Math.min(100, (total * 100) / poQty) : 0;
                                const done = poQty > 0 && balance <= 0;
                                return (
                                    <tr key={`${row.poNo || ''}-${pageStart + idx}`} className="piq-row">
                                        <td style={{ ...tdCell, textAlign: 'left' }}>
                                            <span className="rp-rly">{row.rly || '-'}</span>
                                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.poNo}</span>
                                        </td>
                                        <td style={{ ...tdCell, textAlign: 'left', whiteSpace: 'normal', minWidth: '200px', color: '#1d4ed8', fontWeight: 600 }}>
                                            {formatManufacturer(row.manufacturer)}
                                        </td>
                                        <td style={{ ...tdCell, fontWeight: 600 }}>
                                            {num(poQty)} <small style={unit}>{row.uom || 'Nos.'}</small>
                                        </td>
                                        <td style={{ ...tdCell, background: '#eff6ff' }}>
                                            {monthly > 0
                                                ? <span className="rp-chip rp-chip-blue">+{num(monthly)}</span>
                                                : <span style={{ color: '#94a3b8' }}>0</span>}
                                        </td>
                                        <td style={{ ...tdCell, background: '#f0fdf4', color: '#15803d', fontWeight: 700 }}>{num(total)}</td>
                                        <td style={{ ...tdCell, background: '#fff7ed', fontWeight: 700, color: done ? '#15803d' : '#c2410c' }}>
                                            {done ? <span className="rp-chip rp-chip-green"><i className="fa-solid fa-check"></i> Done</span> : num(balance)}
                                        </td>
                                        <td style={{ ...tdCell, minWidth: '150px' }}>
                                            <div className="rp-progress" title={`${pctDone.toFixed(1)}% dispatched`}>
                                                <div className="rp-progress-track">
                                                    <div className={`rp-progress-fill ${done ? 'is-done' : ''}`} style={{ width: `${pctDone}%` }}></div>
                                                </div>
                                                <span className="rp-progress-pct">{pctDone.toFixed(0)}%</span>
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
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredData.length / rowsPerPage)}
                        start={pageStart}
                        end={Math.min(pageStart + rowsPerPage, filteredData.length)}
                        totalCount={filteredData.length}
                        onPageChange={setCurrentPage}
                        rows={rowsPerPage}
                        onRowsChange={(n) => { setRowsPerPage(n); setCurrentPage(0); }}
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
const unit = { color: '#94a3b8', fontSize: '10px', fontWeight: 600 };

export default RailPadMprReport;
