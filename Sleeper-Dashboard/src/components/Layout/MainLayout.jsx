import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { logoutUser, getStoredUser } from '../../services/authService';
import { useShift } from '../../context/ShiftContext';
import { ROUTES } from '../../routes';
import './MainLayout.css';

/**
 * MainLayout – Application shell: sidebar + topbar + content area.
 */
const MainLayout = ({ children, activeItem, onItemClick }) => {
    const navigate = useNavigate();
    const { dutyStarted, endDuty } = useShift();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Custom End Duty Modal state
    const [showEndDutyModal, setShowEndDutyModal] = useState(false);
    const [confirmCheckbox, setConfirmCheckbox] = useState(false);

    // Logout Duty activation state
    const [showLogoutDutyModal, setShowLogoutDutyModal] = useState(false);

    const user = getStoredUser();

    const performLogout = () => {
        logoutUser();
        // Clear local view state if necessary
        onItemClick('Main Dashboard');
        // Redirect to main Sarthi login page at the root
        window.location.href = '/';
    };

    const handleLogout = () => {
        if (dutyStarted) {
            setShowLogoutDutyModal(true);
        } else {
            performLogout();
        }
    };

    const handleLogoutWithEndDuty = () => {
        endDuty();
        performLogout();
    };

    const handleEndDutyConfirm = () => {
        endDuty();
        onItemClick('Main Dashboard');
        setShowEndDutyModal(false);
        setConfirmCheckbox(false);
    };

    return (
        <div className="main-layout-root">

            {/* End Duty Confirmation Modal */}
            {showEndDutyModal && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
                        <div className="modal-header" style={{ marginBottom: '20px' }}>
                            <h2 style={{ color: 'var(--color-danger)', fontSize: '20px' }}>End Duty Session?</h2>
                        </div>
                        <div className="modal-body" style={{ marginBottom: '25px' }}>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                                You are about to terminate your active duty session. <br />
                                <strong style={{ color: '#1e293b' }}>Any unsaved data in current forms will be lost.</strong>
                            </p>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                padding: '12px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={confirmCheckbox}
                                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Are you sure??</span>
                            </label>
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    setShowEndDutyModal(false);
                                    setConfirmCheckbox(false);
                                }}
                                style={{ flex: 1 }}
                            >
                                Back to Work
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleEndDutyConfirm}
                                disabled={!confirmCheckbox}
                                style={{
                                    flex: 1,
                                    background: confirmCheckbox ? 'var(--color-danger)' : '#cbd5e1',
                                    borderColor: confirmCheckbox ? 'var(--color-danger)' : '#cbd5e1',
                                    cursor: confirmCheckbox ? 'pointer' : 'not-allowed'
                                }}
                            >
                                End Duty Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Duty Confirmation Modal */}
            {showLogoutDutyModal && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', padding: '35px' }}>
                        <div className="modal-header" style={{ marginBottom: '20px', justifyContent: 'center' }}>
                            <h2 style={{ color: 'var(--color-danger)', fontSize: '20px' }}>Active Duty Session</h2>
                        </div>
                        <div className="modal-body" style={{ marginBottom: '30px' }}>
                            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
                                You have an active duty session. <br />
                                Do you want to <strong>End Duty</strong> before logging out?
                            </p>
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                className="btn-submit"
                                onClick={handleLogoutWithEndDuty}
                                style={{ 
                                    width: '100%', 
                                    background: 'var(--color-danger)', 
                                    borderColor: 'var(--color-danger)',
                                    color: 'white',
                                    padding: '12px',
                                    height: 'auto',
                                    fontWeight: '600'
                                }}
                            >
                                Yes, End Duty & Logout
                            </button>
                            <button
                                className="btn-cancel"
                                onClick={performLogout}
                                style={{ 
                                    width: '100%', 
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    color: '#475569',
                                    padding: '12px',
                                    height: 'auto',
                                    fontWeight: '600'
                                }}
                            >
                                Logout Without Ending Duty
                            </button>
                            <button
                                onClick={() => setShowLogoutDutyModal(false)}
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: '#94a3b8', 
                                    fontSize: '13px', 
                                    marginTop: '8px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile sidebar backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay open"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                activeItem={activeItem}
                dutyStarted={dutyStarted}
                onItemClick={(item) => {
                    onItemClick(item);
                    setIsMobileMenuOpen(false);
                }}
                isOpen={isMobileMenuOpen}
                expanded={isSidebarPinned || isSidebarHovered}
                onMouseEnter={() => setIsSidebarHovered(true)}
                onMouseLeave={() => setIsSidebarHovered(false)}
                onClick={() => setIsSidebarPinned(!isSidebarPinned)}
            />

            <div className="main-content-wrapper">
                <header className="main-header">

                    {/* Left: hamburger menu (mobile) */}
                    <div className="header-left">
                        <button
                            id="mobile-menu-btn"
                            className="mobile-menu-btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"
                            >
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Right: End Duty + profile dropdown */}
                    <div className="header-right">
                        {dutyStarted && (
                            <button
                                className="end-duty-btn"
                                onClick={() => setShowEndDutyModal(true)}
                                title="End Shift Duty"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                                    <line x1="12" y1="2" x2="12" y2="12" />
                                </svg>
                                <span>End Duty</span>
                            </button>
                        )}

                        <div className="header-divider"></div>

                        {/* Profile dropdown – matches Railpad IE header */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    cursor: 'pointer', padding: '6px 12px', borderRadius: '8px',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
                                    background: '#0f172a', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '15px', fontWeight: 600,
                                    boxShadow: '0 2px 4px rgba(15,23,42,0.1)',
                                }}>
                                    {user?.userName ? user.userName.substring(0, 2).toUpperCase() : 'U'}
                                </div>

                                {/* Name + role */}
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <span style={{
                                        fontSize: '14px', fontWeight: 600, color: '#0f172a',
                                        lineHeight: '1.2', letterSpacing: '0.2px',
                                        textTransform: 'uppercase',
                                    }}>
                                        {user?.fullName || user?.userName || 'User'}
                                    </span>
                                    <span style={{
                                        fontSize: '12px', color: '#64748b', marginTop: '3px',
                                        fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px',
                                    }}>
                                        <span>Role: {user?.roleName || 'Sleeper IE'}</span>
                                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                                        <span style={{ color: '#475569' }}>EMP CODE : {user?.employeeCode || user?.userId || 'N/A'}</span>
                                    </span>
                                </div>

                                {/* Chevron */}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ color: '#64748b', marginLeft: '4px' }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>

                            {/* Dropdown menu */}
                            {isProfileMenuOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0,
                                    marginTop: '12px', background: '#ffffff',
                                    border: '1px solid #e2e8f0', borderRadius: '16px',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                    width: '240px', zIndex: 2000, padding: '8px',
                                    display: 'flex', flexDirection: 'column', gap: '4px',
                                }}>
                                    {/* Popover arrow */}
                                    <div style={{
                                        position: 'absolute', top: '-6px', right: '24px',
                                        width: '12px', height: '12px', background: '#ffffff',
                                        transform: 'rotate(45deg)',
                                        borderLeft: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0',
                                        zIndex: -1,
                                    }} />

                                    {/* View Profile */}
                                    <button
                                        onClick={() => { setIsProfileMenuOpen(false); window.location.href = '/profile?tab=0'; }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', width: '100%',
                                            background: 'transparent', border: 'none', borderRadius: '12px',
                                            cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                            </div>
                                            <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: 500 }}>View Profile</span>
                                        </div>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>

                                    {/* Edit Profile */}
                                    <button
                                        onClick={() => { setIsProfileMenuOpen(false); window.location.href = '/profile?tab=1'; }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', width: '100%',
                                            background: 'transparent', border: 'none', borderRadius: '12px',
                                            cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 20h9"></path>
                                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                </svg>
                                            </div>
                                            <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: 500 }}>Edit Profile</span>
                                        </div>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>

                                    {/* Change Password */}
                                    <button
                                        onClick={() => { setIsProfileMenuOpen(false); window.location.href = '/profile?tab=2'; }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', width: '100%',
                                            background: 'transparent', border: 'none', borderRadius: '12px',
                                            cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                </svg>
                                            </div>
                                            <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: 500 }}>Change Password</span>
                                        </div>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>


                                    {/* Divider */}
                                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                                    {/* Logout */}
                                    <button
                                        onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', width: '100%',
                                            background: 'transparent', border: 'none', borderRadius: '12px',
                                            cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                                    <polyline points="16 17 21 12 16 7"></polyline>
                                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                                </svg>
                                            </div>
                                            <span style={{ color: '#ef4444', fontSize: '15px', fontWeight: 500 }}>Logout</span>
                                        </div>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </header>

                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
