import React from 'react';

const RailPadMprReport = () => {
    const mockData = [
        { rly: 'NR', poNo: 'RP-2024-001', manufacturer: 'Polymers India', poQty: 500000, monthlyDisp: 45000, totalDisp: 420000, balance: 80000 },
        { rly: 'WR', poNo: 'RP-2024-005', manufacturer: 'Flexi Rubber', poQty: 350000, monthlyDisp: 28000, totalDisp: 150000, balance: 200000 },
        { rly: 'SR', poNo: 'RP-2024-012', manufacturer: 'Durable Pads', poQty: 600000, monthlyDisp: 0, totalDisp: 0, balance: 600000 },
    ];

    return (
        <div className="report-content fade-in">
            <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>Monthly Progress Report (MPR) - Rail Pad</div>
            <div className="table-responsive">
                <table className="prof-table">
                    <thead>
                        <tr>
                            <th>Rly - PO Number</th>
                            <th>Manufacturer</th>
                            <th className="text-right">PO Qty</th>
                            <th className="text-right">Dispatched (Monthly)</th>
                            <th className="text-right">Total Dispatched</th>
                            <th className="text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockData.map((row, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: '600' }}>{row.rly} - {row.poNo}</td>
                                <td>{row.manufacturer}</td>
                                <td className="text-right">{row.poQty.toLocaleString()}</td>
                                <td className="text-right" style={{ color: '#0369a1', fontWeight: 'bold' }}>{row.monthlyDisp.toLocaleString()}</td>
                                <td className="text-right" style={{ color: '#16a34a', fontWeight: 'bold' }}>{row.totalDisp.toLocaleString()}</td>
                                <td className="text-right" style={{ color: '#dc2626' }}>{row.balance.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RailPadMprReport;
