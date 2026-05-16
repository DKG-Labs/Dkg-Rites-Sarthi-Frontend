import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Label
} from 'recharts';
import './SqcAnalysis.css';

const SCADA_MANUFACTURERS = [
    { label: 'Patil Rail Infrastructure Pvt. Ltd.', value: 'PRIL' }
];

const SCADA_UNITS = [
    { label: 'Medchal Unit', value: 'MDL-U1' }
];

const SCADA_LINES = [
    { label: 'line 1', value: 'L1' }
];

const SCADA_STAGES = [
    { label: 'AUTO_COPYING', value: 'AUTO_COPYING' }
];

const SqcAnalysis = ({ selectedProduct }) => {
    const [manufacturer, setManufacturer] = useState('');
    const [unit, setUnit] = useState('');
    const [line, setLine] = useState('');
    const [stage, setStage] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Target values based on engineering specifications
    const TARGET_VALUE = 20.64;
    const USL = 20.84;
    const LSL = 20.47;

    useEffect(() => {
        const fetchScadaData = async () => {
            if (!manufacturer || !unit || !line || !stage) {
                setData([]);
                return;
            }

            setLoading(true);
            setError(null);

            const apiType = (selectedProduct || 'ERC').toUpperCase().replace(' ', '');
            const params = new URLSearchParams({
                type: apiType,
                plant: manufacturer,
                plantUnit: unit,
                line: line,
                machine: stage,
                page: '0',
                size: '30'
            });

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const scadaUrl = `https://scada.ritesqasarthi.com/api/scada/scada?${params.toString()}`;
            const baseUrls = isLocal 
                ? ['https://scada.ritesqasarthi.com'] 
                : [`https://api.allorigins.win/raw?url=${encodeURIComponent(scadaUrl)}`]; 
                
            let success = false;
            let fetchedData = [];
            
            for (const baseUrl of baseUrls) {
                try {
                    const fullUrl = baseUrl.includes('allorigins') ? baseUrl : `${baseUrl}/api/scada/scada?${params.toString()}`;
                    const response = await fetch(fullUrl, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...(localStorage.getItem('authToken') && { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })
                        }
                    });

                    if (response.ok) {
                        const resData = await response.json();
                        fetchedData = Array.isArray(resData) ? resData : (resData.content || []);
                        success = true;
                        break;
                    }
                } catch (err) {
                    console.error("Fetch attempt failed:", err);
                }
            }

            if (success) {
                // Reverse data to show oldest to newest for the chart (timeline)
                setData(fetchedData.reverse());
            } else {
                setError('Failed to connect to SCADA servers.');
                setData([]);
            }
            setLoading(false);
        };

        fetchScadaData();
    }, [manufacturer, unit, line, stage, selectedProduct]);

    // SQC Calculations
    const stats = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Extract DIA values and ensure they are numbers (check multiple case variations)
        const values = data
            .map(item => parseFloat(item.Dia || item.DIA || item.dia || 0))
            .filter(val => val > 0);

        if (values.length === 0) return null;

        const n = values.length;
        
        // 1. Mean (x-bar)
        const mean = values.reduce((a, b) => a + b, 0) / n;

        // 2. Variance (s^2)
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);

        // 3. Standard Deviation (s)
        const stdDev = Math.sqrt(variance);

        // 4. Cp = (USL - LSL) / (6 * stdDev)
        const cp = (USL - LSL) / (6 * stdDev);

        // 5. Cpk = min((USL - mean) / (3 * stdDev), (mean - LSL) / (3 * stdDev))
        const cpu = (USL - mean) / (3 * stdDev);
        const cpl = (mean - LSL) / (3 * stdDev);
        const cpk = Math.min(cpu, cpl);

        // 6. Control Limits (UCL & LCL) - 3 Sigma
        const ucl = mean + (3 * stdDev);
        const lcl = mean - (3 * stdDev);

        return {
            mean: mean.toFixed(4),
            stdDev: stdDev.toFixed(4),
            variance: variance.toFixed(6),
            cp: cp.toFixed(2),
            cpk: cpk.toFixed(2),
            ucl: ucl.toFixed(4),
            lcl: lcl.toFixed(4),
            values: values
        };
    }, [data, USL, LSL]);

    // Prepare chart data
    const chartData = useMemo(() => {
        return data.map((item, index) => ({
            sample: index + 1,
            value: parseFloat(item.Dia || item.DIA || item.dia || 0),
            time: item.TIME || item.time || ''
        })).filter(d => d.value > 0);
    }, [data]);

    const isErc = selectedProduct === 'ERC' || !selectedProduct;

    if (!isErc) {
        return (
            <div className="sqc-analysis-container fade-in" style={{ padding: '40px 0' }}>
                <div className="sqc-card" style={{ 
                    padding: '80px 20px', 
                    textAlign: 'center',
                    border: '2px dashed #d1fae5',
                    background: 'rgba(255, 255, 255, 0.5)'
                }}>
                    <i className="fa-solid fa-flask-vial" style={{ fontSize: '48px', color: '#10b981', marginBottom: '20px' }}></i>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#14532d', marginBottom: '10px' }}>SQC Analysis - {selectedProduct}</h2>
                    <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
                        Statistical Quality Control integration is currently prioritized for ERC MK-V components. 
                        Integration for {selectedProduct} is under development.
                    </p>
                    <div className="status-pill status-no-data" style={{ marginTop: '24px', display: 'inline-block' }}>Coming Soon</div>
                </div>
            </div>
        );
    }


    return (
        <div className="sqc-analysis-container fade-in">
            {/* 1. FILTERS HEADER */}
            <div className="sqc-header-card">
                <div className="sqc-title">
                    <i className="fa-solid fa-chart-line"></i>
                    <span>SQC Planning & Control Monitor</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                        {loading && <div className="status-pill status-live"><i className="fa-solid fa-spinner fa-spin"></i> Syncing...</div>}
                        <span className={`status-pill ${data.length > 0 ? 'status-live' : 'status-no-data'}`}>
                            {data.length > 0 ? `${data.length} Samples Active` : 'Awaiting Data'}
                        </span>
                    </div>
                </div>

                <div className="sqc-filters-grid">
                    <div className="sqc-filter-group">
                        <label>Manufacturer</label>
                        <select className="sqc-select" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)}>
                            <option value="">Select Manufacturer</option>
                            {SCADA_MANUFACTURERS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="sqc-filter-group">
                        <label>Unit</label>
                        <select className="sqc-select" value={unit} onChange={(e) => setUnit(e.target.value)} disabled={!manufacturer}>
                            <option value="">Select Unit</option>
                            {SCADA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                    </div>
                    <div className="sqc-filter-group">
                        <label>Line</label>
                        <select className="sqc-select" value={line} onChange={(e) => setLine(e.target.value)} disabled={!unit}>
                            <option value="">Select Line</option>
                            {SCADA_LINES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                    <div className="sqc-filter-group">
                        <label>Data Acquisition Stage</label>
                        <select className="sqc-select" value={stage} onChange={(e) => setStage(e.target.value)} disabled={!line}>
                            <option value="">Select Stage</option>
                            {SCADA_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. SQC KPI CARDS */}
            {stats && (
                <div className="sqc-stats-grid fade-in">
                    <div className="sqc-stat-card">
                        <div className="stat-label">Mean (μ)</div>
                        <div className="stat-value">{stats.mean}</div>
                        <div className="stat-unit">mm</div>
                    </div>
                    <div className="sqc-stat-card">
                        <div className="stat-label">Std Dev (σ)</div>
                        <div className="stat-value">{stats.stdDev}</div>
                        <div className="stat-unit">mm</div>
                    </div>
                    <div className="sqc-stat-card">
                        <div className="stat-label">Variance</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem' }}>{stats.variance}</div>
                        <div className="stat-unit">mm²</div>
                    </div>
                    <div className="sqc-stat-card highlight">
                        <div className="stat-label">Process Capability (Cp)</div>
                        <div className="stat-value" style={{ color: parseFloat(stats.cp) > 1.33 ? '#059669' : '#d97706' }}>{stats.cp}</div>
                        <div className="stat-badge">{parseFloat(stats.cp) > 1.33 ? 'Excellent' : 'Stable'}</div>
                    </div>
                    <div className="sqc-stat-card highlight">
                        <div className="stat-label">Center Capability (Cpk)</div>
                        <div className="stat-value" style={{ color: parseFloat(stats.cpk) > 1.33 ? '#059669' : '#dc2626' }}>{stats.cpk}</div>
                        <div className="stat-badge">{parseFloat(stats.cpk) > 1.33 ? 'Centered' : 'Shifted'}</div>
                    </div>
                </div>
            )}

            {/* 3. MAIN DASHBOARD CONTENT */}
            <div className="sqc-dashboard-single">
                <div className="charts-section">
                    <div className="sqc-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="sqc-section-title">
                            <span>X-Bar Control Chart</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <span className="prof-badge" style={{ background: '#f0f9ff', color: '#0369a1' }}>Sample size: 30</span>
                                <span className="prof-badge" style={{ background: '#fef2f2', color: '#991b1b' }}>Live Monitoring</span>
                            </div>
                        </div>

                        {error && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '12px', margin: '20px' }}>
                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '10px' }}></i>
                                {error}
                            </div>
                        )}

                        {!manufacturer || !stage ? (
                            <div style={{ padding: '100px 20px', textAlign: 'center', color: '#64748b' }}>
                                <i className="fa-solid fa-tower-broadcast" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '20px' }}></i>
                                <p style={{ fontSize: '18px', fontWeight: '700' }}>Waiting for Selection</p>
                                <p style={{ maxWidth: '400px', margin: '0 auto' }}>Please select Manufacturer, Unit, Line, and Stage to initiate live SQC analysis.</p>
                            </div>
                        ) : data.length === 0 && !loading ? (
                            <div style={{ padding: '100px 20px', textAlign: 'center', color: '#64748b' }}>
                                <i className="fa-solid fa-database" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '20px' }}></i>
                                <p style={{ fontSize: '18px', fontWeight: '700' }}>No Data Available</p>
                                <p style={{ maxWidth: '400px', margin: '0 auto' }}>No SCADA DIA records found for the selected stage.</p>
                            </div>
                        ) : (
                            <>
                                <div className="chart-legend">
                                    <div className="legend-item" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                        <div className="legend-title" style={{ color: '#166534' }}>
                                            Target Value
                                            <span className="legend-line" style={{ background: '#22c55e' }}>Green Line</span>
                                        </div>
                                        <div className="legend-desc">Fixed target at {TARGET_VALUE} mm.</div>
                                    </div>
                                    <div className="legend-item" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                        <div className="legend-title" style={{ color: '#991b1b' }}>
                                            Spec Limits (USL/LSL)
                                            <span className="legend-line" style={{ background: '#ef4444' }}>Red Lines</span>
                                        </div>
                                        <div className="legend-desc">{LSL}mm to {USL}mm boundaries.</div>
                                    </div>
                                    <div className="legend-item" style={{ background: '#fff7ed', border: '1px solid #fed7aa', gridColumn: 'span 2' }}>
                                        <div className="legend-title" style={{ color: '#9a3412' }}>
                                            Control Limits (UCL & LCL)
                                            <span className="legend-line" style={{ background: '#f59e0b' }}>Orange Lines</span>
                                        </div>
                                        <div className="legend-desc">Dynamically calculated from process variation (±3σ).</div>
                                    </div>
                                </div>

                                <div className="chart-container" style={{ flex: 1, minHeight: '500px', marginTop: '20px' }}>
                                    <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Turning Diameter Monitoring (mm)
                                    </div>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={chartData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="sample" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                style={{ fontSize: '11px', fontWeight: '600' }}
                                                tickFormatter={(val) => `S-${val}`}
                                            >
                                                <Label value="Subgroup Samples (Last 30)" offset={-10} position="insideBottom" style={{ fontSize: '12px', fontWeight: '700', fill: '#64748b' }} />
                                            </XAxis>
                                            <YAxis 
                                                domain={[LSL - 0.1, USL + 0.1]} 
                                                axisLine={false} 
                                                tickLine={false} 
                                                style={{ fontSize: '11px', fontWeight: '600' }}
                                                tickCount={8}
                                                tickFormatter={(val) => val.toFixed(2)}
                                            />
                                            <Tooltip 
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const d = payload[0].payload;
                                                        return (
                                                            <div className="sqc-tooltip">
                                                                <div className="tooltip-time">{d.time}</div>
                                                                <div className="tooltip-value">Dia: <strong>{d.value} mm</strong></div>
                                                                <div className="tooltip-sample">Sample #{d.sample}</div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            
                                            {/* USL & LSL */}
                                            <ReferenceLine y={USL} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2}>
                                                <Label value={`USL ${USL}`} position="right" style={{ fill: '#ef4444', fontSize: '10px', fontWeight: 'bold' }} />
                                            </ReferenceLine>
                                            <ReferenceLine y={LSL} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2}>
                                                <Label value={`LSL ${LSL}`} position="right" style={{ fill: '#ef4444', fontSize: '10px', fontWeight: 'bold' }} />
                                            </ReferenceLine>

                                            {/* UCL & LCL */}
                                            {stats && (
                                                <>
                                                    <ReferenceLine y={parseFloat(stats.ucl)} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5}>
                                                        <Label value={`UCL ${stats.ucl}`} position="right" style={{ fill: '#f59e0b', fontSize: '10px', fontWeight: 'bold' }} />
                                                    </ReferenceLine>
                                                    <ReferenceLine y={parseFloat(stats.lcl)} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5}>
                                                        <Label value={`LCL ${stats.lcl}`} position="right" style={{ fill: '#f59e0b', fontSize: '10px', fontWeight: 'bold' }} />
                                                    </ReferenceLine>
                                                </>
                                            )}

                                            {/* Target Line (CL) */}
                                            <ReferenceLine y={TARGET_VALUE} stroke="#22c55e" strokeWidth={2}>
                                                <Label value={`Target ${TARGET_VALUE}`} position="right" style={{ fill: '#22c55e', fontSize: '10px', fontWeight: 'bold' }} />
                                            </ReferenceLine>

                                            {/* Calculated Mean Line */}
                                            {stats && (
                                                <ReferenceLine y={parseFloat(stats.mean)} stroke="#0ea5e9" strokeDasharray="2 2" strokeWidth={1}>
                                                    <Label value={`Mean ${stats.mean}`} position="insideBottomRight" style={{ fill: '#0ea5e9', fontSize: '10px', fontWeight: 'bold' }} />
                                                </ReferenceLine>
                                            )}

                                            <Line 
                                                type="monotone" 
                                                dataKey="value" 
                                                stroke="#0ea5e9" 
                                                strokeWidth={3} 
                                                dot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} 
                                                activeDot={{ r: 8 }} 
                                                isAnimationActive={true}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                        <div className="limits-info">
                            * Data sourced from real-time SCADA acquisition. Control limits are ±3σ from process mean.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SqcAnalysis;
