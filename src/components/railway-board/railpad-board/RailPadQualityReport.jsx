import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel, SearchableDropdown } from '../SharedComponents';
import Pagination from '../../Pagination';
import reportService from '../../../services/reportService';
import '../erc-board/ProcessInspectionQualityTable.css';
import './RailPadQualityReport.css';

// Process rejection columns = IE production-verification dropdown reasons (Railpad-IE ProductionVerificationScreen)
const PROCESS_REASON_COLS = [
    { key: 'shortMoulding', label: 'Short Moulding', head: <>SHORT<br />MOULDING</> },
    { key: 'bubblesBlisters', label: 'Bubbles / Blisters', head: <>BUBBLES /<br />BLISTERS</> },
    { key: 'surfaceRoughness', label: 'Surface Roughness', head: <>SURFACE<br />ROUGHNESS</> },
    { key: 'nylonCordExposure', label: 'Nylon Cord Exposure', head: <>NYLON CORD<br />EXPOSURE</> },
    { key: 'unevenEdges', label: 'Uneven Edges', head: <>UNEVEN<br />EDGES</> },
    { key: 'uncleanCutSides', label: 'Unclean Cut Sides', head: <>UNCLEAN<br />CUT SIDES</> },
    { key: 'blowHoles', label: 'Blow Holes', head: <>BLOW<br />HOLES</> },
    { key: 'porosity', label: 'Porosity', head: 'POROSITY' },
    { key: 'improperGrooves', label: 'Improper Grooves', head: <>IMPROPER<br />GROOVES</> },
    { key: 'otherProcessRejection', label: 'Other (Process)', head: 'OTHER' },
];

// Original 11 acceptance columns (values from top-level row fields; backend fills them from final inspection)
const FINAL_TEST_COLS = [
    { key: 'hardness', label: 'Hardness' },
    { key: 'specificGravity', label: 'Specific Gravity' },
    { key: 'rubberContent', label: 'Rubber Content' },
    { key: 'ashContent', label: 'Ash Content' },
    { key: 'reboundResilience', label: 'Rebound Resilience' },
    { key: 'dimension', label: 'Dimension' },
    { key: 'weight', label: 'Weight' },
    { key: 'surfaceDefect', label: 'Surface Defect' },
    { key: 'compressionSet', label: 'Compression Set' },
    { key: 'visualTest', label: 'Visual Test' },
    { key: 'otherRejection', label: 'Other Clause' },
];

// 7 base + 4 process insp + 3 final insp + process (TOTAL + reasons) + acceptance + remarks + %
const TOTAL_COLS = 7 + 4 + 3 + (1 + PROCESS_REASON_COLS.length) + FINAL_TEST_COLS.length + 2;

const RailPadQualityReport = ({ refreshTick = 0 }) => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('All Manufacturers');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 365);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // back to first page whenever the result set changes
    useEffect(() => { setPage(0); }, [selectedVendor, searchQuery, startDate, endDate, refreshTick]);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const params = { startDate, endDate };
                const res = await reportService.getRailPadQualityReport(params);
                const data = res?.responseData || res || [];
                setReportData(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching quality report:", err);
                setReportData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [startDate, endDate, refreshTick]);

    const handleExport = () => {
        const headers = [
            { label: 'S.No.', key: 'sNo' },
            { label: 'Zonal Railway', key: 'zonalRailway' },
            { label: 'Vendor', key: 'vendor' },
            { label: 'Type of Rubber Pad', key: 'typeOfRubberPad' },
            { label: 'PO Number', key: 'poNo' },
            { label: 'PO Date', key: 'poDate' },
            { label: 'Specification', key: 'specification' },
            { label: 'Total PO Qty', key: 'totalPoQty' },
            { label: 'UOM', key: 'uom' },
            { label: 'Process Inspected (Nos.)', key: 'qtyInspectedNos' },
            { label: 'Process Inspected (Sets)', key: 'qtyInspectedSets' },
            { label: 'Process Accepted (Nos.)', key: 'qtyAcceptedNos' },
            { label: 'Process Accepted (Sets)', key: 'qtyAcceptedSets' },
            { label: 'IC Issued Qty (Nos.)', key: 'icIssuedQtyNos' },
            { label: 'IC Issued Qty (Sets)', key: 'icIssuedQtySets' },
            { label: 'Last Date of IC', key: 'lastDateIcIssued' },
            { label: 'Total Process Rejections (Nos.)', key: 'totalProcessRejection' },
            ...PROCESS_REASON_COLS.map(c => ({ label: c.label, key: c.key })),
            ...FINAL_TEST_COLS.map(c => ({ label: c.label, key: c.key })),
            { label: 'Remarks', key: 'remarks' },
            { label: 'Rejection %', key: 'rejectionPercent' }
        ];

        const exportData = filteredRecords.map((r, idx) => ({
            ...r,
            sNo: idx + 1
        }));

        downloadExcel(exportData, headers, 'Quality_of_Rubber_Pad_Report');
    };

    const filteredRecords = reportData.filter(row => {
        const vendorMatch = selectedVendor === 'All Manufacturers' ||
            row.vendor?.toLowerCase().includes(selectedVendor.toLowerCase()) ||
            row.vendorName?.toLowerCase().includes(selectedVendor.toLowerCase());
        const searchMatch = !searchQuery ||
            row.poNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.zonalRailway?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
        return vendorMatch && searchMatch;
    });

    const pageStart = page * rowsPerPage;
    const pagedRecords = filteredRecords.slice(pageStart, pageStart + rowsPerPage);

    const dropdownOptions = [{ label: 'All Manufacturers', value: 'All Manufacturers' }];
    const seenNames = new Set();
    reportData.forEach(row => {
        const name = row.vendor || row.vendorName;
        if (name) {
            const trimmedName = name.trim();
            if (!seenNames.has(trimmedName)) {
                seenNames.add(trimmedName);
                dropdownOptions.push({ label: trimmedName, value: trimmedName });
            }
        }
    });

    return (
        <div className="piq-container rpq-glass">
            {/* Top Toolbar */}
            <div className="piq-topbar">
                <div className="piq-title-area">
                    <h2 className="piq-heading">
                        Quality of Rubber Pad Report
                    </h2>
                    <span className="piq-badge">{filteredRecords.length} Records</span>
                </div>

                {/* Filters & Actions */}
                <div className="piq-controls-row">
                    <div className="piq-filters-inline">
                        <div className="piq-date-field">
                            <label>Manufacturer</label>
                            <SearchableDropdown
                                value={selectedVendor}
                                onChange={(val) => setSelectedVendor(val)}
                                options={dropdownOptions}
                            />
                        </div>
                        <div className="piq-date-field">
                            <label>From</label>
                            <input
                                type="date"
                                className="piq-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="piq-date-field">
                            <label>To</label>
                            <input
                                type="date"
                                className="piq-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="piq-actions-inline">
                        <div className="piq-search-box">
                            <i className="fa-solid fa-search piq-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search PO / Zone..."
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

            {/* Main Table */}
            <div className="piq-table-wrapper" style={{ overflowX: 'auto', maxHeight: '620px', overflowY: 'auto' }}>
                {loading && (
                    <div className="rpq-loading-overlay" role="status" aria-live="polite">
                        <div className="rpq-loading-card">
                            <span className="rpq-loading-ring"></span>
                            <div className="rpq-loading-text">
                                <strong>Fetching report</strong>
                                <span>Quality of rubber pad data
                                    <span className="rpq-loading-dots"><span></span><span></span><span></span></span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {!loading && filteredRecords.length === 0 && (
                    <div className="rpq-loading-overlay" role="status">
                        <div className="rpq-loading-card rpq-empty-card">
                            <span className="rpq-empty-icon"><i className="fa-solid fa-inbox"></i></span>
                            <div className="rpq-loading-text">
                                <strong>No records found</strong>
                                <span>Try a different date range, manufacturer or search.</span>
                            </div>
                        </div>
                    </div>
                )}
                {(
                    <table style={{ minWidth: '3000px', width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, color: '#334155' }}>
                            {/* Row 1: Main groups */}
                            <tr>
                                <th rowSpan="3" style={thBase}>S.No.</th>
                                <th rowSpan="3" style={thBase}>Zonal Railway</th>
                                <th rowSpan="3" style={thBase}>Vendor</th>
                                <th rowSpan="3" style={{ ...thBase, width: '180px', minWidth: '150px', maxWidth: '200px', whiteSpace: 'normal' }}>Type of Rubber Pad</th>
                                <th rowSpan="3" style={thBase}>P.O. No. &amp; Date</th>
                                <th rowSpan="3" style={thBase}>Specification</th>
                                <th rowSpan="3" style={thBase}>Total P.O. Qty</th>
                                <th colSpan="4" style={thGreen}>Process Inspection</th>
                                <th colSpan="3" style={thBlue}>Final Inspection</th>
                                <th colSpan={1 + PROCESS_REASON_COLS.length + FINAL_TEST_COLS.length} style={thOrange}>No. of Rubber Pads Rejected &amp; Reasons for Rejection</th>
                                <th rowSpan="3" style={thBase}>Remarks</th>
                                <th rowSpan="3" style={thBase}>%age Rejection</th>
                            </tr>
                            {/* Row 2: Sub-groups */}
                            <tr>
                                <th colSpan="2" style={thGreenSub}>Inspected</th>
                                <th colSpan="2" style={thGreenSub}>Accepted</th>
                                <th colSpan="2" style={thBlueSub}>IC Issued Qty</th>
                                <th rowSpan="2" style={thBlueSub}>Last Date of IC</th>
                                <th colSpan={1 + PROCESS_REASON_COLS.length} style={thRed}>Process</th>
                                <th colSpan={FINAL_TEST_COLS.length} style={thBrown}>Acceptance</th>
                            </tr>
                            {/* Row 3: Individual columns */}
                            <tr>
                                <th style={thGreenSub}>Nos.</th>
                                <th style={thGreenSub}>Sets</th>
                                <th style={thGreenSub}>Nos.</th>
                                <th style={thGreenSub}>Sets</th>
                                <th style={thBlueSub}>Nos.</th>
                                <th style={thBlueSub}>Sets</th>
                                <th style={thRed}>TOTAL</th>
                                {PROCESS_REASON_COLS.map(c => (
                                    <th key={c.key} style={thRed}>{c.head}</th>
                                ))}
                                {FINAL_TEST_COLS.map(c => (
                                    <th key={c.key} style={thBrown}>{c.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    {Array.from({ length: 8 }).map((_, r) => (
                                        <tr key={`sk-${r}`} className="rpq-skeleton-row" style={{ animationDelay: `${r * 0.06}s` }}>
                                            {Array.from({ length: TOTAL_COLS }).map((__, c) => (
                                                <td key={c} style={tdCenter}>
                                                    <span className="rpq-skeleton" style={{ width: `${Math.max(24, (c === 2 || c === 3 ? 120 : 60) - ((r * 13 + c * 7) % 30))}px` }}></span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    {/* blank space; the message itself is the pinned rpq-empty-overlay card */}
                                    <td colSpan={TOTAL_COLS} style={{ height: '160px', border: 'none', background: 'transparent' }}></td>
                                </tr>
                            ) : (
                                pagedRecords.map((row, i) => {
                                    const totalProcRej = row.totalProcessRejection || 0;
                                    return (
                                        <tr key={i} className="piq-row">
                                            <td style={tdCenter}>{pageStart + i + 1}</td>
                                            <td style={{ ...tdCenter, fontWeight: '600', color: '#0f172a' }}>{row.zonalRailway}</td>
                                            <td style={{ ...tdCenter, fontWeight: '600', color: '#1d4ed8' }}>{row.vendor}</td>
                                            <td style={{ ...tdCenter, width: '180px', minWidth: '150px', maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>{row.typeOfRubberPad}</td>
                                            <td style={{ ...tdCenter, whiteSpace: 'nowrap' }}>
                                                <div style={{ fontWeight: '700', color: '#0f172a' }}>{row.zonalRailway}-{row.poNo}</div>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{row.poDate}</div>
                                            </td>
                                            <td style={{ ...tdCenter, fontSize: '11px' }}>{row.specification || ''}</td>
                                            <td style={{ ...tdCenter, fontWeight: '600' }}>{(row.totalPoQty || 0).toLocaleString()} {row.uom || ''}</td>

                                            {/* Process Inspection */}
                                            <td style={{ ...tdCenter, background: '#f0fdf4', color: '#15803d' }}>{row.qtyInspectedNos ? row.qtyInspectedNos.toLocaleString() : '-'}</td>
                                            <td style={{ ...tdCenter, background: '#f0fdf4', color: '#15803d' }}>{row.qtyInspectedSets ? row.qtyInspectedSets.toLocaleString() : '-'}</td>
                                            <td style={{ ...tdCenter, background: '#f0fdf4', color: '#15803d', fontWeight: '700' }}>{row.qtyAcceptedNos ? row.qtyAcceptedNos.toLocaleString() : '-'}</td>
                                            <td style={{ ...tdCenter, background: '#f0fdf4', color: '#15803d', fontWeight: '700' }}>{row.qtyAcceptedSets ? row.qtyAcceptedSets.toLocaleString() : '-'}</td>

                                            {/* Final Inspection */}
                                            <td style={{ ...tdCenter, background: '#eff6ff', color: '#1d4ed8' }}>{row.icIssuedQtyNos ? row.icIssuedQtyNos.toLocaleString() : '-'}</td>
                                            <td style={{ ...tdCenter, background: '#eff6ff', color: '#1d4ed8' }}>{row.icIssuedQtySets ? row.icIssuedQtySets.toLocaleString() : '-'}</td>
                                            <td style={{ ...tdCenter, background: '#eff6ff', color: '#1d4ed8', fontSize: '11px' }}>{row.lastDateIcIssued || '-'}</td>

                                            {/* Process Rejections */}
                                            <td style={{ ...tdCenter, background: '#fff7ed', fontWeight: '700', color: '#ea580c' }}>{totalProcRej.toLocaleString()}</td>
                                            {PROCESS_REASON_COLS.map(c => (
                                                <td key={c.key} style={{ ...tdCenter, background: '#fff7ed' }}>{row[c.key] ? row[c.key].toLocaleString() : '-'}</td>
                                            ))}

                                            {/* Acceptance Rejections */}
                                            {FINAL_TEST_COLS.map(c => {
                                                const v = row[c.key];
                                                return <td key={c.key} style={{ ...tdCenter, background: '#fffbeb' }}>{v ? v.toLocaleString() : '-'}</td>;
                                            })}

                                            <td style={{ ...tdCenter, fontStyle: 'italic', fontSize: '11px', color: '#475569' }}></td>
                                            <td style={tdCenter}>
                                                <span className="piq-rej-badge" style={{ cursor: 'default', transform: 'none' }}>
                                                    {(row.rejectionPercent || 0).toFixed(2)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination (shared component, same as ERC quality table) */}
            {!loading && filteredRecords.length > 0 && (
                <div className="piq-pagination-wrapper">
                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(filteredRecords.length / rowsPerPage)}
                        start={pageStart}
                        end={Math.min(pageStart + rowsPerPage, filteredRecords.length)}
                        totalCount={filteredRecords.length}
                        onPageChange={setPage}
                        rows={rowsPerPage}
                        onRowsChange={(newRows) => {
                            setRowsPerPage(newRows);
                            setPage(0);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

/* Header cell styles: light pastel tints with dark text (solid so sticky rows don't show through) */
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
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
};

// --rpq-th carries the label colour past the shared CSS's `color: #fff !important` on th
const thGreen = {
    ...thBase,
    background: 'linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)',
    color: '#166534',
    '--rpq-th': '#166534',
};

const thGreenSub = {
    ...thBase,
    background: 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)',
    color: '#15803d',
    '--rpq-th': '#15803d',
};

const thBlue = {
    ...thBase,
    background: 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%)',
    color: '#1e40af',
    '--rpq-th': '#1e40af',
};

const thBlueSub = {
    ...thBase,
    background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
    color: '#1d4ed8',
    '--rpq-th': '#1d4ed8',
};

const thOrange = {
    ...thBase,
    background: 'linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%)',
    color: '#9a3412',
    '--rpq-th': '#9a3412',
};

const thRed = {
    ...thBase,
    background: 'linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)',
    color: '#be123c',
    '--rpq-th': '#be123c',
};

const thBrown = {
    ...thBase,
    background: 'linear-gradient(180deg, #fefce8 0%, #fef3c7 100%)',
    color: '#92400e',
    '--rpq-th': '#92400e',
};

const tdCenter = {
    padding: '10px 8px',
    textAlign: 'center',
    borderBottom: '1px solid #f1f5f9',
    borderRight: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    fontSize: '12px',
};

export default RailPadQualityReport;
