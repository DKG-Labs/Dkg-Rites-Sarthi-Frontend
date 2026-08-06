import React, { useState } from 'react';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { MasterList } from './MasterList';
import { MasterForm } from './MasterForm';
import { CalibrationList } from './CalibrationList';
import { CalibrationForm } from './CalibrationForm';
import { IEMapping } from './IEMapping';
import { IEFieldsForm } from './IEFieldsForm';
import { Modal } from './Modal';
import { API_BASE_URL } from '../../services/apiConfig';
import { getStoredUser } from '../../services/authService';
import { Snackbar, Alert } from '@mui/material';
import './admin.css';

export const parseUserFriendlyErrorMessage = (rawErrorMsg) => {
    if (!rawErrorMsg) return 'Failed to save user. Please try again.';
    const msg = String(rawErrorMsg);
    const upper = msg.toUpperCase();

    if (upper.includes('SHORT_NAME') || upper.includes('SHORT NAME')) {
        return 'Short Name already registered. Please enter a unique Short Name.';
    }
    if (upper.includes('EMPLOYEE_CODE') || upper.includes('RITES_EMPLOYEE_CODE') || upper.includes('EMPLOYEE CODE')) {
        return 'Employee Code already registered. Please enter a unique Employee Code.';
    }
    if (upper.includes('EMAIL')) {
        return 'Email address already registered. Please enter a unique Email.';
    }
    if (upper.includes('MOBILE')) {
        return 'Mobile number already registered.';
    }

    const dupMatch = msg.match(/Duplicate entry '([^']+)'/i);
    if (dupMatch && dupMatch[1]) {
        return `'${dupMatch[1]}' is already registered in the system.`;
    }

    let cleaned = msg
        .replace(/could not execute statement/gi, '')
        .replace(/\[insert into [^\]]+\]/gi, '')
        .replace(/\[update [^\]]+\]/gi, '')
        .replace(/for key '[^']+'/gi, '')
        .replace(/\[.*?\]/g, '')
        .replace(/JDBC exception executing SQL/gi, '')
        .trim();

    if (!cleaned || cleaned.length < 3) {
        return 'User already exists or duplicate details provided.';
    }

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export const AdminDashboard = () => {
    const [activeModule, setActiveModule] = useState(() => {
        return localStorage.getItem('adminActiveModule') || 'users';
    });

    const handleModuleSelect = (moduleName) => {
        localStorage.setItem('adminActiveModule', moduleName);
        setActiveModule(moduleName);
    };
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formError, setFormError] = useState(null);
    const [isSubmittingUser, setIsSubmittingUser] = useState(false);
    const refreshData = () => setRefreshTrigger(prev => prev + 1);

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

// Fetch roles for dropdown
    React.useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [roleList, userList] = await Promise.all([
                    getRolesApi().catch(err => { console.error(err); return []; }),
                    getUsersApi().catch(err => { console.error(err); return []; })
                ]);
                setRoles(roleList || []);
                setUsers(userList || []);
            } catch (error) {
                console.error('Error fetching initial admin data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [refreshTrigger]);

    // User Module Handlers
    const handleCreateUser = () => {
        setSelectedItem(null);
        setFormError(null);
        setIsSubmittingUser(false);
        setModalTitle('Create New User');
        setModalContent('user-form');
        setModalOpen(true);
    };

    const handleEditUser = (user) => {
        setSelectedItem(user);
        setFormError(null);
        setIsSubmittingUser(false);
        setModalTitle('Edit User');
        setModalContent('user-form');
        setModalOpen(true);
    };


    const handleChangeRegion = (user) => {
        setSelectedItem(user);
        setModalTitle('Change User Region');
        setModalContent('change-region');
        setModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUserApi(userId);
                setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
                refreshData();
            } catch (error) {
                setSnackbar({ open: true, message: 'Failed to delete user: ' + parseUserFriendlyErrorMessage(error.message), severity: 'error' });
            }
        }
    };

    const handleSubmitUser = async (formData) => {
        setIsSubmittingUser(true);
        try {
            setFormError(null);
            const currentUser = getStoredUser();
            const dataToSubmit = {
                ...formData,
                createdBy: currentUser?.userId || 'Admin'
            };

            if (selectedItem || dataToSubmit.userId || dataToSubmit.id) {
                await updateUserApi(dataToSubmit);
            } else {
                await createUserApi(dataToSubmit);
            }
            
            refreshData();
            setModalOpen(false);
            setSelectedItem(null);
            setSnackbar({ open: true, message: 'User saved successfully!', severity: 'success' });
        } catch (error) {
            console.error('Error submitting user:', error);
            const userFriendlyMsg = parseUserFriendlyErrorMessage(error.message);
            setFormError(userFriendlyMsg);
            setSnackbar({ open: true, message: userFriendlyMsg, severity: 'error' });
        } finally {
            setIsSubmittingUser(false);
        }
    };

    // Master Module Handlers
    const handleCreateMaster = () => {
        setSelectedItem(null);
        setModalTitle('Create New Master');
        setModalContent('master-form');
        setModalOpen(true);
    };

    const handleEditMaster = (master) => {
        setSelectedItem(master);
        setModalTitle('Edit Master');
        setModalContent('master-form');
        setModalOpen(true);
    };

    const handleDeleteMaster = (masterId) => {
        if (window.confirm('Are you sure you want to delete this master?')) {
            alert('Master deleted successfully');
        }
    };

    const handleApproveMaster = (masterId) => {
        alert('Master approved successfully');
    };

    const handleSubmitMaster = (formData) => {
        alert(selectedItem ? 'Master updated successfully' : 'Master created successfully');
        setModalOpen(false);
    };

    const handleSubmitCalibration = (formData) => {
        alert(selectedItem ? 'Calibration updated successfully' : 'Calibration created successfully');
        setModalOpen(false);
    };

    const handleSubmitMapping = async (formData) => {
        try {
            const { userId, role, productType, ...mappingData } = formData;

            if (productType === 'SLEEPER') {
                // Sleeper specific mapping submission
                const { sleeperMapping, mappingType } = formData;
                let existingId = null;
                if (selectedItem && selectedItem.id) {
                    const idStr = String(selectedItem.id);
                    if (idStr.startsWith('sleeper_')) {
                        existingId = parseInt(idStr.substring(8), 10);
                    } else if (!isNaN(Number(idStr))) {
                        existingId = parseInt(idStr, 10);
                    }
                }
                
                if (mappingType === 'employee wise') {
                    const payload = {
                        id: existingId,
                        poiCode: sleeperMapping.poiCode,
                        plantId: sleeperMapping.plantId,
                        employeeCode: sleeperMapping.employeeCode,
                        ieType: role
                    };
                    await saveSleeperMappingApi(payload);
                } else {
                    // Company wise mapping (multiple employees)
                    const payload = {
                        poiCode: sleeperMapping.poiCode,
                        plantId: sleeperMapping.plantId,
                        ieType: role,
                        employeeCodes: sleeperMapping.selectedEmployees
                    };
                    await saveCompanyWiseSleeperMappingApi(payload);
                }
            } else if (productType === 'RAILPAD') {
                // Railpad specific mapping submission
                const { railpadMapping } = formData;
                let existingId = null;
                if (selectedItem && selectedItem.id) {
                    const idStr = String(selectedItem.id);
                    if (idStr.startsWith('rail_')) {
                        existingId = parseInt(idStr.substring(5), 10);
                    } else if (!isNaN(Number(idStr))) {
                        existingId = parseInt(idStr, 10);
                    }
                }
                const payload = {
                    id: existingId,
                    poiCode: railpadMapping.poiCode,
                    plantId: railpadMapping.plantId,
                    ieUserId: railpadMapping.employeeId,
                    ieType: (role && role.includes('Main')) || formData.roleId === 'Rail Main IE' ? 'MAIN_IE' : 'PROCESS_IE'
                };
                await saveRailpadMappingApi(payload);
            } else {
                // Original IE/ERC mapping logic
                if (!userId) {
                    setSnackbar({ open: true, message: 'Please select a user', severity: 'warning' });
                    return;
                }

                if (role === 'Process IE') {
                    const processData = {
                        iePoiMappings: mappingData.iePoiMappings.map(item => ({
                            ieUserId: item.ieUserId,
                            poiCodes: [item.poiCode]
                        }))
                    };
                    const currentUser = getStoredUser();
                    let createdBy = currentUser?.userId || "1";
                    if (!createdBy || isNaN(Number(createdBy))) {
                        createdBy = "1";
                    }
                    await saveProcessIeMappingApi(userId, processData, createdBy);
                } else {
                    await saveIeMappingApi(userId, mappingData);
                }
            }

            localStorage.setItem('adminActiveModule', 'mapping');
            setSnackbar({ open: true, message: selectedItem ? 'Mapping updated successfully!' : 'Mapping created successfully!', severity: 'success' });
            setModalOpen(false);
            refreshData();
            setTimeout(() => {
                window.location.reload();
            }, 300);
        } catch (error) {
            console.error('Error saving mapping:', error);
            setSnackbar({ open: true, message: error.message || 'Failed to save mapping. Please verify your inputs and try again.', severity: 'error' });
        }
    };

    // Calibration Handlers
    const handleCreateCalibration = () => {
        setSelectedItem(null);
        setModalTitle('Add Calibration Record');
        setModalContent('calibration-form');
        setModalOpen(true);
    };

    const handleEditCalibration = (cal) => {
        setSelectedItem(cal);
        setModalTitle('Edit Calibration Record');
        setModalContent('calibration-form');
        setModalOpen(true);
    };

    const handleDeleteCalibration = (calId) => {
        if (window.confirm('Are you sure you want to delete this calibration record?')) {
            alert('Calibration record deleted successfully');
        }
    };

    const handleUploadCertificate = (cal) => {
        alert('Certificate upload feature - to be implemented');
    };

    // IE Mapping Handlers
    const handleCreateMapping = () => {
        setSelectedItem(null);
        setModalTitle('Create IE Mapping');
        setModalContent('mapping-form');
        setModalOpen(true);
    };

    const handleEditMapping = (mapping) => {
        setSelectedItem(mapping);
        setModalTitle('Edit IE Mapping');
        setModalContent('mapping-form');
        setModalOpen(true);
    };

    const handleDeleteMapping = async (mappingId) => {
        if (window.confirm('Are you sure you want to delete this mapping?')) {
            try {
                await deleteMappingApi(mappingId);
                setSnackbar({ open: true, message: 'Mapping deleted successfully!', severity: 'success' });
                refreshData();
            } catch (error) {
                setSnackbar({ open: true, message: error.message || 'Failed to delete mapping', severity: 'error' });
            }
        }
    };



    return (
        <div className="admin-container">
            {/* Sidebar Navigation */}
            <aside className="admin-sidebar">
                <div style={{ padding: '0 16px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#17a2b8', letterSpacing: '1px' }}>
                        SARTHI
                    </h3>
                    <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Admin Module</p>
                </div>
                <ul className="nav-menu">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeModule === 'users' ? 'active' : ''}`}
                            onClick={() => handleModuleSelect('users')}
                        >
                            <span>👥</span>
                            <span>User Management</span>
                        </button>
                    </li>
                    {/* Hidden Master Data and Calibration menus
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeModule === 'masters' ? 'active' : ''}`}
                            onClick={() => handleModuleSelect('masters')}
                        >
                            <span>📋</span>
                            <span>Master Data</span>
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeModule === 'calibration' ? 'active' : ''}`}
                            onClick={() => handleModuleSelect('calibration')}
                        >
                            <span>🔧</span>
                            <span>Calibration</span>
                        </button>
                    </li>
                    */}
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeModule === 'mapping' ? 'active' : ''}`}
                            onClick={() => handleModuleSelect('mapping')}
                        >
                            <span>🗺️</span>
                            <span>IE Mapping</span>
                        </button>
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <div className="admin-main">


                <div className="admin-content">
                    {activeModule === 'users' && (
                        <UserList
                            users={users}
                            roles={roles}
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                            onChangeRegion={handleChangeRegion}
                            onCreateNew={handleCreateUser}
                            refreshTrigger={refreshTrigger}
                            loading={isLoading}
                        />
                    )}

                    {activeModule === 'masters' && (
                        <MasterList
                            onEdit={handleEditMaster}
                            onDelete={handleDeleteMaster}
                            onCreateNew={handleCreateMaster}
                            onApprove={handleApproveMaster}
                        />
                    )}

                    {activeModule === 'calibration' && (
                        <CalibrationList
                            onEdit={handleEditCalibration}
                            onDelete={handleDeleteCalibration}
                            onCreateNew={handleCreateCalibration}
                            onUploadCertificate={handleUploadCertificate}
                        />
                    )}

                    {activeModule === 'mapping' && (
                        <IEMapping
                            onEdit={handleEditMapping}
                            onDelete={handleDeleteMapping}
                            onCreateNew={handleCreateMapping}
                            refreshTrigger={refreshTrigger}
                            loading={isLoading}
                        />
                    )}
                </div>
            </div>

            {/* Modal for Forms */}
            <Modal
                isOpen={modalOpen}
                title={modalTitle}
                onClose={() => setModalOpen(false)}
            >
                {modalContent === 'user-form' && (
                    <UserForm
                        user={selectedItem}
                        roles={roles}
                        existingUsers={users}
                        onSubmit={handleSubmitUser}
                        onCancel={() => { if (!isSubmittingUser) { setModalOpen(false); setFormError(null); } }}
                        formError={formError}
                        isSubmitting={isSubmittingUser}
                    />
                )}
                {modalContent === 'master-form' && (
                    <MasterForm
                        master={selectedItem}
                        onSubmit={handleSubmitMaster}
                        onCancel={() => setModalOpen(false)}
                    />
                )}
                {modalContent === 'change-region' && (
                    <div>
                        <p>Change region for: <strong>{selectedItem?.name}</strong></p>
                        <div className="form-group">
                            <label className="form-label">New Region</label>
                            <select className="form-control" id="new-region-select">
                                <option value="">Select New Region</option>
                                {['NRIO', 'ERIO', 'WRIO', 'SRIO', 'CRIO'].map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={async () => {
                                const newRegion = document.getElementById('new-region-select').value;
                                if (!newRegion) return window.alert('Please select a region');
                                try {
                                    await changeUserRegionApi(selectedItem.userId || selectedItem.id, newRegion);
                                    window.alert('Region changed successfully');
                                    setModalOpen(false);
                                    refreshData();
                                } catch (error) {
                                    window.alert('Failed to change region: ' + error.message);
                                }
                            }}>
                                Update Region
                            </button>
                        </div>
                    </div>
                )}
                {modalContent === 'calibration-form' && (
                    <CalibrationForm
                        calibration={selectedItem}
                        onSubmit={handleSubmitCalibration}
                        onCancel={() => setModalOpen(false)}
                    />
                )}
                {modalContent === 'mapping-form' && (
                    <IEFieldsForm
                        initialData={selectedItem}
                        onSubmit={handleSubmitMapping}
                        onCancel={() => setModalOpen(false)}
                        getUsersByRole={getUsersByRoleApi}
                        getCompanies={getCompaniesApi}
                        getUnitsByCompany={getUnitsByCompanyApi}
                        getMappingDetails={getMappingDetailsApi}
                        getSleeperEmployeesByRole={getSleeperEmployeesByRoleApi}
                        getSleeperCompanies={getSleeperCompaniesApi}
                        getSleeperPlants={getSleeperPlantsApi}
                        getSleeperMappedEmployees={getSleeperMappedEmployeesApi}
                        getRailpadCompanies={getRailpadCompaniesApi}
                        getRailpadPlants={getRailpadPlantsApi}
                    />
                )}
            </Modal>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};
/**
 * API to fetch all roles
 * Added at the end of file as per instructions
 */
const getRolesApi = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/roles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.responseStatus?.message || 'Error fetching roles');
        }

        if (data.responseStatus?.statusCode !== 0) {
            throw new Error(data.responseStatus?.message || 'API Error');
        }

        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch users by role
 */
const getUsersByRoleApi = async (roleName) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/users/by-role?roleName=${roleName}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch distinct company names
 */
const getCompaniesApi = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/pincode-poi/companies`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch units by company
 */
const getUnitsByCompanyApi = async (companyName) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/pincode-poi/units?companyName=${encodeURIComponent(companyName)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch mapping details
 */
const getMappingDetailsApi = async (companyName, unitName) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/pincode-poi/details?companyName=${encodeURIComponent(companyName)}&unitName=${encodeURIComponent(unitName)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to save IE mapping
 */
const saveIeMappingApi = async (userId, mappingData) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/IeMapping?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(mappingData)
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to save Process IE mapping
 */
const saveProcessIeMappingApi = async (userId, processData, createdBy) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/mapping/processIe?userId=${userId}&createdBy=${createdBy}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(processData)
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch all users
 */
export const getUsersApi = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to update user
 */
export const updateUserApi = async (userData) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/users`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to create user
 */
export const createUserApi = async (userData) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to delete user
 */
export const deleteUserApi = async (userId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to change user region
 */
export const changeUserRegionApi = async (userId, region) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/auth/api/users/${userId}/region`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ region })
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch Sleeper employees by role ID
 */
const getSleeperEmployeesByRoleApi = async (roleId) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/sleeper-mapping/employees-by-role?roleId=${roleId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch Sleeper companies
 */
const getSleeperCompaniesApi = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/sleeper-mapping/sleeper-companies`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch Sleeper plants by vendor code
 */
const getSleeperPlantsApi = async (vendorCode) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/sleeper-mapping/sleeper-plants/${vendorCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        // This endpoint returns a direct list of strings as per user's prompt
        return data; 
    } catch (error) {
        throw error;
    }
};

/**
 * API to save Sleeper mapping
 */
const saveSleeperMappingApi = async (payload) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/sleeper-mapping/sleeperMapping`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};
/**
 * API to fetch already mapped employees for a plant
 */
const getSleeperMappedEmployeesApi = async (companyName, plantId, ieType) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/sleeper-mapping/mapped-emp-list?companyName=${encodeURIComponent(companyName)}&plantId=${encodeURIComponent(plantId)}&ieType=${encodeURIComponent(ieType)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to save Company-wise Sleeper mapping
 */
const saveCompanyWiseSleeperMappingApi = async (payload) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/sleeper-mapping/company-wise-sleeper-mapping`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch Railpad Companies (Manufacturers)
 */
const getRailpadCompaniesApi = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/railpad-vendor-plant/companies`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};

/**
 * API to fetch Railpad Plants
 */
const getRailpadPlantsApi = async (vendorCode) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/railpad-vendor-plant/vendor/${encodeURIComponent(vendorCode)}/plants`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.plants) return data.plants;
        if (data.responseData) return data.responseData.plants || data.responseData;
        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * API to save Railpad mapping
 */
const saveRailpadMappingApi = async (payload) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/railpadMapping`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'API Error');
        return data.responseData;
    } catch (error) {
        throw error;
    }
};


/**
 * API to delete IE mapping
 */
export const deleteMappingApi = async (id) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/mapping/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok || data.responseStatus?.statusCode !== 0) throw new Error(data.responseStatus?.message || 'Error deleting mapping');
        return data;
    } catch (error) {
        throw error;
    }
};
