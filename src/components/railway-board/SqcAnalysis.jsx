import React, { useState, useEffect, useMemo } from 'react';
import reportService from '../../services/reportService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './SqcAnalysis.css';

/* ──────────────────────────────────────────────
   SQC Rating thresholds
   ≥ 1.33 → Excellent (green)
   1.00–1.33 → Good (blue)
   0.67–1.00 → Marginal (amber)
   < 0.67  → Poor (red)
   ────────────────────────────────────────────── */
const getRatingBadge = (sqcRating) => {
    if (sqcRating >= 1.33) return { label: 'Excellent', color: '#059669', bg: '#d1fae5', dot: '#10b981' };
    if (sqcRating >= 1.00) return { label: 'Good', color: '#0369a1', bg: '#e0f2fe', dot: '#0ea5e9' };
    if (sqcRating >= 0.67) return { label: 'Marginal', color: '#b45309', bg: '#fef3c7', dot: '#f59e0b' };
    return { label: 'Poor', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' };
};

const getCpBadge = (cp) => {
    if (cp >= 1.33) return { label: '≥ 1.33', color: '#059669' };
    if (cp >= 1.00) return { label: '1.0–1.33', color: '#0369a1' };
    if (cp >= 0.67) return { label: '0.67–1.0', color: '#b45309' };
    return { label: '< 0.67', color: '#dc2626' };
};

const SqcAnalysis = ({ selectedProduct }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('sqcRating');
    const [sortDir, setSortDir] = useState('desc');
    const [selectedCompanyData, setSelectedCompanyData] = useState(null);
    const [showChartModal, setShowChartModal] = useState(false);

    const isErc = selectedProduct === 'ERC' || !selectedProduct;

    useEffect(() => {
        if (!isErc) return;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await reportService.getSqcReport();
                const list = Array.isArray(res?.responseData) ? res.responseData : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
                setData(list);
            } catch (err) {
                setError('Failed to load SQC report. Please try again.');
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isErc]);

    // Summary stats
    const summary = useMemo(() => {
        if (!data.length) return null;
        const excellent = data.filter(d => d.sqcRating >= 1.33).length;
        const good = data.filter(d => d.sqcRating >= 1.0 && d.sqcRating < 1.33).length;
        const marginal = data.filter(d => d.sqcRating >= 0.67 && d.sqcRating < 1.0).length;
        const poor = data.filter(d => d.sqcRating < 0.67).length;
        const avgSqcRating = (data.reduce((a, d) => a + d.sqcRating, 0) / data.length).toFixed(2);
        return { excellent, good, marginal, poor, avgSqcRating, total: data.length };
    }, [data]);

    // Filter + Sort
    const filtered = useMemo(() => {
        let arr = data.filter(d =>
            !search ||
            d.companyName?.toLowerCase().includes(search.toLowerCase()) ||
            d.companyUnit?.toLowerCase().includes(search.toLowerCase())
        );
        arr = [...arr].sort((a, b) => {
            let av = a[sortKey], bv = b[sortKey];
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return arr;
    }, [data, search, sortKey, sortDir]);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <i className="fa-solid fa-sort" style={{ color: '#94a3b8', fontSize: '10px' }} />;
        return <i className={`fa-solid fa-sort-${sortDir === 'asc' ? 'up' : 'down'}`} style={{ color: '#0ea5e9', fontSize: '10px' }} />;
    };

    if (!isErc) {
        return (
            <div className="sqc-analysis-container fade-in" style={{ padding: '40px 0' }}>
                <div className="sqc-card" style={{
                    padding: '80px 20px',
                    textAlign: 'center',
                    border: '2px dashed #d1fae5',
                    background: 'rgba(255,255,255,0.5)'
                }}>
                    <i className="fa-solid fa-flask-vial" style={{ fontSize: '48px', color: '#10b981', marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#14532d', marginBottom: '10px' }}>
                        SQC Analysis – {selectedProduct}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
                        Statistical Quality Control is currently prioritised for ERC MK-V components.
                        Integration for {selectedProduct} is under development.
                    </p>
                    <div className="status-pill status-no-data" style={{ marginTop: '24px', display: 'inline-block' }}>Coming Soon</div>
                </div>
            </div>
        );
    }

    return (
        <div className="sqc-analysis-container fade-in">

            {/* ── HEADER ── */}
            <div className="sqc-header-card">
                <div className="sqc-title">
                    <i className="fa-solid fa-chart-line" />
                    <span>SQC Analysis Report — Turning Diameter</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {loading && (
                            <div className="status-pill status-live">
                                <i className="fa-solid fa-spinner fa-spin" /> Loading…
                            </div>
                        )}
                        <span className={`status-pill ${data.length > 0 ? 'status-live' : 'status-no-data'}`}>
                            {data.length > 0 ? `${data.length} Units` : 'No Data'}
                        </span>
                    </div>
                </div>

                {/* Spec info row */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {[
                        { l: 'USL', v: '20.84 mm', color: '#ef4444' },
                        { l: 'LSL', v: '20.47 mm', color: '#ef4444' },
                        { l: 'SQC Rating Formula', v: '(0.5 × Cpk) + (0.5 × Cp)', color: '#0369a1' },
                        { l: 'Sample Window', v: 'Latest 30 Days / Unit', color: '#059669' },
                    ].map(item => (
                        <div key={item.l} style={{
                            background: '#f8fafc', borderRadius: '8px', padding: '6px 12px',
                            border: `1px solid ${item.color}22`, fontSize: '12px'
                        }}>
                            <span style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '10px' }}>
                                {item.l}:{' '}
                            </span>
                            <span style={{ fontWeight: '800', color: item.color }}>{item.v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── ERROR ── */}
            {error && (
                <div style={{ padding: '16px 20px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '10px' }} />
                    {error}
                </div>
            )}



            {/* ── LOADING SKELETON ── */}
            {loading && (
                <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '40px', color: '#10b981', marginBottom: '16px' }} />
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>Calculating SQC metrics…</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>Processing turning diameter data across all company units</p>
                </div>
            )}

            {/* ── TABLE ── */}
            {!loading && !error && (
                <div className="sqc-card" style={{ padding: 0, overflow: 'hidden' }}>

                    {/* Table toolbar */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-table-list" style={{ color: '#10b981' }} />
                            Company-Unit SQC Report
                        </div>
                        <div style={{ marginLeft: 'auto', position: 'relative' }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }} />
                            <input
                                id="sqc-search"
                                type="text"
                                placeholder="Search company or unit…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    padding: '8px 12px 8px 32px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    color: '#1e293b',
                                    outline: 'none',
                                    minWidth: '220px',
                                    background: '#f8fafc',
                                }}
                            />
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                            {filtered.length} of {data.length} units
                        </div>
                    </div>

                    {/* No data message */}
                    {data.length === 0 && !loading && (
                        <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
                            <i className="fa-solid fa-database" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '20px' }} />
                            <p style={{ fontSize: '18px', fontWeight: '700' }}>No Data Available</p>
                            <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '13px' }}>
                                No turning diameter records were found for process inspection calls.
                            </p>
                        </div>
                    )}

                    {/* Table */}
                    {filtered.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#f8fafc' }}>
                                        {[
                                            { key: 'companyName', label: 'Company Name', align: 'left' },
                                            { key: 'companyUnit', label: 'Company Unit', align: 'left' },
                                            { key: 'cp', label: 'Cp', align: 'center' },
                                            { key: 'cpk', label: 'Cpk', align: 'center' },
                                            { key: 'sqcRating', label: 'SQC Rating', align: 'center' },
                                        ].map(col => (
                                            <th
                                                key={col.key}
                                                onClick={() => handleSort(col.key)}
                                                style={{
                                                    padding: '14px 16px',
                                                    textAlign: col.align,
                                                    fontWeight: '700',
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.8px',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    userSelect: 'none',
                                                }}
                                            >
                                                {col.label}
                                                <span style={{ marginLeft: '6px' }}>
                                                    <SortIcon col={col.key} />
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row, idx) => {
                                        const badge = getRatingBadge(row.sqcRating);
                                        const cpBadge = getCpBadge(row.cp);
                                        const isEven = idx % 2 === 0;
                                        return (
                                            <tr
                                                key={`${row.companyName}-${row.companyUnit}-${idx}`}
                                                style={{
                                                    background: isEven ? '#ffffff' : '#f8fafc',
                                                    transition: 'background 0.15s',
                                                    borderBottom: '1px solid #f1f5f9',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                                                onMouseLeave={e => e.currentTarget.style.background = isEven ? '#ffffff' : '#f8fafc'}
                                            >


                                                {/* Company Name */}
                                                <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1e293b', maxWidth: '220px', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setSelectedCompanyData(row);
                                                        setShowChartModal(true);
                                                    }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '8px', height: '8px', borderRadius: '50%',
                                                            background: badge.dot, flexShrink: 0
                                                        }} />
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', color: '#0369a1' }}>
                                                            {row.companyName}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Company Unit */}
                                                <td style={{ padding: '12px 16px', color: '#475569', maxWidth: '220px' }}>
                                                    <span style={{
                                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap', display: 'block', fontSize: '12px'
                                                    }}>
                                                        {row.companyUnit}
                                                    </span>
                                                </td>



                                                {/* Cp */}
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{ fontWeight: '800', color: cpBadge.color, fontSize: '15px' }}>
                                                        {row.cp.toFixed(2)}
                                                    </span>
                                                </td>

                                                {/* Cpk */}
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        fontWeight: '800', fontSize: '15px',
                                                        color: row.cpk >= 1.33 ? '#059669' : row.cpk >= 1.0 ? '#0369a1' : row.cpk >= 0.67 ? '#b45309' : '#dc2626'
                                                    }}>
                                                        {row.cpk.toFixed(2)}
                                                    </span>
                                                </td>

                                                {/* SQC Rating */}
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontWeight: '900', fontSize: '17px', color: badge.color }}>
                                                            {row.sqcRating.toFixed(2)}
                                                        </span>
                                                        {/* Mini progress bar */}
                                                        <div style={{ width: '60px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${Math.max(0, Math.min(100, (row.sqcRating / 2) * 100))}%`,
                                                                height: '100%',
                                                                background: badge.dot,
                                                                borderRadius: '2px',
                                                                transition: 'width 0.8s ease',
                                                            }} />
                                                        </div>
                                                    </div>
                                                </td>


                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{
                        padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9',
                        fontSize: '11px', color: '#94a3b8', fontWeight: '600',
                        display: 'flex', gap: '20px', flexWrap: 'wrap'
                    }}>
                        <span>* Cp = (USL − LSL) / (6σ)</span>
                        <span>* Cpk = min((USL − μ) / 3σ, (μ − LSL) / 3σ)</span>
                        <span>* SQC Rating = (0.5 × Cpk) + (0.5 × Cp)</span>
                        <span>* Based on turning diameter measurements from latest 30 days per unit</span>
                    </div>
                </div>
            )}

            {/* CHART MODAL */}
            <Dialog open={showChartModal} onClose={() => setShowChartModal(false)} maxWidth="xl" fullWidth>
                <DialogTitle style={{ fontWeight: 800, fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    TURNING DIAMETER MONITORING (MM) - {selectedCompanyData?.companyName} ({selectedCompanyData?.companyUnit})
                    <IconButton onClick={() => setShowChartModal(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <div style={{ height: '550px', width: '100%' }}>
                        {selectedCompanyData?.diaValues && selectedCompanyData.diaValues.length > 0 ? (() => {
                            const chartData = selectedCompanyData.diaValues.map((val, idx) => ({
                                name: `S-${idx + 1}`,
                                value: val
                            }));
                            const mean = chartData.reduce((acc, curr) => acc + curr.value, 0) / chartData.length;
                            const uclVal = selectedCompanyData.ucl;
                            const lclVal = selectedCompanyData.lcl;

                            // Custom dot: red if outside USL/LSL, blue otherwise
                            const CustomDot = (props) => {
                                const { cx, cy, payload } = props;
                                const isOutOfSpec = payload.value > 20.84 || payload.value < 20.47;
                                return (
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={4}
                                        fill={isOutOfSpec ? '#ef4444' : '#0ea5e9'}
                                        stroke="none"
                                    />
                                );
                            };

                            return (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 80, left: 20, bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} label={{ value: 'Subgroup Samples (Latest 30 Days)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }} />
                                        <YAxis 
                                            domain={['dataMin - 0.05', 'dataMax + 0.05']} 
                                            tick={{ fontSize: 12, fill: '#64748b' }} 
                                            axisLine={false} 
                                            tickLine={false}
                                            width={60}
                                            tickFormatter={(val) => Number(val).toFixed(2)}
                                        />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${value} mm`, 'Diameter']}
                                        />
                                        
                                        <ReferenceLine y={20.84} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'USL 20.84', fill: '#ef4444', fontSize: 12 }} />
                                        <ReferenceLine y={20.47} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'LSL 20.47', fill: '#ef4444', fontSize: 12 }} />
                                        {uclVal > 0 && <ReferenceLine y={uclVal} stroke="#f59e0b" strokeDasharray="6 3" label={{ position: 'right', value: `UCL ${uclVal.toFixed(5)}`, fill: '#f59e0b', fontSize: 11 }} />}
                                        {lclVal > 0 && <ReferenceLine y={lclVal} stroke="#f59e0b" strokeDasharray="6 3" label={{ position: 'right', value: `LCL ${lclVal.toFixed(5)}`, fill: '#f59e0b', fontSize: 11 }} />}
                                        <ReferenceLine y={20.6} stroke="#22c55e" label={{ position: 'right', value: 'Target 20.6', fill: '#22c55e', fontSize: 12 }} />
                                        <ReferenceLine y={mean} stroke="#0ea5e9" strokeDasharray="5 5" label={{ position: 'right', value: `Mean ${mean.toFixed(4)}`, fill: '#0ea5e9', fontSize: 12 }} />
                                        
                                        <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            );
                        })() : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                No turning diameter data available for this unit.
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748b' }}>
                        * Data sourced from real-time SCADA acquisition. Control limits are process specification limits.
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SqcAnalysis;
