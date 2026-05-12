import React, { useState, useEffect } from 'react';
import './SleeperSummary.css';
import { API_ENDPOINTS, getAuthHeaders, handleResponse } from '../../../services/apiConfig';

const SleeperLifecycle = () => {
    // State for expansions
    const [expandedPo, setExpandedPo] = useState(null);
    const [expandedSr, setExpandedSr] = useState(null);
    const [expandedCall, setExpandedCall] = useState(null);
    const [expandedBatch, setExpandedBatch] = useState(null);

    // API Data State
    const [poData, setPoData] = useState([]);
    const [level2Data, setLevel2Data] = useState({});
    const [level3Data, setLevel3Data] = useState({});
    const [level4Data, setLevel4Data] = useState({});
    const [level5Data, setLevel5Data] = useState({});

    // Date Filters State
    const [startDate, setStartDate] = useState("2025-11-01");
    const [endDate, setEndDate] = useState("2026-05-04");

    const formatDateForApi = (dateString) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    };

    const loadLevel1Data = async (start, end) => {
        const formattedStart = formatDateForApi(start);
        const formattedEnd = formatDateForApi(end);
        const data = await fetchLevel1DataAPI(formattedStart, formattedEnd);
        if (data && data.length > 0) {
            setPoData(data);
        } else {
            setPoData([]);
        }
    };

    useEffect(() => {
        loadLevel1Data(startDate, endDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate]);

    const handleApply = () => {
        loadLevel1Data(startDate, endDate);
    };

    const handleReset = () => {
        setStartDate("2025-11-01");
        setEndDate("2026-05-04");
        loadLevel1Data("2025-11-01", "2026-05-04");
    };

    const togglePo = async (id, poNo) => {
        if (expandedPo === id) {
            setExpandedPo(null);
        } else {
            setExpandedPo(id);
            // Fetch Level 2 data if not already present
            if (poNo && !level2Data[poNo]) {
                const data = await fetchLevel2DataAPI(poNo);
                if (data) {
                    setLevel2Data(prev => ({ ...prev, [poNo]: data }));
                }
            }
        }
    };
    const toggleSr = async (id, poNo, srNo) => {
        if (expandedSr === id) {
            setExpandedSr(null);
        } else {
            setExpandedSr(id);
            // Fetch Level 3 data if not already present
            const key = `${poNo}-${srNo}`;
            if (poNo && srNo && !level3Data[key]) {
                const data = await fetchLevel3DataAPI(poNo, srNo);
                if (data) {
                    setLevel3Data(prev => ({ ...prev, [key]: data }));
                }
            }
        }
    };
    const toggleCall = async (id, callNo) => {
        if (expandedCall === id) {
            setExpandedCall(null);
        } else {
            setExpandedCall(id);
            // Fetch Level 4 data if not already present
            if (callNo && !level4Data[callNo]) {
                const data = await fetchLevel4DataAPI(callNo);
                if (data) {
                    setLevel4Data(prev => ({ ...prev, [callNo]: data }));
                }
            }
        }
    };
    const toggleBatch = async (id, batchNo) => {
        if (expandedBatch === id) {
            setExpandedBatch(null);
        } else {
            setExpandedBatch(id);
            // Fetch Level 5 data if not already present
            const key = `${id}-${batchNo}`;
            if (batchNo && !level5Data[key]) {
                const data = await fetchLevel5DataAPI(id, batchNo);
                if (data) {
                    setLevel5Data(prev => ({ ...prev, [key]: data }));
                }
            }
        }
    };

    return (
        <div className="sleeper-summary-container fade-in">
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', background: '#f0fdf4', padding: '15px', borderRadius: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>FROM</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #bbf7d0', borderRadius: '4px', background: '#ecfdf5', color: '#166534', outline: 'none', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>TO</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #bbf7d0', borderRadius: '4px', background: '#ecfdf5', color: '#166534', outline: 'none', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>ZONE</label>
                    <select style={{ padding: '6px 10px', border: '1px solid #bbf7d0', borderRadius: '4px', background: '#ecfdf5', color: '#166534', outline: 'none', cursor: 'pointer' }}>
                        <option>All Zones</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>RIO</label>
                    <select style={{ padding: '6px 10px', border: '1px solid #bbf7d0', borderRadius: '4px', background: '#ecfdf5', color: '#166534', outline: 'none', cursor: 'pointer' }}>
                        <option>All RITES RIOs</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                    <button onClick={handleApply} style={{ padding: '6px 16px', background: '#166534', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        Apply
                    </button>
                    <button onClick={handleReset} style={{ padding: '6px 16px', background: '#dcfce3', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                        Reset
                    </button>
                </div>
            </div>

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
                                            <button className="expand-icon" onClick={() => togglePo(po.id, po.poNo)}>
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
                                                            {(level2Data[po.poNo] || []).map((sr, idx) => (
                                                                <React.Fragment key={sr.id}>
                                                                    <tr className={expandedSr === sr.id ? 'expanded-row-parent' : ''}>
                                                                        <td className="text-center">
                                                                            <button className="expand-icon" onClick={() => toggleSr(sr.id, po.poNo, sr.poSrNo)}>
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
                                                                            {(level3Data[`${po.poNo}-${sr.poSrNo}`] || []).map((call, cidx) => (
                                                                                                <React.Fragment key={call.id}>
                                                                                                    <tr className={expandedCall === call.id ? 'expanded-row-parent' : ''}>
                                                                                                        <td className="text-center">
                                                                                                            <button className="expand-icon" onClick={() => toggleCall(call.id, call.callNo)}>
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
                                                                                                                            {(level4Data[call.callNo] || []).map((batch, bidx) => (
                                                                                                                                <React.Fragment key={batch.id}>
                                                                                                                                    <tr className={expandedBatch === batch.id ? 'expanded-row-parent' : ''}>
                                                                                                                                        <td className="text-center">
                                                                                                                                            <button className="expand-icon" onClick={() => toggleBatch(batch.id, batch.batchNo)}>
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
                                                                                                                                                            {(level5Data[`${batch.id}-${batch.batchNo}`] || []).map((chk, chidx) => (
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

// --- API Integration Added Below ---
/**
 * Fetches Level 1 data for Sleeper PO Lifecycle Tracking
 * The requested data is passed as a payload to the API
 */
const fetchLevel1DataAPI = async (startDate, endDate) => {
    try {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/level1`);
        // GET requests cannot have a real body, appending payload to URL params
        url.searchParams.append('startDate', startDate);
        url.searchParams.append('endDate', endDate);
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const result = await handleResponse(response);
        
        // Map the backend responseData structure to the frontend format
        if (result && result.responseData) {
            return result.responseData.map(item => ({
                id: item.sno,
                rly: item.rly || 'N/A',
                poNo: item.poNo,
                poDate: item.poDate,
                vendor: item.vendor,
                region: item.region || 'N/A',
                poQty: item.poQty || 0,
                accQty: item.accQty || 0,
                balQty: item.balQty || 0,
                rejPct: item.rejectionPercent || 0
            }));
        }
        return null;
    } catch (error) {
        console.error("Error fetching Level 1 API data:", error);
        return null;
    }
};

/**
 * Fetches Level 2 data (Serial Details) for a specific PO
 */
const fetchLevel2DataAPI = async (poNo) => {
    try {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/level2`);
        url.searchParams.append('poNo', poNo);
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const result = await handleResponse(response);
        
        if (result && result.responseData) {
            return result.responseData.map(item => ({
                id: `${item.poNo}-${item.srNo}`, // Unique ID for React keys
                poSrNo: item.srNo,
                type: item.sleeperType || 'PSC Sleeper (Main Line)',
                consignee: item.consignee,
                dp: item.extDpDate || item.dpDate,
                qty: item.qtyWithUom,
                bal: item.balance,
                ics: item.ics || 0,
                lastIc: item.lastIc || 'N/A',
                procRej: item.procRejPercent,
                finalRej: item.finalRejPercent,
                totalRej: item.totalRejPercent
            }));
        }
        return null;
    } catch (error) {
        console.error("Error fetching Level 2 API data:", error);
        return null;
    }
};

/**
 * Fetches Level 3 data (Inspection Calls) for a specific PO and Serial Number
 */
const fetchLevel3DataAPI = async (poNo, srNo) => {
    try {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/level3`);
        url.searchParams.append('poNo', poNo);
        url.searchParams.append('srNo', srNo);
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const result = await handleResponse(response);
        
        if (result && result.responseData) {
            return result.responseData.map(item => ({
                id: item.sno,
                callNo: item.callNo,
                desDate: item.desDate || 'N/A',
                offered: item.offered,
                accepted: item.accepted,
                rejected: item.rejected,
                rejPct: item.rejectionPercentage,
                icNo: item.icNo || 'Pending',
                balance: (item.offered || 0) - (item.accepted || 0)
            }));
        }
        return null;
    } catch (error) {
        console.error("Error fetching Level 3 API data:", error);
        return null;
    }
};

/**
 * Fetches Level 4 data (Batch Analysis) for a specific Inspection Call Number
 */
const fetchLevel4DataAPI = async (callNo) => {
    try {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/level4`);
        url.searchParams.append('callNo', callNo);
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const result = await handleResponse(response);
        
        if (result && result.responseData) {
            return result.responseData.map(item => ({
                id: item.sno,
                batchNo: item.batchNo,
                dateCasting: item.castingDate,
                mfd: item.totalManufactured,
                mfdType: item.sleeperTypeManufactured,
                rejected: item.rejected,
                passed: item.passed
            }));
        }
        return null;
    } catch (error) {
        console.error("Error fetching Level 4 API data:", error);
        return null;
    }
};

/**
 * Fetches Level 5 data (Batch Checking Details) for a specific Batch
 */
const fetchLevel5DataAPI = async (id, batchId) => {
    try {
        const url = new URL(`${API_ENDPOINTS.SLEEPER_DASHBOARD}/level5BatchInspectionData`);
        url.searchParams.append('id', id);
        url.searchParams.append('batchId', batchId);
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const result = await handleResponse(response);
        
        if (result && result.responseData) {
            return result.responseData.map(item => ({
                id: item.sno,
                dateShift: item.dateShift,
                steam: item.steamCubeStrength,
                rejDem: item.rejectedDemoulding,
                rejVis: item.rejectedVisual,
                rejCrit: item.rejectedCritical,
                rejNonCrit: item.rejectedNonCritical,
                water: item.waterCubeStrength,
                mr: item.mrValue
            }));
        }
        return null;
    } catch (error) {
        console.error("Error fetching Level 5 API data:", error);
        return null;
    }
};

export default SleeperLifecycle;
