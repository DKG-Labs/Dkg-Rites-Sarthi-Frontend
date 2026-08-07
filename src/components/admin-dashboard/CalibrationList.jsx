import React, { useState, useMemo } from 'react';
import { mockCalibrations } from './utils/mockData';
import { filterBySearch, paginate } from './utils/helpers';
import { DEFAULT_PAGE_SIZE } from './utils/constants';

export const CalibrationList = ({ onEdit, onDelete, onCreateNew, onUploadCertificate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);

    const statuses = ['Valid', 'Expired', 'Pending'];

    const filteredCalibrations = useMemo(() => {
        let result = mockCalibrations;

        if (searchTerm) {
            result = filterBySearch(result, searchTerm, ['productName', 'instrumentCode', 'vendor']);
        }

        if (filterStatus) {
            result = result.filter(cal => cal.status === filterStatus);
        }

        return result;
    }, [searchTerm, filterStatus]);

    const paginatedCalibrations = useMemo(() => {
        return paginate(filteredCalibrations, currentPage, pageSize);
    }, [filteredCalibrations, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredCalibrations.length / pageSize);
    const validCalibrations = mockCalibrations.filter(c => c.status === 'Valid').length;
    const expiredCalibrations = mockCalibrations.filter(c => c.status === 'Expired').length;
    const pendingCalibrations = mockCalibrations.filter(c => c.status === 'Pending').length;

    return (
        <div>
            {/* Metric Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div className="metric-card">
                    <div className="metric-label">Total Calibrations</div>
                    <div className="metric-value">{mockCalibrations.length}</div>
                    <div className="metric-status">All records</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Valid</div>
                    <div className="metric-value">{validCalibrations}</div>
                    <div className="metric-status">Current calibrations</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Expired</div>
                    <div className="metric-value">{expiredCalibrations}</div>
                    <div className="metric-status">Need recalibration</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Pending</div>
                    <div className="metric-value">{pendingCalibrations}</div>
                    <div className="metric-status">Awaiting completion</div>
                </div>
            </div>

            {/* Main Card */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 className="card-title">Calibration Records</h2>
                        <p className="card-subtitle">Manage calibration records and certificates</p>
                    </div>
                    <button className="btn btn-primary" onClick={onCreateNew}>
                        + Add Calibration
                    </button>
                </div>

                <div className="search-filter-bar">
                    <div className="search-input">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="filter-select">
                        <select
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Status</option>
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Instrument Code</th>
                                <th>Last Calibration</th>
                                <th>Next Calibration</th>
                                <th>Certificate</th>
                                <th>Status</th>
                                <th>Vendor</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCalibrations.map(cal => (
                                <tr key={cal.id}>
                                    <td>{cal.productName}</td>
                                    <td>{cal.instrumentCode}</td>
                                    <td>{cal.lastCalibrationDate}</td>
                                    <td>{cal.nextCalibrationDate}</td>
                                    <td>{cal.calibrationCertificate}</td>
                                    <td>
                                        <span className={`badge badge-${cal.status === 'Valid' ? 'success' :
                                            cal.status === 'Expired' ? 'danger' : 'warning'
                                            }`}>
                                            {cal.status}
                                        </span>
                                    </td>
                                    <td>{cal.vendor}</td>
                                    <td>
                                        <button className="btn btn-sm btn-primary" onClick={() => onEdit(cal)}>
                                            Edit
                                        </button>
                                        <button className="btn btn-sm btn-info" onClick={() => onUploadCertificate(cal)}>
                                            Upload Cert
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => onDelete(cal.id)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <div className="pagination-info">
                        Showing {paginatedCalibrations.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredCalibrations.length)} of {filteredCalibrations.length} calibrations
                    </div>
                    <div className="pagination-controls">
                        <button
                            className="btn btn-sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="btn btn-sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
