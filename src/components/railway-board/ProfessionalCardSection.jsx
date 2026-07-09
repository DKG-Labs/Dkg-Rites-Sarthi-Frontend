import React, { useState, useEffect } from 'react'; // Re-adding hooks
import { Select, Skeleton } from 'antd';
import { ExportButton, downloadExcel } from './SharedComponents';
import reportService from '../../services/reportService';
import Pagination from '../Pagination';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, Line, ComposedChart, AreaChart, Area, LabelList
} from 'recharts';
import { formatDecimal } from '../../utils/helpers';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';
import './ProfessionalCardSection.css';
import './InspectionStackedCharts.css';
import './PerformanceMatrixTheme.css';
import FeedbackSection from './FeedbackSection';
import SleeperSummary from './sleeper-board/SleeperSummary';
import SleeperQuality from './sleeper-board/SleeperQuality';
import SleeperLifecycle from './sleeper-board/SleeperLifecycle';
import SleeperMauReport from './sleeper-board/SleeperMauReport';
import SleeperMprReport from './sleeper-board/SleeperMprReport';
import SleeperLwclReport from './sleeper-board/SleeperLwclReport';
import SleeperScadaMonitor from './sleeper-board/SleeperScadaMonitor';
import SleeperPerformance from './sleeper-board/SleeperPerformance';
import SleeperQualityReport from './sleeper-board/SleeperQualityReport';
import RailPadSummary from './railpad-board/RailPadSummary';
import RailPadQuality from './railpad-board/RailPadQuality';
import RailPadLifecycle from './railpad-board/RailPadLifecycle';
import RailPadPerformance from './railpad-board/RailPadPerformance';
import RailPadMprReport from './railpad-board/RailPadMprReport';
import RailPadMauReport from './railpad-board/RailPadMauReport';
import RailPadLwcpReport from './railpad-board/RailPadLwcpReport';
import RailPadSwpReport from './railpad-board/RailPadSwpReport';
import RailPadVwpqrReport from './railpad-board/RailPadVwpqrReport';
import RailPadQualityReport from './railpad-board/RailPadQualityReport';
import ShiftWiseProductionReport from './ShiftWiseProductionReport';
import PoWiseMonthlyReport from './PoWiseMonthlyReport';
import SleeperShiftWiseProductionReport from './sleeper-board/SleeperShiftWiseProductionReport';
import SqcAnalysis from './SqcAnalysis';
import PoIssuedModal from './PoIssuedModal';
import InspectionCallStatusModal from './InspectionCallStatusModal';
import SleeperAnomalyDiagnostics from './sleeper-anomaly/SleeperAnomalyDiagnostics';
import DownloadIcAnnexures from './DownloadIcAnnexures';

const { Option } = Select;

const formatPoDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

// --- Static Data moved outside component to fix ESLint re-render warnings ---
const staticInspectionCallsData = [
    { name: 'Total', under: 90, pending: 12 },
    { name: 'RM', under: 38, pending: 5 },
    { name: 'Process', under: 30, pending: 4 },
    { name: 'Final', under: 22, pending: 3 },
];

const staticInspectionDetailsData = [
    { name: 'Total', accepted: 8957, rejected: 406 },
    { name: 'RM', accepted: 3200, rejected: 145 },
    { name: 'Process', accepted: 3100, rejected: 160 },
    { name: 'Final', accepted: 2657, rejected: 101 },
];

const ProfessionalCardSection = ({
    poTable,
    poGraph,
    kpiGrid,
    selectedProduct,
    summaryData,
    inspectionCallStatusData = [],
    inspectionDetailsData = [],
    activeMainCard,
    setActiveMainCard,
    qualityRejectionData = [],
    manufacturerRejectionData = [],
    stepWiseRejectionData = [],
    processPerformanceData = { topPerforming: [], worstPerforming: [] },
    paretoAnalysisData = [],
    monthlyRejectionTrendData = [],
    // New Performance Matrix Props from API
    perfData = [],
    perfLoading = false,
    perfError = null,
    perfPagination = { totalElements: 0, totalPages: 0 },
    perfPage = 0,
    setPerfPage = () => { },
    perfRowsPerPage = 10,
    setPerfRowsPerPage = () => { },
    // New Monthly Progress Report Props from API
    mprData = [],
    mprLoading = false,
    mprPagination = { totalElements: 0, totalPages: 0 },
    mprPage = 0,
    setMprPage = () => { },
    mprRowsPerPage = 10,
    setMprRowsPerPage = () => { },
    // New Monthly Analysis of Units Props from API
    mauData = [],
    mauLoading = false,
    mauPagination = { totalElements: 0, totalPages: 0 },
    mauPage = 0,
    setMauPage = () => { },
    mauRowsPerPage = 10,
    setMauRowsPerPage = () => { },
    // New Lot Wise Closed Loop Props from API
    lwclData = [],
    lwclLoading = false,
    lwclCallNo = '',
    setLwclCallNo = () => { },
    lwclLotNo = '',
    setLwclLotNo = () => { },
    lwclRequestIds = [],
    lwclLotNumbers = [],
    lwclManufacturer = '',
    setLwclManufacturer = () => { },
    lwclManufacturersList = [],
    lwclPoNo = '',
    setLwclPoNo = () => { },
    lwclPoNumbersList = [],
    // NEW: Level 4 Report Props
    level4Data = [],
    level4Loading = false,
    activeReportFromParent = 'mpr',
    setSelectedProduct = () => { },
    // New Manufacture Process Inspection Analysis Props from API
    mpiaData = [],
    mpiaLoading = false,
    mpiaPagination = { totalElements: 0, totalPages: 0 },
    mpiaPage = 0,
    setMpiaPage = () => { },
    mpiaRowsPerPage = 10,
    setMpiaRowsPerPage = () => { },
    onReportTabChange = () => { },
    fromDate,
    toDate,
    setFromDate = () => { },
    setToDate = () => { }
}) => {
    // Map selectedProduct to summary data keys
    const getSummaryKey = (prod) => {
        if (!prod || prod === 'all') return 'erc';
        const p = prod.toLowerCase();
        if (p.includes('erc')) return 'erc';
        if (p.includes('sleeper')) return 'sleeper';
        if (p.includes('rail pad') || p.includes('railpad')) return 'railpad';
        return 'erc'; // Default
    };

    getSummaryKey(selectedProduct);
    const [activeReport, setActiveReport] = useState(activeReportFromParent || 'mpr');
    const [drilldownManufacturer, setDrilldownManufacturer] = useState(null);
    const [drilldownData, setDrilldownData] = useState([]);
    const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);

    // PO Issued Modal State
    const [isPoModalOpen, setIsPoModalOpen] = useState(false);
    const [poModalData, setPoModalData] = useState([]);

    // Global Filters State
    const [filterMode, setFilterMode] = useState('zonalwise'); // 'vendorwise' or 'zonalwise'
    const [vendorPlants, setVendorPlants] = useState([]);
    const [zonalRailways, setZonalRailways] = useState([]);
    const [selectedVendorPlant, setSelectedVendorPlant] = useState('');
    const [selectedZonalRailway, setSelectedZonalRailway] = useState('');
    // Helper to get Current Financial Year start and end dates
    const getCurrentFY = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0 = Jan, 3 = Apr
        const startYear = month >= 3 ? year : year - 1;
        return {
            start: `${startYear}-04-01`,
            end: today.toISOString().split('T')[0]
        };
    };

    const initialFY = getCurrentFY();
    const [filterStartDate, setFilterStartDate] = useState(initialFY.start);
    const [filterEndDate, setFilterEndDate] = useState(initialFY.end);
    const [dateFilterType, setDateFilterType] = useState('current_fy');

    // Auto-calculate dates when preset dropdown changes
    useEffect(() => {
        if (dateFilterType === 'custom') return; // Do nothing for custom
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        if (dateFilterType === 'current_fy') {
            const fy = getCurrentFY();
            setFilterStartDate(fy.start);
            setFilterEndDate(fy.end);
        } else if (dateFilterType === 'last_1_month') {
            const d = new Date();
            d.setMonth(today.getMonth() - 1);
            setFilterStartDate(d.toISOString().split('T')[0]);
            setFilterEndDate(todayStr);
        } else if (dateFilterType === 'last_3_months') {
            const d = new Date();
            d.setMonth(today.getMonth() - 3);
            setFilterStartDate(d.toISOString().split('T')[0]);
            setFilterEndDate(todayStr);
        } else if (dateFilterType === 'last_6_months') {
            const d = new Date();
            d.setMonth(today.getMonth() - 6);
            setFilterStartDate(d.toISOString().split('T')[0]);
            setFilterEndDate(todayStr);
        }
    }, [dateFilterType]);

    
    // IC Issued State
    const [icIssuedData, setIcIssuedData] = useState({ total: 0, rmCount: 0, processCount: 0, finalCount: 0 });
    const [isIcIssuedModalOpen, setIsIcIssuedModalOpen] = useState(false);
    const [localInspectionCallStatus, setLocalInspectionCallStatus] = useState([]);
    const [localInspectionDetails, setLocalInspectionDetails] = useState([]);
    const [localAvgProduction, setLocalAvgProduction] = useState(null);
    const [localSummaryData, setLocalSummaryData] = useState(null);
    const [totalCallsData, setTotalCallsData] = useState(null);

    // Initial fetch based on filterMode
    useEffect(() => {
        const fetchInitialOptions = async () => {
            try {
                if (filterMode === 'vendorwise') {
                    const response = await reportService.getVendorPlants();
                    const data = response.responseData || response.data || response;
                    if (Array.isArray(data)) {
                        const filteredData = data.filter(vp => !vp.companyName?.toLowerCase().includes('dummy'));
                        const sortedData = [...filteredData].sort((a, b) => 
                            (a.companyName || '').localeCompare(b.companyName || '')
                        );
                        setVendorPlants(sortedData);
                    }
                } else {
                    const response = await reportService.getAllZonalRailways();
                    const data = response.responseData || response.data || response;
                    if (Array.isArray(data)) {
                        const sortedData = [...data].sort((a, b) => 
                            (a || '').localeCompare(b || '')
                        );
                        setZonalRailways(sortedData);
                    }
                }
            } catch (error) {
                console.error("Error fetching initial options:", error);
            }
        };
        
        // Reset selections when mode changes
        setSelectedVendorPlant('');
        setSelectedZonalRailway('');
        
        fetchInitialOptions();
    }, [filterMode]);

    // Dependent fetch: Zonal Railways based on selected Vendor Plant
    useEffect(() => {
        if (filterMode !== 'vendorwise') return;
        const fetchZonalRailways = async () => {
            setSelectedZonalRailway(''); // Reset dependent dropdown
            if (!selectedVendorPlant) {
                setZonalRailways([]);
                return;
            }
            try {
                const response = await reportService.getZonalRailways(selectedVendorPlant);
                const data = response.responseData || response.data || response;
                if (Array.isArray(data)) {
                    const sortedData = [...data].sort((a, b) => 
                        (a || '').localeCompare(b || '')
                    );
                    setZonalRailways(sortedData);
                }
            } catch (error) {
                console.error("Error fetching zonal railways:", error);
            }
        };
        fetchZonalRailways();
    }, [selectedVendorPlant, filterMode]);

    // Dependent fetch: Vendor Plants based on selected Zonal Railway
    useEffect(() => {
        if (filterMode !== 'zonalwise') return;
        const fetchVendorPlants = async () => {
            setSelectedVendorPlant(''); // Reset dependent dropdown
            if (!selectedZonalRailway) {
                setVendorPlants([]);
                return;
            }
            try {
                const response = await reportService.getVendorPlantsByZone(selectedZonalRailway);
                const data = response.responseData || response.data || response;
                if (Array.isArray(data)) {
                    const filteredData = data.filter(vp => !vp.companyName?.toLowerCase().includes('dummy'));
                    const sortedData = [...filteredData].sort((a, b) => 
                        (a.companyName || '').localeCompare(b.companyName || '')
                    );
                    setVendorPlants(sortedData);
                }
            } catch (error) {
                console.error("Error fetching vendor plants by zone:", error);
            }
        };
        fetchVendorPlants();
    }, [selectedZonalRailway, filterMode]);

    const [isDashboardLoading, setIsDashboardLoading] = useState(false);

    // Fetch All Dashboard Data
    useEffect(() => {
        const fetchAllDashboardData = async () => {
            setIsDashboardLoading(true);
            try {
                const minLoadingPromise = new Promise(resolve => setTimeout(resolve, 500));
                
                const isPrimaryFilterApplied = filterMode === 'vendorwise' ? !!selectedVendorPlant : !!selectedZonalRailway;
                
                const params = {
                    vendorPlantCode: selectedVendorPlant,
                    vendor: selectedVendorPlant,
                    zonalRailway: selectedZonalRailway,
                    zone: selectedZonalRailway,
                    startDate: isPrimaryFilterApplied ? filterStartDate : '',
                    endDate: isPrimaryFilterApplied ? filterEndDate : ''
                };

                const [
                    icIssuedRes,
                    callStatusRes,
                    detailsRes,
                    avgProdRes,
                    summaryRes
                ] = await Promise.all([
                    reportService.getIcIssuedCounts(params).catch(e => { console.error(e); return null; }),
                    reportService.getInspectionCallStatus(params).catch(e => { console.error(e); return null; }),
                    reportService.getInspectionDetails(params).catch(e => { console.error(e); return null; }),
                    reportService.getAvgProductionPerDay(
                        selectedVendorPlant,
                        selectedZonalRailway,
                        isPrimaryFilterApplied ? filterStartDate : '',
                        isPrimaryFilterApplied ? filterEndDate : ''
                    ).catch(e => { console.error(e); return null; }),
                    reportService.getDashboardSummary({ vendor: selectedVendorPlant, zone: selectedZonalRailway }).catch(e => { console.error(e); return null; }),
                    minLoadingPromise
                ]);

                if (icIssuedRes) {
                    const data = icIssuedRes.responseData || icIssuedRes.data || icIssuedRes;
                    if (data) setIcIssuedData(data);
                }
                
                if (callStatusRes) {
                    const data = callStatusRes.responseData || callStatusRes.data || callStatusRes;
                    if (data && Array.isArray(data)) setLocalInspectionCallStatus(data);
                }

                if (detailsRes) {
                    const data = detailsRes.responseData || detailsRes.data || detailsRes;
                    if (data && Array.isArray(data)) setLocalInspectionDetails(data);
                }

                if (avgProdRes) {
                    const data = avgProdRes.responseData ?? avgProdRes.data ?? avgProdRes;
                    setLocalAvgProduction(data);
                }

                if (summaryRes) {
                    const data = summaryRes.responseData ?? summaryRes.data ?? summaryRes;
                    if (data) setLocalSummaryData(data);
                }

            } catch (error) {
                console.error("Error in dashboard Promise.all:", error);
            } finally {
                setIsDashboardLoading(false);
            }
        };

        fetchAllDashboardData();
    }, [selectedVendorPlant, selectedZonalRailway, filterStartDate, filterEndDate, filterMode]);

    useEffect(() => {
        const fetchTotalCalls = async () => {
            try {
                if (getSummaryKey(selectedProduct) !== 'erc') return;
                const isPrimaryFilterApplied = filterMode === 'vendorwise' ? !!selectedVendorPlant : !!selectedZonalRailway;
                const params = {
                    zone: selectedZonalRailway,
                    vendor: selectedVendorPlant,
                    startDate: isPrimaryFilterApplied ? filterStartDate : '',
                    endDate: isPrimaryFilterApplied ? filterEndDate : ''
                };
                const response = await reportService.getErcDashboardTotalCalls(params);
                const data = response?.responseData || response?.data || response;
                if (data) {
                    setTotalCallsData(data);
                }
            } catch (error) {
                console.error("Error fetching total calls:", error);
            }
        };
        fetchTotalCalls();
    }, [selectedProduct, selectedZonalRailway, selectedVendorPlant, filterStartDate, filterEndDate, filterMode]);

    const handlePoIssuedClick = async () => {
        try {
            let itemCatDescr;
            if (selectedProduct === 'Sleeper') {
                itemCatDescr = 'PSC Mainline Sleeper';
            } else if (selectedProduct === 'Rail Pad') {
                itemCatDescr = 'Rail Pads';
            } else {
                itemCatDescr = 'Elastic Rail Clips';
            }
            const response = await reportService.getPoIssuedDetails(
                itemCatDescr, 
                selectedVendorPlant || null, 
                selectedZonalRailway || null, 
                null, 
                null
            );
            const data = response.responseData || response || [];
            setPoModalData(data);
            setIsPoModalOpen(true);
        } catch (error) {
            console.error("Error fetching PO issued details:", error);
        }
    };

    // Inspection Call Status Modal State
    const [isIcModalOpen, setIsIcModalOpen] = useState(false);
    const [icModalData, setIcModalData] = useState([]);
    const [icModalTitle, setIcModalTitle] = useState('');

    const handleInspectionCallClick = async (stage, status) => {
        try {
            const title = `${stage} Stage - ${status}`;
            setIcModalTitle(title);
            const isPrimaryFilterApplied = filterMode === 'vendorwise' ? !!selectedVendorPlant : !!selectedZonalRailway;
            const response = await reportService.getInspectionCallStatusDetails(stage, status, {
                vendor: selectedVendorPlant,
                zone: selectedZonalRailway,
                startDate: isPrimaryFilterApplied ? filterStartDate : '',
                endDate: isPrimaryFilterApplied ? filterEndDate : ''
            });
            const data = response.responseData || response || [];
            setIcModalData(data);
            setIsIcModalOpen(true);
        } catch (error) {
            console.error("Error fetching active call details:", error);
        }
    };

    const handleTotalCallsClick = async (type) => {
        try {
            setIcModalTitle(`Total Calls - ${type}`);
            let response;
            const isPrimaryFilterApplied = filterMode === 'vendorwise' ? !!selectedVendorPlant : !!selectedZonalRailway;
            const filters = {
                vendor: selectedVendorPlant,
                zone: selectedZonalRailway,
                startDate: isPrimaryFilterApplied ? filterStartDate : '',
                endDate: isPrimaryFilterApplied ? filterEndDate : ''
            };
            if (type === 'Open') response = await reportService.getErcDashboardOpenCalls(filters);
            else if (type === 'Under Inspection') response = await reportService.getErcDashboardUnderInspectionCalls(filters);
            else if (type === 'Pending') response = await reportService.getErcDashboardPendingCalls(filters);
            
            const data = response?.responseData || response?.data || response || [];
            setIcModalData(data);
            setIsIcModalOpen(true);
        } catch (error) {
            console.error(`Error fetching ${type} calls:`, error);
        }
    };

    // Fetch Drill-down data when manufacturer is selected
    useEffect(() => {
        if (drilldownManufacturer) {
            const fetchDrilldown = async () => {
                setIsDrilldownLoading(true);
                const end = new Date().toISOString().split('T')[0];
                const start = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
                try {
                    const res = await reportService.getCompanyMonthWiseData({
                        companyName: drilldownManufacturer,
                        startDate: start,
                        endDate: end,
                        page: 0,
                        size: 30
                    });
                    const data = res.responseData?.content || res.content || res || [];
                    setDrilldownData(Array.isArray(data) ? data : []);
                } catch (e) {
                    console.error("Failed to fetch drilldown data:", e);
                    setDrilldownData([]);
                }
                setIsDrilldownLoading(false);
            };
            fetchDrilldown();
        }
    }, [drilldownManufacturer]);

    // States for Reports Searching & Sorting
    const [mprSearch, setMprSearch] = useState('');
    const [mprSort, setMprSort] = useState({ key: null, direction: 'asc' });
    const [mauSearch, setMauSearch] = useState('');
    const [mauSort, setMauSort] = useState({ key: null, direction: 'asc' });
    const [mpiaSearch, setMpiaSearch] = useState('');
    const [mpiaSort, setMpiaSort] = useState({ key: null, direction: 'asc' });

    // Reset pages to 0 when search query changes
    useEffect(() => { setMprPage(0); }, [mprSearch, setMprPage]);
    useEffect(() => { setMauPage(0); }, [mauSearch, setMauPage]);
    useEffect(() => { setMpiaPage(0); }, [mpiaSearch, setMpiaPage]);

    const [isPreparingBatchPdf, setIsPreparingBatchPdf] = useState(false);
    const [batchReportData, setBatchReportData] = useState(null);
    const [batchProgress, setBatchProgress] = useState(0);

    // Sync activeReport with parent navigation
    React.useEffect(() => {
        if (activeReportFromParent) {
            setActiveReport(activeReportFromParent);
            setDrilldownManufacturer(null); // Reset drilldown when tab changes
        }
    }, [activeReportFromParent]);

    // Handle Batch PDF Printing
    React.useEffect(() => {
        if (batchReportData && batchReportData.length > 0) {
            // Give Recharts and React a full second to render all pages/charts off-screen
            const timer = setTimeout(() => {
                window.print();
                // Add an extra delay before clearing to allow print engine to fully capture the DOM
                setTimeout(() => {
                    setBatchReportData(null);
                    setIsPreparingBatchPdf(false);
                }, 1000);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [batchReportData]);

    // States for Performance Matrix Filtering & Sorting
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [perfFilterIe, setPerfFilterIe] = useState('all');
    const [perfFilterStage, setPerfFilterStage] = useState('all');

    // Reset performance page when filters change
    useEffect(() => { setPerfPage(0); }, [perfFilterIe, perfFilterStage, setPerfPage]);

    // Filtered & Sorted MPR Data
    const displayMprData = React.useMemo(() => {
        let result = [...(mprData || [])];
        if (mprSearch) {
            const query = mprSearch.toLowerCase();
            result = result.filter(item =>
                (item.rly || '').toLowerCase().includes(query) ||
                (item.poNumber || '').toLowerCase().includes(query) ||
                (formatPoDate(item.poDate)).toLowerCase().includes(query) ||
                (item.manufacturer || '').toLowerCase().includes(query)
            );
        }
        if (mprSort.key) {
            result.sort((a, b) => {
                const aVal = a[mprSort.key];
                const bVal = b[mprSort.key];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return mprSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
                const aStr = (aVal || '').toString().toLowerCase();
                const bStr = (bVal || '').toString().toLowerCase();
                if (aStr < bStr) return mprSort.direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return mprSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [mprData, mprSearch, mprSort]);

    // Filtered & Sorted MAU Data
    const displayMauData = React.useMemo(() => {
        let result = [...(mauData || [])];
        if (mauSearch) {
            const query = mauSearch.toLowerCase();
            result = result.filter(item =>
                (item.manufacturer || '').toLowerCase().includes(query)
            );
        }
        if (mauSort.key) {
            result.sort((a, b) => {
                const aVal = a[mauSort.key];
                const bVal = b[mauSort.key];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return mauSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
                const aStr = (aVal || '').toString().toLowerCase();
                const bStr = (bVal || '').toString().toLowerCase();
                if (aStr < bStr) return mauSort.direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return mauSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [mauData, mauSearch, mauSort]);

    // Filtered & Sorted MPIA Data
    const displayMpiaData = React.useMemo(() => {
        let result = [...(mpiaData || [])];
        if (mpiaSearch) {
            const query = mpiaSearch.toLowerCase();
            result = result.filter(item =>
                (item.manufacture || '').toLowerCase().includes(query)
            );
        }
        if (mpiaSort.key) {
            result.sort((a, b) => {
                const aVal = a[mpiaSort.key];
                const bVal = b[mpiaSort.key];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return mpiaSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
                const aStr = (aVal || '').toString().toLowerCase();
                const bStr = (bVal || '').toString().toLowerCase();
                if (aStr < bStr) return mpiaSort.direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return mpiaSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [mpiaData, mpiaSearch, mpiaSort]);

    // Calculated data for charts


    // Calculate Stage vs Defect Contribution dynamic data (Top 3 defects for Process stage)
    const stageVsDefectTop3 = React.useMemo(() => {
        if (!paretoAnalysisData || paretoAnalysisData.length === 0) {
            // Visual fallback if no data
            return [
                { name: 'Raw Material' },
                { name: 'Process', 'Turning Dia': 35, 'MPI': 28, 'Full Turning Length': 22 },
                { name: 'Final' }
            ];
        }

        const sorted = [...(paretoAnalysisData || [])].sort((a, b) => (b.count || b.value) - (a.count || a.value));
        const top3 = sorted.slice(0, 3);
        const processStage = { name: 'Process' };
        top3.forEach(d => {
            processStage[d.name] = d.count || d.value;
        });

        return [
            { name: 'Raw Material' },
            processStage,
            { name: 'Final' }
        ];
    }, [paretoAnalysisData]);

    const top3DefectNames = React.useMemo(() => {
        if (!paretoAnalysisData || paretoAnalysisData.length === 0) {
            return ['Turning Dia', 'MPI', 'Full Turning Length'];
        }
        return [...(paretoAnalysisData || [])]
            .sort((a, b) => (b.count || b.value) - (a.count || a.value))
            .slice(0, 3)
            .map(d => d.name);
    }, [paretoAnalysisData]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleMprSort = (key) => {
        let direction = 'asc';
        if (mprSort.key === key && mprSort.direction === 'asc') {
            direction = 'desc';
        }
        setMprSort({ key, direction });
    };

    const handleMauSort = (key) => setMauSort({ key, direction: mauSort.key === key && mauSort.direction === 'asc' ? 'desc' : 'asc' });
    const handleMpiaSort = (key) => setMpiaSort({ key, direction: mpiaSort.key === key && mpiaSort.direction === 'asc' ? 'desc' : 'asc' });

    const getSortedData = (data) => {
        if (!sortConfig.key || !data) return data;
        return [...(data || [])].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle numeric values
            const numA = parseFloat(aValue);
            const numB = parseFloat(bValue);
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
            }

            // Handle strings
            aValue = (aValue || '').toString().toLowerCase();
            bValue = (bValue || '').toString().toLowerCase();
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };


    const renderSortIcon = (key, config) => {
        if (config.key !== key) return <span style={{ opacity: 0.3, marginLeft: '5px', fontSize: '10px' }}>↕</span>;
        return <span style={{ marginLeft: '5px', color: '#10b981', fontSize: '10px' }}>{config.direction === 'asc' ? '▲' : '▼'}</span>;
    };


    const renderSubContent = () => {
        // Under Development Placeholder for non-ERC products
        const product = selectedProduct?.toLowerCase() || '';
        const isSleeper = product.includes('sleeper');
        const isErc = product.includes('erc') || product === 'all' || !product;

        const isRailPad = product.includes('rail pad') || product.includes('railpad');
        const isUnderDev = (!isErc && !isSleeper && !isRailPad) || (isSleeper && activeMainCard !== 'summary' && activeMainCard !== 'quality' && activeMainCard !== 'lifecycle' && activeMainCard !== 'feedback' && activeMainCard !== 'reports' && activeMainCard !== 'scada' && activeMainCard !== 'performance' && activeMainCard !== 'sleeper-anomaly');



        if (isUnderDev) {
            return (
                <div className="under-dev-container fade-in" style={{ padding: '2rem 0' }}>
                    <div className="prof-card" style={{
                        height: '450px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '2px dashed #10b981',
                        borderRadius: '24px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '6rem',
                            marginBottom: '1rem',
                            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
                            animation: 'bounce 2s infinite'
                        }}>{isSleeper ? '📊' : '🏗️'}</div>
                        <h2 style={{ fontSize: '32px', color: '#065f46', marginBottom: '10px' }}>
                            {selectedProduct?.toUpperCase()} {isSleeper ? activeMainCard.toUpperCase() : ''}
                        </h2>
                        <h3 style={{ fontSize: '20px', color: '#059669', marginBottom: '20px', fontWeight: '600' }}>
                            Section Under Development
                        </h3>
                        <p style={{ color: '#475569', maxWidth: '450px', lineHeight: '1.6', fontSize: '15px' }}>
                            We are currently integrating data for this {isSleeper ? 'specific analysis' : 'product line'}.
                            Stay tuned for a complete performance overview soon!
                        </p>
                        <div style={{
                            marginTop: '2rem',
                            padding: '10px 20px',
                            background: '#10b981',
                            color: 'white',
                            borderRadius: '30px',
                            fontWeight: '600',
                            fontSize: '14px',
                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                        }}>
                            Coming Soon
                        </div>
                    </div>
                </div>
            );
        }

        // Client-side filtering logic for Performance Matrix
        const uniqueIes = [...new Set((perfData || []).map(d => d.username))].filter(Boolean).sort();
        const uniqueStages = [...new Set((perfData || []).map(d => d.stage))].filter(Boolean).sort();

        const filteredPerfRecords = (perfData || []).filter(d => {
            const matchIe = perfFilterIe === 'all' || d.username === perfFilterIe;
            const matchStage = perfFilterStage === 'all' || d.stage === perfFilterStage;
            return matchIe && matchStage;
        });

        return (
            <div className="tab-body-wrapper fade-in">
                {(() => {
                    switch (activeMainCard) {
                        case 'summary':
                            if (isSleeper) {
                                return <SleeperSummary summaryData={summaryData} onPoIssuedClick={handlePoIssuedClick} />;
                            }
                            if (isRailPad) {
                                return <RailPadSummary summaryData={summaryData} onPoIssuedClick={handlePoIssuedClick} onInspectionCallClick={handleInspectionCallClick} />;
                            }
                            const s = localSummaryData || summaryData || {};

                            return (
                                <div className="summary-tab-content">
                                    {/* Global Filters for ERC */}
                                    {isErc && (
                                        <div className="global-filters mb" style={{
                                            display: 'flex', gap: '15px', background: '#f8fafc', 
                                            padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                            alignItems: 'center', flexWrap: 'wrap'
                                        }}>
                                            <div style={{ width: '100%', marginBottom: '10px' }}>
                                                <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                                                    <button 
                                                        style={{ 
                                                            padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                                            background: filterMode === 'zonalwise' ? '#fff' : 'transparent',
                                                            color: filterMode === 'zonalwise' ? '#0f172a' : '#64748b',
                                                            boxShadow: filterMode === 'zonalwise' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                            marginRight: '4px'
                                                        }}
                                                        onClick={() => setFilterMode('zonalwise')}
                                                    >
                                                        Zonalwise
                                                    </button>
                                                    <button 
                                                        style={{ 
                                                            padding: '6px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                                            background: filterMode === 'vendorwise' ? '#fff' : 'transparent',
                                                            color: filterMode === 'vendorwise' ? '#0f172a' : '#64748b',
                                                            boxShadow: filterMode === 'vendorwise' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                                        }}
                                                        onClick={() => setFilterMode('vendorwise')}
                                                    >
                                                        Vendor wise
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ flex: '1', minWidth: '220px', order: filterMode === 'vendorwise' ? 1 : 2 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Vendor Plant</label>
                                                <Select 
                                                    showSearch
                                                    allowClear
                                                    placeholder="All Vendor Plants"
                                                    value={selectedVendorPlant || undefined} 
                                                    onChange={(val) => {
                                                        setSelectedVendorPlant(val || '');
                                                        if (filterMode === 'vendorwise') setSelectedZonalRailway('');
                                                    }}
                                                    style={{ width: '100%', height: '36px' }}
                                                    popupMatchSelectWidth={false}
                                                    dropdownStyle={{ maxWidth: '600px' }}
                                                    optionFilterProp="children"
                                                    filterOption={(input, option) =>
                                                        (option?.title ?? '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    disabled={filterMode === 'zonalwise' ? (!selectedZonalRailway || vendorPlants.length === 0) : false}
                                                >
                                                    {vendorPlants.map((vp, i) => (
                                                        <Option 
                                                            key={i} 
                                                            value={vp.poiCode}
                                                            title={`${vp.companyName} - ${vp.unitName} - ${vp.address}`}
                                                        >
                                                            {vp.companyName} - {vp.unitName}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '170px', order: filterMode === 'zonalwise' ? 1 : 2 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Zonal Railway</label>
                                                <Select 
                                                    allowClear
                                                    placeholder="All Zonal Railways"
                                                    value={selectedZonalRailway || undefined} 
                                                    onChange={(val) => {
                                                        setSelectedZonalRailway(val || '');
                                                        if (filterMode === 'zonalwise') setSelectedVendorPlant('');
                                                    }}
                                                    style={{ width: '100%', height: '36px' }}
                                                    popupMatchSelectWidth={false}
                                                    disabled={filterMode === 'vendorwise' ? (!selectedVendorPlant || zonalRailways.length === 0) : false}
                                                >
                                                    {zonalRailways.map((zr, i) => (
                                                        <Option key={i} value={zr}>{zr}</Option>
                                                    ))}
                                                </Select>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '150px', order: 3 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Date Range</label>
                                                <Select 
                                                    value={dateFilterType} 
                                                    onChange={(val) => setDateFilterType(val || 'current_fy')}
                                                    style={{ width: '100%', height: '36px' }}
                                                    disabled={filterMode === 'vendorwise' ? !selectedVendorPlant : !selectedZonalRailway}
                                                >
                                                    <Option value="current_fy">Current Fin. Year</Option>
                                                    <Option value="last_1_month">Last 1 Month</Option>
                                                    <Option value="last_3_months">Last 3 Months</Option>
                                                    <Option value="last_6_months">Last 6 Months</Option>
                                                    <Option value="custom">Custom Range</Option>
                                                </Select>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '130px', order: 4 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>From Date</label>
                                                <input 
                                                    type="date" 
                                                    value={filterStartDate || ''} 
                                                    onChange={(e) => {
                                                        setFilterStartDate(e.target.value);
                                                        setDateFilterType('custom');
                                                    }}
                                                    disabled={filterMode === 'vendorwise' ? !selectedVendorPlant : !selectedZonalRailway}
                                                    style={{ 
                                                        width: '100%', height: '36px', padding: '0 11px', 
                                                        border: '1px solid #d9d9d9', borderRadius: '6px',
                                                        color: 'rgba(0, 0, 0, 0.88)', fontSize: '14px'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ flex: '1', minWidth: '130px', order: 5 }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>To Date</label>
                                                <input 
                                                    type="date" 
                                                    value={filterEndDate || ''} 
                                                    onChange={(e) => {
                                                        setFilterEndDate(e.target.value);
                                                        setDateFilterType('custom');
                                                    }}
                                                    disabled={filterMode === 'vendorwise' ? !selectedVendorPlant : !selectedZonalRailway}
                                                    style={{ 
                                                        width: '100%', height: '36px', padding: '0 11px', 
                                                        border: '1px solid #d9d9d9', borderRadius: '6px',
                                                        color: 'rgba(0, 0, 0, 0.88)', fontSize: '14px'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {isDashboardLoading ? (
                                        <div style={{ marginTop: '10px' }}>
                                            <div className="g4 mb">
                                                <div className="prof-card" style={{ padding: '24px' }}><Skeleton active paragraph={{ rows: 2 }} title={false} /></div>
                                                <div className="prof-card" style={{ padding: '24px' }}><Skeleton active paragraph={{ rows: 2 }} title={false} /></div>
                                                <div className="prof-card" style={{ padding: '24px' }}><Skeleton active paragraph={{ rows: 2 }} title={false} /></div>
                                                <div className="prof-card" style={{ padding: '24px' }}><Skeleton active paragraph={{ rows: 2 }} title={false} /></div>
                                            </div>
                                            <div className="g4 mb">
                                                <div className="prof-card" style={{ padding: '24px', gridColumn: 'span 2' }}><Skeleton active paragraph={{ rows: 4 }} title={false} /></div>
                                                <div className="prof-card" style={{ padding: '24px', gridColumn: 'span 2' }}><Skeleton active paragraph={{ rows: 4 }} title={false} /></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                        <div className="g3 mb">
                                        <div className="prof-card card-dark-green"
                                            style={{ textAlign: 'center', cursor: 'pointer' }}
                                            onClick={handlePoIssuedClick}
                                        >
                                            <div className="kpi-lbl">PO Issued</div>
                                            <div className="kpi-val">{(s.poIssued ?? 0)}</div>
                                            <div className="kpi-sub">Nos.</div>
                                        </div>
                                        <div className="prof-card card-ocean" style={{ textAlign: 'center' }}>
                                            <div className="kpi-lbl">PO Quantity</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                                <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '4px' }}>
                                                    <div className="kpi-val" style={{ fontSize: '26px' }}>{(s.poQuantityNos || 0)}</div>
                                                    <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                                                </div>
                                                <div style={{ paddingLeft: '4px' }}>
                                                    <div className="kpi-val" style={{ fontSize: '26px' }}>{(s.poQuantityMt || 0)}</div>
                                                    <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>MT</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="prof-card card-indigo" style={{ textAlign: 'center' }}>
                                            <div className="kpi-lbl">Final Inspection Qty</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                                <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '4px' }}>
                                                    <div className="kpi-val" style={{ fontSize: '26px' }}>{(s.finalInspectionQuantity || 0)}</div>
                                                    <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                                                </div>
                                                <div style={{ paddingLeft: '4px' }}>
                                                    <div className="kpi-val" style={{ fontSize: '26px' }}>-</div>
                                                    <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>MT</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </div>

                                    <div className="sec-title-flex" style={{ marginBottom: '12px', marginTop: '10px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>Stagewise Inspection Call Status</span>
                                    </div>
                                    <div className="g5 mb">
                                        <div className="prof-card" style={{ padding: '15px', borderLeft: '4px solid #3b82f6', background: '#eff6ff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Total Calls</span>
                                                <span className="prof-badge" style={{ background: '#bfdbfe', color: '#1e3a8a', fontSize: '10px' }}>Nos.</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', textAlign: 'center' }}>
                                                <div onClick={() => handleTotalCallsClick('Open')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.7)', padding: '8px 4px', borderRadius: '6px', transition: 'all 0.2s', flex: 1 }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'} title="Click to view Open calls">
                                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', lineHeight: '1.2', marginBottom: '4px' }}>TOTAL<br/>OPEN</span>
                                                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>{totalCallsData?.totalOpenCalls || 0}</span>
                                                </div>
                                                <div onClick={() => handleTotalCallsClick('Under Inspection')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.7)', padding: '8px 4px', borderRadius: '6px', transition: 'all 0.2s', flex: 1 }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'} title="Click to view Under Inspection calls">
                                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', lineHeight: '1.2', marginBottom: '4px' }}>UNDER<br/>INSPECTION</span>
                                                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>{totalCallsData?.totalUnderInspectionCalls || 0}</span>
                                                </div>
                                                <div onClick={() => handleTotalCallsClick('Pending')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.7)', padding: '8px 4px', borderRadius: '6px', transition: 'all 0.2s', flex: 1 }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'} title="Click to view Pending calls">
                                                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', lineHeight: '1.2', marginBottom: '4px' }}>PENDING<br/>CALLS</span>
                                                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>{totalCallsData?.totalPendingCalls || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {[{ id: 'RM', label: 'Raw Material' }, { id: 'Process', label: 'Process' }, { id: 'Final', label: 'Final Product' }].map((catObj, idx) => {
                                            const cat = catObj.id;
                                            const activeData = localInspectionCallStatus?.length > 0 ? localInspectionCallStatus : (inspectionCallStatusData?.length > 0 ? inspectionCallStatusData : staticInspectionCallsData);
                                            const d = activeData.find(x => x.name === cat || x.category === cat);
                                            return (
                                                <div className="prof-card" key={idx} style={{
                                                    padding: '15px',
                                                    borderLeft: cat === 'RM' ? '4px solid #3b82f6' : cat === 'Process' ? '4px solid #f59e0b' : '4px solid #ef4444',
                                                    background: cat === 'RM' ? '#eff6ff' : cat === 'Process' ? '#fff7ed' : '#fef2f2'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>{catObj.label}</span>
                                                        <span className="prof-badge" style={{ background: '#f8fafc', color: '#64748b', fontSize: '10px' }}>CALLS</span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        <div
                                                            style={{ cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                                                            onClick={() => handleInspectionCallClick(cat, 'Under Inspection')}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                            title="Click to view Under Inspection calls"
                                                        >
                                                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>UNDER INSPECTION</div>
                                                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{d?.under || '0'}</div>
                                                        </div>
                                                        <div
                                                            style={{ textAlign: 'right', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                                                            onClick={() => handleInspectionCallClick(cat, 'Pending')}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                            title="Click to view Pending calls"
                                                        >
                                                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>PENDING</div>
                                                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{d?.pending || '0'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* IC ISSUED Card moved to the right */}
                                        <div className="prof-card card-gold" 
                                             style={{ textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                             onClick={() => setIsIcIssuedModalOpen(true)}
                                             title="Click to view stage-wise breakdown"
                                        >
                                            <div className="kpi-lbl">IC Issued</div>
                                            <div style={{ marginTop: '12px' }}>
                                                <div className="kpi-val" style={{ fontSize: '32px' }}>{(icIssuedData.total || 0)}</div>
                                                <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>Total Calls</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sec-title-flex" style={{ marginBottom: '12px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>Inspection Details</span>
                                    </div>
                                    <div className="g3 mb">
                                        {[{ id: 'RM', label: 'Raw Material' }, { id: 'Process', label: 'Process' }, { id: 'Final', label: 'Final Product' }].map((catObj, idx) => {
                                            const cat = catObj.id;
                                            const activeDetails = localInspectionDetails?.length > 0 ? localInspectionDetails : (inspectionDetailsData?.length > 0 ? inspectionDetailsData : staticInspectionDetailsData);
                                            const d = activeDetails.find(x => x.name === cat);
                                            return (
                                                <div className="prof-card" key={idx} style={{
                                                    padding: '15px',
                                                    borderLeft: cat === 'RM' ? '4px solid #0d9488' : cat === 'Process' ? '4px solid #7c3aed' : '4px solid #db2777',
                                                    background: cat === 'RM' ? '#f0fdfa' : cat === 'Process' ? '#f5f3ff' : '#fff1f2'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>{catObj.label}</span>
                                                        <span className="prof-badge" style={{ background: '#f8fafc', color: '#64748b', fontSize: '10px' }}>Nos.</span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ACCEPTED (Nos.)</div>
                                                            <div style={{ fontSize: '26px', fontWeight: '800', color: '#22c55e' }}>{d?.accepted || '0'}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>REJECTED (Nos.)</div>
                                                            <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444' }}>{d?.rejected || '0'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="prof-card">
                                        <div className="sec-title">Production & Rejection</div>
                                        {(() => {
                                            const activeDetails = localInspectionDetails?.length > 0 ? localInspectionDetails : (inspectionDetailsData?.length > 0 ? inspectionDetailsData : staticInspectionDetailsData);
                                            
                                            const procData = activeDetails.find(x => x.name === 'Process');
                                            const pAcc = procData?.accepted || 0;
                                            const pRej = procData?.rejected || 0;
                                            const pInsp = pAcc + pRej;
                                            const pRejPct = pInsp > 0 ? (pRej * 100) / pInsp : (s.processRejectionPercentage ?? 0);
                                            
                                            const rmData = activeDetails.find(x => x.name === 'RM');
                                            const rmAcc = rmData?.accepted || 0;
                                            const rmRej = rmData?.rejected || 0;
                                            const rmInsp = rmAcc + rmRej;
                                            const rmRejPct = rmInsp > 0 ? (rmRej * 100) / rmInsp : (s.rmRejectionPercentage ?? 3.2);

                                            const finalData = activeDetails.find(x => x.name === 'Final');
                                            const fAcc = finalData?.accepted || 0;
                                            const fRej = finalData?.rejected || 0;
                                            const fInsp = fAcc + fRej;
                                            const fRejPct = fInsp > 0 ? (fRej * 100) / fInsp : (s.finalRejectionPercentage ?? 1.8);
                                            
                                            const avgProd = localAvgProduction !== null ? localAvgProduction : (s.avgProductionPerDay ?? 947);

                                            return (
                                                <div className="g4">
                                                    <div className="prof-card card-spring-green" style={{ textAlign: 'center' }}>
                                                        <div className="kpi-lbl">Avg Production/Day</div>
                                                        <div className="kpi-val">{Math.round(avgProd)}</div>
                                                        <div className="kpi-sub">Nos.</div>
                                                    </div>
                                                    <div className="prof-card card-gold" style={{ textAlign: 'center' }}>
                                                        <div className="kpi-lbl">RM Rejection</div>
                                                        <div className="kpi-val">{formatDecimal(rmRejPct)}%</div>
                                                        <div className="prof-prog"><div className="prof-prog-f" style={{ width: `${Math.min(100, rmRejPct * 10)}%`, background: '#eab308' }}></div></div>
                                                    </div>
                                                    <div className="prof-card card-lime" style={{ textAlign: 'center' }}>
                                                        <div className="kpi-lbl">Process Rejection</div>
                                                        <div className="kpi-val">{formatDecimal(pRejPct)}%</div>
                                                        <div className="prof-prog"><div className="prof-prog-f" style={{ width: `${Math.min(100, pRejPct * 10)}%`, background: '#84cc16' }}></div></div>
                                                    </div>
                                                    <div className="prof-card card-ruby" style={{ textAlign: 'center' }}>
                                                        <div className="kpi-lbl">Final Rejection</div>
                                                        <div className="kpi-val">{formatDecimal(fRejPct)}%</div>
                                                        <div className="prof-prog"><div className="prof-prog-f" style={{ width: `${Math.min(100, fRejPct * 10)}%`, background: '#e11d48' }}></div></div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    </>
                                    )}
                                </div>
                            );

                        case 'quality':
                            if (isSleeper) {
                                return <SleeperQuality
                                    fromDate={fromDate}
                                    toDate={toDate}
                                    setFromDate={setFromDate}
                                    setToDate={setToDate}
                                />;
                            }
                            if (isRailPad) {
                                return <RailPadQuality
                                    paretoData={paretoAnalysisData}
                                    rejectionTrendData={monthlyRejectionTrendData}
                                />;
                            }
                            return (

                                <div className="quality-tab-content fade-in">
                                    <div className="sec-title" style={{ fontSize: '14px', marginBottom: '10px' }}>Railway Quality Surveillance · ERC Defect Analysis</div>

                                    {/* KPI Row exactly from Index 5, adjusted to hide Total Defects */}
                                    {(() => {
                                        const procData = (inspectionDetailsData?.length > 0 ? inspectionDetailsData : staticInspectionDetailsData).find(x => x.name === 'Process');
                                        const pAcc = procData?.accepted || 0;
                                        const pRej = procData?.rejected || 0;
                                        const pInsp = pAcc + pRej;
                                        const pRejPct = pInsp > 0 ? (pRej * 100) / pInsp : 0;

                                        return (
                                            <div className="g3 mb">
                                                <div className="prof-card" style={{ textAlign: 'center', background: '#fef2f2', border: '1px solid #fee2e2' }}>
                                                    <div className="kpi-lbl" style={{ color: '#991b1b' }}>Process Overall Rejection %</div>
                                                    <div className="kpi-val" style={{ color: '#dc2626' }}>{formatDecimal(pRejPct)}%</div>
                                                </div>
                                                <div className="prof-card card-mint" style={{ textAlign: 'center' }}>
                                                    <div className="kpi-lbl" style={{ color: '#15803d' }}>Top Defect</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '8px', color: '#166534' }}>{paretoAnalysisData?.[0]?.name || 'Turning Length'}</div>
                                                </div>
                                                <div className="prof-card" style={{ textAlign: 'center', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                                                    <div className="kpi-lbl" style={{ color: '#92400e' }}>Worst Plant</div>
                                                    <div style={{ fontSize: '12px', fontWeight: '800', marginTop: '8px', color: '#78350f', lineHeight: '1.2' }}>
                                                        {processPerformanceData?.worstPerforming?.length > 0 ? processPerformanceData.worstPerforming[0]?.name : manufacturerRejectionData?.length > 0 ? [...manufacturerRejectionData].sort((a, b) => b.value - a.value)[0]?.name : 'Adinath Industries'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Analysis Grid (3x2) exactly from Index 5 */}
                                    <div className="g2 mb">
                                        <div className="prof-card">
                                            <div className="sec-title">Defect Distribution</div>
                                            <div className="chart-wrap" style={{ height: '210px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[...(stepWiseRejectionData?.length ? stepWiseRejectionData : [
                                                                { name: 'Shearing', value: 12, color: '#3b82f6' },
                                                                { name: 'Turning', value: 22, color: '#f59e0b' },
                                                                { name: 'MPI', value: 10, color: '#8b5cf6' },
                                                                { name: 'Forging', value: 18, color: '#ef4444' },
                                                                { name: 'Quenching', value: 14, color: '#10b981' },
                                                                { name: 'Tempering', value: 9, color: '#06b6d4' }
                                                            ])].sort((a, b) => (b.value || 0) - (a.value || 0))}
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                        >
                                                            {[...(stepWiseRejectionData?.length ? stepWiseRejectionData : [
                                                                { color: '#3b82f6' }, { color: '#f59e0b' },
                                                                { color: '#8b5cf6' }, { color: '#ef4444' },
                                                                { color: '#10b981' }, { color: '#06b6d4' }
                                                            ])].sort((a, b) => (b.value || 0) - (a.value || 0)).map((entry, i) => (
                                                                <Cell key={`cell-${i}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(v) => `${v}%`} />
                                                        <Legend
                                                            layout="vertical"
                                                            align="right"
                                                            verticalAlign="middle"
                                                            content={({ payload }) => {
                                                                const sorted = [...(payload || [])].sort(
                                                                    (a, b) => (b.payload?.value || 0) - (a.payload?.value || 0)
                                                                );
                                                                return (
                                                                    <div style={{ paddingLeft: '20px', lineHeight: '28px', fontSize: '14px', fontWeight: 'bold' }}>
                                                                        {sorted.map((entry, i) => (
                                                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                                                                                <span style={{ color: entry.color, fontWeight: '700', display: 'inline-flex', justifyContent: 'space-between', width: '160px' }}>
                                                                                    <span>{entry.value}</span>
                                                                                    <span>{entry.payload?.value}%</span>
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="prof-card">
                                            <div className="sec-title">Pareto Analysis</div>
                                            <div className="chart-wrap" style={{ height: '380px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ComposedChart data={paretoAnalysisData?.length ? (() => {
                                                        const total = paretoAnalysisData.reduce((sum, d) => sum + (d.count || d.value || 0), 0);
                                                        return paretoAnalysisData.map(d => {
                                                            const count = d.count || d.value || 0;
                                                            return { 
                                                                ...d, 
                                                                count, 
                                                                percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0 
                                                            };
                                                        });
                                                    })() : []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="name"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            interval={0}
                                                            height={160}
                                                            tick={({ x, y, payload }) => (
                                                                <g transform={`translate(${x},${y + 10})`}>
                                                                    <text
                                                                        x={0}
                                                                        y={0}
                                                                        dy={3.5}
                                                                        transform="rotate(90)"
                                                                        textAnchor="start"
                                                                        fill="#475569"
                                                                        style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'sans-serif' }}
                                                                    >
                                                                        {payload.value.length > 22
                                                                            ? payload.value.substring(0, 20) + '…'
                                                                            : payload.value}
                                                                    </text>
                                                                </g>
                                                            )}
                                                        />
                                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                        <YAxis
                                                            yAxisId="right"
                                                            orientation="right"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            unit="%"
                                                            style={{ fontSize: '12px', fontWeight: 'bold' }}
                                                            domain={[0, 100]}
                                                        />
                                                        <Tooltip />
                                                        <Bar yAxisId="left" dataKey="count" fill="#16a34a" radius={[2, 2, 0, 0]} barSize={20} />
                                                        <Line
                                                            yAxisId="right"
                                                            type="monotone"
                                                            dataKey="percentage"
                                                            stroke="#ef4444"
                                                            strokeWidth={2}
                                                            dot={{ r: 4, fill: '#ef4444', strokeWidth: 1, stroke: '#fff' }}
                                                            activeDot={{ r: 6 }}
                                                        />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="prof-card">
                                            <div className="sec-title">Stage-wise Rejection %</div>
                                            <div className="chart-wrap" style={{ height: '170px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={qualityRejectionData?.length ? qualityRejectionData : [{ name: 'Raw Material', value: 0.8 }, { name: 'Process', value: 1.6 }, { name: 'Final', value: 0.9 }]}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                        <YAxis axisLine={false} tickLine={false} unit="%" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                        <Tooltip />
                                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                                            {qualityRejectionData?.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : index === 1 ? '#f59e0b' : '#ef4444'} />
                                                            )) || [<Cell fill="#22c55e" />, <Cell fill="#f59e0b" />, <Cell fill="#ef4444" />]}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="prof-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div className="sec-title" style={{ marginBottom: 0 }}>Rejection % by RM Manufacturer</div>
                                            </div>
                                            <div className="chart-wrap" style={{ height: '170px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={manufacturerRejectionData?.length ? [...manufacturerRejectionData].sort((a, b) => b.value - a.value).slice(0, 5) : [
                                                        { name: 'JSPL', value: 0.9 },
                                                        { name: 'RINL', value: 1.2 },
                                                        { name: 'Neco Jaiswal', value: 1.8 },
                                                        { name: 'Bhushan', value: 1.1 },
                                                        { name: 'Surya', value: 0.7 }
                                                    ]}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="name"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            style={{ fontSize: '12px', fontWeight: 'bold' }}
                                                            tickFormatter={(name) => name.length > 12 ? name.substring(0, 10) + '...' : name}
                                                        />
                                                        <YAxis axisLine={false} tickLine={false} unit="%" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                        <Tooltip formatter={(v) => `${v}%`} />
                                                        <Bar dataKey="value" fill="#166534" radius={[4, 4, 0, 0]} barSize={24}>
                                                            <LabelList dataKey="value" position="top" formatter={(v) => `${formatDecimal(v)}%`} style={{ fontSize: '12px', fill: '#166534', fontWeight: 'bold' }} />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="prof-card">
                                            <div className="sec-title">Monthly Rejection Trend</div>
                                            <div className="chart-wrap" style={{ height: '170px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={monthlyRejectionTrendData?.length ? monthlyRejectionTrendData : [
                                                        { name: 'Apr', value: 1.4 }, { name: 'May', value: 1.2 },
                                                        { name: 'Jun', value: 1.6 }, { name: 'Jul', value: 1.3 },
                                                        { name: 'Aug', value: 1.1 }, { name: 'Sep', value: 0.9 }
                                                    ]}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                        <Tooltip />
                                                        <Area type="monotone" dataKey="value" stroke="#16a34a" fill="rgba(22,163,74,0.1)" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="prof-card">
                                            <div className="sec-title">Stage vs Defect Contribution</div>
                                            <div className="chart-wrap" style={{ height: '170px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stageVsDefectTop3} margin={{ bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                                        <Tooltip />
                                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                                                        {top3DefectNames.map((name, i) => (
                                                            <Bar
                                                                key={name}
                                                                dataKey={name}
                                                                fill={i === 0 ? '#3b82f6' : i === 1 ? '#f59e0b' : '#ef4444'}
                                                                radius={[4, 4, 0, 0]}
                                                                barSize={20}
                                                            />
                                                        ))}
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Benchmark Row: Top vs Worst Performers using processPerformance API */}
                                    <div className="g2">
                                        <div className="prof-card">
                                            <div className="sec-title" style={{ fontSize: '11px', color: '#166534' }}>Top 5 Performing Companies (Process Rejection %)</div>
                                            <div className="chart-wrap" style={{ height: '220px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={processPerformanceData?.topPerforming?.length > 0
                                                            ? processPerformanceData.topPerforming.slice(0, 5)
                                                            : [
                                                                { name: 'JSPL', value: 0.15 }, { name: 'Surya Steel', value: 0.22 },
                                                                { name: 'RINL', value: 0.28 }, { name: 'Bhushan Steel', value: 0.32 },
                                                                { name: 'Surya', value: 0.45 }
                                                            ]
                                                        }
                                                        layout="vertical"
                                                        margin={{ left: 5, right: 45, top: 10, bottom: 10 }}
                                                    >
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            style={{ fontSize: '12px', fontWeight: 'bold', fill: '#475569' }}
                                                            width={90}
                                                            tickFormatter={(name) => name.length > 15 ? name.substring(0, 12) + '...' : name}
                                                        />
                                                        <Tooltip formatter={(v) => `${v}%`} />
                                                        <Bar dataKey="value" fill="#10b981" barSize={16} radius={[0, 4, 4, 0]}>
                                                            <LabelList dataKey="value" position="right" formatter={(v) => `${formatDecimal(v)}%`} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#059669' }} />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="prof-card">
                                            <div className="sec-title" style={{ fontSize: '11px', color: '#991b1b' }}>Worst 5 Performing Companies (Process Rejection %)</div>
                                            <div className="chart-wrap" style={{ height: '220px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={processPerformanceData?.worstPerforming?.length > 0
                                                            ? processPerformanceData.worstPerforming.slice(0, 5)
                                                            : [
                                                                { name: 'Adinath Ind.', value: 1.85 }, { name: 'Nova Jaiswal', value: 1.62 },
                                                                { name: 'Prakash Met.', value: 1.45 }, { name: 'Kalimata Ind.', value: 1.32 },
                                                                { name: 'Royal Comp.', value: 1.15 }
                                                            ]
                                                        }
                                                        layout="vertical"
                                                        margin={{ left: 5, right: 45, top: 10, bottom: 10 }}
                                                    >
                                                        <XAxis type="number" hide />
                                                        <YAxis
                                                            dataKey="name"
                                                            type="category"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            style={{ fontSize: '12px', fontWeight: 'bold', fill: '#475569' }}
                                                            width={90}
                                                            tickFormatter={(name) => name.length > 15 ? name.substring(0, 12) + '...' : name}
                                                        />
                                                        <Tooltip formatter={(v) => `${v}%`} />
                                                        <Bar dataKey="value" fill="#ef4444" barSize={16} radius={[0, 4, 4, 0]}>
                                                            <LabelList dataKey="value" position="right" formatter={(v) => `${formatDecimal(v)}%`} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#dc2626' }} />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );

                        case 'lifecycle':
                            if (isSleeper) {
                                return <SleeperLifecycle />;
                            }
                            if (isRailPad) {
                                return <RailPadLifecycle />;
                            }
                            return (

                                <div className="lifecycle-tab-content">
                                    <div className="prof-card mb">
                                        <div className="sec-title">Purchase Order Lifecycle Tracking</div>

                                        {poTable}
                                    </div>
                                </div>
                            );

                        case 'performance':
                            if (isSleeper) {
                                return <SleeperPerformance fromDate={fromDate} toDate={toDate} />;
                            }
                            if (isRailPad) {
                                return <RailPadPerformance perfData={perfData} loading={perfLoading} error={perfError} />;
                            }
                            return (
                                <div className="performance-tab-content fade-in">
                                    <div className="prof-card">
                                        <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Performance Monitoring Matrix</span>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <ExportButton
                                                    onClick={() => downloadExcel(
                                                        getSortedData(filteredPerfRecords),
                                                        [
                                                            { label: 'MANUFACTURER', key: 'manufacturerName' },
                                                            { label: 'RIO', key: 'rio' },
                                                            { label: 'IE', key: 'username' },
                                                            { label: 'STAGE', key: 'stage' },
                                                            { label: 'INSPECTED', key: 'inspectedQty' },
                                                            { label: 'ACCEPTED', key: 'acceptedQty' },
                                                            { label: 'REJECTED', key: 'rejectedQty' },
                                                            { label: 'REJECTION %', key: 'rejectionPercentage' }
                                                        ],
                                                        'Performance_Monitoring_Matrix'
                                                    )}
                                                />
                                                <select className="prof-select" value={perfFilterIe} onChange={(e) => setPerfFilterIe(e.target.value)}>
                                                    <option value="all">All Engineers</option>
                                                    {uniqueIes.map(ie => <option key={ie} value={ie}>{ie}</option>)}
                                                </select>
                                                <select className="prof-select" value={perfFilterStage} onChange={(e) => setPerfFilterStage(e.target.value)}>
                                                    <option value="all">All Stages</option>
                                                    {uniqueStages.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="table-responsive">
                                            <table className="prof-table">
                                                <thead>
                                                    <tr>
                                                        <th onClick={() => handleSort('id')}># {renderSortIcon('id', sortConfig)}</th>
                                                        <th onClick={() => handleSort('manufacturerName')}>MANUFACTURER {renderSortIcon('manufacturerName', sortConfig)}</th>
                                                        <th onClick={() => handleSort('rio')}>RIO {renderSortIcon('rio', sortConfig)}</th>
                                                        <th onClick={() => handleSort('username')}>IE {renderSortIcon('username', sortConfig)}</th>
                                                        <th onClick={() => handleSort('stage')}>STAGE {renderSortIcon('stage', sortConfig)}</th>
                                                        <th className="text-right" onClick={() => handleSort('inspectedQty')} style={{ cursor: 'pointer' }}>INSPECTED {renderSortIcon('inspectedQty', sortConfig)}</th>
                                                        <th className="text-right" onClick={() => handleSort('acceptedQty')} style={{ cursor: 'pointer' }}>ACCEPTED {renderSortIcon('acceptedQty', sortConfig)}</th>
                                                        <th className="text-right" onClick={() => handleSort('rejectedQty')} style={{ cursor: 'pointer' }}>REJECTED {renderSortIcon('rejectedQty', sortConfig)}</th>
                                                        <th className="text-right" onClick={() => handleSort('rejectionPercentage')} style={{ cursor: 'pointer' }}>REJ % {renderSortIcon('rejectionPercentage', sortConfig)}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getSortedData(filteredPerfRecords).slice(perfPage * perfRowsPerPage, (perfPage + 1) * perfRowsPerPage).map((record, idx) => (
                                                        <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                            <td>{(perfPage * perfRowsPerPage) + idx + 1}</td>
                                                            <td>{record.manufacturerName}</td>
                                                            <td><span className="prof-badge" style={{ background: '#f0fdf4', color: '#166534' }}>{record.rio}</span></td>
                                                            <td>👤 {record.username}</td>
                                                            <td><span className="prof-badge" style={{ background: '#f0f9ff', color: '#075985' }}>{record.stage}</span></td>
                                                            <td className="text-right">{record.inspectedQty}</td>
                                                            <td className="text-right" style={{ color: '#16a34a' }}>{record.acceptedQty}</td>
                                                            <td className="text-right" style={{ color: '#dc2626' }}>{record.rejectedQty}</td>
                                                            <td className="text-right"><span className="prof-badge" style={{ background: '#fff7ed', color: '#9a3412' }}>{formatDecimal(record.rejectionPercentage)}%</span></td>
                                                        </tr>
                                                    ))}
                                                    {filteredPerfRecords.length === 0 && (
                                                        <tr>
                                                            <td colSpan="9" className="text-center p-8 text-slate-400">No records found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-4">
                                            <Pagination
                                                currentPage={perfPage} totalPages={Math.ceil(filteredPerfRecords.length / perfRowsPerPage)}
                                                start={perfPage * perfRowsPerPage} end={Math.min((perfPage + 1) * perfRowsPerPage, filteredPerfRecords.length)}
                                                totalCount={filteredPerfRecords.length} onPageChange={setPerfPage}
                                                rows={perfRowsPerPage} onRowsChange={setPerfRowsPerPage}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );

                        case 'reports':
                            return (
                                <div className="reports-tab-content fade-in">
                                    {/* 
                                    <div className="sub-tabs">
                                        <div className={`sub-tab-btn ${activeReport === 'mpr' ? 'active' : ''}`} onClick={() => { setActiveReport('mpr'); onReportTabChange('mpr'); }}>📋 {selectedProduct === 'ERC' ? 'PWMPR' : 'MPR'}</div>
                                        <div className={`sub-tab-btn ${activeReport === 'mau' ? 'active' : ''}`} onClick={() => { setActiveReport('mau'); onReportTabChange('mau'); }}>📈 MAU</div>
                                        <div className={`sub-tab-btn ${activeReport === 'lwcl' ? 'active' : ''}`} onClick={() => { setActiveReport('lwcl'); onReportTabChange('lwcl'); }}>🔄 LWCL</div>
                                        <div className={`sub-tab-btn ${activeReport === 'swp' ? 'active' : ''}`} onClick={() => { setActiveReport('swp'); onReportTabChange('swp'); }}>⏱️ SWP</div>
                                        {isRailPad && (
                                            <div className={`sub-tab-btn ${activeReport === 'qrp' ? 'active' : ''}`} onClick={() => { setActiveReport('qrp'); onReportTabChange('qrp'); }}>📊 Quality Report</div>
                                        )}
                                        {!isSleeper && !isRailPad && (
                                            <div className={`sub-tab-btn ${activeReport === 'mpia' ? 'active' : ''}`} onClick={() => { setActiveReport('mpia'); onReportTabChange('mpia'); }}>⚙️ VWPQR</div>
                                        )}
                                        {!isSleeper && !isRailPad && (
                                            <div className={`sub-tab-btn ${activeReport === 'pwmr' ? 'active' : ''}`} onClick={() => { setActiveReport('pwmr'); onReportTabChange('pwmr'); }}>📊 PWQR</div>
                                        )}
                                    </div>
                                    */}

                                    <div className="report-viewer-content">
                                        {isRailPad ? (
                                            (() => {
                                                switch (activeReport) {
                                                    case 'mpr': return <RailPadMprReport mprData={mprData} loading={mprLoading} />;
                                                    case 'mau': return <RailPadMauReport mauData={mauData} loading={mauLoading} startDate={fromDate} endDate={toDate} />;
                                                    case 'lwcl': return <RailPadLwcpReport />;
                                                    case 'swp': return <RailPadSwpReport />;
                                                    case 'vwpqr': return <RailPadVwpqrReport />;
                                                    case 'qrp': return <RailPadQualityReport />;
                                                    case 'ic_annexures': return <DownloadIcAnnexures selectedProduct="Rail Pad" fromDate={fromDate} toDate={toDate} />;
                                                    default: return <RailPadMprReport mprData={mprData} loading={mprLoading} />;
                                                }
                                            })()
                                        ) : isSleeper ? (
                                            (() => {
                                                switch (activeReport) {
                                                    case 'mpr': return <SleeperMprReport mprData={mprData} loading={mprLoading} />;
                                                    case 'mau': return <SleeperMauReport mauData={mauData} loading={mauLoading} startDate={fromDate} endDate={toDate} />;
                                                    case 'lwcl': return <SleeperLwclReport lwclData={lwclData} loading={lwclLoading} callNo={lwclCallNo} setCallNo={setLwclCallNo} lotNo={lwclLotNo} setLotNo={setLwclLotNo} requestIds={lwclRequestIds} lotNumbers={lwclLotNumbers} />;
                                                    case 'swp': return <SleeperShiftWiseProductionReport />;
                                                    case 'sqr': return <SleeperQualityReport fromDate={fromDate} toDate={toDate} />;
                                                    case 'ic_annexures': return <DownloadIcAnnexures selectedProduct="Sleeper" fromDate={fromDate} toDate={toDate} />;
                                                    default: return <SleeperMprReport mprData={mprData} />;
                                                }
                                            })()
                                        ) : (
                                            (() => {
                                                switch (activeReport) {
                                                    case 'mpr':
                                                        return (
                                                            <div className="prof-card animate-up">
                                                                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span>PO Wise Monthly Progress Report</span>
                                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                        <ExportButton
                                                                            onClick={() => downloadExcel(
                                                                                displayMprData.map(v => ({
                                                                                    ...v,
                                                                                    poDateFormatted: formatPoDate(v.poDate)
                                                                                })),
                                                                                [
                                                                                    { label: 'Rly', key: 'rly' },
                                                                                    { label: 'PO Number', key: 'poNumber' },
                                                                                    { label: 'PO Date', key: 'poDateFormatted' },
                                                                                    { label: 'Manufacturer', key: 'manufacturer' },
                                                                                    { label: 'PO Qty', key: 'poQty' },
                                                                                    { label: 'RM', key: 'monthlyRm' },
                                                                                    { label: 'Process', key: 'monthlyProcess' },
                                                                                    { label: 'Final', key: 'monthlyFinal' },
                                                                                    { label: 'Total Final Inspected', key: 'totalFinalInspected' },
                                                                                    { label: 'Balance', key: 'poBalance' }
                                                                                ],
                                                                                'PO_Wise_Monthly_Progress_Report'
                                                                            )}
                                                                        />
                                                                        <input type="text" placeholder="Search..." className="prof-search" value={mprSearch} onChange={(e) => setMprSearch(e.target.value)} />
                                                                    </div>
                                                                </div>
                                                                <div className="table-responsive">
                                                                    <table className="prof-table">
                                                                        <thead>
                                                                            <tr className="sortable-header">
                                                                                <th onClick={() => handleMprSort('rly')}>Rly {renderSortIcon('rly', mprSort)}</th>
                                                                                <th onClick={() => handleMprSort('poNumber')}>PO Number {renderSortIcon('poNumber', mprSort)}</th>
                                                                                <th onClick={() => handleMprSort('poDate')}>PO Date {renderSortIcon('poDate', mprSort)}</th>
                                                                                <th onClick={() => handleMprSort('manufacturer')}>Manufacturer {renderSortIcon('manufacturer', mprSort)}</th>
                                                                                <th className="text-center" onClick={() => handleMprSort('poQty')}>PO Qty {renderSortIcon('poQty', mprSort)}</th>
                                                                                <th className="text-center" onClick={() => handleMprSort('monthlyRm')}>RM {renderSortIcon('monthlyRm', mprSort)}</th>
                                                                                <th className="text-center" onClick={() => handleMprSort('monthlyProcess')}>Process {renderSortIcon('monthlyProcess', mprSort)}</th>
                                                                                <th className="text-center" onClick={() => handleMprSort('monthlyFinal')}>Final {renderSortIcon('monthlyFinal', mprSort)}</th>
                                                                                <th className="text-center" onClick={() => handleMprSort('totalFinalInspected')}>Total Final Inspected {renderSortIcon('totalFinalInspected', mprSort)}</th>
                                                                                <th className="text-center" onClick={() => handleMprSort('poBalance')}>Balance {renderSortIcon('poBalance', mprSort)}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {displayMprData.slice(mprPage * mprRowsPerPage, (mprPage + 1) * mprRowsPerPage).map((row, idx) => (
                                                                                <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                                                    <td>{row.rly}</td>
                                                                                    <td>{row.poNumber}</td>
                                                                                    <td>{formatPoDate(row.poDate)}</td>
                                                                                    <td>{row.manufacturer}</td>
                                                                                    <td className="text-center">{row.poQty}</td>
                                                                                    <td className="text-center">{row.monthlyRm}</td>
                                                                                    <td className="text-center">{row.monthlyProcess}</td>
                                                                                    <td className="text-center">{row.monthlyFinal}</td>
                                                                                    <td className="text-center">{row.totalFinalInspected}</td>
                                                                                    <td className="text-center font-bold" style={{ color: '#16a34a' }}>{row.poBalance}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                <div className="mt-4">
                                                                    <Pagination
                                                                        currentPage={mprPage} totalPages={Math.ceil(displayMprData.length / mprRowsPerPage)}
                                                                        start={mprPage * mprRowsPerPage} end={Math.min((mprPage + 1) * mprRowsPerPage, displayMprData.length)}
                                                                        totalCount={displayMprData.length} onPageChange={setMprPage}
                                                                        rows={mprRowsPerPage} onRowsChange={setMprRowsPerPage}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    case 'mau':
                                                        return (
                                                            <div className="prof-card animate-up">
                                                                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span>Monthly Analysis of Units</span>
                                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                        <ExportButton
                                                                            onClick={() => downloadExcel(
                                                                                displayMauData.map(row => ({
                                                                                    ...row,
                                                                                    poQty: row.poQty !== undefined && row.poQty !== null ? `${row.poQty} ${row.uom || ''}`.trim() : '-'
                                                                                })),
                                                                                [
                                                                                    { label: 'Manufacturer', key: 'manufacturer' },
                                                                                    { label: 'RITES RIO', key: 'rio' },
                                                                                    { label: 'No. of PO', key: 'noOfPos' },
                                                                                    { label: 'PO Qty', key: 'poQty' },
                                                                                    { label: 'Manufactured', key: 'manufactured' },
                                                                                    { label: 'Inspected', key: 'inspected' },
                                                                                    { label: 'Rejected', key: 'rejected' },
                                                                                    { label: 'RM %', key: 'rmRejPercent' },
                                                                                    { label: 'Process %', key: 'processRejPercent' },
                                                                                    { label: 'Final %', key: 'finalRejPercent' }
                                                                                ],
                                                                                'Monthly_Analysis_of_Units'
                                                                            )}
                                                                        />
                                                                        <input type="text" placeholder="Search..." className="prof-search" value={mauSearch} onChange={(e) => setMauSearch(e.target.value)} />
                                                                    </div>
                                                                </div>
                                                                <div className="table-responsive">
                                                                    <table className="prof-table">
                                                                        <thead>
                                                                            <tr className="sortable-header">
                                                                                <th onClick={() => handleMauSort('manufacturer')}>Manufacturer {renderSortIcon('manufacturer', mauSort)}</th>
                                                                                <th onClick={() => handleMauSort('rio')}>RITES RIO {renderSortIcon('rio', mauSort)}</th>
                                                                                <th className="text-right" onClick={() => handleMauSort('noOfPos')}>No. of PO {renderSortIcon('noOfPos', mauSort)}</th>
                                                                                <th className="text-right" onClick={() => handleMauSort('poQty')}>PO Qty {renderSortIcon('poQty', mauSort)}</th>
                                                                                <th className="text-right" onClick={() => handleMauSort('manufactured')}>Manufactured {renderSortIcon('manufactured', mauSort)}</th>
                                                                                <th className="text-right" onClick={() => handleMauSort('inspected')}>Inspected {renderSortIcon('inspected', mauSort)}</th>
                                                                                <th className="text-right" onClick={() => handleMauSort('rejected')}>Rejected {renderSortIcon('rejected', mauSort)}</th>
                                                                                <th className="text-right" onClick={() => handleMauSort('rmRejPercent')}>RM % {renderSortIcon('rmRejPercent', mauSort)}</th>
                                                                                <th className="text-right" onClick={() => handleMauSort('processRejPercent')}>Process % {renderSortIcon('processRejPercent', mauSort)}</th>
                                                                                <th className="text-right" onClick={() => handleMauSort('finalRejPercent')}>Final % {renderSortIcon('finalRejPercent', mauSort)}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {displayMauData.slice(mauPage * mauRowsPerPage, (mauPage + 1) * mauRowsPerPage).map((row, idx) => (
                                                                                <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                                                    <td>{row.manufacturer}</td>
                                                                                    <td>{row.rio || '-'}</td>
                                                                                    <td className="text-right">{row.noOfPos !== undefined && row.noOfPos !== null ? row.noOfPos : '-'}</td>
                                                                                    <td className="text-right">{row.poQty !== undefined && row.poQty !== null ? `${row.poQty} ${row.uom || ''}`.trim() : '-'}</td>
                                                                                    <td className="text-right">{row.manufactured}</td>
                                                                                    <td className="text-right">{row.inspected}</td>
                                                                                    <td className="text-right" style={{ color: '#dc2626' }}>{row.rejected}</td>
                                                                                    <td className="text-right">{formatDecimal(row.rmRejPercent)}%</td>
                                                                                    <td className="text-right text-red-600">{formatDecimal(row.processRejPercent)}%</td>
                                                                                    <td className="text-right">{formatDecimal(row.finalRejPercent)}%</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                <div className="mt-4">
                                                                    <Pagination
                                                                        currentPage={mauPage} totalPages={Math.ceil(displayMauData.length / mauRowsPerPage)}
                                                                        start={mauPage * mauRowsPerPage} end={Math.min((mauPage + 1) * mauRowsPerPage, displayMauData.length)}
                                                                        totalCount={displayMauData.length} onPageChange={setMauPage}
                                                                        rows={mauRowsPerPage} onRowsChange={setMauRowsPerPage}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    case 'lwcl':
                                                        return (
                                                            <div className="prof-card animate-up lwcl-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', minHeight: '400px', boxSizing: 'border-box', overflow: 'hidden' }}>
                                                                <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span>Lot Wise Closed Loop</span>
                                                                    {level4Data && level4Data.length > 0 && (
                                                                        <ExportButton
                                                                            onClick={() => {
                                                                                const flattened = level4Data.map((row, idx) => ({
                                                                                    sl: idx + 1,
                                                                                    date: row.basicDetails?.date ? new Date(row.basicDetails.date).toLocaleDateString('en-GB') : 'N/A',
                                                                                    shift: row.basicDetails?.shift || '-',
                                                                                    poSrNo: row.basicDetails?.poSrNo || '-',
                                                                                    lotNumber: row.basicDetails?.lotNumber || '-',
                                                                                    acceptedQty: row.basicDetails?.totalAcceptedQty || 0,
                                                                                    rejectedQty: row.basicDetails?.totalRejectionQty || 0,
                                                                                    shearingProd: row.processQty?.shearingProductionQty || 0,
                                                                                    shearingRej: row.processQty?.shearingRejectionQty || 0,
                                                                                    turningProd: row.processQty?.turningProductionQty || 0,
                                                                                    turningRej: row.processQty?.turningRejectionQty || 0,
                                                                                    mpiProd: row.processQty?.mpiProductionQty || 0,
                                                                                    mpiRej: row.processQty?.mpiRejectionQty || 0,
                                                                                    forgingProd: row.processQty?.forgingProductionQty || 0,
                                                                                    forgingRej: row.processQty?.forgingRejectionQty || 0,
                                                                                    quenchingProd: row.processQty?.quenchingProductionQty || 0,
                                                                                    quenchingRej: row.processQty?.quenchingRejectionQty || 0,
                                                                                    temperingProd: row.processQty?.temperingProductionQty || 0,
                                                                                    temperingRej: row.processQty?.temperingRejectionQty || 0,
                                                                                }));
                                                                                downloadExcel(
                                                                                    flattened,
                                                                                    [
                                                                                        { label: 'SL', key: 'sl' },
                                                                                        { label: 'DATE', key: 'date' },
                                                                                        { label: 'SHIFT', key: 'shift' },
                                                                                        { label: 'PO_SR. NO.', key: 'poSrNo' },
                                                                                        { label: 'LOT NO.', key: 'lotNumber' },
                                                                                        { label: 'Accepted Qty (Nos.)', key: 'acceptedQty' },
                                                                                        { label: 'Rejected Qty (Nos.)', key: 'rejectedQty' },
                                                                                        { label: 'SHEARING PROD', key: 'shearingProd' },
                                                                                        { label: 'SHEARING REJ', key: 'shearingRej' },
                                                                                        { label: 'TURNING PROD', key: 'turningProd' },
                                                                                        { label: 'TURNING REJ', key: 'turningRej' },
                                                                                        { label: 'MPI PROD', key: 'mpiProd' },
                                                                                        { label: 'MPI REJ', key: 'mpiRej' },
                                                                                        { label: 'FORGING PROD', key: 'forgingProd' },
                                                                                        { label: 'FORGING REJ', key: 'forgingRej' },
                                                                                        { label: 'QUENCHING PROD', key: 'quenchingProd' },
                                                                                        { label: 'QUENCHING REJ', key: 'quenchingRej' },
                                                                                        { label: 'TEMPERING PROD', key: 'temperingProd' },
                                                                                        { label: 'TEMPERING REJ', key: 'temperingRej' }
                                                                                    ],
                                                                                    `Lot_Wise_Closed_Loop_${lwclCallNo}`
                                                                                );
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                                                    <select className="prof-select" style={{ maxWidth: '200px' }} value={lwclManufacturer} onChange={(e) => setLwclManufacturer(e.target.value)}>
                                                                        <option value="">Select Manufacturer</option>
                                                                        {lwclManufacturersList.map((m, i) => <option key={i} value={m}>{m}</option>)}
                                                                    </select>
                                                                    <select className="prof-select" style={{ maxWidth: '200px' }} value={lwclPoNo} onChange={(e) => setLwclPoNo(e.target.value)}>
                                                                        <option value="">Select PO No.</option>
                                                                        {lwclPoNumbersList.map((po, i) => <option key={i} value={po.poNo}>{po.displayPoNo}</option>)}
                                                                    </select>
                                                                    <select className="prof-select" style={{ maxWidth: '200px' }} value={lwclCallNo} onChange={(e) => setLwclCallNo(e.target.value)}>
                                                                        <option value="">Select Call No.</option>
                                                                        {lwclRequestIds.map(id => <option key={id} value={id}>{id}</option>)}
                                                                    </select>
                                                                    <select className="prof-select" style={{ maxWidth: '200px' }} value={lwclLotNo} onChange={(e) => setLwclLotNo(e.target.value)}>
                                                                        <option value="">Select Lot No.</option>
                                                                        {lwclLotNumbers.map(lot => <option key={lot} value={lot}>{lot}</option>)}
                                                                    </select>
                                                                </div>
                                                                {level4Loading ? (
                                                                    <div className="p-12 text-center text-teal font-medium">Loading Process Defect Summary...</div>
                                                                ) : lwclCallNo ? (
                                                                    <Level4ReportTable data={lwclLotNo ? level4Data.filter(row => row.basicDetails && row.basicDetails.lotNumber === lwclLotNo) : level4Data} />
                                                                ) : (
                                                                    <div className="p-12 text-center text-slate-400">
                                                                        Please select a <strong>Call Number</strong> from the dropdown above to view the report details.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    case 'mpia':
                                                        return (
                                                            <div className={`prof-card animate-up ${batchReportData ? 'no-print' : ''}`} style={{ padding: drilldownManufacturer ? '0' : '15px' }}>
                                                                {drilldownManufacturer ? (
                                                                    <MpiaDrillDown
                                                                        data={drilldownData}
                                                                        manufacturer={drilldownManufacturer}
                                                                        loading={isDrilldownLoading}
                                                                        onBack={() => setDrilldownManufacturer(null)}
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <span>Vendor Wise Process Quality Report</span>
                                                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                                <ExportButton
                                                                                    label="Download Summary"
                                                                                    onClick={() => downloadExcel(
                                                                                        displayMpiaData,
                                                                                        [
                                                                                            { label: 'Manufacture', key: 'manufacture' },
                                                                                            { label: 'Total Inspected', key: 'totalInspected' },
                                                                                            { label: 'Total Accepted', key: 'totalAccepted' },
                                                                                            { label: 'Total Rejected', key: 'totalRejected' },
                                                                                            { label: 'Rejection %', key: 'rejectionPercent' }
                                                                                        ],
                                                                                        'Vendor_Wise_Process_Quality_Report_Summary'
                                                                                    )}
                                                                                />
                                                                                <ExportButton
                                                                                    label={isPreparingBatchPdf ? `Preparing (${batchProgress}/${mpiaData.length})...` : "Batch PDF Report"}
                                                                                    disabled={isPreparingBatchPdf}
                                                                                    onClick={async () => {
                                                                                        if (!mpiaData || mpiaData.length === 0) {
                                                                                            alert("No manufacturers found to process.");
                                                                                            return;
                                                                                        }
                                                                                        try {
                                                                                            setBatchProgress(0);
                                                                                            setIsPreparingBatchPdf(true);
                                                                                            const end = new Date().toISOString().split('T')[0];
                                                                                            const start = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];

                                                                                            const results = await Promise.all(mpiaData.map(async (m) => {
                                                                                                try {
                                                                                                    const res = await reportService.getCompanyMonthWiseData({
                                                                                                        companyName: m.manufacture,
                                                                                                        startDate: start,
                                                                                                        endDate: end,
                                                                                                        page: 0,
                                                                                                        size: 13
                                                                                                    });
                                                                                                    const data = res.responseData?.content || res.content || res || [];
                                                                                                    setBatchProgress(prev => prev + 1);
                                                                                                    return { manufacturer: m.manufacture, data: Array.isArray(data) ? data : [] };
                                                                                                } catch (e) {
                                                                                                    return { manufacturer: m.manufacture, data: [] };
                                                                                                }
                                                                                            }));

                                                                                            setBatchReportData(results);
                                                                                        } catch (err) {
                                                                                            setIsPreparingBatchPdf(false);
                                                                                            alert("Failed to prepare batch PDF data.");
                                                                                        }
                                                                                    }}
                                                                                />
                                                                                <input type="text" placeholder="Search..." className="prof-search" value={mpiaSearch} onChange={(e) => setMpiaSearch(e.target.value)} />
                                                                            </div>
                                                                        </div>
                                                                        <div className="table-responsive">
                                                                            <table className="prof-table">
                                                                                <thead>
                                                                                    <tr className="sortable-header">
                                                                                        <th onClick={() => handleMpiaSort('manufacture')}>Manufacture {renderSortIcon('manufacture', mpiaSort)}</th>
                                                                                        <th className="text-center" onClick={() => handleMpiaSort('totalInspected')}>Total Inspected (Nos.) {renderSortIcon('totalInspected', mpiaSort)}</th>
                                                                                        <th className="text-center" onClick={() => handleMpiaSort('totalAccepted')}>Total Accepted (Nos.) {renderSortIcon('totalAccepted', mpiaSort)}</th>
                                                                                        <th className="text-center" onClick={() => handleMpiaSort('totalRejected')}>Total Rejected (Nos.) {renderSortIcon('totalRejected', mpiaSort)}</th>
                                                                                        <th className="text-center" onClick={() => handleMpiaSort('rejectionPercent')}>Rejection % {renderSortIcon('rejectionPercent', mpiaSort)}</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {displayMpiaData.slice(mpiaPage * mpiaRowsPerPage, (mpiaPage + 1) * mpiaRowsPerPage).map((row, idx) => (
                                                                                        <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                                                            <td
                                                                                                className="font-bold text-emerald-800 cursor-pointer hover:underline"
                                                                                                onClick={() => setDrilldownManufacturer(row.manufacture)}
                                                                                            >
                                                                                                {row.manufacture}
                                                                                            </td>
                                                                                            <td className="text-center">{row.totalInspected}</td>
                                                                                            <td className="text-center" style={{ color: '#16a34a' }}>{row.totalAccepted}</td>
                                                                                            <td className="text-center" style={{ color: '#dc2626' }}>{row.totalRejected}</td>
                                                                                            <td className="text-center">
                                                                                                <span className="prof-badge" style={{ background: '#fff7ed', color: '#9a3412', fontWeight: 'bold' }}>
                                                                                                    {row.rejectionPercent?.toFixed(2)}%
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                        <div className="mt-4">
                                                                            <Pagination
                                                                                currentPage={mpiaPage} totalPages={Math.ceil(displayMpiaData.length / mpiaRowsPerPage)}
                                                                                start={mpiaPage * mpiaRowsPerPage} end={Math.min((mpiaPage + 1) * mpiaRowsPerPage, displayMpiaData.length)}
                                                                                totalCount={displayMpiaData.length} onPageChange={setMpiaPage}
                                                                                rows={mpiaRowsPerPage} onRowsChange={setMpiaRowsPerPage}
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    case 'swp':
                                                        return <ShiftWiseProductionReport />;
                                                    case 'pwmr':
                                                        return <PoWiseMonthlyReport fromDate={fromDate} toDate={toDate} />;
                                                    case 'ic_annexures':
                                                        return <DownloadIcAnnexures selectedProduct="ERC" fromDate={fromDate} toDate={toDate} />;
                                                    default:
                                                        return null;
                                                }
                                            })()
                                        )
                                        }
                                    </div>
                                </div>
                            );

                        case 'feedback':
                            return <FeedbackSection selectedProduct={selectedProduct} />;
                        case 'sqc':
                            return <SqcAnalysis selectedProduct={selectedProduct} />;
                        case 'scada':
                            return isSleeper ? <SleeperScadaMonitor selectedProduct={selectedProduct} /> : <ScadaMonitor selectedProduct={selectedProduct} />;
                        case 'sleeper-anomaly':
                            return <SleeperAnomalyDiagnostics />;
                        default:
                            return null;
                    }
                })()}
            </div >
        );
    };

    return (
        <div className="dashboard-content-integrated">
            {renderSubContent()}
            {batchReportData && (
                <div className="mpia-batch-print-viewport">
                    {batchReportData.map((item, idx) => (
                        <MpiaReportPage key={idx} manufacturer={item.manufacturer} data={item.data} />
                    ))}
                </div>
            )}

            {/* PO Issued Details Modal */}
            <PoIssuedModal
                isOpen={isPoModalOpen}
                onClose={() => setIsPoModalOpen(false)}
                data={poModalData}
                title={selectedProduct}
            />

            {/* Active Inspection Call Status Modal */}
            <InspectionCallStatusModal
                isOpen={isIcModalOpen}
                onClose={() => setIsIcModalOpen(false)}
                data={icModalData}
                title={icModalTitle}
            />

            {/* IC Issued Breakdown Modal */}
            {isIcIssuedModalOpen && (
                <div className="modal-overlay" onClick={() => setIsIcIssuedModalOpen(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{
                        background: 'white', padding: '24px', borderRadius: '16px', 
                        width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>IC Issued Breakdown</h3>
                            <button onClick={() => setIsIcIssuedModalOpen(false)} style={{
                                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b'
                            }}>&times;</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <span style={{ fontWeight: '600', color: '#475569' }}>Raw Material (ER)</span>
                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{icIssuedData.rmCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <span style={{ fontWeight: '600', color: '#475569' }}>Process (EP)</span>
                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{icIssuedData.processCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <span style={{ fontWeight: '600', color: '#475569' }}>Final (EF)</span>
                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{icIssuedData.finalCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f1f5f9', borderRadius: '8px', marginTop: '8px', borderTop: '2px solid #e2e8f0' }}>
                                <span style={{ fontWeight: '700', color: '#0f172a' }}>Total</span>
                                <span style={{ fontWeight: '800', color: '#d97706', fontSize: '18px' }}>{icIssuedData.total}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalCardSection;

const Level4ReportTable = ({ data }) => {
    const wrapperRef = React.useRef(null);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });

    useEffect(() => {
        // Lock body/window scroll so ONLY the table container scrolls internally
        const prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Also lock main-content
        const mainContent = document.querySelector('.main-content');
        const prevMainOverflow = mainContent ? mainContent.style.overflow : '';
        if (mainContent) mainContent.style.overflow = 'hidden';

        // Measure actual available height and set it directly on the wrapper
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const available = window.innerHeight - rect.top - 8;
            wrapperRef.current.style.height = available + 'px';
            wrapperRef.current.style.maxHeight = available + 'px';
        }

        return () => {
            document.body.style.overflow = prevBodyOverflow;
            if (mainContent) mainContent.style.overflow = prevMainOverflow;
        };
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <i className="fa-solid fa-sort sort-icon-idle ml-1 opacity-50" style={{fontSize: '10px'}}></i>;
        return sortConfig.direction === 'asc' ? <i className="fa-solid fa-sort-up sort-icon-active ml-1" style={{fontSize: '10px'}}></i> : <i className="fa-solid fa-sort-down sort-icon-active ml-1" style={{fontSize: '10px'}}></i>;
    };

    const sortedData = React.useMemo(() => {
        if (!data) return [];
        let sortableItems = [...data];
        sortableItems.sort((a, b) => {
            let aVal, bVal;
            const basicA = a.basicDetails || {};
            const qtyA = a.processQty || {};
            const sDefA = a.shearingDefects || {};
            const tDefA = a.turningDefects || {};
            const fDefA = a.forgingDefects || {};
            const qDefA = a.quenchingDefects || {};
            const tempDefA = a.temperingDefects || {};
            const dDefA = a.dimensionalDefects || {};

            const basicB = b.basicDetails || {};
            const qtyB = b.processQty || {};
            const sDefB = b.shearingDefects || {};
            const tDefB = b.turningDefects || {};
            const fDefB = b.forgingDefects || {};
            const qDefB = b.quenchingDefects || {};
            const tempDefB = b.temperingDefects || {};
            const dDefB = b.dimensionalDefects || {};

            switch (sortConfig.key) {
                case 'date': aVal = basicA.date ? new Date(basicA.date).getTime() : 0; bVal = basicB.date ? new Date(basicB.date).getTime() : 0; break;
                case 'shift': aVal = basicA.shift || ''; bVal = basicB.shift || ''; break;
                case 'poSrNo': aVal = basicA.poSrNo || ''; bVal = basicB.poSrNo || ''; break;
                case 'lotNumber': aVal = basicA.lotNumber || ''; bVal = basicB.lotNumber || ''; break;
                case 'acceptedQty': aVal = basicA.totalAcceptedQty || 0; bVal = basicB.totalAcceptedQty || 0; break;
                case 'rejectedQty': aVal = basicA.totalRejectionQty || 0; bVal = basicB.totalRejectionQty || 0; break;
                case 'shearProd': aVal = qtyA.shearingProductionQty || 0; bVal = qtyB.shearingProductionQty || 0; break;
                case 'shearRej': aVal = qtyA.shearingRejectionQty || 0; bVal = qtyB.shearingRejectionQty || 0; break;
                case 'turnProd': aVal = qtyA.turningProductionQty || 0; bVal = qtyB.turningProductionQty || 0; break;
                case 'turnRej': aVal = qtyA.turningRejectionQty || 0; bVal = qtyB.turningRejectionQty || 0; break;
                case 'mpiProd': aVal = qtyA.mpiProductionQty || 0; bVal = qtyB.mpiProductionQty || 0; break;
                case 'mpiRej': aVal = qtyA.mpiRejectionQty || 0; bVal = qtyB.mpiRejectionQty || 0; break;
                case 'forgeProd': aVal = qtyA.forgingProductionQty || 0; bVal = qtyB.forgingProductionQty || 0; break;
                case 'forgeRej': aVal = qtyA.forgingRejectionQty || 0; bVal = qtyB.forgingRejectionQty || 0; break;
                case 'quenchProd': aVal = qtyA.quenchingProductionQty || 0; bVal = qtyB.quenchingProductionQty || 0; break;
                case 'quenchRej': aVal = qtyA.quenchingRejectionQty || 0; bVal = qtyB.quenchingRejectionQty || 0; break;
                case 'tempProd': aVal = qtyA.temperingProductionQty || 0; bVal = qtyB.temperingProductionQty || 0; break;
                case 'tempRej': aVal = qtyA.temperingRejectionQty || 0; bVal = qtyB.temperingRejectionQty || 0; break;
                case 'sDefLen': aVal = sDefA.lengthOfCutBar || 0; bVal = sDefB.lengthOfCutBar || 0; break;
                case 'sDefOval': aVal = sDefA.ovalityImproperDiaAtEnd || 0; bVal = sDefB.ovalityImproperDiaAtEnd || 0; break;
                case 'sDefSharp': aVal = sDefA.sharpEdges || 0; bVal = sDefB.sharpEdges || 0; break;
                case 'sDefCrack': aVal = sDefA.crackedEdges || 0; bVal = sDefB.crackedEdges || 0; break;
                case 'tDefPass': aVal = tDefA.parallelLength || 0; bVal = tDefB.parallelLength || 0; break;
                case 'tDefFull': aVal = tDefA.fullTurningLength || 0; bVal = tDefB.fullTurningLength || 0; break;
                case 'tDefDia': aVal = tDefA.turningDia || 0; bVal = tDefB.turningDia || 0; break;
                case 'mpiDef': aVal = qtyA.mpiRejectionQty || 0; bVal = qtyB.mpiRejectionQty || 0; break;
                case 'fDefTemp': aVal = fDefA.forgingTemperature || 0; bVal = fDefB.forgingTemperature || 0; break;
                case 'fDefStab': aVal = fDefA.forgingStabilisationRejection || 0; bVal = fDefB.forgingStabilisationRejection || 0; break;
                case 'fDefImp': aVal = fDefA.improperForging || 0; bVal = fDefB.improperForging || 0; break;
                case 'fDefDef': aVal = fDefA.forgingMarksNotches || 0; bVal = fDefB.forgingMarksNotches || 0; break;
                case 'qDefHard': aVal = qDefA.quenchingHardness || 0; bVal = qDefB.quenchingHardness || 0; break;
                case 'tempDefTemp': aVal = tempDefA.temperingTemp || 0; bVal = tempDefB.temperingTemp || 0; break;
                case 'tempDefDist': aVal = tempDefA.temperingDuration || 0; bVal = tempDefB.temperingDuration || 0; break;
                case 'dDefBox': aVal = dDefA.boxGauge || 0; bVal = dDefB.boxGauge || 0; break;
                case 'dDefBear': aVal = dDefA.flatBearingArea || 0; bVal = dDefB.flatBearingArea || 0; break;
                default: return 0;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [data, sortConfig]);

    if (!data || data.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400">
                No process defect records found for this call number.
            </div>
        );
    }

    // Inline sticky styles — guaranteed to override any global CSS
    const stickyTop = { position: 'sticky', top: 0, zIndex: 52 };
    const greenBg = { background: '#d1fae5', color: '#065f46' };
    const emerBg = { background: '#a7f3d0', color: '#064e3b' };
    const redBg = { background: '#fee2e2', color: '#991b1b' };

    return (
        <div ref={wrapperRef} className="report-table-wrapper sticky-header level-4-enhanced" style={{ overflowY: 'auto', overflowX: 'auto', minHeight: '200px' }}>
            <table className="report-data-table level-4-table">
                <thead>
                    <tr style={{ height: '42px' }}>
                        <th style={{ ...stickyTop, ...greenBg, cursor: 'pointer' }} className="bg-green-header" onClick={() => handleSort('date')}>DATE {renderSortIcon('date')}</th>
                        <th style={{ ...stickyTop, ...greenBg, cursor: 'pointer' }} className="bg-green-header" onClick={() => handleSort('shift')}>SHIFT {renderSortIcon('shift')}</th>
                        <th style={{ ...stickyTop, ...greenBg, cursor: 'pointer' }} className="bg-green-header" onClick={() => handleSort('poSrNo')}>PO_SR. NO. {renderSortIcon('poSrNo')}</th>
                        <th style={{ ...stickyTop, ...greenBg, cursor: 'pointer' }} className="bg-green-header" onClick={() => handleSort('lotNumber')}>LOT NO. {renderSortIcon('lotNumber')}</th>
                        <th style={{ ...stickyTop, ...emerBg, cursor: 'pointer' }} className="bg-emerald-header" onClick={() => handleSort('acceptedQty')}>Accepted Qty (Nos.) {renderSortIcon('acceptedQty')}</th>
                        <th style={{ ...stickyTop, ...redBg, cursor: 'pointer' }} className="bg-red-header" onClick={() => handleSort('rejectedQty')}>Rejected Qty (Nos.) {renderSortIcon('rejectedQty')}</th>
                        <th style={{ ...stickyTop, cursor: 'pointer' }} onClick={() => handleSort('shearRej')}>Shearing (Rej) {renderSortIcon('shearRej')}</th>
                        <th style={{ ...stickyTop, cursor: 'pointer' }} onClick={() => handleSort('turnRej')}>Turning Rej. {renderSortIcon('turnRej')}</th>
                        <th style={{ ...stickyTop, cursor: 'pointer' }} onClick={() => handleSort('mpiRej')}>MPI Rejection {renderSortIcon('mpiRej')}</th>
                        <th style={{ ...stickyTop, cursor: 'pointer' }} onClick={() => handleSort('forgeRej')}>Forging Rejection {renderSortIcon('forgeRej')}</th>
                        <th style={{ ...stickyTop, cursor: 'pointer' }} onClick={() => handleSort('quenchRej')}>Quenching Rejection {renderSortIcon('quenchRej')}</th>
                        <th style={{ ...stickyTop, cursor: 'pointer' }} onClick={() => handleSort('tempRej')}>Tempering Rejection {renderSortIcon('tempRej')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, idx) => {
                        const basic = row.basicDetails || {};
                        const qty = row.processQty || {};
                        const sDef = row.shearingDefects || {};
                        const tDef = row.turningDefects || {};
                        const fDef = row.forgingDefects || {};
                        const qDef = row.quenchingDefects || {};
                        const tempDef = row.temperingDefects || {};

                        const shearingTitle = `Length of Cut Bar: ${sDef.lengthOfCutBar || 0}\nOvality/Improper Dia at end: ${sDef.ovalityImproperDiaAtEnd || 0}\nSharp Edges: ${sDef.sharpEdges || 0}\nCracks: ${sDef.crackedEdges || 0}`;
                        const turningTitle = `Parallel Length: ${tDef.parallelLength || 0}\nFull Turning Length: ${tDef.fullTurningLength || 0}\nTurning Dia: ${tDef.turningDia || 0}`;
                        const mpiTitle = `MPI Rejection: ${qty.mpiRejectionQty || 0}`;
                        const forgingTitle = `Forging Temperature: ${fDef.forgingTemperature || 0}\nForging Stabilisation: ${fDef.forgingStabilisationRejection || 0}\nImproper Forging: ${fDef.improperForging || 0}\nForging Marks/Notches: ${fDef.forgingMarksNotches || 0}`;
                        const quenchingTitle = `Quenching Hardness: ${qDef.quenchingHardness || 0}`;
                        const temperingTitle = `Tempering Temp: ${tempDef.temperingTemp || 0}\nTempering Duration: ${tempDef.temperingDuration || 0}`;

                        return (
                            <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                <td>{basic.date ? new Date(basic.date).toLocaleDateString('en-GB') : 'N/A'}</td>
                                <td className="text-center"><span className="shift-badge">{basic.shift || '-'}</span></td>
                                <td className="text-center">{basic.poSrNo || '-'}</td>
                                <td className="text-center">{basic.lotNumber || '-'}</td>
                                <td className="text-center text-emerald-600 bg-emerald-50/30 font-bold">{basic.totalAcceptedQty?.toLocaleString() || 0}</td>
                                <td className="text-center text-red-600 bg-red-50/30 font-bold">{basic.totalRejectionQty?.toLocaleString() || 0}</td>
                                <td className="text-center text-red-500 font-medium" title={shearingTitle} style={{cursor: 'help'}}>{qty.shearingRejectionQty || 0}</td>
                                <td className="text-center text-red-500 font-medium" title={turningTitle} style={{cursor: 'help'}}>{qty.turningRejectionQty || 0}</td>
                                <td className="text-center text-red-500 font-medium" title={mpiTitle} style={{cursor: 'help'}}>{qty.mpiRejectionQty || 0}</td>
                                <td className="text-center text-red-500 font-medium" title={forgingTitle} style={{cursor: 'help'}}>{qty.forgingRejectionQty || 0}</td>
                                <td className="text-center text-red-500 font-medium" title={quenchingTitle} style={{cursor: 'help'}}>{qty.quenchingRejectionQty || 0}</td>
                                <td className="text-center text-red-500 font-medium" title={temperingTitle} style={{cursor: 'help'}}>{qty.temperingRejectionQty || 0}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <style jsx="true">{`
                .level-4-enhanced.sticky-header {
                    overflow: auto !important;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                
                .level-4-table {
                    border-collapse: separate !important;
                    border-spacing: 0 !important;
                    width: 100%;
                }
                
                .level-4-table thead th {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 50 !important;
                    box-shadow: inset 0 -1px 0 #e2e8f0, inset 0 1px 0 #e2e8f0;
                    padding: 8px 8px !important;
                    font-size: 11px !important;
                    white-space: nowrap !important;
                    box-sizing: border-box !important;
                    vertical-align: middle !important;
                }
                
                .level-4-table thead th:not(.bg-green-header):not(.bg-emerald-header):not(.bg-red-header) {
                    background: #f8fafc !important;
                }
                
                .level-4-table thead tr:nth-child(2) th {
                    position: sticky !important;
                    top: 42px !important;
                    z-index: 49 !important;
                    box-sizing: border-box !important;
                    padding: 6px 8px !important;
                    font-size: 10px !important;
                    vertical-align: middle !important;
                    white-space: nowrap !important;
                }

                .level-4-table thead tr:nth-child(2) th:not(.bg-green-header):not(.bg-emerald-header):not(.bg-red-header) {
                    background: #ffffff !important;
                }

                .bg-green-header {
                    background: #d1fae5 !important;
                    color: #065f46 !important;
                }
                
                .bg-emerald-header {
                    background: #ecfdf5 !important;
                    color: #047857 !important;
                }
                
                .bg-red-header {
                    background: #fef2f2 !important;
                    color: #b91c1c !important;
                }
                
                .level-4-table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #f1f5f9;
                    border-right: 1px solid #f1f5f9;
                    font-size: 13px;
                }
                
                .level-4-table .text-center {
                    text-align: center !important;
                }
                
                .level-4-table .stage-header {
                    border-bottom: 2px solid #e2e8f0 !important;
                }
                
                .level-4-table tr:hover td {
                    background-color: #f8fafc !important;
                }
            `}</style>
        </div>
    );
};



const MpiaDrillDown = ({ data = [], manufacturer, onBack, loading }) => {
    const [isPrinting, setIsPrinting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Fetching Monthly Analysis for {manufacturer}...</p>
            </div>
        );
    }

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 1200);
    };

    const handleDownloadImage = async () => {
        const chartElement = document.getElementById('mpia-report-content');
        if (!chartElement) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(chartElement, { scale: 2 });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Vendor_Wise_Report_${manufacturer}.png`;
            link.click();
        } catch (e) {
            console.error("Failed to generate image", e);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadPpt = async () => {
        const chartElement = document.getElementById('mpia-report-content');
        if (!chartElement) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(chartElement, { scale: 2 });
            const dataUrl = canvas.toDataURL('image/png');
            
            const pptx = new PptxGenJS();
            const slide = pptx.addSlide();
            
            slide.addText(`Vendor Wise Report: ${manufacturer}`, {
                x: 0.5, y: 0.3, fontSize: 18, bold: true, color: "363636"
            });
            
            slide.addImage({ data: dataUrl, x: 0.5, y: 0.8, w: 9, h: 4.5, sizing: { type: "contain", w: 9, h: 4.5 } });
            
            pptx.writeFile({ fileName: `Vendor_Wise_Report_${manufacturer}.pptx` });
        } catch (e) {
            console.error("Failed to generate PPT", e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-slate-50 p-6 min-h-screen">
            <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center no-print">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all font-medium"
                >
                    <span className="text-xl">←</span> Back to Summary
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadImage}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-sm no-print disabled:opacity-70"
                    >
                        {isExporting ? 'Exporting...' : <><span>📷</span> Image</>}
                    </button>
                    <button
                        onClick={handleDownloadPpt}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-bold shadow-sm no-print disabled:opacity-70"
                    >
                        {isExporting ? 'Exporting...' : <><span>📊</span> PPT</>}
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold shadow-lg no-print disabled:opacity-70"
                    >
                        {isPrinting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                Preparing PDF...
                            </>
                        ) : (
                            <>
                                <span>PDF</span> Download Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            <MpiaReportPage manufacturer={manufacturer} data={data} />
        </div>
    );
};


const MpiaReportPage = ({ manufacturer, data, showFooter = true }) => {
    const defectAgg = {
        'Shearing': 0, 'Turning': 0, 'Forging': 0, 'Finishing': 0, 'Quenching': 0, 'Tempering': 0
    };

    data.forEach(m => {
        defectAgg['Shearing'] += (m.shearingDefects?.lengthOfCutBar || 0) + (m.shearingDefects?.ovalityImproperDiaAtEnd || 0) + (m.shearingDefects?.sharpEdges || 0) + (m.shearingDefects?.crackedEdges || 0);
        defectAgg['Turning'] += (m.turningDefects?.parallelLength || 0) + (m.turningDefects?.fullTurningLength || 0) + (m.turningDefects?.turningDia || 0);
        defectAgg['Forging'] += (m.forgingDefects?.forgingTemperature || 0) + (m.forgingDefects?.forgingStabilisationRejection || 0) + (m.forgingDefects?.improperForging || 0) + (m.forgingDefects?.forgingMarksNotches || 0);
        defectAgg['Finishing'] += (m.finishingDefects?.paintIdentification || 0) + (m.finishingDefects?.ercCoating || 0);
        defectAgg['Quenching'] += (m.quenchingDefects?.quenchingTemperatureRejected || 0) + (m.quenchingDefects?.quenchingDurationRejected || 0) + (m.quenchingDefects?.quenchingHardnessRejected || 0) + (m.quenchingDefects?.boxGaugeRejected || 0) + (m.quenchingDefects?.flatBearingAreaRejected || 0);
        defectAgg['Tempering'] += (m.temperingDefects?.temperingTemp || 0) + (m.temperingDefects?.temperingDuration || 0);
    });

    const totalInspectedAllMonths = data.reduce((acc, m) => acc + (m.inspected || 0), 0);

    const pieData = Object.entries(defectAgg)
        .map(([name, value]) => ({
            name,
            value,
            rate: totalInspectedAllMonths > 0 ? (value / totalInspectedAllMonths) * 100 : 0
        }))
        .filter(d => d.value > 0);

    const totalDefects = pieData.reduce((acc, d) => acc + d.value, 0);

    const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <>
            <style type="text/css" media="print">
                {`@page { size: landscape; margin: 0; }`}
            </style>
            <div
                id="mpia-report-content"
                className="bg-white px-6 pb-6 pt-2 shadow-none rounded-sm mx-auto print-container page-break full-report-page"
                style={{
                    width: '280mm',
                    height: '190mm',
                    minHeight: '190mm',
                    maxHeight: '190mm',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    margin: '0 auto',
                    border: 'none',
                    background: 'white'
                }}
            >
                <div className="text-center mb-2">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{manufacturer}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Manufacturer Performance Analysis (Monthly)</p>
                    <div className="h-1 w-20 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
                </div>

                <div className="grid grid-cols-2 gap-8 items-start">
                    <div className="flex flex-col items-center">
                        <h3 className="font-bold text-slate-700 mb-2 text-sm uppercase">Process Defect Distribution</h3>
                        {pieData.length > 0 ? (
                            <PieChart
                                width={340}
                                height={280}
                                margin={{ top: 0, right: 60, bottom: 0, left: 60 }}
                            >
                                <Pie
                                    data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} minAngle={15} dataKey="value"
                                    isAnimationActive={false}
                                    label={({ cx, cy, midAngle, outerRadius, name, percent, payload }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = outerRadius + 25;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10" fontWeight="700">
                                                {`${name} ${payload.rate.toFixed(2)}%`}
                                            </text>
                                        );
                                    }}
                                    labelLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl w-full">
                                <p className="text-slate-400 italic text-sm">No process defects recorded.</p>
                            </div>
                        )}
                        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                            {pieData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                                    <span>{d.name}: {d.value} Nos. ({((d.value / totalDefects) * 100).toFixed(0)}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-700 mb-6 text-sm flex items-center gap-2 uppercase">Monthly Performance</h3>
                        <div className="overflow-hidden border border-slate-100 rounded-xl">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-800 text-white" style={{ backgroundColor: '#1e293b', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <tr>
                                        <th className="p-3 text-left">MONTH</th>
                                        <th className="p-3 text-right">INSPECTED (Nos.)</th>
                                        <th className="p-3 text-right">REJECTED (Nos.)</th>
                                        <th className="p-3 text-right">% REJ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((m, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-bold text-slate-700 uppercase">
                                                {(() => {
                                                    const [year, month] = (m.month || '').split('-');
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return month ? `${months[parseInt(month) - 1]} ${year}` : m.month;
                                                })()}
                                            </td>
                                            <td className="p-3 text-right font-medium text-slate-600">{m.inspected}</td>
                                            <td className="p-3 text-right font-bold text-red-600">{m.processRejected}</td>
                                            <td className="p-3 text-right">
                                                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold">
                                                    {m.processRejPercent?.toFixed(2)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr><td colSpan="4" className="p-4 text-center italic text-slate-400">No data available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <p className="text-[9px] text-slate-400 font-bold mb-1">INSPECTED (Nos.)</p>
                                <p className="text-sm font-black text-slate-800">{data.reduce((acc, m) => acc + (m.inspected || 0), 0)}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <p className="text-[9px] text-slate-400 font-bold mb-1">REJECTED (Nos.)</p>
                                <p className="text-sm font-black text-red-600">{data.reduce((acc, m) => acc + (m.processRejected || 0), 0)}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                <p className="text-[9px] text-slate-400 font-bold mb-1">AVG% REJ</p>
                                <p className="text-sm font-black text-slate-800">
                                    {totalInspectedAllMonths > 0 ? ((data.reduce((acc, m) => acc + (m.processRejected || 0), 0) / totalInspectedAllMonths) * 100).toFixed(2) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {showFooter && (
                    <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-300 flex justify-between font-bold uppercase">
                        <span>SARTHI RAILWAY DASHBOARD - CONFIDENTIAL</span>
                        <span>GENERATED ON: {new Date().toLocaleDateString()}</span>
                    </div>
                )}
            </div>
        </>
    );
};

const SCADA_MANUFACTURERS = [
    { label: 'Patil Rail Infrastructure Pvt. Ltd.', value: 'PRIL' }
];

const SCADA_UNITS = [
    { label: 'Medchal Unit', value: 'MDL-U1' }
];

const SCADA_LINES = [
    { label: 'line 1', value: 'L1' }
];

const SCADA_STAGES = [
    { label: 'AUTO_COPYING', value: 'AUTO_COPYING' },
    { label: 'BAR_CROPPING', value: 'BAR_CROPPING' }
];

const ScadaMonitor = ({ selectedProduct }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [manufacturer, setManufacturer] = useState('');
    const [unit, setUnit] = useState('');
    const [line, setLine] = useState('');
    const [stage, setStage] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('No Data');
    const [lastTimestamp, setLastTimestamp] = useState('N/A');

    useEffect(() => {
        const fetchScadaData = async () => {
            if (selectedProduct === 'Rail Pad') return;

            if (!manufacturer || !unit || !line || !stage) {
                setData([]);
                setStatus('No Data');
                setLastTimestamp('N/A');
                return;
            }

            setLoading(true);
            setError(null);

            const apiType = (selectedProduct || '').toUpperCase().replace(' ', '');

            const params = new URLSearchParams({
                type: apiType,
                plant: manufacturer,
                plantUnit: unit,
                line: line,
                machine: stage,
                page: currentPage.toString(),
                size: '30'
            });

            const scadaUrl = `https://scada.ritesqasarthi.com/api/scada/scada?${params.toString()}`;

            let success = false;
            let finalData = [];

            try {
                const fetchOptions = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(localStorage.getItem('authToken') && { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })
                    }
                };

                const response = await fetch(scadaUrl, fetchOptions);

                if (response.ok) {
                    const resData = await response.json();
                    finalData = Array.isArray(resData) ? resData : (resData.content || []);
                    success = true;
                }
            } catch (err) {
                // silent fail
            }

            if (success) {
                setData(finalData);
                setStatus(finalData.length > 0 ? 'Live' : 'No Data');
                setLastTimestamp(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
            } else {
                setError('Failed to connect to SCADA servers.');
                setStatus('No Data');
                setData([]);
            }
            setLoading(false);
        };

        fetchScadaData();
    }, [manufacturer, unit, line, stage, selectedProduct, currentPage]);

    if (selectedProduct === 'Rail Pad') {
        return (
            <div className="scada-monitor-container fade-in" style={{ padding: '20px 0' }}>
                <div className="prof-card" style={{
                    padding: '80px 20px',
                    background: '#fff',
                    borderRadius: '16px',
                    border: '1px dashed #10b981',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#f0fdf4',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <i className="fa-solid fa-person-digging" style={{ fontSize: '40px', color: '#10b981' }}></i>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#14532d', marginBottom: '12px' }}>
                        SCADA Live Monitor - Rail Pad
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '400px', lineHeight: '1.6' }}>
                        We are currently integrating the SCADA systems for Rail Pad manufacturing units. This feature will be available soon.
                    </p>
                    <div style={{
                        marginTop: '30px',
                        padding: '8px 16px',
                        background: '#f0fdf4',
                        color: '#166534',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Under Development
                    </div>
                </div>
            </div>
        );
    }

    const COLUMN_ORDER = ['time', 'PO_No', 'Heat_Code', 'sample', 'length', 'end'];
    const EXCLUDED_COLUMNS = ['line', 'module', 'plant', 'topic', 'machine', 'host', 'result', 'table'];

    const COLUMN_LABELS = {
        'time': 'Date & Time',
        'PO_No': 'PO Number',
        'Heat_Code': 'Heat Number',
        'length': 'Length(mm)',
        'sample': 'Sample Number',
        'end': 'End Squareness (mm)',
        'MC': 'Machine Number',
        'mc': 'Machine Number',
        'DIA': 'Diameter (mm)',
        'dia': 'Diameter (mm)'
    };

    const getColumnLabel = (col) => {
        const lowerCol = String(col).trim().toLowerCase();
        if (lowerCol === 'mc') return 'Machine Number';
        if (lowerCol === 'dia') return 'Diameter (mm)';
        return COLUMN_LABELS[col] || COLUMN_LABELS[lowerCol] || col;
    };


    const rawKeys = data.length > 0
        ? Object.keys(data[0]).filter(key => !EXCLUDED_COLUMNS.includes(key))
        : [];

    const columns = [];
    COLUMN_ORDER.forEach(orderedKey => {
        if (rawKeys.includes(orderedKey)) {
            columns.push(orderedKey);
        }
    });
    rawKeys.forEach(k => {
        if (!COLUMN_ORDER.includes(k)) {
            columns.push(k);
        }
    });

    const rowsPerPage = 30;
    const totalPages = data.length === 30 ? currentPage + 2 : currentPage + 1;
    const start = currentPage * rowsPerPage;
    const end = start + data.length;
    const totalElements = data.length === 30 ? (currentPage + 2) * 30 : (currentPage * 30 + data.length);

    return (
        <div className="scada-monitor-container fade-in" style={{ padding: '10px 0' }}>
            <div className="prof-card mb-6" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #d1fae5' }}>
                <div className="sec-title" style={{ fontSize: '18px', color: '#14532d', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-desktop"></i> SCADA Live Monitor - {selectedProduct}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '5px' }}>Manufacturer</label>
                        <select
                            value={manufacturer}
                            onChange={(e) => { setManufacturer(e.target.value); setCurrentPage(0); }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#f0fdf4', fontSize: '13px' }}
                        >
                            <option value="">Select Manufacturer</option>
                            {SCADA_MANUFACTURERS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '5px' }}>Unit</label>
                        <select
                            value={unit}
                            onChange={(e) => { setUnit(e.target.value); setCurrentPage(0); }}
                            disabled={!manufacturer}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0', background: manufacturer ? '#f0fdf4' : '#f8fafc', fontSize: '13px' }}
                        >
                            <option value="">Select Unit</option>
                            {SCADA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '5px' }}>Line</label>
                        <select
                            value={line}
                            onChange={(e) => { setLine(e.target.value); setCurrentPage(0); }}
                            disabled={!unit}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0', background: unit ? '#f0fdf4' : '#f8fafc', fontSize: '13px' }}
                        >
                            <option value="">Select Line</option>
                            {SCADA_LINES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '5px' }}>Data Acquisition Stage</label>
                        <select
                            value={stage}
                            onChange={(e) => { setStage(e.target.value); setCurrentPage(0); }}
                            disabled={!line}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0', background: line ? '#f0fdf4' : '#f8fafc', fontSize: '13px' }}
                        >
                            <option value="">Select Stage</option>
                            {SCADA_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #d1fae5', paddingTop: '15px', marginTop: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: status === 'Live' ? '#22c55e' : '#cbd5e1',
                                display: 'inline-block',
                                animation: status === 'Live' ? 'pulse 2s infinite' : 'none'
                            }}></span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: status === 'Live' ? '#15803d' : '#64748b' }}>{status}</span>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="prof-card" style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #d1fae5', textAlign: 'center' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '36px', color: '#16a34a', marginBottom: '15px' }}></i>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Fetching live feeds from SCADA gateway...</div>
                </div>
            ) : error ? (
                <div className="prof-card" style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #d1fae5', textAlign: 'center' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '36px', color: '#dc2626', marginBottom: '15px' }}></i>
                    <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: 'bold' }}>{error}</div>
                </div>
            ) : data.length > 0 ? (
                <div className="prof-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #d1fae5', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div className="sec-title" style={{ marginBottom: 0 }}>
                            Live Data Feed <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>({data.length} records)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <ExportButton
                                onClick={() => {
                                    const excelColumns = columns.map(col => ({
                                        label: getColumnLabel(col),
                                        key: col
                                    }));
                                    downloadExcel(data, excelColumns, `SCADA_Live_Feed_${selectedProduct}_Page_${currentPage + 1}`);
                                }}
                            />
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                Last Received: <span style={{ color: '#1e293b' }}>{lastTimestamp}</span>
                            </div>
                        </div>
                    </div>

                    <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th key={col} style={{ background: '#1e3a8a', color: '#fff', padding: '10px', fontSize: '12px', textTransform: 'uppercase' }}>
                                        {getColumnLabel(col)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f0fdf4', borderBottom: '1px solid #e2e8f0' }}>
                                    {columns.map(col => (
                                        <td key={col} style={{ padding: '10px', fontSize: '13px', color: '#1e293b' }}>
                                            {col === 'time'
                                                ? new Date(row[col]).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                                                : typeof row[col] === 'object'
                                                    ? JSON.stringify(row[col])
                                                    : String(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage} totalPages={totalPages}
                            start={start} end={end}
                            totalCount={totalElements} onPageChange={setCurrentPage}
                            rows={rowsPerPage} onRowsChange={() => { }}
                            showRows={false}
                        />
                    </div>
                </div>
            ) : (
                <div className="prof-card" style={{ background: '#fff', padding: '40px', borderRadius: '12px', border: '1px solid #d1fae5', textAlign: 'center' }}>
                    <i className="fa-solid fa-tower-broadcast" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '15px' }}></i>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#64748b', marginBottom: '5px' }}>No Data Available</div>
                    <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                        Please select Manufacturer, Unit, Line, and Data Acquisition Stage to view the live SCADA data feed.
                    </p>
                </div>
            )}
        </div>
    );
};
