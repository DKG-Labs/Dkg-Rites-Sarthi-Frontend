import React, { useState, useEffect } from 'react';
import { USER_ROLES, REGIONS } from './utils/mockData';

export const UserForm = ({ user, roles = [], onSubmit, onCancel }) => {
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
            setFormData({
                ...formData,
                ...user,
                fullName: user.name || user.fullName || '',
                employeeCode: user.rritesEmployeeCode || user.employeeCode || '',
                mobileNumber: user.mobileNo || user.mobileNumber || '',
                roleNames: user.role ? [user.role] : (user.roleNames || []),
                userId: user.id || user.userId || undefined
            });
        }
    }, [user, formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // Automatically set userName to match fullName
            if (name === 'fullName') {
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

    const handleSubmit = (e) => {
        e.preventDefault();
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
                            {(roles && roles.length > 0 ? roles : USER_ROLES).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
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
                        <input
                            type="text"
                            name="designation"
                            className="form-control"
                            placeholder="Current designation"
                            value={formData.designation}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Discipline</label>
                        <input
                            type="text"
                            name="discipline"
                            className="form-control"
                            placeholder="e.g. Mechanical, Electrical"
                            value={formData.discipline}
                            onChange={handleChange}
                        />
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
