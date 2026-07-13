import React, { useState, useMemo } from 'react';
import { ExportButton } from './SharedComponents';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PoIssuedModal.css'; // Reuses modal styles for consistency

const formatPoSrNo = (value) => {
    if (!value) return '-';
    const parts = value.split('/');
    // If format is Zone/PO/PO/Serial (4 parts with duplicate middle), collapse to Zone/PO/Serial
    if (parts.length === 4 && parts[1] === parts[2]) {
        return `${parts[0]}/${parts[1]}/${parts[3]}`;
    }
    return value;
};

const InspectionCallStatusModal = ({ isOpen, onClose, data, title, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState('all');

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
        { label: 'Call Submission Date & Time', key: 'callSubmissionDateTime' },
        { label: 'Stage of Inspection', key: 'stageOfInspection' },
        { label: 'PO Sr.No.', key: 'poSrNo' },
        { label: 'DP Date', key: 'dpDate' },
        { label: 'Status', key: 'status' }
    ];

    const exportData = filteredData.map((item, index) => ({
        ...item,
        slNo: index + 1,
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
            item.callSubmissionDateTime || '-',
            item.stageOfInspection,
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
                    </div>
                    <div className="filter-group">
                        <select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            className="modal-select"
                            disabled={isLoading}
                        >
                            <option value="all">All Stages</option>
                            <option value="RM Stage">RM Stage</option>
                            <option value="Process Stage">Process Stage</option>
                            <option value="Final Stage">Final Stage</option>
                        </select>
                    </div>
                </div>

                <div className="modal-table-container">
                    <table className="modal-table">
                        <thead>
                            <tr>
                                <th>Sl No.</th>
                                <th>Inspection Call Number</th>
                                <th>Vendor</th>
                                <th>Call Submission Date &amp; Time</th>
                                <th>Stage of Inspection</th>
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
                                        <td>{item.callSubmissionDateTime || '-'}</td>
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
                                    <td colSpan="8" className="text-center">No active calls found</td>
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
