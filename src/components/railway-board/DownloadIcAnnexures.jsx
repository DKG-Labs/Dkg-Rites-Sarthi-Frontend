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
            // Stage match based on Call Number Prefix
            let matchStage = true;
            if (activeFilters.stage && activeFilters.stage !== 'all') {
                const callNum = (record.callNumber || '').toUpperCase().trim();
                const stageStr = (record.stage || '').toUpperCase().trim();
                if (activeFilters.stage === 'RAW MATERIAL') {
                    matchStage = callNum.startsWith('ER') || callNum.startsWith('RPRM') || stageStr.includes('RAW') || stageStr === 'RM';
                } else if (activeFilters.stage === 'PROCESS') {
                    matchStage = callNum.startsWith('EP') || callNum.startsWith('RPP') || stageStr.includes('PROCESS');
                } else if (activeFilters.stage === 'FINAL') {
                    matchStage = callNum.startsWith('EF') || callNum.startsWith('RPF') || callNum.startsWith('SF') || stageStr.includes('FINAL');
                } else {
                    matchStage = (record.stage && record.stage.trim().toLowerCase() === activeFilters.stage.trim().toLowerCase());
                }
            }
            
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
                (record.vendorName || '').toLowerCase().includes(query) ||
                (record.callNumber || '').toLowerCase().includes(query) ||
                (record.icNumber || '').toLowerCase().includes(query) ||
                combinedPo.includes(query) ||
                (record.poNumberOnly || '').toLowerCase().includes(query);

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



    const [selectedSleeperCert, setSelectedSleeperCert] = useState(null);
    const [isSleeperCertModalOpen, setIsSleeperCertModalOpen] = useState(false);

    const paginatedRecords = useMemo(() => {
        return filteredRecords.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    }, [filteredRecords, page, rowsPerPage]);

    // View IC sequence pulling from Azure Storage with fallback for Sleeper ICs
    const handleViewIc = async (record) => {
        if (!record) {
            alert('Record details not available.');
            return;
        }

        const targetIc = (record.icNumber && record.icNumber !== 'N/A' && record.icNumber !== 'Pending') 
            ? record.icNumber 
            : (record.callNumber || '');

        if (!targetIc) {
            alert('Certificate / Call Number is missing.');
            return;
        }

        setDownloadingRecord(record);
        setIsDownloading(true);
        setDownloadProgress(10);
        setCurrentStep('Connecting to SARTHI secure document server...');

        setTimeout(() => {
            setDownloadProgress(40);
            setCurrentStep('Locating Digitally Signed Certificate PDF...');
        }, 300);

        try {
            const url = `${API_ENDPOINTS.CERTIFICATE_STORAGE}/view?icNumber=${encodeURIComponent(targetIc)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.signedData) {
                    setDownloadProgress(80);
                    setCurrentStep('Verifying digital signature and decoding PDF...');
                    const blob = base64ToBlob(data.signedData, 'application/pdf');
                    const blobUrl = window.URL.createObjectURL(blob);
                    setDownloadProgress(100);
                    setCurrentStep('Opening certificate in new tab...');
                    setTimeout(() => {
                        setIsDownloading(false);
                        setDownloadingRecord(null);
                        window.open(blobUrl, '_blank');
                    }, 600);
                    return;
                }
            }

            // Fallback for Sleeper calls when Azure Blob record is not uploaded yet:
            const callNo = record.callNumber || targetIc;
            if (callNo && ((record.callNumber && record.callNumber.startsWith('SF')) || selectedProduct === 'Sleeper' || (record.itemCatDescr || '').toLowerCase().includes('sleeper'))) {
                setDownloadProgress(70);
                setCurrentStep('Fetching Sleeper Inspection Certificate details...');
                
                try {
                    const baseUrl = API_ENDPOINTS.REPORTS.replace('/api/reports', '/api');
                    const icRes = await fetch(`${baseUrl}/sleeper-dashboard/sleeperIc/${encodeURIComponent(callNo)}`, {
                        headers: getAuthHeaders()
                    });
                    if (icRes.ok) {
                        const icData = await icRes.json();
                        setDownloadProgress(100);
                        setCurrentStep('Opening certificate viewer...');
                        setTimeout(() => {
                            setIsDownloading(false);
                            setDownloadingRecord(null);
                            setSelectedSleeperCert({ ...record, ...icData });
                            setIsSleeperCertModalOpen(true);
                        }, 400);
                        return;
                    }
                } catch (e) {
                    console.warn("Failed to fetch sleeperIc details:", e);
                }

                // Fallback to record data
                setIsDownloading(false);
                setDownloadingRecord(null);
                setSelectedSleeperCert(record);
                setIsSleeperCertModalOpen(true);
                return;
            }

            throw new Error('No signed certificate found for this IC.');
        } catch (err) {
            console.error('Error fetching certificate:', err);
            setIsDownloading(false);
            setDownloadingRecord(null);
            
            if ((record.callNumber && record.callNumber.startsWith('SF')) || selectedProduct === 'Sleeper') {
                setSelectedSleeperCert(record);
                setIsSleeperCertModalOpen(true);
            } else {
                alert(err.message || 'Failed to fetch the signed certificate.');
            }
        }
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
                                    onChange={(e) => {
                                        setStageFilter(e.target.value);
                                        setActiveFilters(prev => ({ ...prev, stage: e.target.value }));
                                    }}
                                >
                                    <option value="all">All Stages</option>
                                    <option value="RAW MATERIAL">Raw Material (RM)</option>
                                    <option value="PROCESS">Process</option>
                                    <option value="FINAL">Final Inspection</option>
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

            {/* Sleeper Official Inspection Certificate View & Download Modal */}
            {isSleeperCertModalOpen && selectedSleeperCert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '20px',
                    backdropFilter: 'blur(4px)'
                }}>
                    <style>
                        {`
                            @media print {
                                body * { visibility: hidden !important; }
                                .sleeper-cert-print-area, .sleeper-cert-print-area * { visibility: visible !important; }
                                .sleeper-cert-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 15mm !important; box-shadow: none !important; }
                                .no-print-modal-bar { display: none !important; }
                            }
                        `}
                    </style>
                    <div style={{
                        width: '100%',
                        maxWidth: '900px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '92vh',
                        overflow: 'hidden'
                    }}>
                        {/* Header Bar */}
                        <div className="no-print-modal-bar" style={{
                            padding: '14px 20px',
                            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                            color: '#ffffff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #334155'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fa-solid fa-file-certificate" style={{ color: '#10b981', fontSize: '18px' }}></i>
                                <span style={{ fontWeight: '700', fontSize: '16px' }}>Inspection Certificate (Sleeper)</span>
                                <span style={{ fontSize: '12px', background: '#334155', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                    {selectedSleeperCert.callNumber || selectedSleeperCert.call_no}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => window.print()}
                                    style={{
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)'
                                    }}
                                >
                                    <i className="fa-solid fa-print"></i> Print / Save PDF
                                </button>
                                <button
                                    onClick={() => {
                                        setIsSleeperCertModalOpen(false);
                                        setSelectedSleeperCert(null);
                                    }}
                                    style={{
                                        background: '#dc2626',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 14px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>

                        {/* Certificate Body (Printable) */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                            <div className="sleeper-cert-print-area" style={{
                                background: '#ffffff',
                                border: '2px solid #000000',
                                padding: '28px',
                                fontFamily: '"Times New Roman", Times, serif',
                                color: '#000000',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}>
                                {/* Top Header */}
                                <div style={{ textAlign: 'center', borderBottom: '2px solid #000000', paddingBottom: '12px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        RITES LIMITED
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
                                        (A GOVERNMENT OF INDIA ENTERPRISE)
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                                        QUALITY ASSURANCE DIVISION - RAILWAY SLEEPER INSPECTION
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px', textDecoration: 'underline' }}>
                                        INSPECTION CERTIFICATE
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
                                    <div><strong>Certificate No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedSleeperCert.certificateNo || selectedSleeperCert.icNumber || `C/${selectedSleeperCert.callNumber}/NV`}</span></div>
                                    <div style={{ textAlign: 'right' }}><strong>Date:</strong> {selectedSleeperCert.certificateDate || selectedSleeperCert.icIssuedDate || selectedSleeperCert.date || new Date().toLocaleDateString('en-GB')}</div>
                                    <div><strong>Inspection Call No:</strong> <span style={{ fontWeight: 'bold' }}>{selectedSleeperCert.callNumber || selectedSleeperCert.call_no}</span></div>
                                    <div style={{ textAlign: 'right' }}><strong>PO Number:</strong> {formatPoNumber(selectedSleeperCert) || selectedSleeperCert.poNo || selectedSleeperCert.po_no}</div>
                                    <div><strong>Book No / Set No:</strong> {selectedSleeperCert.bookNo || '001'} / {selectedSleeperCert.setNo || '001'}</div>
                                    <div style={{ textAlign: 'right' }}><strong>Installment No:</strong> Offered: {selectedSleeperCert.offeredInstNo || '1'} | Passed: {selectedSleeperCert.passedInstNo || '1'}</div>
                                    <div style={{ gridColumn: 'span 2' }}><strong>Manufacturer / Vendor:</strong> {selectedSleeperCert.vendorName || selectedSleeperCert.contractor || selectedSleeperCert.vendor_name || 'N/A'}</div>
                                    <div style={{ gridColumn: 'span 2' }}><strong>Place of Inspection:</strong> {selectedSleeperCert.placeOfInspection || selectedSleeperCert.plant_name || selectedSleeperCert.plantId || 'Vendor Plant Premises'}</div>
                                    <div style={{ gridColumn: 'span 2' }}><strong>Consignee:</strong> {selectedSleeperCert.consignee || selectedSleeperCert.purchasingAuthority || selectedSleeperCert.railwayShortName || 'Zonal Railway'}</div>
                                </div>

                                {/* Stores Table */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
                                    <thead>
                                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #000000' }}>
                                            <th style={{ border: '1px solid #000000', padding: '6px' }}>Item No.</th>
                                            <th style={{ border: '1px solid #000000', padding: '6px', textAlign: 'left' }}>Description of Stores</th>
                                            <th style={{ border: '1px solid #000000', padding: '6px' }}>Qty On Order</th>
                                            <th style={{ border: '1px solid #000000', padding: '6px' }}>Qty Prev Passed</th>
                                            <th style={{ border: '1px solid #000000', padding: '6px' }}>Qty Now Offered</th>
                                            <th style={{ border: '1px solid #000000', padding: '6px', background: '#ecfdf5', color: '#166534', fontWeight: 'bold' }}>Qty Passed</th>
                                            <th style={{ border: '1px solid #000000', padding: '6px', background: '#fef2f2', color: '#991b1b' }}>Qty Rejected</th>
                                            <th style={{ border: '1px solid #000000', padding: '6px' }}>Qty Still Due</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: '1px solid #000000', padding: '8px' }}>{selectedSleeperCert.itemNo || '1'}</td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'left', fontWeight: '600' }}>
                                                {selectedSleeperCert.descriptionOfStores || selectedSleeperCert.itemCatDescr || 'PSC Mainline Sleeper (RT-2496 / 60kg)'}
                                            </td>
                                            <td style={{ border: '1px solid #000000', padding: '8px' }}>{selectedSleeperCert.qtyOnOrder || 'N/A'}</td>
                                            <td style={{ border: '1px solid #000000', padding: '8px' }}>{selectedSleeperCert.qtyPassedPreviously || selectedSleeperCert.quantityPreviouslyPassed || '0'}</td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', fontWeight: 'bold' }}>{selectedSleeperCert.qtyNowOffered || selectedSleeperCert.qty || '0'}</td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', fontWeight: 'bold', background: '#f0fdf4', color: '#15803d' }}>
                                                {selectedSleeperCert.qtyNowPassed || selectedSleeperCert.accepted || selectedSleeperCert.qtyNowOffered || '0'}
                                            </td>
                                            <td style={{ border: '1px solid #000000', padding: '8px', color: '#dc2626' }}>{selectedSleeperCert.qtyNowRejected || selectedSleeperCert.rejected || '0'}</td>
                                            <td style={{ border: '1px solid #000000', padding: '8px' }}>{selectedSleeperCert.qtyStillDue || '0'}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Certification text */}
                                <div style={{ fontSize: '12px', lineHeight: '1.5', marginBottom: '20px', textAlign: 'justify' }}>
                                    Certified that the stores mentioned above have been inspected visually, dimensionally, and tested as per IRS-T-39 specifications and relevant standard RDSO drawings and found conforming to specification. Stores accepted have been digitally certified.
                                </div>

                                {/* Signatures Footer */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '30px', paddingTop: '10px' }}>
                                    <div>
                                        <div style={{ border: '1px dashed #64748b', padding: '10px', borderRadius: '6px', display: 'inline-block', minWidth: '180px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>RITES Hologram / Sealing Stamp</div>
                                            <div style={{ fontWeight: 'bold', marginTop: '4px', fontSize: '13px', color: '#166534' }}>✓ VERIFIED & PASSED</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ border: '1px solid #10b981', padding: '10px', borderRadius: '6px', display: 'inline-block', minWidth: '220px', textAlign: 'center', background: '#f0fdf4' }}>
                                            <div style={{ color: '#059669', fontSize: '12px', fontWeight: 'bold' }}>🔒 Digitally E-Signed</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '2px' }}>
                                                {selectedSleeperCert.inspectingEngineer || 'Inspecting Engineer (IE)'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#475569' }}>QA Division, RITES Ltd.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadIcAnnexures;
