import React, { useState, useMemo } from 'react';
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-large fade-in" style={{ maxWidth: '1100px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title} - Call Details</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
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
