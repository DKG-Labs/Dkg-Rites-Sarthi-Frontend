import React, { useState, useEffect } from 'react';
import { Select, message } from 'antd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { REGIONS, DESIGNATIONS, DISCIPLINES } from './utils/mockData';
import { API_BASE_URL } from '../../services/apiConfig';

export const UserForm = ({ user, roles = [], rolesLoading = false, existingUsers = [], onSubmit, onCancel, formError, isSubmitting = false }) => {
    const [roleAddPrompt, setRoleAddPrompt] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [fetchedRoles, setFetchedRoles] = useState(roles || []);
    const [isRolesLoading, setIsRolesLoading] = useState(rolesLoading || (roles && roles.length === 0));
    const [roleSearchValue, setRoleSearchValue] = useState('');
    const [isVendorLoading, setIsVendorLoading] = useState(false);

    const showValidationToast = (msg) => {
        message.error({
            content: msg,
            duration: 4,
            style: { marginTop: '40px' }
        });
    };

    useEffect(() => {
        if (formError) {
            showValidationToast(formError);
        }
    }, [formError]);

    useEffect(() => {
        if (!roles || roles.length === 0) {
            setIsRolesLoading(true);
            fetch(`${API_BASE_URL}/api/auth/api/roles`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.responseStatus?.statusCode === 0 && Array.isArray(data.responseData)) {
                    setFetchedRoles(data.responseData);
                }
            })
            .catch(console.error)
            .finally(() => {
                setIsRolesLoading(false);
            });
        } else {
            setFetchedRoles(roles);
            setIsRolesLoading(false);
        }
    }, [roles]);

    const ZONAL_RAILWAY_LIST = [
        'CR', 'ER', 'ECR', 'ECoR', 'NR', 'NCR', 'NER', 'NFR', 'NWR', 'RDSO', 'SR', 'SCR', 'SER', 'SECR', 'SWR', 'WR', 'WCR'
    ];
    const RIO_OPTIONS_LIST = ['WRIO', 'ERIO', 'NRIO', 'SRIO', 'CRIO'];

    // Sleeper Vendor Single Registered Unit (sleeper_pincode_poi_mapping)
    const [sleeperUnit, setSleeperUnit] = useState({
        unitId: null,
        unitName: '',
        unitPinCode: '',
        cin: '',
        unitAddress: '',
        unitDistrict: '',
        unitState: '',
        poiCode: ''
    });

    // Sleeper Vendor Multiple Plants (vendor_plant)
    const [sleeperPlants, setSleeperPlants] = useState([
        {
            id: null,
            plantName: '',
            pinCode: '',
            cin: '',
            address: '',
            district: '',
            state: '',
            zonalRailway: '',
            rio: '',
            contactPerson: '',
            contactPersonNumber: '',
            plantId: '',
            status: 'Active'
        }
    ]);

    const [vendorUnits, setVendorUnits] = useState([
        {
            id: null,
            unitName: '',
            pinCode: '',
            cin: '',
            address: '',
            district: '',
            state: '',
            contactPerson: '',
            contactPersonNumber: '',
            poiCode: '',
            rio: '',
            status: ''
        }
    ]);
    const [formData, setFormData] = useState({
        userName: '',
        password: '',
        roleNames: [],
        email: '',
        mobileNumber: '',
        alternateMobileNumber: '',
        notificationPreferences: '',
        employeeCode: '',
        employmentType: '',
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
        status: ''
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

            const parsedRoles = Array.isArray(user.roleNames) 
                ? user.roleNames 
                : (user.roleName ? user.roleName.split(',').map(r => r.trim()).filter(Boolean) : []);

            const activeVendorRole = user.activeVendorRole;
            const effectiveRoles = activeVendorRole 
                ? [activeVendorRole === 'ERC Vendor' ? 'Vendor' : activeVendorRole] 
                : parsedRoles;

            let normalizedStatus = 'Active';
            if (user.status) {
                normalizedStatus = user.status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
            }

            setFormData(prev => ({
                ...prev,
                ...sanitizedUser,
                fullName: user.fullName || user.name || '',
                employeeCode: user.employeeCode || user.ritesEmployeeCode || '',
                mobileNumber: user.mobileNumber || user.mobileNo || '',
                alternateMobileNumber: user.alternateMobileNumber || '',
                notificationPreferences: user.notificationPreferences || '',
                roleNames: effectiveRoles,
                userId: user.userId || user.id || undefined,
                rio: user.rio || '',
                productType: user.productType || '',
                profilePhotoPath: user.profilePhotoPath || '',
                status: normalizedStatus,
                zonalRly: derivedZonalRly
            }));

            // Fetch vendor units if this is an ERC vendor
            const isV = activeVendorRole 
                ? (activeVendorRole === 'Vendor' || activeVendorRole === 'ERC Vendor')
                : parsedRoles.some(r => r === 'Vendor' || r === 'ERC Vendor');

            if (isV && (user.userId || user.id)) {
                const uid = user.userId || user.id;
                setIsVendorLoading(true);
                fetch(`${API_BASE_URL || ''}/api/auth/api/erc-vendor/${uid}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                })
                .then(r => r.json())
                .then(res => {
                    if (res?.responseData) {
                        const data = res.responseData;
                        setFormData(prev => ({
                            ...prev,
                            fullName: data.companyName || prev.fullName,
                            employeeCode: data.vendorCode || prev.employeeCode,
                            email: data.email || prev.email,
                            status: data.status ? (data.status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') : prev.status
                        }));
                        if (data.units && data.units.length > 0) {
                            setVendorUnits(data.units);
                        }
                    }
                })
                .catch(() => {})
                .finally(() => {
                    setIsVendorLoading(false);
                });
            }

            // Fetch Sleeper vendor single unit and plants if this is a Sleeper Vendor
            const isSleeper = activeVendorRole 
                ? (activeVendorRole === 'Sleeper Vendor')
                : parsedRoles.some(r => r === 'Sleeper Vendor');

            if (isSleeper && (user.userId || user.id)) {
                const uid = user.userId || user.id;
                setIsVendorLoading(true);
                fetch(`${API_BASE_URL || ''}/api/auth/api/sleeper-vendor/${uid}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                })
                .then(r => r.json())
                .then(res => {
                    if (res?.responseData) {
                        const data = res.responseData;
                        setFormData(prev => ({
                            ...prev,
                            fullName: data.companyName || prev.fullName,
                            employeeCode: data.vendorCode || prev.employeeCode,
                            email: data.email || prev.email,
                            status: data.status ? (data.status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active') : prev.status
                        }));
                        if (data.unitName || data.unitPinCode || data.cin || data.unitAddress || data.poiCode) {
                            setSleeperUnit({
                                unitId: data.unitId || null,
                                unitName: data.unitName || '',
                                unitPinCode: data.unitPinCode || '',
                                cin: data.cin || '',
                                unitAddress: data.unitAddress || '',
                                unitDistrict: data.unitDistrict || '',
                                unitState: data.unitState || '',
                                poiCode: data.poiCode || ''
                            });
                        }
                        if (data.plants && data.plants.length > 0) {
                            setSleeperPlants(data.plants);
                        }
                    }
                })
                .catch(() => {})
                .finally(() => {
                    setIsVendorLoading(false);
                });
            }
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
                status: ''
            });
            setVendorUnits([
                {
                    id: null,
                    unitName: '',
                    pinCode: '',
                    cin: '',
                    address: '',
                    district: '',
                    state: '',
                    contactPerson: '',
                    contactPersonNumber: '',
                    poiCode: '',
                    rio: '',
                    status: ''
                }
            ]);
            setSleeperPlants([
                {
                    id: null,
                    plantName: '',
                    pinCode: '',
                    cin: '',
                    address: '',
                    district: '',
                    state: '',
                    zonalRailway: '',
                    rio: '',
                    contactPerson: '',
                    contactPersonNumber: '',
                    plantId: '',
                    status: 'Active'
                }
            ]);
        }
    }, [user]);

    const handleAddUnit = () => {
        setVendorUnits(prev => [
            ...prev,
            {
                id: null,
                unitName: '',
                pinCode: '',
                cin: '',
                address: '',
                district: '',
                state: '',
                contactPerson: '',
                contactPersonNumber: '',
                poiCode: '',
                rio: '',
                status: ''
            }
        ]);
    };

    const handleRemoveUnit = (index) => {
        if (vendorUnits.length <= 1) return;
        setVendorUnits(prev => prev.filter((_, i) => i !== index));
    };

    const handleUnitChange = (index, field, value) => {
        setVendorUnits(prev => {
            const next = [...prev];
            const cleanVal = field === 'contactPersonNumber'
                ? value.replace(/\D/g, '').slice(0, 10)
                : value;
            next[index] = { ...next[index], [field]: cleanVal };
            return next;
        });
    };

    const handleAddPlant = () => {
        setSleeperPlants(prev => [
            ...prev,
            {
                id: null,
                plantName: '',
                pinCode: '',
                cin: '',
                address: '',
                district: '',
                state: '',
                zonalRailway: '',
                rio: '',
                contactPerson: '',
                contactPersonNumber: '',
                plantId: '',
                status: 'Active'
            }
        ]);
    };

    const handleRemovePlant = (index) => {
        if (sleeperPlants.length <= 1) return;
        setSleeperPlants(prev => prev.filter((_, i) => i !== index));
    };

    const handlePlantChange = (index, field, value) => {
        setSleeperPlants(prev => {
            const next = [...prev];
            const cleanVal = field === 'contactPersonNumber'
                ? value.replace(/\D/g, '').slice(0, 10)
                : value;
            next[index] = { ...next[index], [field]: cleanVal };
            return next;
        });
    };

    const handlePlantPinChange = async (index, pin) => {
        const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
        handlePlantChange(index, 'pinCode', cleanPin);

        if (cleanPin.length === 6) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
                const data = await res.json();
                if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                    const po = data[0].PostOffice[0];
                    const dist = po.District || '';
                    const st = po.State || '';
                    handlePlantChange(index, 'district', dist);
                    handlePlantChange(index, 'state', st);
                    
                    const s = st.toUpperCase();
                    let rio = 'WRIO';
                    if (s.includes('WEST BENGAL') || s.includes('BIHAR') || s.includes('JHARKHAND') || s.includes('ODISHA') || s.includes('ASSAM')) {
                        rio = 'ERIO';
                    } else if (s.includes('HARYANA') || s.includes('PUNJAB') || s.includes('DELHI') || s.includes('RAJASTHAN') || s.includes('UTTAR PRADESH') || s.includes('UP') || s.includes('UTTARAKHAND') || s.includes('HIMACHAL') || s.includes('JAMMU')) {
                        rio = 'NRIO';
                    } else if (s.includes('TAMIL') || s.includes('KERALA') || s.includes('KARNATAKA') || s.includes('ANDHRA') || s.includes('TELANGANA')) {
                        rio = 'SRIO';
                    } else if (s.includes('CENTRAL') || s.includes('MADHYA')) {
                        rio = 'CRIO';
                    }
                    handlePlantChange(index, 'rio', rio);
                }
            } catch (err) {
                console.error('Error fetching pincode data:', err);
            }
        }
    };

    const handleSleeperUnitChange = (field, value) => {
        setSleeperUnit(prev => ({ ...prev, [field]: value }));
    };

    const handleSleeperUnitPinChange = async (pin) => {
        const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
        handleSleeperUnitChange('unitPinCode', cleanPin);

        if (cleanPin.length === 6) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
                const data = await res.json();
                if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                    const po = data[0].PostOffice[0];
                    setSleeperUnit(prev => ({
                        ...prev,
                        unitDistrict: po.District || prev.unitDistrict,
                        unitState: po.State || prev.unitState
                    }));
                }
            } catch (err) {
                console.error('Error fetching registered unit pincode data:', err);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'mobileNumber' || name === 'alternateMobileNumber') {
            const cleanDigits = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: cleanDigits }));
            return;
        }

        setFormData(prev => {
            const newState = { ...prev, [name]: value };
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

    const handleConfirmAddRole = () => {
        if (!roleAddPrompt) return;
        const { existing, selectedRole, existingRoles } = roleAddPrompt;
        const updatedRoleNames = [...existingRoles, selectedRole];
        const dataToSubmit = {
            ...existing,
            roleNames: updatedRoleNames,
            userId: existing.userId || existing.id
        };
        Object.keys(dataToSubmit).forEach(key => {
            if (dataToSubmit[key] === '') {
                dataToSubmit[key] = null;
            }
        });
        setRoleAddPrompt(null);
        onSubmit(dataToSubmit);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Password validation if creating new user or explicitly changing password
        if ((!user || formData.password) && formData.password) {
            const pwd = formData.password;
            if (pwd.length < 8) {
                showValidationToast('Password must be at least 8 characters long.');
                return;
            }
            if (!/[A-Z]/.test(pwd)) {
                showValidationToast('Password must contain at least one uppercase letter (A-Z).');
                return;
            }
            if (!/[a-z]/.test(pwd)) {
                showValidationToast('Password must contain at least one lowercase letter (a-z).');
                return;
            }
            if (!/[0-9]/.test(pwd)) {
                showValidationToast('Password must contain at least one numeric digit (0-9).');
                return;
            }
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
                showValidationToast('Password must contain at least one special character (!@#$%^&* etc).');
                return;
            }
        }

        const isSleeperVendor = formData.roleNames.some(r => r === 'Sleeper Vendor');
        const isErcVendor = formData.roleNames.some(r => r === 'Vendor' || r === 'ERC Vendor');

        if (isSleeperVendor) {
            if (!formData.fullName || !formData.fullName.trim()) {
                showValidationToast('Company / Vendor Name is required.');
                return;
            }
            if (!formData.employeeCode || !formData.employeeCode.trim()) {
                showValidationToast('Vendor Code is required.');
                return;
            }

            const seenPlantIds = new Set();
            const seenPlantNames = new Set();

            for (let i = 0; i < sleeperPlants.length; i++) {
                const p = sleeperPlants[i];
                const cleanPlantName = p.plantName?.trim().toLowerCase();
                const cleanPin = p.pinCode?.trim();
                const cleanPlantId = p.plantId?.trim().toLowerCase();

                if (!cleanPlantName) {
                    showValidationToast(`Plant #${i + 1}: Plant Name is required.`);
                    return;
                }
                if (seenPlantNames.has(cleanPlantName)) {
                    showValidationToast(`Duplicate Plant Name "${p.plantName}" found in Plant #${i + 1}. Each plant must have a unique name.`);
                    return;
                }
                seenPlantNames.add(cleanPlantName);

                if (!cleanPin || cleanPin.length !== 6) {
                    showValidationToast(`Plant #${i + 1}: Valid 6-digit Pin Code is required.`);
                    return;
                }

                if (cleanPlantId) {
                    if (seenPlantIds.has(cleanPlantId)) {
                        showValidationToast(`Duplicate Plant ID "${p.plantId}" found in Plant #${i + 1}. Each plant must have a unique Plant ID.`);
                        return;
                    }
                    seenPlantIds.add(cleanPlantId);
                }

                if (!p.zonalRailway || !p.zonalRailway.trim()) {
                    showValidationToast(`Plant #${i + 1}: Zonal Railway is required.`);
                    return;
                }
                if (!p.rio || !p.rio.trim()) {
                    showValidationToast(`Plant #${i + 1}: RIO is required.`);
                    return;
                }
                if (!p.contactPerson || !p.contactPerson.trim()) {
                    showValidationToast(`Plant #${i + 1}: Contact Person is required.`);
                    return;
                }
                if (!p.contactPersonNumber || !p.contactPersonNumber.trim()) {
                    showValidationToast(`Plant #${i + 1}: Contact Person Number is required.`);
                    return;
                }
                if (!/^\d{10}$/.test(p.contactPersonNumber.trim())) {
                    showValidationToast(`Plant #${i + 1}: Contact Person Number must be exactly 10 digits (no spaces or alphabets).`);
                    return;
                }
            }

            const rawVCode = formData.employeeCode.trim();
            const formattedVendorCode = rawVCode.startsWith(':') ? rawVCode : `:${rawVCode}`;

            const sleeperPayload = {
                userId: formData.userId,
                companyName: formData.fullName.trim(),
                vendorCode: formattedVendorCode,
                email: formData.email?.trim() || `${formattedVendorCode}@vendor.local`,
                password: formData.password || undefined,
                status: formData.status || 'Active',
                roleNames: ['Sleeper Vendor'],

                // Single Registered Unit
                unitId: sleeperUnit.unitId,
                unitName: sleeperUnit.unitName?.trim() || `${formData.fullName.trim()} - Head Office / Unit`,
                unitPinCode: sleeperUnit.unitPinCode?.trim(),
                cin: sleeperUnit.cin?.trim(),
                unitAddress: sleeperUnit.unitAddress?.trim(),
                unitDistrict: sleeperUnit.unitDistrict?.trim(),
                unitState: sleeperUnit.unitState?.trim(),
                poiCode: sleeperUnit.poiCode,

                // Multiple Plants
                plants: sleeperPlants
            };

            onSubmit(sleeperPayload);
            return;
        }

        if (isErcVendor) {
            if (!formData.fullName || !formData.fullName.trim()) {
                showValidationToast('Company / Vendor Name is required.');
                return;
            }
            if (!formData.employeeCode || !formData.employeeCode.trim()) {
                showValidationToast('Vendor Code is required.');
                return;
            }

            for (let i = 0; i < vendorUnits.length; i++) {
                const u = vendorUnits[i];
                if (!u.unitName || !u.unitName.trim()) {
                    showValidationToast(`Unit #${i + 1}: Unit Name is required.`);
                    return;
                }
                if (!u.pinCode || !u.pinCode.trim()) {
                    showValidationToast(`Unit #${i + 1}: Pin Code is required.`);
                    return;
                }
                if (!u.contactPerson || !u.contactPerson.trim()) {
                    showValidationToast(`Unit #${i + 1}: Contact Person is required.`);
                    return;
                }
                if (!u.contactPersonNumber || !u.contactPersonNumber.trim()) {
                    showValidationToast(`Unit #${i + 1}: Contact Person Number is required.`);
                    return;
                }
                if (!/^\d{10}$/.test(u.contactPersonNumber.trim())) {
                    showValidationToast(`Unit #${i + 1}: Contact Person Number must be exactly 10 digits (no spaces or alphabets).`);
                    return;
                }
            }

            const rawVCode = formData.employeeCode.trim();
            const formattedVendorCode = rawVCode.startsWith(':') ? rawVCode : `:${rawVCode}`;

            const vendorPayload = {
                userId: formData.userId,
                companyName: formData.fullName.trim(),
                vendorCode: formattedVendorCode,
                email: formData.email?.trim() || `${formattedVendorCode}@vendor.local`,
                password: formData.password || undefined,
                status: formData.status || 'Active',
                roleNames: ['Vendor'],
                units: vendorUnits
            };

            onSubmit(vendorPayload);
            return;
        }

        if (!formData.mobileNumber || !formData.mobileNumber.trim()) {
            showValidationToast('Mobile Number is required.');
            return;
        }
        if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
            showValidationToast('Mobile Number must be exactly 10 digits (no spaces or alphabets).');
            return;
        }
        if (formData.alternateMobileNumber && formData.alternateMobileNumber.trim()) {
            if (!/^\d{10}$/.test(formData.alternateMobileNumber.trim())) {
                showValidationToast('Alternate Mobile Number must be exactly 10 digits (no spaces or alphabets).');
                return;
            }
        }

        if (!user) {
            const existing = existingUsers.find(u => 
                (formData.employeeCode && u.employeeCode === formData.employeeCode) || 
                (formData.email && u.email && u.email === formData.email)
            );

            if (existing) {
                const selectedRole = formData.roleNames[0];
                const existingRoles = (existing.roleName || '').split(',').map(r => r.trim());

                if (existingRoles.includes(selectedRole)) {
                    showValidationToast(`User with Employee Code ${formData.employeeCode} already has the role "${selectedRole}".`);
                    return;
                }

                setRoleAddPrompt({ existing, selectedRole, existingRoles });
                return;
            }
        }

        const finalData = { ...formData, userName: formData.fullName };
        
        Object.keys(finalData).forEach(key => {
            if (finalData[key] === '') {
                finalData[key] = null;
            }
        });

        onSubmit(finalData);
    };

    const isZonalRailway = formData.roleNames.includes('ZONAL RAILWAY');
    const isSleeperVendor = formData.roleNames.some(r => r === 'Sleeper Vendor');
    const isErcVendor = formData.roleNames.some(r => r === 'Vendor' || r === 'ERC Vendor');
    const isVendor = isSleeperVendor || isErcVendor;

    const roleMapping = {
        'Vendor': 'ERC Vendor',
        'IE': 'ERC IE',
        'Process IE': 'ERC Process IE',
        'Main IE': 'Sleeper Main IE',
        'Rail Main IE': 'Railpad Main IE',
        'Rail Process IE': 'Railpad Process IE'
    };

    return (
        <form onSubmit={handleSubmit} className="user-form-professional" autoComplete="off">
            {/* Hidden dummy inputs to prevent browser from autofilling "Admin" into the role search field */}
            <input type="text" name="prevent_autofill_user" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex="-1" autoComplete="off" />
            <input type="password" name="prevent_autofill_pass" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} tabIndex="-1" autoComplete="off" />

            {roleAddPrompt && (
                <div style={{
                    background: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    color: '#1e40af',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    fontSize: '13px',
                    boxShadow: '0 2px 6px rgba(30, 64, 175, 0.08)'
                }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>ℹ️</span> User Already Exists
                    </div>
                    <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
                        User with Employee Code <strong>{formData.employeeCode}</strong> already exists with roles: <strong>{roleAddPrompt.existingRoles.join(', ')}</strong>.<br />
                        Do you want to add the role <strong>"{roleAddPrompt.selectedRole}"</strong> to this existing user?
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setRoleAddPrompt(null)}
                            disabled={isSubmitting}
                            style={{ padding: '5px 14px', fontSize: 12, borderRadius: 6 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleConfirmAddRole}
                            disabled={isSubmitting}
                            style={{ padding: '5px 14px', fontSize: 12, borderRadius: 6 }}
                        >
                            Yes, Add Role
                        </button>
                    </div>
                </div>
            )}
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
                            searchValue={roleSearchValue}
                            onSearch={(val) => setRoleSearchValue(val)}
                            autoClearSearchValue={true}
                            loading={isRolesLoading || rolesLoading}
                            value={formData.roleNames || []}
                            placeholder={isRolesLoading || rolesLoading ? "Loading roles from Role Master..." : "Select User Roles"}
                            notFoundContent={isRolesLoading || rolesLoading ? "Fetching roles from Role Master..." : "No roles found"}
                            onChange={(values) => {
                                setRoleSearchValue('');
                                setFormData(prev => ({
                                    ...prev,
                                    roleNames: values || []
                                }));
                            }}
                            allowClear
                            style={{ width: '100%', minHeight: '38px' }}
                            optionFilterProp="label"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={(() => {
                                const roleList = (fetchedRoles && fetchedRoles.length > 0) ? fetchedRoles : (roles && roles.length > 0 ? roles : []);
                                const seenLabels = new Set();
                                const uniqueOptions = [];

                                roleList.forEach(role => {
                                    const rName = typeof role === 'object' ? role.roleName : role;
                                    if (!rName) return;
                                    const displayRoleName = roleMapping[rName] || rName;
                                    
                                    if (!seenLabels.has(displayRoleName)) {
                                        seenLabels.add(displayRoleName);
                                        const rId = typeof role === 'object' ? (role.roleId || role.roleName) : role;
                                        uniqueOptions.push({ value: rName, label: displayRoleName, key: rId });
                                    }
                                });

                                return uniqueOptions.sort((a, b) => a.label.localeCompare(b.label));
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
                                {['CR', 'ER', 'ECR', 'ECoR', 'NR', 'NCR', 'NER', 'NFR', 'NWR', 'RDSO', 'SR', 'SCR', 'SER', 'SECR', 'SWR', 'WR', 'WCR'].map(rly => (
                                    <option key={rly} value={rly}>{rly}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {isVendor ? (
                <>
                    {/* Vendor Basic Details */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span>🏢</span> Vendor / Company Details
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Company / Firm Name <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    name="fullName"
                                    className="form-control"
                                    placeholder="e.g. PRAKASH METALLIC PRIVATE LIMITED"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vendor Code <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    name="employeeCode"
                                    className="form-control"
                                    placeholder="e.g. 1024626 or DV001"
                                    value={formData.employeeCode}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    placeholder="e.g. vendor@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sleeper Plants or ERC Units Section */}
                    {isSleeperVendor ? (
                        <>
                            {/* Section 1: Registered Unit Details (Single Unit) */}
                            <div className="form-section" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
                                    <div className="form-section-title" style={{ marginBottom: 0, color: '#0f4c81', fontWeight: 700 }}>
                                        <span>🏢</span> Registered Unit Details (Single Unit)
                                    </div>
                                    {sleeperUnit.poiCode && (
                                        <span className="badge badge-info" style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                                            POI: {sleeperUnit.poiCode}
                                        </span>
                                    )}
                                </div>

                                <div className="form-grid">
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Registered Unit / Office Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. PATIL RAIL INFRASTRUCTURE PVT LTD - HYDERABAD"
                                            value={sleeperUnit.unitName || ''}
                                            onChange={(e) => handleSleeperUnitChange('unitName', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Registered Pin Code <span className="required-star">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="6-digit Pincode"
                                            value={sleeperUnit.unitPinCode || ''}
                                            onChange={(e) => handleSleeperUnitPinChange(e.target.value)}
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">CIN (Corporate Identity No.)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. U25206A"
                                            value={sleeperUnit.cin || ''}
                                            onChange={(e) => handleSleeperUnitChange('cin', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">District</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="District"
                                            value={sleeperUnit.unitDistrict || ''}
                                            onChange={(e) => handleSleeperUnitChange('unitDistrict', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">State</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="State"
                                            value={sleeperUnit.unitState || ''}
                                            onChange={(e) => handleSleeperUnitChange('unitState', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Registered Office Address</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. 6th Floor, Rajbhavan Road, Somajiguda, Hyderabad"
                                            value={sleeperUnit.unitAddress || ''}
                                            onChange={(e) => handleSleeperUnitChange('unitAddress', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Sleeper Manufacturing Plants (Multiple Plants) */}
                            <div className="form-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <div className="form-section-title" style={{ marginBottom: 0 }}>
                                        <span>🚂</span> Sleeper Manufacturing Plants ({sleeperPlants.length})
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleAddPlant}
                                        style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#0f4c81', color: '#0f4c81', fontWeight: 600 }}
                                    >
                                        <span>+</span> Add Another Plant
                                    </button>
                                </div>

                                {isVendorLoading ? (
                                    Array.from({ length: 2 }).map((_, sIdx) => (
                                        <div key={`plant-skel-${sIdx}`} className="skeleton-unit-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                <span className="skeleton-shimmer" style={{ width: '130px', height: '24px', borderRadius: '12px' }} />
                                                <span className="skeleton-shimmer" style={{ width: '80px', height: '24px', borderRadius: '6px' }} />
                                            </div>
                                            <div className="form-grid" style={{ marginBottom: '14px' }}>
                                                <div>
                                                    <span className="skeleton-shimmer" style={{ width: '80px', height: '14px', marginBottom: '6px' }} />
                                                    <span className="skeleton-shimmer" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                                                </div>
                                                <div>
                                                    <span className="skeleton-shimmer" style={{ width: '80px', height: '14px', marginBottom: '6px' }} />
                                                    <span className="skeleton-shimmer" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        {sleeperPlants.map((plant, idx) => (
                                            <div key={idx} className="vendor-unit-card" style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#f8fafc' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', gap: '12px' }}>
                                                    <div style={{ fontWeight: 700, color: '#0f4c81', fontSize: '14px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <span>Plant #{idx + 1}</span>
                                                        {plant.plantName && <span style={{ color: '#64748b', fontWeight: 500 }}>— {plant.plantName}</span>}
                                                    </div>
                                                    {sleeperPlants.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePlant(idx)}
                                                            className="btn btn-sm btn-danger"
                                                            style={{ padding: '3px 10px', fontSize: '11px', width: 'auto', flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            ✕ Remove Plant
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="form-grid">
                                                    <div className="form-group">
                                                        <label className="form-label">Plant Name <span className="required-star">*</span></label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="e.g. PATIL HYDERABAD PLANT 2"
                                                            value={plant.plantName || ''}
                                                            onChange={(e) => handlePlantChange(idx, 'plantName', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Plant ID <span className="required-star">*</span></label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="e.g. :41647/Kargi"
                                                            value={plant.plantId || ''}
                                                            onChange={(e) => handlePlantChange(idx, 'plantId', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Plant Pin Code <span className="required-star">*</span></label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="6-digit Pincode"
                                                            value={plant.pinCode || ''}
                                                            onChange={(e) => handlePlantPinChange(idx, e.target.value)}
                                                            maxLength={6}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Zonal Railway <span className="required-star">*</span></label>
                                                        <Select
                                                            showSearch
                                                            placeholder="Select Zonal Railway"
                                                            value={plant.zonalRailway || undefined}
                                                            onChange={(val) => handlePlantChange(idx, 'zonalRailway', val)}
                                                            style={{ width: '100%', height: '38px' }}
                                                            optionFilterProp="children"
                                                            filterOption={(input, option) =>
                                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                                            }
                                                            dropdownStyle={{ maxHeight: '220px', overflowY: 'auto' }}
                                                        >
                                                            {ZONAL_RAILWAY_LIST.map(zr => (
                                                                <Select.Option key={zr} value={zr}>{zr}</Select.Option>
                                                            ))}
                                                        </Select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">RIO (Inspection Office) <span className="required-star">*</span></label>
                                                        <Select
                                                            showSearch
                                                            placeholder="Select RIO"
                                                            value={plant.rio || undefined}
                                                            onChange={(val) => handlePlantChange(idx, 'rio', val)}
                                                            style={{ width: '100%', height: '38px' }}
                                                            optionFilterProp="children"
                                                            filterOption={(input, option) =>
                                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                                            }
                                                            dropdownStyle={{ maxHeight: '220px', overflowY: 'auto' }}
                                                        >
                                                            {RIO_OPTIONS_LIST.map(rio => (
                                                                <Select.Option key={rio} value={rio}>{rio}</Select.Option>
                                                            ))}
                                                        </Select>
                                                    </div>
                                                    <div className="form-group" style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1.5px solid #86efac' }}>
                                                        <label className="form-label" style={{ color: '#166534', fontWeight: 700 }}>
                                                            👤 Contact Person <span className="required-star">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Full name of plant contact person"
                                                            value={plant.contactPerson || ''}
                                                            onChange={(e) => handlePlantChange(idx, 'contactPerson', e.target.value)}
                                                            required
                                                            style={{ borderColor: '#4ade80' }}
                                                        />
                                                    </div>
                                                    <div className="form-group" style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1.5px solid #93c5fd' }}>
                                                        <label className="form-label" style={{ color: '#1e40af', fontWeight: 700 }}>
                                                            📞 Contact Person Number <span className="required-star">*</span>
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            className="form-control"
                                                            placeholder="Exact 10-digit mobile number"
                                                            value={plant.contactPersonNumber || ''}
                                                            onChange={(e) => handlePlantChange(idx, 'contactPersonNumber', e.target.value)}
                                                            maxLength={10}
                                                            inputMode="numeric"
                                                            pattern="[0-9]{10}"
                                                            required
                                                            style={{ borderColor: '#60a5fa' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={handleAddPlant}
                                                style={{ fontSize: '13px', padding: '8px 20px', borderColor: '#0f4c81', color: '#0f4c81', fontWeight: 700 }}
                                            >
                                                + Add Another Plant
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="form-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <div className="form-section-title" style={{ marginBottom: 0 }}>
                                    <span>🏭</span> Manufacturing Units / Plants ({vendorUnits.length})
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleAddUnit}
                                    style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#0f4c81', color: '#0f4c81', fontWeight: 600 }}
                                >
                                    <span>+</span> Add Another Unit
                                </button>
                            </div>

                            {isVendorLoading ? (
                                Array.from({ length: 2 }).map((_, sIdx) => (
                                    <div key={`unit-skel-${sIdx}`} className="skeleton-unit-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <span className="skeleton-shimmer" style={{ width: '130px', height: '24px', borderRadius: '12px' }} />
                                            <span className="skeleton-shimmer" style={{ width: '80px', height: '24px', borderRadius: '6px' }} />
                                        </div>
                                        <div className="form-grid" style={{ marginBottom: '14px' }}>
                                            <div>
                                                <span className="skeleton-shimmer" style={{ width: '80px', height: '14px', marginBottom: '6px' }} />
                                                <span className="skeleton-shimmer" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                                            </div>
                                            <div>
                                                <span className="skeleton-shimmer" style={{ width: '80px', height: '14px', marginBottom: '6px' }} />
                                                <span className="skeleton-shimmer" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                                            </div>
                                        </div>
                                        <div className="form-grid" style={{ marginBottom: '14px' }}>
                                            <div>
                                                <span className="skeleton-shimmer" style={{ width: '90px', height: '14px', marginBottom: '6px' }} />
                                                <span className="skeleton-shimmer" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                                            </div>
                                            <div>
                                                <span className="skeleton-shimmer" style={{ width: '90px', height: '14px', marginBottom: '6px' }} />
                                                <span className="skeleton-shimmer" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '14px' }}>
                                            <span className="skeleton-shimmer" style={{ width: '100px', height: '14px', marginBottom: '6px' }} />
                                            <span className="skeleton-shimmer" style={{ width: '100%', height: '38px', borderRadius: '6px' }} />
                                        </div>
                                        <div className="form-grid">
                                            <span className="skeleton-shimmer" style={{ width: '100%', height: '65px', borderRadius: '8px' }} />
                                            <span className="skeleton-shimmer" style={{ width: '100%', height: '65px', borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                vendorUnits.map((unit, idx) => (
                                <div key={idx} className="vendor-unit-card" style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                        <div style={{ fontWeight: 700, color: '#0f4c81', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>Unit #{idx + 1}</span>
                                            {unit.unitName && <span style={{ color: '#64748b', fontWeight: 500 }}>— {unit.unitName}</span>}
                                            {unit.poiCode && (
                                                <span className="badge badge-info" style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px' }}>
                                                    POI: {unit.poiCode}
                                                </span>
                                            )}
                                        </div>
                                        {vendorUnits.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveUnit(idx)}
                                                className="btn btn-sm btn-danger"
                                                style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                ✕ Remove Unit
                                            </button>
                                        )}
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Unit Name <span className="required-star">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. Unit 1 - Main Works"
                                                value={unit.unitName || ''}
                                                onChange={(e) => handleUnitChange(idx, 'unitName', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Pin Code <span className="required-star">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="6-digit Pincode"
                                                value={unit.pinCode || ''}
                                                onChange={(e) => handleUnitChange(idx, 'pinCode', e.target.value)}
                                                maxLength={6}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">CIN (Corporate Identity No.)</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. U12345MH2000PTC123456"
                                                value={unit.cin || ''}
                                                onChange={(e) => handleUnitChange(idx, 'cin', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">RIO (Inspection Office)</label>
                                            <select
                                                className="form-control"
                                                value={unit.rio || ''}
                                                onChange={(e) => handleUnitChange(idx, 'rio', e.target.value)}
                                            >
                                                <option value="">Auto-derived from state (or select)</option>
                                                {REGIONS.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="form-label">Full Unit Address</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Complete street address of the manufacturing plant"
                                                value={unit.address || ''}
                                                onChange={(e) => handleUnitChange(idx, 'address', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">District</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="District"
                                                value={unit.district || ''}
                                                onChange={(e) => handleUnitChange(idx, 'district', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">State</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="State"
                                                value={unit.state || ''}
                                                onChange={(e) => handleUnitChange(idx, 'state', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group" style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1.5px solid #86efac' }}>
                                            <label className="form-label" style={{ color: '#166534', fontWeight: 700 }}>
                                                👤 Contact Person <span className="required-star">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Full name of unit contact person"
                                                value={unit.contactPerson || ''}
                                                onChange={(e) => handleUnitChange(idx, 'contactPerson', e.target.value)}
                                                required
                                                style={{ borderColor: '#60a5fa' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1.5px solid #93c5fd' }}>
                                            <label className="form-label" style={{ color: '#1e40af', fontWeight: 700 }}>
                                                📞 Contact Person Number <span className="required-star">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                placeholder="Exact 10-digit mobile number"
                                                value={unit.contactPersonNumber || ''}
                                                onChange={(e) => handleUnitChange(idx, 'contactPersonNumber', e.target.value)}
                                                maxLength={10}
                                                inputMode="numeric"
                                                pattern="[0-9]{10}"
                                                required
                                                style={{ borderColor: '#60a5fa' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* 2. Basic Information Section for non-vendors */}
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
                                <label className="form-label">Mobile Number <span className="required-star">*</span></label>
                                <input
                                    type="tel"
                                    name="mobileNumber"
                                    className="form-control"
                                    placeholder="Exact 10-digit mobile number"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    maxLength={10}
                                    inputMode="numeric"
                                    pattern="[0-9]{10}"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Alternate Mobile</label>
                                <input
                                    type="tel"
                                    name="alternateMobileNumber"
                                    className="form-control"
                                    placeholder="Exact 10-digit mobile number"
                                    value={formData.alternateMobileNumber}
                                    onChange={handleChange}
                                    maxLength={10}
                                    inputMode="numeric"
                                    pattern="[0-9]{10}"
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
                </>
            )}

            {/* Security & Status Section */}
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
                                    className="form-control"
                                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!user}
                                    minLength={8}
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
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                Requires at least 8 characters, an uppercase letter, a number, and a special character.
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Status <span className="required-star">*</span></label>
                        <select
                            name="status"
                            className="form-control"
                            value={formData.status || ''}
                            onChange={handleChange}
                            required
                        >
                            <option value="">-- Select Status --</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                        minWidth: '140px',
                        opacity: isSubmitting ? 0.75 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <span style={{
                                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: '#fff', borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite', display: 'inline-block'
                            }}></span>
                            <span>Saving...</span>
                        </>
                    ) : (
                        user ? (isVendor ? 'Update Vendor' : 'Update User') : (isVendor ? 'Create Vendor' : 'Create User')
                    )}
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

