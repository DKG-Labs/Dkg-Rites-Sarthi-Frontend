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

export const IEFieldsForm = ({ 
    onSubmit, 
    onCancel, 
    getUsersByRole, 
    getCompanies, 
    getUnitsByCompany, 
    getMappingDetails,
    getSleeperEmployeesByRole,
    getSleeperCompanies,
    getSleeperPlants,
    getSleeperMappedEmployees
}) => {
    const [productType, setProductType] = useState('ERC');
    const [mappingType, setMappingType] = useState('employee wise'); // 'employee wise' or 'company wise' (for Sleeper)
    const [selectedRole, setSelectedRole] = useState('IE');
    const [users, setUsers] = useState([]); // Users for the MAIN profile (based on selectedRole)
    const [ieUsers, setIeUsers] = useState([]); // List of IEs (role 'IE') for Process IE mapping
    const [companies, setCompanies] = useState([]);
    const [sleeperPlants, setSleeperPlants] = useState([]);
    const [mappedEmployees, setMappedEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);

    const [formData, setFormData] = useState({
        userId: '',
        userName: '',
        rio: '',
        currentCityOfPosting: '',
        metalStampNo: '',
        iePinPoiList: [
            { id: Date.now(), product: 'ERC', companyName: '', unitName: '', pinCode: '', poiCode: '', ieType: '', units: [] }
        ],
        // New structure for Process IE
        iePoiMappings: [
            { id: Date.now(), ieUserId: '', ieUserName: '', companyName: '', unitName: '', poiCode: '', units: [] }
        ],
        controllingManagerUserId: '',
        // Sleeper specific
        sleeperMapping: {
            roleId: '',
            roleName: '',
            employeeId: '',
            employeeName: '',
            employeeCode: '',
            companyName: '',
            vendorCode: '',
            poiCode: '',
            plantId: '',
            plantName: '',
            selectedEmployees: [] // For company wise mapping
        }
    });

    const PRODUCT_TYPES = ['ERC', 'SLEEPER', 'RAILPAD'];
    const MAPPING_TYPES = [
        { label: 'Employee Wise', value: 'employee wise' },
        { label: 'Company Wise', value: 'company wise' }
    ];
    const REGIONS = ['NRIO', 'WRIO', 'SRIO', 'ERIO', 'CRIO'];
    const PRODUCTS = ['ERC', 'RailPad', 'Sleeper'];
    const IE_TYPES = ['Primary', 'Secondary'];
    
    // Dynamic roles based on product type
    const ROLES = React.useMemo(() => {
        if (productType === 'SLEEPER') {
            return [
                { name: 'Main IE', id: 10 },
                { name: 'Process IE', id: 14 }
            ];
        }
        return [
            { name: 'IE', id: null },
            { name: 'Process IE', id: null },
            { name: 'Secondary IE', id: null }
        ];
    }, [productType]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                if (productType === 'SLEEPER') {
                    const roleId = ROLES.find(r => r.name === selectedRole)?.id || 10;
                    const [roleUsers, sleeperCompanies] = await Promise.all([
                        getSleeperEmployeesByRole(roleId),
                        getSleeperCompanies()
                    ]);
                    setUsers(roleUsers || []);
                    setCompanies(sleeperCompanies || []);
                } else {
                    const [roleUsers, companyList] = await Promise.all([
                        getUsersByRole(selectedRole),
                        getCompanies()
                    ]);
                    setUsers(roleUsers || []);
                    setCompanies(companyList || []);

                    if (selectedRole === 'Process IE') {
                        const ies = await getUsersByRole('Process IE');
                        setIeUsers(ies || []);
                    }
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [selectedRole, productType, getUsersByRole, getCompanies, getSleeperEmployeesByRole, getSleeperCompanies, ROLES]);

    const { companyName: sleeperCompanyName, plantId: sleeperPlantId } = formData.sleeperMapping;

    // Sleeper Validation Effect
    useEffect(() => {
        const validateSleeperMapping = async () => {
            if (productType === 'SLEEPER' && sleeperCompanyName && sleeperPlantId && selectedRole) {
                setValidating(true);
                try {
                    const alreadyMapped = await getSleeperMappedEmployees(sleeperCompanyName, sleeperPlantId, selectedRole);
                    setMappedEmployees(alreadyMapped || []);
                } catch (error) {
                    console.error('Error validating sleeper mapping:', error);
                    setMappedEmployees([]);
                } finally {
                    setValidating(false);
                }
            } else {
                setMappedEmployees([]);
            }
        };

        const timer = setTimeout(validateSleeperMapping, 500); // Debounce
        return () => clearTimeout(timer);
    }, [sleeperCompanyName, sleeperPlantId, selectedRole, productType, getSleeperMappedEmployees]);

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

    const handleSleeperInputChange = async (name, value) => {
        if (name === 'employee') {
            setFormData(prev => ({
                ...prev,
                sleeperMapping: {
                    ...prev.sleeperMapping,
                    employeeId: value.userId,
                    employeeCode: value.employeeCode
                }
            }));
        } else if (name === 'company') {
            setLoading(true);
            try {
                const plants = await getSleeperPlants(value.vendorCode);
                setSleeperPlants(plants || []);
                setFormData(prev => ({
                    ...prev,
                    sleeperMapping: {
                        ...prev.sleeperMapping,
                        companyName: value.companyName,
                        vendorCode: value.vendorCode,
                        poiCode: value.poiCode,
                        plantId: '' // Reset plant on company change
                    }
                }));
            } catch (error) {
                console.error('Error fetching plants:', error);
            } finally {
                setLoading(false);
            }
        } else if (name === 'selectedEmployees') {
            setFormData(prev => ({
                ...prev,
                sleeperMapping: {
                    ...prev.sleeperMapping,
                    selectedEmployees: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                sleeperMapping: {
                    ...prev.sleeperMapping,
                    [name]: value
                }
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
                    { id: Date.now(), product: productType, companyName: '', unitName: '', pinCode: '', poiCode: '', ieType: '', units: [] }
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

        if (productType === 'SLEEPER') {
            // Sleeper validation
            const { sleeperMapping } = formData;
            if (mappingType === 'employee wise') {
                if (!sleeperMapping.employeeCode || !sleeperMapping.poiCode || !sleeperMapping.plantId) {
                    alert('Please fill all fields for Sleeper Employee mapping');
                    return;
                }
            } else {
                if (!sleeperMapping.poiCode || !sleeperMapping.plantId || sleeperMapping.selectedEmployees.length === 0) {
                    alert('Please fill all fields for Sleeper Company mapping');
                    return;
                }
            }
            
            const submissionData = {
                productType,
                mappingType,
                role: selectedRole,
                roleId: ROLES.find(r => r.name === selectedRole)?.id,
                sleeperMapping
            };
            onSubmit(submissionData);
            return;
        }

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
            productType,
            role: selectedRole,
            userId: parseInt(formData.userId)
        };
        onSubmit(submissionData);
    };

    const [multiSearchTerm, setMultiSearchTerm] = useState('');

    const toggleMultiSelectEmployee = (employee) => {
        const current = formData.sleeperMapping.selectedEmployees;
        const exists = current.find(e => e.userId === employee.userId);
        let updated;
        if (exists) {
            updated = current.filter(e => e.userId !== employee.userId);
        } else {
            updated = [...current, employee];
        }
        handleSleeperInputChange('selectedEmployees', updated);
    };

    // Filtered users for multi-select
    const filteredMultiUsers = users.filter(u => 
        (u.employeeCode && u.employeeCode.toString().toLowerCase().includes(multiSearchTerm.toLowerCase())) ||
        (u.userId && u.userId.toString().includes(multiSearchTerm))
    );

    if (selectedRole === 'Secondary IE' && productType !== 'SLEEPER') {
        return (
            <div className="user-form-professional">
                <div className="form-section">
                    <h3 className="form-section-title">Product & Role Configuration</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Product Type</label>
                            <select className="form-control" value={productType} onChange={(e) => setProductType(e.target.value)}>
                                {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role Category</label>
                            <select className="form-control" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                {ROLES.map(role => <option key={role.name} value={role.name}>{role.name}</option>)}
                            </select>
                        </div>
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
                {/* Product & Role Selection */}
                <div className="form-section">
                    <h3 className="form-section-title">Configuration</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Product Type <small className="required-star">*</small></label>
                            <select
                                className="form-control"
                                value={productType}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setProductType(val);
                                    // Reset role when product type changes to ensure valid roles
                                    if (val === 'SLEEPER') {
                                        setSelectedRole('Main IE');
                                    } else {
                                        setSelectedRole('IE');
                                    }
                                }}
                            >
                                {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        {productType === 'SLEEPER' && (
                            <div className="form-group">
                                <label className="form-label">Mapping Type <small className="required-star">*</small></label>
                                <select
                                    className="form-control"
                                    value={mappingType}
                                    onChange={(e) => setMappingType(e.target.value)}
                                >
                                    {MAPPING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Role Category <small className="required-star">*</small></label>
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
                                {ROLES.map(role => <option key={role.name} value={role.name}>{role.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sleeper Form */}
                {productType === 'SLEEPER' ? (
                    <div className="form-section">
                        <h3 className="form-section-title">
                            Sleeper {mappingType === 'employee wise' ? 'Employee' : 'Company'} Mapping
                        </h3>
                        
                        <div className="mapping-card">
                            <div className="form-grid">
                                {mappingType === 'employee wise' ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Select Employee (Code) <small className="required-star">*</small></label>
                                            <SearchableSelect
                                                options={users}
                                                value={formData.sleeperMapping.employeeId}
                                                displayKey="employeeCode"
                                                valueKey="userId"
                                                onChange={(val) => handleSleeperInputChange('employee', val)}
                                                placeholder="Search Employee Code..."
                                            />
                                        </div>
                                    </>
                                ) : null}

                                <div className="form-group mapping-full-row">
                                    <label className="form-label">Company Name <small className="required-star">*</small></label>
                                    <SearchableSelect
                                        options={companies}
                                        value={formData.sleeperMapping.vendorCode}
                                        displayKey="companyName"
                                        valueKey="vendorCode"
                                        onChange={(val) => handleSleeperInputChange('company', val)}
                                        placeholder="Select Company"
                                    />
                                </div>

                                <div className="form-group mapping-full-row">
                                    <label className="form-label">Plant ID <small className="required-star">*</small></label>
                                    <SearchableSelect
                                        options={sleeperPlants}
                                        value={formData.sleeperMapping.plantId}
                                        onChange={(val) => handleSleeperInputChange('plantId', val)}
                                        placeholder="Select Plant"
                                        disabled={!formData.sleeperMapping.vendorCode}
                                    />
                                </div>

                                {mappingType === 'company wise' && (
                                    <div className="form-group mapping-full-row">
                                        <label className="form-label">Select Employees (Code) <small className="required-star">*</small></label>
                                        <div className="multi-select-search" style={{ marginBottom: '8px' }}>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                placeholder="Search Employee Code or User ID..." 
                                                value={multiSearchTerm}
                                                onChange={(e) => setMultiSearchTerm(e.target.value)}
                                                style={{ height: '36px', fontSize: '12px' }}
                                            />
                                        </div>
                                        <div className="multi-select-container">
                                            {filteredMultiUsers.map(u => (
                                                <div key={u.userId} className="multi-select-item" onClick={() => toggleMultiSelectEmployee(u)}>
                                                    <input
                                                        type="checkbox"
                                                        id={`emp-${u.userId}`}
                                                        checked={formData.sleeperMapping.selectedEmployees.some(e => e.userId === u.userId)}
                                                        onChange={(e) => e.stopPropagation()}
                                                        style={{ pointerEvents: 'none' }}
                                                    />
                                                    <label htmlFor={`emp-${u.userId}`}>{u.employeeCode} (User ID: {u.userId})</label>
                                                </div>
                                            ))}
                                            {filteredMultiUsers.length === 0 && <div style={{ color: '#999', textAlign: 'center', padding: '10px' }}>No matching employees found</div>}
                                        </div>
                                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--secondary-color)', fontWeight: '600' }}>
                                            Selected: {formData.sleeperMapping.selectedEmployees.length} employees
                                        </div>
                                    </div>
                                )}
                            </div>

                            {formData.sleeperMapping.plantId && (
                                <div className="validation-info-box">
                                    <h4 className="validation-info-title">
                                        <span>ℹ️</span> Validation Info
                                    </h4>
                                    <div className="validation-info-content">
                                        {validating ? (
                                            <p>Validating existing mappings for plant <strong>{formData.sleeperMapping.plantId}</strong>...</p>
                                        ) : (
                                            <>
                                                <p style={{ marginBottom: '8px' }}>
                                                    Already mapped employees for <strong>{formData.sleeperMapping.plantId}</strong> ({selectedRole}):
                                                </p>
                                                {mappedEmployees.length > 0 ? (
                                                    <ul style={{ paddingLeft: '18px', margin: 0 }}>
                                                        {mappedEmployees.map((emp, idx) => (
                                                            <li key={idx} style={{ color: 'var(--danger-color)', fontWeight: '600' }}>
                                                                {emp.employeeCode} (User ID: {emp.userId})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p style={{ color: 'var(--success-color)', fontWeight: '500' }}>
                                                        ✅ No employees currently mapped to this plant for this role.
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* User Information (Profile) */}
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

                        {/* Dynamic Mapping List (ERC/RailPad) */}
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
                    </>
                )}

                <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Submit'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
