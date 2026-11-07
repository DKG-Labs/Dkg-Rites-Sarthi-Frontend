import React from 'react';
import {
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Line, ComposedChart, AreaChart, Area, Legend, Cell
} from 'recharts';
import '../erc-board/ProcessInspectionQualityTable.css';
import './RailPadQualityReport.css';

const CustomVerticalTick = ({ x, y, payload }) => {
    return (
        <g transform={`translate(${x},${y + 10})`}>
            <text
                x={0}
                y={0}
                dy={3.5}
                transform="rotate(-40)"
                textAnchor="end"
                fill="#475569"
                style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
            >
                {payload.value}
            </text>
        </g>
    );
};

const toTitleCase = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/* Glass tooltip shared by both charts */
const GlassTooltip = ({ active, payload, label, pct }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="rpqa-tip">
            <div className="rpqa-tip-title">{label}</div>
            {payload.map((p) => (
                <div key={p.dataKey} className="rpqa-tip-row">
                    <span className="rpqa-tip-dot" style={{ background: p.color || p.stroke || p.fill }}></span>
                    <span className="rpqa-tip-name">{p.name}</span>
                    <strong>
                        {pct || p.dataKey === 'cumulative'
                            ? `${Number(p.value || 0).toFixed(2)}%`
                            : Number(p.value || 0).toLocaleString()}
                    </strong>
                </div>
            ))}
        </div>
    );
};

const EmptyChart = ({ text }) => (
    <div className="rpqa-empty">
        <span className="rpq-empty-icon"><i className="fa-solid fa-chart-column"></i></span>
        <strong>No data yet</strong>
        <span>{text}</span>
    </div>
);

const RailPadQuality = ({ paretoData, rejectionTrendData }) => {
    // Use API data if available
    const rawParetoData = (paretoData && paretoData.length > 0) ? paretoData.map(d => ({
        name: toTitleCase(d.name || d.defectName),
        count: d.count || d.value,
        cumulative: d.cumulative
    })) : [];

    const totalParetoData = rawParetoData.filter(d =>
        d.name && d.name.toLowerCase() !== 'others' && d.name.toLowerCase() !== 'nil'
    );

    // Monthly Rejection Pattern
    const rejectionPatternData = (rejectionTrendData && rejectionTrendData.length > 0) ? rejectionTrendData.map(d => ({
        name: d.name || d.month || d.date || '?',
        process: d.process || d.value || d.rejectionRate || d.rejectionPercentage || 0,
        final: d.final || d.finalValue || 0
    })) : [];

    // KPIs derived from the same data shown in the charts
    const totalDefects = totalParetoData.reduce((s, d) => s + (Number(d.count) || 0), 0);
    const topDefect = totalParetoData.reduce((m, d) => ((Number(d.count) || 0) > (Number(m?.count) || 0) ? d : m), null);
    const top3 = [...totalParetoData].sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0)).slice(0, 3)
        .reduce((s, d) => s + (Number(d.count) || 0), 0);
    const top3Share = totalDefects > 0 ? (top3 * 100) / totalDefects : 0;
    const latest = rejectionPatternData[rejectionPatternData.length - 1];
    const prev = rejectionPatternData[rejectionPatternData.length - 2];
    const latestProc = Number(latest?.process) || 0;
    const delta = prev ? latestProc - (Number(prev.process) || 0) : null;

    const kpis = [
        { label: 'Total Defects', value: totalDefects.toLocaleString(), sub: 'Pcs, all reasons', icon: 'fa-bug', tone: '#b91c1c' },
        { label: 'Top Defect', value: topDefect?.name || '-', sub: topDefect ? `${Number(topDefect.count).toLocaleString()} pcs` : '', icon: 'fa-crosshairs', tone: '#c2410c', small: true },
        { label: 'Top 3 Share', value: `${top3Share.toFixed(1)}%`, sub: 'of all defects', icon: 'fa-chart-pie', tone: '#7c3aed' },
        {
            label: `Process Rej. ${latest ? `(${latest.name})` : ''}`,
            value: `${latestProc.toFixed(2)}%`,
            sub: delta === null ? 'latest month' : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(2)} pts vs prev`,
            subTone: delta === null ? undefined : (delta > 0 ? '#b91c1c' : '#15803d'),
            icon: 'fa-wave-square', tone: '#0d9488'
        },
    ];

    // highlight the "vital few" bars (up to 80% cumulative) in a stronger colour
    const vitalCut = totalParetoData.findIndex(d => Number(d.cumulative) >= 80);

    return (
        <div className="railpad-quality-container fade-in piq-container rpq-glass">
            <div className="piq-topbar" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div className="piq-title-area">
                    <h2 className="piq-heading">Quality Surveillance &amp; Defect Analysis</h2>
                    <span className="piq-badge">Rail Pad</span>
                </div>
            </div>

            {/* KPI cards */}
            <div className="rp-kpis">
                {kpis.map(k => (
                    <div key={k.label} className="rp-kpi">
                        <span className="rp-kpi-icon" style={{ color: k.tone, background: `${k.tone}14` }}>
                            <i className={`fa-solid ${k.icon}`}></i>
                        </span>
                        <div className="rp-kpi-text">
                            <span className="rp-kpi-label">{k.label}</span>
                            <strong className="rp-kpi-value" style={k.small ? { fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : undefined} title={k.value}>
                                {k.value}
                            </strong>
                            {k.sub && <span style={{ fontSize: '11px', color: k.subTone || '#94a3b8', fontWeight: 600 }}>{k.sub}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rpqa-grid">
                {/* Total Pareto */}
                <div className="rpqa-card">
                    <div className="rpqa-card-head">
                        <div>
                            <div className="rpqa-card-title">Defect Pareto</div>
                            <div className="rpqa-card-sub">Process &amp; final rejections by reason, with cumulative share</div>
                        </div>
                        <div className="rpqa-legend">
                            <span><i style={{ background: 'linear-gradient(180deg,#2563eb,#60a5fa)' }}></i>Count</span>
                            <span><i style={{ background: '#ef4444', height: '3px' }}></i>Cumulative %</span>
                        </div>
                    </div>
                    <div className="chart-wrap" style={{ height: '360px' }}>
                        {totalParetoData.length === 0 ? (
                            <EmptyChart text="No rejection reasons recorded for this period." />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={totalParetoData} margin={{ top: 10, right: 6, left: -6, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="rpqaBarVital" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563eb" />
                                            <stop offset="100%" stopColor="#60a5fa" />
                                        </linearGradient>
                                        <linearGradient id="rpqaBarRest" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#93c5fd" />
                                            <stop offset="100%" stopColor="#dbeafe" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eef2f7" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                        height={100}
                                        tick={<CustomVerticalTick />}
                                    />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                                    <Bar yAxisId="left" dataKey="count" name="Count" radius={[8, 8, 0, 0]} barSize={30}>
                                        {totalParetoData.map((d, i) => (
                                            <Cell key={d.name} fill={vitalCut === -1 || i <= vitalCut ? 'url(#rpqaBarVital)' : 'url(#rpqaBarRest)'} />
                                        ))}
                                    </Bar>
                                    <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke="#ef4444" strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#fff', stroke: '#ef4444', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Monthly Rejection Pattern */}
                <div className="rpqa-card">
                    <div className="rpqa-card-head">
                        <div>
                            <div className="rpqa-card-title">Monthly Rejection Pattern</div>
                            <div className="rpqa-card-sub">Process vs final rejection %, month on month</div>
                        </div>
                    </div>
                    <div className="chart-wrap" style={{ height: '290px' }}>
                        {rejectionPatternData.length === 0 ? (
                            <EmptyChart text="No monthly rejection data for this period." />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={rejectionPatternData} margin={{ top: 10, right: 16, left: -6, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorProcess" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorFinal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eef2f7" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} padding={{ left: 12, right: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} unit="%" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip content={<GlassTooltip pct />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 600 }} />
                                    <Area type="monotone" dataKey="process" name="Process Rejection" stroke="#10b981" fillOpacity={1} fill="url(#colorProcess)" strokeWidth={3}
                                        dot={{ r: 4, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Area type="monotone" dataKey="final" name="Final Rejection" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorFinal)" strokeWidth={3}
                                        dot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div className="rpqa-formula">
                        <i className="fa-solid fa-calculator"></i>
                        Process Rejection % = (Total rejected pads / Total pads declared) × 100
                    </div>
                </div>
            </div>

            <style>{`
                .rpqa-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; }
                .rpqa-card { padding: 18px 18px 14px; border-radius: 18px; background: rgba(255,255,255,0.88);
                    border: 1px solid rgba(226,232,240,0.9); box-shadow: 0 14px 30px -24px rgba(15,23,42,0.3);
                    animation: rpq-row-in .45s ease-out both; min-width: 0; }
                .rpqa-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
                .rpqa-card-title { font-size: 14px; font-weight: 800; color: #14532d; }
                .rpqa-card-sub { font-size: 11.5px; color: #64748b; margin-top: 2px; }
                .rpqa-legend { display: flex; gap: 12px; font-size: 11.5px; font-weight: 600; color: #475569; }
                .rpqa-legend span { display: inline-flex; align-items: center; gap: 6px; }
                .rpqa-legend i { display: inline-block; width: 14px; height: 10px; border-radius: 3px; }
                .rpqa-formula { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; padding: 9px 12px;
                    border-radius: 12px; font-size: 11.5px; color: #475569; background: #f8fafc; border: 1px dashed #e2e8f0; text-align: center; }
                .rpqa-formula i { color: #0d9488; }
                .rpqa-tip { min-width: 170px; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.97);
                    border: 1px solid #e2e8f0; box-shadow: 0 14px 30px -14px rgba(15,23,42,0.35); }
                .rpqa-tip-title { font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
                .rpqa-tip-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; padding: 2px 0; }
                .rpqa-tip-row strong { margin-left: auto; color: #0f172a; }
                .rpqa-tip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .rpqa-tip-name { white-space: nowrap; }
                .rpqa-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; }
                .rpqa-empty strong { font-size: 14px; color: #0f172a; }
                .rpqa-empty > span:not(.rpq-empty-icon) { font-size: 12px; color: #64748b; }
                @media (max-width: 1100px) { .rpqa-grid { grid-template-columns: 1fr; } }
                @media (max-width: 480px) { .rpqa-card { padding: 14px 10px 10px; } .rpqa-legend { display: none; } }
            `}</style>
        </div>
    );
};

export default RailPadQuality;
