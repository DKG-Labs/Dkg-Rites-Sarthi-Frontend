import React, { useState } from 'react';
import { PROFESSIONAL_MAIN_CARDS, SUMMARY_DATA, QUALITY_DATA, REPORTS_DATA, PERFORMANCE_DATA } from '../../data/professionalDashboardData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, LineChart, Line, ComposedChart,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import './ProfessionalCardSection.css';

const ProfessionalCardSection = ({ poTable, poGraph, kpiGrid }) => {
    const [activeMainCard, setActiveMainCard] = useState('summary');
    const [summarySubTab, setSummarySubTab] = useState('erc');
    const [activeReport, setActiveReport] = useState('mpr');
    const [lwclSelection, setLwclSelection] = useState({ po: '', lot: '' });
    const [perfSearch, setPerfSearch] = useState('');
    const [perfFilters, setPerfFilters] = useState({ vendors: [], inspectors: [], stages: [] });
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
        setPerfFilters({ vendors: [], inspectors: [], stages: [] });
        setPerfSearch('');
    };

    const filteredRecords = PERFORMANCE_DATA.records.filter(record => {
        const matchesSearch = record.manufacturer.toLowerCase().includes(perfSearch.toLowerCase()) ||
            record.inspector.toLowerCase().includes(perfSearch.toLowerCase()) ||
            record.reason.toLowerCase().includes(perfSearch.toLowerCase());

        const matchesVendor = perfFilters.vendors.length === 0 || perfFilters.vendors.includes(record.manufacturer);
        const matchesInspector = perfFilters.inspectors.length === 0 || perfFilters.inspectors.includes(record.inspector);
        const matchesStage = perfFilters.stages.length === 0 || perfFilters.stages.includes(record.stage);

        return matchesSearch && matchesVendor && matchesInspector && matchesStage;
    });

    // ... (rest of the logic remains same until renderSubContent)

    // Mock data for charts
    const inspectionCallsData = [
        { name: 'Calls', under: 90, pending: 12 }
    ];

    const inspectionDetailsData = [
        { name: 'Inspections', accepted: 8957, rejected: 406 }
    ];


    const renderSubContent = () => {
        switch (activeMainCard) {
            case 'summary':
                const currentSummary = SUMMARY_DATA[summarySubTab];
                return (
                    <div className="summary-tab-content fade-in">
                        <div className="sub-nav-tabs">
                            <button onClick={() => setSummarySubTab('erc')} className={`sub-nav-btn ${summarySubTab === 'erc' ? 'active' : ''}`}>ERC</button>
                            <button onClick={() => setSummarySubTab('sleeper')} className={`sub-nav-btn ${summarySubTab === 'sleeper' ? 'active' : ''}`}>Sleeper</button>
                            <button onClick={() => setSummarySubTab('railpad')} className={`sub-nav-btn ${summarySubTab === 'railpad' ? 'active' : ''}`}>Rail Pad</button>
                        </div>

                        <div className="kpi-cards-container">
                            {currentSummary.kpis.map((kpi, index) => (
                                <div key={index} className={`kpi-card-premium ${kpi.gradient ? 'gradient-orange' : ''} animated-up`}>
                                    <div className="kpi-card-header">
                                        <div className="kpi-info">
                                            <span className="kpi-label">{kpi.label}</span>
                                            <h2 className={`kpi-value text-glow-${kpi.color}`}>{kpi.value}</h2>
                                            {kpi.subtext && <span className="kpi-subtext">{kpi.subtext}</span>}
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

                        <div className="charts-row">
                            <div className="chart-card animated-up delay-1">
                                <h3>Inspection Calls Status</h3>
                                <p className="chart-subtitle">Total Calls: {inspectionCallsData[0].under + inspectionCallsData[0].pending}</p>
                                <div className="chart-wrapper-h">
                                    <ResponsiveContainer width="100%" height={150}>
                                        <BarChart layout="vertical" data={inspectionCallsData}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" hide />
                                            <Tooltip />
                                            <Bar dataKey="under" stackId="a" fill="#f59e0b" barSize={30} />
                                            <Bar dataKey="pending" stackId="a" fill="#ef4444" barSize={30} radius={[0, 20, 20, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="chart-legend-row">
                                    <div className="legend-item"><span className="dot bg-amber"></span> Under Inspection</div>
                                    <div className="legend-item"><span className="dot bg-red"></span> Pending</div>
                                </div>
                            </div>

                            <div className="chart-card animated-up delay-2">
                                <h3>Inspection Details</h3>
                                <p className="chart-subtitle">Total Inspections: {(inspectionDetailsData[0].accepted + inspectionDetailsData[0].rejected).toLocaleString()}</p>
                                <div className="chart-wrapper-h">
                                    <ResponsiveContainer width="100%" height={150}>
                                        <BarChart layout="vertical" data={inspectionDetailsData}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" hide />
                                            <Tooltip />
                                            <Bar dataKey="accepted" stackId="a" fill="#22c55e" barSize={40} />
                                            <Bar dataKey="rejected" stackId="a" fill="#ef4444" barSize={40} radius={[0, 20, 20, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="chart-legend-row">
                                    <div className="legend-item"><span className="dot bg-emerald"></span> Accepted</div>
                                    <div className="legend-item"><span className="dot bg-red"></span> Rejected</div>
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

                        {/* First Row of Charts */}
                        <div className="quality-charts-row">
                            <div className="q-chart-card wide-60">
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

                            <div className="q-chart-card wide-40">
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
                                <p className="banner-subtitle">Real-time quality surveillance and inspection analytics</p>
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
                                        className={`filter-dropdown-btn ${perfFilters.inspectors.length > 0 ? 'active' : ''}`}
                                        onClick={() => setOpenDropdown(openDropdown === 'inspector' ? null : 'inspector')}
                                    >
                                        <span className="btn-icon">👤</span> Inspector
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

                                {(perfFilters.vendors.length > 0 || perfFilters.inspectors.length > 0 || perfFilters.stages.length > 0) && (
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
                                        <th>INSPECTOR</th>
                                        <th>STAGE</th>
                                        <th className="text-right">INSPECTED</th>
                                        <th className="text-right">ACCEPTED</th>
                                        <th className="text-right">REJECTED</th>
                                        <th className="text-right">REJECTION %</th>
                                        <th>REASON</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map((record, idx) => (
                                        <tr key={record.id} className="row-hover">
                                            <td className="row-id">{idx + 1}</td>
                                            <td className="vendor-name">{record.manufacturer}</td>
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
                                    ))}
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
                            {REPORTS_DATA.tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`report-pill ${activeReport === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveReport(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="report-viewer-content">
                            {activeReport === 'mpr' && (
                                <div className="report-card animate-up">
                                    <div className="report-card-header">
                                        <h3>Monthly Progress Report</h3>
                                        <div className="header-actions">
                                            <button className="btn-icon">📥</button>
                                            <button className="btn-icon">⎙</button>
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
                                                {REPORTS_DATA.mpr.map((row, idx) => (
                                                    <tr key={idx}>
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
                                                ))}
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
                                                    {REPORTS_DATA.mau.table.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="font-bold">{row.manufacturer}</td>
                                                            <td className="text-right">{row.manufactured}</td>
                                                            <td className="text-right">{row.inspected}</td>
                                                            <td className="text-right text-red font-bold">{row.rejected}</td>
                                                            <td className="text-right">{row.rmRej}</td>
                                                            <td className="text-right text-red font-bold">{row.processRej}</td>
                                                            <td className="text-right">{row.finalRej}</td>
                                                        </tr>
                                                    ))}
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
                                                    <Tooltip />
                                                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="report-chart-card">
                                            <h4>Rejection % Analysis</h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={REPORTS_DATA.mau.rejectionRadar}>
                                                    <PolarGrid />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                                    <PolarRadiusAxis />
                                                    <Radar name="Rejection" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                                                    <Tooltip />
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
                                                    <option value="">Select PO</option>
                                                    {REPORTS_DATA.lwcl.poNumbers.map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                                <select
                                                    className="report-select"
                                                    value={lwclSelection.lot}
                                                    onChange={(e) => setLwclSelection({ ...lwclSelection, lot: e.target.value })}
                                                >
                                                    <option value="">Select Lot</option>
                                                    {REPORTS_DATA.lwcl.lots.map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
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
                                                            {REPORTS_DATA.lwcl.table.map((row, idx) => (
                                                                <tr key={idx}>
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
                                                            ))}
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
                                                    {REPORTS_DATA.qmr.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="font-medium text-slate-700">{row.parameter}</td>
                                                            <td className="text-right">{row.rm}</td>
                                                            <td className="text-right">{row.process}</td>
                                                            <td className="text-right">{row.final}</td>
                                                            <td className="text-right font-bold">{row.overallNos}</td>
                                                            <td className="text-right font-bold text-slate-800">{row.overallPct}</td>
                                                        </tr>
                                                    ))}
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
