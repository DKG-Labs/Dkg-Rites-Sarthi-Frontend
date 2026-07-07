import React, { useState, useEffect } from 'react';
import { getStoredUser } from '../../services/authService';

/* ─────────────────────────────────────────────────────────
   API
───────────────────────────────────────────────────────── */
const API_BASE_URL = (() => {
    const isLocal = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal
        ? 'http://localhost:8080/sarthi-backend'
        : 'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend';
})();

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const na = (val) =>
    val && String(val).trim() !== '' ? String(val).trim() : 'Not Available';

const fmtDate = (val) => {
    if (!val) return 'First time login';
    try { return new Date(val).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return val; }
};

const fmtDOB = (val) => {
    if (!val) return 'Not Available';
    const parts = val.split('-');
    return parts.length === 3 ? parts.reverse().join('-') : val;
};

/* ─────────────────────────────────────────────────────────
   Single field block: small upper-case label + bold value
   (Matches ERC / Railpad / main app design exactly)
───────────────────────────────────────────────────────── */
const Field = ({ label, value, statusColor }) => (
    <div style={{ marginBottom: '12px' }}>
        <div style={{
            fontSize: '9px',
            color: '#94a3b8',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '3px',
        }}>
            {label}
        </div>
        <div style={{
            fontSize: '11.5px',
            color: statusColor || '#0f172a',
            fontWeight: 600,
            lineHeight: 1.3,
            wordBreak: 'break-word',
        }}>
            {na(value)}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Two-column field grid inside an info card
───────────────────────────────────────────────────────── */
const FieldGrid = ({ left, right }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
        <div>{left.map(([label, value, color], i) => (
            <Field key={`l${i}`} label={label} value={value} statusColor={color} />
        ))}</div>
        <div>{right.map(([label, value, color], i) => (
            <Field key={`r${i}`} label={label} value={value} statusColor={color} />
        ))}</div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Premium glass info card (matches main app exactly)
───────────────────────────────────────────────────────── */
const InfoCard = ({ title, iconSvg, children }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '18px',
        border: '1px solid rgba(226,232,240,0.8)',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 2px 12px rgba(15,76,129,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
    }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 16px 48px rgba(15,76,129,0.12), 0 4px 12px rgba(0,0,0,0.06)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,76,129,0.06), 0 1px 3px rgba(0,0,0,0.04)';
        }}
    >
        {/* Card header */}
        <div style={{
            padding: '20px 24px 16px 24px',
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(255,255,255,0) 100%)',
            borderBottom: '1px solid rgba(226,232,240,0.7)',
        }}>
            <div style={{
                width: 34, height: 34, borderRadius: '10px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 1px 4px rgba(37,99,235,0.15)',
            }}>
                {iconSvg}
            </div>
            <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a', letterSpacing: '0.01em' }}>
                {title}
            </span>
        </div>
        {/* Card body */}
        <div style={{ padding: '20px 24px', flexGrow: 1 }}>
            {children}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   SVG Icons (matches MUI icon colours)
───────────────────────────────────────────────────────── */
const IconPerson = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
);
const IconBusiness = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M20 6h-2.18c.07-.44.18-.88.18-1.33C18 2.54 15.6 1 13.5 1c-1.36 0-2.7.56-3.5 1.72C9.2 1.56 7.86 1 6.5 1 4.42 1 2 2.54 2 4.67c0 .45.11.89.18 1.33H0v14h24V6h-4zm-7.5-3.5c.97 0 1.5.73 1.5 1.67 0 .3-.1.58-.21.83H11.2c-.11-.25-.2-.53-.2-.83 0-.94.53-1.67 1.5-1.67zM6.5 2.5c.97 0 1.5.73 1.5 1.67 0 .3-.1.58-.21.83H5.21C5.1 4.75 5 4.47 5 4.17c0-.94.53-1.67 1.5-1.67zM2 18V8h20v10H2z" />
    </svg>
);
const IconPhone = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.01L6.6 10.8z" />
    </svg>
);
const IconAdmin = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z" />
    </svg>
);

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const UserProfilePage = ({ onBack }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const user = getStoredUser();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                const res = await fetch(`${API_BASE_URL}/api/v1/profile`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setProfileData(data.responseData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const initials = profileData?.fullName
        ? profileData.fullName.charAt(0).toUpperCase()
        : (user?.userName?.charAt(0).toUpperCase() || 'U');

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100%' }}>
            <div style={{ padding: '0 24px 32px 24px' }}>

                {/* Back button */}
                <div style={{ paddingTop: '16px', marginBottom: '8px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'white', border: '1px solid #e2e8f0',
                            borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600, color: '#475569',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                    >
                        ← Back
                    </button>
                </div>

                {/* ══════════════════════════════════════════════
                    Profile Summary Card
                ══════════════════════════════════════════════ */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '14px' }}>
                        Loading profile…
                    </div>
                )}
                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: '12px', padding: '16px 20px',
                        color: '#dc2626', fontSize: '13px', marginTop: '16px',
                    }}>
                        Failed to load profile: {error}
                    </div>
                )}

                {profileData && !loading && (
                    <>
                        {/* Summary Card */}
                        <div style={{
                            marginBottom: '24px',
                            borderRadius: '20px', border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            boxShadow: '0 12px 40px rgba(15,76,129,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                            padding: '32px 40px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', flexWrap: 'wrap' }}>

                                {/* Avatar with online dot */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{
                                        width: 90, height: 90, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #0F4C81 0%, #2563eb 100%)',
                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '34px', fontWeight: 800,
                                        border: '3px solid #fff',
                                        boxShadow: '0 4px 20px rgba(37,99,235,0.28)',
                                    }}>
                                        {initials}
                                    </div>
                                    <div style={{
                                        position: 'absolute', bottom: 4, right: 4,
                                        width: 14, height: 14, borderRadius: '50%',
                                        backgroundColor: '#22c55e', border: '2px solid #fff',
                                        boxShadow: '0 0 0 2px rgba(34,197,94,0.25)',
                                    }} />
                                </div>

                                {/* Name block + stat tiles */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Name + role badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                            {na(profileData.fullName)}
                                        </span>
                                        {profileData.assignedRoles && (
                                            <span style={{
                                                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                                color: '#1d4ed8', fontSize: '11px', fontWeight: 700,
                                                padding: '3px 12px', borderRadius: '20px',
                                                border: '1px solid #bfdbfe', letterSpacing: '0.03em',
                                            }}>
                                                {profileData.assignedRoles}
                                            </span>
                                        )}
                                    </div>

                                    {/* Designation */}
                                    <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, marginBottom: '20px' }}>
                                        {na(profileData.designation)}
                                    </div>

                                    {/* Stat tiles bar */}
                                    <div style={{
                                        display: 'flex', flexWrap: 'wrap',
                                        borderRadius: '14px', border: '1px solid #e8edf2',
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                        overflow: 'hidden',
                                    }}>
                                        {[
                                            ['EMPLOYEE CODE', profileData.employeeCode || profileData.employeeNumber],
                                            ['DEPARTMENT', profileData.department],
                                            ['ORGANIZATION', profileData.organization],
                                            ['REGION / SBU', profileData.region],
                                            ['ACTIVE ROLE', profileData.activeRole || localStorage.getItem('roleName')],
                                            ['LAST LOGIN', fmtDate(profileData.lastLoginDate)],
                                        ].map(([label, value], i, arr) => (
                                            <React.Fragment key={i}>
                                                <div style={{ padding: '12.8px 20px', flex: '1 1 110px' }}>
                                                    <div style={{
                                                        fontSize: '9.5px', color: '#94a3b8', fontWeight: 700,
                                                        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px',
                                                    }}>{label}</div>
                                                    <div style={{ fontSize: '12.5px', color: '#0f172a', fontWeight: 700 }}>
                                                        {na(value)}
                                                    </div>
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <div style={{
                                                        width: '1px', alignSelf: 'center',
                                                        height: '36px', backgroundColor: '#e2e8f0',
                                                    }} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ══════════════════════════════════════════════
                            Information Cards  –  2 per row (2×2)
                        ══════════════════════════════════════════════ */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '24px',
                            marginBottom: '32px',
                        }}>

                            {/* Basic Information */}
                            <InfoCard title="Basic Information" iconSvg={<IconPerson />}>
                                <FieldGrid
                                    left={[
                                        ['Full Name', profileData.fullName],
                                        ['Employee Code', profileData.employeeCode],
                                    ]}
                                    right={[
                                        ['Date of Birth', fmtDOB(profileData.dateOfBirth)],
                                        ['Designation', profileData.designation],
                                        ['Discipline', profileData.department],
                                        ['Employment Type', profileData.employmentType || 'Regular'],
                                    ]}
                                />
                            </InfoCard>

                            {/* Organization Information */}
                            <InfoCard title="Organization Information" iconSvg={<IconBusiness />}>
                                <FieldGrid
                                    left={[
                                        ['Organization', profileData.organization],
                                        ['Department', profileData.department],
                                        ['Region', profileData.region],
                                    ]}
                                    right={[
                                        ['Product Type', profileData.productType],
                                        ['Zonal Railway', profileData.zonalRailway || profileData.organization],
                                        ['Office Location', profileData.officeLocation],
                                    ]}
                                />
                            </InfoCard>

                            {/* Contact Information */}
                            <InfoCard title="Contact Information" iconSvg={<IconPhone />}>
                                <FieldGrid
                                    left={[
                                        ['Mobile Number', profileData.registeredMobileNumber],
                                        ['Alternate Mobile', profileData.alternateMobileNumber],
                                    ]}
                                    right={[
                                        ['Email Address', profileData.emailAddress],
                                        ['Office Address', profileData.officeAddress],
                                    ]}
                                />
                            </InfoCard>

                            {/* System Information */}
                            <InfoCard title="System Information" iconSvg={<IconAdmin />}>
                                <FieldGrid
                                    left={[
                                        ['Assigned Role(s)', profileData.assignedRoles],
                                        ['Active Role', profileData.activeRole || profileData.assignedRoles],
                                        ['User Status', profileData.userStatus || 'Active',
                                            (profileData.userStatus || 'Active').toLowerCase() === 'active' ? '#16a34a' : '#dc2626'],
                                    ]}
                                    right={[
                                        ['Account Creation Date', profileData.accountCreationDate],
                                        ['Last Login Date', fmtDate(profileData.lastLoginDate)],
                                        ['Updated Date', profileData.updatedDate || profileData.updatedAt],
                                    ]}
                                />
                            </InfoCard>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfilePage;
