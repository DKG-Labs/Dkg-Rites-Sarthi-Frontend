import React, { useState, useEffect } from 'react';
import reportService from '../../../services/reportService';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line, LabelList
} from 'recharts';
import './SleeperSummary.css'; // Reusing some base styles

const SleeperQuality = ({ qualityData }) => {
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 2);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [defectData, setDefectData] = useState([]);
    const [paretoApiData, setParetoApiData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paretoLoading, setParetoLoading] = useState(false);

    useEffect(() => {
        const fetchDefectData = async () => {
            setLoading(true);
            try {
                const response = await reportService.getSleeperDefectDistribution({ startDate: fromDate, endDate: toDate });
                if (response && response.responseData && response.responseData.defects) {
                    setDefectData(response.responseData.defects);
                }
            } catch (error) {
                console.error("Error fetching defect distribution:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchParetoData = async () => {
            setParetoLoading(true);
            try {
                const response = await reportService.getSleeperParetoAnalysis({ startDate: fromDate, endDate: toDate });
                if (response && response.responseData && response.responseData.defects) {
                    setParetoApiData(response.responseData.defects);
                }
            } catch (error) {
                console.error("Error fetching pareto data:", error);
            } finally {
                setParetoLoading(false);
            }
        };

        fetchDefectData();
        fetchParetoData();
    }, [fromDate, toDate]);

    // Aggregate data by category for the Pie Chart
    const aggregatedData = React.useMemo(() => {
        if (!defectData || defectData.length === 0) return [];

        const categories = {};
        defectData.forEach(defect => {
            const cat = defect.category || 'Other';
            if (!categories[cat]) {
                categories[cat] = 0;
            }
            categories[cat] += defect.defectCount || 0;
        });

        const categoryColors = {
            // Original names (local dev)
            'Visual (Demoulding)': '#10b981',
            'Dimension (Demoulding)': '#3b82f6',
            'Final (Visual)': '#f59e0b',
            'Final (Critical)': '#ef4444',
            'Final (Non-Critical)': '#8b5cf6',
            'Cube Strength': '#06b6d4',
            'MR Deficiency': '#ec4899',
            // Server / production names
            'Visual Defects': '#10b981',
            'Critical Dimensions': '#ef4444',
            'General Dimensional Defect': '#3b82f6',
            'Non Critical': '#8b5cf6',
            'Demoulding Rejection': '#f59e0b',
            'Cube Strength Failure': '#06b6d4',
        };

        // Fallback palette — ensures colors even for unknown category names
        const FALLBACK_PALETTE = [
            '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
            '#8b5cf6', '#06b6d4', '#ec4899', '#f97316',
            '#14b8a6', '#a855f7', '#84cc16', '#eab308',
        ];

        const catKeys = Object.keys(categories);
        return catKeys.map((cat, idx) => ({
            name: cat,
            value: categories[cat],
            color: categoryColors[cat] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
        })).sort((a, b) => b.value - a.value);
    }, [defectData]);

    const defectDistributionData = aggregatedData.length > 0 ? aggregatedData : [
        { name: 'Visual (Demoulding)', value: 450, color: '#10b981' },
        { name: 'Dimension (Demoulding)', value: 300, color: '#3b82f6' },
        { name: 'Final (Visual)', value: 200, color: '#f59e0b' },
        { name: 'Final (Critical)', value: 100, color: '#ef4444' },
        { name: 'Final (Non-Critical)', value: 150, color: '#8b5cf6' },
        { name: 'Cube Strength', value: 50, color: '#06b6d4' },
        { name: 'MR Deficiency', value: 80, color: '#ec4899' },
    ];

    const paretoWithPercentage = paretoApiData.length > 0 ? paretoApiData.map(item => ({
        name: item.defectCategory,
        count: item.defectCount,
        percentage: item.cumulativePercentage
    })) : [
        { name: 'Visual (Dem)', count: 450, percentage: 34.6 },
        { name: 'Dimension (Dem)', count: 300, percentage: 57.7 },
        { name: 'Final (Visual)', count: 200, percentage: 73.1 },
        { name: 'Final (Non-Crit)', count: 150, percentage: 84.6 },
        { name: 'Final (Crit)', count: 100, percentage: 92.3 },
        { name: 'MR Deficiency', count: 80, percentage: 98.5 },
        { name: 'Cube Strength', count: 50, percentage: 100 },
    ].sort((a, b) => b.count - a.count);

    return (
        <div className="sleeper-summary-container fade-in">
            {/* Date Range Section */}
            <div className="date-range-bar mb" style={{
                background: '#fff',
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid #d1fae5',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-calendar-days" style={{ color: '#10b981' }}></i>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#166534', textTransform: 'uppercase' }}>Date Range</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>FROM</label>
                    <input 
                        type="date" 
                        value={fromDate} 
                        onChange={(e) => setFromDate(e.target.value)}
                        style={{
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            color: '#14532d',
                            outline: 'none',
                            background: '#f0fdf4'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>TO</label>
                    <input 
                        type="date" 
                        value={toDate} 
                        onChange={(e) => setToDate(e.target.value)}
                        style={{
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            color: '#14532d',
                            outline: 'none',
                            background: '#f0fdf4'
                        }}
                    />
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={() => {
                            const d = new Date();
                            d.setMonth(d.getMonth() - 2);
                            setFromDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
                            setToDate(new Date().toISOString().split('T')[0]);
                        }}
                        style={{
                            background: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                            padding: '5px 15px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <i className="fa-solid fa-undo"></i>
                        Reset
                    </button>
                    <button style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        padding: '5px 15px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                    }}>
                        <i className="fa-solid fa-arrows-rotate"></i>
                        Refresh
                    </button>
                </div>
            </div>
            <div className="g2-charts mb">
                {/* Defect Distribution Pie Chart */}
                <div className="prof-card">
                    <h3 className="card-title-sm">Defect Distribution Analysis</h3>
                    <div style={{ width: '100%', height: 320, position: 'relative' }}>
                        {loading && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(255,255,255,0.7)', zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div className="loading-spinner"></div>
                            </div>
                        )}
                        {!loading && defectDistributionData.length === 0 && (
                            <div style={{
                                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748b', fontSize: '14px'
                            }}>
                                No data available for selected range
                            </div>
                        )}
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={defectDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
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
                    <div style={{ width: '100%', height: 400, position: 'relative' }}>
                        {paretoLoading && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(255,255,255,0.7)', zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div className="loading-spinner"></div>
                            </div>
                        )}
                        {!paretoLoading && paretoWithPercentage.length === 0 && (
                            <div style={{
                                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748b', fontSize: '14px'
                            }}>
                                No data available for selected range
                            </div>
                        )}
                        <ResponsiveContainer>
                            <ComposedChart data={paretoWithPercentage} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    height={100}
                                    tick={{ fontSize: 8, fontWeight: 500, fill: '#64748b', dy: 40 }}
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


        </div>
    );
};

export default SleeperQuality;
