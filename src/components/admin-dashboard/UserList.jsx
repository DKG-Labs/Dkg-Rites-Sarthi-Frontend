import React, { useState, useMemo } from 'react';
import { Select } from 'antd';
import { USER_ROLES, REGIONS } from './utils/mockData';
import { filterBySearch, paginate } from './utils/helpers';
import { DEFAULT_PAGE_SIZE } from './utils/constants';
import AnnexureLoader from '../annexures/AnnexureLoader';

export const UserList = ({ users = [], roles = [], loading, onEdit, onDelete, onChangeRegion, onCreateNew, refreshTrigger }) => {
    const roleMapping = {
        'Vendor': 'ERC Vendor',
        'IE': 'ERC IE',
        'Process IE': 'ERC Process IE',
        'Main IE': 'Sleeper Main IE',
        'Rail Main IE': 'Railpad Main IE',
        'Rail Process IE': 'Railpad Process IE'
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [activeCard, setActiveCard] = useState('total');

    const filteredUsers = useMemo(() => {
        let result = users;

        // Search filter
        if (searchTerm) {
            result = filterBySearch(result, searchTerm, ['fullName', 'employeeCode', 'email', 'userName']);
        }

        // Card Status filter
        if (activeCard === 'active') {
            result = result.filter(user => user.status !== 'Inactive');
        } else if (activeCard === 'inactive') {
            result = result.filter(user => user.status === 'Inactive');
        }

        // Role filter
        if (filterRole) {
            result = result.filter(user => (user.roleName || '').includes(filterRole));
        }

        // Region filter
        if (filterRegion) {
            result = result.filter(user => user.rio === filterRegion);
        }

        return result;
    }, [users, searchTerm, filterRole, filterRegion, activeCard]);

    const paginatedUsers = useMemo(() => {
        return paginate(filteredUsers, currentPage, pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredUsers.length / pageSize);

    const activeUsers = users.filter(u => u.status !== 'Inactive').length;
    const inactiveUsers = users.filter(u => u.status === 'Inactive').length;
    const totalUsers = users.length;
    const displayRoles = roles && roles.length > 0 ? roles : USER_ROLES;

    return (
        <div>
            {/* Metric Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div 
                    className={`metric-card ${activeCard === 'total' ? 'highlight' : ''}`}
                    onClick={() => { setActiveCard('total'); setCurrentPage(1); }}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <div className="metric-label">Total Users</div>
                    <div className="metric-value">{totalUsers}</div>
                    <div className="metric-status">All users in system</div>
                </div>
                <div 
                    className={`metric-card ${activeCard === 'active' ? 'highlight' : ''}`}
                    onClick={() => { setActiveCard('active'); setCurrentPage(1); }}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <div className="metric-label">Active Users</div>
                    <div className="metric-value">{activeUsers}</div>
                    <div className="metric-status">Currently active</div>
                </div>
                <div 
                    className={`metric-card ${activeCard === 'inactive' ? 'highlight' : ''}`}
                    onClick={() => { setActiveCard('inactive'); setCurrentPage(1); }}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <div className="metric-label">Inactive Users</div>
                    <div className="metric-value">{inactiveUsers}</div>
                    <div className="metric-status">Deactivated</div>
                </div>
                <div 
                    className={`metric-card ${activeCard === 'roles' ? 'highlight' : ''}`}
                    onClick={() => setActiveCard('roles')}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <div className="metric-label">User Roles</div>
                    <div className="metric-value">{displayRoles.length}</div>
                    <div className="metric-status">Available roles</div>
                </div>
            </div>

            {/* Main Card */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 className="card-title">{activeCard === 'roles' ? 'Role Master' : 'User List'}</h2>
                        <p className="card-subtitle">{activeCard === 'roles' ? 'View all available system roles' : 'Manage system users and their roles'}</p>
                    </div>
                    {activeCard !== 'roles' && (
                        <button className="btn btn-primary" onClick={onCreateNew}>
                            + Create New User
                        </button>
                    )}
                </div>

                {activeCard === 'roles' ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Role ID</th>
                                    <th>Role Name</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayRoles.map((role, idx) => {
                                    const rName = typeof role === 'object' ? role.roleName : role;
                                    const displayRoleName = roleMapping[rName] || rName;
                                    const rId = typeof role === 'object' ? (role.roleId || role.roleName) : idx + 1;
                                    return (
                                        <tr key={rId}>
                                            <td style={{ fontWeight: '600', color: '#0f172a' }}>{rId}</td>
                                            <td>{displayRoleName}</td>
                                            <td>
                                                <span className="badge badge-success">Active</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {displayRoles.length === 0 && (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                                            No roles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <>

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
                    <div className="filter-select" style={{ minWidth: '200px' }}>
                        <Select
                            showSearch
                            value={filterRole || undefined}
                            placeholder="All Roles"
                            onChange={(value) => {
                                setFilterRole(value || '');
                                setCurrentPage(1);
                            }}
                            allowClear
                            style={{ width: '100%', height: '38px' }}
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={(() => {
                                const sortedRoles = [...displayRoles].sort((a, b) => {
                                    const rNameA = typeof a === 'object' ? a.roleName : a;
                                    const rNameB = typeof b === 'object' ? b.roleName : b;
                                    const dispA = roleMapping[rNameA] || rNameA;
                                    const dispB = roleMapping[rNameB] || rNameB;
                                    return dispA.localeCompare(dispB);
                                });
                                return sortedRoles.map(role => {
                                    const rName = typeof role === 'object' ? role.roleName : role;
                                    const displayRoleName = roleMapping[rName] || rName;
                                    const rId = typeof role === 'object' ? (role.roleId || role.roleName) : role;
                                    return { value: rName, label: displayRoleName, key: rId };
                                });
                            })()}
                        />
                    </div>
                    <div className="filter-select">
                        <select
                            value={filterRegion}
                            onChange={(e) => {
                                setFilterRegion(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Regions</option>
                            {REGIONS.map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    {loading ? (
                        <AnnexureLoader 
                            title="Syncing Users" 
                            subtitle="Fetching user data from the server..." 
                        />
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee Code</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Region</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                            No users found.
                                        </td>
                                    </tr>
                            ) : (
                                paginatedUsers.map(user => (
                                    <tr key={user.userId || user.id}>
                                    <td>{user.employeeCode}</td>
                                    <td>{user.fullName}</td>
                                    <td>{user.roleName ? user.roleName.split(',').map(r => roleMapping[r.trim()] || r.trim()).join(', ') : ''}</td>
                                    <td>{user.rio || (user.employeeCode && user.employeeCode.startsWith('ZR') && user.employeeCode.match(/^ZR([A-Z]+)\d+$/)?.[1]) || ''}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge badge-${user.status === 'Inactive' ? 'danger' : 'success'}`}>
                                            {user.status || 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            <button className="btn btn-sm btn-primary" onClick={() => onEdit(user)}>
                                                Edit
                                            </button>
                                            <button className="btn btn-sm btn-warning" onClick={() => onChangeRegion(user)}>
                                                Change Region
                                            </button>
                                            <button className="btn btn-sm btn-danger" onClick={() => onDelete(user.userId || user.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                    )}
                </div>

                    <div className="pagination">
                        <div className="pagination-info">
                            Showing {paginatedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
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
                </>
                )}
            </div>
        </div>
    );
};
