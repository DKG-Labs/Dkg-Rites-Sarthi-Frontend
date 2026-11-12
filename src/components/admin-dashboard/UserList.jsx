import React, { useState, useMemo } from 'react';
import { Select } from 'antd';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { USER_ROLES, REGIONS } from './utils/mockData';
import { paginate, getInitials } from './utils/helpers';
import { DEFAULT_PAGE_SIZE } from './utils/constants';

const ROLE_MAPPING = {
    'Vendor': 'ERC Vendor',
    'IE': 'ERC IE',
    'Process IE': 'ERC Process IE',
    'Main IE': 'Sleeper Main IE',
    'Rail Vendor': 'Railpad Vendor',
    'Railpad Vendor': 'Railpad Vendor',
    'Rail Main IE': 'Railpad Main IE',
    'Rail Process IE': 'Railpad Process IE'
};

const formatDisplayRoles = (roleName) => (
    roleName ? roleName.split(',').map(r => ROLE_MAPPING[r.trim()] || r.trim()).join(', ') : ''
);

const resolveDisplayRegion = (user) => (
    user?.rio || (user?.employeeCode && user.employeeCode.startsWith('ZR') && user.employeeCode.match(/^ZR([A-Z]+)\d+$/)?.[1]) || ''
);

export const UserList = ({ users = [], roles = [], loading, onEdit, onDelete, onChangeRegion, onCreateNew, refreshTrigger }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [activeCard, setActiveCard] = useState('total');
    const [actionsModalUser, setActionsModalUser] = useState(null);
    const [modalViewMode, setModalViewMode] = useState('actions');
    const [isExporting, setIsExporting] = useState(false);

    const openActionsModal = (user) => {
        setActionsModalUser(user);
        setModalViewMode('actions');
    };

    const closeActionsModal = () => {
        setActionsModalUser(null);
        setModalViewMode('actions');
    };

    const handleModalEdit = () => {
        if (!actionsModalUser) return;
        const targetUser = actionsModalUser;
        closeActionsModal();
        onEdit(targetUser);
    };

    const handleModalDelete = () => {
        if (!actionsModalUser) return;
        const targetId = actionsModalUser.userId || actionsModalUser.id;
        closeActionsModal();
        onDelete(targetId);
    };

    const filteredUsers = useMemo(() => {
        let result = users;

        // Search filter (searches across name, employee code, email, short name, mobile number, username, rio, status, raw role, and mapped display role)
        if (searchTerm) {
            const term = searchTerm.trim().toLowerCase();
            result = result.filter(user => {
                const baseFieldsMatch = [user.fullName, user.employeeCode, user.email, user.shortName, user.mobileNumber, user.userName, user.rio, user.status]
                    .some(val => val && String(val).toLowerCase().includes(term));
                if (baseFieldsMatch) return true;

                // Check raw roleName and mapped roleName (e.g. 'Rail Main IE' -> 'Railpad Main IE', 'Rail Vendor' -> 'Railpad Vendor')
                if (user.roleName) {
                    if (String(user.roleName).toLowerCase().includes(term)) return true;
                    const rolesArray = user.roleName.split(',').map(r => r.trim());
                    const hasMappedRoleMatch = rolesArray.some(r => {
                        const mapped = ROLE_MAPPING[r] || r;
                        return mapped.toLowerCase().includes(term);
                    });
                    if (hasMappedRoleMatch) return true;
                }
                return false;
            });
        }

        // Card Status filter
        if (activeCard === 'active') {
            result = result.filter(user => user.status !== 'Inactive');
        } else if (activeCard === 'inactive') {
            result = result.filter(user => user.status === 'Inactive');
        }

        // Role filter (matches both raw DB role names and display labels like 'Railpad Main IE')
        if (filterRole) {
            const targetRole = filterRole.toLowerCase().trim();
            const targetMapped = (ROLE_MAPPING[filterRole] || filterRole).toLowerCase().trim();
            result = result.filter(user => {
                if (!user.roleName) return false;
                const userRoles = user.roleName.split(',').map(r => r.trim());
                return userRoles.some(r => {
                    const rLower = r.toLowerCase();
                    const mappedLower = (ROLE_MAPPING[r] || r).toLowerCase();
                    return rLower === targetRole 
                        || mappedLower === targetRole 
                        || rLower === targetMapped 
                        || mappedLower === targetMapped 
                        || rLower.includes(targetRole) 
                        || mappedLower.includes(targetRole);
                });
            });
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

    const handleDownloadExcel = async () => {
        if (isExporting || filteredUsers.length === 0) return;
        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Users List');

            const columns = [
                { header: 'S.No.', key: 'sNo', width: 8 },
                { header: 'Employee Code', key: 'employeeCode', width: 16 },
                { header: 'Username', key: 'userName', width: 22 },
                { header: 'Full Name', key: 'fullName', width: 28 },
                { header: 'Short Name', key: 'shortName', width: 18 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Mobile Number', key: 'mobileNumber', width: 16 },
                { header: 'Alternate Mobile', key: 'alternateMobileNumber', width: 16 },
                { header: 'Role(s)', key: 'roleName', width: 30 },
                { header: 'Region', key: 'region', width: 12 },
                { header: 'Designation', key: 'designation', width: 22 },
                { header: 'Discipline', key: 'discipline', width: 18 },
                { header: 'Employment Type', key: 'employmentType', width: 18 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Created Date', key: 'createdDate', width: 15 }
            ];

            worksheet.columns = columns;
            worksheet.views = [{ state: 'frozen', ySplit: 1 }];
            worksheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: 1, column: columns.length }
            };

            const headerRow = worksheet.getRow(1);
            headerRow.height = 24;
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF0F766E' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
            });

            filteredUsers.forEach((user, index) => {
                const isInactive = user.status && user.status.toLowerCase() === 'inactive';
                const row = worksheet.addRow({
                    sNo: index + 1,
                    employeeCode: user.employeeCode ? String(user.employeeCode) : '',
                    userName: user.userName || '',
                    fullName: user.fullName || '',
                    shortName: user.shortName || '',
                    email: user.email || '',
                    mobileNumber: user.mobileNumber ? String(user.mobileNumber) : '',
                    alternateMobileNumber: user.alternateMobileNumber ? String(user.alternateMobileNumber) : '',
                    roleName: formatDisplayRoles(user.roleName),
                    region: resolveDisplayRegion(user),
                    designation: user.designation || '',
                    discipline: user.discipline || '',
                    employmentType: user.employmentType || '',
                    status: isInactive ? 'Inactive' : 'Active',
                    createdDate: user.createdDate || ''
                });

                row.eachCell((cell, colNumber) => {
                    cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
                    if (index % 2 === 1) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF8FAFC' }
                        };
                    }
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                });

                const statusCell = row.getCell('status');
                statusCell.font = {
                    bold: true,
                    color: { argb: isInactive ? 'FFDC2626' : 'FF15803D' }
                };
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const today = new Date().toISOString().slice(0, 10);
            link.href = url;
            link.download = `SARTHI_Users_List_${today}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export users to Excel:', err);
        } finally {
            setIsExporting(false);
        }
    };

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
                        <div className="user-header-actions">
                            <button
                                type="button"
                                className="btn btn-excel-export"
                                onClick={handleDownloadExcel}
                                disabled={loading || isExporting || filteredUsers.length === 0}
                                title={`Download ${filteredUsers.length} user(s) in Excel`}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>{isExporting ? 'Downloading...' : 'Download Excel'}</span>
                            </button>
                            <button className="btn btn-primary" onClick={onCreateNew}>
                                + Create New User
                            </button>
                        </div>
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
                                    const displayRoleName = ROLE_MAPPING[rName] || rName;
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
                                const seenLabels = new Set();
                                const uniqueOptions = [];

                                displayRoles.forEach((role, idx) => {
                                    const rName = typeof role === 'object' ? role.roleName : role;
                                    if (!rName) return;
                                    const displayRoleName = ROLE_MAPPING[rName] || rName;
                                    
                                    if (!seenLabels.has(displayRoleName)) {
                                        seenLabels.add(displayRoleName);
                                        const rId = typeof role === 'object' ? (role.roleId || role.roleName) : idx;
                                        uniqueOptions.push({ value: rName, label: displayRoleName, key: rId });
                                    }
                                });

                                return uniqueOptions.sort((a, b) => a.label.localeCompare(b.label));
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
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Employee Code</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Region</th>
                                <th>Email</th>
                                <th>Short Name</th>
                                <th>Mobile Number</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, idx) => (
                                    <tr key={`skeleton-${idx}`} className="skeleton-table-row">
                                        <td><span className="skeleton-shimmer" style={{ width: '85px', height: '18px' }} /></td>
                                        <td><span className="skeleton-shimmer" style={{ width: '160px', height: '18px' }} /></td>
                                        <td><span className="skeleton-shimmer" style={{ width: '110px', height: '18px' }} /></td>
                                        <td><span className="skeleton-shimmer" style={{ width: '60px', height: '18px' }} /></td>
                                        <td><span className="skeleton-shimmer" style={{ width: '180px', height: '18px' }} /></td>
                                        <td><span className="skeleton-shimmer" style={{ width: '90px', height: '18px' }} /></td>
                                        <td><span className="skeleton-shimmer" style={{ width: '105px', height: '18px' }} /></td>
                                        <td><span className="skeleton-shimmer" style={{ width: '70px', height: '22px', borderRadius: '12px' }} /></td>
                                        <td>
                                            <span className="skeleton-shimmer" style={{ width: '108px', height: '30px', borderRadius: '6px' }} />
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map(user => (
                                    <tr key={user.userId || user.id}>
                                    <td>{user.employeeCode}</td>
                                    <td>{user.fullName}</td>
                                    <td>{formatDisplayRoles(user.roleName)}</td>
                                    <td>{resolveDisplayRegion(user)}</td>
                                    <td>{user.email}</td>
                                    <td>{user.shortName || '-'}</td>
                                    <td>{user.mobileNumber || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${(user.status && user.status.toLowerCase() === 'inactive') ? 'danger' : 'success'}`}>
                                            {(user.status && user.status.toLowerCase() === 'inactive') ? 'Inactive' : 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="view-actions-btn"
                                            onClick={() => openActionsModal(user)}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <span>View Actions</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
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

            {actionsModalUser && (
                <div
                    className="user-actions-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeActionsModal();
                    }}
                >
                    <div className={`user-actions-dialog ${modalViewMode === 'view' ? 'wide' : ''}`}>
                        <div className="user-actions-banner">
                            <div className="user-actions-identity">
                                <div className={`user-actions-avatar ${modalViewMode === 'view' ? 'view-mode' : ''}`}>
                                    {getInitials(actionsModalUser.fullName || actionsModalUser.userName || actionsModalUser.employeeCode)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h3 className="user-actions-name">
                                        {modalViewMode === 'view'
                                            ? (actionsModalUser.fullName || actionsModalUser.userName || 'User')
                                            : `User Details - ${actionsModalUser.fullName || actionsModalUser.userName || 'User'}`}
                                    </h3>
                                    <div className="user-actions-email">
                                        {modalViewMode === 'view'
                                            ? 'Complete User Profile'
                                            : (actionsModalUser.email || '-')}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="user-actions-close"
                                onClick={closeActionsModal}
                                aria-label="Close popup"
                            >
                                ×
                            </button>
                        </div>

                        <div className="user-actions-body">
                            {modalViewMode === 'actions' ? (
                                <>
                                    <div className="user-actions-info-box">
                                        <div className="user-actions-info-item">
                                            <div className="user-actions-info-label">Employee Code</div>
                                            <div className="user-actions-info-value">
                                                {actionsModalUser.employeeCode || '-'}
                                            </div>
                                        </div>
                                        <div className="user-actions-info-item">
                                            <div className="user-actions-info-label">Short Name</div>
                                            <div className="user-actions-info-value">
                                                {actionsModalUser.shortName || '-'}
                                            </div>
                                        </div>
                                        <div className="user-actions-info-item">
                                            <div className="user-actions-info-label">Region</div>
                                            <div className="user-actions-info-value">
                                                {resolveDisplayRegion(actionsModalUser) || '-'}
                                            </div>
                                        </div>
                                        <div className="user-actions-info-item">
                                            <div className="user-actions-info-label">Mobile Number</div>
                                            <div className="user-actions-info-value">
                                                {actionsModalUser.mobileNumber || '-'}
                                            </div>
                                        </div>
                                        <div className="user-actions-info-item">
                                            <div className="user-actions-info-label">Role</div>
                                            <div className="user-actions-info-value">
                                                {formatDisplayRoles(actionsModalUser.roleName) || '-'}
                                            </div>
                                        </div>
                                        <div className="user-actions-info-item">
                                            <div className="user-actions-info-label">Status</div>
                                            <div className="user-actions-info-value">
                                                <span className={`user-actions-status-pill ${(actionsModalUser.status && actionsModalUser.status.toLowerCase() === 'inactive') ? 'inactive' : 'active'}`}>
                                                    {(actionsModalUser.status && actionsModalUser.status.toLowerCase() === 'inactive') ? 'INACTIVE' : 'ACTIVE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="user-actions-section-title">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#f97316" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                        <span>Actions</span>
                                    </div>

                                    <div className="user-actions-grid">
                                        <button
                                            type="button"
                                            className="user-action-card view"
                                            onClick={() => setModalViewMode('view')}
                                        >
                                            <div className="user-action-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </div>
                                            <div className="user-action-title">View</div>
                                            <div className="user-action-desc">View user details</div>
                                        </button>

                                        <button
                                            type="button"
                                            className="user-action-card edit"
                                            onClick={handleModalEdit}
                                        >
                                            <div className="user-action-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </div>
                                            <div className="user-action-title">Edit</div>
                                            <div className="user-action-desc">Modify user details</div>
                                        </button>

                                        <button
                                            type="button"
                                            className="user-action-card delete"
                                            onClick={handleModalDelete}
                                        >
                                            <div className="user-action-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </div>
                                            <div className="user-action-title">Delete</div>
                                            <div className="user-action-desc">Remove user account</div>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="user-profile-box">
                                    <div className="user-profile-grid">
                                        {[
                                            { label: 'Employee Code', value: actionsModalUser.employeeCode },
                                            { label: 'Username', value: actionsModalUser.userName },
                                            { label: 'Full Name', value: actionsModalUser.fullName },
                                            { label: 'Short Name', value: actionsModalUser.shortName },
                                            { label: 'Email', value: actionsModalUser.email },
                                            { label: 'Mobile Number', value: actionsModalUser.mobileNumber },
                                            { label: 'Alternate Mobile', value: actionsModalUser.alternateMobileNumber },
                                            { label: 'Region', value: resolveDisplayRegion(actionsModalUser) },
                                            { label: 'Role(s)', value: formatDisplayRoles(actionsModalUser.roleName) },
                                            { label: 'Designation', value: actionsModalUser.designation },
                                            { label: 'Discipline', value: actionsModalUser.discipline },
                                            { label: 'Employment Type', value: actionsModalUser.employmentType }
                                        ].map((field) => (
                                            <div key={field.label}>
                                                <div className="user-detail-label">{field.label}</div>
                                                <div className="user-detail-value">{field.value || '-'}</div>
                                            </div>
                                        ))}
                                        <div>
                                            <div className="user-detail-label">Status</div>
                                            <div className="user-detail-value">
                                                <span className={`user-actions-status-pill ${(actionsModalUser.status && actionsModalUser.status.toLowerCase() === 'inactive') ? 'inactive' : 'active'}`}>
                                                    {(actionsModalUser.status && actionsModalUser.status.toLowerCase() === 'inactive') ? 'INACTIVE' : 'ACTIVE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {modalViewMode === 'view' && (
                            <div className="user-actions-footer">
                                <button
                                    type="button"
                                    className="user-profile-close-btn"
                                    onClick={closeActionsModal}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
