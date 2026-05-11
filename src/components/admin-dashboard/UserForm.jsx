import React, { useState, useEffect } from 'react';
import { USER_ROLES, REGIONS, DESIGNATIONS, DISCIPLINES } from './utils/mockData';

export const UserForm = ({ user, roles = [], existingUsers = [], onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        userName: '',
        password: '',
        roleNames: [],
        email: '',
        mobileNumber: '',
        employeeCode: '',
        employmentType: 'REGULAR',
        fullName: '',
        shortName: '',
        dateOfBirth: '',
        designation: '',
        discipline: '',
        rio: '',
        cm: '',
        status: 'Active'
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                ...user,
                fullName: user.fullName || user.name || '',
                employeeCode: user.employeeCode || user.rritesEmployeeCode || '',
                mobileNumber: user.mobileNumber || user.mobileNo || '',
                roleNames: Array.isArray(user.roleNames) ? user.roleNames : (user.roleName ? user.roleName.split(',') : []),
                userId: user.userId || user.id || undefined,
                rio: user.rio || ''
            }));
        } else {
            setFormData({
                userName: '',
                password: '',
                roleNames: [],
                email: '',
                mobileNumber: '',
                employeeCode: '',
                employmentType: 'REGULAR',
                fullName: '',
                shortName: '',
                dateOfBirth: '',
                designation: '',
                discipline: '',
                rio: '',
                cm: '',
                status: 'Active'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // Automatically set userName to match employeeCode for login consistency
            if (name === 'employeeCode') {
                newState.userName = value;
            }
            return newState;
        });
    };

    const handleRoleChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            roleNames: value ? [value] : []
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation for duplicate user
        if (!user) {
            const existing = existingUsers.find(u => 
                u.employeeCode === formData.employeeCode || 
                (u.email && u.email === formData.email)
            );

            if (existing) {
                const selectedRole = formData.roleNames[0];
                const existingRoles = (existing.roleName || '').split(',').map(r => r.trim());

                if (existingRoles.includes(selectedRole)) {
                    window.alert(`Error: User with Employee Code ${formData.employeeCode} already has the role "${selectedRole}".`);
                    return;
                }

                const confirmAdd = window.confirm(
                    `User with Employee Code ${formData.employeeCode} already exists with roles: ${existing.roleName}.\n\nDo you want to add the "${selectedRole}" role to this existing user instead?`
                );

                if (confirmAdd) {
                    // Update existing user by appending the new role
                    const updatedRoleNames = [...existingRoles, selectedRole];
                    const dataToSubmit = {
                        ...existing,
                        roleNames: updatedRoleNames,
                        // Ensure ID is passed for update
                        userId: existing.userId || existing.id
                    };
                    onSubmit(dataToSubmit);
                    return;
                } else {
                    return; // User cancelled
                }
            }
        }

        // Ensure userName matches fullName before submission
        const finalData = { ...formData, userName: formData.fullName };
        onSubmit(finalData);
    };

    return (
        <form onSubmit={handleSubmit} className="user-form-professional">
            {/* 1. Account Information Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <span>👤</span> Account Roles
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Role <span className="required-star">*</span></label>
                        <select
                            name="role"
                            className="form-control"
                            value={formData.roleNames[0] || ''}
                            onChange={handleRoleChange}
                            required
                        >
                            <option value="">Select User Role</option>
                            {(roles && roles.length > 0 ? roles : USER_ROLES).map(role => {
                                const rName = typeof role === 'object' ? role.roleName : role;
                                const rId = typeof role === 'object' ? (role.roleId || role.roleName) : role;
                                return <option key={rId} value={rName}>{rName}</option>;
                            })}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Personal Information Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <span>📝</span> Personal & Security Details
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Full Name <span className="required-star">*</span></label>
                        <input
                            type="text"
                            name="fullName"
                            className="form-control"
                            placeholder="Full name as per records"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Short Name</label>
                        <input
                            type="text"
                            name="shortName"
                            className="form-control"
                            placeholder="Abbreviation (e.g. RK)"
                            value={formData.shortName}
                            onChange={handleChange}
                            maxLength="5"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address <span className="required-star">*</span></label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="official.email@rites.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {!user && (
                        <div className="form-group">
                            <label className="form-label">Set Password <span className="required-star">*</span></label>
                            <input
                                type="password"
                                name="password"
                                className="form-control"
                                placeholder="Set initial login password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!user}
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Mobile Number</label>
                        <input
                            type="tel"
                            name="mobileNumber"
                            className="form-control"
                            placeholder="10-digit mobile number"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            className="form-control"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Professional Information Section */}
            <div className="form-section" style={{ borderBottom: 'none' }}>
                <div className="form-section-title">
                    <span>🏢</span> Professional Details
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">RITES Employee Code <span className="required-star">*</span></label>
                        <input
                            type="text"
                            name="employeeCode"
                            className="form-control"
                            placeholder="e.g. RITES1234"
                            value={formData.employeeCode}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Employment Type</label>
                        <select
                            name="employmentType"
                            className="form-control"
                            value={formData.employmentType}
                            onChange={handleChange}
                        >
                            <option value="REGULAR">REGULAR</option>
                            <option value="CONTRACTUAL">CONTRACTUAL</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Designation</label>
                        <select
                            name="designation"
                            className="form-control"
                            value={formData.designation}
                            onChange={handleChange}
                        >
                            <option value="">Select Designation</option>
                            {DESIGNATIONS.map(designation => (
                                <option key={designation} value={designation}>{designation}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Discipline</label>
                        <select
                            name="discipline"
                            className="form-control"
                            value={formData.discipline}
                            onChange={handleChange}
                        >
                            <option value="">Select Discipline</option>
                            {DISCIPLINES.map(discipline => (
                                <option key={discipline} value={discipline}>{discipline}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Region (RIO)</label>
                        <select
                            name="rio"
                            className="form-control"
                            value={formData.rio}
                            onChange={handleChange}
                        >
                            <option value="">Select Region</option>
                            {REGIONS.map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            name="status"
                            className="form-control"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>
                    {user ? 'Update User' : 'Create User'}
                </button>
            </div>
        </form>
    );
};

/**
 * Helper Validation Functions
 * Added at the end of file for clarity and maintainability
 */

/**
 * Checks if a user already exists in the system based on Employee Code or Email.
 * Returns the existing user object if found, otherwise null.
 */
export const checkExistingUser = (employeeCode, email, usersList) => {
    if (!usersList || !Array.isArray(usersList)) return null;
    
    return usersList.find(user => 
        (employeeCode && user.employeeCode === employeeCode) || 
        (email && user.email === email)
    );
};

/**
 * Validates if the selected role is already assigned to a user.
 */
export const hasDuplicateRole = (user, roleName) => {
    if (!user || !user.roleName || !roleName) return false;
    const roles = user.roleName.split(',').map(r => r.trim());
    return roles.includes(roleName);
};
