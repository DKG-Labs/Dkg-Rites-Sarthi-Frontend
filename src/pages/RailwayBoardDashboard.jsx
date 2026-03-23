import React, { useState, useEffect } from 'react';
import reportService from '../services/reportService';
import useReportData from '../hooks/useReportData';
import './RailwayBoardDashboard.css';

// Components
import DashboardHeader from '../components/railway-board/DashboardHeader';
import FilterBar from '../components/railway-board/FilterBar';
import KPIGrid from '../components/railway-board/KPIGrid';
import { Level1Row } from '../components/railway-board/LevelRows';
import Pagination from '../components/Pagination';
import DashboardGraph from '../components/railway-board/DashboardGraph';
import ProfessionalCardSection from '../components/railway-board/ProfessionalCardSection';
import ProductToggle from '../components/railway-board/ProductToggle';

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

    // Initialize dates with current month range to avoid backend HTTP 500 errors for required parameters
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [toDate, setToDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    const trendParams = React.useMemo(() => ({
        startDate: fromDate,
        endDate: toDate
    }), [fromDate, toDate]);

    // Level 1 Data Fetching - Only fetch when "PO Lifecycle" tab is active
    const { data: reportData = [] } = useReportData(reportService.getLevel1Report, activeMainCard === 'lifecycle' ? null : undefined);

    // Summary Data Fetching - Default tab, fetch when active
    const { data: summaryData } = useReportData(reportService.getDashboardSummary, activeMainCard === 'summary' ? null : undefined);

    const { data: inspectionCallStatusData } = useReportData(reportService.getInspectionCallStatus, activeMainCard === 'summary' ? null : undefined);

    const { data: inspectionDetailsData } = useReportData(reportService.getInspectionDetails, activeMainCard === 'summary' ? trendParams : undefined);

    // Quality Rejection Data Fetching
    const { data: qualityRejectionData } = useReportData(reportService.getQualityRejection, activeMainCard === 'quality' ? null : undefined);

    const { data: manufacturerRejectionData } = useReportData(reportService.getManufacturerRejection, activeMainCard === 'quality' ? null : undefined);

    const { data: stepWiseRejectionData } = useReportData(reportService.getManufacturingStepWiseRejection, activeMainCard === 'quality' ? null : undefined);

    const { data: processPerformanceData } = useReportData(reportService.getProcessPerformance, activeMainCard === 'quality' ? null : undefined);

    const { data: paretoAnalysisData } = useReportData(reportService.getParetoAnalysis, activeMainCard === 'quality' ? null : undefined);

    // Filter State with Persistence (Normalized 'all' for internal state)
    const [selectedProduct, setSelectedProduct] = useState(() => {
        const val = localStorage.getItem('dash_selectedProduct');
        return (val === 'All' || !val || val === 'all') ? 'ERC' : val;
    });
    const [selectedZone, setSelectedZone] = useState(() => {
        const val = localStorage.getItem('dash_selectedZone');
        return (val === 'All' || !val) ? 'all' : val;
    });
    const [selectedVendor, setSelectedVendor] = useState(() => {
        const val = localStorage.getItem('dash_selectedVendor');
        return (val === 'All' || val === 'All Vendors' || !val) ? 'all' : val;
    });
    const [selectedRio, setSelectedRio] = useState(() => {
        const val = localStorage.getItem('dash_selectedRio');
        return (val === 'All' || val === 'All RIOs' || !val) ? 'all' : val;
    });


    const { data: monthlyRejectionTrendData } = useReportData(
        reportService.getMonthlyRejectionTrend,
        activeMainCard === 'quality' ? trendParams : undefined
    );


    // Save Filters
    React.useEffect(() => { localStorage.setItem('dash_selectedProduct', selectedProduct); }, [selectedProduct]);
    React.useEffect(() => { localStorage.setItem('dash_selectedZone', selectedZone); }, [selectedZone]);
    React.useEffect(() => { localStorage.setItem('dash_selectedVendor', selectedVendor); }, [selectedVendor]);
    React.useEffect(() => { localStorage.setItem('dash_selectedRio', selectedRio); }, [selectedRio]);

    const [activeKpi, setActiveKpi] = useState('total_po');

    // Performance Matrix State
    const [perfPage, setPerfPage] = useState(0);
    const [perfRowsPerPage, setPerfRowsPerPage] = useState(10);

    // Performance Data Fetching
    const perfParams = React.useMemo(() => ({
        page: perfPage,
        size: perfRowsPerPage,
        startDate: fromDate,
        endDate: toDate,
        rio: selectedRio !== 'all' ? selectedRio : undefined,
        zone: selectedZone !== 'all' ? selectedZone : undefined,
        vendor: selectedVendor !== 'all' ? selectedVendor : undefined
    }), [perfPage, perfRowsPerPage, fromDate, toDate, selectedRio, selectedZone, selectedVendor]);

    const { data: perfData, pagination: perfPagination, loading: perfLoading } = useReportData(
        reportService.getPerformanceMatrix,
        (activeMainCard === 'performance' || activeMainCard === 'summary') ? perfParams : undefined
    );

    // Monthly Progress Report (MPR) State
    const [mprPage, setMprPage] = useState(0);
    const [mprRowsPerPage, setMprRowsPerPage] = useState(10);

    // MPR Data Fetching
    const mprParams = React.useMemo(() => ({
        page: mprPage,
        size: mprRowsPerPage,
        startDate: fromDate,
        endDate: toDate,
        rio: selectedRio !== 'all' ? selectedRio : undefined,
        zone: selectedZone !== 'all' ? selectedZone : undefined,
        vendor: selectedVendor !== 'all' ? selectedVendor : undefined
    }), [mprPage, mprRowsPerPage, fromDate, toDate, selectedRio, selectedZone, selectedVendor]);

    const { data: mprData, pagination: mprPagination, loading: mprLoading } = useReportData(
        reportService.getMonthlyProgressReport,
        activeMainCard === 'reports' ? mprParams : undefined
    );

    // Monthly Analysis of Units (MAU) State
    const [mauPage, setMauPage] = useState(0);
    const [mauRowsPerPage, setMauRowsPerPage] = useState(10);

    // MAU Data Fetching
    const mauParams = React.useMemo(() => ({
        page: mauPage,
        size: mauRowsPerPage,
        startDate: fromDate,
        endDate: toDate,
        rio: selectedRio !== 'all' ? selectedRio : undefined,
        zone: selectedZone !== 'all' ? selectedZone : undefined,
        vendor: selectedVendor !== 'all' ? selectedVendor : undefined
    }), [mauPage, mauRowsPerPage, fromDate, toDate, selectedRio, selectedZone, selectedVendor]);

    const { data: mauData, pagination: mauPagination, loading: mauLoading } = useReportData(
        reportService.getMonthlyAnalysisOfUnits,
        activeMainCard === 'reports' ? mauParams : undefined
    );

    // Lot Wise Closed Loop (LWCL) State
    const [lwclCallNo, setLwclCallNo] = useState('');
    const [lwclLotNo, setLwclLotNo] = useState('');
    const [lwclRequestIds, setLwclRequestIds] = useState([]);
    const [lwclLotNumbers, setLwclLotNumbers] = useState([]);

    useEffect(() => {
        const fetchIds = async () => {
            if (!fromDate || !toDate) return;
            try {
                const response = await reportService.getRequestIds({ startDate: fromDate, endDate: toDate });
                // Handle both wrapped and direct responses
                const data = response.responseData || response;
                if (data && Array.isArray(data)) {
                    setLwclRequestIds(data);
                }
            } catch (error) {
                console.error("Error fetching request IDs:", error);
            }
        };
        fetchIds();
    }, [fromDate, toDate]);

    // Fetch Lot Numbers when Call No changes
    useEffect(() => {
        const fetchLots = async () => {
            if (!lwclCallNo) {
                setLwclLotNumbers([]);
                setLwclLotNo('');
                return;
            }
            try {
                const response = await reportService.getLotNumbers(lwclCallNo);
                // Handle both wrapped and direct responses
                const data = response.responseData || response;
                if (data && Array.isArray(data)) {
                    setLwclLotNumbers(data);
                }
            } catch (error) {
                console.error("Error fetching lot numbers:", error);
            }
        };
        fetchLots();
    }, [lwclCallNo]);

    // LWCL Data Fetching
    const lwclParams = React.useMemo(() => ({
        callNo: lwclCallNo,
        lotNo: lwclLotNo
    }), [lwclCallNo, lwclLotNo]);

    // Memoized LWCL fetch function to prevent infinite update depth error
    const fetchLwclData = React.useCallback(async (params) => {
        if (!params || !params.callNo || !params.lotNo) {
            // Return empty successful response if required parameters are missing
            return { responseStatus: { statusCode: 0 }, responseData: [] };
        }
        return reportService.getLotClosedLoop(params);
    }, []);

    // LWCL Data Fetching using memoized function and params
    const { data: lwclData, loading: lwclLoading } = useReportData(fetchLwclData, lwclParams);

    // --- NEW: 4th Level Report (Process Defect Summary) State & Fetching ---
    const [level4Data, setLevel4Data] = useState([]);
    const [level4Loading, setLevel4Loading] = useState(false);

    useEffect(() => {
        const fetchLevel4Report = async () => {
            if (!lwclCallNo) {
                setLevel4Data([]);
                return;
            }
            try {
                setLevel4Loading(true);
                const response = await reportService.getLevel4Report(lwclCallNo);
                const data = response.responseData || response;
                if (data && Array.isArray(data)) {
                    setLevel4Data(data);
                } else {
                    setLevel4Data([]);
                }
            } catch (error) {
                console.error("Error fetching 4th Level Report:", error);
                setLevel4Data([]);
            } finally {
                setLevel4Loading(false);
            }
        };

        if (activeMainCard === 'reports') {
            fetchLevel4Report();
        }
    }, [lwclCallNo, activeMainCard]);

    // Toggle Handlers
    const togglePo = (poNo) => {
        if (expandedPo === poNo) {
            setExpandedPo(null);
            setExpandedSerial(null);
            setExpandedCall(null);
        } else {
            setExpandedPo(poNo);
            setExpandedSerial(null); // Collapse child levels when changing parent
        }
    };

    const toggleSerial = (poNo, serialId) => {
        const compositeId = `${poNo}_${serialId}`;
        if (expandedSerial === compositeId) {
            setExpandedSerial(null);
            setExpandedCall(null);
        } else {
            setExpandedSerial(compositeId);
            setExpandedCall(null);
        }
    };

    const toggleCall = (callId) => {
        if (expandedCall === callId) {
            setExpandedCall(null);
        } else {
            setExpandedCall(callId);
        }
    };

    // Pagination Logic
    const handleChangePage = (newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (newRows) => {
        setRowsPerPage(newRows);
    };

    // Advanced Filtering Logic
    const filteredData = reportData || [];
    const count = filteredData.length;
    const paginatedData = filteredData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    // REMOVED: Early return loading/error blocks to allow dashboard shell to render immediately.
    // Data-specific loading states are now handled within their respective sections.

    // Capture the existing PO table as a prop
    const poTable = (
        <div className="content-card-integrated">
            <div className="table-responsive">
                <table className="data-table main-table level-1-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Sl No.</th>
                            <th>Rly</th>
                            <th>PO No.</th>
                            <th>PO Date</th>
                            <th>Vendor</th>
                            <th>Region</th>
                            <th>PO Qty</th>
                            <th>Acc Qty</th>
                            <th>Bal Qty</th>
                            <th>RM %</th>
                            <th>Proc %</th>
                            <th>Final %</th>
                            {/* <th>Status</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((po, index) => (
                            <Level1Row
                                key={po.poNo || po.id}
                                po={po}
                                index={(page * rowsPerPage) + index}
                                expandedPo={expandedPo}
                                togglePo={togglePo}
                                expandedSerial={expandedSerial}
                                toggleSerial={toggleSerial}
                                expandedCall={expandedCall}
                                toggleCall={toggleCall}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Level 1 Pagination - Only show if no PO is expanded */}
            {!expandedPo && (
                <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(count / rowsPerPage)}
                    start={page * rowsPerPage}
                    end={Math.min((page + 1) * rowsPerPage, count)}
                    totalCount={count}
                    onPageChange={handleChangePage}
                    rows={rowsPerPage}
                    onRowsChange={handleChangeRowsPerPage}
                />
            )}
        </div>
    );

    // Capture the existing graph as a prop
    const poGraph = <DashboardGraph liveData={reportData} />;

    // Capture the existing KPI grid as a prop
    const kpiGrid = (
        <KPIGrid
            activeKpi={activeKpi}
            setActiveKpi={setActiveKpi}
        />
    );

    return (
        <div className="railway-dashboard-container">
            <DashboardHeader />

            <ProductToggle
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
            />

            <FilterBar
                selectedZone={selectedZone}
                setSelectedZone={setSelectedZone}
                selectedVendor={selectedVendor}
                setSelectedVendor={setSelectedVendor}
                selectedRio={selectedRio}
                setSelectedRio={setSelectedRio}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            />

            {/* Integration of ProfessionalCardSection with deferred tab loading */}
            <ProfessionalCardSection
                poTable={poTable}
                poGraph={poGraph}
                kpiGrid={kpiGrid}
                selectedProduct={selectedProduct}
                summaryData={summaryData}
                inspectionCallStatusData={inspectionCallStatusData}
                inspectionDetailsData={inspectionDetailsData}
                activeMainCard={activeMainCard}
                setActiveMainCard={setActiveMainCard}
                // Quality Rejection Prop
                qualityRejectionData={qualityRejectionData}
                manufacturerRejectionData={manufacturerRejectionData}
                stepWiseRejectionData={stepWiseRejectionData}
                processPerformanceData={processPerformanceData}
                paretoAnalysisData={paretoAnalysisData}
                monthlyRejectionTrendData={monthlyRejectionTrendData}
                // Performance Matrix Props
                perfData={perfData}
                perfLoading={perfLoading}
                perfPagination={perfPagination}
                perfPage={perfPage}
                setPerfPage={setPerfPage}
                perfRowsPerPage={perfRowsPerPage}
                setPerfRowsPerPage={setPerfRowsPerPage}
                // Monthly Progress Report Props
                mprData={mprData}
                mprLoading={mprLoading}
                mprPagination={mprPagination}
                mprPage={mprPage}
                setMprPage={setMprPage}
                mprRowsPerPage={mprRowsPerPage}
                setMprRowsPerPage={setMprRowsPerPage}
                // Monthly Analysis of Units Props
                mauData={mauData}
                mauLoading={mauLoading}
                mauPagination={mauPagination}
                mauPage={mauPage}
                setMauPage={setMauPage}
                mauRowsPerPage={mauRowsPerPage}
                setMauRowsPerPage={setMauRowsPerPage}
                // Lot Wise Closed Loop Props
                lwclData={lwclData}
                lwclLoading={lwclLoading}
                lwclCallNo={lwclCallNo}
                setLwclCallNo={setLwclCallNo}
                lwclLotNo={lwclLotNo}
                setLwclLotNo={setLwclLotNo}
                lwclRequestIds={lwclRequestIds}
                lwclLotNumbers={lwclLotNumbers}
                // NEW: Level 4 Report Props
                level4Data={level4Data}
                level4Loading={level4Loading}
            />
        </div>
    );
};


export default RailwayBoardDashboard;
