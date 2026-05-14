import React from 'react';

const RailPadPerformance = ({ perfData, loading }) => {
    // Combined Mock Data for Performance Matrix
    const mockPerformanceData = [
        { ieName: 'A.K. Sharma', plant: 'Polymers India', rio: 'NRIO', inspected: 25000, accepted: 24500, rejected: 500, rejPct: 2, stage: 'PROCESS' },
        { ieName: 'R.P. Singh', plant: 'Flexi Rubber', rio: 'WRIO', inspected: 18000, accepted: 17200, rejected: 800, rejPct: 4.4, stage: 'PROCESS' },
        { ieName: 'M.L. Gupta', plant: 'Durable Pads', rio: 'SRIO', inspected: 30000, accepted: 29800, rejected: 200, rejPct: 0.67, stage: 'PROCESS' },
        { ieName: 'S.K. Verma', plant: 'Polymers India', rio: 'NRIO', inspected: 15000, accepted: 14800, rejected: 200, rejPct: 1.33, stage: 'FINAL' },
        { ieName: 'V.P. Yadav', plant: 'Flexi Rubber', rio: 'WRIO', inspected: 12000, accepted: 11500, rejected: 500, rejPct: 4.17, stage: 'FINAL' },
        { ieName: 'N.K. Reddy', plant: 'Durable Pads', rio: 'SRIO', inspected: 20000, accepted: 19900, rejected: 100, rejPct: 0.5, stage: 'FINAL' },
    ];

    // Use the specified mock data
    const performanceData = mockPerformanceData;

    return (
        <div className="railpad-performance-container fade-in">
            <div className="prof-card">
                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                        Performance Monitoring Matrix
                    </span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="prof-badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', cursor: 'pointer' }}>
                            <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i> Export Excel
                        </button>
                    </div>
                </div>

                <div className="table-responsive" style={{ position: 'relative', minHeight: loading ? '200px' : 'auto' }}>
                    {loading && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(255,255,255,0.7)', zIndex: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="spinner-small" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        </div>
                    )}
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>MANUFACTURING PLANT</th>
                                <th>RIO</th>
                                <th>INSPECTING ENGINEER (IE)</th>
                                <th>STAGE</th>
                                <th className="text-right">INSPECTED (PCS)</th>
                                <th className="text-right">ACCEPTED (PCS)</th>
                                <th className="text-right">REJECTED (PCS)</th>
                                <th className="text-right">REJECTION %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performanceData.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'row-odd' : 'row-even'}>
                                    <td>{i + 1}</td>
                                    <td style={{ fontWeight: '600' }}>{row.plant}</td>
                                    <td><span className="prof-badge" style={{ background: '#f0fdf4', color: '#166534' }}>{row.rio}</span></td>
                                    <td>👤 {row.ieName}</td>
                                    <td>
                                        <span className="prof-badge" style={{ 
                                            background: row.stage === 'PROCESS' ? '#f0f9ff' : '#f5f3ff', 
                                            color: row.stage === 'PROCESS' ? '#075985' : '#5b21b6' 
                                        }}>
                                            {row.stage}
                                        </span>
                                    </td>
                                    <td className="text-right">{row.inspected.toLocaleString()}</td>
                                    <td className="text-right" style={{ color: '#16a34a' }}>{row.accepted.toLocaleString()}</td>
                                    <td className="text-right" style={{ color: '#dc2626' }}>{row.rejected.toLocaleString()}</td>
                                    <td className="text-right">
                                        <span className="prof-badge" style={{ 
                                            background: '#fff7ed', 
                                            color: '#9a3412',
                                            minWidth: '50px',
                                            textAlign: 'center'
                                        }}>
                                            {(Number(row.rejPct) || 0).toFixed(2)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RailPadPerformance;
