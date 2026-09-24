import React, { useState, useEffect, useMemo } from 'react';
import reportService from '../../../services/reportService';
import { ExportButton, downloadExcel } from '../SharedComponents';
import Pagination from '../../Pagination';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { PieChart, Pie, Cell } from 'recharts';
import './ProcessInspectionQualityTable.css';

// Reusable Drilldown Report Page Component
export const ProcessQualityReportPage = ({ manufacturer, data }) => {
    const defectAgg = {
        'Shearing': 0, 'Turning': 0, 'Forging': 0, 'Finishing': 0, 'Quenching': 0, 'Tempering': 0
    };

    (data || []).forEach(m => {
        defectAgg['Shearing'] += (m.shearingDefects?.lengthOfCutBar || 0) + (m.shearingDefects?.ovalityImproperDiaAtEnd || 0) + (m.shearingDefects?.sharpEdges || 0) + (m.shearingDefects?.crackedEdges || 0);
        defectAgg['Turning'] += (m.turningDefects?.parallelLength || 0) + (m.turningDefects?.fullTurningLength || 0) + (m.turningDefects?.turningDia || 0);
        defectAgg['Forging'] += (m.forgingDefects?.forgingTemperature || 0) + (m.forgingDefects?.forgingStabilisationRejection || 0) + (m.forgingDefects?.improperForging || 0) + (m.forgingDefects?.forgingMarksNotches || 0);
        defectAgg['Finishing'] += (m.finishingDefects?.paintIdentification || 0) + (m.finishingDefects?.ercCoating || 0);
        defectAgg['Quenching'] += (m.quenchingDefects?.quenchingTemperatureRejected || 0) + (m.quenchingDefects?.quenchingDurationRejected || 0) + (m.quenchingDefects?.quenchingHardnessRejected || 0) + (m.quenchingDefects?.boxGaugeRejected || 0) + (m.quenchingDefects?.flatBearingAreaRejected || 0);
        defectAgg['Tempering'] += (m.temperingDefects?.temperingTemp || 0) + (m.temperingDefects?.temperingDuration || 0);
    });

    const totalInspectedAllMonths = (data || []).reduce((acc, m) => acc + (m.inspected || 0), 0);
    const totalRejectedAllMonths = (data || []).reduce((acc, m) => acc + (m.processRejected || 0), 0);

    const pieData = Object.entries(defectAgg)
        .map(([name, value]) => ({
            name,
            value,
            rate: totalInspectedAllMonths > 0 ? (value / totalInspectedAllMonths) * 100 : 0
        }))
        .filter(d => d.value > 0);

    const totalDefects = pieData.reduce((acc, d) => acc + d.value, 0);
    const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div id="mpia-report-content" className="piq-report-card">
            {/* Header Title */}
            <div className="piq-report-header">
                <h2 className="piq-report-mfg-title">{manufacturer}</h2>
                <p className="piq-report-subtitle">Manufacturer Performance Analysis (Monthly)</p>
                <div className="piq-report-divider"></div>
            </div>

            {/* 2-Column Content Grid */}
            <div className="piq-report-grid">
                {/* Left: Donut Chart & Legend */}
                <div className="piq-chart-panel">
                    <h3 className="piq-panel-title">
                        <i className="fa-solid fa-chart-pie mr-2 text-blue-600"></i>
                        Process Defect Distribution
                    </h3>
                    {pieData.length > 0 ? (
                        <div className="piq-pie-wrapper">
                            <PieChart width={360} height={280} margin={{ top: 0, right: 40, bottom: 0, left: 40 }}>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    minAngle={12}
                                    dataKey="value"
                                    isAnimationActive={false}
                                    label={({ cx, cy, midAngle, outerRadius, name, payload }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = outerRadius + 22;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="11" fontWeight="700">
                                                {`${name} ${payload.rate.toFixed(2)}%`}
                                            </text>
                                        );
                                    }}
                                    labelLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </div>
                    ) : (
                        <div className="piq-no-defects">
                            <i className="fa-regular fa-circle-check text-3xl text-emerald-500 mb-2"></i>
                            <p>No process defects recorded in the selected period.</p>
                        </div>
                    )}

                    <div className="piq-legend-grid">
                        {pieData.map((d, i) => (
                            <div key={i} className="piq-legend-item">
                                <span className="piq-legend-dot" style={{ background: COLORS[i % COLORS.length] }}></span>
                                <span className="piq-legend-text">
                                    {d.name}: <strong>{d.value}</strong> <span className="text-slate-400">({totalDefects > 0 ? ((d.value / totalDefects) * 100).toFixed(0) : 0}%)</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Monthly Table & KPI Summaries */}
                <div className="piq-table-panel">
                    <h3 className="piq-panel-title">
                        <i className="fa-solid fa-calendar-days mr-2 text-emerald-600"></i>
                        Monthly Performance Breakdown
                    </h3>
                    <div className="piq-monthly-table-wrapper">
                        <table className="piq-monthly-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Month</th>
                                    <th className="text-right">Inspected (Nos.)</th>
                                    <th className="text-right">Rejected (Nos.)</th>
                                    <th className="text-right">% Rej</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data || []).map((m, i) => (
                                    <tr key={i}>
                                        <td className="piq-month-cell">
                                            {(() => {
                                                const [year, month] = (m.month || '').split('-');
                                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                return month ? `${months[parseInt(month, 10) - 1]} ${year}` : m.month;
                                            })()}
                                        </td>
                                        <td className="text-right font-medium text-slate-700">{Number(m.inspected || 0).toLocaleString('en-IN')}</td>
                                        <td className="text-right font-bold text-rose-600">{Number(m.processRejected || 0).toLocaleString('en-IN')}</td>
                                        <td className="text-right">
                                            <span className="piq-rej-pill">
                                                {Number(m.processRejPercent || 0).toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!data || data.length === 0) && (
                                    <tr><td colSpan="4" className="text-center py-6 text-slate-400 italic">No monthly performance records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* KPI Summary 3 Boxes */}
                    <div className="piq-kpi-summary-grid">
                        <div className="piq-kpi-box box-inspected">
                            <span className="piq-kpi-label">Total Inspected</span>
                            <span className="piq-kpi-val text-slate-800">{totalInspectedAllMonths.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="piq-kpi-box box-rejected">
                            <span className="piq-kpi-label">Total Rejected</span>
                            <span className="piq-kpi-val text-rose-600">{totalRejectedAllMonths.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="piq-kpi-box box-rate">
                            <span className="piq-kpi-label">Avg Rej %</span>
                            <span className="piq-kpi-val text-amber-600">
                                {totalInspectedAllMonths > 0
                                    ? ((totalRejectedAllMonths * 100) / totalInspectedAllMonths).toFixed(2)
                                    : '0.00'}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProcessInspectionQualityTable = ({ refreshTick = 0 }) => {
    // Dates State
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return d.toISOString().split('T')[0];
    });
    const [toDate, setToDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    // Data State
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Search and Sort
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'manufacturerName', direction: 'asc' });

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Modal 1: Manufacturer PO Details Modal
    const [selectedManufacturerForPo, setSelectedManufacturerForPo] = useState(null);
    const [poDetailsData, setPoDetailsData] = useState([]);
    const [poDetailsLoading, setPoDetailsLoading] = useState(false);

    // Modal 2: Open Inspection Calls Sub-Modal
    const [selectedPoForOpenCalls, setSelectedPoForOpenCalls] = useState(null);
    const [openCallsData, setOpenCallsData] = useState([]);
    const [openCallsLoading, setOpenCallsLoading] = useState(false);

    // Drilldown View: Dedicated Rejection Drilldown Page
    const [drilldownManufacturer, setDrilldownManufacturer] = useState(null);
    const [drilldownData, setDrilldownData] = useState([]);
    const [drilldownLoading, setDrilldownLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Batch PDF
    const [batchReportData, setBatchReportData] = useState(null);
    const [isPreparingBatchPdf, setIsPreparingBatchPdf] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);

    // Fetch Table Data
    const fetchTableData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await reportService.getProcessInspectionQualityTable({
                startDate: fromDate,
                endDate: toDate
            });
            const data = res?.responseData || res?.content || (Array.isArray(res) ? res : []);
            setTableData(data);
        } catch (err) {
            console.error('Failed to load Process Inspection Quality Table:', err);
            setError('Failed to load data. Please check your connection or date filters.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTableData();
    }, [refreshTick]);

    // Handle PO Details Modal
    const handleOpenPoDetails = async (manufacturerName) => {
        setSelectedManufacturerForPo(manufacturerName);
        setPoDetailsLoading(true);
        try {
            const res = await reportService.getManufacturerPoDetails(manufacturerName);
            const list = res?.responseData || res?.content || (Array.isArray(res) ? res : []);
            setPoDetailsData(list);
        } catch (err) {
            console.error('Failed to fetch PO details:', err);
            setPoDetailsData([]);
        } finally {
            setPoDetailsLoading(false);
        }
    };

    // Handle Open Calls Sub-Modal
    const handleOpenCallDetails = async (poNo) => {
        setSelectedPoForOpenCalls(poNo);
        setOpenCallsLoading(true);
        try {
            const res = await reportService.getPoOpenCalls(poNo);
            const list = res?.responseData || res?.content || (Array.isArray(res) ? res : []);
            setOpenCallsData(list);
        } catch (err) {
            console.error('Failed to fetch PO open calls:', err);
            setOpenCallsData([]);
        } finally {
            setOpenCallsLoading(false);
        }
    };

    // Handle Rejection Drilldown Click
    const handleOpenRejectionDrilldown = async (manufacturerName) => {
        setDrilldownManufacturer(manufacturerName);
        setDrilldownLoading(true);
        try {
            const start = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
            const end = new Date().toISOString().split('T')[0];
            const res = await reportService.getCompanyMonthWiseData({
                companyName: manufacturerName,
                startDate: start,
                endDate: end,
                page: 0,
                size: 13
            });
            const list = res?.responseData?.content || res?.content || (Array.isArray(res) ? res : []);
            setDrilldownData(list);
        } catch (err) {
            console.error('Failed to fetch monthly drilldown data:', err);
            setDrilldownData([]);
        } finally {
            setDrilldownLoading(false);
        }
    };

    // Drilldown Export: Image (PNG)
    const handleDownloadImage = async () => {
        const chartElement = document.getElementById('mpia-report-content');
        if (!chartElement) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Process_Quality_Report_${drilldownManufacturer}.png`;
            link.click();
        } catch (e) {
            console.error('Failed to generate image', e);
            alert('Failed to export image.');
        } finally {
            setIsExporting(false);
        }
    };

    // Drilldown Export: PPT (PowerPoint)
    const handleDownloadPpt = async () => {
        const chartElement = document.getElementById('mpia-report-content');
        if (!chartElement) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const dataUrl = canvas.toDataURL('image/png');
            const pptx = new PptxGenJS();
            const slide = pptx.addSlide();
            slide.addText(`Process Quality Report: ${drilldownManufacturer}`, {
                x: 0.5, y: 0.3, fontSize: 16, bold: true, color: '1e293b'
            });
            slide.addImage({ data: dataUrl, x: 0.5, y: 0.8, w: 9.0, h: 4.6, sizing: { type: 'contain', w: 9.0, h: 4.6 } });
            pptx.writeFile({ fileName: `Process_Quality_Report_${drilldownManufacturer}.pptx` });
        } catch (e) {
            console.error('Failed to generate PPT', e);
            alert('Failed to export PPT.');
        } finally {
            setIsExporting(false);
        }
    };

    // Drilldown Export: PDF
    const handleDownloadPdf = async () => {
        const chartElement = document.getElementById('mpia-report-content');
        if (!chartElement) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            const imgWidth = 280;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 8, 10, imgWidth, Math.min(imgHeight, 190));
            pdf.save(`Process_Quality_Report_${drilldownManufacturer}.pdf`);
        } catch (e) {
            console.error('Failed to generate PDF', e);
            alert('Failed to export PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    // Batch PDF Report
    const handleGenerateBatchPdf = async () => {
        if (!tableData || tableData.length === 0) {
            alert('No manufacturers available to generate batch report.');
            return;
        }
        try {
            setBatchProgress(0);
            setIsPreparingBatchPdf(true);
            const end = new Date().toISOString().split('T')[0];
            const start = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];

            const results = await Promise.all(tableData.map(async (m) => {
                try {
                    const res = await reportService.getCompanyMonthWiseData({
                        companyName: m.manufacturerName,
                        startDate: start,
                        endDate: end,
                        page: 0,
                        size: 13
                    });
                    const data = res.responseData?.content || res.content || res || [];
                    setBatchProgress(prev => prev + 1);
                    return { manufacturer: m.manufacturerName, data: Array.isArray(data) ? data : [] };
                } catch (e) {
                    return { manufacturer: m.manufacturerName, data: [] };
                }
            }));

            setBatchReportData(results);
            setTimeout(() => {
                window.print();
            }, 1000);
        } catch (err) {
            console.error('Failed to prepare batch PDF:', err);
            alert('Failed to prepare batch PDF data.');
        } finally {
            setIsPreparingBatchPdf(false);
        }
    };

    // Sorting Logic
    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <i className="fa-solid fa-sort sort-neutral"></i>;
        }
        return sortConfig.direction === 'asc'
            ? <i className="fa-solid fa-sort-up sort-active"></i>
            : <i className="fa-solid fa-sort-down sort-active"></i>;
    };

    // Filter & Sort Data
    const filteredAndSortedData = useMemo(() => {
        let list = [...tableData];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(row => (row.manufacturerName || '').toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }
            const numA = Number(valA || 0);
            const numB = Number(valB || 0);
            return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        });
        return list;
    }, [tableData, searchQuery, sortConfig]);

    const paginatedData = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredAndSortedData.slice(start, start + rowsPerPage);
    }, [filteredAndSortedData, page, rowsPerPage]);

    // If Drilldown is Active, render the Full-Page Drilldown View
    if (drilldownManufacturer) {
        return (
            <div className="piq-drilldown-container">
                {/* Top Action Bar */}
                <div className="piq-drilldown-topbar no-print">
                    <button
                        onClick={() => setDrilldownManufacturer(null)}
                        className="piq-drilldown-back-btn"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>Back to Quality Table</span>
                    </button>

                    <div className="piq-drilldown-actions">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isExporting}
                            className="piq-action-btn btn-pdf"
                            title="Download as PDF document"
                        >
                            <i className="fa-solid fa-file-pdf"></i>
                            <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
                        </button>

                        <button
                            onClick={handleDownloadPpt}
                            disabled={isExporting}
                            className="piq-action-btn btn-ppt"
                            title="Download as PowerPoint Presentation"
                        >
                            <i className="fa-solid fa-file-powerpoint"></i>
                            <span>Download PPT</span>
                        </button>

                        <button
                            onClick={handleDownloadImage}
                            disabled={isExporting}
                            className="piq-action-btn btn-image"
                            title="Download as PNG Image"
                        >
                            <i className="fa-solid fa-camera"></i>
                            <span>Download Image</span>
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="piq-action-btn btn-print"
                            title="Print report"
                        >
                            <i className="fa-solid fa-print"></i>
                            <span>Print</span>
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                {drilldownLoading ? (
                    <div className="piq-loading-state bg-white rounded-2xl p-16 shadow-sm border border-slate-100">
                        <div className="piq-spinner"></div>
                        <p className="font-semibold text-slate-600">Fetching Monthly Defect Analysis for {drilldownManufacturer}...</p>
                    </div>
                ) : (
                    <ProcessQualityReportPage manufacturer={drilldownManufacturer} data={drilldownData} />
                )}
            </div>
        );
    }

    return (
        <div className="piq-container">
            {/* Top Toolbar */}
            <div className="piq-topbar">
                <div className="piq-title-area">
                    <h2 className="piq-heading">
                        <i className="fa-solid fa-table-cells text-emerald-600 mr-2"></i>
                        Process Inspection Quality Table
                    </h2>
                    <span className="piq-badge">{filteredAndSortedData.length} Manufacturers</span>
                </div>

                {/* Filters & Actions */}
                <div className="piq-controls-row">
                    <div className="piq-filters-inline">
                        <div className="piq-date-field">
                            <label>From</label>
                            <input
                                type="date"
                                className="piq-input"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div className="piq-date-field">
                            <label>To</label>
                            <input
                                type="date"
                                className="piq-input"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                        <button className="piq-btn-apply" onClick={fetchTableData}>
                            <i className="fa-solid fa-magnifying-glass mr-1"></i> Apply
                        </button>
                        <button
                            className="piq-btn-reset"
                            onClick={() => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - 6);
                                setFromDate(d.toISOString().split('T')[0]);
                                setToDate(new Date().toISOString().split('T')[0]);
                                setTimeout(() => fetchTableData(), 50);
                            }}
                        >
                            Reset
                        </button>
                    </div>

                    <div className="piq-actions-inline">
                        <div className="piq-search-box">
                            <i className="fa-solid fa-search piq-search-icon"></i>
                            <input
                                type="text"
                                placeholder="Search by Manufacturer..."
                                className="piq-search-input"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(0);
                                }}
                            />
                            {searchQuery && (
                                <button className="piq-search-clear" onClick={() => setSearchQuery('')}>×</button>
                            )}
                        </div>

                        <ExportButton
                            label="Download Summary"
                            onClick={() => downloadExcel(
                                filteredAndSortedData,
                                [
                                    { label: 'Manufacturer Name', key: 'manufacturerName' },
                                    { label: 'Total Inspected Quantity', key: 'totalInspected' },
                                    { label: 'Total Rejected Quantity', key: 'totalRejected' },
                                    { label: 'Rejection (%)', key: 'rejectionPercent' },
                                    { label: 'Shearing Rejection (%)', key: 'shearingRejectionPercent' },
                                    { label: 'Turning Rejection (%)', key: 'turningRejectionPercent' },
                                    { label: 'MPI Rejection (%)', key: 'mpiRejectionPercent' },
                                    { label: 'Forging Rejection (%)', key: 'forgingRejectionPercent' },
                                    { label: 'Quenching Rejection (%)', key: 'quenchingRejectionPercent' },
                                    { label: 'Tempering Rejection (%)', key: 'temperingRejectionPercent' }
                                ],
                                `Process_Inspection_Quality_Table_${fromDate}_to_${toDate}`
                            )}
                        />

                        <ExportButton
                            label={isPreparingBatchPdf ? `Preparing (${batchProgress}/${tableData.length})...` : "Batch PDF Report"}
                            disabled={isPreparingBatchPdf}
                            onClick={handleGenerateBatchPdf}
                        />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="piq-alert-error">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
                </div>
            )}

            {/* Main Table */}
            <div className="piq-table-wrapper">
                {loading ? (
                    <div className="piq-loading-state">
                        <div className="piq-spinner"></div>
                        <p>Loading Process Inspection Quality Data...</p>
                    </div>
                ) : (
                    <table className="piq-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('manufacturerName')} className="text-left">
                                    Manufacturer Name {renderSortIcon('manufacturerName')}
                                </th>
                                <th onClick={() => handleSort('totalInspected')} className="text-right">
                                    Total Inspected (Nos.) {renderSortIcon('totalInspected')}
                                </th>
                                <th onClick={() => handleSort('totalRejected')} className="text-right">
                                    Total Rejected (Nos.) {renderSortIcon('totalRejected')}
                                </th>
                                <th onClick={() => handleSort('rejectionPercent')} className="text-center">
                                    Rejection (%) {renderSortIcon('rejectionPercent')}
                                </th>
                                <th onClick={() => handleSort('shearingRejectionPercent')} className="text-right">
                                    Shearing Rej (%) {renderSortIcon('shearingRejectionPercent')}
                                </th>
                                <th onClick={() => handleSort('turningRejectionPercent')} className="text-right">
                                    Turning Rej (%) {renderSortIcon('turningRejectionPercent')}
                                </th>
                                <th onClick={() => handleSort('mpiRejectionPercent')} className="text-right">
                                    MPI Rej (%) {renderSortIcon('mpiRejectionPercent')}
                                </th>
                                <th onClick={() => handleSort('forgingRejectionPercent')} className="text-right">
                                    Forging Rej (%) {renderSortIcon('forgingRejectionPercent')}
                                </th>
                                <th onClick={() => handleSort('quenchingRejectionPercent')} className="text-right">
                                    Quenching Rej (%) {renderSortIcon('quenchingRejectionPercent')}
                                </th>
                                <th onClick={() => handleSort('temperingRejectionPercent')} className="text-right">
                                    Tempering Rej (%) {renderSortIcon('temperingRejectionPercent')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((row, idx) => (
                                <tr key={row.manufacturerName || idx} className="piq-row">
                                    {/* Column 1: Clickable Manufacturer Name */}
                                    <td className="font-semibold text-slate-800">
                                        <button
                                            className="piq-link-btn"
                                            title="Click to view PO-wise details"
                                            onClick={() => handleOpenPoDetails(row.manufacturerName)}
                                        >
                                            <i className="fa-solid fa-industry mr-1.5 text-slate-400"></i>
                                            {row.manufacturerName}
                                        </button>
                                    </td>

                                    {/* Column 2: Total Inspected */}
                                    <td className="text-right font-medium text-slate-700">
                                        {Number(row.totalInspected || 0).toLocaleString('en-IN')}
                                    </td>

                                    {/* Column 3: Total Rejected */}
                                    <td className="text-right font-bold text-rose-600">
                                        {Number(row.totalRejected || 0).toLocaleString('en-IN')}
                                    </td>

                                    {/* Column 4: Clickable Rejection % */}
                                    <td className="text-center">
                                        <button
                                            className="piq-rej-badge"
                                            title="Click to view Monthly Performance & Defect Distribution"
                                            onClick={() => handleOpenRejectionDrilldown(row.manufacturerName)}
                                        >
                                            {Number(row.rejectionPercent || 0).toFixed(2)}%
                                            <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px] opacity-70"></i>
                                        </button>
                                    </td>

                                    {/* Column 5: Shearing Rejection % */}
                                    <td className="text-right text-slate-600">
                                        {Number(row.shearingRejectionPercent || 0).toFixed(2)}%
                                    </td>

                                    {/* Column 6: Turning Rejection % */}
                                    <td className="text-right text-slate-600">
                                        {Number(row.turningRejectionPercent || 0).toFixed(2)}%
                                    </td>

                                    {/* Column 7: MPI Rejection % */}
                                    <td className="text-right text-slate-600">
                                        {Number(row.mpiRejectionPercent || 0).toFixed(2)}%
                                    </td>

                                    {/* Column 8: Forging Rejection % */}
                                    <td className="text-right text-slate-600">
                                        {Number(row.forgingRejectionPercent || 0).toFixed(2)}%
                                    </td>

                                    {/* Column 9: Quenching Rejection % */}
                                    <td className="text-right text-slate-600">
                                        {Number(row.quenchingRejectionPercent || 0).toFixed(2)}%
                                    </td>

                                    {/* Column 10: Tempering Rejection % */}
                                    <td className="text-right text-slate-600">
                                        {Number(row.temperingRejectionPercent || 0).toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                            {paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="piq-empty-cell">
                                        <i className="fa-solid fa-inbox text-3xl text-slate-300 mb-2"></i>
                                        <p>No process inspection records found for the selected criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!loading && filteredAndSortedData.length > 0 && (
                <div className="piq-pagination-wrapper">
                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(filteredAndSortedData.length / rowsPerPage)}
                        start={page * rowsPerPage}
                        end={Math.min((page + 1) * rowsPerPage, filteredAndSortedData.length)}
                        totalCount={filteredAndSortedData.length}
                        onPageChange={setPage}
                        rows={rowsPerPage}
                        onRowsChange={(newRows) => {
                            setRowsPerPage(newRows);
                            setPage(0);
                        }}
                    />
                </div>
            )}

            {/* MODAL 1: Manufacturer PO Details Modal */}
            {selectedManufacturerForPo && (
                <div className="piq-modal-overlay" onClick={() => setSelectedManufacturerForPo(null)}>
                    <div className="piq-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="piq-modal-header">
                            <div>
                                <h3 className="piq-modal-title">
                                    <i className="fa-solid fa-file-contract text-blue-600 mr-2"></i>
                                    PO Wise Details: {selectedManufacturerForPo}
                                </h3>
                                <p className="piq-modal-subtitle">Comprehensive PO-level fulfillment and open inspection calls</p>
                            </div>
                            <button className="piq-modal-close" onClick={() => setSelectedManufacturerForPo(null)}>×</button>
                        </div>

                        <div className="piq-modal-body">
                            {poDetailsLoading ? (
                                <div className="piq-loading-state">
                                    <div className="piq-spinner"></div>
                                    <p>Loading PO details...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="piq-modal-table">
                                        <thead>
                                            <tr>
                                                <th>PO Number & PO Date</th>
                                                <th className="text-right">PO Quantity (Nos.)</th>
                                                <th className="text-right">Total Final Inspected Qty</th>
                                                <th className="text-center">Open Inspection Calls</th>
                                                <th className="text-right">PO Balance Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {poDetailsData.map((po, idx) => (
                                                <tr key={po.poNumber || idx}>
                                                    <td className="font-semibold text-slate-800">
                                                        <div className="text-blue-700 font-bold">{po.poNumber}</div>
                                                        <div className="text-xs text-slate-400">Date: {po.poDate || '-'}</div>
                                                    </td>
                                                    <td className="text-right font-medium text-slate-700">
                                                        {Number(po.poQuantity || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="text-right font-medium text-emerald-700">
                                                        {Number(po.totalFinalInspected || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="text-center">
                                                        {Number(po.openInspectionCalls || 0) > 0 ? (
                                                            <button
                                                                className="piq-open-calls-badge"
                                                                title="Click to view open inspection calls"
                                                                onClick={() => handleOpenCallDetails(po.poNumber)}
                                                            >
                                                                {po.openInspectionCalls} Calls
                                                                <i className="fa-solid fa-chevron-right ml-1 text-[10px]"></i>
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 font-semibold">0</span>
                                                        )}
                                                    </td>
                                                    <td className="text-right font-bold text-amber-700">
                                                        {Number(po.poBalanceQuantity || 0).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                            {poDetailsData.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="p-8 text-center text-slate-400 italic">
                                                        No PO records found for this manufacturer.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="piq-modal-footer">
                            <button className="piq-btn-close-modal" onClick={() => setSelectedManufacturerForPo(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: Open Inspection Calls Sub-Modal */}
            {selectedPoForOpenCalls && (
                <div className="piq-submodal-overlay" onClick={() => setSelectedPoForOpenCalls(null)}>
                    <div className="piq-submodal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="piq-submodal-header">
                            <div>
                                <h4 className="piq-submodal-title">
                                    <i className="fa-solid fa-list-check text-emerald-600 mr-2"></i>
                                    Open Inspection Calls for PO: {selectedPoForOpenCalls}
                                </h4>
                                <p className="piq-submodal-subtitle">List of pending and under-inspection calls</p>
                            </div>
                            <button className="piq-modal-close" onClick={() => setSelectedPoForOpenCalls(null)}>×</button>
                        </div>

                        <div className="piq-submodal-body">
                            {openCallsLoading ? (
                                <div className="piq-loading-state">
                                    <div className="piq-spinner"></div>
                                    <p>Loading open calls...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="piq-modal-table">
                                        <thead>
                                            <tr>
                                                <th>Call Number</th>
                                                <th>Call Date</th>
                                                <th>Desired Date</th>
                                                <th className="text-right">Offered Quantity</th>
                                                <th>Stage</th>
                                                <th>Status</th>
                                                <th>Place of Inspection</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {openCallsData.map((call, idx) => (
                                                <tr key={call.callNo || idx}>
                                                    <td className="font-bold text-blue-700">{call.callNo}</td>
                                                    <td className="text-slate-600">{call.callDate || '-'}</td>
                                                    <td className="text-slate-600">{call.desiredDate || '-'}</td>
                                                    <td className="text-right font-semibold text-slate-800">
                                                        {Number(call.offeredQty || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td>
                                                        <span className={`piq-stage-tag stage-${(call.stage || '').toLowerCase().replace(/\s+/g, '-')}`}>
                                                            {call.stage || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="piq-status-badge">
                                                            {call.status || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="text-slate-600 font-medium">{call.placeOfInspection || '-'}</td>
                                                </tr>
                                            ))}
                                            {openCallsData.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                                                        No open inspection calls found for this PO.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="piq-submodal-footer">
                            <button className="piq-btn-close-modal" onClick={() => setSelectedPoForOpenCalls(null)}>
                                Back to PO List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Batch PDF Print Area */}
            {batchReportData && (
                <div className="batch-print-area">
                    {batchReportData.map((item, idx) => (
                        <div key={idx} className="page-break" style={{ pageBreakAfter: 'always', padding: '20px' }}>
                            <ProcessQualityReportPage manufacturer={item.manufacturer} data={item.data} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProcessInspectionQualityTable;
