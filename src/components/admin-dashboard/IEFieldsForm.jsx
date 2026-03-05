import React, { useState, useEffect, useRef } from 'react';
import './admin.css';

/**
 * SearchableDropdown Component
 * Provides a custom searchable select with limited height and scrollbar
 */
const SearchableSelect = ({ options, value, onChange, placeholder, disabled, displayKey = null, valueKey = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => {
        const text = displayKey ? (opt[displayKey] || '') : (opt || '');
        return text.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm('');
    };

    const getDisplayText = (val) => {
        if (!val) return placeholder;
        if (displayKey && valueKey) {
            const found = options.find(o => String(o[valueKey]) === String(val));
            return found ? found[displayKey] : placeholder;
        }
        return val;
    };

    return (
        <div className="searchable-select-container" ref={dropdownRef}>
            <div
                className={`searchable-select-display ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
                {getDisplayText(value)}
            </div>
            {isOpen && (
                <div className="searchable-select-dropdown">
                    <div className="searchable-select-search-box">
                        <input
                            type="text"
                            className="searchable-select-search-input"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="searchable-select-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, idx) => {
                                const optionValue = valueKey ? opt[valueKey] : opt;
                                const optionDisplay = displayKey ? opt[displayKey] : opt;
                                return (
                                    <div
                                        key={idx}
                                        className={`searchable-select-item ${String(optionValue) === String(value) ? 'selected' : ''}`}
                                        onClick={() => handleSelect(opt)}
                                    >
                                        {optionDisplay}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="searchable-select-no-results">No items found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const IEFieldsForm = ({ onSubmit, onCancel, getUsersByRole, getCompanies, getUnitsByCompany, getMappingDetails }) => {
    const [selectedRole, setSelectedRole] = useState('IE');
    const [users, setUsers] = useState([]); // Users for the MAIN profile (based on selectedRole)
    const [ieUsers, setIeUsers] = useState([]); // List of IEs (role 'IE') for Process IE mapping
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        userId: '',
        userName: '',
        rio: '',
        currentCityOfPosting: '',
        metalStampNo: '',
        iePinPoiList: [
            { id: Date.now(), product: '', companyName: '', unitName: '', pinCode: '', poiCode: '', ieType: '', units: [] }
        ],
        // New structure for Process IE
        iePoiMappings: [
            { id: Date.now(), ieUserId: '', ieUserName: '', companyName: '', unitName: '', poiCode: '', units: [] }
        ],
        controllingManagerUserId: ''
    });

    const REGIONS = ['NRIO', 'WRIO', 'SRIO', 'ERIO', 'CRIO'];
    const PRODUCTS = ['ERC', 'RailPad', 'Sleeper'];
    const IE_TYPES = ['Primary', 'Secondary'];
    const ROLES = ['IE', 'Process IE', 'Secondary IE'];

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch users for the current selected role (e.g. Process IE users)
                const [roleUsers, companyList] = await Promise.all([
                    getUsersByRole(selectedRole),
                    getCompanies()
                ]);
                setUsers(roleUsers || []);
                setCompanies(companyList || []);

                // If role is Process IE, we also need the list of Process IEs for mapping
                if (selectedRole === 'Process IE') {
                    const ies = await getUsersByRole('Process IE');
                    setIeUsers(ies || []);
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [selectedRole, getUsersByRole, getCompanies]);

    const handleMainInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'userId') {
            const selectedUser = users.find(u => String(u.userId) === String(value));
            setFormData(prev => ({
                ...prev,
                userId: value,
                userName: selectedUser ? selectedUser.userName : ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Mapping changes for IE Role
    const handleIEMappingChange = async (index, name, value) => {
        const newList = [...formData.iePinPoiList];
        newList[index][name] = value;

        if (name === 'companyName') {
            newList[index].unitName = '';
            newList[index].pinCode = '';
            newList[index].poiCode = '';
            newList[index].units = [];
            if (value) {
                const units = await getUnitsByCompany(value);
                newList[index].units = units || [];
            }
        } else if (name === 'unitName') {
            // Check for duplicate Company + Unit combination
            if (value && newList[index].companyName) {
                const isDuplicate = formData.iePinPoiList.some((item, idx) =>
                    idx !== index &&
                    item.companyName === newList[index].companyName &&
                    item.unitName === value
                );

                if (isDuplicate) {
                    alert(`Duplicate Entry: The combination of "${newList[index].companyName}" and "${value}" is already added in another mapping row.`);
                    newList[index].unitName = ''; // Reset the selection
                    setFormData(prev => ({ ...prev, iePinPoiList: newList }));
                    return;
                }

                try {
                    const details = await getMappingDetails(newList[index].companyName, value);
                    if (details) {
                        newList[index].pinCode = details.pinCode;
                        newList[index].poiCode = details.poiCode;
                    } else {
                        alert(`Warning: Could not fetch mapping details for ${value}.`);
                    }
                } catch (err) { console.error(err); }
            }
        }

        setFormData(prev => ({ ...prev, iePinPoiList: newList }));
    };

    // Mapping changes for Process IE Role
    const handleProcessMappingChange = async (index, name, value) => {
        const newList = [...formData.iePoiMappings];

        if (name === 'ieUser') {
            // value is the whole user object from SearchableSelect
            newList[index].ieUserId = value.userId;
            newList[index].ieUserName = value.userName;
        } else if (name === 'companyName') {
            newList[index].companyName = value;
            newList[index].unitName = '';
            newList[index].poiCode = '';
            newList[index].units = [];
            if (value) {
                const units = await getUnitsByCompany(value);
                newList[index].units = units || [];
            }
        } else if (name === 'unitName') {
            newList[index].unitName = value;
            if (value && newList[index].companyName) {
                // Check for duplicate IE + POI combination
                const isDuplicate = formData.iePoiMappings.some((item, idx) =>
                    idx !== index &&
                    item.ieUserId === newList[index].ieUserId &&
                    item.companyName === newList[index].companyName &&
                    item.unitName === value
                );

                if (isDuplicate) {
                    alert(`Duplicate Entry: This IE is already mapped to "${newList[index].companyName} - ${value}" in another row.`);
                    newList[index].unitName = ''; // Reset
                    setFormData(prev => ({ ...prev, iePoiMappings: newList }));
                    return;
                }

                try {
                    const details = await getMappingDetails(newList[index].companyName, value);
                    if (details) {
                        newList[index].poiCode = details.poiCode;
                    }
                } catch (err) { console.error(err); }
            }
        } else {
            newList[index][name] = value;
        }

        setFormData(prev => ({ ...prev, iePoiMappings: newList }));
    };

    const addMappingRow = () => {
        if (selectedRole === 'Process IE') {
            setFormData(prev => ({
                ...prev,
                iePoiMappings: [
                    ...prev.iePoiMappings,
                    { id: Date.now(), ieUserId: '', ieUserName: '', companyName: '', unitName: '', poiCode: '', units: [] }
                ]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                iePinPoiList: [
                    ...prev.iePinPoiList,
                    { id: Date.now(), product: '', companyName: '', unitName: '', pinCode: '', poiCode: '', ieType: '', units: [] }
                ]
            }));
        }
    };

    const removeMappingRow = (id) => {
        if (selectedRole === 'Process IE') {
            if (formData.iePoiMappings.length === 1) return;
            setFormData(prev => ({
                ...prev,
                iePoiMappings: prev.iePoiMappings.filter(item => item.id !== id)
            }));
        } else {
            if (formData.iePinPoiList.length === 1) return;
            setFormData(prev => ({
                ...prev,
                iePinPoiList: prev.iePinPoiList.filter(item => item.id !== id)
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.userId) {
            alert('Please select a profile user (Username)');
            return;
        }

        let isIncomplete = false;
        if (selectedRole === 'Process IE') {
            isIncomplete = formData.iePoiMappings.some(item => !item.ieUserId || !item.poiCode);
        } else {
            isIncomplete = formData.iePinPoiList.some(item =>
                !item.product || !item.companyName || !item.unitName || !item.pinCode || !item.poiCode || !item.ieType
            );
        }

        if (isIncomplete) {
            alert('Please ensure all mapping fields are correctly selected.');
            return;
        }

        // Final duplicate check before submission
        if (selectedRole === 'IE') {
            const seen = new Set();
            for (const item of formData.iePinPoiList) {
                const key = `${item.companyName}-${item.unitName}`;
                if (seen.has(key)) {
                    alert(`Submission Error: Multiple entries found for ${item.companyName} - ${item.unitName}. Please remove duplicates.`);
                    return;
                }
                seen.add(key);
            }
        }

        // Structure the data as expected by backend
        const submissionData = {
            ...formData,
            role: selectedRole,
            userId: parseInt(formData.userId)
        };
        onSubmit(submissionData);
    };

    if (selectedRole === 'Secondary IE') {
        return (
            <div className="user-form-professional">
                <div className="form-section">
                    <h3 className="form-section-title">Role Configuration</h3>
                    <div className="form-group">
                        <label className="form-label">Role Category</label>
                        <select className="form-control" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>🚧</div>
                    <h4>Secondary IE Form - Under Construction</h4>
                    <p>This role mapping functionality will be available in a future update.</p>
                    <button className="btn btn-secondary" onClick={onCancel} style={{ marginTop: '20px' }}>Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-form-professional">
            <form onSubmit={handleSubmit}>
                {/* Role Selection */}
                <div className="form-section">
                    <h3 className="form-section-title">Role Configuration</h3>
                    <div className="form-group">
                        <label className="form-label">Role Category</label>
                        <select
                            className="form-control"
                            value={selectedRole}
                            onChange={(e) => {
                                setSelectedRole(e.target.value);
                                // Reset form data on role change
                                setFormData(prev => ({
                                    ...prev,
                                    userId: '',
                                    userName: ''
                                }));
                            }}
                        >
                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                </div>

                {/* User Information */}
                <div className="form-section">
                    <h3 className="form-section-title">Mapping Profile</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Username <small className="required-star">*</small></label>
                            <select
                                name="userId"
                                className="form-control"
                                value={formData.userId}
                                onChange={handleMainInputChange}
                                required
                            >
                                <option value="">Select User</option>
                                {users.map(u => (
                                    <option key={u.userId} value={u.userId}>{u.userName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">User ID (System)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.userId}
                                disabled
                                placeholder="Auto-filled"
                            />
                        </div>
                    </div>

                    {selectedRole === 'IE' && (
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Region (RIO) <small className="required-star">*</small></label>
                                <select
                                    name="rio"
                                    className="form-control"
                                    value={formData.rio}
                                    onChange={handleMainInputChange}
                                    required
                                >
                                    <option value="">Select Region</option>
                                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current City of Posting</label>
                                <input
                                    type="text"
                                    name="currentCityOfPosting"
                                    className="form-control"
                                    value={formData.currentCityOfPosting}
                                    onChange={handleMainInputChange}
                                    placeholder="Enter city name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Metal Stamp No.</label>
                                <input
                                    type="number"
                                    name="metalStampNo"
                                    className="form-control"
                                    value={formData.metalStampNo}
                                    onChange={handleMainInputChange}
                                    placeholder="Enter stamp number"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Dynamic Mapping List */}
                <div className="form-section">
                    <h3 className="form-section-title">
                        {selectedRole === 'Process IE' ? 'IE to POI Mapping' : 'Pin/PoI Mapping List'}
                    </h3>

                    {/* IE Role Mapping UI */}
                    {selectedRole === 'IE' && formData.iePinPoiList.map((item, index) => (
                        <div key={item.id} className="mapping-card">
                            <div className="mapping-card-header">
                                <span className="mapping-card-title">Mapping Entry #{index + 1}</span>
                                {formData.iePinPoiList.length > 1 && (
                                    <button type="button" className="remove-btn" onClick={() => removeMappingRow(item.id)}>&times;</button>
                                )}
                            </div>
                            <div className="mapping-grid">
                                <div className="form-group">
                                    <label className="form-label">Product <small className="required-star">*</small></label>
                                    <select className="form-control" value={item.product} onChange={(e) => handleIEMappingChange(index, 'product', e.target.value)} required>
                                        <option value="">Select Product</option>
                                        {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IE Type <small className="required-star">*</small></label>
                                    <select className="form-control" value={item.ieType} onChange={(e) => handleIEMappingChange(index, 'ieType', e.target.value)} required>
                                        <option value="">Select Type</option>
                                        {IE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group mapping-full-row">
                                    <label className="form-label">Company Name <small className="required-star">*</small></label>
                                    <SearchableSelect options={companies} value={item.companyName} onChange={(val) => handleIEMappingChange(index, 'companyName', val)} placeholder="Select Company" />
                                </div>
                                <div className="form-group mapping-full-row">
                                    <label className="form-label">Unit Name <small className="required-star">*</small></label>
                                    <SearchableSelect options={item.units} value={item.unitName} onChange={(val) => handleIEMappingChange(index, 'unitName', val)} placeholder="Select Unit" disabled={!item.companyName} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Process IE Role Mapping UI */}
                    {selectedRole === 'Process IE' && formData.iePoiMappings.map((item, index) => (
                        <div key={item.id} className="mapping-card">
                            <div className="mapping-card-header">
                                <span className="mapping-card-title">IE Mapping Entry #{index + 1}</span>
                                {formData.iePoiMappings.length > 1 && (
                                    <button type="button" className="remove-btn" onClick={() => removeMappingRow(item.id)}>&times;</button>
                                )}
                            </div>
                            <div className="mapping-grid">
                                <div className="form-group">
                                    <label className="form-label">IE Username <small className="required-star">*</small></label>
                                    <SearchableSelect
                                        options={ieUsers}
                                        value={item.ieUserId}
                                        displayKey="userName"
                                        valueKey="userId"
                                        onChange={(val) => handleProcessMappingChange(index, 'ieUser', val)}
                                        placeholder="Select IE"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IE User ID</label>
                                    <input type="text" className="form-control" value={item.ieUserId} disabled placeholder="Auto-filled" />
                                </div>
                                <div className="form-group mapping-full-row">
                                    <label className="form-label">Company Name (POI) <small className="required-star">*</small></label>
                                    <SearchableSelect options={companies} value={item.companyName} onChange={(val) => handleProcessMappingChange(index, 'companyName', val)} placeholder="Select Company" />
                                </div>
                                <div className="form-group mapping-full-row">
                                    <label className="form-label">Unit Name (POI) <small className="required-star">*</small></label>
                                    <SearchableSelect options={item.units} value={item.unitName} onChange={(val) => handleProcessMappingChange(index, 'unitName', val)} placeholder="Select Unit" disabled={!item.companyName} />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button type="button" className="add-mapping-btn" onClick={addMappingRow}>
                        <span>+</span> {selectedRole === 'Process IE' ? 'Add Another IE Mapping' : 'Add Another Mapping'}
                    </button>
                </div>

                <div className="form-actions" style={{ marginTop: '30px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : `Save ${selectedRole} Mapping`}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
