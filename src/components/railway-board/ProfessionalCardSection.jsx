import React, { useState, useEffect } from 'react'; // Re-adding hooks
import reportService from '../../services/reportService';
import Pagination from '../Pagination';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, Line, ComposedChart, AreaChart, Area, LabelList
} from 'recharts';
import { formatDecimal } from '../../utils/helpers';
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

        const isUnderDev = (!isErc && !isSleeper) || (isSleeper && activeMainCard !== 'summary' && activeMainCard !== 'quality' && activeMainCard !== 'lifecycle' && activeMainCard !== 'feedback' && activeMainCard !== 'reports' && activeMainCard !== 'scada');



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
                                return <SleeperSummary summaryData={summaryData} />;
                            }
                            const s = summaryData || {};

                            return (
                                <div className="summary-tab-content">
                                    <div className="g3 mb">
                                        <div className="prof-card card-dark-green" style={{ textAlign: 'center' }}>
                                            <div className="kpi-lbl">PO Issued</div>
                                            <div className="kpi-val">{(s.poIssued || 412).toLocaleString()}</div>
                                            <div className="kpi-sub">Nos.</div>
                                        </div>
                                        <div className="prof-card card-ocean" style={{ textAlign: 'center' }}>
                                            <div className="kpi-lbl">PO Quantity</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                                <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '4px' }}>
                                                    <div className="kpi-val" style={{ fontSize: '26px' }}>{(s.poQuantityNos || 0).toLocaleString()}</div>
                                                    <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>Nos.</div>
                                                </div>
                                                <div style={{ paddingLeft: '4px' }}>
                                                    <div className="kpi-val" style={{ fontSize: '26px' }}>{(s.poQuantityMt || 0).toLocaleString()}</div>
                                                    <div className="kpi-sub" style={{ fontSize: '11px', opacity: 0.9 }}>MT</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="prof-card card-indigo" style={{ textAlign: 'center' }}>
                                            <div className="kpi-lbl">Final Inspection Qty</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                                <div style={{ borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '4px' }}>
                                                    <div className="kpi-val" style={{ fontSize: '26px' }}>{(s.finalInspectionQuantity || 0).toLocaleString()}</div>
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
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>Inspection Calls Status</span>
                                    </div>
                                    <div className="g3 mb">
                                        {['RM', 'Process', 'Final'].map((cat, idx) => {
                                            const d = (inspectionCallStatusData?.length > 0 ? inspectionCallStatusData : staticInspectionCallsData).find(x => x.name === cat || x.category === cat);
                                            return (
                                                <div className="prof-card" key={idx} style={{
                                                    padding: '15px',
                                                    borderLeft: cat === 'RM' ? '4px solid #3b82f6' : cat === 'Process' ? '4px solid #f59e0b' : '4px solid #ef4444',
                                                    background: cat === 'RM' ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : cat === 'Process' ? 'linear-gradient(135deg, #fff7ed, #ffedd5)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>{cat} Stage</span>
                                                        <span className="prof-badge" style={{ background: '#f8fafc', color: '#64748b', fontSize: '10px' }}>CALLS</span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>UNDER INSPECTION</div>
                                                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{d?.under?.toLocaleString() || '0'}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PENDING</div>
                                                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{d?.pending?.toLocaleString() || '0'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="sec-title-flex" style={{ marginBottom: '12px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>Inspection Details</span>
                                    </div>
                                    <div className="g3 mb">
                                        {['RM', 'Process', 'Final'].map((cat, idx) => {
                                            const d = (inspectionDetailsData?.length > 0 ? inspectionDetailsData : staticInspectionDetailsData).find(x => x.name === cat);
                                            return (
                                                <div className="prof-card" key={idx} style={{
                                                    padding: '15px',
                                                    borderLeft: cat === 'RM' ? '4px solid #0d9488' : cat === 'Process' ? '4px solid #7c3aed' : '4px solid #db2777',
                                                    background: cat === 'RM' ? 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' : cat === 'Process' ? 'linear-gradient(135deg, #f5f3ff, #ede9fe)' : 'linear-gradient(135deg, #fff1f2, #ffe4e6)'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>{cat} Stage</span>
                                                        <span className="prof-badge" style={{ background: '#f8fafc', color: '#64748b', fontSize: '10px' }}>Nos.</span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>ACCEPTED (Nos.)</div>
                                                            <div style={{ fontSize: '26px', fontWeight: '800', color: '#22c55e' }}>{d?.accepted?.toLocaleString() || '0'}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>REJECTED (Nos.)</div>
                                                            <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444' }}>{d?.rejected?.toLocaleString() || '0'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="prof-card">
                                        <div className="sec-title">Production & Rejection</div>
                                        {(() => {
                                            const procData = (inspectionDetailsData?.length > 0 ? inspectionDetailsData : staticInspectionDetailsData).find(x => x.name === 'Process');
                                            const pAcc = procData?.accepted || 0;
                                            const pRej = procData?.rejected || 0;
                                            const pInsp = pAcc + pRej;
                                            const pRejPct = pInsp > 0 ? (pRej * 100) / pInsp : 0;

                                            return (
                                                <div className="g4">
                                                    <div className="prof-card card-spring-green" style={{ textAlign: 'center' }}>
                                                        <div className="kpi-lbl" style={{ color: '#065f46' }}>Avg Production/Day</div>
                                                        <div className="kpi-val" style={{ color: '#064e3b' }}>{(Math.round(s.avgProductionPerDay ?? 947)).toLocaleString()}</div>
                                                        <div className="kpi-sub" style={{ color: '#047857' }}>Nos.</div>
                                                    </div>
                                                    <div className="prof-card card-lime" style={{ textAlign: 'center' }}>
                                                        <div className="kpi-lbl" style={{ color: '#3f6212' }}>Process Rejection</div>
                                                        <div className="kpi-val" style={{ color: '#365314' }}>{formatDecimal(pRejPct)}%</div>
                                                        <div className="prof-prog"><div className="prof-prog-f" style={{ width: `${Math.min(100, pRejPct * 10)}%`, background: '#84cc16' }}></div></div>
                                                    </div>
                                                    <div className="prof-card card-ruby" style={{ textAlign: 'center' }}>
                                                        <div className="kpi-lbl" style={{ color: '#991b1b' }}>Final Rejection</div>
                                                        <div className="kpi-val" style={{ color: '#7f1d1d' }}>{formatDecimal(s.finalRejectionPercentage ?? 1.8)}%</div>
                                                        <div className="prof-prog"><div className="prof-prog-f" style={{ width: `${Math.min(100, (s.finalRejectionPercentage ?? 1.8) * 10)}%`, background: '#e11d48' }}></div></div>
                                                    </div>
                                                    <div className="prof-card card-gold" style={{ textAlign: 'center' }}>
                                                        <div className="kpi-lbl" style={{ color: '#854d0e' }}>RM Rejection</div>
                                                        <div className="kpi-val" style={{ color: '#713f12' }}>{formatDecimal(s.rmRejectionPercentage ?? 3.2)}%</div>
                                                        <div className="prof-prog"><div className="prof-prog-f" style={{ width: `${Math.min(100, (s.rmRejectionPercentage ?? 3.2) * 10)}%`, background: '#eab308' }}></div></div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
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
                                                <div className="prof-card card-red" style={{ textAlign: 'center' }}>
                                                    <div className="kpi-lbl" style={{ color: '#991b1b' }}>Process Overall Rejection %</div>
                                                    <div className="kpi-val" style={{ color: '#7f1d1d' }}>{formatDecimal(pRejPct)}%</div>
                                                </div>
                                                <div className="prof-card card-mint" style={{ textAlign: 'center' }}>
                                                    <div className="kpi-lbl" style={{ color: '#166534' }}>Top Defect</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534', marginTop: '5px' }}>{paretoAnalysisData?.[0]?.name || 'Turning Length'}</div>
                                                </div>
                                                <div className="prof-card card-amber" style={{ textAlign: 'center' }}>
                                                    <div className="kpi-lbl" style={{ color: '#92400e' }}>Worst Plant</div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#78350f', marginTop: '5px' }}>{processPerformanceData?.worstPerforming?.length > 0 ? processPerformanceData.worstPerforming[0]?.name : manufacturerRejectionData?.length > 0 ? [...manufacturerRejectionData].sort((a, b) => b.value - a.value)[0]?.name : 'Adinath Industries'}</div>
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
                                                            data={stepWiseRejectionData?.length ? stepWiseRejectionData : [
                                                                { name: 'Shearing', value: 12, color: '#3b82f6' },
                                                                { name: 'Turning', value: 22, color: '#f59e0b' },
                                                                { name: 'MPI', value: 10, color: '#8b5cf6' },
                                                                { name: 'Forging', value: 18, color: '#ef4444' },
                                                                { name: 'Quenching', value: 14, color: '#10b981' },
                                                                { name: 'Tempering', value: 9, color: '#06b6d4' }
                                                            ]}
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                        >
                                                            {(stepWiseRejectionData?.length ? stepWiseRejectionData : [
                                                                { color: '#3b82f6' }, { color: '#f59e0b' },
                                                                { color: '#8b5cf6' }, { color: '#ef4444' },
                                                                { color: '#10b981' }, { color: '#06b6d4' }
                                                            ]).map((entry, i) => (
                                                                <Cell key={`cell-${i}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(v) => `${v}%`} />
                                                        <Legend
                                                            layout="vertical"
                                                            align="right"
                                                            verticalAlign="middle"
                                                            iconType="circle"
                                                            formatter={(value, entry) => (
                                                                <span style={{
                                                                    color: entry.color,
                                                                    fontWeight: '700',
                                                                    display: 'inline-flex',
                                                                    justifyContent: 'space-between',
                                                                    width: '160px',
                                                                    verticalAlign: 'middle'
                                                                }}>
                                                                    <span>{value}</span>
                                                                    <span>{entry.payload.value}%</span>
                                                                </span>
                                                            )}
                                                            wrapperStyle={{
                                                                fontSize: '13px',
                                                                paddingLeft: '20px',
                                                                lineHeight: '28px'
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="prof-card">
                                            <div className="sec-title">Pareto Analysis</div>
                                            <div className="chart-wrap" style={{ height: '230px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ComposedChart data={paretoAnalysisData?.map(d => ({ ...d, count: d.count || d.value || 0 }))}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="name"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            interval={0}
                                                            height={85}
                                                            tick={<ParetoXAxisTick />}
                                                        />
                                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: '9px' }} />
                                                        <YAxis
                                                            yAxisId="right"
                                                            orientation="right"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            unit="%"
                                                            style={{ fontSize: '9px' }}
                                                            domain={[0, 100]}
                                                        />
                                                        <Tooltip />
                                                        <Bar yAxisId="left" dataKey="count" fill="#16a34a" radius={[2, 2, 0, 0]} barSize={20} />
                                                        <Line
                                                            yAxisId="right"
                                                            type="monotone"
                                                            dataKey="cumulative"
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
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                                                        <YAxis axisLine={false} tickLine={false} unit="%" style={{ fontSize: '10px' }} />
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
                                                            style={{ fontSize: '9px', fontWeight: '500' }}
                                                            tickFormatter={(name) => name.length > 12 ? name.substring(0, 10) + '...' : name}
                                                        />
                                                        <YAxis axisLine={false} tickLine={false} unit="%" style={{ fontSize: '9px' }} />
                                                        <Tooltip formatter={(v) => `${v}%`} />
                                                        <Bar dataKey="value" fill="#166534" radius={[4, 4, 0, 0]} barSize={24}>
                                                            <LabelList dataKey="value" position="top" formatter={(v) => `${formatDecimal(v)}%`} style={{ fontSize: '9px', fill: '#166534', fontWeight: 'bold' }} />
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
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                                                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
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
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                                                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                                                        <Tooltip />
                                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
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
                                                            style={{ fontSize: '9px', fontWeight: '600', fill: '#475569' }}
                                                            width={90}
                                                            tickFormatter={(name) => name.length > 15 ? name.substring(0, 12) + '...' : name}
                                                        />
                                                        <Tooltip formatter={(v) => `${v}%`} />
                                                        <Bar dataKey="value" fill="#10b981" barSize={16} radius={[0, 4, 4, 0]}>
                                                            <LabelList dataKey="value" position="right" formatter={(v) => `${formatDecimal(v)}%`} style={{ fontSize: '10px', fontWeight: '700', fill: '#059669' }} />
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
                                                            style={{ fontSize: '9px', fontWeight: '600', fill: '#475569' }}
                                                            width={90}
                                                            tickFormatter={(name) => name.length > 15 ? name.substring(0, 12) + '...' : name}
                                                        />
                                                        <Tooltip formatter={(v) => `${v}%`} />
                                                        <Bar dataKey="value" fill="#ef4444" barSize={16} radius={[0, 4, 4, 0]}>
                                                            <LabelList dataKey="value" position="right" formatter={(v) => `${formatDecimal(v)}%`} style={{ fontSize: '10px', fontWeight: '700', fill: '#dc2626' }} />
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
                            return (

                                <div className="lifecycle-tab-content fade-in">
                                    <div className="prof-card mb">
                                        <div className="sec-title">Purchase Order Lifecycle Tracking</div>

                                        {poTable}
                                    </div>
                                </div>
                            );

                        case 'performance':
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
                                                    {getSortedData(filteredPerfRecords).map((record, idx) => (
                                                        <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                            <td>{(perfPage * perfRowsPerPage) + idx + 1}</td>
                                                            <td>{record.manufacturerName}</td>
                                                            <td><span className="prof-badge" style={{ background: '#f0fdf4', color: '#166534' }}>{record.rio}</span></td>
                                                            <td>👤 {record.username}</td>
                                                            <td><span className="prof-badge" style={{ background: '#f0f9ff', color: '#075985' }}>{record.stage}</span></td>
                                                            <td className="text-right">{record.inspectedQty?.toLocaleString()}</td>
                                                            <td className="text-right" style={{ color: '#16a34a' }}>{record.acceptedQty?.toLocaleString()}</td>
                                                            <td className="text-right" style={{ color: '#dc2626' }}>{record.rejectedQty?.toLocaleString()}</td>
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
                                                currentPage={perfPage} totalPages={perfPagination.totalPages}
                                                start={perfPage * perfRowsPerPage} end={Math.min((perfPage + 1) * perfRowsPerPage, perfPagination.totalElements)}
                                                totalCount={perfPagination.totalElements} onPageChange={setPerfPage}
                                                rows={perfRowsPerPage} onRowsChange={setPerfRowsPerPage}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );

                        case 'reports':
                            return (
                                <div className="reports-tab-content fade-in">
                                    <div className="sub-tabs">
                                        <div className={`sub-tab-btn ${activeReport === 'mpr' ? 'active' : ''}`} onClick={() => { setActiveReport('mpr'); onReportTabChange('mpr'); }}>📋 MPR</div>
                                        <div className={`sub-tab-btn ${activeReport === 'mau' ? 'active' : ''}`} onClick={() => { setActiveReport('mau'); onReportTabChange('mau'); }}>📈 MAU</div>
                                        <div className={`sub-tab-btn ${activeReport === 'lwcl' ? 'active' : ''}`} onClick={() => { setActiveReport('lwcl'); onReportTabChange('lwcl'); }}>🔄 LWCL</div>
                                        {!isSleeper && <div className={`sub-tab-btn ${activeReport === 'mpia' ? 'active' : ''}`} onClick={() => { setActiveReport('mpia'); onReportTabChange('mpia'); }}>⚙️ MPIA</div>}
                                    </div>

                                    <div className="report-viewer-content">
                                        {activeReport === 'mpr' && (
                                            isSleeper ? <SleeperMprReport mprData={mprData} loading={mprLoading} /> : (
                                                <div className="prof-card animate-up">

                                                    <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>Monthly Progress Report</span>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <ExportButton
                                                                onClick={() => downloadExcel(
                                                                    displayMprData,
                                                                    [
                                                                        { label: 'Rly', key: 'rly' },
                                                                        { label: 'PO Number', key: 'poNumber' },
                                                                        { label: 'Manufacturer', key: 'manufacturer' },
                                                                        { label: 'PO Qty', key: 'poQty' },
                                                                        { label: 'RM', key: 'monthlyRm' },
                                                                        { label: 'Process', key: 'monthlyProcess' },
                                                                        { label: 'Final', key: 'monthlyFinal' },
                                                                        { label: 'Total Final Inspected', key: 'totalFinalInspected' },
                                                                        { label: 'Balance', key: 'poBalance' }
                                                                    ],
                                                                    'Monthly_Progress_Report'
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
                                                                    <th onClick={() => handleMprSort('manufacturer')}>Manufacturer {renderSortIcon('manufacturer', mprSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMprSort('poQty')}>PO Qty {renderSortIcon('poQty', mprSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMprSort('monthlyRm')}>RM {renderSortIcon('monthlyRm', mprSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMprSort('monthlyProcess')}>Process {renderSortIcon('monthlyProcess', mprSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMprSort('monthlyFinal')}>Final {renderSortIcon('monthlyFinal', mprSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMprSort('totalFinalInspected')}>Total Final Inspected {renderSortIcon('totalFinalInspected', mprSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMprSort('poBalance')}>Balance {renderSortIcon('poBalance', mprSort)}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {displayMprData.map((row, idx) => (
                                                                    <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                                        <td>{row.rly}</td>
                                                                        <td>{row.poNumber}</td>
                                                                        <td>{row.manufacturer}</td>
                                                                        <td className="text-right">{row.poQty?.toLocaleString()}</td>
                                                                        <td className="text-right">{row.monthlyRm?.toLocaleString()}</td>
                                                                        <td className="text-right">{row.monthlyProcess?.toLocaleString()}</td>
                                                                        <td className="text-right">{row.monthlyFinal?.toLocaleString()}</td>
                                                                        <td className="text-right">{row.totalFinalInspected?.toLocaleString()}</td>
                                                                        <td className="text-right font-bold" style={{ color: '#16a34a' }}>{row.poBalance?.toLocaleString()}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Pagination
                                                            currentPage={mprPage} totalPages={mprPagination.totalPages}
                                                            start={mprPage * mprRowsPerPage} end={Math.min((mprPage + 1) * mprRowsPerPage, mprPagination.totalElements)}
                                                            totalCount={mprPagination.totalElements} onPageChange={setMprPage}
                                                            rows={mprRowsPerPage} onRowsChange={setMprRowsPerPage}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {activeReport === 'mau' && (
                                            isSleeper ? <SleeperMauReport startDate={fromDate} endDate={toDate} /> : (
                                                <div className="prof-card animate-up">
                                                    <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>Monthly Analysis of Units</span>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <ExportButton
                                                                onClick={() => downloadExcel(
                                                                    displayMauData,
                                                                    [
                                                                        { label: 'Manufacturer', key: 'manufacturer' },
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
                                                                    <th className="text-right" onClick={() => handleMauSort('manufactured')}>Manufactured {renderSortIcon('manufactured', mauSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMauSort('inspected')}>Inspected {renderSortIcon('inspected', mauSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMauSort('rejected')}>Rejected {renderSortIcon('rejected', mauSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMauSort('rmRejPercent')}>RM % {renderSortIcon('rmRejPercent', mauSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMauSort('processRejPercent')}>Process % {renderSortIcon('processRejPercent', mauSort)}</th>
                                                                    <th className="text-right" onClick={() => handleMauSort('finalRejPercent')}>Final % {renderSortIcon('finalRejPercent', mauSort)}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {displayMauData.map((row, idx) => (
                                                                    <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                                        <td>{row.manufacturer}</td>
                                                                        <td className="text-right">{row.manufactured?.toLocaleString()}</td>
                                                                        <td className="text-right">{row.inspected?.toLocaleString()}</td>
                                                                        <td className="text-right" style={{ color: '#dc2626' }}>{row.rejected?.toLocaleString()}</td>
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
                                                            currentPage={mauPage} totalPages={mauPagination.totalPages}
                                                            start={mauPage * mauRowsPerPage} end={Math.min((mauPage + 1) * mauRowsPerPage, mauPagination.totalElements)}
                                                            totalCount={mauPagination.totalElements} onPageChange={setMauPage}
                                                            rows={mauRowsPerPage} onRowsChange={setMauRowsPerPage}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {activeReport === 'lwcl' && (
                                            isSleeper ? <SleeperLwclReport /> : (
                                                <div className="prof-card animate-up">
                                                    <div className="sec-title">Lot Wise Closed Loop</div>
                                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                                        <select className="prof-select" style={{ maxWidth: '300px' }} value={lwclCallNo} onChange={(e) => setLwclCallNo(e.target.value)}>
                                                            <option value="">Select Call No.</option>
                                                            {lwclRequestIds.map(id => <option key={id} value={id}>{id}</option>)}
                                                        </select>
                                                    </div>
                                                    {level4Loading ? (
                                                        <div className="p-12 text-center text-teal font-medium">Loading Process Defect Summary...</div>
                                                    ) : lwclCallNo ? (
                                                        <Level4ReportTable data={level4Data} />
                                                    ) : (
                                                        <div className="p-12 text-center text-slate-400">
                                                            Please select a <strong>Call Number</strong> from the dropdown above to view the report details.
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}

                                        {activeReport === 'mpia' && (
                                            isSleeper ? (
                                                <div className="prof-card animate-up p-8 text-center">
                                                    <div style={{ fontSize: '3rem' }}>⚙️</div>
                                                    <h3 className="mt-4 text-xl font-bold">Sleeper MPIA</h3>
                                                    <p className="text-slate-500">Manufacture Process Inspection Analysis for Sleepers is in preparation.</p>
                                                </div>
                                            ) : (
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
                                                                <span>Manufacture Process Inspection Analysis</span>
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
                                                                            'Manufacture_Process_Inspection_Analysis_Summary'
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
                                                                            <th className="text-right" onClick={() => handleMpiaSort('totalInspected')}>Total Inspected {renderSortIcon('totalInspected', mpiaSort)}</th>
                                                                            <th className="text-right" onClick={() => handleMpiaSort('totalAccepted')}>Total Accepted {renderSortIcon('totalAccepted', mpiaSort)}</th>
                                                                            <th className="text-right" onClick={() => handleMpiaSort('totalRejected')}>Total Rejected {renderSortIcon('totalRejected', mpiaSort)}</th>
                                                                            <th className="text-right" onClick={() => handleMpiaSort('rejectionPercent')}>Rejection % {renderSortIcon('rejectionPercent', mpiaSort)}</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {displayMpiaData.map((row, idx) => (
                                                                            <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                                                                <td
                                                                                    className="font-bold text-emerald-800 cursor-pointer hover:underline"
                                                                                    onClick={() => setDrilldownManufacturer(row.manufacture)}
                                                                                >
                                                                                    {row.manufacture}
                                                                                </td>
                                                                                <td className="text-right">{row.totalInspected?.toLocaleString()}</td>
                                                                                <td className="text-right" style={{ color: '#16a34a' }}>{row.totalAccepted?.toLocaleString()}</td>
                                                                                <td className="text-right" style={{ color: '#dc2626' }}>{row.totalRejected?.toLocaleString()}</td>
                                                                                <td className="text-right">
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
                                                                    currentPage={mpiaPage} totalPages={mpiaPagination.totalPages}
                                                                    start={mpiaPage * mpiaRowsPerPage} end={Math.min((mpiaPage + 1) * mpiaRowsPerPage, mpiaPagination.totalElements)}
                                                                    totalCount={mpiaPagination.totalElements} onPageChange={setMpiaPage}
                                                                    rows={mpiaRowsPerPage} onRowsChange={setMpiaRowsPerPage}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        )}


                                    </div>
                                </div>
                            );
                        case 'feedback':
                            return <FeedbackSection selectedProduct={selectedProduct} />;
                        case 'scada':
                            return isSleeper ? <SleeperScadaMonitor selectedProduct={selectedProduct} /> : <ScadaMonitor selectedProduct={selectedProduct} />;
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
        </div>
    );
};

export default ProfessionalCardSection;

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * NEW CODE ADDED AT BOTTOM FOR BETTER UNDERSTANDABILITY
 * ────────────────────────────────────────────────────────────────────────────────
 * Component to render the 4th Level Report (Process Defect Summary)
 * This table is very wide and includes details for All Production Stages.
 */
const Level4ReportTable = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400">
                No process defect records found for this call number.
            </div>
        );
    }

    return (
        <div className="report-table-wrapper sticky-header level-4-enhanced">
            <table className="report-data-table level-4-table">
                <thead>
                    {/* Multi-level Headers */}
                    <tr>
                        <th rowSpan="2">DATE</th>
                        <th rowSpan="2">SHIFT</th>
                        <th rowSpan="2">SL</th>
                        <th rowSpan="2">PO_SR. NO.</th>
                        <th rowSpan="2">LOT NO.</th>
                        <th rowSpan="2" className="bg-emerald-50 text-emerald-700">ACCEPTED QTY</th>
                        <th rowSpan="2" className="bg-red-50 text-red-700">REJECTED QTY</th>

                        <th colSpan="2" className="stage-header shearing">SHEARING</th>
                        <th colSpan="2" className="stage-header turning">TURNING</th>
                        <th colSpan="2" className="stage-header mpi">MPI</th>
                        <th colSpan="2" className="stage-header forging">FORGING</th>
                        <th colSpan="2" className="stage-header quenching">QUENCHING</th>
                        <th colSpan="2" className="stage-header tempering">TEMPERING</th>

                        <th colSpan="4" className="defect-header shearing">Shearing Defects</th>
                        <th colSpan="3" className="defect-header turning">Turning Defects</th>
                        <th colSpan="1" className="defect-header mpi">MPI</th>
                        <th colSpan="4" className="defect-header forging">Forging Defects</th>
                        <th colSpan="1" className="defect-header quenching">Quenching</th>
                        <th colSpan="2" className="defect-header tempering">TEMPERING DEFECTS</th>
                        <th colSpan="2" className="defect-header dimensional">Dimensional</th>
                    </tr>
                    <tr className="sub-header">
                        {/* Stage Details */}
                        <th>Prod</th><th>Rej</th>
                        <th>Prod</th><th>Rej</th>
                        <th>Prod</th><th>Rej</th>
                        <th>Prod</th><th>Rej</th>
                        <th>Prod</th><th>Rej</th>
                        <th>Prod</th><th>Rej</th>

                        {/* Defect Specifics */}
                        <th>Cut Len</th><th>Ovality</th><th>Sharp Edges</th><th>Cracks</th>
                        <th>Pass Len</th><th>Full Turn</th><th>Turn Dia</th>
                        <th>MPI Rej</th>
                        <th>Forge Temp</th><th>Stabilise</th><th>Improper</th><th>Defect</th>
                        <th>Hardness</th>
                        <th>Temp.</th><th>Dist.</th>
                        <th>Box Gauge</th><th>Bearing Area</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => {
                        const basic = row.basicDetails || {};
                        const qty = row.processQty || {};
                        const sDef = row.shearingDefects || {};
                        const tDef = row.turningDefects || {};
                        const fDef = row.forgingDefects || {};
                        const qDef = row.quenchingDefects || {};
                        const tempDef = row.temperingDefects || {};
                        const dDef = row.dimensionalDefects || {};

                        return (
                            <tr key={idx} className={idx % 2 === 0 ? 'row-odd' : 'row-even'}>
                                <td>{basic.date ? new Date(basic.date).toLocaleDateString() : 'N/A'}</td>
                                <td className="text-center"><span className="shift-badge">{basic.shift || '-'}</span></td>
                                <td className="text-center font-medium text-slate-400">{idx + 1}</td>
                                <td>{basic.poSrNo || '-'}</td>
                                <td>{basic.lotNumber || '-'}</td>
                                <td className="text-right text-emerald-600 bg-emerald-50/30">{basic.totalAcceptedQty?.toLocaleString() || 0}</td>
                                <td className="text-right text-red-600 bg-red-50/30">{basic.totalRejectionQty?.toLocaleString() || 0}</td>

                                {/* Stage Data */}
                                <td className="text-right">{qty.shearingProductionQty || 0}</td><td className="text-right text-red-400">{qty.shearingRejectionQty || 0}</td>
                                <td className="text-right">{qty.turningProductionQty || 0}</td><td className="text-right text-red-400">{qty.turningRejectionQty || 0}</td>
                                <td className="text-right">{qty.mpiProductionQty || 0}</td><td className="text-right text-red-400">{qty.mpiRejectionQty || 0}</td>
                                <td className="text-right">{qty.forgingProductionQty || 0}</td><td className="text-right text-red-400">{qty.forgingRejectionQty || 0}</td>
                                <td className="text-right">{qty.quenchingProductionQty || 0}</td><td className="text-right text-red-400">{qty.quenchingRejectionQty || 0}</td>
                                <td className="text-right">{qty.temperingProductionQty || 0}</td><td className="text-right text-red-400">{qty.temperingRejectionQty || 0}</td>

                                {/* Defect Details */}
                                <td className="text-right">{sDef.lengthOfCutBar || 0}</td><td className="text-right">{sDef.ovalityImproperDiaAtEnd || 0}</td><td className="text-right">{sDef.sharpEdges || 0}</td><td className="text-right">{sDef.crackedEdges || 0}</td>
                                <td className="text-right">{tDef.parallelLength || 0}</td><td className="text-right">{tDef.fullTurningLength || 0}</td><td className="text-right">{tDef.turningDia || 0}</td>
                                <td className="text-right">{qty.mpiRejectionQty || 0}</td>
                                <td className="text-right">{fDef.forgingTemperature || 0}</td><td className="text-right">{fDef.forgingStabilisationRejection || 0}</td><td className="text-right">{fDef.improperForging || 0}</td><td className="text-right">{fDef.forgingMarksNotches || 0}</td>
                                <td className="text-right">{qDef.quenchingHardness || 0}</td>
                                <td className="text-right">{tempDef.temperingTemp || 0}</td><td className="text-right">{tempDef.temperingDuration || 0}</td>
                                <td className="text-right">{dDef.boxGauge || 0}</td><td className="text-right">{dDef.flatBearingArea || 0}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * CUSTOM CHART COMPONENTS
 * ────────────────────────────────────────────────────────────────────────────────
 * Custom X-Axis Tick for Pareto Analysis Chart
 * Improves readability by rotating labels and aligning them properly with columns.
 */
const ParetoXAxisTick = (props) => {
    const { x, y, payload } = props;
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dx={-8}
                dy={16}
                textAnchor="end"
                fill="#64748b"
                transform="rotate(-35)"
                style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    fontFamily: 'Inter, system-ui, sans-serif'
                }}
            >
                {payload.value}
            </text>
        </g>
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// NEW: MpiaDrillDown - Details for a specific manufacturer
// ────────────────────────────────────────────────────────────────────────────────
const MpiaDrillDown = ({ data = [], manufacturer, onBack, loading }) => {
    const [isPrinting, setIsPrinting] = useState(false);

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
        // Delay to allow Recharts to stabilize before browser capture
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 1200);
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

            <MpiaReportPage manufacturer={manufacturer} data={data} />
        </div>
    );
};


/**
 * ────────────────────────────────────────────────────────────────────────────────
 * EXPORT UTILITIES & COMPONENTS
 * ────────────────────────────────────────────────────────────────────────────────
 */

/**
 * Professional Export Button Component with Icon, Loading & Disabled States
 */
const ExportButton = ({ onClick, label = "Export Excel", disabled = false }) => (
    <button
        className={`btn-export-excel ${disabled ? 'disabled' : ''}`}
        onClick={disabled ? null : onClick}
        disabled={disabled}
        title={disabled ? "Processing..." : "Download Excel Report"}
    >
        {disabled ? (
            <div className="spinner-small"></div>
        ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3V16M12 16L7 11M12 16L17 11M5 21H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )}
        <span>{label}</span>
    </button>
);

/**
 * Professional Excel Export Utility (CSV-based with UTF-8 support)
 * Handles data formatting, escaping, and triggers browser download.
 */
const downloadExcel = (data, headers, filename) => {
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }

    // Header Row
    const headerRow = headers.map(h => h.label).join(',');

    // Data Rows
    const dataRows = data.map(row => {
        return headers.map(header => {
            let cellValue = row[header.key];

            // Handle null/undefined
            if (cellValue === null || cellValue === undefined) {
                cellValue = '';
            }

            // Format numbers to strings if needed
            const stringValue = String(cellValue);

            // Force Excel to treat long numeric strings as text (fixes scientific notation & leading zeros)
            if (/^\d+$/.test(stringValue) && (stringValue.length > 10 || stringValue.startsWith('0'))) {
                return `="${stringValue}"`;
            }

            // Escape double quotes and surround with quotes if necessary
            const escaped = stringValue.replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
                ? `"${escaped}"`
                : escaped;
        }).join(',');
    });

    // Combine with UTF-8 BOM to ensure Excel opens with correct encoding
    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');

    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


/**
 * Component to render a full A4 page report for a single manufacturer
 * Reusable for both individual drill-down and consolidated batch PDF.
 */
const MpiaReportPage = ({ manufacturer, data, showFooter = true }) => {
    // Process Defects for Pie Chart (Aggregation)
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
        <div
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
            {/* Header */}
            <div className="text-center mb-2">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{manufacturer}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Manufacturer Performance Analysis (Monthly)</p>
                <div className="h-1 w-20 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
            </div>

            {/* Graphs & Table Row */}
            <div className="grid grid-cols-2 gap-8 items-start">
                {/* Left: Defect Pie Chart */}
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

                {/* Right: Monthly Table */}
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
                                        <td className="p-3 text-right font-medium text-slate-600">{m.inspected?.toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold text-red-600">{m.processRejected?.toLocaleString()}</td>
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

                    {/* KPI Widgets */}
                    <div className="mt-8 grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                            <p className="text-[9px] text-slate-400 font-bold mb-1">INSPECTED (Nos.)</p>
                            <p className="text-sm font-black text-slate-800">{data.reduce((acc, m) => acc + (m.inspected || 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                            <p className="text-[9px] text-slate-400 font-bold mb-1">REJECTED (Nos.)</p>
                            <p className="text-sm font-black text-red-600">{data.reduce((acc, m) => acc + (m.processRejected || 0), 0).toLocaleString()}</p>
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
    );
};

// ────────────────────────────────────────────────────────────────────────────────
// NEW: ScadaMonitor Component with API Integration
// ────────────────────────────────────────────────────────────────────────────────
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

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            // Using a secure proxy to fetch insecure SCADA data in production to bypass Mixed Content blocks
            const scadaUrl = `http://20.168.13.113:8080/api/scada/scada?${params.toString()}`;
            const baseUrls = isLocal 
                ? ['http://20.168.13.113:8080'] 
                : [`https://api.allorigins.win/raw?url=${encodeURIComponent(scadaUrl)}`]; 
                
            let success = false;
            let finalData = [];
            
            for (const baseUrl of baseUrls) {
                try {
                    // Construction of fullUrl changes depending on whether we use proxy or direct IP
                    const fullUrl = baseUrl.includes('allorigins') 
                        ? baseUrl 
                        : `${baseUrl}/api/scada/scada?${params.toString()}`;
                    // Use simple headers for proxy to avoid CORS preflight errors
                    const fetchOptions = baseUrl.includes('allorigins')
                        ? {} 
                        : {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(localStorage.getItem('authToken') && { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })
                            }
                        };

                    const response = await fetch(fullUrl, fetchOptions);

                    if (response.ok) {
                        const resData = await response.json();
                        finalData = Array.isArray(resData) ? resData : (resData.content || []);
                        success = true;
                        break;
                    }
                } catch (err) {
                    // silent fail to try next URL
                }
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

    // Column sequences mapping - Time is now first, and unwanted columns are excluded
    const COLUMN_ORDER = ['time', 'PO_No', 'Heat_Code', 'sample', 'length', 'end'];
    const EXCLUDED_COLUMNS = ['line', 'module', 'plant', 'topic', 'machine', 'host', 'result', 'table'];

    const COLUMN_LABELS = {
        'time': 'Time',
        'PO_No': 'Po',
        'Heat_Code': 'Heat',
        'length': 'Len',
        'sample': 'Sam',
        'end': 'End'
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
                                        label: COLUMN_LABELS[col] || col,
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
                                        {COLUMN_LABELS[col] || col}
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
