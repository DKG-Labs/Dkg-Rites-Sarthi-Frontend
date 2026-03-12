import React, { useState } from 'react'; // Re-adding useState
import Pagination from '../Pagination';
import { PROFESSIONAL_MAIN_CARDS, SUMMARY_DATA, QUALITY_DATA, REPORTS_DATA } from '../../data/professionalDashboardData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, LineChart, Line, ComposedChart,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { formatDecimal } from '../../utils/helpers';
import './ProfessionalCardSection.css';
import './InspectionStackedCharts.css';
import './PerformanceMatrixTheme.css';

const ProfessionalCardSection = ({
    poTable,
    poGraph,
    kpiGrid,
    selectedProduct,
    summaryData,
    activeMainCard,
    setActiveMainCard,
    // New Performance Matrix Props from API
    perfData = [],
    perfLoading = false,
    perfPagination = { totalElements: 0, totalPages: 0 },
    perfPage = 0,
    setPerfPage = () => { },
    perfRowsPerPage = 10,
    setPerfRowsPerPage = () => { },
    // New Monthly Progress Report Props from API
    mprData = [],
    mprLoading = false,
    mprPagination = { totalElements: 0, totalPages: 0 },
    mprPage = 0,
    setMprPage = () => { },
    mprRowsPerPage = 10,
    setMprRowsPerPage = () => { },
    // New Monthly Analysis of Units Props from API
    mauData = [],
    mauLoading = false,
    mauPagination = { totalElements: 0, totalPages: 0 },
    mauPage = 0,
    setMauPage = () => { },
    mauRowsPerPage = 10,
    setMauRowsPerPage = () => { },
    // New Lot Wise Closed Loop Props from API
    lwclData = [],
    lwclLoading = false,
    lwclCallNo = '',
    setLwclCallNo = () => { },
    lwclLotNo = '',
    setLwclLotNo = () => { },
    lwclRequestIds = [],
    lwclLotNumbers = []
}) => {
    // Map selectedProduct to summary data keys
    const getSummaryKey = (prod) => {
        if (!prod || prod === 'all') return 'erc';
        const p = prod.toLowerCase();
        if (p.includes('erc')) return 'erc';
        if (p.includes('sleeper')) return 'sleeper';
        if (p.includes('rail pad') || p.includes('railpad')) return 'railpad';
        return 'erc'; // Default
    };

    const summarySubTab = getSummaryKey(selectedProduct);
    const [activeReport, setActiveReport] = useState('mpr');

    // Sorting State for Performance Matrix
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedData = (data) => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle numeric values
            const numA = parseFloat(aValue);
            const numB = parseFloat(bValue);
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
            }

            // Handle strings
            aValue = (aValue || '').toString().toLowerCase();
            bValue = (bValue || '').toString().toLowerCase();
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // Filtered records logic was removed to fix ESLint warnings as it was not being utilized in the current table implementation.

    // ... (rest of the logic remains same until renderSubContent)

    // --- 4-column stacked bar chart data ---
    // Inspection Calls Status: 4 groups × 2 stacks (Under Inspection + Pending)
    const inspectionCallsData = [
        { name: 'Total', under: 90, pending: 12 },
        { name: 'RM', under: 38, pending: 5 },
        { name: 'Process', under: 30, pending: 4 },
        { name: 'Final', under: 22, pending: 3 },
    ];

    // Inspection Details: 4 groups × 2 stacks (Accepted + Rejected)
    const inspectionDetailsData = [
        { name: 'Total', accepted: 8957, rejected: 406 },
        { name: 'RM', accepted: 3200, rejected: 145 },
        { name: 'Process', accepted: 3100, rejected: 160 },
        { name: 'Final', accepted: 2657, rejected: 101 },
    ];

    // Custom tooltip for Inspection Calls Status chart
    const CallsTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="isc-tooltip">
                <div className="isc-tooltip-label">{label}</div>
                {payload.map((p, i) => (
                    <div key={i} className="isc-tooltip-row">
                        <span className="isc-tooltip-swatch" style={{ background: p.fill }} />
                        <span>{p.name}: <strong>{p.value}</strong></span>
                    </div>
                ))}
            </div>
        );
    };

    // Custom tooltip for Inspection Details chart
    const DetailsTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="isc-tooltip">
                <div className="isc-tooltip-label">{label}</div>
                {payload.map((p, i) => (
                    <div key={i} className="isc-tooltip-row">
                        <span className="isc-tooltip-swatch" style={{ background: p.fill }} />
                        <span>{p.name}: <strong>{p.value.toLocaleString()}</strong></span>
                    </div>
                ))}
            </div>
        );
    };


    const renderSubContent = () => {
        if (selectedProduct && selectedProduct !== 'ERC') {
            return (
                <div className="under-development-container">
                    <div className="under-development-card">
                        <div className="under-development-icon">🛠️</div>
                        <h2 className="under-development-title">Under Development</h2>
                        <p className="under-development-text">
                            The dashboard for <strong>{selectedProduct}</strong> is currently being developed.
                            Please check back later for updates.
                        </p>
                    </div>
                </div>
            );
        }

        switch (activeMainCard) {
            case 'summary':
                const baseSummary = SUMMARY_DATA[summarySubTab];
                const kpis = baseSummary.kpis.map(kpi => {
                    if (!summaryData || Array.isArray(summaryData)) return kpi;

                    if (kpi.label === 'PO Issued') {
                        return { ...kpi, value: (summaryData.poIssued || 0).toLocaleString() };
                    }
                    if (kpi.label === 'PO Quantity') {
                        return {
                            ...kpi,
                            isDual: true,
                            leftValue: (summaryData.poQuantityNos || 0).toLocaleString(),
                            leftLabel: 'Nos',
                            rightValue: (summaryData.poQuantityMt || 0).toLocaleString(),
                            rightLabel: 'MT'
                        };
                    }
                    if (kpi.label === 'Final Inspection Quantity') {
                        return { ...kpi, value: (summaryData.finalInspectionQuantity || 0).toLocaleString() };
                    }
                    return kpi;
                });

                const production = baseSummary.production.map(p => {
                    if (!summaryData || Array.isArray(summaryData)) return p;

                    if (p.label === 'Avg Production / Day') {
                        return { ...p, value: Math.round(summaryData.avgProductionPerDay || 0).toLocaleString() };
                    }
                    if (p.label === 'Process Rejection %') {
                        const val = summaryData.processRejectionPercentage || 0;
                        return { ...p, value: `${formatDecimal(val)}%`, progress: Math.min(Math.round(val * 10), 100) };
                    }
                    if (p.label === 'Final Rejection %') {
                        const val = summaryData.finalRejectionPercentage || 0;
                        return { ...p, value: `${formatDecimal(val)}%`, progress: Math.min(Math.round(val * 10), 100) };
                    }
                    if (p.label === 'Raw Material Rejection %') {
                        const val = summaryData.rmRejectionPercentage || 0;
                        return { ...p, value: `${formatDecimal(val)}%`, progress: Math.min(Math.round(val * 10), 100) };
                    }
                    return p;
                });

                const currentSummary = { ...baseSummary, kpis, production };
                return (
                    <div className="summary-tab-content fade-in">


                        <div className="kpi-cards-container">
                            {currentSummary.kpis.map((kpi, index) => (
                                <div key={index} className={`kpi-card-premium ${kpi.gradient ? 'gradient-orange' : ''} animated-up`}>
                                    <div className="kpi-card-header">
                                        <div className="kpi-info">
                                            <span className="kpi-label">{kpi.label}</span>
                                            {kpi.isDual ? (
                                                <div className="kpi-dual-container">
                                                    <div className="kpi-dual-item">
                                                        <h2 className={`kpi-dual-value text-glow-${kpi.color}`}>{kpi.leftValue}</h2>
                                                        <span className="kpi-dual-label">{kpi.leftLabel}</span>
                                                    </div>
                                                    <div className="kpi-divider"></div>
                                                    <div className="kpi-dual-item">
                                                        <h2 className={`kpi-dual-value text-glow-${kpi.color}`}>{kpi.rightValue}</h2>
                                                        <span className="kpi-dual-label">{kpi.rightLabel}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <React.Fragment>
                                                    <h2 className={`kpi-value text-glow-${kpi.color}`}>{kpi.value}</h2>
                                                    {kpi.subtext && <span className="kpi-subtext">{kpi.subtext}</span>}
                                                </React.Fragment>
                                            )}
                                        </div>
                                        <span className="kpi-icon">{kpi.icon}</span>
                                    </div>
                                    {kpi.progress && (
                                        <div className="kpi-progress-wrapper">
                                            <div className="progress-bar">
                                                <div className={`progress-fill bg-${kpi.color}`} style={{ width: `${kpi.progress}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── Inspection Charts Row ── */}
                        <div className="isc-charts-row animated-up delay-1">

                            {/* ── Inspection Calls Status ── */}
                            <div className="isc-chart-card">
                                <h3 className="isc-chart-title">Inspection Calls Status</h3>
                                <p className="isc-chart-subtitle">
                                    Total Calls: {inspectionCallsData[0].under + inspectionCallsData[0].pending}
                                </p>
                                <div className="isc-chart-area">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={inspectionCallsData}
                                            margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                                            barCategoryGap="30%"
                                            barGap={2}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                width={30}
                                            />
                                            <Tooltip content={<CallsTooltip />} cursor={{ fill: 'rgba(241,245,249,0.7)' }} />
                                            <Bar dataKey="under" name="Under Inspection" stackId="s" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="pending" name="Pending" stackId="s" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="isc-legend-row">
                                    <div className="isc-legend-item">
                                        <span className="isc-dot isc-dot--amber"></span> Under Inspection
                                    </div>
                                    <div className="isc-legend-item">
                                        <span className="isc-dot isc-dot--red"></span> Pending
                                    </div>
                                </div>
                            </div>

                            {/* ── Inspection Details ── */}
                            <div className="isc-chart-card">
                                <h3 className="isc-chart-title">Inspection Details</h3>
                                <p className="isc-chart-subtitle">
                                    Total Inspections: {(inspectionDetailsData[0].accepted + inspectionDetailsData[0].rejected).toLocaleString()}
                                </p>
                                <div className="isc-chart-area">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={inspectionDetailsData}
                                            margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                                            barCategoryGap="30%"
                                            barGap={2}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                width={45}
                                                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                            />
                                            <Tooltip content={<DetailsTooltip />} cursor={{ fill: 'rgba(241,245,249,0.7)' }} />
                                            <Bar dataKey="accepted" name="Accepted" stackId="s" fill="#22c55e" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="rejected" name="Rejected" stackId="s" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="isc-legend-row">
                                    <div className="isc-legend-item">
                                        <span className="isc-dot isc-dot--emerald"></span> Accepted
                                    </div>
                                    <div className="isc-legend-item">
                                        <span className="isc-dot isc-dot--red"></span> Rejected
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="production-grid animated-up delay-3">
                            <h3>Production & Rejection</h3>
                            <div className="production-metrics">
                                {currentSummary.production.map((p, idx) => (
                                    <div key={idx} className="prod-metric-card">
                                        <span className="prod-label">{p.label}</span>
                                        <div className={`prod-value text-${p.color}`}>{p.value}</div>
                                        {p.unit && <span className="prod-unit">{p.unit}</span>}
                                        {p.progress && (
                                            <div className="progress-bar-small">
                                                <div className={`progress-fill bg-${p.color}`} style={{ width: `${p.progress}%` }}></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'quality':
                return (
                    <div className="quality-tab-content fade-in">
                        <div className="quality-header-main text-center">
                            {/* <h1 className="quality-title-lg">Railway Quality Surveillance</h1>
                            <p className="quality-subtitle-lg">ERC Defect Analysis & Rejection Monitoring</p> */}
                        </div>

                        {/* Top Summary Cards */}
                        <div className="quality-summary-grid">
                            {QUALITY_DATA.summary.map((item, idx) => (
                                <div key={idx} className="quality-summary-card">
                                    <span className="q-label">{item.label}</span>
                                    <h2 className={`q-value ${item.color === 'red' ? 'text-red-600' : ''}`}>{item.value}</h2>
                                </div>
                            ))}
                        </div>

                        {/* First Row of Charts - Interchanged Position and Size */}
                        <div className="quality-charts-row">
                            <div className="q-chart-card wide-60">
                                <h3>Pareto Analysis</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={QUALITY_DATA.pareto}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} hide={false} fontSize={10} angle={-15} textAnchor="end" interval={0} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                                        <Tooltip />
                                        <Bar yAxisId="left" dataKey="count" fill="#2563eb" barSize={30} radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="q-chart-card wide-40">
                                <h3>Stage-wise Rejection %</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={QUALITY_DATA.stageRejection}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" barSize={50} radius={[6, 6, 0, 0]}>
                                            {QUALITY_DATA.stageRejection.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Second Row of Charts */}
                        <div className="quality-charts-row mt-6">
                            <div className="q-chart-card wide-50">
                                <h3 className="text-center">Manufacturing Step Wise Rejection %</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={QUALITY_DATA.defectDistribution}
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {QUALITY_DATA.defectDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="q-chart-card wide-50">
                                <h3>Rejection % by Raw Material Manufacturer</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={QUALITY_DATA.rmManufacturerRejection}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="value" barSize={40} radius={[4, 4, 0, 0]}>
                                            {QUALITY_DATA.rmManufacturerRejection.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Third Row of Charts */}
                        <div className="quality-charts-row mt-6">
                            <div className="q-chart-card wide-50">
                                <h3>Monthly Rejection Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={QUALITY_DATA.monthlyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="q-chart-card wide-50">
                                <h3>Stage vs Defect Contribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={QUALITY_DATA.stageVsDefect}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="turning" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="dimensional" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="visual" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top & Worst Performing Companies Charts */}
                        <div className="quality-charts-row mt-6">
                            <div className="q-chart-card wide-50">
                                <h3>Top 5 Performing Companies (Process Rejection %)</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={QUALITY_DATA.topPerformingCompanies} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                                        <Tooltip formatter={(value) => `${value}%`} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                            {QUALITY_DATA.topPerformingCompanies.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="q-chart-card wide-50">
                                <h3>Worst 5 Performing Companies (Process Rejection %)</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={QUALITY_DATA.worstPerformingCompanies} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                                        <Tooltip formatter={(value) => `${value}%`} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                            {QUALITY_DATA.worstPerformingCompanies.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );

            case 'lifecycle':
                return (
                    <div className="lifecycle-content fade-in">
                        <div className="lifecycle-kpi-wrapper">
                            {kpiGrid}
                        </div>
                        <div className="integrated-table-container">
                            {poTable}
                        </div>
                    </div>
                );
            case 'performance':
                return (
                    <div className="performance-tab-content fade-in">
                        {/* Premium Header Banner */}
                        {/* <div className="performance-banner">
                            <div className="banner-content">
                                <h1 className="banner-title">Vendor Performance Matrix</h1>
                                <p className="banner-subtitle">
                                    <span className="banner-live-dot"></span>
                                    Real-time quality surveillance and inspection analytics
                                </p>
                            </div>
                            <div className="banner-actions">
                                <button className="banner-btn-export">
                                    <span className="btn-icon">📥</span> Export
                                </button>
                            </div>
                        </div> */}

                        {/* Summary Cards */}
                        <div className="perf-summary-grid">
                            {[
                                {
                                    label: 'TOTAL INSPECTED',
                                    value: perfData.reduce((acc, curr) => acc + (curr.inspectedQty || 0), 0).toLocaleString(),
                                    color: 'blue'
                                },
                                {
                                    label: 'ACCEPTED',
                                    value: perfData.reduce((acc, curr) => acc + (curr.acceptedQty || 0), 0).toLocaleString(),
                                    color: 'emerald'
                                },
                                {
                                    label: 'REJECTED',
                                    value: perfData.reduce((acc, curr) => acc + (curr.rejectedQty || 0), 0).toLocaleString(),
                                    color: 'red'
                                },
                                {
                                    label: 'AVG REJECTION %',
                                    value: (() => {
                                        const totalInspected = perfData.reduce((acc, curr) => acc + (curr.inspectedQty || 0), 0);
                                        const totalRejected = perfData.reduce((acc, curr) => acc + (curr.rejectedQty || 0), 0);
                                        return totalInspected > 0 ? ((totalRejected * 100) / totalInspected).toFixed(2) + '%' : '0.00%';
                                    })(),
                                    color: 'purple'
                                }
                            ].map((kpi, idx) => (
                                <div key={idx} className={`perf-summary-card border-l-${kpi.color}`}>
                                    <span className="card-label">{kpi.label}</span>
                                    <h2 className="card-value">{kpi.value}</h2>
                                </div>
                            ))}
                        </div>

                        {/* Record Table */}
                        <div className="perf-table-outer">
                            {perfLoading ? (
                                <div className="loading-state p-12 text-center text-teal font-medium">
                                    Loading Performance Data...
                                </div>
                            ) : (
                                <>
                                    <table className="perf-data-table-new">
                                        <thead>
                                            <tr>
                                                <th className="sortable-header" onClick={() => handleSort('id')}># {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="sortable-header" onClick={() => handleSort('manufacturerName')}>MANUFACTURER {sortConfig.key === 'manufacturerName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="sortable-header" onClick={() => handleSort('rio')}>RITES RIO {sortConfig.key === 'rio' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="sortable-header" onClick={() => handleSort('username')}>IE {sortConfig.key === 'username' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="sortable-header" onClick={() => handleSort('stage')}>STAGE {sortConfig.key === 'stage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="text-right sortable-header" onClick={() => handleSort('inspectedQty')}>INSPECTED {sortConfig.key === 'inspectedQty' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="text-right sortable-header" onClick={() => handleSort('acceptedQty')}>ACCEPTED {sortConfig.key === 'acceptedQty' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="text-right sortable-header" onClick={() => handleSort('rejectedQty')}>REJECTED {sortConfig.key === 'rejectedQty' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                <th className="text-right sortable-header" onClick={() => handleSort('rejectionPercentage')}>REJECTION % {sortConfig.key === 'rejectionPercentage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                                                {/* <th>REASON</th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getSortedData(perfData).map((record, idx) => {
                                                const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                                return (
                                                    <tr key={idx} className={rowClass}>
                                                        <td className="row-id">{(perfPage * perfRowsPerPage) + idx + 1}</td>
                                                        <td className="vendor-name">{record.manufacturerName}</td>
                                                        <td>
                                                            <span className="rio-tag">{record.rio}</span>
                                                        </td>
                                                        <td>
                                                            <span className="ie-tag">👤 {record.username}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`stage-tag stage-${record.stage?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                                                                {record.stage}
                                                            </span>
                                                        </td>
                                                        <td className="text-right font-bold">{record.inspectedQty?.toLocaleString()}</td>
                                                        <td className="text-right font-bold text-emerald">{record.acceptedQty?.toLocaleString()}</td>
                                                        <td className="text-right font-bold text-red">{record.rejectedQty?.toLocaleString()}</td>
                                                        <td className="text-right">
                                                            <span className="rejection-badge">{formatDecimal(record.rejectionPercentage)}%</span>
                                                        </td>
                                                        {/* <td className="reason-cell">N/A</td> */}
                                                    </tr>
                                                );
                                            })}
                                            {perfData.length === 0 && (
                                                <tr>
                                                    <td colSpan="9" className="text-center p-8 text-slate-400">
                                                        No performance records found for the selected criteria.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {/* API Integrated Pagination */}
                                    <div className="mt-4">
                                        <Pagination
                                            currentPage={perfPage}
                                            totalPages={perfPagination.totalPages}
                                            start={perfPage * perfRowsPerPage}
                                            end={Math.min((perfPage + 1) * perfRowsPerPage, perfPagination.totalElements)}
                                            totalCount={perfPagination.totalElements}
                                            onPageChange={setPerfPage}
                                            rows={perfRowsPerPage}
                                            onRowsChange={setPerfRowsPerPage}
                                            theme="orange"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="perf-table-footer">
                                <div className="footer-stats">
                                    Showing <strong>{perfData.length}</strong> of <strong>{perfPagination.totalElements}</strong> records
                                </div>
                                <div className="footer-timestamp">Last updated: {new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                );


            case 'reports':
                return (
                    <div className="reports-tab-content fade-in">
                        {/* Report Navigation Tabs */}
                        <div className="reports-filter-pills">
                            {REPORTS_DATA.tabs.map((tab) => {
                                const icons = { mpr: '📋', mau: '📈', lwcl: '🔄', qmr: '🛡️' };
                                return (
                                    <button
                                        key={tab.id}
                                        className={`report-pill ${activeReport === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveReport(tab.id)}
                                    >
                                        <span className="pill-icon">{icons[tab.id]}</span>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="report-viewer-content">
                            {activeReport === 'mpr' && (
                                <div className="report-card animate-up">
                                    <div className="report-card-header">
                                        <h3>Monthly Progress Report</h3>
                                        <div className="header-actions">
                                            <button className="btn-icon" title="Download Excel">📥</button>
                                            <button className="btn-icon" title="Print Report">⎙</button>
                                            <button className="btn-icon" title="Share">🔗</button>
                                        </div>
                                    </div>
                                    <div className="report-table-wrapper">
                                        {mprLoading ? (
                                            <div className="loading-state p-12 text-center text-teal font-medium">
                                                Loading Monthly Progress Report...
                                            </div>
                                        ) : (
                                            <>
                                                <table className="report-data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Rly</th>
                                                            <th>PO Number</th>
                                                            <th>Manufacturer</th>
                                                            <th className="text-right">PO Qty</th>
                                                            <th className="text-right">Monthly RM</th>
                                                            <th className="text-right">Monthly Process</th>
                                                            <th className="text-right">Monthly Final</th>
                                                            <th className="text-right">Total Final Inspected</th>
                                                            <th className="text-right">PO Balance</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {mprData.map((row, idx) => {
                                                            const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                                            return (
                                                                <tr key={idx} className={rowClass}>
                                                                    <td>{row.rly}</td>
                                                                    <td className="font-mono text-xs">{row.poNumber}</td>
                                                                    <td>{row.manufacturer}</td>
                                                                    <td className="text-right font-bold">{row.poQty?.toLocaleString()}</td>
                                                                    <td className="text-right">{row.monthlyRm?.toLocaleString()}</td>
                                                                    <td className="text-right">{row.monthlyProcess?.toLocaleString()}</td>
                                                                    <td className="text-right">{row.monthlyFinal?.toLocaleString()}</td>
                                                                    <td className="text-right">{row.totalFinalInspected?.toLocaleString()}</td>
                                                                    <td className="text-right font-bold text-accent">{row.poBalance?.toLocaleString()}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {mprData.length === 0 && (
                                                            <tr>
                                                                <td colSpan="9" className="text-center p-8 text-slate-400">
                                                                    No progress records found for the selected period.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>

                                                {/* API Integrated Pagination for MPR */}
                                                <div className="mt-4">
                                                    <Pagination
                                                        currentPage={mprPage}
                                                        totalPages={mprPagination.totalPages}
                                                        start={mprPage * mprRowsPerPage}
                                                        end={Math.min((mprPage + 1) * mprRowsPerPage, mprPagination.totalElements)}
                                                        totalCount={mprPagination.totalElements}
                                                        onPageChange={setMprPage}
                                                        rows={mprRowsPerPage}
                                                        onRowsChange={setMprRowsPerPage}
                                                        theme="teal"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeReport === 'mau' && (
                                <div className="mau-report-container animate-up">
                                    <div className="report-card mb-6">
                                        <div className="report-card-header">
                                            <h3>Monthly Analysis of Units</h3>
                                            <div className="header-actions">
                                                <button className="btn-icon" title="Download Excel">📥</button>
                                                <button className="btn-icon" title="Print Report">⎙</button>
                                            </div>
                                        </div>
                                        <div className="report-table-wrapper">
                                            {mauLoading ? (
                                                <div className="loading-state p-12 text-center text-emerald font-medium">
                                                    Loading Monthly Analysis...
                                                </div>
                                            ) : (
                                                <>
                                                    <table className="report-data-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Manufacturer</th>
                                                                <th className="text-right">Manufactured</th>
                                                                <th className="text-right">Inspected</th>
                                                                <th className="text-right">Rejected</th>
                                                                <th className="text-right">RM Rej %</th>
                                                                <th className="text-right">Process Rej %</th>
                                                                <th className="text-right">Final Rej %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mauData.map((row, idx) => {
                                                                const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                                                return (
                                                                    <tr key={idx} className={rowClass}>
                                                                        <td className="font-bold">{row.manufacturer}</td>
                                                                        <td className="text-right">{row.manufactured?.toLocaleString()}</td>
                                                                        <td className="text-right">{row.inspected?.toLocaleString()}</td>
                                                                        <td className="text-right font-bold">{row.rejected?.toLocaleString()}</td>
                                                                        <td className="text-right">{formatDecimal(row.rmRejPercent)}%</td>
                                                                        <td className="text-right text-red font-bold">{formatDecimal(row.processRejPercent)}%</td>
                                                                        <td className="text-right">{formatDecimal(row.finalRejPercent)}%</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {mauData.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="7" className="text-center p-8 text-slate-400">
                                                                        No analysis records found for the selected period.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>

                                                    {/* API Integrated Pagination for MAU */}
                                                    <div className="mt-4">
                                                        <Pagination
                                                            currentPage={mauPage}
                                                            totalPages={mauPagination.totalPages}
                                                            start={mauPage * mauRowsPerPage}
                                                            end={Math.min((mauPage + 1) * mauRowsPerPage, mauPagination.totalElements)}
                                                            totalCount={mauPagination.totalElements}
                                                            onPageChange={setMauPage}
                                                            rows={mauRowsPerPage}
                                                            onRowsChange={setMauRowsPerPage}
                                                            theme="emerald"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="reports-charts-grid">
                                        <div className="report-chart-card">
                                            <h4>ERC Manufactured (Monthly)</h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={REPORTS_DATA.mau.production}>
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="report-chart-card">
                                            <h4>Rejection % Analysis</h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={REPORTS_DATA.mau.rejectionRadar}>
                                                    <PolarGrid stroke="#e2e8f0" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 1.5]} hide />
                                                    <Radar name="Rejection" dataKey="A" stroke="#059669" fill="#10b981" fillOpacity={0.6} />
                                                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeReport === 'lwcl' && (
                                <div className="lwcl-report-container animate-up">
                                    <div className="report-card mb-6">
                                        <div className="report-card-header">
                                            <h3>Lot Wise Closed Loop</h3>
                                            <div className="selection-group">
                                                {/* Call No Dropdown (Requested UI addition) */}
                                                <select
                                                    className="report-select"
                                                    value={lwclCallNo}
                                                    onChange={(e) => setLwclCallNo(e.target.value)}
                                                >
                                                    <option value="">Select Call No.</option>
                                                    {lwclRequestIds.map(id => <option key={id} value={id}>{id}</option>)}
                                                </select>

                                                {/* Lot No Dropdown */}
                                                <select
                                                    className="report-select"
                                                    value={lwclLotNo}
                                                    onChange={(e) => setLwclLotNo(e.target.value)}
                                                    disabled={!lwclCallNo}
                                                >
                                                    <option value="">Select Lot No.</option>
                                                    {lwclLotNumbers.map(lot => <option key={lot} value={lot}>{lot}</option>)}
                                                </select>

                                                <div className="header-actions" style={{ marginLeft: '1rem' }}>
                                                    <button className="btn-icon" title="Print">⎙</button>
                                                </div>
                                            </div>
                                        </div>

                                        {lwclLoading ? (
                                            <div className="loading-state p-12 text-center text-indigo-500 font-medium">
                                                Loading Closed Loop Data...
                                            </div>
                                        ) : lwclCallNo && lwclLotNo ? (
                                            <>
                                                <div className="report-table-wrapper mini-table mb-6">
                                                    <table className="report-data-table ">
                                                        <thead>
                                                            <tr>
                                                                <th>Tracking Step</th>
                                                                <th className="text-right">Quantity</th>
                                                                <th>Status</th>
                                                                <th>Remarks</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {/* 
                                                                Backend response for lot-closed-loop might be a single object or a list.
                                                                We normalize it to an array here to avoid mapping errors.
                                                            */}
                                                            {(() => {
                                                                const normalizedData = Array.isArray(lwclData)
                                                                    ? lwclData
                                                                    : (lwclData && typeof lwclData === 'object' && Object.keys(lwclData).length > 0 ? [lwclData] : []);

                                                                if (normalizedData.length === 0) {
                                                                    return (
                                                                        <tr>
                                                                            <td colSpan="4" className="text-center p-8 text-slate-400">
                                                                                No closed-loop tracking data available for this lot.
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                }

                                                                return normalizedData.map((row, idx) => {
                                                                    const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                                                    return (
                                                                        <tr key={idx} className={rowClass}>
                                                                            <td className="font-bold">{row.step || row.trackingStep || 'N/A'}</td>
                                                                            <td className="text-right font-bold text-indigo-600">
                                                                                {row.quantity?.toLocaleString() || row.qty?.toLocaleString() || 0}
                                                                            </td>
                                                                            <td>
                                                                                <span className={`status-pill ${row.status?.toLowerCase() || 'pending'}`}>
                                                                                    {row.status || 'N/A'}
                                                                                </span>
                                                                            </td>
                                                                            <td>{row.remarks || 'N/A'}</td>
                                                                        </tr>
                                                                    );
                                                                });
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                <div className="mb-2">📋</div>
                                                Please select Call Number and Lot Number to view the closed-loop tracking report.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeReport === 'qmr' && (
                                <div className="qmr-report-container animate-up">
                                    <div className="report-card">
                                        <div className="report-card-header">
                                            <h3>Quality Monitoring Report</h3>
                                        </div>
                                        <div className="report-table-wrapper sticky-header">
                                            <table className="report-data-table ">
                                                <thead>
                                                    <tr>
                                                        <th>Defect Parameter</th>
                                                        <th className="text-right">Raw Material</th>
                                                        <th className="text-right">Process</th>
                                                        <th className="text-right">Final</th>
                                                        <th className="text-right">Overall (Nos.)</th>
                                                        <th className="text-right">Overall (%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {REPORTS_DATA.qmr.map((row, idx) => {
                                                        const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                                        return (
                                                            <tr key={idx} className={rowClass}>
                                                                <td className="font-medium text-slate-700">{row.parameter}</td>
                                                                <td className="text-right">{row.rm}</td>
                                                                <td className="text-right">{row.process}</td>
                                                                <td className="text-right">{row.final}</td>
                                                                <td className="text-right font-bold">{row.overallNos}</td>
                                                                <td className="text-right font-bold text-slate-800">{row.overallPct}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="professional-dashboard-section">
            <div className="nav-wrapper">
                <div className="main-cards-container">
                    {PROFESSIONAL_MAIN_CARDS.map((card) => (
                        <div
                            key={card.id}
                            className={`main-card ${activeMainCard === card.id ? 'active' : ''}`}
                            onClick={() => setActiveMainCard(card.id)}
                            style={{ '--card-color': card.color }}
                        >
                            <div className="main-card-icon-wrapper">
                                <span className="main-card-icon">{card.icon}</span>
                            </div>
                            <div className="main-card-title">{card.title}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="sub-content-area">
                <div className="section-header">
                    <h2 className="section-title">
                        {PROFESSIONAL_MAIN_CARDS.find(c => c.id === activeMainCard)?.title}
                    </h2>
                    <div className="section-actions">
                        <button className="btn-refresh">🔄 Refresh</button>
                        <button className="btn-export">📥 Export</button>
                    </div>
                </div>
                {renderSubContent()}
            </div>
        </div>
    );
};

export default ProfessionalCardSection;
