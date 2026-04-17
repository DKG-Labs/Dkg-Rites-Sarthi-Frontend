import React, { useState } from 'react';
import './SleeperSummary.css';

const SleeperLifecycle = () => {
    // State for expansions
    const [expandedPo, setExpandedPo] = useState(null);
    const [expandedSr, setExpandedSr] = useState(null);
    const [expandedCall, setExpandedCall] = useState(null);
    const [expandedBatch, setExpandedBatch] = useState(null);

    // Mock Data
    const poData = [
        { id: 1, rly: 'NR', poNo: 'PO-2023-SLE-001', poDate: '2023-01-10', vendor: 'Concrete India', region: 'North', poQty: 120000, accQty: 95000, balQty: 25000, rejPct: 1.8 },
        { id: 2, rly: 'WR', poNo: 'PO-2023-SLE-042', poDate: '2023-03-22', vendor: 'Western Sleepers', region: 'West', poQty: 85000, accQty: 82000, balQty: 3000, rejPct: 0.9 },
    ];

    const srData = [
        { id: '101', poSrNo: '1', type: 'PSC Sleeper (Main Line)', consignee: 'SSE/PW/DLI', dp: '2024-12-31', qty: '60,000 Nos', bal: '10,000', ics: 12, lastIc: 'IC-9982', procRej: 1.2, finalRej: 0.5, totalRej: 1.7 },
        { id: '102', poSrNo: '2', type: 'PSC Sleeper (Bridge)', consignee: 'SSE/PW/UMB', dp: '2025-06-30', qty: '60,000 Nos', bal: '15,000', ics: 8, lastIc: 'IC-9541', procRej: 1.5, finalRej: 0.7, totalRej: 2.2 },
    ];

    const callData = [
        { id: 'CAL-001', callNo: 'C-2024-001', desDate: '2024-05-15', offered: 5000, accepted: 4850, balance: 150, rejected: 150, rejPct: 3.0, icNo: 'IC-9982' },
        { id: 'CAL-002', callNo: 'C-2024-005', desDate: '2024-06-20', offered: 4000, accepted: 3920, balance: 80, rejected: 80, rejPct: 2.0, icNo: 'IC-9995' },
    ];

    const batchData = [
        { id: 'BAT-101', batchNo: 'B-24-05-A', dateCasting: '2024-05-01', mfd: 500, mfdType: 500, rejected: 10, passed: 490 },
        { id: 'BAT-102', batchNo: 'B-24-05-B', dateCasting: '2024-05-02', mfd: 600, mfdType: 600, rejected: 15, passed: 585 },
    ];

    const batchCheckingData = [
        { id: 'CHK-001', dateShift: '2024-05-01 (Day)', steam: '45.2', rejDem: 2, rejVis: 3, rejCrit: 1, rejNonCrit: 2, water: '58.5', mr: '4.8' },
        { id: 'CHK-002', dateShift: '2024-05-01 (Night)', steam: '44.8', rejDem: 1, rejVis: 2, rejCrit: 0, rejNonCrit: 1, water: '57.9', mr: '4.7' },
    ];

    const togglePo = (id) => setExpandedPo(expandedPo === id ? null : id);
    const toggleSr = (id) => setExpandedSr(expandedSr === id ? null : id);
    const toggleCall = (id) => setExpandedCall(expandedCall === id ? null : id);
    const toggleBatch = (id) => setExpandedBatch(expandedBatch === id ? null : id);

    return (
        <div className="sleeper-summary-container fade-in">
            <div className="prof-card mb">
                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Sleeper PO Lifecycle Tracking</span>
                    <input type="text" placeholder="Search PO, Vendor..." className="prof-search" style={{ height: '36px', fontSize: '13px' }} />
                </div>

                <div className="table-responsive">
                    <table className="prof-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th style={{ width: '40px' }}>#</th>
                                <th>RLY</th>
                                <th>PO NO.</th>
                                <th>PO DATE</th>
                                <th>VENDOR</th>
                                <th>REGION</th>
                                <th className="text-right">PO QTY</th>
                                <th className="text-right">ACC QTY</th>
                                <th className="text-right">BAL QTY</th>
                                <th className="text-right">REJ %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {poData.map((po) => (
                                <React.Fragment key={po.id}>
                                    <tr className={expandedPo === po.id ? 'expanded-row-parent' : ''}>
                                        <td className="text-center">
                                            <button className="expand-icon" onClick={() => togglePo(po.id)}>
                                                {expandedPo === po.id ? '−' : '+'}
                                            </button>
                                        </td>
                                        <td>{po.id}</td>
                                        <td><strong>{po.rly}</strong></td>
                                        <td>{po.poNo}</td>
                                        <td>{po.poDate}</td>
                                        <td>{po.vendor}</td>
                                        <td>{po.region}</td>
                                        <td className="text-right">{po.poQty.toLocaleString()}</td>
                                        <td className="text-right text-emerald-600 font-bold">{po.accQty.toLocaleString()}</td>
                                        <td className="text-right">{po.balQty.toLocaleString()}</td>
                                        <td className="text-right"><span className="prof-badge" style={{ background: '#fff7ed', color: '#9a3412' }}>{po.rejPct}%</span></td>
                                    </tr>
                                    {expandedPo === po.id && (
                                        <tr className="detail-row">
                                            <td colSpan="11">
                                                <div className="nested-table-wrapper Level-2-wrapper animate-up">
                                                    <div className="level-label">Level 2: PO Serial Details</div>
                                                    <table className="data-table nested-table level-2-table">
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: '40px' }}></th>
                                                                <th>S.NO.</th>
                                                                <th>RLY PO SR.NO.</th>
                                                                <th>SLEEPER TYPE</th>
                                                                <th>CONSIGNEE</th>
                                                                <th>DP DATE / EXT DP DATE</th>
                                                                <th className="text-right">QTY (WITH UOM)</th>
                                                                <th className="text-right">BAL</th>
                                                                <th className="text-right">ICs</th>
                                                                <th>LAST IC</th>
                                                                <th className="text-right">PROC. REJ %</th>
                                                                <th className="text-right">FINAL REJ %</th>
                                                                <th className="text-right">TOTAL REJ %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {srData.map((sr, idx) => (
                                                                <React.Fragment key={sr.id}>
                                                                    <tr className={expandedSr === sr.id ? 'expanded-row-parent' : ''}>
                                                                        <td className="text-center">
                                                                            <button className="expand-icon" onClick={() => toggleSr(sr.id)}>
                                                                                {expandedSr === sr.id ? '−' : '+'}
                                                                            </button>
                                                                        </td>
                                                                        <td>{idx + 1}</td>
                                                                        <td>{sr.poSrNo}</td>
                                                                        <td className="font-bold">{sr.type}</td>
                                                                        <td>{sr.consignee}</td>
                                                                        <td>{sr.dp}</td>
                                                                        <td className="text-right">{sr.qty}</td>
                                                                        <td className="text-right">{sr.bal}</td>
                                                                        <td className="text-right">{sr.ics}</td>
                                                                        <td>{sr.lastIc}</td>
                                                                        <td className="text-right">{sr.procRej}%</td>
                                                                        <td className="text-right">{sr.finalRej}%</td>
                                                                        <td className="text-right font-bold text-red-600">{sr.totalRej}%</td>
                                                                    </tr>
                                                                    {expandedSr === sr.id && (
                                                                        <tr className="detail-row">
                                                                            <td colSpan="13">
                                                                                <div className="nested-table-wrapper level-3 animate-up">
                                                                                    <div className="level-label">Level 3: Inspection Calls</div>
                                                                                    <table className="data-table nested-table level-3-table">
                                                                                        <thead>
                                                                                            <tr>
                                                                                                <th style={{ width: '40px' }}></th>
                                                                                                <th>S.NO.</th>
                                                                                                <th>INSPECTION CALL NO.</th>
                                                                                                <th>DES. DATE</th>
                                                                                                <th className="text-right">OFFERED</th>
                                                                                                <th className="text-right">ACCEPTED</th>
                                                                                                <th className="text-right">BALANCE</th>
                                                                                                <th className="text-right">REJECTED</th>
                                                                                                <th className="text-right">% REJECTION</th>
                                                                                                <th>IC NO.</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {callData.map((call, cidx) => (
                                                                                                <React.Fragment key={call.id}>
                                                                                                    <tr className={expandedCall === call.id ? 'expanded-row-parent' : ''}>
                                                                                                        <td className="text-center">
                                                                                                            <button className="expand-icon" onClick={() => toggleCall(call.id)}>
                                                                                                                {expandedCall === call.id ? '−' : '+'}
                                                                                                            </button>
                                                                                                        </td>
                                                                                                        <td>{cidx + 1}</td>
                                                                                                        <td className="font-bold text-blue-700">{call.callNo}</td>
                                                                                                        <td>{call.desDate}</td>
                                                                                                        <td className="text-right">{call.offered}</td>
                                                                                                        <td className="text-right text-emerald-600 font-bold">{call.accepted}</td>
                                                                                                        <td className="text-right">{call.balance}</td>
                                                                                                        <td className="text-right text-red-500">{call.rejected}</td>
                                                                                                        <td className="text-right"><span className="prof-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{call.rejPct}%</span></td>
                                                                                                        <td>{call.icNo}</td>
                                                                                                    </tr>
                                                                                                    {expandedCall === call.id && (
                                                                                                        <tr className="detail-row">
                                                                                                            <td colSpan="10">
                                                                                                                <div className="nested-table-wrapper level-4 animate-up" style={{ borderLeftColor: '#64748b' }}>
                                                                                                                    <div className="level-label">Level 4: Batch Analysis</div>
                                                                                                                    <table className="data-table nested-table level-4-table">
                                                                                                                        <thead>
                                                                                                                            <tr>
                                                                                                                                <th style={{ width: '40px' }}></th>
                                                                                                                                <th>S.NO.</th>
                                                                                                                                <th>BATCH NO.</th>
                                                                                                                                <th>DATE OF CASTING</th>
                                                                                                                                <th className="text-right">MFD</th>
                                                                                                                                <th className="text-right">MFD (TYPE)</th>
                                                                                                                                <th className="text-right">REJECTED</th>
                                                                                                                                <th className="text-right">PASSED</th>
                                                                                                                            </tr>
                                                                                                                        </thead>
                                                                                                                        <tbody>
                                                                                                                            {batchData.map((batch, bidx) => (
                                                                                                                                <React.Fragment key={batch.id}>
                                                                                                                                    <tr className={expandedBatch === batch.id ? 'expanded-row-parent' : ''}>
                                                                                                                                        <td className="text-center">
                                                                                                                                            <button className="expand-icon" onClick={() => toggleBatch(batch.id)}>
                                                                                                                                                {expandedBatch === batch.id ? '−' : '+'}
                                                                                                                                            </button>
                                                                                                                                        </td>
                                                                                                                                        <td>{bidx + 1}</td>
                                                                                                                                        <td className="font-bold text-slate-700">{batch.batchNo}</td>
                                                                                                                                        <td>{batch.dateCasting}</td>
                                                                                                                                        <td className="text-right">{batch.mfd}</td>
                                                                                                                                        <td className="text-right">{batch.mfdType}</td>
                                                                                                                                        <td className="text-right text-red-500">{batch.rejected}</td>
                                                                                                                                        <td className="text-right text-emerald-600 font-bold">{batch.passed}</td>
                                                                                                                                    </tr>
                                                                                                                                    {expandedBatch === batch.id && (
                                                                                                                                        <tr className="detail-row">
                                                                                                                                            <td colSpan="8">
                                                                                                                                                <div className="nested-table-wrapper level-5 animate-up" style={{ borderLeft: '5px solid #1e293b', background: '#f8fafc' }}>
                                                                                                                                                    <div className="level-label" style={{ color: '#1e293b' }}>Level 5: Batch Checking Details</div>
                                                                                                                                                    <table className="data-table nested-table level-5-table">
                                                                                                                                                        <thead>
                                                                                                                                                            <tr style={{ background: '#1e293b' }}>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>S.NO.</th>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>DATE & SHIFT</th>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>STEAM CUBE STR.</th>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>REJ. DEMOULDING</th>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>REJ. VISUAL</th>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>REJ. CRITICAL</th>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>REJ. NON-CRIT</th>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>WATER CUBE STR.</th>
                                                                                                                                                                <th style={{ background: '#1e293b', color: '#fff' }}>M.R.</th>
                                                                                                                                                            </tr>
                                                                                                                                                        </thead>
                                                                                                                                                        <tbody>
                                                                                                                                                            {batchCheckingData.map((chk, chidx) => (
                                                                                                                                                                <tr key={chk.id} className={chidx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                                                                                                                                    <td>{chidx + 1}</td>
                                                                                                                                                                    <td className="font-bold">{chk.dateShift}</td>
                                                                                                                                                                    <td>{chk.steam} MPa</td>
                                                                                                                                                                    <td className="text-right text-red-400">{chk.rejDem}</td>
                                                                                                                                                                    <td className="text-right text-red-400">{chk.rejVis}</td>
                                                                                                                                                                    <td className="text-right text-red-400">{chk.rejCrit}</td>
                                                                                                                                                                    <td className="text-right text-red-400">{chk.rejNonCrit}</td>
                                                                                                                                                                    <td className="font-bold text-blue-600">{chk.water} MPa</td>
                                                                                                                                                                    <td className="font-bold text-emerald-600">{chk.mr}</td>
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

export default SleeperLifecycle;
