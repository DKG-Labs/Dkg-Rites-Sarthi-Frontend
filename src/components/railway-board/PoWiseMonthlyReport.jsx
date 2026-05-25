import React, { useState, useEffect, useCallback } from 'react';
import reportService from '../../services/reportService';
import './PoWiseMonthlyReport.css';

const PoWiseMonthlyReport = ({ fromDate, toDate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch PO Wise data from API
    const fetchPoWiseData = useCallback(async (force = false) => {
        setLoading(true);
        setError(null);
        try {
            const response = await reportService.getPoWiseReport({
                startDate: fromDate,
                endDate: toDate,
                forceRefresh: force === true,
            });
            const apiData = response.responseData || response || [];
            setData(Array.isArray(apiData) ? apiData : []);
        } catch (err) {
            console.error('Error fetching PO Wise Report:', err);
            setError('Failed to load PO Wise Report data.');
            setData([]);
        }
        setLoading(false);
    }, [fromDate, toDate]);

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
                (item.poNo || '').toLowerCase().includes(q)
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
                qtyInspected: vendors.reduce((sum, v) => sum + (v.qtyInspected || 0), 0),
                qtyAccepted: vendors.reduce((sum, v) => sum + (v.qtyAccpeted || 0), 0),
                totalRejected: vendors.reduce((sum, v) => sum + (v.totalRejected || 0), 0),
            };
            subTotal.percentage = subTotal.qtyInspected > 0
                ? ((subTotal.totalRejected / subTotal.qtyInspected) * 100).toFixed(2) + '%'
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
            qtyInspected: 0,
            qtyAccepted: 0,
            totalRejected: 0,
        };
        groupedData.forEach(zone => {
            total.qtyInspected += zone.subTotal.qtyInspected;
            total.qtyAccepted += zone.subTotal.qtyAccepted;
            total.totalRejected += zone.subTotal.totalRejected;
        });
        total.percentage = total.qtyInspected > 0
            ? ((total.totalRejected / total.qtyInspected) * 100).toFixed(2) + '%'
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
    const handleExportExcel = () => {
        if (!data || data.length === 0) return;

        const rows = [];
        groupedData.forEach(zone => {
            zone.vendors.forEach(v => {
                rows.push({
                    'Zonal Railway': zone.zonalRailway,
                    'Vendor': v.vendor || '',
                    'Type of ERC': v.typeOfErc || '',
                    'PO No.': v.poNo || '',
                    'PO Date': formatPoDate(v.poDate),
                    'Qty Inspected': v.qtyInspected || 0,
                    'Qty Accepted': v.qtyAccpeted || 0,
                    'Total Rejected': v.totalRejected || 0,
                    'RM - VM Defect': v.rmVmDefect || 0,
                    'RM - Dimensional': v.rmDimentionalDefect || 0,
                    'RM - Inclusion': v.rmInclusionDefect || 0,
                    'RM - Grain Size': v.rmGrainSizeDefect || 0,
                    'RM - Decarb': v.rmDecarbDefect || 0,
                    'Shearing Rej': v.processQty?.shearingRejectionQty || 0,
                    'Turning Rej': v.processQty?.turningRejectionQty || 0,
                    'MPI Rej': v.processQty?.mpiRejectionQty || 0,
                    'Forging Rej': v.processQty?.forgingRejectionQty || 0,
                    'Quenching Rej': v.processQty?.quenchingRejectionQty || 0,
                    'Tempering Rej': v.processQty?.temperingRejectionQty || 0,
                    'Final - Visual/Dim': v.finalVisualDimDefect || 0,
                    'Final - Hardness': v.finalHardnessDefect || 0,
                    'Final - Inclusion': v.finalInclusionDefect || 0,
                    'Final - Deflection': v.finalDeflectionDefect || 0,
                    'Final - Toe Load': v.finalToeLoadDefect || 0,
                });
            });
        });

        // Simple CSV export
        if (rows.length === 0) return;
        const headers = Object.keys(rows[0]);
        const csv = [
            headers.join(','),
            ...rows.map(row => headers.map(h => `"${row[h]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `PO_Wise_Monthly_Report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="pwmr-container animate-up">
            <div className="pwmr-header">
                <div className="pwmr-title-section">
                    <h2>PO Wise Monthly Report</h2>
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
                                <th rowSpan="3" className="col-type">Type of ERCs</th>
                                <th rowSpan="3">P.O. No. & Date</th>
                                <th rowSpan="3">Quantity Inspected</th>
                                <th rowSpan="3">Quantity Accepted</th>
                                <th colSpan="18" className="rejection-main-header">No. of ERC rejected & reasons for rejection</th>
                                <th rowSpan="3">%age rejection</th>
                            </tr>
                            <tr>
                                <th rowSpan="2">Total Nos.</th>
                                <th colSpan="5" className="rm-check-header">Raw Material Check</th>
                                <th colSpan="6" className="process-header">Process</th>
                                <th colSpan="5" className="acceptance-header">Final Acceptance</th>
                            </tr>
                            <tr>
                                {/* Raw Material Check */}
                                <th>VM Defect</th>
                                <th>Dimensional</th>
                                <th>Inclusion</th>
                                <th>Grain Size</th>
                                <th>Decarb</th>
                                {/* Process */}
                                <th>Shearing</th>
                                <th>Turning</th>
                                <th>MPI</th>
                                <th>Forging</th>
                                <th>Quenching</th>
                                <th>Tempering</th>
                                {/* Final Acceptance */}
                                <th>Visual/Dim</th>
                                <th>Hardness</th>
                                <th>Inclusion</th>
                                <th>Deflection</th>
                                <th>Toe Load</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.map((zone, zIdx) => (
                                <React.Fragment key={zIdx}>
                                    {zone.vendors.map((vendor, vIdx) => (
                                        <tr key={`${zIdx}-${vIdx}`} className={vIdx % 2 === 0 ? 'row-even' : 'row-odd'}>
                                            {vIdx === 0 && (
                                                <td rowSpan={zone.vendors.length + 1} className="text-center font-bold sticky-col col-sno">
                                                    {zone.sNo}
                                                </td>
                                            )}
                                            {vIdx === 0 && (
                                                <td rowSpan={zone.vendors.length + 1} className="text-center font-bold sticky-col col-railway">
                                                    {zone.zonalRailway}
                                                </td>
                                            )}
                                            <td className="sticky-col col-vendor">{vendor.vendor}</td>
                                            <td className="col-type">{vendor.typeOfErc}</td>
                                            <td className="nowrap">{vendor.poNo}<br/><span className="po-date">Dt:{formatPoDate(vendor.poDate)}</span></td>
                                            <td className="text-right">{(vendor.qtyInspected || 0).toLocaleString()}</td>
                                            <td className="text-right">{(vendor.qtyAccpeted || 0).toLocaleString()}</td>
                                            <td className="text-right font-bold text-red-600">{fmt(vendor.totalRejected)}</td>
                                            {/* Raw Material Check */}
                                            <td className="text-right">{fmt(vendor.rmVmDefect)}</td>
                                            <td className="text-right">{fmt(vendor.rmDimentionalDefect)}</td>
                                            <td className="text-right">{fmt(vendor.rmInclusionDefect)}</td>
                                            <td className="text-right">{fmt(vendor.rmGrainSizeDefect)}</td>
                                            <td className="text-right">{fmt(vendor.rmDecarbDefect)}</td>
                                            {/* Process Rejections */}
                                            <td className="text-right">{fmt(vendor.processQty?.shearingRejectionQty)}</td>
                                            <td className="text-right">{fmt(vendor.processQty?.turningRejectionQty)}</td>
                                            <td className="text-right">{fmt(vendor.processQty?.mpiRejectionQty)}</td>
                                            <td className="text-right">{fmt(vendor.processQty?.forgingRejectionQty)}</td>
                                            <td className="text-right">{fmt(vendor.processQty?.quenchingRejectionQty)}</td>
                                            <td className="text-right">{fmt(vendor.processQty?.temperingRejectionQty)}</td>
                                            {/* Final Acceptance */}
                                            <td className="text-right">{fmt(vendor.finalVisualDimDefect)}</td>
                                            <td className="text-right">{fmt(vendor.finalHardnessDefect)}</td>
                                            <td className="text-right">{fmt(vendor.finalInclusionDefect)}</td>
                                            <td className="text-right">{fmt(vendor.finalDeflectionDefect)}</td>
                                            <td className="text-right">{fmt(vendor.finalToeLoadDefect)}</td>
                                            {/* Rejection % */}
                                            <td className="text-right font-bold">
                                                {vendor.qtyInspected > 0
                                                    ? ((vendor.totalRejected / vendor.qtyInspected) * 100).toFixed(2) + '%'
                                                    : '0.00%'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="subtotal-row">
                                        <td colSpan="3" className="text-right font-bold">Sub Total</td>
                                        <td className="text-right font-bold">{zone.subTotal.qtyInspected.toLocaleString()}</td>
                                        <td className="text-right font-bold">{zone.subTotal.qtyAccepted.toLocaleString()}</td>
                                        <td className="text-right font-bold text-red-600">{fmt(zone.subTotal.totalRejected)}</td>
                                        <td colSpan="16"></td>
                                        <td className="text-right font-bold">{zone.subTotal.percentage}</td>
                                    </tr>
                                </React.Fragment>
                            ))}
                            {/* Grand Total */}
                            {groupedData.length > 0 && (
                                <tr className="grand-total-row">
                                    <td colSpan="3" className="text-center font-bold sticky-col" style={{ left: 0 }}>Grand Total</td>
                                    <td colSpan="2" className="text-right font-bold"></td>
                                    <td className="text-right font-bold">{grandTotal.qtyInspected.toLocaleString()}</td>
                                    <td className="text-right font-bold">{grandTotal.qtyAccepted.toLocaleString()}</td>
                                    <td className="text-right font-bold text-red-600">{fmt(grandTotal.totalRejected)}</td>
                                    <td colSpan="16"></td>
                                    <td className="text-right font-bold">{grandTotal.percentage}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PoWiseMonthlyReport;
