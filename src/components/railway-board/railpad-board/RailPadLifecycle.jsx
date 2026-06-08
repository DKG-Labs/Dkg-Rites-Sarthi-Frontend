import React, { useState, useEffect } from 'react';
import reportService from '../../../services/reportService';
import Pagination from '../../Pagination';

const RailPadLifecycle = () => {
    // State for expansions
    const [expandedPo, setExpandedPo] = useState(null);
    const [expandedSr, setExpandedSr] = useState(null);

    // States for live data
    const [poMasterData, setPoMasterData] = useState([]);
    const [level2Data, setLevel2Data] = useState({});
    const [level3Data, setLevel3Data] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingLevel2, setLoadingLevel2] = useState({});
    const [loadingLevel3, setLoadingLevel3] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Fetch Level 1 data on mount
    useEffect(() => {
        const fetchLevel1 = async () => {
            try {
                setLoading(true);
                const res = await reportService.getRailPadLevel1Report();
                const data = res && res.responseStatus ? res.responseData : res;
                if (Array.isArray(data)) {
                    setPoMasterData(data);
                } else if (res && res.success && res.data) {
                    setPoMasterData(res.data);
                }
            } catch (err) {
                console.error("Error fetching Level 1 Rail Pad PO Life Cycle data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLevel1();
    }, []);

    // Fetch Level 2 data on PO expansion
    const togglePo = async (poNo, id) => {
        if (expandedPo === id) {
            setExpandedPo(null);
            setExpandedSr(null); // Close nested levels when parent closes
        } else {
            setExpandedPo(id);
            setExpandedSr(null);
            if (!level2Data[poNo]) {
                try {
                    setLoadingLevel2(prev => ({ ...prev, [poNo]: true }));
                    const res = await reportService.getRailPadLevel2Report(poNo);
                    const data = res && res.responseStatus ? res.responseData : res;
                    if (Array.isArray(data)) {
                        setLevel2Data(prev => ({ ...prev, [poNo]: data }));
                    } else if (res && res.success && res.data) {
                        setLevel2Data(prev => ({ ...prev, [poNo]: res.data }));
                    }
                } catch (err) {
                    console.error("Error fetching Level 2 Rail Pad PO data:", err);
                } finally {
                    setLoadingLevel2(prev => ({ ...prev, [poNo]: false }));
                }
            }
        }
    };

    // Fetch Level 3 data on Serial expansion
    const toggleSr = async (poNo, srNo) => {
        const srKey = `${poNo}-${srNo}`;
        if (expandedSr === srKey) {
            setExpandedSr(null);
        } else {
            setExpandedSr(srKey);
            if (!level3Data[srKey]) {
                try {
                    setLoadingLevel3(prev => ({ ...prev, [srKey]: true }));
                    const res = await reportService.getRailPadLevel3Report(poNo, srNo);
                    const data = res && res.responseStatus ? res.responseData : res;
                    if (Array.isArray(data)) {
                        setLevel3Data(prev => ({ ...prev, [srKey]: data }));
                    } else if (res && res.success && res.data) {
                        setLevel3Data(prev => ({ ...prev, [srKey]: res.data }));
                    }
                } catch (err) {
                    console.error("Error fetching Level 3 Rail Pad PO data:", err);
                } finally {
                    setLoadingLevel3(prev => ({ ...prev, [srKey]: false }));
                }
            }
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateStr;
        }
    };

    const filteredPoMasterData = poMasterData.filter(po => 
        (po.poNo && po.poNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (po.vendor && po.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (po.rly && po.rly.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (po.railPadType && po.railPadType.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Reset page on search change
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery]);

    const start = currentPage * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredPoMasterData.length);
    const totalPages = Math.ceil(filteredPoMasterData.length / rowsPerPage);
    const paginatedPoList = filteredPoMasterData.slice(start, end);

    return (
        <div className="railpad-lifecycle-container fade-in">
            <div className="prof-card mb">
                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Rail Pad PO Lifecycle Tracking</span>
                    <input 
                        type="text" 
                        placeholder="Search PO, Vendor, Type..." 
                        className="prof-search" 
                        style={{ height: '36px', fontSize: '13px' }} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="table-responsive">
                    {loading ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            Loading live PO data...
                        </div>
                    ) : (
                        <>
                            <table className="prof-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th>Rly Short Name</th>
                                    <th>PO Number</th>
                                    <th>PO Date</th>
                                    <th>Rail Pad Type</th>
                                    <th>Vendor</th>
                                    <th>RITES RIO</th>
                                    <th className="text-right">Total PO Qty</th>
                                    <th className="text-right">Accepted Qty</th>
                                    <th className="text-right">Overall PO Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPoMasterData.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center" style={{ padding: '20px', color: '#64748b' }}>
                                            No PO records found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPoList.map((po, index) => {
                                        const isExpanded = expandedPo === po.poNo;
                                        const globalIdx = (currentPage * rowsPerPage) + index;
                                        const rowClass = (globalIdx % 2 === 0) ? 'row-odd' : 'row-even';
                                        return (
                                            <React.Fragment key={po.poNo}>
                                                <tr className={`${rowClass} ${isExpanded ? 'expanded-row-parent' : ''}`}>
                                                    <td className="text-center">
                                                        <button className="expand-icon" onClick={() => togglePo(po.poNo, po.poNo)}>
                                                            {isExpanded ? '−' : '+'}
                                                        </button>
                                                    </td>
                                                    <td><strong>{po.rly}</strong></td>
                                                    <td style={{ color: '#1e40af', fontWeight: 'bold' }}>{po.poNo}</td>
                                                    <td>{formatDate(po.poDate)}</td>
                                                    <td style={{ fontSize: '12px', color: '#334155', fontWeight: '500' }}>{po.railPadType || '-'}</td>
                                                    <td>
                                                        <div style={{ fontWeight: '600' }}>{po.vendor}</div>
                                                    </td>
                                                    <td>{po.rio}</td>
                                                    <td className="text-right">{po.totalQty ? po.totalQty.toLocaleString() : '0'}</td>
                                                    <td className="text-right text-emerald-600 font-bold">{po.acceptedQty ? po.acceptedQty.toLocaleString() : '0'}</td>
                                                    <td className="text-right text-red-600">{po.overallPoBalance ? po.overallPoBalance.toLocaleString() : '0'}</td>
                                                </tr>

                                            {/* Level 2 Expansion */}
                                            {expandedPo === po.poNo && (
                                                <tr className="detail-row">
                                                    <td colSpan="10">
                                                        <div className="nested-table-wrapper Level-2-wrapper animate-up">
                                                            <div className="level-label" style={{ background: '#f0f9ff', color: '#0369a1', padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>
                                                                Level 2: Specific PO Drill-Down
                                                            </div>
                                                            {loadingLevel2[po.poNo] ? (
                                                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                                                    Loading PO items...
                                                                </div>
                                                            ) : (
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
                                                                        {(level2Data[po.poNo] || []).length === 0 ? (
                                                                            <tr>
                                                                                <td colSpan="11" className="text-center" style={{ padding: '15px', color: '#64748b' }}>
                                                                                    No items found for this PO
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            (level2Data[po.poNo] || []).map((sr, idx2) => {
                                                                                const srKey = `${po.poNo}-${sr.srNo}`;
                                                                                const isSrExpanded = expandedSr === srKey;
                                                                                const srRowClass = (idx2 % 2 === 0) ? 'row-odd' : 'row-even';
                                                                                return (
                                                                                    <React.Fragment key={sr.srNo}>
                                                                                        <tr className={`${srRowClass} ${isSrExpanded ? 'expanded-row-parent' : ''}`}>
                                                                                            <td className="text-center">
                                                                                                <button className="expand-icon" onClick={() => toggleSr(po.poNo, sr.srNo)}>
                                                                                                    {expandedSr === srKey ? '−' : '+'}
                                                                                                </button>
                                                                                            </td>
                                                                                            <td>{sr.srNo}</td>
                                                                                            <td className="font-bold">{sr.railPadType}</td>
                                                                                            <td>{sr.consignee || '-'}</td>
                                                                                            <td>
                                                                                                {formatDate(sr.originalDpDate)}
                                                                                                {sr.extendedDpDate && ` / ${formatDate(sr.extendedDpDate)}`}
                                                                                            </td>
                                                                                            <td className="text-right">{sr.poSrNoQty ? sr.poSrNoQty.toLocaleString() : '0'} Nos.</td>
                                                                                            <td className="text-right">{sr.balanceQty ? sr.balanceQty.toLocaleString() : '0'}</td>
                                                                                            <td className="text-right">{sr.noOfIcs}</td>
                                                                                            <td className="text-right">{sr.processRejectionPercentage !== null ? `${sr.processRejectionPercentage}%` : '-'}</td>
                                                                                            <td className="text-right">{sr.finalRejectionPercentage !== null ? `${sr.finalRejectionPercentage}%` : '-'}</td>
                                                                                            <td className="text-right font-bold text-red-600">{sr.totalRejectionPercentage !== null ? `${sr.totalRejectionPercentage}%` : '-'}</td>
                                                                                        </tr>

                                                                                        {/* Level 3 Expansion */}
                                                                                        {expandedSr === srKey && (
                                                                                            <tr className="detail-row">
                                                                                                <td colSpan="11">
                                                                                                    <div className="nested-table-wrapper level-3 animate-up">
                                                                                                        <div className="level-label" style={{ background: '#ecfdf5', color: '#065f46', padding: '8px 15px', fontWeight: 'bold', fontSize: '11px' }}>
                                                                                                            Level 3: Inspection Call Details
                                                                                                        </div>
                                                                                                        {loadingLevel3[srKey] ? (
                                                                                                            <div style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>
                                                                                                                Loading call details...
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <table className="prof-table nested-table">
                                                                                                                <thead>
                                                                                                                    <tr style={{ background: '#f8fafc' }}>
                                                                                                                        <th>S.No.</th>
                                                                                                                        <th>Inspection Call No.</th>
                                                                                                                        <th className="text-right">Offered Qty</th>
                                                                                                                        <th className="text-right">Accepted Qty</th>
                                                                                                                        <th className="text-right">Rejected Qty</th>
                                                                                                                        <th className="text-right">Rejection %</th>
                                                                                                                    </tr>
                                                                                                                </thead>
                                                                                                                <tbody>
                                                                                                                    {(level3Data[srKey] || []).length === 0 ? (
                                                                                                                        <tr>
                                                                                                                            <td colSpan="6" className="text-center" style={{ padding: '10px', color: '#64748b' }}>
                                                                                                                                No call details found
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    ) : (
                                                                                                                        (level3Data[srKey] || []).map((call, cidx) => {
                                                                                                                            const callRowClass = (cidx % 2 === 0) ? 'row-odd' : 'row-even';
                                                                                                                            return (
                                                                                                                                <tr key={call.callNo} className={callRowClass}>
                                                                                                                                    <td>{cidx + 1}</td>
                                                                                                                                    <td className="font-bold text-blue-700">{call.callNo}</td>
                                                                                                                                    <td className="text-right">{call.offeredQty ? call.offeredQty.toLocaleString() : '0'}</td>
                                                                                                                                    <td className="text-right text-emerald-600 font-bold">{call.acceptedQty ? call.acceptedQty.toLocaleString() : '0'}</td>
                                                                                                                                    <td className="text-right text-red-500">{call.rejectedQty ? call.rejectedQty.toLocaleString() : '0'}</td>
                                                                                                                                    <td className="text-right">
                                                                                                                                        <span className="prof-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{call.rejectionPercentage}%</span>
                                                                                                                                    </td>
                                                                                                                                </tr>
                                                                                                                            );
                                                                                                                        })
                                                                                                                    )}
                                                                                                                </tbody>
                                                                                                            </table>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </td>
                                                                                            </tr>
                                                                                        )}
                                                                                    </React.Fragment>
                                                                                );
                                                                            })
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        {filteredPoMasterData.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                start={start}
                                end={end}
                                totalCount={filteredPoMasterData.length}
                                rows={rowsPerPage}
                                onRowsChange={(newRows) => {
                                    setRowsPerPage(newRows);
                                    setCurrentPage(0);
                                }}
                                onPageChange={(p) => setCurrentPage(p)}
                            />
                        )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RailPadLifecycle;
