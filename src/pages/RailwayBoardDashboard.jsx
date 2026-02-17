import React, { useState } from 'react';
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

const RailwayBoardDashboard = () => {
    // State for Drill-down (Accordion Style) with Persistence
    const [expandedPo, setExpandedPo] = useState(() => JSON.parse(localStorage.getItem('dash_expandedPo')) || null);
    const [expandedSerial, setExpandedSerial] = useState(() => JSON.parse(localStorage.getItem('dash_expandedSerial')) || null);
    const [expandedCall, setExpandedCall] = useState(() => JSON.parse(localStorage.getItem('dash_expandedCall')) || null);

    // Save to LocalStorage on change
    React.useEffect(() => { localStorage.setItem('dash_expandedPo', JSON.stringify(expandedPo)); }, [expandedPo]);
    React.useEffect(() => { localStorage.setItem('dash_expandedSerial', JSON.stringify(expandedSerial)); }, [expandedSerial]);
    React.useEffect(() => { localStorage.setItem('dash_expandedCall', JSON.stringify(expandedCall)); }, [expandedCall]);

    // Pagination State (Level 1)
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Level 1 Data Fetching using custom hook
    const { data: reportData, loading, error } = useReportData(reportService.getLevel1Report, null);

    // Filter State with Persistence (Normalized 'all' for internal state)
    const [selectedCategory, setSelectedCategory] = useState('Track Components');
    const [selectedProduct, setSelectedProduct] = useState(() => {
        const val = localStorage.getItem('dash_selectedProduct');
        return (val === 'All' || !val) ? 'all' : val;
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

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Save Filters
    React.useEffect(() => { localStorage.setItem('dash_selectedProduct', selectedProduct); }, [selectedProduct]);
    React.useEffect(() => { localStorage.setItem('dash_selectedZone', selectedZone); }, [selectedZone]);
    React.useEffect(() => { localStorage.setItem('dash_selectedVendor', selectedVendor); }, [selectedVendor]);
    React.useEffect(() => { localStorage.setItem('dash_selectedRio', selectedRio); }, [selectedRio]);

    const [activeKpi, setActiveKpi] = useState('total_po');

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
    const filteredData = reportData;

    const count = filteredData.length;
    const paginatedData = filteredData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    if (loading && page === 0 && reportData.length === 0) {
        return (
            <div className="railway-dashboard-container">
                <DashboardHeader />
                <div className="content-card">
                    <div className="loading-state p-8 text-center text-teal font-medium">
                        Loading PO Report Data...
                    </div>
                </div>
            </div>
        );
    }

    if (error && reportData.length === 0) {
        return (
            <div className="railway-dashboard-container">
                <DashboardHeader />
                <div className="content-card">
                    <div className="error-state p-8 text-center text-red font-medium">
                        Error: {error}
                    </div>
                </div>
            </div>
        );
    }

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
                            <th>Status</th>
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

            <FilterBar
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
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

            {/* Integration of ProfessionalCardSection without losing functionality */}
            <ProfessionalCardSection
                poTable={poTable}
                poGraph={poGraph}
                kpiGrid={kpiGrid}
            />
        </div>
    );
};


export default RailwayBoardDashboard;
