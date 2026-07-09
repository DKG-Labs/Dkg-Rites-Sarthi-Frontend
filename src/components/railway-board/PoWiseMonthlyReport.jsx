import React, { useState, useEffect, useCallback } from 'react';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import reportService from '../../services/reportService';
import Pagination from '../Pagination';
import './PoWiseMonthlyReport.css';

const PoWiseMonthlyReport = ({ fromDate, toDate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(30);
    const [paginationInfo, setPaginationInfo] = useState({ totalElements: 0, totalPages: 0 });

    useEffect(() => {
        setPage(0);
    }, [fromDate, toDate]);

    // Fetch PO Wise data from API
    const fetchPoWiseData = useCallback(async (force = false) => {
        setLoading(true);
        setError(null);
        try {
            const response = await reportService.getPoWiseReport({
                startDate: fromDate,
                endDate: toDate,
                page: page,
                size: size,
                forceRefresh: force === true,
            });
            const reportData = response;
            if (Array.isArray(reportData)) {
                setData(reportData);
                setPaginationInfo({ totalElements: reportData.length, totalPages: 1 });
            } else if (reportData?.responseData?.content && Array.isArray(reportData.responseData.content)) {
                setData(reportData.responseData.content);
                setPaginationInfo({ 
                    totalElements: reportData.responseData.totalElements || 0, 
                    totalPages: reportData.responseData.totalPages || 0 
                });
            } else if (reportData && Array.isArray(reportData.content)) {
                setData(reportData.content);
                setPaginationInfo({ 
                    totalElements: reportData.totalElements || 0, 
                    totalPages: reportData.totalPages || 0 
                });
            } else if (reportData?.responseData && Array.isArray(reportData.responseData)) {
                setData(reportData.responseData);
                setPaginationInfo({ totalElements: reportData.responseData.length, totalPages: 1 });
            } else {
                console.error("Invalid data format for PoWiseMonthlyReport", reportData);
                setData([]);
                setPaginationInfo({ totalElements: 0, totalPages: 0 });
            }
        } catch (err) {
            console.error('Error fetching PO Wise Report:', err);
            setError('Failed to load PO Wise Report data.');
            setData([]);
            setPaginationInfo({ totalElements: 0, totalPages: 0 });
        }
        setLoading(false);
    }, [fromDate, toDate, page, size]);

    useEffect(() => {
        fetchPoWiseData(false);
    }, [fetchPoWiseData]);

    // Group data by zonalRailway
    const groupedData = React.useMemo(() => {
        // Filter by search query
        const filtered = data.filter(item => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                (item.zonalRailway || '').toLowerCase().includes(q) ||
                (item.vendor || '').toLowerCase().includes(q) ||
                (item.poNumber || '').toLowerCase().includes(q)
            );
        });

        // Group by zonalRailway
        const groups = {};
        filtered.forEach(item => {
            const zone = item.zonalRailway || 'Unknown';
            if (!groups[zone]) {
                groups[zone] = [];
            }
            groups[zone].push(item);
        });

        // Convert to array and compute subtotals
        let sNo = 0;
        return Object.entries(groups).map(([zone, vendors]) => {
            sNo++;
            const subTotal = {
                totalPoQuantity: vendors.reduce((sum, v) => sum + (v.poQty || 0), 0),
                processInspectedQty: vendors.reduce((sum, v) => sum + (v.processInspectedQty || 0), 0),
                processAcceptedQty: vendors.reduce((sum, v) => sum + (v.processAcceptedQty || 0), 0),
                finalOfferedQty: vendors.reduce((sum, v) => sum + (v.offeredForFinalInspectionQty || 0), 0),
                noOfIcIssued: vendors.reduce((sum, v) => sum + (v.noOfIcIssued || 0), 0),
                icIssuedQty: vendors.reduce((sum, v) => sum + (v.finalAcceptedQty || 0), 0),
                totalRejected: vendors.reduce((sum, v) => sum + (v.totalRejectedNos || v.totalRejections || 0), 0),
                chemicalCompositionRej: vendors.reduce((sum, v) => sum + (v.chemicalCompositionRej || 0), 0),
                diameterBarRej: vendors.reduce((sum, v) => sum + (v.diameterBarRej || 0), 0),
                grainSizeRej: vendors.reduce((sum, v) => sum + (v.grainSizeRej || 0), 0),
                inclusionRatingRej: vendors.reduce((sum, v) => sum + (v.inclusionRatingRej || 0), 0),
                depthOfDecarbRej: vendors.reduce((sum, v) => sum + (v.depthOfDecarbRej || 0), 0),
                hardnessRawRej: vendors.reduce((sum, v) => sum + (v.hardnessRawRej || 0), 0),
                shearingRej: vendors.reduce((sum, v) => sum + (v.shearingRej || 0), 0),
                mpiRej: vendors.reduce((sum, v) => sum + (v.mpiRej || 0), 0),
                turningRej: vendors.reduce((sum, v) => sum + (v.turningRej || 0), 0),
                forgingRej: vendors.reduce((sum, v) => sum + (v.forgingRej || 0), 0),
                quenchingRej: vendors.reduce((sum, v) => sum + (v.quenchingRej || 0), 0),
                temperingRej: vendors.reduce((sum, v) => sum + (v.temperingRej || 0), 0),
                dimensionFinishedErcRej: vendors.reduce((sum, v) => sum + (v.dimensionFinishedErcRej || 0), 0),
                hardnessProcessRej: vendors.reduce((sum, v) => sum + (v.hardnessProcessRej || 0), 0),
                depthOfDecarburizationRej: vendors.reduce((sum, v) => sum + (v.depthOfDecarburizationRej || 0), 0),
                dimensionToleranceRej: vendors.reduce((sum, v) => sum + (v.dimensionToleranceRej || 0), 0),
                applicationAndDeflectionTestRej: vendors.reduce((sum, v) => sum + (v.applicationAndDeflectionTestRej || 0), 0),
                toeLoadTestRej: vendors.reduce((sum, v) => sum + (v.toeLoadTestRej || 0), 0),
                weightRej: vendors.reduce((sum, v) => sum + (v.weightRej || 0), 0),
                visualTestRej: vendors.reduce((sum, v) => sum + (v.visualTestRej || 0), 0),
                microStructureRej: vendors.reduce((sum, v) => sum + (v.microStructureRej || 0), 0),
                freedomFromDefectsRej: vendors.reduce((sum, v) => sum + (v.freedomFromDefectsRej || 0), 0),
                otherRejections: vendors.reduce((sum, v) => sum + (v.otherRejections || 0), 0),
            };
            subTotal.percentage = subTotal.processInspectedQty > 0
                ? ((subTotal.totalRejected / subTotal.processInspectedQty) * 100).toFixed(2) + '%'
                : '0.00%';

            return {
                sNo,
                zonalRailway: zone,
                vendors,
                subTotal,
            };
        });
    }, [data, searchQuery]);

    // Format PO Date
    const formatPoDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Format number for display (show empty string for 0)
    const fmt = (val) => {
        if (val === null || val === undefined || val === 0) return '';
        return val.toLocaleString();
    };

    // Compute grand total
    const grandTotal = React.useMemo(() => {
        const total = {
            totalPoQuantity: 0,
            processInspectedQty: 0,
            processAcceptedQty: 0,
            finalOfferedQty: 0,
            noOfIcIssued: 0,
            icIssuedQty: 0,
            totalRejected: 0,
            chemicalCompositionRej: 0,
            diameterBarRej: 0,
            grainSizeRej: 0,
            inclusionRatingRej: 0,
            depthOfDecarbRej: 0,
            hardnessRawRej: 0,
            shearingRej: 0,
            mpiRej: 0,
            turningRej: 0,
            forgingRej: 0,
            quenchingRej: 0,
            temperingRej: 0,
            dimensionFinishedErcRej: 0,
            hardnessProcessRej: 0,
            depthOfDecarburizationRej: 0,
            dimensionToleranceRej: 0,
            applicationAndDeflectionTestRej: 0,
            toeLoadTestRej: 0,
            weightRej: 0,
            visualTestRej: 0,
            microStructureRej: 0,
            freedomFromDefectsRej: 0,
            otherRejections: 0,
        };
        groupedData.forEach(zone => {
            total.totalPoQuantity += zone.subTotal.totalPoQuantity;
            total.processInspectedQty += zone.subTotal.processInspectedQty;
            total.processAcceptedQty += zone.subTotal.processAcceptedQty;
            total.finalOfferedQty += zone.subTotal.finalOfferedQty;
            total.noOfIcIssued += zone.subTotal.noOfIcIssued;
            total.icIssuedQty += zone.subTotal.icIssuedQty;
            total.totalRejected += zone.subTotal.totalRejected;
            total.chemicalCompositionRej += zone.subTotal.chemicalCompositionRej;
            total.diameterBarRej += zone.subTotal.diameterBarRej;
            total.grainSizeRej += zone.subTotal.grainSizeRej;
            total.inclusionRatingRej += zone.subTotal.inclusionRatingRej;
            total.depthOfDecarbRej += zone.subTotal.depthOfDecarbRej;
            total.hardnessRawRej += zone.subTotal.hardnessRawRej;
            total.shearingRej += zone.subTotal.shearingRej;
            total.mpiRej += zone.subTotal.mpiRej;
            total.turningRej += zone.subTotal.turningRej;
            total.forgingRej += zone.subTotal.forgingRej;
            total.quenchingRej += zone.subTotal.quenchingRej;
            total.temperingRej += zone.subTotal.temperingRej;
            total.dimensionFinishedErcRej += zone.subTotal.dimensionFinishedErcRej;
            total.hardnessProcessRej += zone.subTotal.hardnessProcessRej;
            total.depthOfDecarburizationRej += zone.subTotal.depthOfDecarburizationRej;
            total.dimensionToleranceRej += zone.subTotal.dimensionToleranceRej;
            total.applicationAndDeflectionTestRej += zone.subTotal.applicationAndDeflectionTestRej;
            total.toeLoadTestRej += zone.subTotal.toeLoadTestRej;
            total.weightRej += zone.subTotal.weightRej;
            total.visualTestRej += zone.subTotal.visualTestRej;
            total.microStructureRej += zone.subTotal.microStructureRej;
            total.freedomFromDefectsRej += zone.subTotal.freedomFromDefectsRej;
            total.otherRejections += zone.subTotal.otherRejections;
        });
        total.percentage = total.processInspectedQty > 0
            ? ((total.totalRejected / total.processInspectedQty) * 100).toFixed(2) + '%'
            : '0.00%';
        return total;
    }, [groupedData]);

    // Generate dynamic subtitle
    const getSubtitle = () => {
        if (!fromDate && !toDate) return 'Quality of ERCs';
        const formatMonth = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[d.getMonth()]}'${String(d.getFullYear()).slice(2)}`;
        };
        return `Quality of ERCs from ${formatMonth(fromDate)} to ${formatMonth(toDate)}`;
    };

    // Export to Excel
    const handleExportExcel = async () => {
        if (!data || data.length === 0) return;

        const rows = [];
        groupedData.forEach(zone => {
            zone.vendors.forEach(v => {
                rows.push({
                    'Zonal Railway': zone.zonalRailway,
                    'Vendor': v.vendor || '',
                    'Type of ERCs': v.ercType || '',
                    'P.O. No. & Date': `${v.poNumber || ''} Dt:${formatPoDate(v.poDate)}`,
                    'Specification': v.specification || '',
                    'Total P.O. Quantity': v.poQty || 0,
                    'Qty Inspected (Process)': v.processInspectedQty || 0,
                    'Qty Accepted (Process)': v.processAcceptedQty || 0,
                    'Qty Offered (Final)': v.offeredForFinalInspectionQty || 0,
                    'No. of IC Issued': v.noOfIcIssued || 0,
                    'IC Issued Qty': v.finalAcceptedQty || 0,
                    'Last Date of IC': formatPoDate(v.lastIcIssuedDate) || '',
                    'Total Rejected': v.totalRejectedNos || v.totalRejections || 0,
                    'Chemical composition': v.chemicalCompositionRej || 0,
                    'Diameter of bar': v.diameterBarRej || 0,
                    'Grain size': v.grainSizeRej || 0,
                    'Inclusion rating': v.inclusionRatingRej || 0,
                    'Depth of decarb.': v.depthOfDecarbRej || 0,
                    'Hardness (RM)': v.hardnessRawRej || 0,
                    'Shearing Rej': v.shearingRej || 0,
                    'MPI Rej': v.mpiRej || 0,
                    'Turning Rej': v.turningRej || 0,
                    'Forging Rej': v.forgingRej || 0,
                    'Quenching Rej': v.quenchingRej || 0,
                    'Tempering Rej': v.temperingRej || 0,
                    'Dimension (Finished ERC)': v.dimensionFinishedErcRej || 0,
                    'Hardness (Process)': v.hardnessProcessRej || 0,
                    'Final - Depth of Decarburization': v.depthOfDecarburizationRej || 0,
                    'Final - Dimension tolerance': v.dimensionToleranceRej || 0,
                    'Final - Application & Deflection test': v.applicationAndDeflectionTestRej || 0,
                    'Final - Toe Load test': v.toeLoadTestRej || 0,
                    'Final - Weight': v.weightRej || 0,
                    'Final - Visual test': v.visualTestRej || 0,
                    'Final - Micro Structure': v.microStructureRej || 0,
                    'Final - Freedom from defects': v.freedomFromDefectsRej || 0,
                    'Final - Other rejections': v.otherRejections || 0,
                    'Remarks': v.remarks || '',
                });
            });
        });

        // ExcelJS export
        if (rows.length === 0) return;
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        const displayTitle = 'PO Wise Monthly Progress Report';
        const titleRow = worksheet.addRow([displayTitle]);
        titleRow.font = { bold: true, size: 14 };

        const headers = Object.keys(rows[0]);
        if (headers.length > 1) {
            worksheet.mergeCells(1, 1, 1, headers.length);
        }

        worksheet.addRow([]);

        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });

        rows.forEach(rowObj => {
            worksheet.addRow(headers.map(h => rowObj[h]));
        });

        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                let columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) maxLength = columnLength;
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `PO_Wise_Quality_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="pwmr-container animate-up">
            <div className="pwmr-header">
                <div className="pwmr-title-section">
                    <h2>PO Wise Quality Report</h2>
                    <p className="pwmr-subtitle">{getSubtitle()}</p>
                </div>
                <div className="pwmr-actions">
                    <div className="pwmr-search-wrapper">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input 
                            type="text" 
                            placeholder="Search Zonal Railway or Vendor..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="pwmr-export-btn" onClick={handleExportExcel} disabled={data.length === 0}>
                        <i className="fa-solid fa-file-excel"></i> Export Excel
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="pwmr-loading">
                    <div className="pwmr-spinner"></div>
                    <p>Loading PO Wise Report...</p>
                </div>
            ) : error ? (
                <div className="pwmr-error">
                    <p>{error}</p>
                    <button onClick={() => fetchPoWiseData(true)} className="pwmr-retry-btn">Retry</button>
                </div>
            ) : data.length === 0 ? (
                <div className="pwmr-empty">
                    <p>No data available for the selected date range.</p>
                </div>
            ) : (
                <div className="pwmr-table-wrapper">
                    <table className="pwmr-table">
                        <thead>
                            <tr>
                                <th rowSpan="3" className="sticky-col col-sno">S.No.</th>
                                <th rowSpan="3" className="sticky-col col-railway">Zonal Railway</th>
                                <th rowSpan="3" className="sticky-col col-vendor">Vendor</th>
                                <th rowSpan="3" className="col-type">Type of ERCs<br/>(eg. ERC MK-V)</th>
                                <th rowSpan="3">P.O. No. & Date</th>
                                <th rowSpan="3" style={{ minWidth: '180px' }}>Specification (T-31-2025- Sixth Revision/ T-31-2021) Mention the specification</th>
                                <th rowSpan="3" style={{ minWidth: '130px' }}>Total P.O. Quantity for Process Inspection</th>
                                <th rowSpan="3" style={{ minWidth: '130px' }}>Quantity Inspected in Process inspection</th>
                                <th rowSpan="3" style={{ minWidth: '130px' }}>Quantity Accepted in Process inspection</th>
                                <th rowSpan="3" style={{ minWidth: '130px' }}>Quantity offered for final inspection</th>
                                <th rowSpan="3" style={{ minWidth: '110px' }}>No. of IC Issued for this PO</th>
                                <th rowSpan="3" style={{ minWidth: '140px' }}>IC Issued Qty. (Accepted in Final inspection)</th>
                                <th rowSpan="3" style={{ minWidth: '130px' }}>Last Date of IC Issued for final inspection</th>
                                <th colSpan="24" className="rejection-main-header">No. of ERC rejected & reasons for rejection</th>
                                <th rowSpan="3">Remarks, if any</th>
                                <th rowSpan="3">%age rejection</th>
                            </tr>
                            <tr>
                                <th rowSpan="2">Total Nos.</th>
                                <th colSpan="6" className="rm-check-header">Raw material check</th>
                                <th colSpan="8" className="process-header">Processs</th>
                                <th colSpan="9" className="acceptance-header">Acceptance (Final)</th>
                            </tr>
                            <tr>
                                {/* Raw Material Check */}
                                <th>Chemical composition</th>
                                <th>Diameter of bar</th>
                                <th>Grain size</th>
                                <th>Inclusion rating</th>
                                <th>Depth of decarb.</th>
                                <th>Hardness</th>
                                {/* Process */}
                                <th>Shearing</th>
                                <th>MPI</th>
                                <th>Turning</th>
                                <th>Forging</th>
                                <th>Quenching</th>
                                <th>Tempering</th>
                                <th>Dimension (finished ERC)</th>
                                <th>Hardness</th>
                                {/* Final Acceptance */}
                                <th>Depth of Decarburization</th>
                                <th>Dimension tolerance</th>
                                <th>Application & Deflection test</th>
                                <th>Toe Load test</th>
                                <th>Weight</th>
                                <th>Visual test</th>
                                <th>Micro Structure</th>
                                <th>Freedom from defects</th>
                                <th>Other rejections</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.map((zone, zIdx) => (
                                <React.Fragment key={zIdx}>
                                    {zone.vendors.map((vendor, vIdx) => (
                                        <tr key={`${zIdx}-${vIdx}`} className={vIdx % 2 === 0 ? 'row-even' : 'row-odd'}>
                                            {vIdx === 0 && (
                                                <td rowSpan={zone.vendors.length + 1} className={`text-center font-bold sticky-col col-sno ${zone.sNo % 2 === 0 ? 'zone-dark' : 'zone-light'}`}>
                                                    {zone.sNo}
                                                </td>
                                            )}
                                            {vIdx === 0 && (
                                                <td rowSpan={zone.vendors.length + 1} className={`text-center font-bold sticky-col col-railway ${zone.sNo % 2 === 0 ? 'zone-dark' : 'zone-light'}`}>
                                                    {zone.zonalRailway}
                                                </td>
                                            )}
                                            <td className="sticky-col col-vendor">{vendor.vendor}</td>
                                            <td className="col-type">{vendor.ercType}</td>
                                            <td className="nowrap">{vendor.poNumber}<br/><span className="po-date">Dt:{formatPoDate(vendor.poDate)}</span></td>
                                            <td className="text-center">{vendor.specification || ''}</td>
                                            <td className="text-right">{(vendor.poQty || 0).toLocaleString()}</td>
                                            <td className="text-right">{(vendor.processInspectedQty || 0).toLocaleString()}</td>
                                            <td className="text-right">{(vendor.processAcceptedQty || 0).toLocaleString()}</td>
                                            <td className="text-right">{(vendor.offeredForFinalInspectionQty || 0).toLocaleString()}</td>
                                            <td className="text-right">{(vendor.noOfIcIssued || 0).toLocaleString()}</td>
                                            <td className="text-right">{(vendor.finalAcceptedQty || 0).toLocaleString()}</td>
                                            <td className="text-center">{formatPoDate(vendor.lastIcIssuedDate) || ''}</td>
                                            <td className="text-right font-bold text-red-600">{fmt(vendor.totalRejectedNos ?? vendor.totalRejections)}</td>
                                            {/* Raw Material Check */}
                                            <td className="text-right">{fmt(vendor.chemicalCompositionRej)}</td>
                                            <td className="text-right">{fmt(vendor.diameterBarRej)}</td>
                                            <td className="text-right">{fmt(vendor.grainSizeRej)}</td>
                                            <td className="text-right">{fmt(vendor.inclusionRatingRej)}</td>
                                            <td className="text-right">{fmt(vendor.depthOfDecarbRej)}</td>
                                            <td className="text-right">{fmt(vendor.hardnessRawRej)}</td>
                                            {/* Process Rejections */}
                                            <td className="text-right">{fmt(vendor.shearingRej)}</td>
                                            <td className="text-right">{fmt(vendor.mpiRej)}</td>
                                            <td className="text-right">{fmt(vendor.turningRej)}</td>
                                            <td className="text-right">{fmt(vendor.forgingRej)}</td>
                                            <td className="text-right">{fmt(vendor.quenchingRej)}</td>
                                            <td className="text-right">{fmt(vendor.temperingRej)}</td>
                                            <td className="text-right">{fmt(vendor.dimensionFinishedErcRej)}</td>
                                            <td className="text-right">{fmt(vendor.hardnessProcessRej)}</td>
                                            {/* Final Acceptance */}
                                            <td className="text-right">{fmt(vendor.depthOfDecarburizationRej)}</td>
                                            <td className="text-right">{fmt(vendor.dimensionToleranceRej)}</td>
                                            <td className="text-right">{fmt(vendor.applicationAndDeflectionTestRej)}</td>
                                            <td className="text-right">{fmt(vendor.toeLoadTestRej)}</td>
                                            <td className="text-right">{fmt(vendor.weightRej)}</td>
                                            <td className="text-right">{fmt(vendor.visualTestRej)}</td>
                                            <td className="text-right">{fmt(vendor.microStructureRej)}</td>
                                            <td className="text-right">{fmt(vendor.freedomFromDefectsRej)}</td>
                                            <td className="text-right">{fmt(vendor.otherRejections)}</td>
                                            <td className="text-left">{vendor.remarks || ''}</td>
                                            {/* Rejection % */}
                                            <td className="text-right font-bold">
                                                {vendor.rejectionPercentage != null
                                                    ? Number(vendor.rejectionPercentage).toFixed(2) + '%'
                                                    : vendor.processInspectedQty > 0
                                                        ? (((vendor.totalRejectedNos ?? vendor.totalRejections ?? 0) / vendor.processInspectedQty) * 100).toFixed(2) + '%'
                                                        : '0.00%'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="subtotal-row">
                                        <td colSpan="4" className="text-right font-bold sticky-col" style={{ left: 150, zIndex: 10 }}>Sub Total</td>
                                        <td className="text-right font-bold">{zone.subTotal.totalPoQuantity ? zone.subTotal.totalPoQuantity.toLocaleString() : ''}</td>
                                        <td className="text-right font-bold">{zone.subTotal.processInspectedQty ? zone.subTotal.processInspectedQty.toLocaleString() : ''}</td>
                                        <td className="text-right font-bold">{zone.subTotal.processAcceptedQty ? zone.subTotal.processAcceptedQty.toLocaleString() : ''}</td>
                                        <td className="text-right font-bold">{zone.subTotal.finalOfferedQty ? zone.subTotal.finalOfferedQty.toLocaleString() : ''}</td>
                                        <td className="text-right font-bold">{zone.subTotal.noOfIcIssued ? zone.subTotal.noOfIcIssued.toLocaleString() : ''}</td>
                                        <td className="text-right font-bold">{zone.subTotal.icIssuedQty ? zone.subTotal.icIssuedQty.toLocaleString() : ''}</td>
                                        <td></td>
                                        <td className="text-right font-bold text-red-600">{fmt(zone.subTotal.totalRejected)}</td>
                                        {/* RM */}
                                        <td className="text-right font-bold">{fmt(zone.subTotal.chemicalCompositionRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.diameterBarRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.grainSizeRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.inclusionRatingRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.depthOfDecarbRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.hardnessRawRej)}</td>
                                        {/* Process */}
                                        <td className="text-right font-bold">{fmt(zone.subTotal.shearingRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.mpiRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.turningRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.forgingRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.quenchingRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.temperingRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.dimensionFinishedErcRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.hardnessProcessRej)}</td>
                                        {/* Final */}
                                        <td className="text-right font-bold">{fmt(zone.subTotal.depthOfDecarburizationRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.dimensionToleranceRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.applicationAndDeflectionTestRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.toeLoadTestRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.weightRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.visualTestRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.microStructureRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.freedomFromDefectsRej)}</td>
                                        <td className="text-right font-bold">{fmt(zone.subTotal.otherRejections)}</td>
                                        <td></td> {/* Remarks subtotal empty */}
                                        <td className="text-right font-bold">{zone.subTotal.percentage}</td>
                                    </tr>
                                </React.Fragment>
                            ))}
                            {/* Grand Total */}
                            {groupedData.length > 0 && (
                                <tr className="grand-total-row">
                                    <td colSpan="4" className="text-right font-bold sticky-col" style={{ left: 150, zIndex: 10 }}>Grand Total</td>
                                    <td className="text-right font-bold">{grandTotal.totalPoQuantity.toLocaleString()}</td>
                                    <td className="text-right font-bold">{grandTotal.processInspectedQty.toLocaleString()}</td>
                                    <td className="text-right font-bold">{grandTotal.processAcceptedQty.toLocaleString()}</td>
                                    <td className="text-right font-bold">{grandTotal.finalOfferedQty.toLocaleString()}</td>
                                    <td className="text-right font-bold">{grandTotal.noOfIcIssued.toLocaleString()}</td>
                                    <td className="text-right font-bold">{grandTotal.icIssuedQty.toLocaleString()}</td>
                                    <td></td>
                                    <td className="text-right font-bold text-red-600">{fmt(grandTotal.totalRejected)}</td>
                                    {/* RM */}
                                    <td className="text-right font-bold">{fmt(grandTotal.chemicalCompositionRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.diameterBarRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.grainSizeRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.inclusionRatingRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.depthOfDecarbRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.hardnessRawRej)}</td>
                                    {/* Process */}
                                    <td className="text-right font-bold">{fmt(grandTotal.shearingRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.mpiRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.turningRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.forgingRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.quenchingRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.temperingRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.dimensionFinishedErcRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.hardnessProcessRej)}</td>
                                    {/* Final */}
                                    <td className="text-right font-bold">{fmt(grandTotal.depthOfDecarburizationRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.dimensionToleranceRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.applicationAndDeflectionTestRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.toeLoadTestRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.weightRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.visualTestRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.microStructureRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.freedomFromDefectsRej)}</td>
                                    <td className="text-right font-bold">{fmt(grandTotal.otherRejections)}</td>
                                    <td></td> {/* Remarks */}
                                    <td className="text-right font-bold">{grandTotal.percentage}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {groupedData.length > 0 && !loading && (
                <Pagination
                    currentPage={page}
                    totalPages={paginationInfo.totalPages || 1}
                    start={page * size + 1}
                    end={Math.min((page + 1) * size, paginationInfo.totalElements)}
                    totalCount={paginationInfo.totalElements}
                    onPageChange={(newPage) => setPage(newPage)}
                    rows={size}
                    onRowsChange={(newSize) => {
                        setSize(newSize);
                        setPage(0);
                    }}
                />
            )}
        </div>
    );
};

export default PoWiseMonthlyReport;
