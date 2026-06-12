import React, { useState, useMemo, useEffect } from 'react';
import { downloadExcel } from '../SharedComponents';
import './SleeperQualityReport.css';
import reportService from '../../../services/reportService';

const SleeperQualityReport = ({ fromDate, toDate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch Quality of PSC Sleepers Report Data from API
    useEffect(() => {
        const fetchQualityReportData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await reportService.getSleeperQualityReport({
                    startDate: fromDate,
                    endDate: toDate
                });
                
                const rawList = response.responseData || response || [];
                const mappedData = rawList.map((row, idx) => {
                    const cleanCspName = row.plantId ? row.plantId.replace(/^:\d+\//, '') : 'Unknown CSP';
                    return {
                        sNo: idx + 1,
                        railway: row.railwayZone || 'Others',
                        csp: cleanCspName,
                        type: row.sleeperType || 'Mainline',
                        produced: row.totalProducedSleepers ?? 0,
                        inspected: row.noOfSleeperInspectedInProcess ?? 0,
                        rejectedInProcess: row.noOfSleeperRejectedInProcess ?? 0,
                        icIssuedQty: 0,
                        icIssuedCount: 0,
                        lastIcDate: '-',
                        totalNosRej: row.totalRejectedDefects ?? 0,
                        rejDimension: row.forDimensionToeGauge ?? 0,
                        rejEndDamage: row.forEndDamage ?? 0,
                        rejHoneyCombing: row.honeyCombingSurfaceDefectCrack ?? 0,
                        rejMissingDowel: row.missingDowel ?? 0,
                        rejOther: row.otherDefectsInsertSinkTilt ?? 0,
                        remarks: ''
                    };
                });
                setData(mappedData);
            } catch (err) {
                console.error("Failed to fetch sleeper quality report data:", err);
                setError(err.message || "Failed to retrieve Quality of PSC Sleepers Report data.");
            } finally {
                setLoading(false);
            }
        };

        if (fromDate && toDate) {
            fetchQualityReportData();
        }
    }, [fromDate, toDate]);

    // Filter and group data dynamically
    const filteredAndGroupedData = useMemo(() => {
        let list = [...data];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(item =>
                (item.railway || '').toLowerCase().includes(q) ||
                (item.csp || '').toLowerCase().includes(q) ||
                (item.type || '').toLowerCase().includes(q)
            );
        }

        if (selectedTypeFilter !== 'All') {
            list = list.filter(item => {
                if (selectedTypeFilter === 'Mainline') return (item.type || '').includes('Mainline');
                if (selectedTypeFilter === 'Turnout') return (item.type || '').includes('Turnout');
                if (selectedTypeFilter === 'Special') return (item.type || '').includes('Special');
                if (selectedTypeFilter === 'Trial') return (item.type || '').includes('Trial');
                return true;
            });
        }

        const railwayGroups = {};
        let rlyIndex = 1;

        list.forEach(item => {
            const rly = item.railway || 'Others';
            if (!railwayGroups[rly]) {
                railwayGroups[rly] = {
                    railway: rly,
                    csps: {},
                    sNo: rlyIndex++,
                    subTotal: { produced: 0, inspected: 0, rejectedInProcess: 0, icIssuedQty: 0, icIssuedCount: 0, totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0 }
                };
            }

            const cspName = item.csp;
            if (!railwayGroups[rly].csps[cspName]) {
                railwayGroups[rly].csps[cspName] = [];
            }
            item.sNo = railwayGroups[rly].sNo;
            railwayGroups[rly].csps[cspName].push(item);

            const sub = railwayGroups[rly].subTotal;
            sub.produced += item.produced;
            sub.inspected += item.inspected;
            sub.rejectedInProcess += item.rejectedInProcess;
            sub.icIssuedQty += item.icIssuedQty;
            sub.icIssuedCount += item.icIssuedCount;
            sub.totalNosRej += item.totalNosRej;
            sub.rejDimension += item.rejDimension;
            sub.rejEndDamage += item.rejEndDamage;
            sub.rejHoneyCombing += item.rejHoneyCombing;
            sub.rejMissingDowel += item.rejMissingDowel;
            sub.rejOther += item.rejOther;
        });

        return Object.values(railwayGroups).map(group => {
            const sub = group.subTotal;
            sub.percentage = sub.produced > 0 ? ((sub.totalNosRej / sub.produced) * 100).toFixed(2) : '0.00';
            const cspsList = Object.entries(group.csps).map(([cspName, items]) => ({ cspName, items }));
            return { ...group, cspsList };
        });
    }, [data, searchQuery, selectedTypeFilter]);

    const grandTotal = useMemo(() => {
        const total = { produced: 0, inspected: 0, rejectedInProcess: 0, icIssuedQty: 0, icIssuedCount: 0, totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0 };
        filteredAndGroupedData.forEach(rly => {
            const sub = rly.subTotal;
            total.produced += sub.produced;
            total.inspected += sub.inspected;
            total.rejectedInProcess += sub.rejectedInProcess;
            total.icIssuedQty += sub.icIssuedQty;
            total.icIssuedCount += sub.icIssuedCount;
            total.totalNosRej += sub.totalNosRej;
            total.rejDimension += sub.rejDimension;
            total.rejEndDamage += sub.rejEndDamage;
            total.rejHoneyCombing += sub.rejHoneyCombing;
            total.rejMissingDowel += sub.rejMissingDowel;
            total.rejOther += sub.rejOther;
        });
        total.percentage = total.produced > 0 ? ((total.totalNosRej / total.produced) * 100).toFixed(2) : '0.00';
        return total;
    }, [filteredAndGroupedData]);

    const getSubtitle = () => {
        if (!fromDate && !toDate) return 'Quality of PSC sleepers during 2026-27';
        const formatMonth = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[d.getMonth()]}'${String(d.getFullYear()).slice(2)}`;
        };
        return `Quality of PSC sleepers from ${formatMonth(fromDate) || "April'26"} to ${formatMonth(toDate) || "March'27"}`;
    };

    const handleExportExcel = () => {
        const flattened = [];
        filteredAndGroupedData.forEach(rly => {
            rly.cspsList.forEach(csp => {
                csp.items.forEach(item => {
                    flattened.push({
                        'Railway': rly.railway, 'CSP Name': csp.cspName, 'Sleeper Type': item.type,
                        'Sleepers Produced': item.produced, 'Sleepers Inspected': item.inspected,
                        'Rejected In Process': item.rejectedInProcess, 'IC Issued Qty': item.icIssuedQty,
                        'IC Issued Count': item.icIssuedCount, 'Last IC Date': item.lastIcDate,
                        'Total IC Rejections': item.totalNosRej, 'Rejection Dimension': item.rejDimension,
                        'Rejection End Damage': item.rejEndDamage, 'Rejection Honey Combing': item.rejHoneyCombing,
                        'Rejection Missing Dowel': item.rejMissingDowel, 'Rejection Other': item.rejOther,
                        'Remarks': item.remarks || '', 'Rejection Percentage': item.produced > 0 ? ((item.totalNosRej / item.produced) * 100).toFixed(2) + '%' : '0.00%'
                    });
                });
            });
        });
        if (flattened.length === 0) return;
        const headers = [{ label: 'Railway', key: 'Railway' }, { label: 'CSP Name', key: 'CSP Name' }, { label: 'Sleeper Type', key: 'Sleeper Type' }, { label: 'Sleepers Produced', key: 'Sleepers Produced' }, { label: 'Sleepers Inspected', key: 'Sleepers Inspected' }, { label: 'Rejected In Process', key: 'Rejected In Process' }, { label: 'IC Issued Qty', key: 'IC Issued Qty' }, { label: 'IC Issued Count', key: 'IC Issued Count' }, { label: 'Last IC Date', key: 'Last IC Date' }, { label: 'Total IC Rejections', key: 'Total IC Rejections' }, { label: 'Rejection Dimension', key: 'Rejection Dimension' }, { label: 'Rejection End Damage', key: 'Rejection End Damage' }, { label: 'Rejection Honey Combing', key: 'Rejection Honey Combing' }, { label: 'Rejection Missing Dowel', key: 'Rejection Missing Dowel' }, { label: 'Rejection Other', key: 'Rejection Other' }, { label: 'Remarks', key: 'Remarks' }, { label: 'Rejection %', key: 'Rejection Percentage' }];
        downloadExcel(flattened, headers, 'Quality_of_PSC_Sleepers_Report');
    };

    const fmtDefect = (val) => (val === null || val === undefined || val === 0 ? '0' : val.toLocaleString());

    if (loading) {
        return (
            <div className="sqr-container animate-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                <div className="text-center">
                    <div className="spinner-border text-emerald-600 mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="text-slate-500 font-medium">Fetching Quality of PSC Sleepers Report...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sqr-container animate-up" style={{ padding: '20px' }}>
                <div className="alert alert-danger" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Data Fetch Error</h5>
                    <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sqr-container animate-up">
            <div className="sqr-header-section">
                <div className="sqr-title-group">
                    <h2>Quality of PSC Sleepers Report</h2>
                    <p className="sqr-subtitle">{getSubtitle()}</p>
                </div>
                <div className="sqr-actions-group">
                    <div className="sqr-filter-select">
                        <select value={selectedTypeFilter} onChange={(e) => setSelectedTypeFilter(e.target.value)} className="sqr-select">
                            <option value="All">All Types</option>
                            <option value="Mainline">Mainline</option>
                            <option value="Turnout">Turnout</option>
                            <option value="Special">Special</option>
                            <option value="Trial">On Trial</option>
                        </select>
                    </div>
                    <div className="sqr-search-wrapper">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Search CSP or Zonal Railway..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button className="sqr-export-btn" onClick={handleExportExcel}>
                        <i className="fa-solid fa-file-excel"></i> Export Excel
                    </button>
                </div>
            </div>

            <div className="sqr-table-wrapper">
                <table className="sqr-table">
                    <thead>
                        <tr>
                            <th rowSpan="3" className="sticky-col col-sno">S.No.</th>
                            <th rowSpan="3" className="sticky-col col-railway">Railway</th>
                            <th rowSpan="3" className="sticky-col col-csp">CSPs</th>
                            <th rowSpan="3" className="col-type">Type of PSC sleepers</th>
                            <th rowSpan="3" className="col-prod">No. of sleepers produced during the month</th>
                            <th rowSpan="3" className="col-insp">Nos. of sleepers inspected & Process Inspection Completed</th>
                            <th rowSpan="3" className="col-rej-proc">Nos. of sleepers rejected in process inspection during the month</th>
                            <th rowSpan="3" className="col-ic-qty">IC Issued Qty.</th>
                            <th rowSpan="3" className="col-ic-cnt">No. of IC issued in the month</th>
                            <th rowSpan="3" className="col-ic-date">Last Date of IC Issued</th>
                            <th colSpan="6" className="rejection-main-header">No. of sleepers rejected during process & final & reasons for rejection<br/>Based on IC</th>
                            <th rowSpan="3" className="col-remarks">Remarks, if any</th>
                            <th rowSpan="3" className="col-pct-rej">%age rejection</th>
                        </tr>
                        <tr>
                            <th rowSpan="2" className="col-rej-tot">Total Nos.<br/>(Process + final)</th>
                            <th colSpan="5" className="defect-sub-header">Defect Category</th>
                        </tr>
                        <tr className="defect-names-header">
                            <th>for Dimension/<br/>Toe Gauge</th>
                            <th>for End<br/>damage</th>
                            <th>Honey combing/<br/>Surface defect/Crack</th>
                            <th>Missing<br/>dowel</th>
                            <th>other defects<br/>(Insert sink/Tilt)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndGroupedData.map((rlyGroup, rIdx) => {
                            const totalRowsInGroup = rlyGroup.cspsList.reduce((acc, csp) => acc + csp.items.length, 0);
                            let isFirstRowForRailway = true;
                            return (
                                <React.Fragment key={rIdx}>
                                    {rlyGroup.cspsList.map((cspGroup, cIdx) => {
                                        let isFirstRowForCsp = true;

                                        return cspGroup.items.map((item, iIdx) => {
                                            const renderRailwayCell = isFirstRowForRailway;
                                            const renderCspCell = isFirstRowForCsp;

                                            isFirstRowForRailway = false;
                                            isFirstRowForCsp = false;

                                            const currentRejPercentage = item.produced > 0
                                                ? ((item.totalNosRej / item.produced) * 100).toFixed(2)
                                                : '0.00';

                                            return (
                                                <tr key={`${cIdx}-${iIdx}`} className={(rIdx + cIdx) % 2 === 0 ? 'row-even' : 'row-odd'}>
                                                    {renderRailwayCell && (
                                                        <td rowSpan={totalRowsInGroup + 1} className="text-center font-bold sticky-col col-sno">
                                                            {item.sNo}
                                                        </td>
                                                    )}
                                                    {renderRailwayCell && (
                                                        <td rowSpan={totalRowsInGroup + 1} className="text-center font-bold sticky-col col-railway">
                                                            {rlyGroup.railway}
                                                        </td>
                                                    )}
                                                    {renderCspCell && (
                                                        <td rowSpan={cspGroup.items.length} className="font-semibold sticky-col col-csp">
                                                            {cspGroup.cspName}
                                                        </td>
                                                    )}
                                                    <td className="col-type">{item.type}</td>
                                                    <td className="text-right font-medium">{item.produced.toLocaleString()}</td>
                                                    <td className="text-right text-slate-700">{item.inspected.toLocaleString()}</td>
                                                    <td className="text-right text-red-500 font-medium">{item.rejectedInProcess.toLocaleString()}</td>
                                                    <td className="text-right text-blue-600 font-bold bg-blue-50/20">{item.icIssuedQty.toLocaleString()}</td>
                                                    <td className="text-center text-blue-800 bg-blue-50/10">{item.icIssuedCount}</td>
                                                    <td className="text-center text-emerald-800 font-medium whitespace-nowrap">{item.lastIcDate}</td>
                                                    <td className="text-right font-bold text-red-600 bg-red-50/10">{item.totalNosRej.toLocaleString()}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejDimension)}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejEndDamage)}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejHoneyCombing)}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejMissingDowel)}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejOther)}</td>
                                                    <td className="col-remarks text-slate-500 text-left font-normal" style={{ minWidth: '220px', fontSize: '11px', lineHeight: '1.3' }}>
                                                        {item.remarks || '-'}
                                                    </td>
                                                    <td className="text-right font-bold text-slate-800">
                                                        {currentRejPercentage}%
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })}
                                    {/* Zonal Subtotal Row */}
                                    <tr className="subtotal-row">
                                        <td colSpan="2" className="text-right font-bold">Sub Total ({rlyGroup.railway})</td>
                                        <td className="text-right font-bold">{rlyGroup.subTotal.produced.toLocaleString()}</td>
                                        <td className="text-right font-bold">{rlyGroup.subTotal.inspected.toLocaleString()}</td>
                                        <td className="text-right font-bold text-red-500">{rlyGroup.subTotal.rejectedInProcess.toLocaleString()}</td>
                                        <td className="text-right font-bold text-blue-600">{rlyGroup.subTotal.icIssuedQty.toLocaleString()}</td>
                                        <td className="text-center font-bold text-blue-800">{rlyGroup.subTotal.icIssuedCount}</td>
                                        <td></td>
                                        <td className="text-right font-bold text-red-600">{rlyGroup.subTotal.totalNosRej.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejDimension.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejEndDamage.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejHoneyCombing.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejMissingDowel.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejOther.toLocaleString()}</td>
                                        <td></td>
                                        <td className="text-right font-bold text-slate-800">{rlyGroup.subTotal.percentage}%</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}

                        {/* Grand Total Row */}
                        {filteredAndGroupedData.length > 0 && (
                            <tr className="grand-total-row">
                                <td colSpan="3" className="text-center font-bold sticky-col" style={{ left: 0 }}>Grand Total</td>
                                <td></td>
                                <td className="text-right font-bold">{grandTotal.produced.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.inspected.toLocaleString()}</td>
                                <td className="text-right font-bold text-red-500">{grandTotal.rejectedInProcess.toLocaleString()}</td>
                                <td className="text-right font-bold text-blue-600">{grandTotal.icIssuedQty.toLocaleString()}</td>
                                <td className="text-center font-bold text-blue-800">{grandTotal.icIssuedCount}</td>
                                <td></td>
                                <td className="text-right font-bold text-red-600">{grandTotal.totalNosRej.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejDimension.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejEndDamage.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejHoneyCombing.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejMissingDowel.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejOther.toLocaleString()}</td>
                                <td></td>
                                <td className="text-right font-bold text-slate-900">{grandTotal.percentage}%</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SleeperQualityReport;
