import React from 'react';

const VENDORS = ['Prakash Metallics', 'Kalimata', 'Royal'];
const RITES_RIOS = ['CRIO', 'NRIO', 'ERIO', 'WRIO', 'SRIO'];
const RAIL_ZONES = [
    'CR', 'ER', 'ECR', 'ECoR', 'NR', 'NCR', 'NER', 'NFR', 'NWR',
    'SR', 'SCR', 'SER', 'SECR', 'SWR', 'WR', 'WCR', 'Metro', 'SCoR', 'KR'
];

const FilterBar = ({
    selectedZone, setSelectedZone,
    selectedVendor, setSelectedVendor,
    selectedRio, setSelectedRio,
    fromDate, setFromDate,
    toDate, setToDate
}) => {
    return (
        <div className="filter-bar">
            {/* Date Filters - Refined UI */}
            <div className="filter-group">
                <label className="filter-label">Date Range</label>
                <div className="date-picker-card">
                    <div className="date-input-wrapper">
                        <span className="input-icon">📅</span>
                        <input
                            type="date"
                            className="premium-date-input"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <span className="date-connector">to</span>
                    <div className="date-input-wrapper">
                        <input
                            type="date"
                            className="premium-date-input"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                        <span className="input-icon">📅</span>
                    </div>
                </div>
            </div>



            {/* Zone Dropdown */}
            <div className="filter-group">
                <label className="filter-label">Zone</label>
                <select
                    className="dashboard-select"
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                >
                    <option value="all">All Zones</option>
                    {RAIL_ZONES.map(zone => (
                        <option key={zone} value={zone}>{zone}</option>
                    ))}
                </select>
            </div>

            {/* Vendor Name Dropdown */}
            <div className="filter-group">
                <label className="filter-label">Vendor</label>
                <select
                    className="dashboard-select"
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                >
                    <option value="all">All Vendors</option>
                    {VENDORS.map(vendor => (
                        <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                </select>
            </div>

            {/* RITES RIO Dropdown */}
            <div className="filter-group">
                <label className="filter-label">RITES RIO</label>
                <select
                    className="dashboard-select"
                    value={selectedRio}
                    onChange={(e) => setSelectedRio(e.target.value)}
                >
                    <option value="all">All RITES RIOs</option>
                    {RITES_RIOS.map(rio => (
                        <option key={rio} value={rio}>{rio}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default FilterBar;
