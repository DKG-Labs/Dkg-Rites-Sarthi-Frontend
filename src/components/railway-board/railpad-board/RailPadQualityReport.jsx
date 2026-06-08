import React, { useState, useEffect } from 'react';
import { ExportButton, downloadExcel, SearchableDropdown } from '../SharedComponents';
import reportService from '../../../services/reportService';

const RailPadQualityReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('All Manufacturers');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 365); // Default to past 1 year for this report
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // We now derive vendors directly from the fetched report data
        // so that the dropdown only shows manufacturers active in the date range.
    }, []);

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
            
            // Process defects
            { label: 'Total Process Rejections', key: 'totalProcessRejections' },
            { label: 'Raw Material Check', key: 'rawMaterialCheck' },
            { label: 'Compounding', key: 'compounding' },
            { label: 'Mixing', key: 'mixing' },
            { label: 'Curing', key: 'curing' },
            { label: 'Cutting', key: 'cutting' },
            { label: 'Rheometer', key: 'rheometer' },
            { label: 'Visual Check / Finishing (Short moulding, Bubbles/blisters, Uneven edges, Surface roughness, Improper side cut)', key: 'visualCheckFinishing' },

            // Acceptance defects
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

        // Format data to match export keys
        const exportData = filteredRecords.map((r, idx) => ({
            ...r,
            sNo: idx + 1,
            totalProcessRejections: r.rawMaterialCheck + r.compounding + r.mixing + r.curing + r.cutting + r.rheometer + r.visualCheckFinishing
        }));

        downloadExcel(exportData, headers, 'Quality_of_Rubber_Pad_Report');
    };

    // Filter local records based on manufacturer selection and search query
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

    // Deduplicate and format vendors for searchable dropdown from report data
    const dropdownOptions = [{ label: 'All Manufacturers', value: 'All Manufacturers' }];
    const seenNames = new Set();
    reportData.forEach(row => {
        const name = row.vendor || row.vendorName;
        if (name) {
            const trimmedName = name.trim();
            if (!seenNames.has(trimmedName)) {
                seenNames.add(trimmedName);
                dropdownOptions.push({
                    label: trimmedName,
                    value: trimmedName
                });
            }
        }
    });

    return (
        <div className="report-content fade-in">
            <div className="prof-card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
                        Quality of Rubber Pad Report
                    </div>
                    <ExportButton onClick={handleExport} />
                </div>

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Manufacturer</label>
                        <SearchableDropdown 
                            value={selectedVendor}
                            onChange={(val) => setSelectedVendor(val)}
                            options={dropdownOptions}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>From Date</label>
                        <input 
                            type="date" 
                            className="prof-search" 
                            style={{ width: '100%', height: '38px' }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>To Date</label>
                        <input 
                            type="date" 
                            className="prof-search" 
                            style={{ width: '100%', height: '38px' }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Search PO / Zone</label>
                        <input 
                            type="text" 
                            placeholder="Search..."
                            className="prof-search" 
                            style={{ width: '100%', height: '38px' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Responsive Scroll */}
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="prof-table" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
                            <tr>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>S.No.</th>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>Zonal Railway</th>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>Vendor</th>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>Type of Rubber Pad</th>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>P.O. No. & Date</th>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>Specification</th>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>Total P.O. Qty</th>
                                <th colSpan="2" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#ecfdf5', color: '#065f46', fontWeight: 'bold' }}>Process Inspection</th>
                                <th colSpan="2" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#eff6ff', color: '#1e40af', fontWeight: 'bold' }}>Final Inspection</th>
                                <th colSpan="19" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fff7ed', color: '#9a3412', fontWeight: 'bold' }}>No. of Rubber Pads rejected & reasons for rejection</th>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>Remarks</th>
                                <th rowSpan="3" className="th-blue-bg" style={{ border: '1px solid #cbd5e1', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>%age Rejection</th>
                            </tr>
                            <tr>
                                <th rowSpan="2" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#ecfdf5', color: '#065f46', fontWeight: 'bold' }}>Inspected</th>
                                <th rowSpan="2" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#ecfdf5', color: '#065f46', fontWeight: 'bold' }}>Accepted</th>
                                <th rowSpan="2" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#eff6ff', color: '#1e40af', fontWeight: 'bold' }}>IC Issued Qty</th>
                                <th rowSpan="2" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#eff6ff', color: '#1e40af', fontWeight: 'bold' }}>Last Date of IC</th>
                                
                                <th colSpan="8" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#b45309', fontWeight: 'bold' }}>Process</th>
                                <th colSpan="11" style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#b45309', fontWeight: 'bold' }}>Acceptance</th>
                            </tr>
                            <tr>
                                {/* Process defect list */}
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#b45309', fontWeight: 'bold' }}>TOTAL</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#78350f' }}>RAW<br/>MATERIAL</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#78350f' }}>COMPOUNDING</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#78350f' }}>MIXING</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#78350f' }}>CURING</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#78350f' }}>CUTTING</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#78350f' }}>RHEOMETER</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', color: '#78350f' }}>VISUAL /<br/>FINISHING</th>

                                {/* Acceptance defect list */}
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Hardness</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Specific Gravity</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Rubber Content</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Ash Content</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Rebound Resilience</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Dimension</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Weight</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Surface Defect</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Compression Set</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Visual Test</th>
                                <th style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb', color: '#78350f' }}>Other Clause</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="33" className="text-center p-8 text-slate-400">Loading records...</td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="33" className="text-center p-8 text-slate-400">No records found.</td>
                                </tr>
                            ) : (
                                filteredRecords.map((row, i) => {
                                    const totalProcRej = row.rawMaterialCheck + row.compounding + row.mixing + row.curing + row.cutting + row.rheometer + row.visualCheckFinishing;
                                    return (
                                        <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>{i + 1}</td>
                                            <td style={{ border: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center' }}>{row.zonalRailway}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>{row.vendor}</td>
                                            <td style={{ border: '1px solid #cbd5e1', fontSize: '11px', color: '#475569', textAlign: 'center' }}>{row.typeOfRubberPad}</td>
                                            <td style={{ border: '1px solid #cbd5e1', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                <div><strong>{row.zonalRailway}-{row.poNo}</strong></div>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{row.poDate}</div>
                                            </td>
                                            <td style={{ border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'center' }}></td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: '500' }}>{row.totalPoQty.toLocaleString()} {row.uom || ''}</td>
                                            
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#f0fdf4' }}>{row.qtyInspected.toLocaleString()}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#f0fdf4', color: '#16a34a', fontWeight: 'bold' }}>{row.qtyAccepted.toLocaleString()}</td>
                                            
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#f0f9ff' }}>{row.icIssuedQty.toLocaleString()}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#f0f9ff', fontSize: '11px' }}>{row.lastDateIcIssued || '-'}</td>
                                            
                                            {/* Process defects breakdown */}
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2', fontWeight: 'bold', color: '#ea580c' }}>{totalProcRej.toLocaleString()}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2' }}>{row.rawMaterialCheck || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2' }}>{row.compounding || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2' }}>{row.mixing || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2' }}>{row.curing || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2' }}>{row.cutting || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2' }}>{row.rheometer || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffaf2' }}>{row.visualCheckFinishing || '-'}</td>

                                            {/* Acceptance defects breakdown */}
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.hardness || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.specificGravity || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.rubberContent || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.ashContent || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.reboundResilience || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.dimension || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.weight || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.surfaceDefect || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.compressionSet || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.visualTest || '-'}</td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', background: '#fffbeb' }}>{row.otherRejection || '-'}</td>

                                            <td style={{ border: '1px solid #cbd5e1', fontStyle: 'italic', fontSize: '11px', color: '#475569', textAlign: 'center' }}></td>
                                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                                <span className="prof-badge" style={{ 
                                                    background: row.rejectionPercent > 5 ? '#fef2f2' : '#f0fdf4', 
                                                    color: row.rejectionPercent > 5 ? '#dc2626' : '#16a34a',
                                                    fontWeight: 'bold' 
                                                }}>
                                                    {row.rejectionPercent.toFixed(2)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RailPadQualityReport;
