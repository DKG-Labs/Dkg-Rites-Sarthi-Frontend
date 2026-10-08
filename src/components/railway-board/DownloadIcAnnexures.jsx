import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../Pagination';
import { useInspection } from '../../context/InspectionContext';
import AnnexurePage from '../../pages/AnnexurePage';
import AnnexureUploadModal from '../AnnexureUploadModal';
import { API_ENDPOINTS, getAuthHeaders, handleResponse } from '../../services/apiConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadExcel } from './SharedComponents';
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

const formatCallSubmissionDate = (dt) => {
    if (!dt || dt === '-' || dt === 'N/A') return '-';
    const str = String(dt).trim();
    const datePart = str.split(' ')[0].split('T')[0];
    return datePart || str;
};

const getQuantityColumns = (record) => {
    if (!record) return { qtySet: '-', qtyNos: '-' };
    
    // 1. Prefer backend calculated fields if present
    const bSet = record.callQtySet && record.callQtySet !== '-' ? String(record.callQtySet).trim() : null;
    const bNos = record.callQtyNos && record.callQtyNos !== '-' ? String(record.callQtyNos).trim() : null;
    if (bSet || bNos) {
        return {
            qtySet: bSet || '-',
            qtyNos: bNos || '-'
        };
    }

    const rawQty = record.callQty;
    if (rawQty === null || rawQty === undefined || rawQty === '' || rawQty === '-' || rawQty === '0' || rawQty === 0) {
        return { qtySet: '-', qtyNos: '-' };
    }

    const s = String(rawQty).trim();

    // 2. Check if unit is MT (e.g. 30.879 MT)
    if (s.toLowerCase().includes('mt')) {
        const num = parseFloat(s.replace(/[^0-9.]/g, ''));
        let nosVal = '-';
        if (!isNaN(num) && num > 0) {
            const approxNos = Math.round((num * 1000) / 1.088);
            nosVal = `${approxNos.toLocaleString('en-IN')} Nos`;
        }
        return {
            qtySet: s,
            qtyNos: nosVal
        };
    }

    // 3. Check if unit is Set (e.g. 5000 Set or 31 Sets)
    if (s.toLowerCase().includes('set')) {
        return {
            qtySet: s,
            qtyNos: '-'
        };
    }

    // 4. Check if unit is Nos (e.g. 28381 Nos) or numeric
    const cleanNumStr = s.replace(/nos\.?/gi, '').replace(/,/g, '').trim();
    const num = parseFloat(cleanNumStr);
    if (!isNaN(num) && num > 0) {
        const callNo = (record.callNumber || '').toUpperCase();
        const formattedNos = `${Math.round(num).toLocaleString('en-IN')} Nos`;

        // Only calculate MT conversion if it is explicitly an ERC call (EF-, EP-, ER-)
        const isErc = callNo.startsWith('EF') || callNo.startsWith('EP') || callNo.startsWith('ER');
        if (isErc && num >= 100) {
            const mtVal = Math.round((num * 1.088 / 1000.0) * 1000.0) / 1000.0;
            return {
                qtySet: `${mtVal.toFixed(3)} MT`,
                qtyNos: formattedNos
            };
        }

        return {
            qtySet: '-',
            qtyNos: formattedNos
        };
    }

    return {
        qtySet: '-',
        qtyNos: s
    };
};

const DownloadIcAnnexures = ({ selectedProduct = 'ERC', fromDate: initialFromDate = '', toDate: initialToDate = '', hideFilters = false, vendorPlantCode = '', zonalRailway = '' }) => {
    // 1. Backend Data State
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isViewingAnnexures, setIsViewingAnnexures] = useState(false);
    const [viewAnnexureModal, setViewAnnexureModal] = useState({
        isOpen: false,
        callNo: '',
        icNumber: '',
        moduleType: 'SLEEPER'
    });
    const { setSelectedCall, getIcAnnexuresCachedData, updateIcAnnexuresCache, clearIcAnnexuresCache } = useInspection();
    const [, setSearchParams] = useSearchParams();

    // 2. Local Filters state
    const [stageFilter, setStageFilter] = useState('all');
    const [fromDate, setFromDate] = useState(initialFromDate || '2025-01-01');
    const [toDate, setToDate] = useState(initialToDate || new Date().toISOString().split('T')[0]);
    const [globalSearch, setGlobalSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('global'); // 'global' | 'callNo' | 'po' | 'vendor'

    // Active filters used for matching logic
    const [activeFilters, setActiveFilters] = useState({
        stage: 'all',
        fromDate: initialFromDate || '2025-01-01',
        toDate: initialToDate || new Date().toISOString().split('T')[0],
        search: ''
    });

    const getSearchPlaceholder = () => {
        switch (searchType) {
            case 'callNo':
                return 'Search by Call Number (e.g. RPP-080426008, EF-, SF-)...';
            case 'po':
                return 'Search by PO Number or Serial No...';
            case 'vendor':
                return 'Search by Vendor Name...';
            default:
                return 'Search Call No, PO No, Vendor Name, IC No...';
        }
    };

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
        const defaultFrom = initialFromDate || '2025-01-01';
        const defaultTo = initialToDate || new Date().toISOString().split('T')[0];
        setFromDate(defaultFrom);
        setToDate(defaultTo);
        setGlobalSearch('');
        setSearchQuery('');
        setSearchType('global');
        setPage(0);
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
            const currentStage = activeFilters.stage || stageFilter;
            if (currentStage && currentStage !== 'all') {
                const callNum = (record.callNumber || '').toUpperCase().trim();
                const stageStr = (record.stage || '').toUpperCase().trim();
                if (currentStage === 'RAW MATERIAL') {
                    matchStage = callNum.startsWith('ER') || callNum.startsWith('RPRM') || stageStr.includes('RAW') || stageStr === 'RM';
                } else if (currentStage === 'PROCESS') {
                    matchStage = callNum.startsWith('EP') || callNum.startsWith('RPP') || stageStr.includes('PROCESS');
                } else if (currentStage === 'FINAL') {
                    matchStage = callNum.startsWith('EF') || callNum.startsWith('RPF') || callNum.startsWith('SF') || stageStr.includes('FINAL');
                } else {
                    matchStage = (record.stage && record.stage.trim().toLowerCase() === currentStage.trim().toLowerCase());
                }
            }
            
            // Date range match
            let matchDate = true;
            if (activeFilters.fromDate && activeFilters.toDate) {
                const recordDate = new Date(record.icIssuedDate);
                const start = new Date(activeFilters.fromDate);
                const end = new Date(activeFilters.toDate);
                
                // Normalize times for date comparison
                recordDate.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                
                matchDate = !isNaN(recordDate.getTime()) ? (recordDate >= start && recordDate <= end) : true;
            }

            // Search filtering (supports Call No specifically, PO, Vendor, or Global)
            const query = (searchQuery || activeFilters.search || '').toLowerCase().trim();
            const combinedPo = formatPoNumber(record).toLowerCase();

            let matchSearch = true;
            if (query) {
                if (searchType === 'callNo') {
                    matchSearch = (record.callNumber || '').toLowerCase().includes(query);
                } else if (searchType === 'po') {
                    matchSearch = combinedPo.includes(query) || (record.poNumberOnly || '').toLowerCase().includes(query);
                } else if (searchType === 'vendor') {
                    matchSearch = (record.vendorName || '').toLowerCase().includes(query);
                } else {
                    // Global search (searchable across Call No, Vendor, PO, IC Number, Stage, Date, Qty)
                    const { qtySet, qtyNos } = getQuantityColumns(record);
                    matchSearch = 
                        (record.callNumber || '').toLowerCase().includes(query) ||
                        (record.vendorName || '').toLowerCase().includes(query) ||
                        (record.icNumber || '').toLowerCase().includes(query) ||
                        combinedPo.includes(query) ||
                        (record.poNumberOnly || '').toLowerCase().includes(query) ||
                        (record.stage || '').toLowerCase().includes(query) ||
                        (record.callSubmissionDateTime || '').toLowerCase().includes(query) ||
                        (qtySet || '').toLowerCase().includes(query) ||
                        (qtyNos || '').toLowerCase().includes(query) ||
                        (record.callQty || '').toString().toLowerCase().includes(query);
                }
            }

            return matchStage && matchDate && matchSearch;
        });

        // Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                if (sortConfig.key === 'callQtySet') {
                    const aSet = getQuantityColumns(a).qtySet;
                    const bSet = getQuantityColumns(b).qtySet;
                    const aNum = parseFloat(aSet.replace(/[^0-9.]/g, '')) || 0;
                    const bNum = parseFloat(bSet.replace(/[^0-9.]/g, '')) || 0;
                    return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                }

                if (sortConfig.key === 'callQtyNos') {
                    const aNos = getQuantityColumns(a).qtyNos;
                    const bNos = getQuantityColumns(b).qtyNos;
                    const aNum = parseFloat(aNos.replace(/[^0-9.]/g, '')) || 0;
                    const bNum = parseFloat(bNos.replace(/[^0-9.]/g, '')) || 0;
                    return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                }

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
    }, [activeFilters, stageFilter, sortConfig, records, searchQuery, searchType]);



    const totalSetQty = useMemo(() => {
        let total = 0;
        let isMt = false;
        let hasSet = false;
        filteredRecords.forEach(r => {
            const { qtySet } = getQuantityColumns(r);
            if (qtySet && qtySet !== '-') {
                const clean = parseFloat(qtySet.replace(/[^0-9.]/g, ''));
                if (!isNaN(clean)) {
                    total += clean;
                    if (qtySet.toLowerCase().includes('mt')) isMt = true;
                    if (qtySet.toLowerCase().includes('set')) hasSet = true;
                }
            }
        });
        if (total === 0 && !hasSet && !isMt) return '-';
        return isMt ? `${total.toFixed(3)} MT` : `${Math.round(total).toLocaleString('en-IN')} Sets`;
    }, [filteredRecords]);

    const totalNosQty = useMemo(() => {
        let total = 0;
        let hasNos = false;
        filteredRecords.forEach(r => {
            const { qtyNos } = getQuantityColumns(r);
            if (qtyNos && qtyNos !== '-') {
                const clean = parseFloat(qtyNos.replace(/[^0-9.]/g, ''));
                if (!isNaN(clean)) {
                    total += clean;
                    hasNos = true;
                }
            }
        });
        if (total === 0 && !hasNos) return '-';
        return `${Math.round(total).toLocaleString('en-IN')} Nos`;
    }, [filteredRecords]);

    const paginatedRecords = useMemo(() => {
        return filteredRecords.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    }, [filteredRecords, page, rowsPerPage]);

    // View IC directly from Certificate Storage (Azure Blob)
    const handleViewIc = async (record) => {
        if (!record) {
            alert('Record details not available.');
            return;
        }

        const candidateSet = new Set();
        const addCandidate = (val) => {
            if (!val || val === 'N/A' || val === 'Pending') return;
            const str = val.toString().trim();
            if (!str) return;
            candidateSet.add(str);
            const noExt = str.replace(/\.pdf$/i, '');
            candidateSet.add(noExt);
            candidateSet.add(noExt.replace(/\//g, '-'));
            candidateSet.add(noExt.replace(/\//g, '_'));
            candidateSet.add(`${noExt.replace(/\//g, '-')}.pdf`);
        };

        addCandidate(record.icNumber);
        addCandidate(record.callNumber);

        const candidates = Array.from(candidateSet).filter(Boolean);

        if (candidates.length === 0) {
            alert('Certificate / Call Number is missing.');
            return;
        }

        setDownloadingRecord(record);
        setIsDownloading(true);
        setDownloadProgress(20);
        setCurrentStep('Connecting to SARTHI certificate storage...');

        setTimeout(() => {
            setDownloadProgress(60);
            setCurrentStep('Retrieving stored Inspection Certificate PDF...');
        }, 300);

        try {
            let foundData = null;
            for (const targetIc of candidates) {
                const url = `${API_ENDPOINTS.CERTIFICATE_STORAGE}/view?icNumber=${encodeURIComponent(targetIc)}`;
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: getAuthHeaders()
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data && (data.signedData || data.url)) {
                            foundData = data;
                            break;
                        }
                    }
                } catch (e) {
                    console.warn(`Attempt for ${targetIc} failed:`, e);
                }
            }

            if (foundData) {
                setDownloadProgress(90);
                setCurrentStep('Opening Inspection Certificate...');
                let targetUrl = '';
                if (foundData.signedData) {
                    const blob = base64ToBlob(foundData.signedData, 'application/pdf');
                    targetUrl = window.URL.createObjectURL(blob);
                } else if (foundData.url) {
                    targetUrl = foundData.url;
                }

                if (targetUrl) {
                    setDownloadProgress(100);
                    setTimeout(() => {
                        setIsDownloading(false);
                        setDownloadingRecord(null);
                        window.open(targetUrl, '_blank');
                    }, 400);
                    return;
                }
            }

            setIsDownloading(false);
            setDownloadingRecord(null);
            alert(`Inspection Certificate PDF for "${record.icNumber || record.callNumber}" is not found in Certificate Storage.`);
        } catch (err) {
            console.error('Error fetching certificate:', err);
            setIsDownloading(false);
            setDownloadingRecord(null);
            alert(`Error retrieving Inspection Certificate from Certificate Storage: ${err.message || err}`);
        }
    };

    // Real Download Annexures sequence which triggers the Annexures view
    const handleDownloadAnnexures = (record) => {
        const normProduct = (selectedProduct || '').toUpperCase();
        if (normProduct.includes('SLEEPER') || normProduct.includes('RAIL')) {
            setViewAnnexureModal({
                isOpen: true,
                callNo: record.callNumber || '',
                icNumber: record.icNumber || '',
                moduleType: normProduct.includes('SLEEPER') ? 'SLEEPER' : 'RAILPAD'
            });
            return;
        }

        // For ERC, continue with the standard tabular AnnexurePage
        const callObj = {
            call_no: record.callNumber,
            vendor_name: record.vendorName,
            product_type: `${selectedProduct}-${record.stage}`,
            icIssuedDate: record.icIssuedDate
        };
        setSelectedCall(callObj);
        setIsViewingAnnexures(true);
    };

    // Export entire filtered Inspection Certificates list to Excel (.xlsx)
    const handleExportExcel = async () => {
        if (!filteredRecords || filteredRecords.length === 0) {
            alert("No Inspection Certificate records available to export.");
            return;
        }

        const headers = [
            { label: 'S.No.', key: 'sNo' },
            { label: 'Vendor Name', key: 'vendorName' },
            { label: 'PO Number', key: 'formattedPo' },
            { label: 'Call Number', key: 'callNumber' },
            { label: 'Inspection Certificate Number', key: 'icNumber' },
            { label: 'Stage of Inspection', key: 'stage' },
            { label: 'Call Submission Date', key: 'callSubmissionDate' },
            { label: 'Acceptance Qty (Set / MT)', key: 'acceptanceQtySet' },
            { label: 'Acceptance Qty (Nos)', key: 'acceptanceQtyNos' },
            { label: 'IC Issued Date', key: 'icIssuedDate' },
            { label: 'Consignee / Railway', key: 'consignee' },
        ];

        const exportData = filteredRecords.map((record, index) => {
            const { qtySet, qtyNos } = getQuantityColumns(record);
            return {
                sNo: index + 1,
                vendorName: record.vendorName || '-',
                formattedPo: formatPoNumber(record) || record.poNumber || '-',
                callNumber: record.callNumber || '-',
                icNumber: record.icNumber || 'Pending',
                stage: record.stage || '-',
                callSubmissionDate: formatCallSubmissionDate(record.callSubmissionDateTime),
                acceptanceQtySet: qtySet,
                acceptanceQtyNos: qtyNos,
                icIssuedDate: record.icIssuedDate ? new Date(record.icIssuedDate).toLocaleDateString('en-GB') : '-',
                consignee: record.consignee || record.purchasingAuthority || record.railwayShortName || '-',
            };
        });

        await downloadExcel(
            exportData, 
            headers, 
            `Inspection_Certificates_${selectedProduct}_${new Date().toISOString().split('T')[0]}`,
            `Inspection Certificates (${selectedProduct}) - SARTHI Railway Board`
        );
    };

    // Export entire filtered Inspection Certificates list to PDF
    const handleExportPdf = () => {
        if (!filteredRecords || filteredRecords.length === 0) {
            alert("No Inspection Certificate records available to export.");
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Official SARTHI Header
        doc.setFillColor(20, 83, 45); // Forest green #14532d
        doc.rect(10, 8, 3, 9, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(20, 83, 45);
        doc.text(`SARTHI - Inspection Certificates Issued (${selectedProduct})`, 15, 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        
        const formattedNow = new Date().toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        doc.text(`Generated on: ${formattedNow} | Total Records: ${filteredRecords.length} | Product: ${selectedProduct}`, 15, 19);

        const headers = [
            'S.No.',
            'Vendor Name',
            'PO Number',
            'Call Number',
            'Inspection Certificate No.',
            'Stage',
            'Call Date',
            'Accepted Qty (Set/MT)',
            'Accepted Qty (Nos)',
            'IC Issued Date'
        ];

        const tableRows = filteredRecords.map((record, index) => {
            const { qtySet, qtyNos } = getQuantityColumns(record);
            return [
                index + 1,
                record.vendorName || '-',
                formatPoNumber(record) || record.poNumber || '-',
                record.callNumber || '-',
                record.icNumber || 'Pending',
                record.stage || '-',
                formatCallSubmissionDate(record.callSubmissionDateTime),
                qtySet,
                qtyNos,
                record.icIssuedDate ? new Date(record.icIssuedDate).toLocaleDateString('en-GB') : '-'
            ];
        });

        autoTable(doc, {
            head: [headers],
            body: tableRows,
            startY: 23,
            styles: {
                fontSize: 7.5,
                cellPadding: 2.5,
                textColor: [30, 41, 59],
                lineColor: [226, 232, 240],
                lineWidth: 0.2
            },
            headStyles: {
                fillColor: [30, 58, 138], // Dark navy
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            didDrawPage: (data) => {
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height || pageSize.getHeight();
                const pageWidth = pageSize.width || pageSize.getWidth();
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text('Confidential - For Official Use Only | System for Automated Review, Tracking & Holistic Inspection (SARTHI)', 10, pageHeight - 6);
                doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 10, pageHeight - 6, { align: 'right' });
            }
        });

        doc.save(`Inspection_Certificates_${selectedProduct}_${new Date().toISOString().split('T')[0]}.pdf`);
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
                                    {selectedProduct !== 'Sleeper' && <option value="RAW MATERIAL">Raw Material (RM)</option>}
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

            {/* Table Search & Quick Filter Toolbar */}
            <div className="ic-table-toolbar">
                <div className="ic-toolbar-search-group">
                    <select 
                        className="ic-search-type-select"
                        value={searchType}
                        onChange={(e) => {
                            setSearchType(e.target.value);
                            setPage(0);
                        }}
                        title="Select search field"
                    >
                        <option value="global">Global Search</option>
                        <option value="callNo">Call No</option>
                        <option value="po">PO Number</option>
                        <option value="vendor">Vendor Name</option>
                    </select>

                    <div className="ic-search-input-wrapper">
                        <i className="fa-solid fa-magnifying-glass ic-search-icon"></i>
                        <input 
                            type="text" 
                            className="ic-toolbar-search-input"
                            placeholder={getSearchPlaceholder()}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                        />
                        {searchQuery && (
                            <button 
                                type="button"
                                className="ic-search-clear-btn" 
                                onClick={() => {
                                    setSearchQuery('');
                                    setPage(0);
                                }}
                                title="Clear search"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="ic-toolbar-filters">
                    <div className="ic-toolbar-stage-wrapper">
                        <select
                            className="ic-toolbar-stage-select"
                            value={stageFilter}
                            onChange={(e) => {
                                setStageFilter(e.target.value);
                                setActiveFilters(prev => ({ ...prev, stage: e.target.value }));
                                setPage(0);
                            }}
                            title="Filter by Stage"
                        >
                            <option value="all">All Stages</option>
                            {selectedProduct !== 'Sleeper' && <option value="RAW MATERIAL">Raw Material (RM)</option>}
                            <option value="PROCESS">Process</option>
                            <option value="FINAL">Final Inspection</option>
                        </select>
                    </div>

                    <span className="ic-toolbar-count-badge">
                        Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong>
                    </span>

                    {/* Download IC in Excel and PDF Buttons */}
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        title="Download IC List in Excel (.xlsx)"
                        disabled={loading || filteredRecords.length === 0}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0 12px',
                            height: '36px',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '12.5px',
                            cursor: (loading || filteredRecords.length === 0) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <i className="fa-solid fa-file-excel"></i> Excel
                    </button>

                    <button
                        type="button"
                        onClick={handleExportPdf}
                        title="Download IC List in PDF"
                        disabled={loading || filteredRecords.length === 0}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0 12px',
                            height: '36px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '12.5px',
                            cursor: (loading || filteredRecords.length === 0) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <i className="fa-solid fa-file-pdf"></i> PDF
                    </button>

                    <button
                        type="button"
                        className="ic-toolbar-refresh-btn"
                        onClick={() => fetchRecords(true)}
                        title="Refresh records"
                        disabled={loading}
                    >
                        <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`}></i>
                    </button>
                </div>
            </div>

            {/* IC Listing Table - Compact Fit (No Horizontal Scroll) */}
            <div className="ic-table-wrapper mb">
                <table className="ic-table-fit main-table">
                    <thead>
                        <tr>
                            <th style={{ width: '32px', textAlign: 'center' }}>S.No.</th>
                            <th onClick={() => handleSort('vendorName')} style={{ cursor: 'pointer' }}>
                                Vendor Name {renderSortIcon('vendorName')}
                            </th>
                            <th onClick={() => handleSort('poNumber')} style={{ cursor: 'pointer' }}>
                                PO Number {renderSortIcon('poNumber')}
                            </th>
                            <th onClick={() => handleSort('callNumber')} style={{ cursor: 'pointer', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                Call No. {renderSortIcon('callNumber')}
                            </th>
                            <th onClick={() => handleSort('icNumber')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                IC Number {renderSortIcon('icNumber')}
                            </th>
                            <th onClick={() => handleSort('stage')} style={{ cursor: 'pointer', textAlign: 'center', width: '65px' }}>
                                Stage {renderSortIcon('stage')}
                            </th>
                            <th onClick={() => handleSort('callSubmissionDateTime')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                Call Date {renderSortIcon('callSubmissionDateTime')}
                            </th>
                            <th onClick={() => handleSort('callQtySet')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                Acceptance Qty (Set/MT) {renderSortIcon('callQtySet')}
                            </th>
                            <th onClick={() => handleSort('callQtyNos')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                Acceptance Qty (Nos) {renderSortIcon('callQtyNos')}
                            </th>
                            <th onClick={() => handleSort('icIssuedDate')} style={{ cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                IC Date {renderSortIcon('icIssuedDate')}
                            </th>
                            <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="11" className="text-center p-8 text-slate-500">
                                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                                    Loading Inspection Certificates...
                                </td>
                            </tr>
                        ) : paginatedRecords.length > 0 ? (
                            paginatedRecords.map((record, index) => {
                                const serialNo = page * rowsPerPage + index + 1;
                                const combinedPo = formatPoNumber(record);
                                const { qtySet, qtyNos } = getQuantityColumns(record);
                                return (
                                    <tr key={record.id || index} className={index % 2 === 0 ? 'row-odd' : 'row-even'}>
                                        <td style={{ textAlign: 'center', color: '#64748b' }}>{serialNo}</td>
                                        <td className="font-semibold text-slate-800" style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.vendorName}>
                                            {record.vendorName}
                                        </td>
                                        <td className="font-bold text-indigo-700" style={{ whiteSpace: 'nowrap' }}>{combinedPo}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="prof-badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '10.5px' }}>
                                                {record.callNumber}
                                            </span>
                                        </td>
                                        <td className="font-mono text-emerald-800 font-semibold" style={{ whiteSpace: 'nowrap' }}>{record.icNumber || 'Pending'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`ic-stage-badge ${(record.stage || '').toLowerCase()}`}>
                                                {record.stage}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '11.5px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            {formatCallSubmissionDate(record.callSubmissionDateTime)}
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#0f766e', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            {qtySet}
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            {qtyNos}
                                        </td>
                                        <td style={{ fontSize: '11.5px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            {record.icIssuedDate ? new Date(record.icIssuedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <button 
                                                    className="ic-view-btn"
                                                    onClick={() => handleViewIc(record)}
                                                    title="View Stored Inspection Certificate"
                                                >
                                                    View IC
                                                </button>
                                                <button 
                                                    className="ic-annexures-btn"
                                                    onClick={() => handleDownloadAnnexures(record)}
                                                    title="View Call Annexures"
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
                                <td colSpan="11" className="text-center p-8 text-slate-400">
                                    No records found matching the filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {filteredRecords.length > 0 && (
                        <tfoot>
                            <tr style={{ background: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                                <td colSpan="7" style={{ textAlign: 'right', padding: '10px 14px', color: '#1e293b', fontSize: '12px' }}>
                                    Total Accepted Quantity:
                                </td>
                                <td style={{ textAlign: 'center', color: '#0f766e', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    {totalSetQty}
                                </td>
                                <td style={{ textAlign: 'center', color: '#1e293b', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    {totalNosQty}
                                </td>
                                <td colSpan="2"></td>
                            </tr>
                        </tfoot>
                    )}
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

            {/* View Annexure Modal for Sleeper / Railpad uploaded documents */}
            {viewAnnexureModal.isOpen && (
                <AnnexureUploadModal
                    isOpen={viewAnnexureModal.isOpen}
                    onClose={() => setViewAnnexureModal({ isOpen: false, callNo: '', icNumber: '', moduleType: 'SLEEPER' })}
                    callNo={viewAnnexureModal.callNo}
                    icNumber={viewAnnexureModal.icNumber}
                    moduleType={viewAnnexureModal.moduleType}
                    mode="view"
                />
            )}
        </div>
    );
};

export default DownloadIcAnnexures;
