import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { USER_ROLES, REGIONS, DESIGNATIONS, DISCIPLINES } from './utils/mockData';

export const UserForm = ({ user, roles = [], existingUsers = [], onSubmit, onCancel }) => {
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        userName: '',
        password: '',
        roleNames: [],
        email: '',
        mobileNumber: '',
        alternateMobileNumber: '',
        notificationPreferences: '',
        employeeCode: '',
        employmentType: 'REGULAR',
        fullName: '',
        shortName: '',
        dateOfBirth: '',
        designation: '',
        discipline: '',
        productType: '',
        profilePhotoPath: '',
        rio: '',
        cm: '',
        zonalRly: '',
        status: 'Active'
    });

    useEffect(() => {
        if (user) {
            const isZR = Array.isArray(user.roleNames) ? user.roleNames.includes('ZONAL RAILWAY') : (user.roleName && user.roleName.split(',').includes('ZONAL RAILWAY'));
            let derivedZonalRly = user.zonalRly || '';
            if (!derivedZonalRly && isZR && user.employeeCode) {
                const match = user.employeeCode.match(/^ZR([A-Z]+)\d+$/);
                if (match) {
                    derivedZonalRly = match[1];
                }
            }
            const sanitizedUser = {};
            Object.keys(user).forEach(key => {
                sanitizedUser[key] = (user[key] === null || user[key] === undefined) ? '' : user[key];
            });

            setFormData(prev => ({
                ...prev,
                ...sanitizedUser,
                fullName: user.fullName || user.name || '',
                employeeCode: user.employeeCode || user.ritesEmployeeCode || '',
                mobileNumber: user.mobileNumber || user.mobileNo || '',
                alternateMobileNumber: user.alternateMobileNumber || '',
                notificationPreferences: user.notificationPreferences || '',
                roleNames: Array.isArray(user.roleNames) 
                    ? user.roleNames 
                    : (user.roleName ? user.roleName.split(',').map(r => r.trim()).filter(Boolean) : []),
                userId: user.userId || user.id || undefined,
                rio: user.rio || '',
                productType: user.productType || '',
                profilePhotoPath: user.profilePhotoPath || '',
                zonalRly: derivedZonalRly
            }));
        } else {
            setFormData({
                userName: '',
                password: '',
                roleNames: [],
                email: '',
                mobileNumber: '',
                alternateMobileNumber: '',
                notificationPreferences: '',
                employeeCode: '',
                employmentType: 'REGULAR',
                fullName: '',
                shortName: '',
                dateOfBirth: '',
                designation: '',
                discipline: '',
                productType: '',
                profilePhotoPath: '',
                rio: '',
                cm: '',
                zonalRly: '',
                status: 'Active'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Clear password error when user starts typing
        if (name === 'password') {
            setPasswordError('');
        }
        
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // Automatically set userName to match employeeCode for login consistency
            if (name === 'employeeCode') {
                newState.userName = value;
            }
            return newState;
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePhotoPath: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        
        // Password validation (only required for new users or if password is provided)
        if (!user || formData.password) {
            const pwd = formData.password;
            if (pwd.length < 8) {
                setPasswordError('Password must be at least 8 characters long.');
                return;
            }
            if (!/[A-Z]/.test(pwd)) {
                setPasswordError('Password must contain at least one uppercase letter.');
                return;
            }
            if (!/[0-9]/.test(pwd)) {
                setPasswordError('Password must contain at least one number.');
                return;
            }
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
                setPasswordError('Password must contain at least one special character (!@#$%^&* etc).');
                return;
            }
        }

        // Validation for duplicate user
        if (!user) {
            const existing = existingUsers.find(u => 
                (formData.employeeCode && u.employeeCode === formData.employeeCode) || 
                (formData.email && u.email && u.email === formData.email)
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
                    Object.keys(dataToSubmit).forEach(key => {
                        if (dataToSubmit[key] === '') {
                            dataToSubmit[key] = null;
                        }
                    });
                    onSubmit(dataToSubmit);
                    return;
                } else {
                    return; // User cancelled
                }
            }
        }

        // Ensure userName matches fullName before submission
        const finalData = { ...formData, userName: formData.fullName };
        
        // Convert any empty strings to null to prevent database type conversion errors (e.g. date_of_birth)
        Object.keys(finalData).forEach(key => {
            if (finalData[key] === '') {
                finalData[key] = null;
            }
        });

        onSubmit(finalData);
    };

    const isZonalRailway = formData.roleNames.includes('ZONAL RAILWAY');

    const roleMapping = {
        'Vendor': 'ERC Vendor',
        'IE': 'ERC IE',
        'Process IE': 'ERC Process IE',
        'Main IE': 'Sleeper Main IE',
        'Rail Main IE': 'Railpad Main IE',
        'Rail Process IE': 'Railpad Process IE'
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
                        <Select
                            mode="multiple"
                            maxTagCount="responsive"
                            showSearch
                            value={formData.roleNames || []}
                            placeholder="Select User Roles"
                            onChange={(values) => {
                                setFormData(prev => ({
                                    ...prev,
                                    roleNames: values || []
                                }));
                            }}
                            allowClear
                            style={{ width: '100%', minHeight: '38px' }}
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={(() => {
                                const roleList = roles && roles.length > 0 ? roles : USER_ROLES;
                                const sortedRoles = [...roleList].sort((a, b) => {
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

                    {user && (
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="form-control"
                                    placeholder="Leave blank to keep unchanged"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={false}
                                    style={{ paddingRight: '60px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0'
                                    }}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <VisibilityOff style={{ fontSize: '20px' }} /> : <Visibility style={{ fontSize: '20px' }} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {isZonalRailway && (
                        <div className="form-group">
                            <label className="form-label">Organisation (Zonal Railway) <span className="required-star">*</span></label>
                            <select
                                name="zonalRly"
                                className="form-control"
                                value={formData.zonalRly || ''}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Zonal Railway</option>
                                {['CR', 'ER', 'ECR', 'ECoR', 'NR', 'NCR', 'NER', 'NFR', 'NWR', 'SR', 'SCR', 'SER', 'SECR', 'SWR', 'WR', 'WCR'].map(rly => (
                                    <option key={rly} value={rly}>{rly}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Basic Information Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <span>📝</span> Basic Information
                </div>
                
                {/* Profile Photo Upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{
                        width: '76px', height: '76px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0f4c81 0%, #2563eb 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '26px', fontWeight: 800, color: '#fff',
                        border: '2px solid #e2e8f0', overflow: 'hidden'
                    }}>
                        {formData.profilePhotoPath ? (
                            <img src={formData.profilePhotoPath} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'
                        )}
                    </div>
                    <div>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '13px' }}>
                            Upload Photo
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                        </label>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Recommended: Square image</div>
                    </div>
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
                        <label className="form-label">Short Name <span className="required-star">*</span></label>
                        <input
                            type="text"
                            name="shortName"
                            className="form-control"
                            placeholder="e.g. JD"
                            value={formData.shortName || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {(!isZonalRailway || (isZonalRailway && user)) && (
                        <div className="form-group">
                            <label className="form-label">Employee Code <span className="required-star">*</span></label>
                            <input
                                type="text"
                                name="employeeCode"
                                className="form-control"
                                placeholder="e.g. 104937"
                                value={formData.employeeCode}
                                onChange={handleChange}
                                required={!isZonalRailway}
                                disabled={isZonalRailway && user}
                            />
                        </div>
                    )}
                    {!isZonalRailway && (
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
                    )}
                    <div className="form-group">
                        <label className="form-label">Designation</label>
                        {isZonalRailway ? (
                            <input
                                type="text"
                                name="designation"
                                className="form-control"
                                placeholder="Designation (e.g. SSE DD HQ)"
                                value={formData.designation}
                                onChange={handleChange}
                            />
                        ) : (
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
                        )}
                    </div>
                    {!isZonalRailway && (
                        <>
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
                        </>
                    )}
                </div>
            </div>

            {/* 3. Contact Information Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <span>📞</span> Contact Information
                </div>
                <div className="form-grid">
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
                        <label className="form-label">Alternate Mobile</label>
                        <input
                            type="tel"
                            name="alternateMobileNumber"
                            className="form-control"
                            placeholder="10-digit mobile number"
                            value={formData.alternateMobileNumber}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notification Prefs</label>
                        <select
                            name="notificationPreferences"
                            className="form-control"
                            value={formData.notificationPreferences}
                            onChange={handleChange}
                        >
                            <option value="">Select Preferences</option>
                            <option value="Email">Email Only</option>
                            <option value="SMS">SMS Only</option>
                            <option value="Email, SMS">Both Email & SMS</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 4. Organization Information Section */}
            <div className="form-section">
                <div className="form-section-title">
                    <span>🏢</span> Organization Information
                </div>
                <div className="form-grid">
                    {!isZonalRailway && (
                        <>
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
                        </>
                    )}
                </div>
            </div>

            {/* 5. Security & Status Section */}
            <div className="form-section" style={{ borderBottom: 'none' }}>
                <div className="form-section-title">
                    <span>🔒</span> Security & Status
                </div>
                <div className="form-grid">
                    {!user && (
                        <div className="form-group">
                            <label className="form-label">Set Password <span className="required-star">*</span></label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!user}
                                    minLength={8}
                                    style={{ paddingRight: '60px', ...(passwordError ? { borderColor: '#ef4444' } : {}) }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0'
                                    }}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <VisibilityOff style={{ fontSize: '20px' }} /> : <Visibility style={{ fontSize: '20px' }} />}
                                </button>
                            </div>
                            {passwordError && (
                                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '14px' }}>⚠️</span> {passwordError}
                                </div>
                            )}
                            {!passwordError && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                    Requires at least 8 characters, an uppercase letter, a number, and a special character.
                                </div>
                            )}
                        </div>
                    )}
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
