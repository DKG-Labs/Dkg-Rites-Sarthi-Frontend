import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../Pagination';
import { useInspection } from '../../context/InspectionContext';
import AnnexurePage from '../../pages/AnnexurePage';
import { API_ENDPOINTS, getAuthHeaders, handleResponse } from '../../services/apiConfig';
import './DownloadIcAnnexures.css';

const formatPoNumber = (record) => {
    if (!record) return '';
    const rly = record.railwayShortName || 'N/A';
    const poNum = record.poNumberOnly || '';
    const poSn = record.poSerialNumber || '';
    
    if (!poSn) return `${rly}/${poNum}`;
    
    // If serial number already contains the PO number, don't duplicate it
    if (poSn.includes(poNum) || poSn.includes('/')) {
        return `${rly}/${poSn}`;
    }
    
    return `${rly}/${poNum}/${poSn}`;
};

const base64ToBlob = (base64, type = 'application/pdf') => {
    const binStr = window.atob(base64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([arr], { type });
};

const DownloadIcAnnexures = ({ selectedProduct = 'ERC', fromDate: initialFromDate = '', toDate: initialToDate = '', hideFilters = false, vendorPlantCode = '', zonalRailway = '' }) => {
    // 1. Backend Data State
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isViewingAnnexures, setIsViewingAnnexures] = useState(false);
    const { setSelectedCall, getIcAnnexuresCachedData, updateIcAnnexuresCache, clearIcAnnexuresCache } = useInspection();
    const [, setSearchParams] = useSearchParams();

    // 2. Local Filters state
    const [stageFilter, setStageFilter] = useState('all');
    const [fromDate, setFromDate] = useState(initialFromDate || '2025-01-01');
    const [toDate, setToDate] = useState(initialToDate || new Date().toISOString().split('T')[0]);
    const [globalSearch, setGlobalSearch] = useState('');

    // Active filters used for matching logic
    const [activeFilters, setActiveFilters] = useState({
        stage: 'all',
        fromDate: initialFromDate || '2025-01-01',
        toDate: initialToDate || new Date().toISOString().split('T')[0],
        search: ''
    });

    // 2. Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // 3. Sorting state
    const [sortConfig, setSortConfig] = useState({ key: 'icIssuedDate', direction: 'desc' });

    // 4. Download Dialog animation state
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [downloadingRecord, setDownloadingRecord] = useState(null);

    // Sync dates from parent if they change
    useEffect(() => {
        if (initialFromDate) setFromDate(initialFromDate);
        if (initialToDate) setToDate(initialToDate);
        setActiveFilters(prev => ({
            ...prev,
            fromDate: initialFromDate || prev.fromDate,
            toDate: initialToDate || prev.toDate
        }));
    }, [initialFromDate, initialToDate]);

    // Fetch IC Annexures data with caching support
    const fetchRecords = useCallback(async (forceRefresh = false) => {
        // Bypass cache completely if we are fetching with specific dashboard filters (hideFilters = true)
        if (!hideFilters) {
            if (forceRefresh) {
                clearIcAnnexuresCache(selectedProduct);
            } else {
                const cache = getIcAnnexuresCachedData(selectedProduct);
                if (cache.isCached) {
                    setRecords(cache.records);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            let url = `${API_ENDPOINTS.REPORTS}/downloadIcAnnexures?product=${encodeURIComponent(selectedProduct)}`;
            if (vendorPlantCode) url += `&vendorPlantCode=${encodeURIComponent(vendorPlantCode)}`;
            if (zonalRailway) url += `&zonalRailway=${encodeURIComponent(zonalRailway)}`;
            if (initialFromDate) url += `&startDate=${encodeURIComponent(initialFromDate)}`;
            if (initialToDate) url += `&endDate=${encodeURIComponent(initialToDate)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            const data = await handleResponse(response);
            if (data && data.responseData) {
                setRecords(data.responseData);
                // Only update cache if it's the general generic fetch
                if (!hideFilters) {
                    updateIcAnnexuresCache(selectedProduct, data.responseData);
                }
            } else {
                setRecords([]);
            }
        } catch (err) {
            console.error("Error fetching IC Annexures report:", err);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    }, [selectedProduct, getIcAnnexuresCachedData, updateIcAnnexuresCache, clearIcAnnexuresCache, hideFilters, vendorPlantCode, zonalRailway, initialFromDate, initialToDate]);

    // Initial load and selectedProduct changes
    useEffect(() => {
        fetchRecords(false);
    }, [fetchRecords]);

    // Reset pagination when filter triggers or tab changes
    useEffect(() => {
        setPage(0);
    }, [selectedProduct, activeFilters]);

    // Apply filters
    const handleApplyFilters = () => {
        setActiveFilters({
            stage: stageFilter,
            fromDate: fromDate,
            toDate: toDate,
            search: globalSearch
        });
    };

    // Reset filters
    const handleResetFilters = () => {
        setStageFilter('all');
        const defaultFrom = '2025-01-01';
        const defaultTo = new Date().toISOString().split('T')[0];
        setFromDate(defaultFrom);
        setToDate(defaultTo);
        setGlobalSearch('');
        setActiveFilters({
            stage: 'all',
            fromDate: defaultFrom,
            toDate: defaultTo,
            search: ''
        });
    };

    // Sorting implementation
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <span style={{ opacity: 0.3, marginLeft: '5px', fontSize: '11px' }}>↕</span>;
        return <span style={{ marginLeft: '5px', color: '#10b981', fontSize: '11px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    // Fetch and filter records client-side
    const filteredRecords = useMemo(() => {
        const recordsSource = records || [];
        
        let result = recordsSource.filter(record => {
            // Stage match
            const matchStage = activeFilters.stage === 'all' || record.stage.toLowerCase() === activeFilters.stage.toLowerCase();
            
            // Date range match
            const recordDate = new Date(record.icIssuedDate);
            const start = new Date(activeFilters.fromDate);
            const end = new Date(activeFilters.toDate);
            
            // Normalize times for date comparison
            recordDate.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            const matchDate = recordDate >= start && recordDate <= end;

            // Global search (searchable on PO Number, IC Number, Vendor Name, and Call Number)
            const query = activeFilters.search.toLowerCase().trim();
            const combinedPo = formatPoNumber(record).toLowerCase();
            const matchSearch = !query || 
                record.vendorName.toLowerCase().includes(query) ||
                record.callNumber.toLowerCase().includes(query) ||
                record.icNumber.toLowerCase().includes(query) ||
                combinedPo.includes(query) ||
                record.poNumberOnly.includes(query);

            return matchStage && matchDate && matchSearch;
        });

        // Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Combine PO for sorting if PO number is sorted
                if (sortConfig.key === 'poNumber') {
                    aVal = formatPoNumber(a);
                    bVal = formatPoNumber(b);
                }

                if (sortConfig.key === 'icIssuedDate') {
                    const dateA = new Date(aVal);
                    const dateB = new Date(bVal);
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }

                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [activeFilters, sortConfig, records]);



    const paginatedRecords = useMemo(() => {
        return filteredRecords.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    }, [filteredRecords, page, rowsPerPage]);

    // Real View IC sequence pulling from Azure Storage
    const handleViewIc = (record) => {
        if (!record || !record.icNumber) {
            alert('Certificate Number is missing.');
            return;
        }

        setDownloadingRecord(record);
        setIsDownloading(true);
        setDownloadProgress(10);
        setCurrentStep('Connecting to SARTHI secure document server...');

        const url = `${API_ENDPOINTS.CERTIFICATE_STORAGE}/view?icNumber=${encodeURIComponent(record.icNumber)}`;
        
        setTimeout(() => {
            setDownloadProgress(40);
            setCurrentStep('Locating Digitally Signed Certificate PDF...');
        }, 300);

        fetch(url, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(async (response) => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('No signed certificate found for this IC.');
                }
                const text = await response.text();
                throw new Error(text || `Server error: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            setDownloadProgress(80);
            setCurrentStep('Verifying digital signature and decoding PDF...');

            if (!data.signedData) {
                throw new Error('Signed certificate data is empty.');
            }

            const blob = base64ToBlob(data.signedData, 'application/pdf');
            const blobUrl = window.URL.createObjectURL(blob);

            setDownloadProgress(100);
            setCurrentStep('Opening certificate in new tab...');

            setTimeout(() => {
                setIsDownloading(false);
                setDownloadingRecord(null);
                window.open(blobUrl, '_blank');
            }, 600);
        })
        .catch((err) => {
            console.error('Error fetching certificate:', err);
            setIsDownloading(false);
            setDownloadingRecord(null);
            alert(err.message || 'Failed to fetch the signed certificate.');
        });
    };

    // Real Download Annexures sequence which triggers the Annexures view
    const handleDownloadAnnexures = (record) => {
        const callObj = {
            call_no: record.callNumber,
            vendor_name: record.vendorName,
            product_type: `${selectedProduct}-${record.stage}`,
            icIssuedDate: record.icIssuedDate
        };
        setSelectedCall(callObj);
        setIsViewingAnnexures(true);
    };

    if (isViewingAnnexures) {
        return (
            <AnnexurePage 
                onBack={() => {
                    setIsViewingAnnexures(false);
                    setSearchParams({});
                }} 
            />
        );
    }

    return (
        <div className="ic-annexures-container">
            {!hideFilters && (
                <>
                    <div className="prof-card-header ic-header" style={{ marginBottom: '16px', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-cloud-arrow-down" style={{ color: '#10b981' }}></i>
                            Download IC & Annexures ({selectedProduct})
                        </span>
                    </div>

                    {/* Filters panel */}
                    <div className="ic-filters-card">
                        <div className="ic-filters-grid">
                            {/* Stage Filter */}
                            <div className="ic-filter-group">
                                <label className="ic-filter-label">Stage of Inspection</label>
                                <select 
                                    className="ic-filter-select" 
                                    value={stageFilter}
                                    onChange={(e) => setStageFilter(e.target.value)}
                                >
                                    <option value="all">All Stages</option>
                                    <option value="RM">Raw Material (RM)</option>
                                    <option value="Process">Process</option>
                                    <option value="Final">Final Inspection</option>
                                </select>
                            </div>

                            {/* From Date */}
                            <div className="ic-filter-group">
                                <label className="ic-filter-label">From Date</label>
                                <input 
                                    type="date" 
                                    className="ic-filter-input"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>

                            {/* To Date */}
                            <div className="ic-filter-group">
                                <label className="ic-filter-label">To Date</label>
                                <input 
                                    type="date" 
                                    className="ic-filter-input"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>

                            {/* Global Search */}
                            <div className="ic-filter-group" style={{ flexGrow: 2 }}>
                                <label className="ic-filter-label">Global Search</label>
                                <input 
                                    type="text" 
                                    className="ic-filter-input"
                                    placeholder="Search Vendor, PO, Call or IC Number..."
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                                />
                            </div>

                            {/* Actions buttons */}
                            <div className="ic-filter-actions">
                                <button className="ic-btn-apply" onClick={handleApplyFilters}>
                                    <i className="fa-solid fa-filter"></i> Apply
                                </button>
                                <button className="ic-btn-reset" onClick={handleResetFilters}>
                                    <i className="fa-solid fa-arrows-rotate"></i> Reset
                                </button>
                                <button className="ic-btn-refresh" onClick={() => fetchRecords(true)}>
                                    <i className="fa-solid fa-arrows-rotate"></i> Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* IC Listing Table */}
            <div className="table-responsive prof-card mb">
                <table className="prof-table main-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>S.No.</th>
                            <th onClick={() => handleSort('vendorName')} style={{ cursor: 'pointer' }}>
                                Vendor Name {renderSortIcon('vendorName')}
                            </th>
                            <th onClick={() => handleSort('poNumber')} style={{ cursor: 'pointer' }}>
                                PO Number {renderSortIcon('poNumber')}
                            </th>
                            <th onClick={() => handleSort('callNumber')} style={{ cursor: 'pointer' }}>
                                Call Number {renderSortIcon('callNumber')}
                            </th>
                            <th onClick={() => handleSort('icNumber')} style={{ cursor: 'pointer' }}>
                                Inspection Certificate Number {renderSortIcon('icNumber')}
                            </th>
                            <th onClick={() => handleSort('stage')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                Stage of Inspection {renderSortIcon('stage')}
                            </th>
                            <th onClick={() => handleSort('icIssuedDate')} style={{ cursor: 'pointer' }}>
                                IC Issued Date {renderSortIcon('icIssuedDate')}
                            </th>
                            <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="text-center p-8 text-slate-500">
                                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                                    Loading Inspection Certificates...
                                </td>
                            </tr>
                        ) : paginatedRecords.length > 0 ? (
                            paginatedRecords.map((record, index) => {
                                const serialNo = page * rowsPerPage + index + 1;
                                const combinedPo = formatPoNumber(record);
                                return (
                                    <tr key={record.id || index} className={index % 2 === 0 ? 'row-odd' : 'row-even'}>
                                        <td>{serialNo}</td>
                                        <td className="font-semibold text-slate-800">{record.vendorName}</td>
                                        <td className="font-bold text-indigo-700">{combinedPo}</td>
                                        <td>
                                            <span className="prof-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                                                {record.callNumber}
                                            </span>
                                        </td>
                                        <td className="font-mono text-emerald-800 font-semibold">{record.icNumber || 'Pending'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`ic-stage-badge ${(record.stage || '').toLowerCase()}`}>
                                                {record.stage}
                                            </span>
                                        </td>
                                        <td>{record.icIssuedDate ? new Date(record.icIssuedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                                <button 
                                                    className="ic-view-btn"
                                                    onClick={() => handleViewIc(record)}
                                                >
                                                    View IC
                                                </button>
                                                <button 
                                                    className="ic-annexures-btn"
                                                    onClick={() => handleDownloadAnnexures(record)}
                                                >
                                                    Annexures
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center p-8 text-slate-400">
                                    No records found matching the filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredRecords.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(filteredRecords.length / rowsPerPage)}
                        start={page * rowsPerPage}
                        end={Math.min((page + 1) * rowsPerPage, filteredRecords.length)}
                        totalCount={filteredRecords.length}
                        onPageChange={setPage}
                        rows={rowsPerPage}
                        onRowsChange={setRowsPerPage}
                    />
                </div>
            )}

            {/* Premium Download Animation Dialog overlay */}
            {isDownloading && downloadingRecord && (
                <div className="download-modal-overlay">
                    <div className="download-modal-card">
                        <div className="download-animation-icon">
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                        </div>
                        <div className="download-percent">{downloadProgress}%</div>
                        <div className="download-progress-track">
                            <div 
                                className="download-progress-bar" 
                                style={{ width: `${downloadProgress}%` }}
                            ></div>
                        </div>
                        <div className="download-step-text">{currentStep}</div>

                        <div className="download-details-box">
                            <div className="download-detail-row">
                                <span className="download-detail-label">Vendor:</span>
                                <span className="download-detail-value">{downloadingRecord.vendorName}</span>
                            </div>
                            <div className="download-detail-row">
                                <span className="download-detail-label">IC Number:</span>
                                <span className="download-detail-value font-mono">{downloadingRecord.icNumber}</span>
                            </div>
                            <div className="download-detail-row">
                                <span className="download-detail-label">Call No:</span>
                                <span className="download-detail-value">{downloadingRecord.callNumber}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadIcAnnexures;
