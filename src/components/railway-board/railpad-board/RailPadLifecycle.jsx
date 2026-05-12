import React, { useState } from 'react';

const RailPadLifecycle = () => {
    // State for expansions
    const [expandedPo, setExpandedPo] = useState(null);
    const [expandedSr, setExpandedSr] = useState(null);

    // Mock Level 1 Data (PO Master)
    const [poMasterData] = useState([
        { id: 1, rly: 'NR', poNo: 'RP-2024-001', poDate: '15/01/2024', vendor: 'Polymers India', location: 'Ahmedabad', rio: 'WRIO', totalQty: 500000, accQty: 420000, balance: 80000 },
        { id: 2, rly: 'WR', poNo: 'RP-2024-005', poDate: '10/02/2024', vendor: 'Flexi Rubber', location: 'Pune', rio: 'WRIO', totalQty: 350000, accQty: 150000, balance: 200000 },
        { id: 3, rly: 'SR', poNo: 'RP-2024-012', poDate: '05/03/2024', vendor: 'Durable Pads', location: 'Chennai', rio: 'SRIO', totalQty: 600000, accQty: 0, balance: 600000 },
    ]);

    // Mock Level 2 Data (PO Serial/Specific PO Details)
    const level2Data = {
        'RP-2024-001': [
            {
                id: '2024-001-1',
                srNo: '1',
                type: '6mm GFN Rail Pad',
                consignee: 'Sr. DMM/NDLS',
                dp: '31/12/2024',
                qty: '500,000 Nos.',
                bal: '80,000',
                ics: 2,
                procRej: 1.5,
                finalRej: 0.8,
                totalRej: 2.3
            }
        ]
    };

    // Mock Level 3 Data (Inspection Calls)
    const level3Data = {
        '2024-001-1': [
            { id: 'C1', no: 'RP/NR/24/001', offered: 100000, accepted: 98000, rejected: 2000, rejPct: 2, balance: 2000 },
            { id: 'C2', no: 'RP/NR/24/015', offered: 150000, accepted: 145000, rejected: 5000, rejPct: 3.3, balance: 5000 }
        ]
    };

    const togglePo = (id) => {
        setExpandedPo(expandedPo === id ? null : id);
        setExpandedSr(null); // Close nested levels when parent closes
    };

    const toggleSr = (id) => {
        setExpandedSr(expandedSr === id ? null : id);
    };

    return (
        <div className="railpad-lifecycle-container fade-in">
            <div className="prof-card mb">
                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Rail Pad PO Lifecycle Tracking</span>
                    <input type="text" placeholder="Search PO, Vendor..." className="prof-search" style={{ height: '36px', fontSize: '13px' }} />
                </div>

                <div className="table-responsive">
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>Rly Short Name</th>
                                <th>PO Number</th>
                                <th>PO Date</th>
                                <th>Vendor & Plant Location</th>
                                <th>RITES RIO</th>
                                <th className="text-right">Total PO Qty</th>
                                <th className="text-right">Accepted Qty</th>
                                <th className="text-right">Overall PO Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {poMasterData.map((po) => (
                                <React.Fragment key={po.id}>
                                    <tr className={expandedPo === po.id ? 'expanded-row-parent' : ''}>
                                        <td className="text-center">
                                            <button className="expand-icon" onClick={() => togglePo(po.id)}>
                                                {expandedPo === po.id ? '−' : '+'}
                                            </button>
                                        </td>
                                        <td><strong>{po.rly}</strong></td>
                                        <td style={{ color: '#1e40af', fontWeight: 'bold' }}>{po.poNo}</td>
                                        <td>{po.poDate}</td>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{po.vendor}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{po.location}</div>
                                        </td>
                                        <td>{po.rio}</td>
                                        <td className="text-right">{po.totalQty.toLocaleString()}</td>
                                        <td className="text-right text-emerald-600 font-bold">{po.accQty.toLocaleString()}</td>
                                        <td className="text-right text-red-600">{po.balance.toLocaleString()}</td>
                                    </tr>

                                    {/* Level 2 Expansion */}
                                    {expandedPo === po.id && (
                                        <tr className="detail-row">
                                            <td colSpan="9">
                                                <div className="nested-table-wrapper Level-2-wrapper animate-up">
                                                    <div className="level-label" style={{ background: '#f0f9ff', color: '#0369a1', padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>
                                                        Level 2: Specific PO Drill-Down
                                                    </div>
                                                    <table className="prof-table nested-table">
                                                        <thead>
                                                            <tr style={{ background: '#f8fafc' }}>
                                                                <th style={{ width: '40px' }}></th>
                                                                <th>PO Sr.No.</th>
                                                                <th>Rail Pad Type</th>
                                                                <th>Consignee</th>
                                                                <th>DP Date / Ext Date</th>
                                                                <th className="text-right">PO Qty (UoM)</th>
                                                                <th className="text-right">Balance</th>
                                                                <th className="text-right">ICs</th>
                                                                <th className="text-right">Proc. Rej %</th>
                                                                <th className="text-right">Final Rej %</th>
                                                                <th className="text-right">Total Rej %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(level2Data[po.poNo] || []).map((sr) => (
                                                                <React.Fragment key={sr.id}>
                                                                    <tr className={expandedSr === sr.id ? 'expanded-row-parent' : ''}>
                                                                        <td className="text-center">
                                                                            <button className="expand-icon" onClick={() => toggleSr(sr.id)}>
                                                                                {expandedSr === sr.id ? '−' : '+'}
                                                                            </button>
                                                                        </td>
                                                                        <td>{sr.srNo}</td>
                                                                        <td className="font-bold">{sr.type}</td>
                                                                        <td>{sr.consignee}</td>
                                                                        <td>{sr.dp}</td>
                                                                        <td className="text-right">{sr.qty}</td>
                                                                        <td className="text-right">{sr.bal}</td>
                                                                        <td className="text-right">{sr.ics}</td>
                                                                        <td className="text-right">{sr.procRej}%</td>
                                                                        <td className="text-right">{sr.finalRej}%</td>
                                                                        <td className="text-right font-bold text-red-600">{sr.totalRej}%</td>
                                                                    </tr>

                                                                    {/* Level 3 Expansion */}
                                                                    {expandedSr === sr.id && (
                                                                        <tr className="detail-row">
                                                                            <td colSpan="11">
                                                                                <div className="nested-table-wrapper level-3 animate-up">
                                                                                    <div className="level-label" style={{ background: '#ecfdf5', color: '#065f46', padding: '8px 15px', fontWeight: 'bold', fontSize: '11px' }}>
                                                                                        Level 3: Inspection Call Details
                                                                                    </div>
                                                                                    <table className="prof-table nested-table">
                                                                                        <thead>
                                                                                            <tr style={{ background: '#f8fafc' }}>
                                                                                                <th>S.No.</th>
                                                                                                <th>Inspection Call No.</th>
                                                                                                <th className="text-right">Offered Qty</th>
                                                                                                <th className="text-right">Accepted Qty</th>
                                                                                                <th className="text-right">Rejected Qty</th>
                                                                                                <th className="text-right">Rejection %</th>
                                                                                                <th className="text-right">Balance Qty</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {(level3Data[sr.id] || []).map((call, cidx) => (
                                                                                                <tr key={call.id}>
                                                                                                    <td>{cidx + 1}</td>
                                                                                                    <td className="font-bold text-blue-700">{call.no}</td>
                                                                                                    <td className="text-right">{call.offered.toLocaleString()}</td>
                                                                                                    <td className="text-right text-emerald-600 font-bold">{call.accepted.toLocaleString()}</td>
                                                                                                    <td className="text-right text-red-500">{call.rejected.toLocaleString()}</td>
                                                                                                    <td className="text-right">
                                                                                                        <span className="prof-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{call.rejPct}%</span>
                                                                                                    </td>
                                                                                                    <td className="text-right">{call.balance.toLocaleString()}</td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RailPadLifecycle;
