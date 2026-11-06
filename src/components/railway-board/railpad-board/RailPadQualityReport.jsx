import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel, SearchableDropdown } from '../SharedComponents';
import reportService from '../../../services/reportService';
import '../erc-board/ProcessInspectionQualityTable.css';
import './RailPadQualityReport.css';

const RailPadQualityReport = () => {
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
    }, [startDate, endDate]);

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
            { label: 'Qty Inspected (Process)', key: 'qtyInspected' },
            { label: 'Qty Accepted (Process)', key: 'qtyAccepted' },
            { label: 'IC Issued Qty (Final)', key: 'icIssuedQty' },
            { label: 'Last Date of IC', key: 'lastDateIcIssued' },
            { label: 'Total Process Rejections', key: 'totalProcessRejections' },
            { label: 'Raw Material Check', key: 'rawMaterialCheck' },
            { label: 'Compounding', key: 'compounding' },
            { label: 'Mixing', key: 'mixing' },
            { label: 'Curing', key: 'curing' },
            { label: 'Cutting', key: 'cutting' },
            { label: 'Rheometer', key: 'rheometer' },
            { label: 'Visual Check / Finishing', key: 'visualCheckFinishing' },
            { label: 'Hardness', key: 'hardness' },
            { label: 'Specific Gravity', key: 'specificGravity' },
            { label: 'Rubber Content', key: 'rubberContent' },
            { label: 'Ash Content', key: 'ashContent' },
            { label: 'Rebound Resilience', key: 'reboundResilience' },
            { label: 'Dimension', key: 'dimension' },
            { label: 'Weight', key: 'weight' },
            { label: 'Surface Defect', key: 'surfaceDefect' },
            { label: 'Compression Set', key: 'compressionSet' },
            { label: 'Visual Test', key: 'visualTest' },
            { label: 'Other Rejections', key: 'otherRejection' },
            { label: 'Remarks', key: 'remarks' },
            { label: 'Rejection %', key: 'rejectionPercent' }
        ];

        const exportData = filteredRecords.map((r, idx) => ({
            ...r,
            sNo: idx + 1,
            totalProcessRejections: r.rawMaterialCheck + r.compounding + r.mixing + r.curing + r.cutting + r.rheometer + r.visualCheckFinishing
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
                {loading ? (
                    <div className="piq-loading-state">
                        <div className="piq-spinner"></div>
                        <p>Loading Quality of Rubber Pad Data...</p>
                    </div>
                ) : (
                    <table style={{ minWidth: '2200px', width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '12px' }}>
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
                                <th colSpan="2" style={thGreen}>Process Inspection</th>
                                <th colSpan="2" style={thBlue}>Final Inspection</th>
                                <th colSpan="19" style={thOrange}>No. of Rubber Pads Rejected &amp; Reasons for Rejection</th>
                                <th rowSpan="3" style={thBase}>Remarks</th>
                                <th rowSpan="3" style={thBase}>%age Rejection</th>
                            </tr>
                            {/* Row 2: Sub-groups */}
                            <tr>
                                <th rowSpan="2" style={thGreenSub}>Inspected</th>
                                <th rowSpan="2" style={thGreenSub}>Accepted</th>
                                <th rowSpan="2" style={thBlueSub}>IC Issued Qty</th>
                                <th rowSpan="2" style={thBlueSub}>Last Date of IC</th>
                                <th colSpan="8" style={thRed}>Process</th>
                                <th colSpan="11" style={thBrown}>Acceptance</th>
                            </tr>
                            {/* Row 3: Individual columns */}
                            <tr>
                                <th style={thRed}>TOTAL</th>
                                <th style={thRed}>RAW<br />MATERIAL</th>
                                <th style={thRed}>COMPOUNDING</th>
                                <th style={thRed}>MIXING</th>
                                <th style={thRed}>CURING</th>
                                <th style={thRed}>CUTTING</th>
                                <th style={thRed}>RHEOMETER</th>
                                <th style={thRed}>VISUAL /<br />FINISHING</th>
                                <th style={thBrown}>Hardness</th>
                                <th style={thBrown}>Specific Gravity</th>
                                <th style={thBrown}>Rubber Content</th>
                                <th style={thBrown}>Ash Content</th>
                                <th style={thBrown}>Rebound Resilience</th>
                                <th style={thBrown}>Dimension</th>
                                <th style={thBrown}>Weight</th>
                                <th style={thBrown}>Surface Defect</th>
                                <th style={thBrown}>Compression Set</th>
                                <th style={thBrown}>Visual Test</th>
                                <th style={thBrown}>Other Clause</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="33" className="piq-empty-cell">
                                        No records found for the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((row, i) => {
                                    const totalProcRej = (row.rawMaterialCheck || 0) + (row.compounding || 0) + (row.mixing || 0) + (row.curing || 0) + (row.cutting || 0) + (row.rheometer || 0) + (row.visualCheckFinishing || 0);
                                    return (
                                        <tr key={i} className="piq-row">
                                            <td style={tdCenter}>{i + 1}</td>
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
                                            <td style={{ ...tdCenter, background: '#f0fdf4', color: '#15803d' }}>{(row.qtyInspected || 0).toLocaleString()}</td>
                                            <td style={{ ...tdCenter, background: '#f0fdf4', color: '#15803d', fontWeight: '700' }}>{(row.qtyAccepted || 0).toLocaleString()}</td>

                                            {/* Final Inspection */}
                                            <td style={{ ...tdCenter, background: '#eff6ff', color: '#1d4ed8' }}>{(row.icIssuedQty || 0).toLocaleString()}</td>
                                            <td style={{ ...tdCenter, background: '#eff6ff', color: '#1d4ed8', fontSize: '11px' }}>{row.lastDateIcIssued || '-'}</td>

                                            {/* Process Rejections */}
                                            <td style={{ ...tdCenter, background: '#fff7ed', fontWeight: '700', color: '#ea580c' }}>{totalProcRej.toLocaleString()}</td>
                                            <td style={{ ...tdCenter, background: '#fff7ed' }}>{row.rawMaterialCheck || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fff7ed' }}>{row.compounding || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fff7ed' }}>{row.mixing || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fff7ed' }}>{row.curing || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fff7ed' }}>{row.cutting || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fff7ed' }}>{row.rheometer || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fff7ed' }}>{row.visualCheckFinishing || '-'}</td>

                                            {/* Acceptance Rejections */}
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.hardness || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.specificGravity || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.rubberContent || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.ashContent || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.reboundResilience || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.dimension || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.weight || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.surfaceDefect || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.compressionSet || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.visualTest || '-'}</td>
                                            <td style={{ ...tdCenter, background: '#fffbeb' }}>{row.otherRejection || '-'}</td>

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
