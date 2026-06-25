import React, { useState, useMemo } from 'react';
import { ExportButton, downloadExcel } from './SharedComponents';
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

const InspectionCallStatusModal = ({ isOpen, onClose, data, title }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedStage, setSelectedStage] = useState('all');

    // Filtered data
    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => {
            const matchesSearch =
                (item.inspectionCallNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.poSrNo || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
            const matchesStage = selectedStage === 'all' || item.stageOfInspection === selectedStage;

            return matchesSearch && matchesStatus && matchesStage;
        });
    }, [data, searchTerm, selectedStatus, selectedStage]);

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
            item.status
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
                        <button className="btn-export pdf" onClick={handlePdfExport} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <i className="fa-solid fa-file-pdf"></i> PDF
                        </button>
                        <ExportButton 
                            onClick={() => downloadExcel(exportData, exportColumns, `${title.replace(/\s+/g, '_')}_Calls`)} 
                        />
                        <button className="close-btn" onClick={onClose} style={{ marginLeft: '10px' }}>&times;</button>
                    </div>
                </div>

                <div className="modal-filters">
                    <div className="filter-group">
                        <label>Search</label>
                        <input
                            type="text"
                            placeholder="Search Call No, Vendor, PO..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="modal-search-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label>Status Filter</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="modal-select"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Under Inspection">Under Inspection</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Stage Filter</label>
                        <select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            className="modal-select"
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
                            {filteredData.length > 0 ? (
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
                                            <span style={{
                                                color: item.status === 'Under Inspection' ? '#d97706' : '#dc2626',
                                                fontWeight: '800',
                                                fontSize: '12px'
                                            }}>
                                                &#9679; {item.status}
                                            </span>
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
