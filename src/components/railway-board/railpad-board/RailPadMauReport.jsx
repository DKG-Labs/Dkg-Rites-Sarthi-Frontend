import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel } from '../SharedComponents';
import Pagination from '../../Pagination';
import './RailPadSummary.css';
import '../erc-board/ProcessInspectionQualityTable.css';
import './RailPadQualityReport.css';

const SKELETON_COLS = 11;

const RailPadMauReport = ({ mauData = [], loading = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Reset pagination when search query or data changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery, mauData]);

    const data = Array.isArray(mauData) ? mauData : [];

    // Filter data based on search query
    const filteredData = data.filter((row) => {
        const query = searchQuery.toLowerCase();
        return (
            (row.plantName || '').toLowerCase().includes(query) ||
            (row.rio || '').toLowerCase().includes(query)
        );
    });

    // Paginated subset of filtered data
    const pageStart = currentPage * rowsPerPage;
    const paginatedData = filteredData.slice(pageStart, pageStart + rowsPerPage);

    // KPI totals (filtered set)
    const totals = filteredData.reduce((acc, r) => {
        acc.production += Number(r.production) || 0;
        acc.acceptance += Number(r.acceptance) || 0;
        acc.processRej += Number(r.processRejection) || 0;
        acc.finalRej += Number(r.finalRejection) || 0;
        return acc;
    }, { production: 0, acceptance: 0, processRej: 0, finalRej: 0 });
    const overallRejPct = totals.production > 0
        ? ((totals.processRej + totals.finalRej) * 100) / totals.production
        : 0;

    const handleExport = () => {
        const exportColumns = [
            { label: 'Plant Name', key: 'plantName' },
            { label: 'RITES RIO', key: 'rio' },
            { label: 'No. of PO', key: 'noOfPos' },
            { label: 'PO Qty', key: 'poQty' },
            { label: 'Production', key: 'production' },
            { label: 'Acceptance', key: 'acceptance' },
            { label: 'Process Rejection', key: 'processRejection' },
            { label: 'Process Rej %', key: 'processRejPct' },
            { label: 'Final Rejection', key: 'finalRejection' },
            { label: 'Final Rej %', key: 'finalRejPct' },
            { label: 'Total Rej %', key: 'totalRejPct' }
        ];
        const mappedData = filteredData.map(row => ({
            ...row,
            poQty: row.poQty !== undefined && row.poQty !== null ? `${row.poQty} ${row.uom || ''}`.trim() : '-'
        }));
        downloadExcel(mappedData, exportColumns, 'Rail_Pad_MAU_Report');
    };

    const num = (v) => (Number(v) || 0).toLocaleString();
    const pct = (v) => `${(Number(v) || 0).toFixed(2)}%`;
    const pctTone = (v) => {
        const n = Number(v) || 0;
        if (n >= 2) return { background: 'rgba(254, 226, 226, 0.85)', color: '#b91c1c', borderColor: 'rgba(252, 165, 165, 0.6)' };
        if (n >= 1) return { background: 'rgba(254, 243, 199, 0.9)', color: '#b45309', borderColor: 'rgba(252, 211, 77, 0.6)' };
        return { background: 'rgba(220, 252, 231, 0.85)', color: '#15803d', borderColor: 'rgba(134, 239, 172, 0.7)' };
    };

    const kpis = [
        { label: 'Plants', value: filteredData.length.toLocaleString(), icon: 'fa-industry', tone: '#0d9488' },
        { label: 'Production', value: `${num(totals.production)} Nos.`, icon: 'fa-gears', tone: '#1d4ed8' },
        { label: 'Acceptance', value: `${num(totals.acceptance)} Nos.`, icon: 'fa-circle-check', tone: '#15803d' },
        { label: 'Overall Rejection', value: pct(overallRejPct), icon: 'fa-triangle-exclamation', tone: '#b91c1c' },
    ];

    return (
        <div className="piq-container rpq-glass">
            {/* Top Toolbar */}
            <div className="piq-topbar">
                <div className="piq-title-area">
                    <h2 className="piq-heading">Monthly Analysis of Units (MAU)</h2>
                    <span className="piq-badge">{loading ? '…' : `${filteredData.length} Plants`}</span>
                </div>
                <div className="piq-controls-row">
                    <div className="piq-filters-inline"></div>
                    <div className="piq-actions-inline">
                        <div className="piq-search-box">
                            <i className="fa-solid fa-search piq-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search Plant / RIO..."
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
            <div className="mau-kpis">
                {kpis.map(k => (
                    <div key={k.label} className="mau-kpi">
                        <span className="mau-kpi-icon" style={{ color: k.tone, background: `${k.tone}14` }}>
                            <i className={`fa-solid ${k.icon}`}></i>
                        </span>
                        <div className="mau-kpi-text">
                            <span className="mau-kpi-label">{k.label}</span>
                            {loading
                                ? <span className="rpq-skeleton" style={{ width: '90px', height: '16px' }}></span>
                                : <strong className="mau-kpi-value">{k.value}</strong>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Table */}
            <div className="piq-table-wrapper" style={{ overflowX: 'auto', maxHeight: '620px', overflowY: 'auto', position: 'relative' }}>
                {loading && (
                    <div className="rpq-loading-overlay" role="status" aria-live="polite">
                        <div className="rpq-loading-card" style={{ marginTop: '200px' }}>
                            <span className="rpq-loading-ring"></span>
                            <div className="rpq-loading-text">
                                <strong>Fetching report</strong>
                                <span>Monthly analysis of units
                                    <span className="rpq-loading-dots"><span></span><span></span><span></span></span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {!loading && filteredData.length === 0 && (
                    <div className="rpq-loading-overlay" role="status">
                        <div className="rpq-loading-card rpq-empty-card" style={{ marginTop: '160px' }}>
                            <span className="rpq-empty-icon"><i className="fa-solid fa-inbox"></i></span>
                            <div className="rpq-loading-text">
                                <strong>No records found</strong>
                                <span>Try a different date range, RIO or search.</span>
                            </div>
                        </div>
                    </div>
                )}

                <table style={{ minWidth: '1250px', width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                            <th rowSpan="2" style={{ ...thBase, textAlign: 'left' }}>Plant Name</th>
                            <th rowSpan="2" style={thBase}>RITES RIO</th>
                            <th rowSpan="2" style={thBase}>No. of PO</th>
                            <th rowSpan="2" style={thBase}>PO Qty</th>
                            <th rowSpan="2" style={thGreen}>Production</th>
                            <th rowSpan="2" style={thGreen}>Acceptance</th>
                            <th colSpan="2" style={thOrange}>Process Rejection</th>
                            <th colSpan="2" style={thRed}>Final Rejection</th>
                            <th rowSpan="2" style={thBlue}>Total Rej %</th>
                        </tr>
                        <tr>
                            <th style={thOrangeSub}>Qty</th>
                            <th style={thOrangeSub}>%</th>
                            <th style={thRedSub}>Qty</th>
                            <th style={thRedSub}>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 8 }).map((_, r) => (
                                <tr key={`sk-${r}`} className="rpq-skeleton-row" style={{ animationDelay: `${r * 0.06}s` }}>
                                    {Array.from({ length: SKELETON_COLS }).map((__, c) => (
                                        <td key={c} style={tdCell}>
                                            <span className="rpq-skeleton" style={{ width: `${Math.max(30, (c === 0 ? 180 : 70) - ((r * 13 + c * 7) % 30))}px` }}></span>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={SKELETON_COLS} style={{ height: '140px', border: 'none', background: 'transparent' }}></td>
                            </tr>
                        ) : (
                            paginatedData.map((row, idx) => (
                                <tr key={`${row.plantName || ''}-${pageStart + idx}`} className="piq-row">
                                    <td style={{ ...tdCell, textAlign: 'left', whiteSpace: 'normal', minWidth: '220px', fontWeight: 600, color: '#0f172a' }}>{row.plantName}</td>
                                    <td style={tdCell}>
                                        <span className="mau-rio">{row.rio || 'N/A'}</span>
                                    </td>
                                    <td style={tdCell}>{row.noOfPos !== undefined && row.noOfPos !== null ? row.noOfPos : '-'}</td>
                                    <td style={tdCell}>{row.poQty !== undefined && row.poQty !== null ? `${num(row.poQty)} ${row.uom || ''}`.trim() : '-'}</td>
                                    <td style={{ ...tdCell, background: '#f0fdf4', color: '#1e293b' }}>{num(row.production)} <small style={unit}>Nos.</small></td>
                                    <td style={{ ...tdCell, background: '#f0fdf4', color: '#15803d', fontWeight: 700 }}>{num(row.acceptance)} <small style={unit}>Nos.</small></td>
                                    <td style={{ ...tdCell, background: '#fff7ed', color: '#c2410c' }}>{num(row.processRejection)} <small style={unit}>Nos.</small></td>
                                    <td style={{ ...tdCell, background: '#fff7ed' }}>{pct(row.processRejPct)}</td>
                                    <td style={{ ...tdCell, background: '#fff1f2', color: '#be123c' }}>{num(row.finalRejection)} <small style={unit}>Nos.</small></td>
                                    <td style={{ ...tdCell, background: '#fff1f2' }}>{pct(row.finalRejPct)}</td>
                                    <td style={tdCell}>
                                        <span className="mau-pct" style={pctTone(row.totalRejPct)}>{pct(row.totalRejPct)}</span>
                                    </td>
                                </tr>
                            ))
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

            <style>{`
                .mau-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 16px 0; }
                .mau-kpi { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px;
                    background: rgba(255,255,255,0.85); border: 1px solid rgba(226,232,240,0.9);
                    box-shadow: 0 10px 24px -18px rgba(15,23,42,0.25); animation: rpq-row-in .4s ease-out both; }
                .mau-kpi-icon { width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
                .mau-kpi-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
                .mau-kpi-label { font-size: 11px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; color: #64748b; }
                .mau-kpi-value { font-size: 17px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .mau-rio { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
                    color: #1e40af; background: rgba(219,234,254,0.8); border: 1px solid rgba(147,197,253,0.6); }
                .mau-pct { display: inline-block; padding: 3px 10px; border-radius: 999px; font-weight: 700; border: 1px solid; }
                @media (max-width: 900px) { .mau-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (max-width: 420px) { .mau-kpis { gap: 10px; } .mau-kpi { padding: 12px; } .mau-kpi-value { font-size: 15px; } }
            `}</style>
        </div>
    );
};

/* Header cells: light pastel tints, same palette as Quality of Rubber Pad Report */
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
const thOrangeSub = { ...thBase, background: 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)', color: '#c2410c', '--rpq-th': '#c2410c' };
const thRed = { ...thBase, background: 'linear-gradient(180deg, #ffe4e6 0%, #fecdd3 100%)', color: '#be123c', '--rpq-th': '#be123c' };
const thRedSub = { ...thBase, background: 'linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)', color: '#be123c', '--rpq-th': '#be123c' };

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

export default RailPadMauReport;
