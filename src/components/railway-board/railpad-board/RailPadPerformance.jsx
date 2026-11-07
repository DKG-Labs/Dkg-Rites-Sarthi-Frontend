import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel } from '../SharedComponents';
import Pagination from '../../Pagination';
import '../erc-board/ProcessInspectionQualityTable.css';
import './RailPadQualityReport.css';

const COLS = 9;

const RailPadPerformance = ({ perfData, loading, error }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Format ie.name to Title Case
    const formatIeName = (name) => {
        if (!name || name === 'N/A' || name === 'null') return 'N/A';
        return name
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Map the performance data dynamically from props
    const performanceData = (perfData && perfData.length > 0) ? perfData.map(row => ({
        plant: row.manufacturerName || row.plant || 'N/A',
        rio: row.rio || 'N/A',
        ieName: formatIeName(row.username || row.ieName),
        stage: row.stage || 'PROCESS',
        inspected: Number(row.inspectedQty ?? row.inspected ?? 0),
        accepted: Number(row.acceptedQty ?? row.accepted ?? 0),
        rejected: Number(row.rejectedQty ?? row.rejected ?? 0),
        rejPct: Number(row.rejectionPercentage ?? row.rejPct ?? 0)
    })) : [];

    useEffect(() => { setPage(0); }, [searchQuery, perfData]);

    const q = searchQuery.toLowerCase();
    const filteredData = performanceData.filter(r =>
        !q || r.plant.toLowerCase().includes(q) || r.ieName.toLowerCase().includes(q) || r.rio.toLowerCase().includes(q)
    );
    const pageStart = page * rowsPerPage;
    const pagedData = filteredData.slice(pageStart, pageStart + rowsPerPage);

    const totals = filteredData.reduce((a, r) => {
        a.inspected += r.inspected;
        a.rejected += r.rejected;
        if (r.ieName !== 'N/A') a.ies.add(r.ieName);
        a.plants.add(r.plant);
        return a;
    }, { inspected: 0, rejected: 0, ies: new Set(), plants: new Set() });
    const overallPct = totals.inspected > 0 ? (totals.rejected * 100) / totals.inspected : 0;

    const handleExport = () => {
        const headers = [
            { label: 'MANUFACTURING PLANT', key: 'plant' },
            { label: 'RIO', key: 'rio' },
            { label: 'INSPECTING ENGINEER (IE)', key: 'ieName' },
            { label: 'STAGE', key: 'stage' },
            { label: 'INSPECTED (PCS)', key: 'inspected' },
            { label: 'ACCEPTED (PCS)', key: 'accepted' },
            { label: 'REJECTED (PCS)', key: 'rejected' },
            { label: 'REJECTION %', key: 'rejPct' }
        ];
        const excelData = filteredData.map(row => ({ ...row, rejPct: `${row.rejPct.toFixed(2)}%` }));
        downloadExcel(excelData, headers, 'RailPad_Performance_Monitoring_Matrix');
    };

    const tone = (p) => p >= 2
        ? { color: '#b91c1c', background: 'rgba(254, 226, 226, 0.85)', borderColor: 'rgba(252, 165, 165, 0.6)' }
        : p >= 1
            ? { color: '#b45309', background: 'rgba(254, 243, 199, 0.9)', borderColor: 'rgba(252, 211, 77, 0.6)' }
            : { color: '#15803d', background: 'rgba(220, 252, 231, 0.85)', borderColor: 'rgba(134, 239, 172, 0.7)' };
    const initials = (n) => (n === 'N/A' ? '?' : n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase());

    const kpis = [
        { label: 'Plants', value: totals.plants.size.toLocaleString(), icon: 'fa-industry', tone: '#7c3aed' },
        { label: 'Inspecting Engineers', value: totals.ies.size.toLocaleString(), icon: 'fa-user-tie', tone: '#1d4ed8' },
        { label: 'Inspected', value: `${totals.inspected.toLocaleString()} Pcs`, icon: 'fa-magnifying-glass', tone: '#0d9488' },
        { label: 'Overall Rejection', value: `${overallPct.toFixed(2)}%`, icon: 'fa-triangle-exclamation', tone: '#b91c1c' },
    ];

    return (
        <div className="piq-container rpq-glass">
            {/* Top Toolbar */}
            <div className="piq-topbar">
                <div className="piq-title-area">
                    <h2 className="piq-heading">Performance Monitoring Matrix</h2>
                    <span className="piq-badge">{loading ? '…' : `${filteredData.length} Records`}</span>
                </div>
                <div className="piq-controls-row">
                    <div className="piq-filters-inline"></div>
                    <div className="piq-actions-inline">
                        <div className="piq-search-box">
                            <i className="fa-solid fa-search piq-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search plant / IE / RIO..."
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

            {error ? (
                <div className="lwcl-err">
                    <span className="rpq-empty-icon" style={{ color: '#b91c1c', background: 'linear-gradient(180deg,#fef2f2,#fee2e2)', borderColor: 'rgba(252,165,165,.7)' }}>
                        <i className="fa-solid fa-circle-exclamation"></i>
                    </span>
                    <div>
                        <strong>Couldn't load performance data</strong>
                        <span>{error}</span>
                    </div>
                </div>
            ) : (
                <>
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
                                        ? <span className="rpq-skeleton" style={{ width: '80px', height: '16px' }}></span>
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
                                        <span>Performance monitoring matrix
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
                                        <span>Try a different date range, RIO or search.</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <table style={{ minWidth: '1150px', width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ ...thBase, width: '48px' }}>#</th>
                                    <th style={{ ...thBase, textAlign: 'left' }}>Manufacturing Plant</th>
                                    <th style={thBase}>RIO</th>
                                    <th style={{ ...thBase, textAlign: 'left' }}>Inspecting Engineer (IE)</th>
                                    <th style={thBase}>Stage</th>
                                    <th style={thBlue}>Inspected <small>(Pcs)</small></th>
                                    <th style={thGreen}>Accepted <small>(Pcs)</small></th>
                                    <th style={thRed}>Rejected <small>(Pcs)</small></th>
                                    <th style={thOrange}>Rejection %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, r) => (
                                        <tr key={`sk-${r}`} className="rpq-skeleton-row" style={{ animationDelay: `${r * 0.06}s` }}>
                                            {Array.from({ length: COLS }).map((__, c) => (
                                                <td key={c} style={tdCell}>
                                                    <span className="rpq-skeleton" style={{ width: `${Math.max(20, (c === 1 || c === 3 ? 170 : 60) - ((r * 13 + c * 7) % 30))}px` }}></span>
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
                                        const t = tone(row.rejPct);
                                        const isProcess = row.stage === 'PROCESS';
                                        return (
                                            <tr key={`${row.plant}-${row.ieName}-${pageStart + i}`} className="piq-row">
                                                <td style={{ ...tdCell, color: '#94a3b8', fontWeight: 600 }}>{pageStart + i + 1}</td>
                                                <td style={{ ...tdCell, textAlign: 'left', whiteSpace: 'normal', minWidth: '220px', fontWeight: 700, color: '#0f172a' }}>{row.plant}</td>
                                                <td style={tdCell}><span className="rp-rly" style={{ marginRight: 0 }}>{row.rio}</span></td>
                                                <td style={{ ...tdCell, textAlign: 'left' }}>
                                                    <span className="perf-ie">
                                                        <span className="perf-avatar">{initials(row.ieName)}</span>
                                                        {row.ieName}
                                                    </span>
                                                </td>
                                                <td style={tdCell}>
                                                    <span className="rp-chip" style={isProcess
                                                        ? { color: '#0369a1', background: 'rgba(224, 242, 254, 0.85)', borderColor: 'rgba(125, 211, 252, 0.6)' }
                                                        : { color: '#6d28d9', background: 'rgba(237, 233, 254, 0.85)', borderColor: 'rgba(196, 181, 253, 0.6)' }}>
                                                        {row.stage}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdCell, background: '#eff6ff', fontWeight: 600, color: '#1e293b' }}>{row.inspected.toLocaleString()}</td>
                                                <td style={{ ...tdCell, background: '#f0fdf4', color: '#15803d', fontWeight: 700 }}>{row.accepted.toLocaleString()}</td>
                                                <td style={{ ...tdCell, background: '#fff1f2', color: '#be123c', fontWeight: 600 }}>{row.rejected.toLocaleString()}</td>
                                                <td style={tdCell}>
                                                    <span className="rp-chip" style={t}>{row.rejPct.toFixed(2)}%</span>
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
                </>
            )}

            <style>{`
                .perf-ie { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: #1e293b; }
                .perf-avatar { width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
                    font-size: 10px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #16a34a, #0d9488);
                    box-shadow: 0 3px 8px -3px rgba(22,163,74,.6); flex-shrink: 0; }
                .lwcl-err { display: flex; align-items: center; gap: 14px; margin-top: 16px; padding: 16px 18px; border-radius: 16px;
                    background: rgba(254, 242, 242, 0.85); border: 1px solid rgba(252, 165, 165, 0.6); }
                .lwcl-err strong { display: block; color: #991b1b; font-size: 14px; }
                .lwcl-err span:not(.rpq-empty-icon) { color: #7f1d1d; font-size: 12.5px; }
            `}</style>
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

export default RailPadPerformance;
