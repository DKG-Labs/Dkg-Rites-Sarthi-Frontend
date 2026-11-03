import React from 'react';
import { SearchableDropdown } from './SharedComponents';

const VENDORS = ['Prakash Metallics', 'Kalimata', 'Royal'];
const RITES_RIOS = ['CRIO', 'NRIO', 'ERIO', 'WRIO', 'SRIO'];
const RAIL_ZONES = [
    'CR', 'ER', 'ECR', 'ECoR', 'NR', 'NCR', 'NER', 'NFR', 'NWR', 'RDSO',
    'SR', 'SCR', 'SER', 'SECR', 'SWR', 'WR', 'WCR', 'Metro', 'SCoR', 'KR'
];

const zoneOptions = [
    { label: 'All Zones', value: 'all' },
    ...RAIL_ZONES.map(z => ({ label: z, value: z }))
];

const vendorOptions = [
    { label: 'All Vendors', value: 'all' },
    ...VENDORS.map(v => ({ label: v, value: v }))
];

const rioOptions = [
    { label: 'All RITES RIOs', value: 'all' },
    ...RITES_RIOS.map(r => ({ label: r, value: r }))
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
            {/* Date Filters */}
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
                <SearchableDropdown
                    value={selectedZone}
                    onChange={setSelectedZone}
                    options={zoneOptions}
                    placeholder="All Zones"
                />
            </div>

            {/* Vendor Dropdown */}
            <div className="filter-group">
                <label className="filter-label">Vendor</label>
                <SearchableDropdown
                    value={selectedVendor}
                    onChange={setSelectedVendor}
                    options={vendorOptions}
                    placeholder="All Vendors"
                />
            </div>

            {/* RITES RIO Dropdown */}
            <div className="filter-group">
                <label className="filter-label">RITES RIO</label>
                <SearchableDropdown
                    value={selectedRio}
                    onChange={setSelectedRio}
                    options={rioOptions}
                    placeholder="All RITES RIOs"
                />
            </div>
        </div>
    );
};

export default FilterBar;
