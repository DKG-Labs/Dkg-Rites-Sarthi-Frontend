import React, { useState, useMemo, useEffect } from 'react';
import { ExportButton } from './SharedComponents';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PoIssuedModal.css'; // Reuses modal styles for consistency

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

const formatCallQty = (qty, stage, callNumber, railPadType) => {
    if (qty == null || qty === '' || qty === '-' || qty === 0 || qty === '0') return '-';
    const str = String(qty).trim();
    if (str.endsWith('MT') || str.endsWith('Nos') || str.endsWith('Nos.') || str.endsWith('Set')) return str;

    const upperCall = (callNumber || '').toUpperCase();
    if (upperCall.startsWith('RPP')) {
        return `${str} Nos`;
    }
    if (upperCall.startsWith('RPF')) {
        const isNcr = railPadType && railPadType.toUpperCase().includes('NCRGRSP');
        return `${str} ${isNcr ? 'Set' : 'Nos'}`;
    }

    const isRm = (stage && stage.toLowerCase().includes('rm')) ||
                 (callNumber && (callNumber.startsWith('ER') || callNumber.includes('ER-') || callNumber.includes('ER/')));
    return `${str} ${isRm ? 'MT' : 'Nos'}`;
};

const InspectionCallStatusModal = ({ isOpen, onClose, data, title, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState('all');

    // Reset filters whenever modal is opened or title changes
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedStage('all');
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

    // Filtered data
    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => {
            const matchesSearch = 
                   (item.inspectionCallNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (item.poSrNo || '').toLowerCase().includes(searchTerm.toLowerCase());
                   
            const matchesStage = selectedStage === 'all' || item.stageOfInspection === selectedStage;
            
            return matchesSearch && matchesStage;
        });
    }, [data, searchTerm, selectedStage]);

    if (!isOpen) return null;

    const exportColumns = [
        { label: 'Sl No.', key: 'slNo' },
        { label: 'Inspection Call Number', key: 'inspectionCallNumber' },
        { label: 'Vendor', key: 'vendor' },
        { label: 'Call Submission Date', key: 'callSubmissionDate' },
        { label: 'Stage of Inspection', key: 'stageOfInspection' },
        { label: 'Call QTY', key: 'callQty' },
        { label: 'PO Sr.No.', key: 'poSrNo' },
        { label: 'DP Date', key: 'dpDate' },
        { label: 'Status', key: 'status' }
    ];

    const exportData = filteredData.map((item, index) => ({
        ...item,
        slNo: index + 1,
        callSubmissionDate: formatCallSubmissionDate(item.callSubmissionDateTime),
        callQty: formatCallQty(item.callQty, item.stageOfInspection, item.inspectionCallNumber, item.railPadType),
        poSrNo: formatPoSrNo(item.poSrNo)
    }));

    const handlePdfExport = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text(`${title} - Call Details`, 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        
        const tableColumn = exportColumns.map(col => col.label);
        const tableRows = exportData.map(item => [
            item.slNo,
            item.inspectionCallNumber,
            item.vendor,
            item.callSubmissionDate || '-',
            item.stageOfInspection,
            item.callQty,
            item.poSrNo,
            item.dpDate || '-',
            (item.mainStatus && item.subStatus) ? `${item.mainStatus} - ${item.subStatus}` : (item.mainStatus || item.subStatus || '-')
        ]);
        
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 35 }
        });
        
        doc.save(`${title.replace(/\s+/g, '_')}_Calls.pdf`);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-large fade-in" style={{ maxWidth: '1100px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title} - Call Details</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button className="btn-export pdf" onClick={handlePdfExport} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: isLoading ? 0.6 : 1 }}>
                            <i className="fa-solid fa-file-pdf"></i> PDF
                        </button>
                        <ExportButton 
                            data={exportData} 
                            columns={exportColumns} 
                            filename={`${title.replace(/\s+/g, '_')}_Calls.xlsx`}
                            disabled={isLoading}
                        />
                        <button className="btn-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                    </div>
                </div>

                <div className="modal-filters">
                    <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input
                            type="text"
                            placeholder="Search calls, vendors, POs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isLoading}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                className="search-clear-btn"
                                onClick={() => setSearchTerm('')}
                                title="Clear search"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
                    </div>
                    {availableStages.length > 1 && (
                        <div className="filter-group">
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="modal-select"
                                disabled={isLoading}
                            >
                                <option value="all">All Stages</option>
                                {availableStages.map((stage) => (
                                    <option key={stage} value={stage}>{stage}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="modal-table-container">
                    <table className="modal-table">
                        <thead>
                            <tr>
                                <th>Sl No.</th>
                                <th>Inspection Call Number</th>
                                <th>Vendor</th>
                                <th>Call Submission Date</th>
                                <th>Stage of Inspection</th>
                                <th>Call QTY</th>
                                <th>PO Sr.No.</th>
                                <th>DP Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                // Render 5 skeleton rows
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="skeleton-row">
                                        <td><div className="skeleton-cell" style={{ width: '20px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '120px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '150px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '80px', borderRadius: '12px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '70px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                                        <td><div className="skeleton-cell" style={{ width: '180px' }}></div></td>
                                    </tr>
                                ))
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td style={{ fontWeight: '700', color: '#1e293b' }}>{item.inspectionCallNumber}</td>
                                        <td>{item.vendor}</td>
                                        <td>{formatCallSubmissionDate(item.callSubmissionDateTime)}</td>
                                        <td>
                                            <span className="prof-badge" style={{
                                                background: item.stageOfInspection === 'RM Stage' ? '#eff6ff' : item.stageOfInspection === 'Process Stage' ? '#fff7ed' : '#fef2f2',
                                                color: item.stageOfInspection === 'RM Stage' ? '#2563eb' : item.stageOfInspection === 'Process Stage' ? '#d97706' : '#dc2626',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '2px 8px',
                                                borderRadius: '12px'
                                            }}>
                                                {item.stageOfInspection}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {formatCallQty(item.callQty, item.stageOfInspection, item.inspectionCallNumber, item.railPadType)}
                                        </td>
                                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{formatPoSrNo(item.poSrNo)}</td>
                                        <td>{item.dpDate || '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    color: item.mainStatus === 'Under Inspection' ? '#d97706' : '#dc2626',
                                                    fontWeight: '800',
                                                    fontSize: '12px'
                                                }}>
                                                    &#9679; {item.mainStatus || ''}
                                                </span>
                                                {item.mainStatus && item.subStatus && (
                                                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>-</span>
                                                )}
                                                <span style={{
                                                    color: '#475569',
                                                    fontWeight: '600',
                                                    fontSize: '12px'
                                                }}>
                                                    {item.subStatus || ''}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="text-center">No active calls found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="modal-footer">
                    <span>Total Records: {filteredData.length}</span>
                    <button className="btn-close-modal" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default InspectionCallStatusModal;
