import React, { useState, useEffect } from 'react';
import { useShift } from '../../context/ShiftContext';
import { getCompanyMappingByUser, getShedsByVendorCode } from '../../services/workflowService';
import DutyMetaInfo from '../../features/duty/components/DutyMetaInfo';
import './MainDashboard.css';

/**
 * MainDashboard – Landing page for Process IE after login.
 * Four action cards + start/resume duty modal.
 */
const DASHBOARD_CARDS = [
    {
        id: 'start-duty',
        iconClass: 'card-icon card-icon--primary',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
        title: (hasActive) => hasActive ? 'Resume Duty' : 'Start Duty',
        desc: (hasActive) => hasActive
            ? 'Continue your current active data logging session.'
            : 'Initialize your daily productivity and duty assignment.',
    },
    {
        id: 'batch-report',
        iconClass: 'card-icon card-icon--success',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>,
        title: () => 'Batch-wise Sleeper Report',
        desc: () => 'End-to-end traceability and lifecycle summary of batches.',
        target: 'BatchWiseSleeperReport',
        isUnderDevelopment: true,
    },
    {
        id: 'shift-report',
        iconClass: 'card-icon card-icon--warning',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
        title: () => 'Last Shift Report',
        desc: () => 'Immediate snapshot and alerts from the previous shift.',
        target: 'LastShiftReport',
        isUnderDevelopment: true,
    },
    {
        id: 'monthly-report',
        iconClass: 'card-icon card-icon--dark',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
        title: () => 'Monthly Report',
        desc: () => 'High-level plant-wide monthly KPI dashboard.',
        target: 'MonthlyReport',
        isUnderDevelopment: true,
    },
    {
        id: 'production-verification',
        iconClass: 'card-icon card-icon--primary',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /><polyline points="21 8 21 3 16 3" /></svg>,
        title: () => 'Production Verification',
        desc: () => 'Verify and authorize daily production declaration logs.',
        target: 'Sleeper process IE-General',
    },
    {
        id: 'attending-call',
        iconClass: 'card-icon card-icon--accent',
        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /><path d="M14.05 2a9 9 0 0 1 8 7.94" /><path d="M14.05 6A5 5 0 0 1 18 10" /></svg>,
        title: () => 'Attending the Call Raised',
        desc: () => 'Manage Call Inspection & IC Issuance',
        target: 'AttendingCallDashboard',
    },
];

const MainDashboard = () => {
    const {
        dutyStarted,
        setDutyStarted,
        activeContainerId,
        setActiveContainerId,
        selectedShift,
        setSelectedShift,
        dutyDate,
        setDutyDate,
        dutyUnit,
        setDutyUnit,
        dutyLocation,
        setDutyLocation,
        containers,
        plantVerificationData,
        vendorCode,
        setVendorCode,
        companyName,
        setCompanyName,
        vendorId,
        setVendorId
    } = useShift();

    const [showDutyForm, setShowDutyForm] = useState(false);
    const [companyNames, setCompanyNames] = useState([]);
    const [availableUnitNames, setAvailableUnitNames] = useState([]);
    const [unitVendorMap, setUnitVendorMap] = useState({});
    const [companyUnitMap, setCompanyUnitMap] = useState({});
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        shift: '',
        companyName: '',
        unit: '',
    });

    useEffect(() => {
        const fetchCompanyMapping = async () => {
            const userId = localStorage.getItem('userId');
            if (userId) {
                const response = await getCompanyMappingByUser(userId);
                if (response) {
                    if (Array.isArray(response)) {
                        // Handle new array format
                        const companies = [];
                        const uVMap = {};
                        const cUMap = {};

                        response.forEach(comp => {
                            // Clean up company name: trim whitespace and collapse internal extra spaces/tabs
                            const rawCName = comp.companyName || "";
                            const cName = rawCName.replace(/\s+/g, ' ').trim();

                            if (cName) {
                                companies.push(cName);
                                
                                // Clean up unit names similarly
                                const cleanedUnits = (comp.unitNames || []).map(u => u.replace(/\s+/g, ' ').trim());
                                cUMap[cName] = cleanedUnits;
                                
                                cleanedUnits.forEach(uName => {
                                    uVMap[uName] = {
                                        vendorId: comp.vendorId,
                                        vendorCode: comp.vendorCode
                                    };
                                });
                            }
                        });

                        setCompanyNames(companies);
                        setUnitVendorMap(uVMap);
                        setCompanyUnitMap(cUMap);

                        if (companies.length === 1) {
                            const firstCompName = companies[0];
                            setFormData(prev => ({ ...prev, companyName: firstCompName }));
                            setCompanyName(firstCompName);
                            setAvailableUnitNames(cUMap[firstCompName] || []);
                        }
                    } else {
                        // Legacy object format fallback
                        if (response.vendorCode) {
                            localStorage.setItem('vendorCode', response.vendorCode);
                            setVendorCode(response.vendorCode);
                        }
                        if (response.vendorId) {
                            localStorage.setItem('vendorId', response.vendorId);
                            setVendorId(response.vendorId);
                        }
                        if (response.unitVendorMap) {
                            setUnitVendorMap(response.unitVendorMap);
                        }
                        if (response.unitNames) {
                            setAvailableUnitNames(response.unitNames);
                        }
                        if (response.companyUnitMap) {
                            setCompanyUnitMap(response.companyUnitMap);
                        }
                        if (response.companyNames) {
                            setCompanyNames(response.companyNames);
                            if (response.companyNames.length === 1) {
                                setFormData(prev => ({ ...prev, companyName: response.companyNames[0] }));
                                setCompanyName(response.companyNames[0]);
                            }
                        } else if (response.companyName) {
                            setCompanyNames([response.companyName]);
                            setFormData(prev => ({ ...prev, companyName: response.companyName }));
                            setCompanyName(response.companyName);
                        }
                    }
                }
            }
        };
        fetchCompanyMapping();
    }, []);

    // Effect removed as per user request to remove production location api

    const hasActiveDuty = dutyStarted;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'companyName') {
            setCompanyName(value);
            setAvailableUnitNames(companyUnitMap[value] || []);
            setFormData(prev => ({ ...prev, unit: '' })); // Reset unit when company changes
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Update Context State
        setDutyStarted(true);
        setSelectedShift(formData.shift);
        setDutyDate(formData.date);
        setDutyUnit(formData.unit);

        // Save vendor credentials for API calls
        const mappedVendorData = unitVendorMap[formData.unit];
        if (mappedVendorData) {
            if (typeof mappedVendorData === 'object') {
                localStorage.setItem('vendorId', mappedVendorData.vendorId);
                setVendorId(mappedVendorData.vendorId);
                localStorage.setItem('vendorCode', mappedVendorData.vendorCode);
                setVendorCode(mappedVendorData.vendorCode);
            } else {
                // Legacy fallback if map just contains vendorId string
                localStorage.setItem('vendorId', mappedVendorData);
                setVendorId(mappedVendorData);
            }
        }

        // Find or create container ID based on default
        setActiveContainerId(1); 


        setShowDutyForm(false);
        redirectToDutyDashboard(formData.shift);
    };

    const redirectToDutyDashboard = (shift) => {
        const target = shift === 'General' ? 'Sleeper process IE-General' : 'Sleeper process Duty';
        window.dispatchEvent(new CustomEvent('navigate', { detail: { target } }));
    };

    const navigateTo = (target) => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { target } }));
    };

    const handleCardClick = (card) => {
        if (card.id === 'start-duty') {
            hasActiveDuty ? redirectToDutyDashboard(selectedShift) : setShowDutyForm(true);
        } else if (card.id === 'production-verification') {
            // Navigate to General portal which has the Production Verification card
            navigateTo('Sleeper process IE-General');
        } else if (card.id === 'attending-call') {
            navigateTo('AttendingCallDashboard');
        } else if (card.target) {
            navigateTo(card.target);
        }
    };


    return (
        <div className="ie-general-container fade-in">
            {/* ── Page Header ── */}
            <header className="ie-modern-header">
                <div className="header-top-line">
                    <button
                        className="home-btn-glass"
                        onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'Main Dashboard' } }))}
                        title="Back to Dashboard"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </button>
                    <div className="header-titles">
                        <h1>Process IE – Portal Home</h1>
                        {hasActiveDuty && <DutyMetaInfo />}
                    </div>
                </div>
            </header>

            <div className="ie-sub-nav-grid">
                {DASHBOARD_CARDS.filter(card => {
                    const userRole = localStorage.getItem('roleName');
                    if (userRole === 'Sleeper Process IE' && card.id === 'attending-call') {
                        return false;
                    }
                    return true;
                }).map(card => {
                    const isRestricted = !dutyStarted && card.id === 'production-verification';
                    return (
                        <div
                            key={card.id}
                            className={`ie-sub-nav-card ${isRestricted ? 'restricted' : ''} ${card.isUnderDevelopment ? 'under-development' : ''}`}
                            onClick={() => !isRestricted && handleCardClick(card)}
                            title={isRestricted ? 'Please start duty first' : card.isUnderDevelopment ? 'Under Development' : ''}
                        >
                            <div className="card-icon-wrapper">
                                <span className="card-icon-symbol-modern">{card.icon}</span>
                                {isRestricted && <span className="lock-badge">🔒</span>}
                                {card.isUnderDevelopment && <span className="dev-badge">Under Development</span>}
                            </div>
                            <div className="card-info">
                                <h3 className="ie-sub-nav-card-title">{card.title(hasActiveDuty)}</h3>
                                <p className="ie-sub-nav-card-desc">{card.desc(hasActiveDuty)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Start Duty Modal ── */}
            {showDutyForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Initialize Shift Duty</h2>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit} className="duty-form">

                                <label>
                                    Shift Selection
                                    <select
                                        name="shift"
                                        value={formData.shift}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Shift</option>
                                        <option value="A">Shift A (05:00 - 17:00)</option>
                                        <option value="B">Shift B (13:00 - 23:55)</option>
                                        <option value="C">Shift C (22:00 - 09:00)</option>
                                        <option value="General">General (08:00 - 20:00)</option>
                                    </select>
                                </label>

                                <label>
                                    Company Name
                                    <select
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        required
                                        disabled={companyNames.length <= 1}
                                        className={companyNames.length <= 1 ? "read-only-dropdown" : ""}
                                    >
                                        <option value="">Select Company</option>
                                        {companyNames.map((name, idx) => (
                                            <option key={idx} value={name} title={name}>
                                                {name.length > 45 ? `${name.substring(0, 42)}...` : name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Casting Date
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Production Unit
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Unit</option>
                                        {availableUnitNames && availableUnitNames.length > 0 ? (
                                            availableUnitNames.map((unitName, idx) => (
                                                <option key={idx} value={unitName} title={unitName}>
                                                    {unitName.length > 45 ? `${unitName.substring(0, 42)}...` : unitName}
                                                </option>
                                            ))
                                        ) : (
                                            (() => {
                                                const options = [];
                                                if (formData.companyName && companyUnitMap[formData.companyName]) {
                                                    companyUnitMap[formData.companyName].forEach((unitName, idx) => {
                                                        const profile = plantVerificationData?.profiles?.find(p => p.plantName === unitName);
                                                        const statusText = (profile && profile.status !== 'Verified') ? ` (${profile.status})` : '';
                                                        const fullText = `${unitName}${statusText}`;
                                                        options.push(
                                                            <option key={`${unitName}-${idx}`} value={unitName} title={fullText}>
                                                                {fullText.length > 45 ? `${fullText.substring(0, 42)}...` : fullText}
                                                            </option>
                                                        );
                                                    });
                                                }
                                                return options;
                                            })()
                                        )}
                                    </select>
                                </label>

                                {/* Production Location removed as per request */}

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => setShowDutyForm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        Begin Logging
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainDashboard;
