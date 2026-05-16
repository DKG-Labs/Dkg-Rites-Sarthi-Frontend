import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, ScatterChart, Scatter, Cell, Label
} from 'recharts';
import './SqcAnalysis.css';

const SCADA_MANUFACTURERS = [
    { label: 'Vendor Alpha Industries', value: 'Alpha' },
    { label: 'Vendor Beta Forge', value: 'Beta' },
    { label: 'Vendor Gamma Metals', value: 'Gamma' },
    { label: 'Vendor Delta Engineering', value: 'Delta' },
    { label: 'Vendor Epsilon Components', value: 'Epsilon' }
];

const SCADA_UNITS = [
    { label: 'Medchal Unit', value: 'MDL-U1' },
    { label: 'Hyderabad Plant', value: 'HYD-P1' }
];

const SCADA_LINES = [
    { label: 'Line 1 (Auto)', value: 'L1' },
    { label: 'Line 2 (Manual)', value: 'L2' }
];

const SCADA_STAGES = [
    { label: 'MK-V Turning', value: 'MKV_TURNING' },
    { label: 'Bar Cropping', value: 'BAR_CROPPING' }
];

// Dummy data for X-bar chart
const xBarData = [
    { sample: 1, value: 20.68 },
    { sample: 2, value: 20.72 },
    { sample: 3, value: 20.65 },
    { sample: 4, value: 20.66 },
    { sample: 5, value: 20.70 },
    { sample: 6, value: 20.63 },
    { sample: 7, value: 20.67 },
    { sample: 8, value: 20.69 },
    { sample: 9, value: 20.66 },
    { sample: 10, value: 20.68 }
];

const SqcAnalysis = ({ selectedProduct }) => {
    const [manufacturer, setManufacturer] = useState('');
    const [unit, setUnit] = useState('');
    const [line, setLine] = useState('');
    const [stage, setStage] = useState('');

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

    // Target values based on images
    const targetValue = 20.64;
    const USL = 20.84;
    const LSL = 20.47;
    const UCL = 20.78; // Control Limit Example
    const LCL = 20.50; // Control Limit Example

    return (
        <div className="sqc-analysis-container fade-in">
            {/* 1. FILTERS HEADER */}
            <div className="sqc-header-card">
                <div className="sqc-title">
                    <i className="fa-solid fa-microscope"></i>
                    <span>SQC Planning & Control Monitor</span>
                    <span style={{ marginLeft: 'auto' }} className={`status-pill ${manufacturer ? 'status-live' : 'status-no-data'}`}>
                        {manufacturer ? 'Live Analysis' : 'Awaiting Selection'}
                    </span>
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
                        <select className="sqc-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                            <option value="">Select Unit</option>
                            {SCADA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                    </div>
                    <div className="sqc-filter-group">
                        <label>Line</label>
                        <select className="sqc-select" value={line} onChange={(e) => setLine(e.target.value)}>
                            <option value="">Select Line</option>
                            {SCADA_LINES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                    <div className="sqc-filter-group">
                        <label>Data Acquisition Stage</label>
                        <select className="sqc-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                            <option value="">Select Stage</option>
                            {SCADA_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. MAIN DASHBOARD CONTENT - Focused on Chart */}
            <div className="sqc-dashboard-single">
                <div className="charts-section">
                    <div className="sqc-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="sqc-section-title">
                            <span>Control Charts (Conceptual)</span>
                            <span className="prof-badge" style={{ background: '#fef2f2', color: '#991b1b' }}>Live Monitoring</span>
                        </div>

                        <div className="chart-legend">
                            <div className="legend-item" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <div className="legend-title" style={{ color: '#166534' }}>
                                    Standard Value
                                    <span className="legend-line" style={{ background: '#22c55e' }}>Green Line</span>
                                </div>
                                <div className="legend-desc">Fixed at {targetValue} mm — ideal target for all vendors.</div>
                            </div>
                            <div className="legend-item" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                <div className="legend-title" style={{ color: '#991b1b' }}>
                                    Specified Limits
                                    <span className="legend-line" style={{ background: '#ef4444' }}>Red Lines</span>
                                </div>
                                <div className="legend-desc">USL = {USL} mm | LSL = {LSL} mm. Outliers are defects.</div>
                            </div>
                            <div className="legend-item" style={{ background: '#fff7ed', border: '1px solid #fed7aa', gridColumn: 'span 2' }}>
                                <div className="legend-title" style={{ color: '#9a3412' }}>
                                    Control Limits (UCL & LCL)
                                    <span className="legend-line" style={{ background: '#f59e0b' }}>Orange Lines</span>
                                </div>
                                <div className="legend-desc">Dynamic 30-day data showing natural process variation and CNC capability.</div>
                            </div>
                        </div>

                        <div className="chart-container" style={{ flex: 1, minHeight: '500px', marginTop: '20px' }}>
                            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                X-bar Control Chart — Turning Diameter (mm)
                            </div>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={xBarData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="sample" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        style={{ fontSize: '11px', fontWeight: '600' }}
                                        tickFormatter={(val) => `S-${val}`}
                                    >
                                        <Label value="Subgroup Samples" offset={-10} position="insideBottom" style={{ fontSize: '12px', fontWeight: '700', fill: '#64748b' }} />
                                    </XAxis>
                                    <YAxis 
                                        domain={[20.4, 20.9]} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        style={{ fontSize: '11px', fontWeight: '600' }}
                                        tickCount={6}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontWeight: '700' }}
                                    />
                                    
                                    {/* USL & LSL */}
                                    <ReferenceLine y={USL} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2}>
                                        <Label value="USL" position="right" style={{ fill: '#ef4444', fontSize: '10px', fontWeight: 'bold' }} />
                                    </ReferenceLine>
                                    <ReferenceLine y={LSL} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2}>
                                        <Label value="LSL" position="right" style={{ fill: '#ef4444', fontSize: '10px', fontWeight: 'bold' }} />
                                    </ReferenceLine>

                                    {/* UCL & LCL */}
                                    <ReferenceLine y={UCL} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5}>
                                        <Label value="UCL" position="right" style={{ fill: '#f59e0b', fontSize: '10px', fontWeight: 'bold' }} />
                                    </ReferenceLine>
                                    <ReferenceLine y={LCL} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5}>
                                        <Label value="LCL" position="right" style={{ fill: '#f59e0b', fontSize: '10px', fontWeight: 'bold' }} />
                                    </ReferenceLine>

                                    {/* Center Line (CL) */}
                                    <ReferenceLine y={targetValue} stroke="#22c55e" strokeWidth={2}>
                                        <Label value="CL" position="right" style={{ fill: '#22c55e', fontSize: '10px', fontWeight: 'bold' }} />
                                    </ReferenceLine>

                                    <Line 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#0ea5e9" 
                                        strokeWidth={3} 
                                        dot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} 
                                        activeDot={{ r: 8 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="limits-info">
                            * Limits based on Railway Specifications: USL={USL}mm, LSL={LSL}mm
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SqcAnalysis;
