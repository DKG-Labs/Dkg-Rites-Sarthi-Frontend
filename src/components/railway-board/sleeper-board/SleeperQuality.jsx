import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line, LabelList
} from 'recharts';
import './SleeperSummary.css'; // Reusing some base styles

const SleeperQuality = ({ qualityData }) => {
    // Mock Data based on the requirements
    const defectDistributionData = [
        { name: 'Visual (Demoulding)', value: 450, color: '#10b981' },
        { name: 'Dimension (Demoulding)', value: 300, color: '#3b82f6' },
        { name: 'Final (Visual)', value: 200, color: '#f59e0b' },
        { name: 'Final (Critical)', value: 100, color: '#ef4444' },
        { name: 'Final (Non-Critical)', value: 150, color: '#8b5cf6' },
        { name: 'Cube Strength', value: 50, color: '#06b6d4' },
        { name: 'MR Deficiency', value: 80, color: '#ec4899' },
    ];

    const paretoData = [
        { name: 'Visual (Dem)', count: 450 },
        { name: 'Dimension (Dem)', count: 300 },
        { name: 'Final (Visual)', count: 200 },
        { name: 'Final (Non-Crit)', count: 150 },
        { name: 'Final (Crit)', count: 100 },
        { name: 'MR Deficiency', count: 80 },
        { name: 'Cube Strength', count: 50 },
    ].sort((a, b) => b.count - a.count);

    // Calculate cumulative percentage for Pareto
    const totalCount = paretoData.reduce((acc, item) => acc + item.count, 0);
    let cumulativeCount = 0;
    const paretoWithPercentage = paretoData.map(item => {
        cumulativeCount += item.count;
        return {
            ...item,
            percentage: parseFloat(((cumulativeCount / totalCount) * 100).toFixed(1))
        };
    });

    return (
        <div className="sleeper-summary-container fade-in">
            <div className="g2-charts mb">
                {/* Defect Distribution Pie Chart */}
                <div className="prof-card">
                    <h3 className="card-title-sm">Defect Distribution Analysis</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={defectDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {defectDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pareto Chart for Defect Types */}
                <div className="prof-card">
                    <h3 className="card-title-sm">Pareto Analysis (Defect Types)</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={paretoWithPercentage} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    height={80}
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    domain={[0, 100]}
                                    label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', style: { fill: '#8b5cf6', fontSize: 12 } }}
                                    tick={{ fontSize: 11, fill: '#8b5cf6' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar yAxisId="left" dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40}>
                                    <LabelList dataKey="count" position="top" style={{ fill: '#065f46', fontSize: 11, fontWeight: 700 }} />
                                </Bar>
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="percentage"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                                />
                                <Legend verticalAlign="top" align="right" height={36} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="prof-card">
                <h3 className="card-title-sm">Quarterly Quality Index</h3>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', margin: 0 }}>
                        Trend analysis for <strong>Water Cured Cube Strength</strong> and <strong>Modulus of Resistance</strong> (MR) will be plotted here after more data points are collected.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SleeperQuality;
