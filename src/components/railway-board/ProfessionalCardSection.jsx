import React, { useState } from 'react';
import { PROFESSIONAL_MAIN_CARDS, SUMMARY_DATA, QUALITY_DATA, REPORTS_DATA, PERFORMANCE_DATA } from '../../data/professionalDashboardData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, LineChart, Line, ComposedChart,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import './ProfessionalCardSection.css';
import './InspectionStackedCharts.css';
import './PerformanceMatrixTheme.css';

const ProfessionalCardSection = ({ poTable, poGraph, kpiGrid, selectedProduct, summaryData }) => {
    const [activeMainCard, setActiveMainCard] = useState('summary');

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
    const [lwclSelection, setLwclSelection] = useState({ po: '', lot: '' });
    const [perfSearch, setPerfSearch] = useState('');
    const [perfFilters, setPerfFilters] = useState({ vendors: [], inspectors: [], rios: [], stages: [] });
    const [openDropdown, setOpenDropdown] = useState(null);

    const togglePerfFilter = (type, value) => {
        setPerfFilters(prev => {
            const current = [...prev[type]];
            const index = current.indexOf(value);
            if (index > -1) current.splice(index, 1);
            else current.push(value);
            return { ...prev, [type]: current };
        });
    };

    const clearPerfFilters = () => {
        setPerfFilters({ vendors: [], inspectors: [], rios: [], stages: [] });
        setPerfSearch('');
    };

    const filteredRecords = PERFORMANCE_DATA.records.filter(record => {
        const matchesSearch = record.manufacturer.toLowerCase().includes(perfSearch.toLowerCase()) ||
            record.inspector.toLowerCase().includes(perfSearch.toLowerCase()) ||
            record.rio.toLowerCase().includes(perfSearch.toLowerCase()) ||
            record.reason.toLowerCase().includes(perfSearch.toLowerCase());

        const matchesVendor = perfFilters.vendors.length === 0 || perfFilters.vendors.includes(record.manufacturer);
        const matchesInspector = perfFilters.inspectors.length === 0 || perfFilters.inspectors.includes(record.inspector);
        const matchesRio = perfFilters.rios.length === 0 || perfFilters.rios.includes(record.rio);
        const matchesStage = perfFilters.stages.length === 0 || perfFilters.stages.includes(record.stage);

        return matchesSearch && matchesVendor && matchesInspector && matchesRio && matchesStage;
    });

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
                        return { ...p, value: `${val.toFixed(1)}%`, progress: Math.min(Math.round(val * 10), 100) };
                    }
                    if (p.label === 'Final Rejection %') {
                        const val = summaryData.finalRejectionPercentage || 0;
                        return { ...p, value: `${val.toFixed(1)}%`, progress: Math.min(Math.round(val * 10), 100) };
                    }
                    if (p.label === 'Raw Material Rejection %') {
                        const val = summaryData.rmRejectionPercentage || 0;
                        return { ...p, value: `${val.toFixed(1)}%`, progress: Math.min(Math.round(val * 10), 100) };
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
                            <h1 className="quality-title-lg">Railway Quality Surveillance</h1>
                            <p className="quality-subtitle-lg">ERC Defect Analysis & Rejection Monitoring</p>
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

                        {/* Integrated Footer Info */}
                        <div className="quality-footer-info mt-8">
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Last updated: 11 Feb 2026 14:52 IST</span>
                                <div className="flex gap-4">
                                    <span>Export PDF</span>
                                    <span>Share Dashboard</span>
                                    <span>Help</span>
                                </div>
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
                        <div className="performance-banner">
                            <div className="banner-content">
                                <h1 className="banner-title">Vendor Performance Matrix</h1>
                                <p className="banner-subtitle">
                                    <span className="banner-live-dot"></span>
                                    Real-time quality surveillance and inspection analytics
                                </p>
                            </div>
                            <div className="banner-actions">
                                <div className="search-pill">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search vendor..."
                                        value={perfSearch}
                                        onChange={(e) => setPerfSearch(e.target.value)}
                                    />
                                </div>
                                <button className="banner-btn-export">
                                    <span className="btn-icon">📥</span> Export
                                </button>
                            </div>
                        </div>

                        {/* Interactive Filter Bar */}
                        <div className="perf-filter-bar-wrapper">
                            <div className="perf-filter-bar">
                                <span className="filter-label">FILTERS:</span>

                                <div className="filter-dropdown-container">
                                    <button
                                        className={`filter-dropdown-btn ${perfFilters.vendors.length > 0 ? 'active' : ''}`}
                                        onClick={() => setOpenDropdown(openDropdown === 'vendor' ? null : 'vendor')}
                                    >
                                        <span className="btn-icon">🏭</span> Vendor
                                        {perfFilters.vendors.length > 0 && <span className="filter-count">{perfFilters.vendors.length}</span>}
                                        <span className="arrow">{openDropdown === 'vendor' ? '▲' : '▼'}</span>
                                    </button>
                                    {openDropdown === 'vendor' && (
                                        <div className="dropdown-panel">
                                            {PERFORMANCE_DATA.filters.vendors.map(v => (
                                                <div key={v} className="dropdown-item" onClick={() => togglePerfFilter('vendors', v)}>
                                                    <input type="checkbox" checked={perfFilters.vendors.includes(v)} readOnly /> {v}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="filter-dropdown-container">
                                    <button
                                        className={`filter-dropdown-btn ${perfFilters.rios.length > 0 ? 'active' : ''}`}
                                        onClick={() => setOpenDropdown(openDropdown === 'rio' ? null : 'rio')}
                                    >
                                        <span className="btn-icon">🌐</span> RITES RIO
                                        {perfFilters.rios.length > 0 && <span className="filter-count">{perfFilters.rios.length}</span>}
                                        <span className="arrow">{openDropdown === 'rio' ? '▲' : '▼'}</span>
                                    </button>
                                    {openDropdown === 'rio' && (
                                        <div className="dropdown-panel">
                                            {PERFORMANCE_DATA.filters.rios.map(r => (
                                                <div key={r} className="dropdown-item" onClick={() => togglePerfFilter('rios', r)}>
                                                    <input type="checkbox" checked={perfFilters.rios.includes(r)} readOnly /> {r}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="filter-dropdown-container">
                                    <button
                                        className={`filter-dropdown-btn ${perfFilters.inspectors.length > 0 ? 'active' : ''}`}
                                        onClick={() => setOpenDropdown(openDropdown === 'inspector' ? null : 'inspector')}
                                    >
                                        <span className="btn-icon">👤</span> IE
                                        {perfFilters.inspectors.length > 0 && <span className="filter-count">{perfFilters.inspectors.length}</span>}
                                        <span className="arrow">{openDropdown === 'inspector' ? '▲' : '▼'}</span>
                                    </button>
                                    {openDropdown === 'inspector' && (
                                        <div className="dropdown-panel">
                                            {PERFORMANCE_DATA.filters.inspectors.map(i => (
                                                <div key={i} className="dropdown-item" onClick={() => togglePerfFilter('inspectors', i)}>
                                                    <input type="checkbox" checked={perfFilters.inspectors.includes(i)} readOnly /> {i}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="filter-dropdown-container">
                                    <button
                                        className={`filter-dropdown-btn ${perfFilters.stages.length > 0 ? 'active' : ''}`}
                                        onClick={() => setOpenDropdown(openDropdown === 'stage' ? null : 'stage')}
                                    >
                                        <span className="btn-icon">📊</span> Stage
                                        {perfFilters.stages.length > 0 && <span className="filter-count">{perfFilters.stages.length}</span>}
                                        <span className="arrow">{openDropdown === 'stage' ? '▲' : '▼'}</span>
                                    </button>
                                    {openDropdown === 'stage' && (
                                        <div className="dropdown-panel">
                                            {PERFORMANCE_DATA.filters.stages.map(s => (
                                                <div key={s} className="dropdown-item" onClick={() => togglePerfFilter('stages', s)}>
                                                    <input type="checkbox" checked={perfFilters.stages.includes(s)} readOnly /> {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {(perfFilters.vendors.length > 0 || perfFilters.inspectors.length > 0 || perfFilters.rios.length > 0 || perfFilters.stages.length > 0) && (
                                    <button className="btn-clear-all" onClick={clearPerfFilters}>✕ Clear All</button>
                                )}
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="perf-summary-grid">
                            {PERFORMANCE_DATA.summary.map((kpi, idx) => (
                                <div key={idx} className={`perf-summary-card shadow-sm border-l-4 border-l-${kpi.color}`}>
                                    <span className="card-label">{kpi.label}</span>
                                    <h2 className="card-value">{kpi.value}</h2>
                                </div>
                            ))}
                        </div>

                        {/* Record Table */}
                        <div className="perf-table-outer">
                            <table className="perf-data-table-new">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>MANUFACTURER</th>
                                        <th>RITES RIO</th>
                                        <th>IE</th>
                                        <th>STAGE</th>
                                        <th className="text-right">INSPECTED</th>
                                        <th className="text-right">ACCEPTED</th>
                                        <th className="text-right">REJECTED</th>
                                        <th className="text-right">REJECTION %</th>
                                        <th>REASON</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map((record, idx) => {
                                        const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                        return (
                                            <tr key={record.id} className={rowClass}>
                                                <td className="row-id">{idx + 1}</td>
                                                <td className="vendor-name">{record.manufacturer}</td>
                                                <td>
                                                    <span className="rio-tag">{record.rio}</span>
                                                </td>
                                                <td>
                                                    <span className="ie-tag">👤 {record.inspector}</span>
                                                </td>
                                                <td>
                                                    <span className={`stage-tag stage-${record.stage.toLowerCase().replace(' ', '-')}`}>
                                                        {record.stage}
                                                    </span>
                                                </td>
                                                <td className="text-right font-bold">{record.inspected}</td>
                                                <td className="text-right font-bold text-emerald">{record.accepted}</td>
                                                <td className="text-right font-bold text-red">{record.rejected}</td>
                                                <td className="text-right">
                                                    <span className="rejection-badge">{record.rejectionRate}</span>
                                                </td>
                                                <td className="reason-cell">{record.reason}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="perf-table-footer">
                                <div className="footer-stats">
                                    Showing <strong>{filteredRecords.length}</strong> of <strong>{PERFORMANCE_DATA.records.length}</strong> records
                                </div>
                                <div className="footer-timestamp">Last updated: February 13, 2026</div>
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
                                                {REPORTS_DATA.mpr.map((row, idx) => {
                                                    const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                                    return (
                                                        <tr key={idx} className={rowClass}>
                                                            <td>{row.rly}</td>
                                                            <td className="font-mono text-xs">{row.poNo}</td>
                                                            <td>{row.manufacturer}</td>
                                                            <td className="text-right font-bold">{row.poQty}</td>
                                                            <td className="text-right">{row.monthlyRM}</td>
                                                            <td className="text-right">{row.monthlyProcess}</td>
                                                            <td className="text-right">{row.monthlyFinal}</td>
                                                            <td className="text-right">{row.totalInspected}</td>
                                                            <td className="text-right font-bold text-accent">{row.poBalance}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
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
                                                    {REPORTS_DATA.mau.table.map((row, idx) => {
                                                        const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                                        return (
                                                            <tr key={idx} className={rowClass}>
                                                                <td className="font-bold">{row.manufacturer}</td>
                                                                <td className="text-right">{row.manufactured}</td>
                                                                <td className="text-right">{row.inspected}</td>
                                                                <td className="text-right text-red font-bold">{row.rejected}</td>
                                                                <td className="text-right">{row.rmRej}</td>
                                                                <td className="text-right text-red font-bold">{row.processRej}</td>
                                                                <td className="text-right">{row.finalRej}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
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
                                                <select
                                                    className="report-select"
                                                    value={lwclSelection.po}
                                                    onChange={(e) => setLwclSelection({ ...lwclSelection, po: e.target.value })}
                                                >
                                                    <option value="">Select PO No.</option>
                                                    {REPORTS_DATA.lwcl.poNumbers.map(po => <option key={po} value={po}>{po}</option>)}
                                                </select>
                                                <select
                                                    className="report-select"
                                                    value={lwclSelection.lot}
                                                    onChange={(e) => setLwclSelection({ ...lwclSelection, lot: e.target.value })}
                                                >
                                                    <option value="">Select Lot No.</option>
                                                    {REPORTS_DATA.lwcl.lots.map(lot => <option key={lot} value={lot}>{lot}</option>)}
                                                </select>
                                                <div className="header-actions" style={{ marginLeft: '1rem' }}>
                                                    <button className="btn-icon" title="Print">⎙</button>
                                                </div>
                                            </div>
                                        </div>

                                        {lwclSelection.po && lwclSelection.lot ? (
                                            <>
                                                <div className="report-table-wrapper mini-table mb-6">
                                                    <table className="report-data-table ">
                                                        <thead>
                                                            <tr>
                                                                <th>Date</th>
                                                                <th>Shift</th>
                                                                <th className="text-right">Accepted</th>
                                                                <th className="text-right">Rejected</th>
                                                                <th className="text-right">Shearing</th>
                                                                <th className="text-right">Turning</th>
                                                                <th className="text-right">MPI</th>
                                                                <th className="text-right">Forging</th>
                                                                <th className="text-right">Quenching</th>
                                                                <th className="text-right">Tempering</th>
                                                                <th className="text-right">Testing</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {REPORTS_DATA.lwcl.table.map((row, idx) => {
                                                                const rowClass = (idx % 2 === 0) ? 'row-odd' : 'row-even';
                                                                return (
                                                                    <tr key={idx} className={rowClass}>
                                                                        <td>{row.date}</td>
                                                                        <td className="font-bold">{row.shift}</td>
                                                                        <td className="text-right text-emerald font-bold">{row.accepted}</td>
                                                                        <td className="text-right text-red font-bold">{row.rejected}</td>
                                                                        <td className="text-right">{row.shearing}</td>
                                                                        <td className="text-right">{row.turning}</td>
                                                                        <td className="text-right">{row.mpi}</td>
                                                                        <td className="text-right">{row.forging}</td>
                                                                        <td className="text-right">{row.quenching}</td>
                                                                        <td className="text-right">{row.tempering}</td>
                                                                        <td className="text-right">{row.testing}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="report-chart-card">
                                                    <h4>Pareto Analysis – Rejection Reasons</h4>
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <BarChart data={REPORTS_DATA.lwcl.pareto}>
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                                            <Tooltip />
                                                            <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={35} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="selection-missing-placeholder">
                                                <span className="placeholder-icon">📋</span>
                                                <p>Please select PO Number and Lot Number to view the closed-loop tracking report.</p>
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

                        {/* Professional Footer */}
                        <div className="quality-footer-info mt-8">
                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <span className="font-medium">Confidential Report • Generated: 13 Feb 2026</span>
                                <div className="flex gap-6">
                                    <span className="hover:text-blue-600 cursor-pointer">Export PDF</span>
                                    <span className="hover:text-blue-600 cursor-pointer">Share Dashboard</span>
                                    <span className="hover:text-blue-600 cursor-pointer">Help Center</span>
                                </div>
                            </div>
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
