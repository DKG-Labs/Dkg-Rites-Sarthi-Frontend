import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DashboardGraph = ({ liveData = [] }) => {
    // Transform data for the chart using liveData
    const displayData = liveData || [];

    const data = displayData.slice(0, 5).map(item => ({
        name: `${item.railway} - ${item.vendor}`,
        po_no: item.poNo || item.po_no,
        "PO Qty": item.poQty || item.po_qty || 0,
        "Accepted": item.finalQuantityAcceptedByRites || item.accepted_qty || 0,
        "Balance": item.balancePoQty || item.balance_qty || 0,
    }));

    return (
        <div className="content-card" style={{ marginTop: '24px', padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Performance Overview</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                    PO Quantity vs Accepted vs Balance (Top 5 Records)
                </p>
            </div>

            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={20}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="po_no"
                            scale="point"
                            padding={{ left: 30, right: 30 }}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="PO Qty" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Accepted" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Balance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DashboardGraph;
