import React from 'react';

const RailPadPerformance = () => {
    // Mock Data for Performance Matrix
    const processPerformance = [
        { ieName: 'A.K. Sharma', plant: 'Polymers India', inspected: 25000, accepted: 24500, rejected: 500, rejPct: 2 },
        { ieName: 'R.P. Singh', plant: 'Flexi Rubber', inspected: 18000, accepted: 17200, rejected: 800, rejPct: 4.4 },
        { ieName: 'M.L. Gupta', plant: 'Durable Pads', inspected: 30000, accepted: 29800, rejected: 200, rejPct: 0.67 },
    ];

    const finalPerformance = [
        { ieName: 'S.K. Verma', plant: 'Polymers India', inspected: 15000, accepted: 14800, rejected: 200, rejPct: 1.33 },
        { ieName: 'V.P. Yadav', plant: 'Flexi Rubber', inspected: 12000, accepted: 11500, rejected: 500, rejPct: 4.17 },
        { ieName: 'N.K. Reddy', plant: 'Durable Pads', inspected: 20000, accepted: 19900, rejected: 100, rejPct: 0.5 },
    ];

    return (
        <div className="railpad-performance-container fade-in">
            <div className="sec-title" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>
                Performance Matrix (Manufacturing Units & IEs)
            </div>

            {/* Process Verification Stage */}
            <div className="prof-card mb" style={{ borderTop: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div className="sec-title" style={{ fontSize: '15px', color: '#1e40af', marginBottom: 0 }}>
                        <i className="fa-solid fa-industry" style={{ marginRight: '8px' }}></i>
                        Process Verification Stage (Process IE)
                    </div>
                    <span className="prof-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>Manufacturing Stage</span>
                </div>
                <div className="table-responsive">
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th>Inspecting Engineer (IE)</th>
                                <th>Manufacturing Plant</th>
                                <th className="text-right">Inspected (Pcs)</th>
                                <th className="text-right">Accepted (Pcs)</th>
                                <th className="text-right">Rejected (Pcs)</th>
                                <th className="text-right">Rejection %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processPerformance.map((row, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: '600' }}>{row.ieName}</td>
                                    <td>{row.plant}</td>
                                    <td className="text-right">{row.inspected.toLocaleString()}</td>
                                    <td className="text-right" style={{ color: '#16a34a' }}>{row.accepted.toLocaleString()}</td>
                                    <td className="text-right" style={{ color: '#dc2626' }}>{row.rejected.toLocaleString()}</td>
                                    <td className="text-right">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                            <span>{row.rejPct}%</span>
                                            <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${row.rejPct * 10}%`, height: '100%', background: row.rejPct > 3 ? '#ef4444' : '#3b82f6' }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Final Inspection Stage */}
            <div className="prof-card" style={{ borderTop: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div className="sec-title" style={{ fontSize: '15px', color: '#5b21b6', marginBottom: 0 }}>
                        <i className="fa-solid fa-flask" style={{ marginRight: '8px' }}></i>
                        Final Inspection Stage (Main IE)
                    </div>
                    <span className="prof-badge" style={{ background: '#ede9fe', color: '#5b21b6' }}>Testing Stage</span>
                </div>
                <div className="table-responsive">
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th>Inspecting Engineer (IE)</th>
                                <th>Manufacturing Plant</th>
                                <th className="text-right">Inspected (Pcs)</th>
                                <th className="text-right">Accepted (Pcs)</th>
                                <th className="text-right">Rejected (Pcs)</th>
                                <th className="text-right">Rejection %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finalPerformance.map((row, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: '600' }}>{row.ieName}</td>
                                    <td>{row.plant}</td>
                                    <td className="text-right">{row.inspected.toLocaleString()}</td>
                                    <td className="text-right" style={{ color: '#16a34a' }}>{row.accepted.toLocaleString()}</td>
                                    <td className="text-right" style={{ color: '#dc2626' }}>{row.rejected.toLocaleString()}</td>
                                    <td className="text-right">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                            <span>{row.rejPct}%</span>
                                            <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${row.rejPct * 10}%`, height: '100%', background: row.rejPct > 3 ? '#ef4444' : '#8b5cf6' }}></div>
                                            </div>
                                        </div>
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
