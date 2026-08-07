import React, { useState, useMemo } from 'react';
import { mockMasters } from './utils/mockData';
import { filterBySearch, paginate } from './utils/helpers';
import { DEFAULT_PAGE_SIZE } from './utils/constants';

export const MasterList = ({ onEdit, onDelete, onCreateNew, onApprove }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);

    const masterTypes = ['Vendor', 'BPO', 'Consignee', 'Item', 'Plant', 'Instrument'];
    const statuses = ['Active', 'Inactive', 'Pending Approval'];

    const filteredMasters = useMemo(() => {
        let result = mockMasters;

        if (searchTerm) {
            result = filterBySearch(result, searchTerm, ['masterName', 'masterCode', 'vendor']);
        }

        if (filterType) {
            result = result.filter(master => master.masterType === filterType);
        }

        if (filterStatus) {
            result = result.filter(master => master.status === filterStatus);
        }

        return result;
    }, [searchTerm, filterType, filterStatus]);

    const paginatedMasters = useMemo(() => {
        return paginate(filteredMasters, currentPage, pageSize);
    }, [filteredMasters, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredMasters.length / pageSize);
    const activeMasters = mockMasters.filter(m => m.status === 'Active').length;
    const pendingMasters = mockMasters.filter(m => m.status === 'Pending Approval').length;
    const totalMasters = mockMasters.length;

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
                    <div className="metric-label">Total Masters</div>
                    <div className="metric-value">{totalMasters}</div>
                    <div className="metric-status">All master records</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Active Masters</div>
                    <div className="metric-value">{activeMasters}</div>
                    <div className="metric-status">Currently active</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Pending Approval</div>
                    <div className="metric-value">{pendingMasters}</div>
                    <div className="metric-status">Awaiting approval</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Master Types</div>
                    <div className="metric-value">{masterTypes.length}</div>
                    <div className="metric-status">Available types</div>
                </div>
            </div>

            {/* Main Card */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 className="card-title">Master Data List</h2>
                        <p className="card-subtitle">Manage master data including vendors, items, and plants</p>
                    </div>
                    <button className="btn btn-primary" onClick={onCreateNew}>
                        + Create Master
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
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Types</option>
                            {masterTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
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
                                <th>Master Type</th>
                                <th>Master Name</th>
                                <th>Master Code</th>
                                <th>Vendor</th>
                                <th>Status</th>
                                <th>Created Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedMasters.map(master => (
                                <tr key={master.id}>
                                    <td>{master.masterType}</td>
                                    <td>{master.masterName}</td>
                                    <td>{master.masterCode}</td>
                                    <td>{master.vendor}</td>
                                    <td>
                                        <span className={`badge badge-${master.status === 'Active' ? 'success' :
                                            master.status === 'Pending Approval' ? 'warning' : 'danger'
                                            }`}>
                                            {master.status}
                                        </span>
                                    </td>
                                    <td>{master.createdDate}</td>
                                    <td>
                                        <button className="btn btn-sm btn-primary" onClick={() => onEdit(master)}>
                                            Edit
                                        </button>
                                        {master.status === 'Pending Approval' && (
                                            <button className="btn btn-sm btn-success" onClick={() => onApprove(master.id)}>
                                                Approve
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-danger" onClick={() => onDelete(master.id)}>
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
                        Showing {paginatedMasters.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredMasters.length)} of {filteredMasters.length} masters
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
