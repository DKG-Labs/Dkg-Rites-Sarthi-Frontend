import React from 'react';

const RailPadMauReport = () => {
    const mockData = [
        { plant: 'Polymers India', rio: 'WRIO', production: 150000, acceptance: 145000, procRej: 3000, procRejPct: 2, finalRej: 2000, finalRejPct: 1.33, totalRejPct: 3.33 },
        { plant: 'Flexi Rubber', rio: 'WRIO', production: 120000, acceptance: 112000, procRej: 5000, procRejPct: 4.17, finalRej: 3000, finalRejPct: 2.5, totalRejPct: 6.67 },
        { plant: 'Durable Pads', rio: 'SRIO', production: 200000, acceptance: 198500, procRej: 1000, procRejPct: 0.5, finalRej: 500, finalRejPct: 0.25, totalRejPct: 0.75 },
    ];

    return (
        <div className="report-content fade-in">
            <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>Monthly Analysis of Units (MAU) - Rail Pad</div>
            <div className="table-responsive">
                <table className="prof-table">
                    <thead>
                        <tr>
                            <th>Plant Name</th>
                            <th>RITES RIO</th>
                            <th className="text-right">Production (with UoM)</th>
                            <th className="text-right">Acceptance (with UoM)</th>
                            <th className="text-right">Process Rejection (with UoM)</th>
                            <th className="text-right">Process Rej %</th>
                            <th className="text-right">Final Rejection (with UoM)</th>
                            <th className="text-right">Final Rej %</th>
                            <th className="text-right">Total Rej %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockData.map((row, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: '600' }}>{row.plant}</td>
                                <td>{row.rio}</td>
                                <td className="text-right">{row.production.toLocaleString()}</td>
                                <td className="text-right" style={{ color: '#16a34a' }}>{row.acceptance.toLocaleString()}</td>
                                <td className="text-right" style={{ color: '#f59e0b' }}>{row.procRej.toLocaleString()}</td>
                                <td className="text-right">{row.procRejPct}%</td>
                                <td className="text-right" style={{ color: '#ef4444' }}>{row.finalRej.toLocaleString()}</td>
                                <td className="text-right">{row.finalRejPct}%</td>
                                <td className="text-right" style={{ fontWeight: 'bold' }}>{row.totalRejPct}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RailPadMauReport;
