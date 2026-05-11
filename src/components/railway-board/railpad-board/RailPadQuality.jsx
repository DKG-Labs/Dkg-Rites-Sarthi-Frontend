import React from 'react';
import {
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Line, ComposedChart, AreaChart, Area
} from 'recharts';

const RailPadQuality = () => {
    // Mock data for Pareto Chart (Process Rejections)
    const processParetoData = [
        { name: 'Porosity', count: 120, cumulative: 35 },
        { name: 'Blow Holes', count: 95, cumulative: 62 },
        { name: 'Improper Dimensions', count: 65, cumulative: 81 },
        { name: 'Uncut Flash', count: 45, cumulative: 94 },
        { name: 'Others', count: 20, cumulative: 100 }
    ];

    // Mock data for Pareto Chart (Final Rejections)
    const finalParetoData = [
        { name: 'Weight Failure', count: 85, cumulative: 40 },
        { name: 'Dimensional Failure', count: 60, cumulative: 68 },
        { name: 'Tensile/Hardness', count: 40, cumulative: 87 },
        { name: 'Specific Gravity', count: 18, cumulative: 95 },
        { name: 'Others', count: 11, cumulative: 100 }
    ];

    // Monthly Rejection Trend (Process)
    const monthlyTrendData = [
        { name: 'Jan', value: 2.1 },
        { name: 'Feb', value: 1.8 },
        { name: 'Mar', value: 2.4 },
        { name: 'Apr', value: 1.9 },
        { name: 'May', value: 1.5 },
        { name: 'Jun', value: 1.7 }
    ];

    return (
        <div className="railpad-quality-container fade-in">
            <div className="sec-title" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>
                Rail Pad Quality Surveillance & Defect Analysis
            </div>

            <div className="g2 mb">
                {/* Process Pareto */}
                <div className="prof-card">
                    <div className="sec-title" style={{ fontSize: '14px', marginBottom: '15px' }}>Process Rejection Pareto (Manufacturing Stage)</div>
                    <div className="chart-wrap" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={processParetoData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} style={{ fontSize: '11px' }} />
                                <Tooltip />
                                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Final Pareto */}
                <div className="prof-card">
                    <div className="sec-title" style={{ fontSize: '14px', marginBottom: '15px' }}>Final Rejection Pareto (Testing Stage)</div>
                    <div className="chart-wrap" style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={finalParetoData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} unit="%" domain={[0, 100]} style={{ fontSize: '11px' }} />
                                <Tooltip />
                                <Bar yAxisId="left" dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="g1">
                <div className="prof-card">
                    <div className="sec-title" style={{ fontSize: '14px', marginBottom: '15px' }}>Monthly Rejection Trend in Process (%)</div>
                    <div className="chart-wrap" style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyTrendData}>
                                <defs>
                                    <linearGradient id="colorRej" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                                <YAxis axisLine={false} tickLine={false} unit="%" style={{ fontSize: '11px' }} />
                                <Tooltip formatter={(value) => `${value}%`} />
                                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorRej)" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                        Process Rejection % = (Total rejected pads / Total pads declared) * 100
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RailPadQuality;
