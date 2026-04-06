import React, { useState, useEffect } from 'react';
import reportService from '../services/reportService';
import useReportData from '../hooks/useReportData';
import './RailwayBoardDashboard.css';
import './RailwayBoardDashboardProfessional.css'; // New professional styles

// Components
import { Level1Row } from '../components/railway-board/LevelRows';
import Pagination from '../components/Pagination';
import DashboardGraph from '../components/railway-board/DashboardGraph';
import ProfessionalCardSection from '../components/railway-board/ProfessionalCardSection';

const RailwayBoardDashboard = () => {
    // State for Drill-down (Accordion Style) with Persistence
    const [expandedPo, setExpandedPo] = useState(() => JSON.parse(localStorage.getItem('dash_expandedPo')) || null);
    const [expandedSerial, setExpandedSerial] = useState(() => JSON.parse(localStorage.getItem('dash_expandedSerial')) || null);
    const [expandedCall, setExpandedCall] = useState(() => JSON.parse(localStorage.getItem('dash_expandedCall')) || null);

    // Save to LocalStorage on change
    React.useEffect(() => { localStorage.setItem('dash_expandedPo', JSON.stringify(expandedPo)); }, [expandedPo]);
    React.useEffect(() => { localStorage.setItem('dash_expandedSerial', JSON.stringify(expandedSerial)); }, [expandedSerial]);
    React.useEffect(() => { localStorage.setItem('dash_expandedCall', JSON.stringify(expandedCall)); }, [expandedCall]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Track active tab to defer non-essential API calls
    const [activeMainCard, setActiveMainCard] = useState('summary');
    const [reportSubmenuOpen, setReportSubmenuOpen] = useState(activeMainCard === 'reports');
    const [activeReport, setActiveReport] = useState('mpr');

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [poSearch, setPoSearch] = useState('');
    const [poSort, setPoSort] = useState({ key: 'poNo', direction: 'asc' });

    // Initialize dates
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [toDate, setToDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    // Filters
    const [selectedProduct, setSelectedProduct] = useState(() => {
        const val = localStorage.getItem('dash_selectedProduct');
        return (val === 'All' || !val || val === 'all') ? 'ERC' : val;
    });
    const [selectedZone, setSelectedZone] = useState(() => {
        const val = localStorage.getItem('dash_selectedZone');
        return (val === 'All' || !val) ? 'all' : val;
    });
    const [selectedVendor] = useState(() => {
        const val = localStorage.getItem('dash_selectedVendor');
        return (val === 'All' || val === 'All Vendors' || !val) ? 'all' : val;
    });
    const [selectedRio, setSelectedRio] = useState(() => {
        const val = localStorage.getItem('dash_selectedRio');
        return (val === 'All' || val === 'All RIOs' || !val) ? 'all' : val;
    });

    // Save Filters
    React.useEffect(() => { localStorage.setItem('dash_selectedProduct', selectedProduct); }, [selectedProduct]);
    React.useEffect(() => { localStorage.setItem('dash_selectedZone', selectedZone); }, [selectedZone]);
    React.useEffect(() => { localStorage.setItem('dash_selectedVendor', selectedVendor); }, [selectedVendor]);
    React.useEffect(() => { localStorage.setItem('dash_selectedRio', selectedRio); }, [selectedRio]);

    const dashboardFilters = React.useMemo(() => ({
        startDate: fromDate, endDate: toDate, product: selectedProduct,
        rio: selectedRio !== 'all' ? selectedRio : undefined,
        zone: selectedZone !== 'all' ? selectedZone : undefined,
        vendor: selectedVendor !== 'all' ? selectedVendor : undefined
    }), [fromDate, toDate, selectedProduct, selectedRio, selectedZone, selectedVendor]);

    const trendParams = React.useMemo(() => ({
        startDate: fromDate, endDate: toDate, product: selectedProduct
    }), [fromDate, toDate, selectedProduct]);

    // Data Fetching
    const { data: reportData = [] } = useReportData(reportService.getLevel1Report, activeMainCard === 'lifecycle' ? dashboardFilters : undefined);
    const { data: summaryData } = useReportData(reportService.getDashboardSummary, (activeMainCard === 'summary' || activeMainCard === 'quality') ? dashboardFilters : undefined);
    const { data: inspectionCallStatusData } = useReportData(reportService.getInspectionCallStatus, activeMainCard === 'summary' ? dashboardFilters : undefined);
    const { data: inspectionDetailsData } = useReportData(reportService.getInspectionDetails, activeMainCard === 'summary' ? trendParams : undefined);
    const { data: qualityRejectionData } = useReportData(reportService.getQualityRejection, activeMainCard === 'quality' ? dashboardFilters : undefined);
    const { data: manufacturerRejectionData } = useReportData(reportService.getManufacturerRejection, activeMainCard === 'quality' ? dashboardFilters : undefined);
    const { data: stepWiseRejectionData } = useReportData(reportService.getManufacturingStepWiseRejection, activeMainCard === 'quality' ? dashboardFilters : undefined);
    const { data: processPerformanceData } = useReportData(reportService.getProcessPerformance, activeMainCard === 'quality' ? dashboardFilters : undefined);
    const { data: paretoAnalysisData } = useReportData(reportService.getParetoAnalysis, activeMainCard === 'quality' ? dashboardFilters : undefined);
    const { data: monthlyRejectionTrendData } = useReportData(reportService.getMonthlyRejectionTrend, activeMainCard === 'quality' ? trendParams : undefined);

    const [perfPage, setPerfPage] = useState(0);
    const [perfRowsPerPage, setPerfRowsPerPage] = useState(10);

    const perfParams = React.useMemo(() => ({
        page: perfPage, size: perfRowsPerPage, ...dashboardFilters
    }), [perfPage, perfRowsPerPage, dashboardFilters]);

    const { data: perfData, pagination: perfPagination, loading: perfLoading } = useReportData(
        reportService.getPerformanceMatrix,
        (activeMainCard === 'performance' || activeMainCard === 'summary') ? perfParams : undefined
    );

    const [mprPage, setMprPage] = useState(0);
    const [mprRowsPerPage, setMprRowsPerPage] = useState(10);
    const mprParams = React.useMemo(() => ({
        page: mprPage, size: mprRowsPerPage, ...dashboardFilters
    }), [mprPage, mprRowsPerPage, dashboardFilters]);

    const { data: mprData, pagination: mprPagination, loading: mprLoading } = useReportData(
        reportService.getMonthlyProgressReport, activeMainCard === 'reports' ? mprParams : undefined
    );

    const [mauPage, setMauPage] = useState(0);
    const [mauRowsPerPage, setMauRowsPerPage] = useState(10);
    const mauParams = React.useMemo(() => ({
        page: mauPage, size: mauRowsPerPage, ...dashboardFilters
    }), [mauPage, mauRowsPerPage, dashboardFilters]);

    const { data: mauData, pagination: mauPagination, loading: mauLoading } = useReportData(
        reportService.getMonthlyAnalysisOfUnits, activeMainCard === 'reports' ? mauParams : undefined
    );

    const [mpiaPage, setMpiaPage] = useState(0);
    const [mpiaRowsPerPage, setMpiaRowsPerPage] = useState(10);
    const mpiaParams = React.useMemo(() => ({
        page: mpiaPage, size: mpiaRowsPerPage, ...dashboardFilters
    }), [mpiaPage, mpiaRowsPerPage, dashboardFilters]);

    const { data: mpiaData, pagination: mpiaPagination, loading: mpiaLoading } = useReportData(
        reportService.getManufactureProcessAnalysis, activeReport === 'mpia' && activeMainCard === 'reports' ? mpiaParams : undefined
    );

    const [lwclCallNo, setLwclCallNo] = useState('');
    const [lwclLotNo, setLwclLotNo] = useState('');
    const [lwclRequestIds, setLwclRequestIds] = useState([]);
    const [lwclLotNumbers, setLwclLotNumbers] = useState([]);

    useEffect(() => {
        const fetchIds = async () => {
            if (!fromDate || !toDate) return;
            try {
                const response = await reportService.getRequestIds({ startDate: fromDate, endDate: toDate });
                const data = response.responseData || response;
                if (data && Array.isArray(data)) setLwclRequestIds(data);
            } catch (error) { console.error("Error fetching request IDs:", error); }
        };
        fetchIds();
    }, [fromDate, toDate]);

    useEffect(() => {
        const fetchLots = async () => {
            if (!lwclCallNo) { setLwclLotNumbers([]); setLwclLotNo(''); return; }
            try {
                const response = await reportService.getLotNumbers(lwclCallNo);
                const data = response.responseData || response;
                if (data && Array.isArray(data)) setLwclLotNumbers(data);
            } catch (error) { console.error("Error fetching lot numbers:", error); }
        };
        fetchLots();
    }, [lwclCallNo]);

    const lwclParams = React.useMemo(() => ({ callNo: lwclCallNo, lotNo: lwclLotNo }), [lwclCallNo, lwclLotNo]);
    const fetchLwclData = React.useCallback(async (params) => {
        if (!params || !params.callNo || !params.lotNo) return { responseStatus: { statusCode: 0 }, responseData: [] };
        return reportService.getLotClosedLoop(params);
    }, []);
    const { data: lwclData, loading: lwclLoading } = useReportData(fetchLwclData, lwclParams);

    const [level4Data, setLevel4Data] = useState([]);
    const [level4Loading, setLevel4Loading] = useState(false);

    useEffect(() => {
        const fetchLevel4Report = async () => {
            if (!lwclCallNo) { setLevel4Data([]); return; }
            try {
                setLevel4Loading(true);
                const response = await reportService.getLevel4Report(lwclCallNo);
                const data = response.responseData || response;
                if (data && Array.isArray(data)) setLevel4Data(data); else setLevel4Data([]);
            } catch (error) { console.error("Error fetching 4th Level Report:", error); setLevel4Data([]); } finally { setLevel4Loading(false); }
        };
        if (activeMainCard === 'reports') fetchLevel4Report();
    }, [lwclCallNo, activeMainCard]);

    const togglePo = (poNo) => {
        if (expandedPo === poNo) { setExpandedPo(null); setExpandedSerial(null); setExpandedCall(null); }
        else { setExpandedPo(poNo); setExpandedSerial(null); }
    };

    const toggleSerial = (poNo, serialId) => {
        const compositeId = `${poNo}_${serialId}`;
        if (expandedSerial === compositeId) { setExpandedSerial(null); setExpandedCall(null); }
        else { setExpandedSerial(compositeId); setExpandedCall(null); }
    };

    const toggleCall = (callId) => {
        if (expandedCall === callId) setExpandedCall(null); else setExpandedCall(callId);
    };

    const handleChangePage = (newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (newRows) => setRowsPerPage(newRows);

    // Filtered & Sorted PO Data (Client-side)
    const displayPoData = React.useMemo(() => {
        let result = [...(reportData || [])];
        
        // Search filter
        if (poSearch) {
            const query = poSearch.toLowerCase();
            result = result.filter(po => 
                (po.rly || '').toLowerCase().includes(query) ||
                (po.poNo || '').toLowerCase().includes(query) ||
                (po.vendor || '').toLowerCase().includes(query) ||
                (po.region || '').toLowerCase().includes(query)
            );
        }

        // Sorting
        if (poSort.key) {
            result.sort((a, b) => {
                let aVal = a[poSort.key];
                let bVal = b[poSort.key];

                // Handle numbers
                const numA = parseFloat(aVal);
                const numB = parseFloat(bVal);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return poSort.direction === 'asc' ? numA - numB : numB - numA;
                }

                // Handle strings
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
                if (aVal < bVal) return poSort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return poSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [reportData, poSearch, poSort]);

    const count = displayPoData.length;
    const paginatedData = displayPoData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const handlePoSort = (key) => {
        setPoSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const renderSortIcon = (key) => {
        if (poSort.key !== key) return <span style={{ opacity: 0.3, marginLeft: '5px', fontSize: '11px' }}>↕</span>;
        return <span style={{ marginLeft: '5px', color: '#10b981', fontSize: '11px' }}>{poSort.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    const handleSwitchTab = (tab) => {
        setActiveMainCard(tab);
        if (tab === 'reports') setReportSubmenuOpen(true); else setReportSubmenuOpen(false);
    };

    const handleReportLink = (reportType) => {
        setActiveMainCard('reports');
        setActiveReport(reportType);
        setReportSubmenuOpen(true);
    };

    // Components to pass into ProfessionalCardSection
    const poTable = (
        <div className="content-card-integrated">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <div className="prof-search-wrapper" style={{ position: 'relative', width: '300px' }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
                    <input 
                        type="text" 
                        placeholder="Search POs, Vendors..." 
                        className="prof-search" 
                        style={{ width: '100%', paddingLeft: '35px' }}
                        value={poSearch} 
                        onChange={(e) => setPoSearch(e.target.value)} 
                    />
                </div>
            </div>
            <div className="table-responsive">
                <table className="prof-table main-table level-1-table">
                    <thead>
                        <tr className="sortable-header">
                            <th style={{ width: '40px' }}></th>
                            <th>Sl No.</th>
                            <th onClick={() => handlePoSort('rly')} style={{ cursor: 'pointer' }}>Rly {renderSortIcon('rly')}</th>
                            <th onClick={() => handlePoSort('poNo')} style={{ cursor: 'pointer' }}>PO No. {renderSortIcon('poNo')}</th>
                            <th onClick={() => handlePoSort('poDate')} style={{ cursor: 'pointer' }}>PO Date {renderSortIcon('poDate')}</th>
                            <th onClick={() => handlePoSort('vendor')} style={{ cursor: 'pointer' }}>Vendor {renderSortIcon('vendor')}</th>
                            <th onClick={() => handlePoSort('region')} style={{ cursor: 'pointer' }}>Region {renderSortIcon('region')}</th>
                            <th className="text-right" onClick={() => handlePoSort('poQuantityNos')} style={{ cursor: 'pointer' }}>PO Qty {renderSortIcon('poQuantityNos')}</th>
                            <th className="text-right" onClick={() => handlePoSort('acceptedQty')} style={{ cursor: 'pointer' }}>Acc Qty {renderSortIcon('acceptedQty')}</th>
                            <th className="text-right" onClick={() => handlePoSort('balanceQty')} style={{ cursor: 'pointer' }}>Bal Qty {renderSortIcon('balanceQty')}</th>
                            <th className="text-right">RM %</th>
                            <th className="text-right">Proc %</th>
                            <th className="text-right">Final %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((po, index) => (
                            <Level1Row
                                key={po.poNo || po.id}
                                po={po}
                                index={(page * rowsPerPage) + index}
                                expandedPo={expandedPo} togglePo={togglePo}
                                expandedSerial={expandedSerial} toggleSerial={toggleSerial}
                                expandedCall={expandedCall} toggleCall={toggleCall}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            {!expandedPo && (
                <Pagination
                    currentPage={page} totalPages={Math.ceil(count / rowsPerPage)}
                    start={page * rowsPerPage} end={Math.min((page + 1) * rowsPerPage, count)}
                    totalCount={count} onPageChange={handleChangePage}
                    rows={rowsPerPage} onRowsChange={handleChangeRowsPerPage}
                />
            )}
        </div>
    );

    const poGraph = <DashboardGraph liveData={reportData} />;
    const kpiGrid = null;

    return (
        <div className={`prof-dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="prof-layout-container">
                {/* SIDEBAR */}
                <nav id="prof-sidebar" className={isSidebarCollapsed ? 'collapsed' : ''}>
                    <div className="sidebar-top-action" style={{ padding: '30px 14px 10px', display: 'flex', justifyContent: isSidebarCollapsed ? 'center' : 'flex-end' }}>
                        <button className="sidebar-toggle-btn-small" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                            <i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-bars-staggered'}`}></i>
                        </button>
                    </div>
                    <div style={{ padding: '0 0 20px', flex: 1, overflowY: 'auto' }}>
                        <div className="nav-label">Navigation</div>
                        <div className={`nav-item ${activeMainCard === 'summary' ? 'active' : ''}`} onClick={() => handleSwitchTab('summary')}>
                            <i className="fa-solid fa-chart-pie"></i> {!isSidebarCollapsed && <span>Dashboard</span>}
                        </div>
                        <div className={`nav-item ${activeMainCard === 'quality' ? 'active' : ''}`} onClick={() => handleSwitchTab('quality')}>
                            <i className="fa-solid fa-shield-halved"></i> {!isSidebarCollapsed && <span>Quality</span>}
                        </div>
                        <div className={`nav-item ${activeMainCard === 'lifecycle' ? 'active' : ''}`} onClick={() => handleSwitchTab('lifecycle')}>
                            <i className="fa-solid fa-file-contract"></i> {!isSidebarCollapsed && <span>PO Lifecycle</span>}
                        </div>
                        <div className={`nav-item ${activeMainCard === 'performance' ? 'active' : ''}`} onClick={() => handleSwitchTab('performance')}>
                            <i className="fa-solid fa-trophy"></i> {!isSidebarCollapsed && <span>Performance</span>}
                        </div>
                        <div className={`nav-item ${activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleSwitchTab('reports')}>
                            <i className="fa-solid fa-file-lines"></i> {!isSidebarCollapsed && <span>Reports</span>}
                        </div>
                        {reportSubmenuOpen && !isSidebarCollapsed && (
                            <div className="report-submenu open">
                                <div className={`report-link ${activeReport === 'mpr' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('mpr')}>Monthly Progress Report</div>
                                <div className={`report-link ${activeReport === 'mau' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('mau')}>Monthly Analysis of Units</div>
                                <div className={`report-link ${activeReport === 'lwcl' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('lwcl')}>Lot Wise Closed Loop</div>
                                <div className={`report-link ${activeReport === 'mpia' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('mpia')}>Manufacture Process Inspection Analysis</div>
                            </div>
                        )}
                        <div className={`nav-item ${activeMainCard === 'feedback' ? 'active' : ''}`} onClick={() => handleSwitchTab('feedback')}>
                            <i className="fa-solid fa-comment-dots"></i> {!isSidebarCollapsed && <span>Feedback</span>}
                        </div>

                    </div>
                </nav>

                {/* MAIN */}
                <div id="prof-main" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* GLOBAL PRODUCT SELECTION - Above everything */}
                    <div className="sub-tabs" style={{ padding: '0 24px', marginTop: '24px', marginBottom: '4px' }}>
                        <button className={`sub-tab-btn ${selectedProduct === 'ERC' ? 'active' : ''}`} onClick={() => setSelectedProduct('ERC')}>ERC</button>
                        <button className={`sub-tab-btn ${selectedProduct === 'Sleeper' ? 'active' : ''}`} onClick={() => setSelectedProduct('Sleeper')}>Sleeper</button>
                        <button className={`sub-tab-btn ${selectedProduct === 'Rail Pad' ? 'active' : ''}`} onClick={() => setSelectedProduct('Rail Pad')}>Rail Pad</button>
                    </div>

                    {/* TOPBAR / FILTERS - Hidden on Dashboard (summary), Quality, Lifecycle, and Feedback tabs */}
                    {activeMainCard !== 'summary' && activeMainCard !== 'quality' && activeMainCard !== 'lifecycle' && activeMainCard !== 'feedback' && (
                        <div id="prof-topbar">
                            <label>From</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            <label>To</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

                            <label>Zone</label>
                            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
                                <option value="all">All Zones</option>
                                <option value="Northern Railway">Northern Railway</option>
                                <option value="Western Railway">Western Railway</option>
                            </select>

                            <label>RIO</label>
                            <select value={selectedRio} onChange={(e) => setSelectedRio(e.target.value)}>
                                <option value="all">All RITES RIOs</option>
                                <option value="CRIO">CRIO</option>
                                <option value="NRIO">NRIO</option>
                                <option value="ERIO">ERIO</option>
                                <option value="WRIO">WRIO</option>
                                <option value="SRIO">SRIO</option>
                            </select>

                            <button className="btn-apply"><i className="fa-solid fa-magnifying-glass" style={{ marginRight: '4px' }}></i>Apply</button>
                            <button className="btn-reset" onClick={() => {
                                setFromDate(`${new Date().getFullYear()}-01-01`);
                                setToDate(new Date().toISOString().split('T')[0]);
                                setSelectedProduct('ERC'); setSelectedZone('all'); setSelectedRio('all');
                            }}>Reset</button>
                        </div>
                    )}

                    {/* CONTENT AREA */}
                    <div id="prof-content-area">
                        <ProfessionalCardSection
                            poTable={poTable} poGraph={poGraph} kpiGrid={kpiGrid}
                            selectedProduct={selectedProduct} summaryData={summaryData}
                            inspectionCallStatusData={inspectionCallStatusData}
                            inspectionDetailsData={inspectionDetailsData}
                            activeMainCard={activeMainCard} setActiveMainCard={setActiveMainCard}
                            qualityRejectionData={qualityRejectionData}
                            manufacturerRejectionData={manufacturerRejectionData}
                            stepWiseRejectionData={stepWiseRejectionData}
                            processPerformanceData={processPerformanceData}
                            paretoAnalysisData={paretoAnalysisData}
                            monthlyRejectionTrendData={monthlyRejectionTrendData}
                            perfData={perfData} perfLoading={perfLoading} perfPagination={perfPagination}
                            perfPage={perfPage} setPerfPage={setPerfPage}
                            perfRowsPerPage={perfRowsPerPage} setPerfRowsPerPage={setPerfRowsPerPage}
                            mprData={mprData} mprLoading={mprLoading} mprPagination={mprPagination}
                            mprPage={mprPage} setMprPage={setMprPage}
                            mprRowsPerPage={mprRowsPerPage} setMprRowsPerPage={setMprRowsPerPage}
                            mauData={mauData} mauLoading={mauLoading} mauPagination={mauPagination}
                            mauPage={mauPage} setMauPage={setMauPage}
                            mauRowsPerPage={mauRowsPerPage} setMauRowsPerPage={setMauRowsPerPage}
                            mpiaData={mpiaData} mpiaLoading={mpiaLoading} mpiaPagination={mpiaPagination}
                            mpiaPage={mpiaPage} setMpiaPage={setMpiaPage}
                            mpiaRowsPerPage={mpiaRowsPerPage} setMpiaRowsPerPage={setMpiaRowsPerPage}
                            lwclData={lwclData} lwclLoading={lwclLoading}
                            lwclCallNo={lwclCallNo} setLwclCallNo={setLwclCallNo}
                            lwclLotNo={lwclLotNo} setLwclLotNo={setLwclLotNo}
                            lwclRequestIds={lwclRequestIds} lwclLotNumbers={lwclLotNumbers}
                            level4Data={level4Data} level4Loading={level4Loading}
                            activeReportFromParent={activeReport}
                            onReportTabChange={handleReportLink}
                            setSelectedProduct={setSelectedProduct}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RailwayBoardDashboard;
