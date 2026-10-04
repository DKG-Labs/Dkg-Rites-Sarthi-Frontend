import React, { useState, useEffect, useMemo } from 'react';
import { getIbsCallRegistrationData, getIbsCompletedCallsData } from '../../services/ibsService';
import './IbsInspectionDataView.css';

// Master category definitions for the 6 specific call streams
export const CALL_CATEGORIES = {
    ER: {
        key: 'ER',
        code: 'ER',
        product: 'ERC',
        stage: 'Raw Material',
        name: 'ERC Raw Material',
        label: 'ERC Raw Material (ER)',
        icon: '🔬',
        color: '#7c3aed',
        bg: '#ede9fe',
        border: '#c4b5fd'
    },
    EP: {
        key: 'EP',
        code: 'EP',
        product: 'ERC',
        stage: 'Process',
        name: 'ERC Process',
        label: 'ERC Process (EP)',
        icon: '⚙️',
        color: '#2563eb',
        bg: '#dbeafe',
        border: '#93c5fd'
    },
    EF: {
        key: 'EF',
        code: 'EF',
        product: 'ERC',
        stage: 'Final',
        name: 'ERC Final',
        label: 'ERC Final (EF)',
        icon: '🎯',
        color: '#059669',
        bg: '#d1fae5',
        border: '#6ee7b7'
    },
    SF: {
        key: 'SF',
        code: 'SF',
        product: 'Sleeper',
        stage: 'Final',
        name: 'Sleeper Final',
        label: 'Sleeper Final (SF)',
        icon: '🏗️',
        color: '#d97706',
        bg: '#fef3c7',
        border: '#fde68a'
    },
    RPP: {
        key: 'RPP',
        code: 'RPP',
        product: 'Railpad',
        stage: 'Process',
        name: 'Railpad Process',
        label: 'Railpad Process (RPP)',
        icon: '🚂',
        color: '#0284c7',
        bg: '#e0f2fe',
        border: '#7dd3fc'
    },
    RPF: {
        key: 'RPF',
        code: 'RPF',
        product: 'Railpad',
        stage: 'Final',
        name: 'Railpad Final',
        label: 'Railpad Final (RPF)',
        icon: '🛡️',
        color: '#0d9488',
        bg: '#ccfbf1',
        border: '#5eead4'
    }
};

/**
 * Determine exact category (ER, EP, EF, SF, RPP, RPF) from callNumber, icNumber, and typeOfCall
 */
export const getCallCategory = (callNumber, icNumber, typeOfCall) => {
    const call = (callNumber || '').toUpperCase().trim();
    const ic = (icNumber || '').toUpperCase().trim();

    if (call.startsWith('RPP') || ic.includes('/RPP-') || ic.includes('RPP')) {
        return CALL_CATEGORIES.RPP;
    }
    if (call.startsWith('RPF') || ic.includes('/RPF-') || ic.includes('RPF')) {
        return CALL_CATEGORIES.RPF;
    }
    if (call.startsWith('SF') || ic.includes('/SF-') || ic.includes('SF')) {
        return CALL_CATEGORIES.SF;
    }
    if (call.startsWith('ER') || ic.includes('/ER-') || ic.includes('ER')) {
        return CALL_CATEGORIES.ER;
    }
    if (call.startsWith('EP') || ic.includes('/EP-') || ic.includes('EP')) {
        return CALL_CATEGORIES.EP;
    }
    if (call.startsWith('EF') || ic.includes('/EF-') || ic.includes('EF')) {
        return CALL_CATEGORIES.EF;
    }

    // Fallbacks based on typeOfCall if prefix is non-standard
    const t = (typeOfCall || '').toUpperCase();
    if (t === 'S') return CALL_CATEGORIES.ER;
    if (t === 'P') return CALL_CATEGORIES.EP;
    if (t === 'F') return CALL_CATEGORIES.EF;

    return {
        key: 'OTHER',
        code: call.substring(0, 3) || 'OTH',
        product: 'Other',
        stage: 'Inspection',
        name: 'Other Inspection',
        label: call || 'Other Call',
        icon: '📋',
        color: '#64748b',
        bg: '#f1f5f9',
        border: '#cbd5e1'
    };
};

/**
 * Helper: User-friendly billing status representation & tooltips
 */
export const getBillingDisplayInfo = (status) => {
    switch ((status || '').toUpperCase()) {
        case 'COMPLETED':
            return {
                label: 'Reconciled',
                icon: '✓',
                className: 'reconciled',
                tooltip: 'Bill and payment details fully verified and reconciled with IBS'
            };
        case 'BILL_FETCHED':
            return {
                label: 'Bill Generated',
                icon: '📄',
                className: 'bill-fetched',
                tooltip: 'Invoice/bill generated in IBS; payment reconciliation pending'
            };
        case 'PAYMENT_FETCHED':
            return {
                label: 'Payment Verified',
                icon: '💳',
                className: 'payment-fetched',
                tooltip: 'Payment received; awaiting final billing invoice reconciliation'
            };
        case 'FAILED':
            return {
                label: 'Awaiting Bill',
                icon: '⏳',
                className: 'awaiting',
                tooltip: 'Call is acknowledged in IBS. Billing invoice has not yet been issued/posted by IBS.'
            };
        default:
            return {
                label: 'Pending Sync',
                icon: '🕒',
                className: 'pending',
                tooltip: 'Awaiting scheduled billing verification with IBS'
            };
    }
};

// Helper: Parse any date format (ISO, YYYY-MM-DD, DD-MM-YYYY, timestamp) to YYYY-MM-DD
const parseToDateString = (val) => {
    if (!val) return null;
    const str = String(val).trim();
    if (!str || str === 'null' || str === 'undefined' || str === '-') return null;
    // Standard ISO string or YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.substring(0, 10);
    }
    // DD-MM-YYYY or DD/MM/YYYY
    const dmy = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dmy) {
        return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    return null;
};

export const IbsInspectionDataView = ({ onNotify }) => {
    // Two Tabs: 'PENDING' vs 'COMPLETED'
    const [activeTab, setActiveTab] = useState('PENDING');

    const [pendingCalls, setPendingCalls] = useState([]);
    const [completedCalls, setCompletedCalls] = useState([]);

    const [pendingLoading, setPendingLoading] = useState(true);
    const [completedLoading, setCompletedLoading] = useState(false);

    const [pendingError, setPendingError] = useState(null);
    const [completedError, setCompletedError] = useState(null);

    // Active calls based on selected tab
    const calls = activeTab === 'PENDING' ? pendingCalls : completedCalls;
    const loading = activeTab === 'PENDING' ? pendingLoading : completedLoading;
    const error = activeTab === 'PENDING' ? pendingError : completedError;

    // Filters
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [productFilter, setProductFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState('ALL');
    const [blockedFilter, setBlockedFilter] = useState('ALL');
    const [billingFilter, setBillingFilter] = useState('ALL');

    // Date Range Filter
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateField, setDateField] = useState('ACK'); // 'ACK' | 'IC' | 'CALL' | 'ANY'
    const [quickDatePreset, setQuickDatePreset] = useState('ALL');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Sorting state: { key: null | string, direction: 'asc' | 'desc' }
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Detail Modal State
    const [selectedCall, setSelectedCall] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

    // View Mode State: 'CARDS' (mobile friendly, zero horizontal scrolling) | 'TABLE' (spreadsheet table)
    const [viewMode, setViewMode] = useState(() => {
        return (typeof window !== 'undefined' && window.innerWidth <= 768) ? 'CARDS' : 'TABLE';
    });

    useEffect(() => {
        const handleResize = () => {
            const isSmall = window.innerWidth <= 768;
            const hasUserSwitched = sessionStorage.getItem('ibs_user_switched_view');
            if (!hasUserSwitched) {
                setViewMode(isSmall ? 'CARDS' : 'TABLE');
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const switchViewMode = (mode) => {
        sessionStorage.setItem('ibs_user_switched_view', 'true');
        setViewMode(mode);
    };

    const notify = (msg, severity = 'info') => {
        if (onNotify) {
            onNotify(msg, severity);
        }
    };

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                if (prev.direction === 'asc') {
                    return { key, direction: 'desc' };
                }
                return { key: null, direction: 'asc' };
            }
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const getSortColumnLabel = (key) => {
        switch (key) {
            case 'srNo': return 'IBS SR No';
            case 'category': return 'Category';
            case 'callNumber': return 'Call Number';
            case 'caseNumber': return 'Case Number';
            case 'icNumber': return 'Certificate (IC) No';
            case 'callDate': return activeTab === 'COMPLETED' ? 'Ack / IC Date' : 'Call Date';
            case 'placeOfInspection': return 'POI Code';
            case 'ieEmployeeNumber': return 'IE Emp No';
            case 'quantityOffered': return 'Offered Qty';
            case 'quantityPassed': return 'Passed Qty';
            case 'quantityRejected': return 'Rejected Qty';
            case 'status': return activeTab === 'COMPLETED' ? 'IBS / Billing Status' : 'Status / Block';
            default: return key;
        }
    };

    const fetchPendingCalls = async () => {
        setPendingLoading(true);
        setPendingError(null);
        try {
            const data = await getIbsCallRegistrationData();
            setPendingCalls(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load pending IBS calls:', err);
            setPendingError(err.message || 'Failed to fetch pending IBS calls');
        } finally {
            setPendingLoading(false);
        }
    };

    const fetchCompletedCalls = async () => {
        setCompletedLoading(true);
        setCompletedError(null);
        try {
            const data = await getIbsCompletedCallsData();
            setCompletedCalls(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load completed IBS calls:', err);
            setCompletedError(err.message || 'Failed to fetch completed IBS calls');
        } finally {
            setCompletedLoading(false);
        }
    };

    const refreshData = async () => {
        if (activeTab === 'PENDING') {
            await fetchPendingCalls();
            notify('Refreshed pending calls data', 'success');
        } else {
            await fetchCompletedCalls();
            notify('Refreshed completed calls data', 'success');
        }
    };

    useEffect(() => {
        fetchPendingCalls();
        fetchCompletedCalls();
    }, []);

    const applyDatePreset = (preset) => {
        setQuickDatePreset(preset);
        if (preset === 'ALL') {
            setStartDate('');
            setEndDate('');
            setCurrentPage(1);
            return;
        }

        const today = new Date();
        const formatDate = (d) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        let start = new Date();
        let end = new Date();

        if (preset === 'TODAY') {
            start = today;
            end = today;
        } else if (preset === 'LAST_7') {
            start = new Date();
            start.setDate(today.getDate() - 7);
            end = today;
        } else if (preset === 'LAST_30') {
            start = new Date();
            start.setDate(today.getDate() - 30);
            end = today;
        } else if (preset === 'THIS_MONTH') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = today;
        } else if (preset === 'LAST_90') {
            start = new Date();
            start.setDate(today.getDate() - 90);
            end = today;
        }

        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
        setCurrentPage(1);
    };

    const handleTabSwitch = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setCategoryFilter('ALL');
        setProductFilter('ALL');
        setRegionFilter('ALL');
        setBlockedFilter('ALL');
        setBillingFilter('ALL');
        setStartDate('');
        setEndDate('');
        setQuickDatePreset('ALL');
        setDateField(tab === 'COMPLETED' ? 'ACK' : 'CALL');
        setSortConfig({ key: null, direction: 'asc' });
        setCurrentPage(1);

        if (tab === 'COMPLETED' && completedCalls.length === 0 && !completedLoading) {
            fetchCompletedCalls();
        } else if (tab === 'PENDING' && pendingCalls.length === 0 && !pendingLoading) {
            fetchPendingCalls();
        }
    };

    // Helper: Determine Region from IC Number or Case Number
    const getRegionInfo = (icNumber, caseNumber) => {
        let code = '';
        if (icNumber && icNumber.includes('/')) {
            code = icNumber.split('/')[0].trim().toUpperCase();
        } else if (caseNumber && caseNumber.trim()) {
            code = caseNumber.trim().charAt(0).toUpperCase();
        }

        switch (code) {
            case 'C': return { code: 'C', name: 'Central', color: '#8b5cf6', bg: '#f5f3ff' };
            case 'W': return { code: 'W', name: 'Western', color: '#f59e0b', bg: '#fffbeb' };
            case 'N': return { code: 'N', name: 'Northern', color: '#0ea5e9', bg: '#f0f9ff' };
            case 'E': return { code: 'E', name: 'Eastern', color: '#10b981', bg: '#ecfdf5' };
            case 'S': return { code: 'S', name: 'Southern', color: '#ec4899', bg: '#fdf2f8' };
            default: return { code: code || '-', name: 'Other', color: '#64748b', bg: '#f8fafc' };
        }
    };

    // Calculate metrics across the 6 categories
    const categoryStats = useMemo(() => {
        const stats = {
            TOTAL: calls.length,
            ER: 0,
            EP: 0,
            EF: 0,
            SF: 0,
            RPP: 0,
            RPF: 0,
            OTHER: 0,
            totalOffered: 0,
            totalPassed: 0,
            totalRejected: 0,
            totalBlocked: 0
        };

        calls.forEach(c => {
            const cat = getCallCategory(c.callNumber, c.icNumber, c.typeOfCall);
            if (stats[cat.key] !== undefined) {
                stats[cat.key]++;
            } else {
                stats.OTHER++;
            }

            stats.totalOffered += Number(c.quantityOffered) || 0;
            stats.totalPassed += Number(c.quantityPassed) || 0;
            stats.totalRejected += Number(c.quantityRejected) || 0;

            if (c.is_blocked === 1 || c.cancellation_charges > 0 || c.rejection_charges > 0) {
                stats.totalBlocked++;
            }
        });

        return stats;
    }, [calls]);

    // Filtered Calls
    const filteredCalls = useMemo(() => {
        return calls.filter(call => {
            const cat = getCallCategory(call.callNumber, call.icNumber, call.typeOfCall);

            // Category filter (ER, EP, EF, SF, RPP, RPF)
            if (categoryFilter !== 'ALL' && cat.key !== categoryFilter) {
                return false;
            }

            // Product filter (ERC, Sleeper, Railpad)
            if (productFilter !== 'ALL' && cat.product.toUpperCase() !== productFilter.toUpperCase()) {
                return false;
            }

            // Region filter
            if (regionFilter !== 'ALL') {
                const reg = getRegionInfo(call.icNumber, call.caseNumber);
                if (reg.code !== regionFilter) return false;
            }

            // Blocked filter (Pending tab only)
            if (activeTab === 'PENDING') {
                if (blockedFilter === 'BLOCKED' && call.is_blocked !== 1 && (call.cancellation_charges <= 0 && call.rejection_charges <= 0)) {
                    return false;
                }
                if (blockedFilter === 'UNBLOCKED' && (call.is_blocked === 1 || call.cancellation_charges > 0 || call.rejection_charges > 0)) {
                    return false;
                }
            }

            // Billing Status filter (Completed tab only)
            if (activeTab === 'COMPLETED' && billingFilter !== 'ALL') {
                const bStatus = (call.billingStatus || 'PENDING').toUpperCase();
                if (bStatus !== billingFilter) return false;
            }

            // Date Range filter
            if (startDate || endDate) {
                let callDatesToTest = [];
                const ackStr = parseToDateString(call.acknowledgedAt);
                const icStr = parseToDateString(call.icDate);
                const callDateStr = parseToDateString(call.callDate);

                if (activeTab === 'COMPLETED') {
                    if (dateField === 'ACK') {
                        callDatesToTest = [ackStr || icStr || callDateStr];
                    } else if (dateField === 'IC') {
                        callDatesToTest = [icStr];
                    } else if (dateField === 'CALL') {
                        callDatesToTest = [callDateStr];
                    } else { // 'ANY'
                        callDatesToTest = [ackStr, icStr, callDateStr].filter(Boolean);
                    }
                } else {
                    if (dateField === 'CALL') {
                        callDatesToTest = [callDateStr];
                    } else if (dateField === 'IC') {
                        callDatesToTest = [icStr];
                    } else { // 'ANY'
                        callDatesToTest = [callDateStr, icStr].filter(Boolean);
                    }
                }

                const matchesDate = callDatesToTest.some((dStr) => {
                    if (!dStr) return false;
                    if (startDate && dStr < startDate) return false;
                    if (endDate && dStr > endDate) return false;
                    return true;
                });

                if (!matchesDate) return false;
            }

            // Text search
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const callNo = (call.callNumber || '').toLowerCase();
                const caseNo = (call.caseNumber || '').toLowerCase();
                const icNo = (call.icNumber || '').toLowerCase();
                const srNo = (call.srNo || '').toLowerCase();
                const poi = (call.placeOfInspection || '').toLowerCase();
                const ieNo = (call.ieEmployeeNumber || '').toLowerCase();
                const vendorCode = (call.ibsManufacturedCode || '').toLowerCase();
                const bkNo = (call.bkNumber || '').toLowerCase();
                const setNo = (call.setNumber || '').toLowerCase();
                const catLabel = (cat.label || '').toLowerCase();

                return callNo.includes(term) ||
                    caseNo.includes(term) ||
                    icNo.includes(term) ||
                    srNo.includes(term) ||
                    poi.includes(term) ||
                    ieNo.includes(term) ||
                    vendorCode.includes(term) ||
                    bkNo.includes(term) ||
                    setNo.includes(term) ||
                    catLabel.includes(term);
            }

            return true;
        });
    }, [calls, categoryFilter, productFilter, regionFilter, blockedFilter, billingFilter, startDate, endDate, dateField, searchTerm, activeTab]);

    // Sorted Calls
    const sortedCalls = useMemo(() => {
        if (!sortConfig.key) return filteredCalls;

        return [...filteredCalls].sort((a, b) => {
            let valA;
            let valB;

            switch (sortConfig.key) {
                case 'srNo': {
                    const numA = a.srNo != null && a.srNo !== '' ? Number(a.srNo) : null;
                    const numB = b.srNo != null && b.srNo !== '' ? Number(b.srNo) : null;
                    if (numA !== null && numB !== null && !isNaN(numA) && !isNaN(numB)) {
                        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
                    }
                    valA = (a.srNo || '').toLowerCase();
                    valB = (b.srNo || '').toLowerCase();
                    break;
                }
                case 'category': {
                    const catA = getCallCategory(a.callNumber, a.icNumber, a.typeOfCall);
                    const catB = getCallCategory(b.callNumber, b.icNumber, b.typeOfCall);
                    valA = catA.code || catA.key;
                    valB = catB.code || catB.key;
                    break;
                }
                case 'callNumber':
                    valA = (a.callNumber || '').toLowerCase();
                    valB = (b.callNumber || '').toLowerCase();
                    break;
                case 'caseNumber':
                    valA = (a.caseNumber || '').toLowerCase();
                    valB = (b.caseNumber || '').toLowerCase();
                    break;
                case 'icNumber':
                    valA = (a.icNumber || '').toLowerCase();
                    valB = (b.icNumber || '').toLowerCase();
                    break;
                case 'callDate':
                    valA = a.callDate || a.acknowledgedAt || a.icDate || '';
                    valB = b.callDate || b.acknowledgedAt || b.icDate || '';
                    break;
                case 'placeOfInspection':
                    valA = (a.placeOfInspection || '').toLowerCase();
                    valB = (b.placeOfInspection || '').toLowerCase();
                    break;
                case 'ieEmployeeNumber': {
                    const numA = Number(a.ieEmployeeNumber);
                    const numB = Number(b.ieEmployeeNumber);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
                    }
                    valA = (a.ieEmployeeNumber || '').toLowerCase();
                    valB = (b.ieEmployeeNumber || '').toLowerCase();
                    break;
                }
                case 'quantityOffered': {
                    const qA = Number(a.quantityOffered) || 0;
                    const qB = Number(b.quantityOffered) || 0;
                    return sortConfig.direction === 'asc' ? qA - qB : qB - qA;
                }
                case 'quantityPassed': {
                    const qA = Number(a.quantityPassed) || 0;
                    const qB = Number(b.quantityPassed) || 0;
                    return sortConfig.direction === 'asc' ? qA - qB : qB - qA;
                }
                case 'quantityRejected': {
                    const qA = Number(a.quantityRejected) || 0;
                    const qB = Number(b.quantityRejected) || 0;
                    return sortConfig.direction === 'asc' ? qA - qB : qB - qA;
                }
                case 'status':
                    if (activeTab === 'COMPLETED') {
                        valA = `${a.billingStatus || ''} ${a.ibsStatus || ''}`.trim().toLowerCase();
                        valB = `${b.billingStatus || ''} ${b.ibsStatus || ''}`.trim().toLowerCase();
                    } else {
                        const blockA = (a.is_blocked === 1 || a.cancellation_charges > 0 || a.rejection_charges > 0) ? 1 : 0;
                        const blockB = (b.is_blocked === 1 || b.cancellation_charges > 0 || b.rejection_charges > 0) ? 1 : 0;
                        return sortConfig.direction === 'asc' ? blockA - blockB : blockB - blockA;
                    }
                    break;
                default:
                    valA = (a[sortConfig.key] || '').toString().toLowerCase();
                    valB = (b[sortConfig.key] || '').toString().toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredCalls, sortConfig, activeTab]);

    // Pagination calculations
    const totalPages = Math.ceil(sortedCalls.length / pageSize) || 1;
    const paginatedCalls = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedCalls.slice(start, start + pageSize);
    }, [sortedCalls, currentPage, pageSize]);

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 1500);
    };

    const handleCategoryClick = (catKey) => {
        if (categoryFilter === catKey) {
            setCategoryFilter('ALL');
        } else {
            setCategoryFilter(catKey);
        }
        setProductFilter('ALL');
        setCurrentPage(1);
    };

    // Export to CSV
    const exportToCsv = () => {
        if (!sortedCalls || sortedCalls.length === 0) {
            notify('No data available to export', 'warning');
            return;
        }

        const isCompleted = activeTab === 'COMPLETED';

        const headers = [
            ...(isCompleted ? ['IBS SR No', 'IBS Status', 'Billing Status', 'Acknowledged Date'] : []),
            'Category',
            'Product',
            'Stage',
            'Call Number',
            'Case Number',
            'IC Number',
            'Type of Call',
            'Call Status',
            'Call Date',
            'IC Date',
            'Place of Inspection',
            'IBS Manufacturer Code',
            'IE Employee Number',
            'PO Item Serial Numbers',
            'Quantity Offered',
            'Quantity Passed',
            'Quantity Rejected',
            'Book Number',
            'Set Number',
            'Is Blocked',
            'Cancellation Charges',
            'Rejection Charges',
            'Certificate Link'
        ];

        const rows = sortedCalls.map(c => {
            const cat = getCallCategory(c.callNumber, c.icNumber, c.typeOfCall);
            return [
                ...(isCompleted ? [
                    `"${c.srNo || ''}"`,
                    `"${c.ibsStatus || 'SUCCESS'}"`,
                    `"${c.billingStatus || 'PENDING'}"`,
                    `"${c.acknowledgedAt || ''}"`
                ] : []),
                `"${cat.key}"`,
                `"${cat.product}"`,
                `"${cat.stage}"`,
                `"${c.callNumber || ''}"`,
                `"${c.caseNumber || ''}"`,
                `"${c.icNumber || ''}"`,
                `"${c.typeOfCall || ''}"`,
                `"${c.callStatus || ''}"`,
                `"${c.callDate || ''}"`,
                `"${c.icDate || ''}"`,
                `"${c.placeOfInspection || ''}"`,
                `"${c.ibsManufacturedCode || ''}"`,
                `"${c.ieEmployeeNumber || ''}"`,
                `"${(c.poItemSerialNumbers || []).join(';')}"`,
                c.quantityOffered || 0,
                c.quantityPassed || 0,
                c.quantityRejected || 0,
                `"${c.bkNumber || ''}"`,
                `"${c.setNumber || ''}"`,
                c.is_blocked || 0,
                c.cancellation_charges || 0,
                c.rejection_charges || 0,
                `"${c.icFileLink || ''}"`
            ];
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `ibs_${activeTab.toLowerCase()}_calls_${categoryFilter !== 'ALL' ? categoryFilter + '_' : ''}${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify(`Exported ${activeTab.toLowerCase()} IBS calls to CSV`, 'success');
    };

    const renderSortableTh = (key, label, style = {}) => {
        const isSorted = sortConfig.key === key;
        return (
            <th
                key={key}
                className={`ibs-th-sortable ${isSorted ? 'sorted' : ''}`}
                onClick={() => handleSort(key)}
                title={`Click to sort by ${label} (${isSorted && sortConfig.direction === 'asc' ? 'Descending' : 'Ascending'})`}
                style={style}
            >
                <div className="ibs-th-content">
                    <span>{label}</span>
                    <span className={`ibs-sort-icon ${isSorted ? 'active' : 'default'}`}>
                        {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                </div>
            </th>
        );
    };

    return (
        <div className="ibs-container">
            {/* Header Section */}
            <div className="ibs-header">
                <div className="ibs-header-left">
                    <div className="ibs-title-row">
                        <h2 className="ibs-title">
                            <span className="ibs-icon-header">📋</span> IBS Inspection Data
                        </h2>
                        <span className="ibs-live-tag">
                            <span className="ibs-live-pulse"></span> Live System Sync
                        </span>
                    </div>
                    <p className="ibs-subtitle">
                        {activeTab === 'PENDING' ? (
                            'Inspection calls pending IBS registration across ERC, Sleeper, and Railpad manufacturing streams with PO and certificate validation.'
                        ) : (
                            'Synchronized inspection calls officially acknowledged by IBS, verified with digital certificates, case mappings, and billing reconciliation.'
                        )}
                    </p>
                </div>
                <div className="ibs-header-actions">
                    <button
                        className="btn btn-secondary ibs-btn-action"
                        onClick={refreshData}
                        disabled={loading}
                        title="Reload live data from server"
                    >
                        <span className={`ibs-reload-icon ${loading ? 'rotating' : ''}`}>🔄</span> Refresh Data
                    </button>
                    <button
                        className="btn btn-primary ibs-btn-action"
                        onClick={exportToCsv}
                        disabled={loading || filteredCalls.length === 0}
                    >
                        <span>📥</span> Export CSV
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="ibs-alert ibs-alert-danger">
                    <span>⚠️ Error loading IBS data: {error}</span>
                    <button className="btn btn-sm btn-secondary" onClick={refreshData}>Try Again</button>
                </div>
            )}

            {/* Dual Tabs: Pending vs Completed */}
            <div className="ibs-tabs-container">
                <button
                    type="button"
                    className={`ibs-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('PENDING')}
                >
                    <span className="ibs-tab-icon">⏳</span>
                    <span className="ibs-tab-label">Pending Calls</span>
                    <span className="ibs-tab-badge pending">
                        {pendingLoading ? '...' : pendingCalls.length}
                    </span>
                </button>
                <button
                    type="button"
                    className={`ibs-tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('COMPLETED')}
                >
                    <span className="ibs-tab-icon">✅</span>
                    <span className="ibs-tab-label">Completed Calls</span>
                    <span className="ibs-tab-badge completed">
                        {completedLoading ? '...' : completedCalls.length}
                    </span>
                </button>
            </div>

            {/* 6 Category Interactive KPI Cards */}
            <div className="ibs-category-kpi-grid">
                {/* Total / All Card */}
                <div
                    className={`ibs-cat-card ${categoryFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('ALL')}
                    title="Click to view all calls"
                >
                    <div className="ibs-cat-card-top">
                        <span className="ibs-cat-icon" style={{ background: '#f1f5f9', color: '#334155' }}>📊</span>
                        <span className="ibs-cat-badge-code" style={{ background: '#e2e8f0', color: '#1e293b' }}>ALL</span>
                    </div>
                    <div className="ibs-cat-val">{categoryStats.TOTAL}</div>
                    <div className="ibs-cat-label">{activeTab === 'PENDING' ? 'All Pending Calls' : 'All Completed Calls'}</div>
                    <div className="ibs-cat-sub">Deduplicated across all products</div>
                </div>

                {/* ERC Raw Material (ER) */}
                <div
                    className={`ibs-cat-card ${categoryFilter === 'ER' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('ER')}
                    style={{ borderColor: categoryFilter === 'ER' ? CALL_CATEGORIES.ER.color : undefined }}
                    title="Click to filter ERC Raw Material calls"
                >
                    <div className="ibs-cat-card-top">
                        <span className="ibs-cat-icon" style={{ background: CALL_CATEGORIES.ER.bg, color: CALL_CATEGORIES.ER.color }}>{CALL_CATEGORIES.ER.icon}</span>
                        <span className="ibs-cat-badge-code" style={{ background: CALL_CATEGORIES.ER.bg, color: CALL_CATEGORIES.ER.color, border: `1px solid ${CALL_CATEGORIES.ER.border}` }}>ER</span>
                    </div>
                    <div className="ibs-cat-val" style={{ color: CALL_CATEGORIES.ER.color }}>{categoryStats.ER}</div>
                    <div className="ibs-cat-label">ERC Raw Material</div>
                    <div className="ibs-cat-sub">Calls starting with ER-</div>
                </div>

                {/* ERC Process (EP) */}
                <div
                    className={`ibs-cat-card ${categoryFilter === 'EP' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('EP')}
                    style={{ borderColor: categoryFilter === 'EP' ? CALL_CATEGORIES.EP.color : undefined }}
                    title="Click to filter ERC Process calls"
                >
                    <div className="ibs-cat-card-top">
                        <span className="ibs-cat-icon" style={{ background: CALL_CATEGORIES.EP.bg, color: CALL_CATEGORIES.EP.color }}>{CALL_CATEGORIES.EP.icon}</span>
                        <span className="ibs-cat-badge-code" style={{ background: CALL_CATEGORIES.EP.bg, color: CALL_CATEGORIES.EP.color, border: `1px solid ${CALL_CATEGORIES.EP.border}` }}>EP</span>
                    </div>
                    <div className="ibs-cat-val" style={{ color: CALL_CATEGORIES.EP.color }}>{categoryStats.EP}</div>
                    <div className="ibs-cat-label">ERC Process</div>
                    <div className="ibs-cat-sub">Calls starting with EP-</div>
                </div>

                {/* ERC Final (EF) */}
                <div
                    className={`ibs-cat-card ${categoryFilter === 'EF' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('EF')}
                    style={{ borderColor: categoryFilter === 'EF' ? CALL_CATEGORIES.EF.color : undefined }}
                    title="Click to filter ERC Final calls"
                >
                    <div className="ibs-cat-card-top">
                        <span className="ibs-cat-icon" style={{ background: CALL_CATEGORIES.EF.bg, color: CALL_CATEGORIES.EF.color }}>{CALL_CATEGORIES.EF.icon}</span>
                        <span className="ibs-cat-badge-code" style={{ background: CALL_CATEGORIES.EF.bg, color: CALL_CATEGORIES.EF.color, border: `1px solid ${CALL_CATEGORIES.EF.border}` }}>EF</span>
                    </div>
                    <div className="ibs-cat-val" style={{ color: CALL_CATEGORIES.EF.color }}>{categoryStats.EF}</div>
                    <div className="ibs-cat-label">ERC Final</div>
                    <div className="ibs-cat-sub">Calls starting with EF-</div>
                </div>

                {/* Sleeper Final (SF) */}
                <div
                    className={`ibs-cat-card ${categoryFilter === 'SF' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('SF')}
                    style={{ borderColor: categoryFilter === 'SF' ? CALL_CATEGORIES.SF.color : undefined }}
                    title="Click to filter Sleeper Final calls"
                >
                    <div className="ibs-cat-card-top">
                        <span className="ibs-cat-icon" style={{ background: CALL_CATEGORIES.SF.bg, color: CALL_CATEGORIES.SF.color }}>{CALL_CATEGORIES.SF.icon}</span>
                        <span className="ibs-cat-badge-code" style={{ background: CALL_CATEGORIES.SF.bg, color: CALL_CATEGORIES.SF.color, border: `1px solid ${CALL_CATEGORIES.SF.border}` }}>SF</span>
                    </div>
                    <div className="ibs-cat-val" style={{ color: CALL_CATEGORIES.SF.color }}>{categoryStats.SF}</div>
                    <div className="ibs-cat-label">Sleeper Final</div>
                    <div className="ibs-cat-sub">Calls starting with SF-</div>
                </div>

                {/* Railpad Process (RPP) */}
                <div
                    className={`ibs-cat-card ${categoryFilter === 'RPP' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('RPP')}
                    style={{ borderColor: categoryFilter === 'RPP' ? CALL_CATEGORIES.RPP.color : undefined }}
                    title="Click to filter Railpad Process calls"
                >
                    <div className="ibs-cat-card-top">
                        <span className="ibs-cat-icon" style={{ background: CALL_CATEGORIES.RPP.bg, color: CALL_CATEGORIES.RPP.color }}>{CALL_CATEGORIES.RPP.icon}</span>
                        <span className="ibs-cat-badge-code" style={{ background: CALL_CATEGORIES.RPP.bg, color: CALL_CATEGORIES.RPP.color, border: `1px solid ${CALL_CATEGORIES.RPP.border}` }}>RPP</span>
                    </div>
                    <div className="ibs-cat-val" style={{ color: CALL_CATEGORIES.RPP.color }}>{categoryStats.RPP}</div>
                    <div className="ibs-cat-label">Railpad Process</div>
                    <div className="ibs-cat-sub">Calls starting with RPP-</div>
                </div>

                {/* Railpad Final (RPF) */}
                <div
                    className={`ibs-cat-card ${categoryFilter === 'RPF' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('RPF')}
                    style={{ borderColor: categoryFilter === 'RPF' ? CALL_CATEGORIES.RPF.color : undefined }}
                    title="Click to filter Railpad Final calls"
                >
                    <div className="ibs-cat-card-top">
                        <span className="ibs-cat-icon" style={{ background: CALL_CATEGORIES.RPF.bg, color: CALL_CATEGORIES.RPF.color }}>{CALL_CATEGORIES.RPF.icon}</span>
                        <span className="ibs-cat-badge-code" style={{ background: CALL_CATEGORIES.RPF.bg, color: CALL_CATEGORIES.RPF.color, border: `1px solid ${CALL_CATEGORIES.RPF.border}` }}>RPF</span>
                    </div>
                    <div className="ibs-cat-val" style={{ color: CALL_CATEGORIES.RPF.color }}>{categoryStats.RPF}</div>
                    <div className="ibs-cat-label">Railpad Final</div>
                    <div className="ibs-cat-sub">Calls starting with RPF-</div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="ibs-filter-bar">
                <div className="ibs-search-wrapper">
                    <span className="ibs-search-icon">🔍</span>
                    <input
                        type="text"
                        className="ibs-search-input"
                        placeholder={activeTab === 'COMPLETED'
                            ? "Search by Call No (ER, EP, SF...), SR No, Case No, IC No, POI, IE Emp No..."
                            : "Search by Call No (ER, EP, SF, RPP, RPF...), Case No, IC No, POI, IE Emp No..."}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            className="ibs-search-clear"
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Category Dropdown */}
                <div className="ibs-filter-group">
                    <label>Category:</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                        className="ibs-select"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="ER">🔬 ERC Raw Material (ER)</option>
                        <option value="EP">⚙️ ERC Process (EP)</option>
                        <option value="EF">🎯 ERC Final (EF)</option>
                        <option value="SF">🏗️ Sleeper Final (SF)</option>
                        <option value="RPP">🚂 Railpad Process (RPP)</option>
                        <option value="RPF">🛡️ Railpad Final (RPF)</option>
                    </select>
                </div>

                {/* Product Dropdown */}
                <div className="ibs-filter-group">
                    <label>Product Line:</label>
                    <select
                        value={productFilter}
                        onChange={(e) => { setProductFilter(e.target.value); setCategoryFilter('ALL'); setCurrentPage(1); }}
                        className="ibs-select"
                    >
                        <option value="ALL">All Products</option>
                        <option value="ERC">ERC (ER, EP, EF)</option>
                        <option value="SLEEPER">Sleeper (SF)</option>
                        <option value="RAILPAD">Railpad (RPP, RPF)</option>
                    </select>
                </div>

                {/* Region Dropdown */}
                <div className="ibs-filter-group">
                    <label>Region / RIO:</label>
                    <select
                        value={regionFilter}
                        onChange={(e) => { setRegionFilter(e.target.value); setCurrentPage(1); }}
                        className="ibs-select"
                    >
                        <option value="ALL">All Regions</option>
                        <option value="C">Central (C)</option>
                        <option value="W">Western (W)</option>
                        <option value="N">Northern (N)</option>
                        <option value="E">Eastern (E)</option>
                        <option value="S">Southern (S)</option>
                    </select>
                </div>

                {/* Status Dropdowns (Dynamic per tab) */}
                {activeTab === 'PENDING' ? (
                    <div className="ibs-filter-group">
                        <label>Status:</label>
                        <select
                            value={blockedFilter}
                            onChange={(e) => { setBlockedFilter(e.target.value); setCurrentPage(1); }}
                            className="ibs-select"
                        >
                            <option value="ALL">All Calls</option>
                            <option value="BLOCKED">Blocked Only (Charges &gt; 0)</option>
                            <option value="UNBLOCKED">Normal (Active)</option>
                        </select>
                    </div>
                ) : (
                    <div className="ibs-filter-group">
                        <label>Billing Status:</label>
                        <select
                            value={billingFilter}
                            onChange={(e) => { setBillingFilter(e.target.value); setCurrentPage(1); }}
                            className="ibs-select"
                        >
                            <option value="ALL">All Billing Stages</option>
                            <option value="COMPLETED">✅ Reconciled (Completed)</option>
                            <option value="BILL_FETCHED">📄 Bill Generated</option>
                            <option value="PAYMENT_FETCHED">💳 Payment Verified</option>
                            <option value="FAILED">⏳ Awaiting Bill (Not Issued)</option>
                            <option value="PENDING">🕒 Pending Sync</option>
                        </select>
                    </div>
                )}

                {/* Secondary Row: Dedicated Date Range Filter */}
                <div className="ibs-date-filter-row">
                    <div className="ibs-date-filter-left">
                        <div className="ibs-date-title">
                            <span className="ibs-date-icon">📅</span>
                            <span>Date Filter:</span>
                        </div>

                        {/* Date Field Selector */}
                        <div className="ibs-filter-group">
                            <label>Field:</label>
                            <select
                                value={dateField}
                                onChange={(e) => { setDateField(e.target.value); setCurrentPage(1); }}
                                className="ibs-select ibs-select-sm"
                            >
                                {activeTab === 'COMPLETED' ? (
                                    <>
                                        <option value="ACK">Ack / Sync Date</option>
                                        <option value="IC">IC Date</option>
                                        <option value="CALL">Call Date</option>
                                        <option value="ANY">Any Date</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="CALL">Call Date</option>
                                        <option value="IC">IC Date</option>
                                        <option value="ANY">Any Date</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* From Date */}
                        <div className="ibs-filter-group">
                            <label>From:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setQuickDatePreset('CUSTOM');
                                    setCurrentPage(1);
                                }}
                                className="ibs-date-input"
                            />
                        </div>

                        {/* To Date */}
                        <div className="ibs-filter-group">
                            <label>To:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setQuickDatePreset('CUSTOM');
                                    setCurrentPage(1);
                                }}
                                className="ibs-date-input"
                            />
                        </div>

                        {/* Quick Presets */}
                        <div className="ibs-date-presets">
                            <button
                                type="button"
                                className={`ibs-date-preset-btn ${quickDatePreset === 'LAST_7' ? 'active' : ''}`}
                                onClick={() => applyDatePreset('LAST_7')}
                            >
                                7 Days
                            </button>
                            <button
                                type="button"
                                className={`ibs-date-preset-btn ${quickDatePreset === 'LAST_30' ? 'active' : ''}`}
                                onClick={() => applyDatePreset('LAST_30')}
                            >
                                30 Days
                            </button>
                            <button
                                type="button"
                                className={`ibs-date-preset-btn ${quickDatePreset === 'LAST_90' ? 'active' : ''}`}
                                onClick={() => applyDatePreset('LAST_90')}
                            >
                                90 Days
                            </button>
                            <button
                                type="button"
                                className={`ibs-date-preset-btn ${quickDatePreset === 'THIS_MONTH' ? 'active' : ''}`}
                                onClick={() => applyDatePreset('THIS_MONTH')}
                            >
                                This Month
                            </button>
                        </div>

                        {/* Clear Dates Only */}
                        {(startDate || endDate) && (
                            <button
                                type="button"
                                className="ibs-date-clear-btn"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setQuickDatePreset('ALL');
                                    setCurrentPage(1);
                                }}
                                title="Clear date range"
                            >
                                ✕ Clear Dates
                            </button>
                        )}
                    </div>

                    {/* Reset All Filters */}
                    {(searchTerm || categoryFilter !== 'ALL' || productFilter !== 'ALL' || regionFilter !== 'ALL' || blockedFilter !== 'ALL' || billingFilter !== 'ALL' || startDate || endDate || sortConfig.key) && (
                        <button
                            type="button"
                            className="btn btn-sm btn-secondary ibs-btn-reset-all"
                            onClick={() => {
                                setSearchTerm('');
                                setCategoryFilter('ALL');
                                setProductFilter('ALL');
                                setRegionFilter('ALL');
                                setBlockedFilter('ALL');
                                setBillingFilter('ALL');
                                setStartDate('');
                                setEndDate('');
                                setQuickDatePreset('ALL');
                                setSortConfig({ key: null, direction: 'asc' });
                                setCurrentPage(1);
                            }}
                        >
                            🔄 Reset All Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results Counter & Active Filter Chips */}
            <div className="ibs-count-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>
                        Showing <strong>{sortedCalls.length}</strong> of <strong>{calls.length}</strong> {activeTab === 'PENDING' ? 'pending' : 'completed'} calls
                    </span>
                    {categoryFilter !== 'ALL' && (
                        <span className="ibs-active-filter-chip">
                            Category: <strong>{CALL_CATEGORIES[categoryFilter]?.label || categoryFilter}</strong>
                            <button onClick={() => setCategoryFilter('ALL')}>✕</button>
                        </span>
                    )}
                    {productFilter !== 'ALL' && (
                        <span className="ibs-active-filter-chip">
                            Product: <strong>{productFilter}</strong>
                            <button onClick={() => setProductFilter('ALL')}>✕</button>
                        </span>
                    )}
                    {activeTab === 'COMPLETED' && billingFilter !== 'ALL' && (
                        <span className="ibs-active-filter-chip">
                            Billing: <strong>{getBillingDisplayInfo(billingFilter).label}</strong>
                            <button onClick={() => setBillingFilter('ALL')}>✕</button>
                        </span>
                    )}
                    {(startDate || endDate) && (
                        <span className="ibs-active-filter-chip ibs-date-chip">
                            📅 {dateField === 'ACK' ? 'Ack Date' : dateField === 'IC' ? 'IC Date' : dateField === 'CALL' ? 'Call Date' : 'Date'}:{' '}
                            <strong>{startDate || 'Start'}</strong> to <strong>{endDate || 'End'}</strong>
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setQuickDatePreset('ALL');
                                    setCurrentPage(1);
                                }}
                                title="Remove date filter"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                    {sortConfig.key && (
                        <span className="ibs-active-filter-chip ibs-sort-chip">
                            Sorted: <strong>{getSortColumnLabel(sortConfig.key)}</strong> ({sortConfig.direction === 'asc' ? 'Ascending ▲' : 'Descending ▼'})
                            <button onClick={() => setSortConfig({ key: null, direction: 'asc' })} title="Clear sorting">✕</button>
                        </span>
                    )}
                </div>
                <div className="ibs-count-bar-right">
                    {/* View Switcher: Cards vs Table */}
                    <div className="ibs-view-mode-toggle" title="Toggle between Cards and Table view">
                        <button
                            type="button"
                            className={`ibs-view-toggle-btn ${viewMode === 'CARDS' ? 'active' : ''}`}
                            onClick={() => switchViewMode('CARDS')}
                        >
                            <span>📱</span> Cards
                        </button>
                        <button
                            type="button"
                            className={`ibs-view-toggle-btn ${viewMode === 'TABLE' ? 'active' : ''}`}
                            onClick={() => switchViewMode('TABLE')}
                        >
                            <span>📊</span> Table
                        </button>
                    </div>

                    <div className="ibs-page-size-selector">
                        <label>Rows:</label>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Table or Cards */}
            <div className="ibs-table-card">
                {loading ? (
                    <div className="ibs-loading-state">
                        <div className="ibs-spinner"></div>
                        <p>Loading live {activeTab === 'PENDING' ? 'pending' : 'completed'} IBS inspection data...</p>
                    </div>
                ) : filteredCalls.length === 0 ? (
                    <div className="ibs-empty-state">
                        <span className="ibs-empty-icon">📭</span>
                        <h3>No inspection calls found</h3>
                        <p>No records matched your search and filter criteria in the {activeTab.toLowerCase()} tab.</p>
                    </div>
                ) : viewMode === 'CARDS' ? (
                    <div className="ibs-mobile-cards-list">
                        {paginatedCalls.map((call, idx) => {
                            const rowNum = (currentPage - 1) * pageSize + idx + 1;
                            const category = getCallCategory(call.callNumber, call.icNumber, call.typeOfCall);
                            const region = getRegionInfo(call.icNumber, call.caseNumber);
                            const isBlocked = call.is_blocked === 1 || call.cancellation_charges > 0 || call.rejection_charges > 0;
                            const isCompleted = activeTab === 'COMPLETED';

                            return (
                                <div key={call.callNumber ? `${call.callNumber}-${idx}` : idx} className={`ibs-mobile-card ${isBlocked && !isCompleted ? 'card-blocked' : ''}`}>
                                    {/* Card Header: Category + Call Number + SR / Index */}
                                    <div className="ibs-mcard-header">
                                        <div className="ibs-mcard-header-left">
                                            <span
                                                className="ibs-category-tag"
                                                style={{
                                                    color: category.color,
                                                    background: category.bg,
                                                    borderColor: category.border
                                                }}
                                                title={category.label}
                                            >
                                                <span className="ibs-category-tag-icon">{category.icon}</span>
                                                <span className="ibs-category-tag-code">{category.code}</span>
                                            </span>
                                            <div className="ibs-call-no-cell">
                                                <span className="ibs-call-no-text">{call.callNumber || '-'}</span>
                                                {call.callNumber && (
                                                    <button
                                                        type="button"
                                                        className="ibs-btn-copy"
                                                        title="Copy Call Number"
                                                        onClick={() => handleCopy(call.callNumber, `call-${rowNum}`)}
                                                    >
                                                        {copiedField === `call-${rowNum}` ? '✓' : '📋'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ibs-mcard-header-right">
                                            {isCompleted && call.srNo ? (
                                                <div className="ibs-sr-cell">
                                                    <span className="ibs-sr-badge" title={`IBS SR No: ${call.srNo}`}>
                                                        #{call.srNo}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="ibs-btn-copy"
                                                        title="Copy IBS SR Number"
                                                        onClick={() => handleCopy(call.srNo, `sr-${rowNum}`)}
                                                    >
                                                        {copiedField === `sr-${rowNum}` ? '✓' : '📋'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="ibs-mcard-idx">#{rowNum}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Case and Certificate */}
                                    <div className="ibs-mcard-meta-row">
                                        <div className="ibs-mcard-meta-item">
                                            <span className="ibs-mcard-label">Case:</span>
                                            <div className="ibs-case-cell">
                                                {region.code !== '-' && (
                                                    <span
                                                        className="ibs-region-badge"
                                                        style={{ color: region.color, background: region.bg, borderColor: region.color }}
                                                        title={`Region: ${region.name}`}
                                                    >
                                                        {region.code}
                                                    </span>
                                                )}
                                                <span className="ibs-case-text">{call.caseNumber || <em style={{ color: '#94a3b8' }}>None</em>}</span>
                                            </div>
                                        </div>
                                        {call.icNumber && (
                                            <div className="ibs-mcard-meta-item">
                                                <span className="ibs-mcard-label">IC:</span>
                                                <span className="ibs-ic-no-text">{call.icNumber}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2-Column Details Grid using full card width */}
                                    <div className="ibs-mcard-details-grid">
                                        <div className="ibs-mcard-detail-item">
                                            <span className="ibs-mcard-label">📅 {isCompleted ? 'Ack / Call Date' : 'Call Date'}</span>
                                            <div className="ibs-mcard-val" style={{ fontWeight: 700, color: '#0f172a' }}>
                                                {call.acknowledgedAt || call.callDate || '-'}
                                            </div>
                                            {call.icDate && call.acknowledgedAt && (
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>IC: {call.icDate}</div>
                                            )}
                                        </div>

                                        <div className="ibs-mcard-detail-item">
                                            <span className="ibs-mcard-label">👤 IE Inspector</span>
                                            <div>
                                                <span className="ibs-ie-badge" style={{ fontSize: '12px', fontWeight: 600 }}>
                                                    {call.ieEmployeeNumber || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="ibs-mcard-detail-item">
                                            <span className="ibs-mcard-label">🏢 POI Code</span>
                                            <div>
                                                <span className="ibs-poi-badge" style={{ fontSize: '12px' }} title={call.placeOfInspection}>
                                                    {call.placeOfInspection || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="ibs-mcard-detail-item">
                                            <span className="ibs-mcard-label">🔬 Product & Stage</span>
                                            <div
                                                className="ibs-mcard-val"
                                                style={{
                                                    color: category.color,
                                                    fontWeight: 700,
                                                    fontSize: '12px'
                                                }}
                                                title={category.label}
                                            >
                                                {category.label}
                                            </div>
                                            {call.ibsManufacturedCode && (
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                    Mfg: {call.ibsManufacturedCode}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quantities Bar */}
                                    <div className="ibs-mcard-quantities-bar">
                                        <div className="ibs-mcard-qty-item">
                                            <span className="ibs-mcard-qty-lbl">Offered</span>
                                            <span className="ibs-mcard-qty-num">{Number(call.quantityOffered || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="ibs-mcard-qty-item passed">
                                            <span className="ibs-mcard-qty-lbl">Passed</span>
                                            <span className="ibs-mcard-qty-num">{Number(call.quantityPassed || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="ibs-mcard-qty-item rejected">
                                            <span className="ibs-mcard-qty-lbl">Rejected</span>
                                            <span className="ibs-mcard-qty-num">
                                                {call.quantityRejected > 0 ? Number(call.quantityRejected).toLocaleString('en-IN') : '0'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status & Actions Footer */}
                                    <div className="ibs-mcard-footer">
                                        <div className="ibs-mcard-status">
                                            {isCompleted ? (
                                                <div className="ibs-status-stack">
                                                    <div className="ibs-reg-status-pill">
                                                        <span className="ibs-status-dot success"></span>
                                                        <span>IBS Synced</span>
                                                    </div>
                                                    {(() => {
                                                        const bInfo = getBillingDisplayInfo(call.billingStatus);
                                                        return (
                                                            <div className={`ibs-billing-status-pill ${bInfo.className}`} title={bInfo.tooltip}>
                                                                <span className="ibs-billing-icon">{bInfo.icon}</span>
                                                                <span className="ibs-billing-val">{bInfo.label}</span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                isBlocked ? (
                                                    <span className="ibs-badge-blocked" title={`Cancel: ₹${call.cancellation_charges || 0} | Rej: ₹${call.rejection_charges || 0}`}>
                                                        🚫 Blocked
                                                    </span>
                                                ) : (
                                                    <span className="ibs-badge-active">Active</span>
                                                )
                                            )}
                                        </div>
                                        <div className="ibs-mcard-actions">
                                            {call.icFileLink && (
                                                <a
                                                    href={call.icFileLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ibs-action-btn ibs-btn-pdf"
                                                    title="Open Inspection Certificate PDF"
                                                >
                                                    📄 PDF
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                className="ibs-action-btn ibs-btn-details"
                                                onClick={() => setSelectedCall(call)}
                                                title="View Call Details"
                                            >
                                                👁️ Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="ibs-table-responsive">
                        <div className="ibs-mobile-scroll-hint">
                            <span>👉 Swipe horizontally to view all columns</span>
                        </div>
                        <table className="ibs-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '45px' }}>#</th>
                                    {activeTab === 'COMPLETED' && (
                                        renderSortableTh('srNo', 'IBS SR No', { minWidth: '120px' })
                                    )}
                                    {renderSortableTh('category', 'Category')}
                                    {renderSortableTh('callNumber', 'Call Number')}
                                    {renderSortableTh('caseNumber', 'Case Number')}
                                    {renderSortableTh('icNumber', 'Certificate (IC) No')}
                                    {renderSortableTh('callDate', activeTab === 'COMPLETED' ? 'Ack / IC Date' : 'Call Date')}
                                    {renderSortableTh('placeOfInspection', 'POI Code')}
                                    {renderSortableTh('ieEmployeeNumber', 'IE Emp No')}
                                    {renderSortableTh('quantityOffered', 'Offered')}
                                    {renderSortableTh('quantityPassed', 'Passed')}
                                    {renderSortableTh('quantityRejected', 'Rejected')}
                                    {renderSortableTh('status', activeTab === 'COMPLETED' ? 'IBS & Billing Status' : 'Status / Block')}
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCalls.map((call, idx) => {
                                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
                                    const category = getCallCategory(call.callNumber, call.icNumber, call.typeOfCall);
                                    const region = getRegionInfo(call.icNumber, call.caseNumber);
                                    const isBlocked = call.is_blocked === 1 || call.cancellation_charges > 0 || call.rejection_charges > 0;
                                    const isCompleted = activeTab === 'COMPLETED';

                                    return (
                                        <tr key={call.callNumber ? `${call.callNumber}-${idx}` : idx} className={isBlocked && !isCompleted ? 'row-blocked' : ''}>
                                            <td className="ibs-td-idx">{rowNum}</td>
                                            {isCompleted && (
                                                <td>
                                                    <div className="ibs-sr-cell">
                                                        <span className="ibs-sr-badge" title={`IBS Serial Number: ${call.srNo || 'N/A'}`}>
                                                            #{call.srNo || '-'}
                                                        </span>
                                                        {call.srNo && (
                                                            <button
                                                                type="button"
                                                                className="ibs-btn-copy"
                                                                title="Copy IBS SR Number"
                                                                onClick={() => handleCopy(call.srNo, `sr-${rowNum}`)}
                                                            >
                                                                {copiedField === `sr-${rowNum}` ? '✓' : '📋'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            <td>
                                                <span
                                                    className="ibs-category-tag"
                                                    style={{
                                                        color: category.color,
                                                        background: category.bg,
                                                        borderColor: category.border
                                                    }}
                                                    title={category.label}
                                                >
                                                    <span className="ibs-category-tag-icon">{category.icon}</span>
                                                    <span className="ibs-category-tag-code">{category.code}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <div className="ibs-call-no-cell">
                                                    <span className="ibs-call-no-text">{call.callNumber || '-'}</span>
                                                    <button
                                                        type="button"
                                                        className="ibs-btn-copy"
                                                        title="Copy Call Number"
                                                        onClick={() => handleCopy(call.callNumber, `call-${rowNum}`)}
                                                    >
                                                        {copiedField === `call-${rowNum}` ? '✓' : '📋'}
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="ibs-case-cell">
                                                    {region.code !== '-' && (
                                                        <span
                                                            className="ibs-region-badge"
                                                            style={{ color: region.color, background: region.bg, borderColor: region.color }}
                                                            title={`Region: ${region.name}`}
                                                        >
                                                            {region.code}
                                                        </span>
                                                    )}
                                                    <span className="ibs-case-text">{call.caseNumber || <em style={{ color: '#94a3b8' }}>None</em>}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="ibs-ic-no-text">{call.icNumber || '-'}</span>
                                            </td>
                                            <td className="ibs-date-cell">
                                                {isCompleted ? (
                                                    <>
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{call.acknowledgedAt || call.icDate || call.callDate || '-'}</div>
                                                        {call.icDate && call.acknowledgedAt && (
                                                             <small style={{ color: '#64748b' }}>IC: {call.icDate}</small>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>{call.callDate || '-'}</div>
                                                        {call.icDate && (
                                                            <small style={{ color: '#64748b' }}>IC: {call.icDate}</small>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                            <td>
                                                <span className="ibs-poi-badge" title={call.placeOfInspection}>
                                                    {call.placeOfInspection || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="ibs-ie-badge">{call.ieEmployeeNumber || '-'}</span>
                                            </td>
                                            <td className="ibs-qty-cell">{Number(call.quantityOffered || 0).toLocaleString('en-IN')}</td>
                                            <td className="ibs-qty-cell qty-passed">{Number(call.quantityPassed || 0).toLocaleString('en-IN')}</td>
                                            <td className="ibs-qty-cell qty-rejected">
                                                {call.quantityRejected > 0 ? (
                                                    <span className="qty-rejected-text">{Number(call.quantityRejected).toLocaleString('en-IN')}</span>
                                                ) : (
                                                    '0'
                                                )}
                                            </td>
                                            <td>
                                                {isCompleted ? (
                                                    <div className="ibs-status-stack">
                                                        <div className="ibs-reg-status-pill" title={`IBS Call Registration: ${call.ibsStatus || 'SUCCESS'}`}>
                                                            <span className="ibs-status-dot success"></span>
                                                            <span>IBS Synced</span>
                                                        </div>
                                                        {(() => {
                                                            const bInfo = getBillingDisplayInfo(call.billingStatus);
                                                            return (
                                                                <div
                                                                    className={`ibs-billing-status-pill ${bInfo.className}`}
                                                                    title={bInfo.tooltip}
                                                                >
                                                                    <span className="ibs-billing-icon">{bInfo.icon}</span>
                                                                    <span className="ibs-billing-caption">Billing:</span>
                                                                    <span className="ibs-billing-val">{bInfo.label}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    isBlocked ? (
                                                        <span className="ibs-badge-blocked" title={`Cancel: ₹${call.cancellation_charges || 0} | Rej: ₹${call.rejection_charges || 0}`}>
                                                            🚫 Blocked
                                                        </span>
                                                    ) : (
                                                        <span className="ibs-badge-active">Active</span>
                                                    )
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="ibs-action-cell">
                                                    {call.icFileLink && (
                                                        <a
                                                            href={call.icFileLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ibs-action-btn ibs-btn-pdf"
                                                            title="Open Inspection Certificate PDF"
                                                        >
                                                            📄 PDF
                                                        </a>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="ibs-action-btn ibs-btn-details"
                                                        onClick={() => setSelectedCall(call)}
                                                        title="View Call Details"
                                                    >
                                                        👁️ Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && filteredCalls.length > 0 && (
                    <div className="ibs-pagination">
                        <div className="ibs-page-info">
                            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredCalls.length} items)
                        </div>
                        <div className="ibs-pagination-controls">
                            <button
                                type="button"
                                className="ibs-page-nav-btn"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                title="First Page"
                            >
                                <span className="ibs-page-nav-icon">«</span>
                                <span className="ibs-page-nav-text">First</span>
                            </button>
                            <button
                                type="button"
                                className="ibs-page-nav-btn"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                title="Previous Page"
                            >
                                <span className="ibs-page-nav-icon">‹</span>
                                <span className="ibs-page-nav-text">Prev</span>
                            </button>

                            <div className="ibs-page-indicator-pill">
                                <span className="ibs-page-num-active">{currentPage}</span>
                                <span className="ibs-page-sep">/</span>
                                <span className="ibs-page-num-total">{totalPages}</span>
                            </div>

                            <button
                                type="button"
                                className="ibs-page-nav-btn"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                title="Next Page"
                            >
                                <span className="ibs-page-nav-text">Next</span>
                                <span className="ibs-page-nav-icon">›</span>
                            </button>
                            <button
                                type="button"
                                className="ibs-page-nav-btn"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                title="Last Page"
                            >
                                <span className="ibs-page-nav-text">Last</span>
                                <span className="ibs-page-nav-icon">»</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Call Detail Modal */}
            {selectedCall && (() => {
                const cat = getCallCategory(selectedCall.callNumber, selectedCall.icNumber, selectedCall.typeOfCall);
                const reg = getRegionInfo(selectedCall.icNumber, selectedCall.caseNumber);
                const hasIbsAck = Boolean(selectedCall.srNo || selectedCall.ibsStatus || activeTab === 'COMPLETED');

                return (
                    <div className="ibs-modal-overlay" onClick={() => setSelectedCall(null)}>
                        <div className="ibs-modal-dialog" onClick={(e) => e.stopPropagation()}>
                            <div className="ibs-modal-header">
                                <h3 className="ibs-modal-title">
                                    <span>📄</span> Call Details: {selectedCall.callNumber}
                                </h3>
                                <button
                                    type="button"
                                    className="ibs-modal-close"
                                    onClick={() => setSelectedCall(null)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="ibs-modal-body">
                                {/* IBS Acknowledgment Banner (if completed or has SR No) */}
                                {hasIbsAck && (
                                    <div className="ibs-modal-ack-banner">
                                        <div className="ibs-modal-ack-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="ibs-ack-badge">✓ IBS ACKNOWLEDGED</span>
                                                <span className="ibs-ack-sr">SR No: #{selectedCall.srNo || '-'}</span>
                                            </div>
                                            {(() => {
                                                const bInfo = getBillingDisplayInfo(selectedCall.billingStatus);
                                                return (
                                                    <span className={`ibs-billing-status-pill ${bInfo.className}`} title={bInfo.tooltip}>
                                                        <span>{bInfo.icon}</span>
                                                        <span className="ibs-billing-caption">Billing:</span>
                                                        <span className="ibs-billing-val">{bInfo.label}</span>
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="ibs-modal-ack-grid">
                                            <div>
                                                <small>IBS Call Registration</small>
                                                <strong style={{ color: '#059669' }}>{selectedCall.ibsStatus || 'SUCCESS'} (Acknowledged)</strong>
                                            </div>
                                            <div>
                                                <small>Billing Stage</small>
                                                <strong>{getBillingDisplayInfo(selectedCall.billingStatus).label}</strong>
                                            </div>
                                            <div>
                                                <small>Acknowledged Date/Time</small>
                                                <strong>{selectedCall.acknowledgedAt || '-'}</strong>
                                            </div>
                                            <div>
                                                <small>API Version</small>
                                                <strong>{selectedCall.version || '1.0'}</strong>
                                            </div>
                                            <div>
                                                <small>Response Reason / Notes</small>
                                                <span style={{ fontSize: '12px', color: '#475569' }}>{selectedCall.reason || 'None'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Category Banner */}
                                <div
                                    className="ibs-modal-category-banner"
                                    style={{
                                        background: cat.bg,
                                        border: `1.5px solid ${cat.border}`,
                                        color: cat.color
                                    }}
                                >
                                    <div className="ibs-modal-cat-left">
                                        <span style={{ fontSize: '26px' }}>{cat.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '16px' }}>
                                                {cat.label}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#475569' }}>
                                                Product: <strong>{cat.product}</strong> | Stage: <strong>{cat.stage}</strong> | Prefix: <strong>{cat.code}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    {reg.code !== '-' && (
                                        <div
                                            className="ibs-region-badge"
                                            style={{
                                                fontSize: '13px',
                                                padding: '4px 10px',
                                                color: reg.color,
                                                background: reg.bg,
                                                borderColor: reg.color
                                            }}
                                        >
                                            Region: {reg.name} ({reg.code})
                                        </div>
                                    )}
                                </div>

                                {/* Summary Grid */}
                                <div className="ibs-modal-grid">
                                    <div className="ibs-modal-field">
                                        <label>Call Number</label>
                                        <div className="ibs-modal-val bold">{selectedCall.callNumber || '-'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>Case Number (Resolved by RIO)</label>
                                        <div className="ibs-modal-val highlight">{selectedCall.caseNumber || 'N/A'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>Certificate (IC) Number</label>
                                        <div className="ibs-modal-val bold">{selectedCall.icNumber || '-'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>Call Date</label>
                                        <div className="ibs-modal-val">{selectedCall.callDate || '-'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>IC Issuance Date</label>
                                        <div className="ibs-modal-val">{selectedCall.icDate || '-'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>Place of Inspection (POI)</label>
                                        <div className="ibs-modal-val">{selectedCall.placeOfInspection || '-'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>IBS Manufacturer Code</label>
                                        <div className="ibs-modal-val">{selectedCall.ibsManufacturedCode || '-'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>IE Employee Number</label>
                                        <div className="ibs-modal-val">{selectedCall.ieEmployeeNumber || '-'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>Call Status</label>
                                        <div className="ibs-modal-val">{selectedCall.callStatus || '-'}</div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>Book / Set Number</label>
                                        <div className="ibs-modal-val">
                                            BK: {selectedCall.bkNumber || '-'} / Set: {selectedCall.setNumber || '-'}
                                        </div>
                                    </div>
                                    <div className="ibs-modal-field">
                                        <label>PO Item Serial Numbers</label>
                                        <div className="ibs-modal-val">
                                            {(selectedCall.poItemSerialNumbers || []).join(', ') || '-'}
                                        </div>
                                    </div>
                                </div>

                                {/* Quantities & Charges */}
                                <div className="ibs-modal-section-title">📦 Inspection Quantities & Charges</div>
                                <div className="ibs-modal-quantities">
                                    <div className="ibs-qty-box">
                                        <label>Quantity Offered</label>
                                        <span className="qty-val">{Number(selectedCall.quantityOffered || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="ibs-qty-box passed">
                                        <label>Quantity Passed</label>
                                        <span className="qty-val passed">{Number(selectedCall.quantityPassed || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="ibs-qty-box rejected">
                                        <label>Quantity Rejected</label>
                                        <span className="qty-val rejected">{Number(selectedCall.quantityRejected || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="ibs-qty-box">
                                        <label>Cancellation Charges</label>
                                        <span className="qty-val">₹{selectedCall.cancellation_charges || 0}</span>
                                    </div>
                                    <div className="ibs-qty-box">
                                        <label>Rejection Charges</label>
                                        <span className="qty-val">₹{selectedCall.rejection_charges || 0}</span>
                                    </div>
                                    <div className="ibs-qty-box">
                                        <label>Is Blocked</label>
                                        <span className={`qty-val ${selectedCall.is_blocked === 1 ? 'rejected' : 'passed'}`}>
                                            {selectedCall.is_blocked === 1 ? 'Yes (Blocked)' : 'No (Clear)'}
                                        </span>
                                    </div>
                                </div>

                                {/* Certificate PDF Link */}
                                {selectedCall.icFileLink && (
                                    <div className="ibs-modal-pdf-box">
                                        <div style={{ flex: 1 }}>
                                            <strong>Certificate PDF Document:</strong>
                                            <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>
                                                {selectedCall.icFileLink}
                                            </div>
                                        </div>
                                        <a
                                            href={selectedCall.icFileLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary"
                                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <span>📄</span> View Certificate PDF
                                        </a>
                                    </div>
                                )}

                                {/* Raw JSON viewer */}
                                <div className="ibs-modal-section-title" style={{ marginTop: '20px' }}>
                                    <span>🛠️ Raw IBS Payload Object</span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleCopy(JSON.stringify(selectedCall, null, 2), 'modal-json')}
                                    >
                                        {copiedField === 'modal-json' ? '✓ Copied' : '📋 Copy JSON'}
                                    </button>
                                </div>
                                <pre className="ibs-modal-json">
                                    {JSON.stringify(selectedCall, null, 2)}
                                </pre>
                            </div>
                            <div className="ibs-modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedCall(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
