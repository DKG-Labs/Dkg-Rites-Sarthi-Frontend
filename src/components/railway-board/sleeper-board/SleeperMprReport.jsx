import React from 'react';
import './SleeperSummary.css';

const SleeperMprReport = () => {
    // Mock Data
    const mprData = [
        { id: 1, rly: 'NR', poNo: 'PO-2023-SLE-001', manufacturer: 'Patil Industry - Kargi Road', poQty: 120000, dispatchedMonth: 5000, totalDispatched: 95000, balance: 25000 },
        { id: 2, rly: 'WR', poNo: 'PO-2023-SLE-042', manufacturer: 'Patil Industry - Wadiyaram', poQty: 85000, dispatchedMonth: 4200, totalDispatched: 82000, balance: 3000 },
        { id: 3, rly: 'SR', poNo: 'PO-2024-SLE-015', manufacturer: 'Concrete Sleepers India', poQty: 60000, dispatchedMonth: 3500, totalDispatched: 15000, balance: 45000 },
        { id: 4, rly: 'NCR', poNo: 'PO-2024-SLE-088', manufacturer: 'Dayal Sleepers Ltd.', poQty: 100000, dispatchedMonth: 6000, totalDispatched: 40000, balance: 60000 },
        { id: 5, rly: 'ER', poNo: 'PO-2023-SLE-033', manufacturer: 'Eastern PSC Units', poQty: 90000, dispatchedMonth: 0, totalDispatched: 90000, balance: 0 },
    ];

    return (
        <div className="sleeper-report-container animate-up">
            <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span>Monthly Progress Report (Sleeper)</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-export" style={{ padding: '8px 16px', background: '#1e293b', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                        📥 Export Excel
                    </button>
                    <input type="text" placeholder="Search PO, Rly..." className="prof-search" style={{ height: '36px', fontSize: '13px' }} />
                </div>
            </div>

            <div className="table-responsive prof-card">
                <table className="prof-table">
                    <thead>
                        <tr>
                            <th>S.NO.</th>
                            <th>RLY</th>
                            <th>PO NUMBER</th>
                            <th>MANUFACTURER</th>
                            <th className="text-right">PO QTY</th>
                            <th className="text-right">DISPATCHED (MONTH)</th>
                            <th className="text-right">TOTAL DISPATCHED</th>
                            <th className="text-right">BALANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mprData.map((row, idx) => (
                            <tr key={row.id} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                <td>{idx + 1}</td>
                                <td><span className="prof-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{row.rly}</span></td>
                                <td className="font-bold text-blue-700">{row.poNo}</td>
                                <td>{row.manufacturer}</td>
                                <td className="text-right">{row.poQty.toLocaleString()}</td>
                                <td className="text-right text-emerald-600 font-medium">+{row.dispatchedMonth.toLocaleString()}</td>
                                <td className="text-right font-bold">{row.totalDispatched.toLocaleString()}</td>
                                <td className="text-right">
                                    <span
                                        className="font-bold"
                                        style={{ color: row.balance === 0 ? '#10b981' : '#64748b' }}
                                    >
                                        {row.balance.toLocaleString()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 p-4 prof-card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div className="text-center">
                        <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total PO Qty</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                            {mprData.reduce((acc, curr) => acc + curr.poQty, 0).toLocaleString()}
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: '#cbd5e1' }}></div>
                    <div className="text-center">
                        <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Dispatched</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                            {mprData.reduce((acc, curr) => acc + curr.totalDispatched, 0).toLocaleString()}
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: '#cbd5e1' }}></div>
                    <div className="text-center">
                        <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Balance</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                            {mprData.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SleeperMprReport;
