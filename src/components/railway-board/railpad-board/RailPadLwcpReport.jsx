import React from 'react';

const RailPadLwcpReport = () => {
    // Filters could be passed from parent
    const mockData = [
        { stage: 'Produced', date: '2024-05-10', qty: 10000, remark: 'Shift A production' },
        { stage: 'Rejection in Process', date: '2024-05-10', qty: 200, remark: 'Porosity detected' },
        { stage: 'Final Inspection', date: '2024-05-12', qty: 9800, remark: 'Cleared in Lot #12' },
    ];

    return (
        <div className="report-content fade-in">
            <div className="sec-title" style={{ color: '#166534', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>Lot Wise Closed Loop Analysis (Rail Pad)</div>
            
            <div className="prof-card mb" style={{ padding: '25px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Manufacturer</label>
                        <select className="prof-search" style={{ width: '100%', borderRadius: '12px', border: '2px solid #10b981', padding: '10px 15px', background: '#fff', fontSize: '14px', fontWeight: '500' }}>
                            <option>PATIL RAIL INFRASTRUCTURE PVT LTD</option>
                            <option>POLYMERS INDIA</option>
                            <option>FLEXI RUBBER</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Plant</label>
                        <select className="prof-search" style={{ width: '100%', borderRadius: '12px', border: '2px solid #10b981', padding: '10px 15px', background: '#fff', fontSize: '14px', fontWeight: '500' }}>
                            <option>PATIL HYDERABAD PLANT 7 Udavada</option>
                            <option>POLYMERS AHMEDABAD PLANT 1</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Lot No.</label>
                        <select className="prof-search" style={{ width: '100%', borderRadius: '12px', border: '2px solid #10b981', padding: '10px 15px', background: '#fff', fontSize: '14px', fontWeight: '500' }}>
                            <option>Select Lot Number</option>
                            <option>LOT/2024/001</option>
                            <option>LOT/2024/002</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                <table className="prof-table">
                    <thead>
                        <tr>
                            <th>Inspection Stage</th>
                            <th>Date</th>
                            <th className="text-right">Quantity (Nos)</th>
                            <th>Remark</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockData.map((row, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: '600' }}>{row.stage}</td>
                                <td>{row.date}</td>
                                <td className="text-right" style={{ fontWeight: 'bold' }}>{row.qty.toLocaleString()}</td>
                                <td style={{ fontSize: '13px', color: '#475569' }}>{row.remark}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RailPadLwcpReport;
