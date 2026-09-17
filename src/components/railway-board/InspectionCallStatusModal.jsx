import React, { useState, useMemo, useEffect } from 'react';
import { ExportButton, downloadExcel } from './SharedComponents';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './InspectionCallStatusModal.css';

const formatPoSrNo = (value) => {
    if (!value || value === '-') return '-';
    const parts = value.split('/').map(p => p.trim()).filter(Boolean);
    
    // Remove 'N/A' or 'null' prefix if more specific parts exist
    const filtered = parts.filter((p, idx) => !(idx === 0 && (p === 'N/A' || p === 'null') && parts.length > 1));
    
    // Deduplicate identical parts while preserving order
    const seen = new Set();
    const result = [];
    for (const p of filtered) {
        if (!seen.has(p)) {
            seen.add(p);
            result.push(p);
        }
    }
    
    return result.length > 0 ? result.join('/') : '-';
};

const formatCallSubmissionDate = (dt) => {
    if (!dt || dt === '-' || dt === 'N/A') return '-';
    const str = String(dt).trim();
    const datePart = str.split(' ')[0].split('T')[0];
    return datePart || str;
};

const parseQtyAndUnit = (qty, stage, callNumber, railPadType) => {
    if (qty == null || qty === '' || qty === '-' || qty === 0 || qty === '0') return { value: 0, unit: 'Nos' };
    const str = String(qty).trim();
    
    let unit = 'Nos';
    let numStr = str;
    
    if (/MT/i.test(str)) {
        unit = 'MT';
        numStr = str.replace(/MT/gi, '').trim();
    } else if (/Set/i.test(str)) {
        unit = 'Set';
        numStr = str.replace(/Sets?/gi, '').trim();
    } else if (/Nos/i.test(str)) {
        unit = 'Nos';
        numStr = str.replace(/Nos\.?/gi, '').trim();
    } else {
        const upperCall = (callNumber || '').toUpperCase();
        if (upperCall.startsWith('RPP')) {
            unit = 'Nos';
        } else if (upperCall.startsWith('RPF')) {
            const isNcr = railPadType && railPadType.toUpperCase().includes('NCRGRSP');
            unit = isNcr ? 'Set' : 'Nos';
        } else {
            const isRm = (stage && stage.toLowerCase().includes('rm')) ||
                         (callNumber && (callNumber.startsWith('ER') || callNumber.includes('ER-') || callNumber.includes('ER/')));
            unit = isRm ? 'MT' : 'Nos';
        }
    }
    
    const cleanNum = parseFloat(numStr.replace(/,/g, ''));
    return {
        value: isNaN(cleanNum) ? 0 : cleanNum,
        unit: unit
    };
};

const formatCallQty = (qty, stage, callNumber, railPadType) => {
    if (qty == null || qty === '' || qty === '-' || qty === 0 || qty === '0') return '-';
    const str = String(qty).trim();
    if (str.endsWith('MT') || str.endsWith('Nos') || str.endsWith('Nos.') || str.endsWith('Set')) return str;

    const { value, unit } = parseQtyAndUnit(qty, stage, callNumber, railPadType);
    if (value === 0) return '-';
    
    if (unit === 'MT') {
        return `${Number(value.toFixed(3))} MT`;
    }
    return `${value.toLocaleString('en-IN')} ${unit}`;
};

const formatIeDetails = (ieName, ieContactNo) => {
    if (!ieName || ieName === '-' || ieName === 'N/A' || ieName.toLowerCase() === 'not assigned') {
        return { name: 'Not Assigned', contact: '' };
    }
    return { name: ieName, contact: ieContactNo || '' };
};

const splitVendorName = (fullName) => {
    if (!fullName) return { name: 'Unknown Vendor', location: '' };
    const parts = fullName.split('-');
    if (parts.length > 1) {
        const location = parts.pop().trim();
        const name = parts.join('-').trim();
        return { name: name || fullName, location };
    }
    return { name: fullName, location: '' };
};

const getStageClass = (stage) => {
    const s = (stage || '').toLowerCase();
    if (s.includes('rm') || s.includes('raw')) return 'rm';
    if (s.includes('process')) return 'process';
    if (s.includes('final')) return 'final';
    return 'other';
};

const getStatusDotClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('under') || s.includes('sched')) return 'under-inspection';
    if (s.includes('pend') || s.includes('rais') || s.includes('regist')) return 'pending';
    if (s.includes('accept') || s.includes('pass') || s.includes('complete') || s.includes('issue')) return 'completed';
    if (s.includes('reject')) return 'rejected';
    return 'under-inspection';
};

const InspectionCallStatusModal = ({ isOpen, onClose, data, title, isLoading }) => {
    const [viewMode, setViewMode] = useState('summary'); // Default to modern Summarized View!
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState('all');
    const [expandedVendors, setExpandedVendors] = useState({});

    // Reset filters whenever modal is opened or title changes
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedStage('all');
            setExpandedVendors({});
        }
    }, [isOpen, title]);

    // Available stages dynamically derived from actual data
    const availableStages = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Array.from(new Set(data.map(item => item.stageOfInspection).filter(Boolean)));
    }, [data]);

    // If current selectedStage does not exist in availableStages, auto-reset to 'all'
    useEffect(() => {
        if (selectedStage !== 'all' && availableStages.length > 0 && !availableStages.includes(selectedStage)) {
            setSelectedStage('all');
        }
    }, [availableStages, selectedStage]);

    // Filtered data (List level)
    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => {
            const matchesSearch = 
                   (item.inspectionCallNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (item.poSrNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (item.ieName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (item.ieContactNo || '').toLowerCase().includes(searchTerm.toLowerCase());
                   
            const matchesStage = selectedStage === 'all' || item.stageOfInspection === selectedStage;
            
            return matchesSearch && matchesStage;
        });
    }, [data, searchTerm, selectedStage]);

    // Vendor-wise Summarized Data
    const vendorSummaryData = useMemo(() => {
        const map = new Map();

        filteredData.forEach(item => {
            const vendorKey = (item.vendor && item.vendor.trim()) ? item.vendor.trim() : 'Unknown Vendor';
            if (!map.has(vendorKey)) {
                map.set(vendorKey, {
                    vendor: vendorKey,
                    totalCalls: 0,
                    qtyNos: 0,
                    qtyMt: 0,
                    qtySet: 0,
                    stages: {},
                    statuses: {},
                    calls: []
                });
            }
            
            const group = map.get(vendorKey);
            group.totalCalls += 1;
            group.calls.push(item);
            
            // Stage breakdown
            const stage = item.stageOfInspection || 'Other';
            group.stages[stage] = (group.stages[stage] || 0) + 1;
            
            // Status breakdown
            const st = (item.mainStatus && item.subStatus) 
                ? `${item.mainStatus} - ${item.subStatus}` 
                : (item.mainStatus || item.status || 'Active');
            group.statuses[st] = (group.statuses[st] || 0) + 1;
            
            // Quantity breakdown
            const { value, unit } = parseQtyAndUnit(item.callQty, item.stageOfInspection, item.inspectionCallNumber, item.railPadType);
            if (unit === 'MT') {
                group.qtyMt += value;
            } else if (unit === 'Set') {
                group.qtySet += value;
            } else {
                group.qtyNos += value;
            }
        });

        return Array.from(map.values()).map((v, idx) => {
            const qtyParts = [];
            if (v.qtyNos > 0) qtyParts.push(`${v.qtyNos.toLocaleString('en-IN')} Nos`);
            if (v.qtyMt > 0) qtyParts.push(`${Number(v.qtyMt.toFixed(3))} MT`);
            if (v.qtySet > 0) qtyParts.push(`${v.qtySet.toLocaleString('en-IN')} Set`);
            
            const stageSummaryText = Object.entries(v.stages).map(([stg, count]) => `${stg}: ${count}`).join(' | ');
            const statusSummaryText = Object.entries(v.statuses).map(([st, count]) => `${st}: ${count}`).join(' | ');

            return {
                ...v,
                slNo: idx + 1,
                totalQtyFormatted: qtyParts.length > 0 ? qtyParts.join(' | ') : '-',
                stageBreakdownText: stageSummaryText || '-',
                statusBreakdownText: statusSummaryText || '-'
            };
        });
    }, [filteredData]);

    // Grand totals across all vendors
    const grandTotals = useMemo(() => {
        let totalNos = 0;
        let totalMt = 0;
        let totalSet = 0;

        vendorSummaryData.forEach(v => {
            totalNos += v.qtyNos;
            totalMt += v.qtyMt;
            totalSet += v.qtySet;
        });

        const parts = [];
        if (totalNos > 0) parts.push(`${totalNos.toLocaleString('en-IN')} Nos`);
        if (totalMt > 0) parts.push(`${Number(totalMt.toFixed(3))} MT`);
        if (totalSet > 0) parts.push(`${totalSet.toLocaleString('en-IN')} Set`);

        return {
            totalCalls: filteredData.length,
            totalVendors: vendorSummaryData.length,
            totalQtyFormatted: parts.length > 0 ? parts.join(' | ') : '0'
        };
    }, [filteredData.length, vendorSummaryData]);

    // Toggle single vendor expansion
    const toggleVendor = (vendorName) => {
        setExpandedVendors(prev => ({
            ...prev,
            [vendorName]: !prev[vendorName]
        }));
    };

    // Toggle expand/collapse all vendors
    const toggleExpandAll = () => {
        const isAllExpanded = vendorSummaryData.length > 0 && 
            vendorSummaryData.every(v => !!expandedVendors[v.vendor]);
            
        if (isAllExpanded) {
            setExpandedVendors({});
        } else {
            const allExpanded = {};
            vendorSummaryData.forEach(v => { allExpanded[v.vendor] = true; });
            setExpandedVendors(allExpanded);
        }
    };

    if (!isOpen) return null;

    // Export configurations
    const listExportColumns = [
        { label: 'Sl No.', key: 'slNo' },
        { label: 'Inspection Call Number', key: 'inspectionCallNumber' },
        { label: 'Vendor', key: 'vendor' },
        { label: 'Call Submission Date', key: 'callSubmissionDate' },
        { label: 'Stage of Inspection', key: 'stageOfInspection' },
        { label: 'Call QTY', key: 'callQty' },
        { label: 'PO Sr.No.', key: 'poSrNo' },
        { label: 'DP Date', key: 'dpDate' },
        { label: 'Name of IE & Number', key: 'ieNameAndNumber' },
        { label: 'Status', key: 'status' }
    ];

    const listExportData = filteredData.map((item, index) => {
        const { name, contact } = formatIeDetails(item.ieName, item.ieContactNo);
        const ieDisplay = name === 'Not Assigned' ? 'Not Assigned' : (contact ? `${name} (${contact})` : name);
        return {
            ...item,
            slNo: index + 1,
            callSubmissionDate: formatCallSubmissionDate(item.callSubmissionDateTime),
            callQty: formatCallQty(item.callQty, item.stageOfInspection, item.inspectionCallNumber, item.railPadType),
            poSrNo: formatPoSrNo(item.poSrNo),
            ieNameAndNumber: ieDisplay,
            status: (item.mainStatus && item.subStatus) ? `${item.mainStatus} - ${item.subStatus}` : (item.mainStatus || item.status || '-')
        };
    });

    const summaryExportColumns = [
        { label: 'Sl No.', key: 'slNo' },
        { label: 'Vendor Name', key: 'vendor' },
        { label: 'Total Calls', key: 'totalCalls' },
        { label: 'Total Call QTY', key: 'totalQtyFormatted' },
        { label: 'Stage Breakdown', key: 'stageBreakdownText' },
        { label: 'Status Breakdown', key: 'statusBreakdownText' }
    ];

    const summaryExportData = vendorSummaryData.map((item, index) => ({
        slNo: index + 1,
        vendor: item.vendor,
        totalCalls: item.totalCalls,
        totalQtyFormatted: item.totalQtyFormatted,
        stageBreakdownText: item.stageBreakdownText,
        statusBreakdownText: item.statusBreakdownText
    }));

    const activeExportColumns = viewMode === 'list' ? listExportColumns : summaryExportColumns;
    const activeExportData = viewMode === 'list' ? listExportData : summaryExportData;
    const exportFileName = `${title.replace(/\s+/g, '_')}_${viewMode === 'list' ? 'Calls_List' : 'Vendor_Summary'}`;

    const handlePdfExport = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(16);
        doc.text(`${title} - ${viewMode === 'list' ? 'Call Details (List View)' : 'Summarized View (Vendor-wise)'}`, 14, 18);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Total Calls: ${filteredData.length} | Total Vendors: ${vendorSummaryData.length}`, 14, 26);
        
        if (viewMode === 'list') {
            const tableColumn = listExportColumns.map(col => col.label);
            const tableRows = listExportData.map(item => [
                item.slNo,
                item.inspectionCallNumber,
                item.vendor,
                item.callSubmissionDate || '-',
                item.stageOfInspection,
                item.callQty,
                item.poSrNo,
                item.dpDate || '-',
                item.ieNameAndNumber || '-',
                item.status
            ]);
            
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 32,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 32 }
            });
        } else {
            const tableColumn = summaryExportColumns.map(col => col.label);
            const tableRows = summaryExportData.map(item => [
                item.slNo,
                item.vendor,
                item.totalCalls,
                item.totalQtyFormatted,
                item.stageBreakdownText,
                item.statusBreakdownText
            ]);
            
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 32,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 32 }
            });
        }
        
        doc.save(`${exportFileName}.pdf`);
    };

    const handleExcelExport = () => {
        downloadExcel(
            activeExportData, 
            activeExportColumns, 
            exportFileName, 
            `${title} - ${viewMode === 'list' ? 'Call Details (List View)' : 'Summarized View (Vendor-wise)'}`
        );
    };

    const isAllExpanded = vendorSummaryData.length > 0 && 
        vendorSummaryData.every(v => !!expandedVendors[v.vendor]);

    return (
        <div className="ic-modal-overlay" onClick={onClose}>
            <div className="ic-modal-container" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="ic-modal-header">
                    <div className="ic-title-group">
                        <div className="ic-title-icon">
                            <i className="fa-solid fa-layer-group"></i>
                        </div>
                        <div className="ic-title-text">
                            <h2>{title}</h2>
                            <p>Inspection Calls Status & Real-time Distribution Breakdown</p>
                        </div>

                        {/* Modern Segmented Switch */}
                        <div className="ic-view-switch">
                            <button
                                type="button"
                                onClick={() => setViewMode('summary')}
                                className={`ic-view-btn ${viewMode === 'summary' ? 'active' : ''}`}
                            >
                                <i className="fa-solid fa-chart-pie"></i>
                                <span>Summarized View</span>
                                <span className="ic-count-chip">{vendorSummaryData.length} Vendors</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`ic-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            >
                                <i className="fa-solid fa-table-list"></i>
                                <span>List View</span>
                                <span className="ic-count-chip">{filteredData.length} Calls</span>
                            </button>
                        </div>
                    </div>

                    {/* Actions & Export */}
                    <div className="ic-header-actions">
                        <button 
                            className="ic-btn-pdf" 
                            onClick={handlePdfExport} 
                            disabled={isLoading || activeExportData.length === 0}
                        >
                            <i className="fa-solid fa-file-pdf"></i> PDF
                        </button>
                        <ExportButton 
                            onClick={handleExcelExport}
                            disabled={isLoading || activeExportData.length === 0}
                            label="Export Excel"
                        />
                        <button className="ic-btn-close" onClick={onClose} title="Close Modal">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                {/* Top KPI Metric Banner */}
                <div className="ic-kpi-banner">
                    <div className="ic-kpi-card">
                        <div className="ic-kpi-icon-wrap" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            <i className="fa-solid fa-building"></i>
                        </div>
                        <div className="ic-kpi-info">
                            <div className="kpi-label">Active Vendors</div>
                            <div className="kpi-value">{grandTotals.totalVendors}</div>
                        </div>
                    </div>

                    <div className="ic-kpi-card">
                        <div className="ic-kpi-icon-wrap" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                            <i className="fa-solid fa-clipboard-check"></i>
                        </div>
                        <div className="ic-kpi-info">
                            <div className="kpi-label">Total Calls Recorded</div>
                            <div className="kpi-value">{grandTotals.totalCalls}</div>
                        </div>
                    </div>

                    <div className="ic-kpi-card" style={{ flex: 1.5 }}>
                        <div className="ic-kpi-icon-wrap" style={{ background: '#dcfce7', color: '#15803d' }}>
                            <i className="fa-solid fa-cubes"></i>
                        </div>
                        <div className="ic-kpi-info">
                            <div className="kpi-label">Aggregate Call Quantity</div>
                            <div className="kpi-value" style={{ color: '#047857' }}>
                                {grandTotals.totalQtyFormatted}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Control & Filter Strip */}
                <div className="ic-controls-strip">
                    <div className="ic-search-wrap">
                        <i className="fa-solid fa-magnifying-glass search-icon"></i>
                        <input
                            type="text"
                            className="ic-search-input"
                            placeholder="Search calls, vendors, POs, IE..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isLoading}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                className="ic-search-clear"
                                onClick={() => setSearchTerm('')}
                                title="Clear search"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {availableStages.length > 1 && (
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="ic-filter-select"
                                disabled={isLoading}
                            >
                                <option value="all">All Stages ({data?.length || 0})</option>
                                {availableStages.map((stage) => {
                                    const count = (data || []).filter(d => d.stageOfInspection === stage).length;
                                    return (
                                        <option key={stage} value={stage}>{stage} ({count})</option>
                                    );
                                })}
                            </select>
                        )}

                        {viewMode === 'summary' && vendorSummaryData.length > 0 && (
                            <button
                                type="button"
                                onClick={toggleExpandAll}
                                className="ic-toggle-expand-btn"
                            >
                                <i className={`fa-solid ${isAllExpanded ? 'fa-compress' : 'fa-expand'}`}></i>
                                {isAllExpanded ? 'Collapse All' : 'Expand All Calls'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="ic-scroll-area">
                    {viewMode === 'summary' ? (
                        /* ================== SUMMARIZED VIEW (VENDOR CARDS) ================== */
                        <div className="ic-vendor-grid">
                            {isLoading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="ic-vendor-card" style={{ padding: '20px' }}>
                                        <div className="skeleton-cell" style={{ width: '40%', height: '20px', marginBottom: '10px' }}></div>
                                        <div className="skeleton-cell" style={{ width: '80%', height: '14px' }}></div>
                                    </div>
                                ))
                            ) : vendorSummaryData.length > 0 ? (
                                vendorSummaryData.map((vGroup) => {
                                    const isExpanded = !!expandedVendors[vGroup.vendor];
                                    const { name: vendorName, location: vendorLocation } = splitVendorName(vGroup.vendor);

                                    return (
                                        <div key={vGroup.vendor} className={`ic-vendor-card ${isExpanded ? 'expanded' : ''}`}>
                                            <div 
                                                className="ic-vendor-card-header"
                                                onClick={() => toggleVendor(vGroup.vendor)}
                                            >
                                                {/* Vendor Info */}
                                                <div className="ic-vendor-main-col">
                                                    <div className="ic-vendor-avatar">
                                                        <i className="fa-solid fa-building"></i>
                                                    </div>
                                                    <div>
                                                        <div className="ic-vendor-name-title">
                                                            {vendorName}
                                                        </div>
                                                        <div className="ic-vendor-meta">
                                                            {vendorLocation && (
                                                                <span style={{
                                                                    background: '#f1f5f9',
                                                                    color: '#475569',
                                                                    padding: '1px 6px',
                                                                    borderRadius: '4px',
                                                                    fontWeight: '700',
                                                                    fontSize: '10px'
                                                                }}>
                                                                    📍 {vendorLocation}
                                                                </span>
                                                            )}
                                                            <span>• {vGroup.totalCalls} {vGroup.totalCalls === 1 ? 'call' : 'calls'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Total Calls */}
                                                <div className="ic-vendor-calls-col">
                                                    <div className="ic-calls-badge">
                                                        {vGroup.totalCalls}
                                                    </div>
                                                    <div className="ic-calls-label">Calls</div>
                                                </div>

                                                {/* Total Call QTY */}
                                                <div className="ic-vendor-qty-col">
                                                    <div className="ic-qty-tag">
                                                        {vGroup.totalQtyFormatted}
                                                    </div>
                                                </div>

                                                {/* Stage Breakdown */}
                                                <div className="ic-vendor-stage-col">
                                                    {Object.entries(vGroup.stages).map(([stageName, count]) => (
                                                        <span key={stageName} className={`ic-stage-pill ${getStageClass(stageName)}`}>
                                                            <span>{stageName}</span>
                                                            <b>{count}</b>
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Status Breakdown */}
                                                <div className="ic-vendor-status-col">
                                                    {Object.entries(vGroup.statuses).map(([statusName, count]) => (
                                                        <span key={statusName} className="ic-status-pill">
                                                            <span className={`ic-status-dot ${getStatusDotClass(statusName)}`}></span>
                                                            <span>{statusName}</span>
                                                            <b>{count}</b>
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Action Button */}
                                                <div className="ic-vendor-action-col" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        className="ic-view-calls-action-btn"
                                                        onClick={() => toggleVendor(vGroup.vendor)}
                                                    >
                                                        <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-list-check'}`}></i>
                                                        <span>{isExpanded ? 'Hide' : 'View Calls'}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Detailed Calls Section */}
                                            {isExpanded && (
                                                <div className="ic-expanded-section">
                                                    <div className="ic-inner-table-wrap">
                                                        <div className="ic-inner-table-header">
                                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <i className="fa-solid fa-list-check" style={{ color: '#2563eb' }}></i>
                                                                Inspection Calls for {vGroup.vendor}
                                                            </span>
                                                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#047857' }}>
                                                                Total QTY: {vGroup.totalQtyFormatted}
                                                            </span>
                                                        </div>

                                                        <table className="ic-inner-table">
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ width: '40px' }}>#</th>
                                                                    <th>Call Number</th>
                                                                    <th>Submission Date</th>
                                                                    <th>Stage</th>
                                                                    <th>Call QTY</th>
                                                                    <th>PO Sr.No.</th>
                                                                    <th>DP Date</th>
                                                                    <th>Name of IE & Phone</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {vGroup.calls.map((c, cIdx) => {
                                                                    const { name, contact } = formatIeDetails(c.ieName, c.ieContactNo);
                                                                    return (
                                                                        <tr key={cIdx}>
                                                                            <td style={{ color: '#94a3b8', fontWeight: '600' }}>{cIdx + 1}</td>
                                                                            <td style={{ fontWeight: '800', color: '#0f172a' }}>
                                                                                {c.inspectionCallNumber}
                                                                            </td>
                                                                            <td>{formatCallSubmissionDate(c.callSubmissionDateTime)}</td>
                                                                            <td>
                                                                                <span className={`ic-stage-pill ${getStageClass(c.stageOfInspection)}`} style={{ fontSize: '10px', padding: '2px 7px' }}>
                                                                                    {c.stageOfInspection}
                                                                                </span>
                                                                            </td>
                                                                            <td style={{ fontWeight: '800', color: '#0f172a' }}>
                                                                                {formatCallQty(c.callQty, c.stageOfInspection, c.inspectionCallNumber, c.railPadType)}
                                                                            </td>
                                                                            <td style={{ fontFamily: 'monospace', color: '#475569', fontSize: '11px' }}>
                                                                                {formatPoSrNo(c.poSrNo)}
                                                                            </td>
                                                                            <td>{c.dpDate || '-'}</td>
                                                                            <td>
                                                                                {name === 'Not Assigned' ? (
                                                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not Assigned</span>
                                                                                ) : (
                                                                                    <div>
                                                                                        <span style={{ fontWeight: '700', color: '#1e293b' }}>{name}</span>
                                                                                        {contact && (
                                                                                            <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '6px' }}>
                                                                                                📞 {contact}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            <td>
                                                                                <span className="ic-status-pill" style={{ fontSize: '10px', padding: '2px 7px' }}>
                                                                                    <span className={`ic-status-dot ${getStatusDotClass(c.mainStatus || c.status)}`}></span>
                                                                                    <span>{c.mainStatus || ''} {c.subStatus ? `- ${c.subStatus}` : ''}</span>
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                    <i className="fa-solid fa-folder-open" style={{ fontSize: '36px', color: '#94a3b8', marginBottom: '12px' }}></i>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#475569' }}>No vendor summary records found</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Try clearing filters or search query</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ================== LIST VIEW (MODERN TABLE) ================== */
                        <div className="ic-modern-table-wrap">
                            <table className="ic-modern-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '45px' }}>#</th>
                                        <th>Call Number</th>
                                        <th>Vendor</th>
                                        <th>Submission Date</th>
                                        <th>Stage</th>
                                        <th>Call QTY</th>
                                        <th>PO Sr.No.</th>
                                        <th>DP Date</th>
                                        <th>Name of IE & Phone</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        [...Array(6)].map((_, i) => (
                                            <tr key={i} className="skeleton-row">
                                                <td><div className="skeleton-cell" style={{ width: '20px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '120px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '150px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '90px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '80px', borderRadius: '12px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '70px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '120px' }}></div></td>
                                                <td><div className="skeleton-cell" style={{ width: '150px' }}></div></td>
                                            </tr>
                                        ))
                                    ) : filteredData.length > 0 ? (
                                        filteredData.map((item, index) => {
                                            const { name, contact } = formatIeDetails(item.ieName, item.ieContactNo);
                                            const { name: vendorName, location: vendorLocation } = splitVendorName(item.vendor);

                                            return (
                                                <tr key={index}>
                                                    <td style={{ color: '#94a3b8', fontWeight: '600' }}>{index + 1}</td>
                                                    <td style={{ fontWeight: '800', color: '#0f172a' }}>
                                                        {item.inspectionCallNumber}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{vendorName}</div>
                                                        {vendorLocation && (
                                                            <div style={{ fontSize: '10px', color: '#64748b' }}>📍 {vendorLocation}</div>
                                                        )}
                                                    </td>
                                                    <td>{formatCallSubmissionDate(item.callSubmissionDateTime)}</td>
                                                    <td>
                                                        <span className={`ic-stage-pill ${getStageClass(item.stageOfInspection)}`}>
                                                            {item.stageOfInspection}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: '800', color: '#0f172a' }}>
                                                        {formatCallQty(item.callQty, item.stageOfInspection, item.inspectionCallNumber, item.railPadType)}
                                                    </td>
                                                    <td style={{ fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>
                                                        {formatPoSrNo(item.poSrNo)}
                                                    </td>
                                                    <td>{item.dpDate || '-'}</td>
                                                    <td>
                                                        {name === 'Not Assigned' ? (
                                                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not Assigned</span>
                                                        ) : (
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{name}</div>
                                                                {contact && (
                                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {contact}</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="ic-status-pill">
                                                            <span className={`ic-status-dot ${getStatusDotClass(item.mainStatus || item.status)}`}></span>
                                                            <span>{item.mainStatus || ''} {item.subStatus ? `- ${item.subStatus}` : ''}</span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="text-center" style={{ padding: '48px', color: '#94a3b8' }}>
                                                <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></i>
                                                No active inspection calls found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modern Footer */}
                <div className="ic-modal-footer">
                    <div className="ic-footer-meta">
                        Showing <b>{viewMode === 'summary' ? vendorSummaryData.length : filteredData.length}</b> {viewMode === 'summary' ? 'vendors' : 'calls'} • Synced with Railway Board Real-time Service
                    </div>
                    <button className="ic-btn-footer-close" onClick={onClose}>
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};

export default InspectionCallStatusModal;
