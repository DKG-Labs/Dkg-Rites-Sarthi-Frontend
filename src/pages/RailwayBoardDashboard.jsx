import React, { useState, useEffect } from 'react';
import CMDashboardPage from './cm/CMDashboardPage';

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

    const roleName = localStorage.getItem('roleName') || '';
    const isRitesAdmin = roleName === 'Rites Admin' || roleName === 'Rites ADMin' || roleName.includes('Rites Admin') || roleName.includes('Rites ADMin');

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

    // CM Module state
    const [isCmDropdownOpen, setIsCmDropdownOpen] = useState(false);
    const [cmActiveTab, setCmActiveTab] = useState('Dashboard');
    const [cmReportsMenuOpen, setCmReportsMenuOpen] = useState(false);
    const [cmCallMenuOpen, setCmCallMenuOpen] = useState(false);
    const [cmIeMenuOpen, setCmIeMenuOpen] = useState(false);
    const [cmActiveCallFilter, setCmActiveCallFilter] = useState('all');



    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isRailwayNavOpen, setIsRailwayNavOpen] = useState(true);
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
    React.useEffect(() => {
        if (selectedProduct !== 'Sleeper' && activeMainCard === 'sleeper-anomaly') {
            setActiveMainCard('summary');
        }
    }, [selectedProduct, activeMainCard]);
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
        page: 0, size: 10000, ...dashboardFilters
    }), [dashboardFilters]);

    const { data: perfData, pagination: perfPagination, loading: perfLoading, error: perfError } = useReportData(
        reportService.getPerformanceMatrix,
        (activeMainCard === 'performance' || activeMainCard === 'summary') ? perfParams : undefined
    );

    const [mprPage, setMprPage] = useState(0);
    const [mprRowsPerPage, setMprRowsPerPage] = useState(10);
    const mprParams = React.useMemo(() => ({
        page: 0, size: 10000, ...dashboardFilters
    }), [dashboardFilters]);

    const { data: mprData, pagination: mprPagination, loading: mprLoading } = useReportData(
        selectedProduct === 'Sleeper' ? reportService.getSleeperMonthlyProgressReport :
            selectedProduct === 'Rail Pad' ? reportService.getRailPadMonthlyProgressReport :
                reportService.getMonthlyProgressReport,
        (activeReport === 'mpr' && activeMainCard === 'reports') ? mprParams : undefined
    );

    const [mauPage, setMauPage] = useState(0);
    const [mauRowsPerPage, setMauRowsPerPage] = useState(10);
    const mauParams = React.useMemo(() => ({
        page: 0, size: 10000, ...dashboardFilters
    }), [dashboardFilters]);

    const { data: mauData, pagination: mauPagination, loading: mauLoading } = useReportData(
        selectedProduct === 'Sleeper'
            ? reportService.getSleeperMonthlyAnalysis
            : selectedProduct === 'Rail Pad'
                ? reportService.getRailPadMonthlyAnalysisOfUnits
                : reportService.getMonthlyAnalysisOfUnits,
        (activeReport === 'mau' && activeMainCard === 'reports') ? mauParams : undefined
    );

    const [mpiaPage, setMpiaPage] = useState(0);
    const [mpiaRowsPerPage, setMpiaRowsPerPage] = useState(10);
    const mpiaParams = React.useMemo(() => ({
        page: 0, size: 10000, ...dashboardFilters
    }), [dashboardFilters]);

    const { data: mpiaData, pagination: mpiaPagination, loading: mpiaLoading } = useReportData(
        reportService.getManufactureProcessAnalysis, activeReport === 'mpia' && activeMainCard === 'reports' ? mpiaParams : undefined
    );

    // Reset all pages when global filters change
    useEffect(() => {
        setPage(0);
        setPerfPage(0);
        setMprPage(0);
        setMauPage(0);
        setMpiaPage(0);
        setExpandedPo(null);
        setExpandedSerial(null);
        setExpandedCall(null);
    }, [dashboardFilters]);

    const [lwclCallNo, setLwclCallNo] = useState('');
    const [lwclLotNo, setLwclLotNo] = useState('');
    const [lwclRequestIds, setLwclRequestIds] = useState([]);
    const [lwclLotNumbers, setLwclLotNumbers] = useState([]);
    const [lwclManufacturer, setLwclManufacturer] = useState('');
    const [lwclManufacturersList, setLwclManufacturersList] = useState([]);
    const [lwclPoNo, setLwclPoNo] = useState('');
    const [lwclPoNumbersList, setLwclPoNumbersList] = useState([]);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await reportService.getAllCompanies();
                const data = response.responseData || response;
                if (data && Array.isArray(data)) setLwclManufacturersList(data);
            } catch (error) { console.error("Error fetching companies:", error); }
        };
        fetchCompanies();
    }, []);

    useEffect(() => {
        const fetchPoNumbers = async () => {
            if (!lwclManufacturer) {
                setLwclPoNumbersList([]);
                setLwclPoNo('');
                return;
            }
            try {
                const response = await reportService.getPoNumbersByManufacturer(lwclManufacturer);
                const data = response.responseData || response;
                if (data && Array.isArray(data)) setLwclPoNumbersList(data);
            } catch (error) { console.error("Error fetching PO numbers:", error); }
        };
        fetchPoNumbers();
    }, [lwclManufacturer]);

    useEffect(() => {
        const fetchCallNumbers = async () => {
            if (!lwclPoNo || !lwclManufacturer) {
                setLwclRequestIds([]);
                setLwclCallNo('');
                return;
            }
            try {
                const response = await reportService.getCallNumbersByPoAndManufacturer(lwclPoNo, lwclManufacturer);
                const data = response.responseData || response;
                if (data && Array.isArray(data)) {
                    const filteredData = data.filter(id => id && typeof id === 'string' && id.startsWith('EP-'));
                    setLwclRequestIds(filteredData);
                }
            } catch (error) { console.error("Error fetching call numbers:", error); }
        };
        fetchCallNumbers();
    }, [lwclPoNo, lwclManufacturer]);

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

    // Reset page to 0 when search changes
    useEffect(() => {
        setPage(0);
    }, [poSearch]);

    // Filtered & Sorted PO Data (Client-side)
    const displayPoData = React.useMemo(() => {
        let result = [...(reportData || [])];

        // Filter by Item Category Description based on selected product
        // Helper function defined at the bottom of this file
        result = getFilteredRecordsByProduct(result, selectedProduct);

        // Search filter
        if (poSearch) {
            const query = poSearch.toLowerCase();
            result = result.filter(po =>
                (po.railway || '').toLowerCase().includes(query) ||
                (po.poNo || '').toLowerCase().includes(query) ||
                (po.vendor || '').toLowerCase().includes(query) ||
                (po.inspectionRegion || '').toLowerCase().includes(query)
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
    }, [reportData, poSearch, poSort, selectedProduct]);

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
                            <th onClick={() => handlePoSort('railway')} style={{ cursor: 'pointer' }}>Rly {renderSortIcon('railway')}</th>
                            <th onClick={() => handlePoSort('poNo')} style={{ cursor: 'pointer' }}>PO No. {renderSortIcon('poNo')}</th>
                            <th onClick={() => handlePoSort('poDate')} style={{ cursor: 'pointer' }}>PO Date {renderSortIcon('poDate')}</th>
                            <th onClick={() => handlePoSort('vendor')} style={{ cursor: 'pointer' }}>Vendor {renderSortIcon('vendor')}</th>
                            <th onClick={() => handlePoSort('inspectionRegion')} style={{ cursor: 'pointer' }}>Region {renderSortIcon('inspectionRegion')}</th>
                            <th className="text-right" onClick={() => handlePoSort('poQty')} style={{ cursor: 'pointer' }}>PO Qty {renderSortIcon('poQty')}</th>
                            <th className="text-right" onClick={() => handlePoSort('finalQuantityAcceptedByRites')} style={{ cursor: 'pointer' }}>Acc Qty {renderSortIcon('finalQuantityAcceptedByRites')}</th>
                            <th className="text-right" onClick={() => handlePoSort('balancePoQty')} style={{ cursor: 'pointer' }}>Bal Qty {renderSortIcon('balancePoQty')}</th>
                            <th className="text-right" onClick={() => handlePoSort('rawMaterialRejectionPercentage')} style={{ cursor: 'pointer' }}>RM % {renderSortIcon('rawMaterialRejectionPercentage')}</th>
                            <th className="text-right" onClick={() => handlePoSort('processInspectionRejectionPercentage')} style={{ cursor: 'pointer' }}>Proc % {renderSortIcon('processInspectionRejectionPercentage')}</th>
                            <th className="text-right" onClick={() => handlePoSort('finalInspectionRejectionPercentage')} style={{ cursor: 'pointer' }}>Final % {renderSortIcon('finalInspectionRejectionPercentage')}</th>
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
            <Pagination
                currentPage={page} totalPages={Math.ceil(count / rowsPerPage)}
                start={page * rowsPerPage} end={Math.min((page + 1) * rowsPerPage, count)}
                totalCount={count} onPageChange={handleChangePage}
                rows={rowsPerPage} onRowsChange={handleChangeRowsPerPage}
            />
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
                        {isRitesAdmin ? (
                            <>
                                <div className={`nav-item ${['summary', 'quality', 'lifecycle', 'performance', 'reports', 'sqc', 'scada', 'feedback'].includes(activeMainCard) ? 'active' : ''}`} onClick={() => {
                                    setIsRailwayNavOpen(!isRailwayNavOpen);
                                    if (!isRailwayNavOpen) setIsCmDropdownOpen(false);
                                }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                                        <div><i className="fa-solid fa-train"></i> {!isSidebarCollapsed && <span>Railway Dashboard</span>}</div>
                                        {!isSidebarCollapsed && <i className={`fa-solid fa-chevron-${isRailwayNavOpen ? 'up' : 'down'}`} style={{fontSize: '12px'}}></i>}
                                    </div>
                                </div>

                                {isRailwayNavOpen && !isSidebarCollapsed && (
                                    <div className="report-submenu open">
                                        <div className={`report-link ${activeMainCard === 'summary' ? 'active' : ''}`} onClick={() => handleSwitchTab('summary')} style={{ fontSize: '15px' }}>
                                            <i className="fa-solid fa-chart-pie" style={{marginRight: '8px'}}></i>Dashboard
                                        </div>
                                        <div className={`report-link ${activeMainCard === 'quality' ? 'active' : ''}`} onClick={() => handleSwitchTab('quality')} style={{ fontSize: '15px' }}>
                                            <i className="fa-solid fa-shield-halved" style={{marginRight: '8px'}}></i>Quality
                                        </div>
                                        <div className={`report-link ${activeMainCard === 'lifecycle' ? 'active' : ''}`} onClick={() => handleSwitchTab('lifecycle')} style={{ fontSize: '15px' }}>
                                            <i className="fa-solid fa-file-contract" style={{marginRight: '8px'}}></i>PO Lifecycle
                                        </div>
                                        <div className={`report-link ${activeMainCard === 'performance' ? 'active' : ''}`} onClick={() => handleSwitchTab('performance')} style={{ fontSize: '15px' }}>
                                            <i className="fa-solid fa-trophy" style={{marginRight: '8px'}}></i>Performance
                                        </div>
                                        <div className={`report-link ${activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleSwitchTab('reports')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                                            <div><i className="fa-solid fa-file-lines" style={{marginRight: '8px'}}></i>Reports</div>
                                            <i className={`fa-solid fa-chevron-${reportSubmenuOpen ? 'up' : 'down'}`} style={{fontSize: '10px', opacity: 0.6}}></i>
                                        </div>
                                        
                                        {reportSubmenuOpen && (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div className={`report-link ${activeReport === 'mpr' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('mpr')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>{selectedProduct === 'ERC' || selectedProduct === 'Rail Pad' ? 'PO Wise Monthly Progress Report' : 'Monthly Progress Report'}</div>
                                                <div className={`report-link ${activeReport === 'mau' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('mau')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>Monthly Analysis of Units</div>
                                                <div className={`report-link ${activeReport === 'lwcl' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('lwcl')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>Lot Wise Closed Loop</div>
                                                <div className={`report-link ${activeReport === 'swp' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('swp')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>Shift Wise Production Report</div>
                                                {selectedProduct === 'Rail Pad' && (
                                                    <div className={`report-link ${activeReport === 'qrp' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('qrp')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>Quality of Rubber Pad Report</div>
                                                )}
                                                {(selectedProduct === 'ERC' || selectedProduct === 'Rail Pad') && (
                                                    <div className={`report-link ${activeReport === (selectedProduct === 'ERC' ? 'mpia' : 'vwpqr') && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink(selectedProduct === 'ERC' ? 'mpia' : 'vwpqr')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>Vendor Wise Process Quality Report</div>
                                                )}
                                                {selectedProduct === 'ERC' && (
                                                    <div className={`report-link ${activeReport === 'pwmr' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('pwmr')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>PO Wise Quality Report</div>
                                                )}
                                                {selectedProduct === 'Sleeper' && (
                                                    <div className={`report-link ${activeReport === 'sqr' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('sqr')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>Quality of PSC Sleepers Report</div>
                                                )}
                                                <div className={`report-link ${activeReport === 'ic_annexures' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('ic_annexures')} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>Download IC & Annexures</div>
                                            </div>
                                        )}
                                        
                                        {selectedProduct === 'ERC' && (
                                            <div className={`report-link ${activeMainCard === 'sqc' ? 'active' : ''}`} onClick={() => handleSwitchTab('sqc')} style={{ fontSize: '15px' }}>
                                                <i className="fa-solid fa-chart-line" style={{marginRight: '8px'}}></i>SQC Analysis
                                            </div>
                                        )}
                                        <div className={`report-link ${activeMainCard === 'scada' ? 'active' : ''}`} onClick={() => handleSwitchTab('scada')} style={{ fontSize: '15px' }}>
                                            <i className="fa-solid fa-desktop" style={{marginRight: '8px'}}></i>Scada Monitor
                                        </div>
                                        <div className={`report-link ${activeMainCard === 'feedback' ? 'active' : ''}`} onClick={() => handleSwitchTab('feedback')} style={{ fontSize: '15px' }}>
                                            <i className="fa-solid fa-comment-dots" style={{marginRight: '8px'}}></i>Feedback
                                        </div>
                                    </div>
                                )}
                                <div className={`nav-item ${activeMainCard === 'cm-module' ? 'active' : ''}`} onClick={() => {
                                    setIsCmDropdownOpen(!isCmDropdownOpen);
                                    if (!isCmDropdownOpen) setIsRailwayNavOpen(false);
                                }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                                        <div><i className="fa-solid fa-users-gear"></i> {!isSidebarCollapsed && <span>Controlling Manager</span>}</div>
                                        {!isSidebarCollapsed && <i className={`fa-solid fa-chevron-${isCmDropdownOpen ? 'up' : 'down'}`} style={{fontSize: '12px'}}></i>}
                                    </div>
                                </div>
                                {isCmDropdownOpen && !isSidebarCollapsed && (
                                    <div className="report-submenu open">
                                        {/* Dashboard */}
                                        <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Dashboard' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Dashboard'); setCmCallMenuOpen(false); setCmIeMenuOpen(false); setCmReportsMenuOpen(false); }} style={{ fontSize: '15px' }}><i className="fa-solid fa-chart-pie" style={{marginRight: '8px'}}></i>Dashboard</div>
                                        
                                        {/* Call Monitoring */}
                                        <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Call Monitoring' ? 'active' : ''}`} 
                                            onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Call Monitoring'); setCmActiveCallFilter('all'); setCmCallMenuOpen(!cmCallMenuOpen); setCmIeMenuOpen(false); setCmReportsMenuOpen(false); }}
                                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px'}}>
                                            <div><i className="fa-solid fa-phone" style={{marginRight: '8px'}}></i>Call Monitoring</div>
                                            <i className={`fa-solid fa-chevron-${cmCallMenuOpen ? 'up' : 'down'}`} style={{fontSize: '10px', opacity: 0.6}}></i>
                                        </div>
                                        {cmCallMenuOpen && (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Call Monitoring' && cmActiveCallFilter === 'all' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Call Monitoring'); setCmActiveCallFilter('all'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}><i className="fa-solid fa-phone" style={{marginRight: '6px'}}></i>All Calls</div>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Call Monitoring' && cmActiveCallFilter === 'pending' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Call Monitoring'); setCmActiveCallFilter('pending'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}><i className="fa-solid fa-hourglass-half" style={{marginRight: '6px'}}></i>Pending Calls</div>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Call Monitoring' && cmActiveCallFilter === 'under_inspection' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Call Monitoring'); setCmActiveCallFilter('under_inspection'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}><i className="fa-solid fa-sliders" style={{marginRight: '6px'}}></i>Under Inspection Calls</div>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Call Monitoring' && cmActiveCallFilter === 'ic_pending' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Call Monitoring'); setCmActiveCallFilter('ic_pending'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}><i className="fa-solid fa-file-invoice" style={{marginRight: '6px'}}></i>IC Issuance Pending</div>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Call Monitoring' && cmActiveCallFilter === 'completed' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Call Monitoring'); setCmActiveCallFilter('completed'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}><i className="fa-solid fa-circle-check" style={{marginRight: '6px'}}></i>Completed Calls</div>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Call Monitoring' && cmActiveCallFilter === 'overdue' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Call Monitoring'); setCmActiveCallFilter('overdue'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}><i className="fa-solid fa-triangle-exclamation" style={{marginRight: '6px'}}></i>Overdue Calls</div>
                                            </div>
                                        )}

                                        {/* IE Monitoring */}
                                        <div className={`report-link ${activeMainCard === 'cm-module' && ['IE wise Call Status', 'IE Performance Monitoring'].includes(cmActiveTab) ? 'active' : ''}`} 
                                            onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('IE wise Call Status'); setCmIeMenuOpen(!cmIeMenuOpen); setCmCallMenuOpen(false); setCmReportsMenuOpen(false); }}
                                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px'}}>
                                            <div><i className="fa-solid fa-users-viewfinder" style={{marginRight: '8px'}}></i>IE Monitoring</div>
                                            <i className={`fa-solid fa-chevron-${cmIeMenuOpen ? 'up' : 'down'}`} style={{fontSize: '10px', opacity: 0.6}}></i>
                                        </div>
                                        {cmIeMenuOpen && (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'IE wise Call Status' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('IE wise Call Status'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}><i className="fa-solid fa-map-pin" style={{marginRight: '6px'}}></i>IE wise Call Status</div>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'IE Performance Monitoring' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('IE Performance Monitoring'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}><i className="fa-solid fa-trophy" style={{marginRight: '6px'}}></i>IE Performance Monitoring</div>
                                            </div>
                                        )}

                                        <div className={`report-link ${activeMainCard === 'cm-module' && ['Mandays Calculation', 'Billing Sheet'].includes(cmActiveTab) ? 'active' : ''}`} 
                                            onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Mandays Calculation'); setCmReportsMenuOpen(!cmReportsMenuOpen); setCmCallMenuOpen(false); setCmIeMenuOpen(false); }}
                                            style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px'}}>
                                            <div><i className="fa-solid fa-download" style={{marginRight: '8px'}}></i>Reports</div>
                                            <i className={`fa-solid fa-chevron-${cmReportsMenuOpen ? 'up' : 'down'}`} style={{fontSize: '10px', opacity: 0.6}}></i>
                                        </div>
                                        {cmReportsMenuOpen && (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Mandays Calculation' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Mandays Calculation'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>
                                                    <i className="fa-solid fa-calculator" style={{marginRight: '6px'}}></i>Process Inspection Mandays Calculation
                                                </div>
                                                <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Billing Sheet' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Billing Sheet'); }} style={{ padding: '6px 8px', paddingLeft: '28px', fontSize: '14px' }}>
                                                    <i className="fa-solid fa-file-invoice-dollar" style={{marginRight: '6px'}}></i>Billing Sheet
                                                </div>
                                            </div>
                                        )}
                                        <div className={`report-link ${activeMainCard === 'cm-module' && cmActiveTab === 'Notification & Approval' ? 'active' : ''}`} onClick={() => { setActiveMainCard('cm-module'); setCmActiveTab('Notification & Approval'); setCmCallMenuOpen(false); setCmIeMenuOpen(false); setCmReportsMenuOpen(false); }} style={{ fontSize: '15px' }}><i className="fa-solid fa-key" style={{marginRight: '8px'}}></i>Notification & Approval</div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
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
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                                        <div><i className="fa-solid fa-file-lines"></i> {!isSidebarCollapsed && <span>Reports</span>}</div>
                                        {!isSidebarCollapsed && <i className={`fa-solid fa-chevron-${reportSubmenuOpen ? 'up' : 'down'}`} style={{fontSize: '12px'}}></i>}
                                    </div>
                                </div>
                                {reportSubmenuOpen && !isSidebarCollapsed && (
                                    <div className="report-submenu open">
                                        <div className={`report-link ${activeReport === 'mpr' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('mpr')}>{selectedProduct === 'ERC' || selectedProduct === 'Rail Pad' ? 'PO Wise Monthly Progress Report' : 'Monthly Progress Report'}</div>
                                        <div className={`report-link ${activeReport === 'mau' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('mau')}>Monthly Analysis of Units</div>
                                        <div className={`report-link ${activeReport === 'lwcl' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('lwcl')}>Lot Wise Closed Loop</div>
                                        <div className={`report-link ${activeReport === 'swp' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('swp')}>Shift Wise Production Report</div>
                                        {selectedProduct === 'Rail Pad' && (
                                            <div className={`report-link ${activeReport === 'qrp' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('qrp')}>Quality of Rubber Pad Report</div>
                                        )}
                                        {(selectedProduct === 'ERC' || selectedProduct === 'Rail Pad') && (
                                            <div className={`report-link ${activeReport === (selectedProduct === 'ERC' ? 'mpia' : 'vwpqr') && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink(selectedProduct === 'ERC' ? 'mpia' : 'vwpqr')}>Vendor Wise Process Quality Report</div>
                                        )}
                                        {selectedProduct === 'ERC' && (
                                            <div className={`report-link ${activeReport === 'pwmr' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('pwmr')}>PO Wise Quality Report</div>
                                        )}
                                        {selectedProduct === 'Sleeper' && (
                                            <div className={`report-link ${activeReport === 'sqr' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('sqr')}>Quality of PSC Sleepers Report</div>
                                        )}
                                        <div className={`report-link ${activeReport === 'ic_annexures' && activeMainCard === 'reports' ? 'active' : ''}`} onClick={() => handleReportLink('ic_annexures')}>Download IC & Annexures</div>
                                    </div>
                                )}
                                {selectedProduct === 'ERC' && (
                                    <div className={`nav-item ${activeMainCard === 'sqc' ? 'active' : ''}`} onClick={() => handleSwitchTab('sqc')}>
                                        <i className="fa-solid fa-chart-line"></i> {!isSidebarCollapsed && <span>SQC Analysis</span>}
                                    </div>
                                )}
                                <div className={`nav-item ${activeMainCard === 'scada' ? 'active' : ''}`} onClick={() => handleSwitchTab('scada')}>
                                    <i className="fa-solid fa-desktop"></i> {!isSidebarCollapsed && <span>Scada Monitor</span>}
                                </div>
                                <div className={`nav-item ${activeMainCard === 'feedback' ? 'active' : ''}`} onClick={() => handleSwitchTab('feedback')}>
                                    <i className="fa-solid fa-comment-dots"></i> {!isSidebarCollapsed && <span>Feedback</span>}
                                </div>
                            </>
                        )}

                        {selectedProduct === 'Sleeper' && (
                            <div className={`nav-item ${activeMainCard === 'sleeper-anomaly' ? 'active' : ''}`} onClick={() => handleSwitchTab('sleeper-anomaly')}>
                                <i className="fa-solid fa-microchip"></i> {!isSidebarCollapsed && <span>AI Engine</span>}
                            </div>
                        )}
                    </div>
                </nav>

                {/* MAIN */}
                <div id="prof-main" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* GLOBAL PRODUCT SELECTION - Above everything */}
                    {activeMainCard !== 'cm-module' && (
                    <div className="sub-tabs" style={{ padding: '0 24px', marginTop: '24px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={`sub-tab-btn ${selectedProduct === 'ERC' ? 'active' : ''}`} onClick={() => setSelectedProduct('ERC')}>ERC</button>
                            <button className={`sub-tab-btn ${selectedProduct === 'Sleeper' ? 'active' : ''}`} onClick={() => {
                                setSelectedProduct('Sleeper');
                                if (activeReport === 'mpia') setActiveReport('mpr');
                            }}>Sleeper</button>
                            <button className={`sub-tab-btn ${selectedProduct === 'Rail Pad' ? 'active' : ''}`} onClick={() => setSelectedProduct('Rail Pad')}>Rail Pad</button>
                        </div>

                    </div>
                    )}

                    {/* TOPBAR / FILTERS - Hidden on Dashboard (summary), Quality, Lifecycle, Feedback, Scada Monitor, SQC tabs, and ERC/Sleeper SWP Reports */}
                    {activeMainCard !== 'cm-module' && activeMainCard !== 'summary' && activeMainCard !== 'quality' && activeMainCard !== 'lifecycle' && activeMainCard !== 'feedback' && activeMainCard !== 'scada' && activeMainCard !== 'sqc' && activeMainCard !== 'sleeper-anomaly' && !(activeMainCard === 'reports' && activeReport === 'swp' && (selectedProduct === 'ERC' || selectedProduct === 'Sleeper')) && (
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
                    <div id="dashboard-capture-area">
                        <div id="prof-content-area">
                            {activeMainCard === 'cm-module' ? (
                                <CMDashboardPage isEmbedded={true} activeTabFromProps={cmActiveTab} activeCallFilterFromProps={cmActiveCallFilter} />
                            ) : (
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
                            perfData={perfData} perfLoading={perfLoading} perfError={perfError} perfPagination={perfPagination}
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
                            lwclManufacturer={lwclManufacturer} setLwclManufacturer={setLwclManufacturer}
                            lwclManufacturersList={lwclManufacturersList}
                            lwclPoNo={lwclPoNo} setLwclPoNo={setLwclPoNo}
                            lwclPoNumbersList={lwclPoNumbersList}
                            level4Data={level4Data} level4Loading={level4Loading}
                            activeReportFromParent={activeReport}
                            onReportTabChange={handleReportLink}
                            setSelectedProduct={setSelectedProduct}
                            fromDate={fromDate}
                            toDate={toDate}
                            setFromDate={setFromDate}
                            setToDate={setToDate}
                        />
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Helper: map product tab name to database item_cat_descr value
const PRODUCT_TO_ITEM_CAT = {
    'ERC': 'Elastic Rail Clips',
    'Sleeper': 'PSC Mainline Sleeper',
    'Rail Pad': 'Rail Pads',
};

// Helper function to filter records by the correct item category for the selected product
const getFilteredRecordsByProduct = (data, product) => {
    if (!data || !Array.isArray(data)) return [];
    const category = PRODUCT_TO_ITEM_CAT[product] || 'Elastic Rail Clips';
    return data.filter(po => po.itemCatDescr === category);
};

export default RailwayBoardDashboard;
