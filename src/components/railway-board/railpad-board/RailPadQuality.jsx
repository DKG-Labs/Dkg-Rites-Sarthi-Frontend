import React from 'react';
import {
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Line, ComposedChart, AreaChart, Area, Legend
} from 'recharts';

const CustomVerticalTick = ({ x, y, payload }) => {
    return (
        <g transform={`translate(${x},${y + 10})`}>
            <text
                x={0}
                y={0}
                dy={3.5}
                transform="rotate(90)"
                textAnchor="start"
                fill="#475569"
                style={{ fontSize: '10px', fontWeight: '500', fontFamily: 'sans-serif' }}
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

const RailPadQuality = ({ paretoData, rejectionTrendData }) => {
    // Use API data if available, else fallback to mock
    const rawParetoData = (paretoData && paretoData.length > 0) ? paretoData.map(d => ({
        name: toTitleCase(d.name || d.defectName),
        count: d.count || d.value,
        cumulative: d.cumulative
    })) : [
        { name: 'Porosity', count: 120, cumulative: 22 },
        { name: 'Blow Holes', count: 95, cumulative: 40 },
        { name: 'Weight Failure', count: 85, cumulative: 56 },
        { name: 'Improper Dimensions', count: 65, cumulative: 68 },
        { name: 'Dimensional Failure', count: 60, cumulative: 79 },
        { name: 'Uncut Flash', count: 45, cumulative: 87 },
        { name: 'Tensile/Hardness', count: 40, cumulative: 100 }
    ];

    const totalParetoData = rawParetoData.filter(d => 
        d.name && d.name.toLowerCase() !== 'others' && d.name.toLowerCase() !== 'nil'
    );

    // Monthly Rejection Pattern
    const rejectionPatternData = (rejectionTrendData && rejectionTrendData.length > 0) ? rejectionTrendData.map(d => ({
        name: d.name || d.month || d.date || '?',
        process: d.process || d.value || d.rejectionRate || d.rejectionPercentage || 0,
        final: d.final || d.finalValue || 0
    })) : [
        { name: 'Jan', process: 2.1, final: 1.2 },
        { name: 'Feb', process: 1.8, final: 1.5 },
        { name: 'Mar', process: 2.4, final: 1.1 },
        { name: 'Apr', process: 1.9, final: 1.4 },
        { name: 'May', process: 1.5, final: 1.6 },
        { name: 'Jun', process: 1.7, final: 1.3 }
    ];

    return (
        <div className="railpad-quality-container fade-in">
            <div className="sec-title" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>
                Rail Pad Quality Surveillance & Defect Analysis
            </div>

            <div className="g2 mb">
                {/* Total Pareto */}
                <div className="prof-card">
                    <div className="sec-title" style={{ fontSize: '14px', marginBottom: '15px' }}>Total Process & Final Rejection Pareto</div>
                    <div className="chart-wrap" style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={totalParetoData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    interval={0} 
                                    height={160} 
                                    tick={<CustomVerticalTick />}
                                />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} style={{ fontSize: '11px' }} />
                                <Tooltip />
                                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Rejection Pattern */}
                <div className="prof-card">
                    <div className="sec-title" style={{ fontSize: '14px', marginBottom: '15px' }}>Monthly Rejection Pattern (%)</div>
                    <div className="chart-wrap" style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={rejectionPatternData}>
                                <defs>
                                    <linearGradient id="colorProcess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorFinal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                                <YAxis axisLine={false} tickLine={false} unit="%" style={{ fontSize: '11px' }} />
                                <Tooltip formatter={(value) => `${value}%`} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                <Area type="monotone" dataKey="process" name="Process Rejection" stroke="#10b981" fillOpacity={1} fill="url(#colorProcess)" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                                <Area type="monotone" dataKey="final" name="Final Rejection" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorFinal)" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        Process Rejection % = (Total rejected pads / Total pads declared) * 100
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RailPadQuality;
