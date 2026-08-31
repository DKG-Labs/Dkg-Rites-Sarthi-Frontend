import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { fetchMappedPlantIds } from '../../services/workflowService';

const MainLayout = ({ children, activeItem, onItemClick, onLogout, user, isShiftActive }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isMainMapped, setIsMainMapped] = useState(false);

    useEffect(() => {
        const checkMappings = async () => {
            const uId = user?.userId || localStorage.getItem('userId');
            if (uId) {
                try {
                    const mainPlants = await fetchMappedPlantIds(uId, 'Main IE');
                    if (mainPlants && mainPlants.length > 0) {
                        setIsMainMapped(true);
                    }
                } catch (err) {}
            }
        };
        checkMappings();
    }, [user?.userId]);

    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        if (isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const userInitial = user?.userName ? user.userName.charAt(0).toUpperCase() : 'I';

    return (
        <div className="main-layout-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay open"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ zIndex: 1040 }}
                />
            )}

            <style>{`
                @media (max-width: 1024px) {
                    .mobile-menu-btn {
                        display: flex !important;
                    }
                    .main-header {
                        padding: 0 12px !important;
                        height: 60px !important;
                    }
                    .brand-subtitle {
                        display: none !important;
                    }
                    .brand-title {
                        font-size: 15px !important;
                    }
                    .user-profile-meta {
                        display: none !important;
                    }
                    .user-profile-trigger {
                        padding: 4px 6px !important;
                        gap: 6px !important;
                    }
                    .profile-dropdown-menu {
                        right: 0 !important;
                        width: 250px !important;
                        max-width: calc(100vw - 20px) !important;
                    }
                    .main-layout-root > div:last-child {
                        padding-top: 60px !important;
                    }
                }
                @media (max-width: 480px) {
                    .main-header {
                        padding: 0 8px !important;
                    }
                    .profile-dropdown-menu {
                        right: -4px !important;
                        width: 230px !important;
                        max-width: calc(100vw - 16px) !important;
                    }
                }
            `}</style>
            <header className="main-header" style={{
                height: '70px',
                background: '#ffffff',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1001,
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        id="mobile-menu-btn"
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle Navigation Menu"
                        title="Toggle Navigation Menu"
                        style={{
                            background: isMobileMenuOpen ? '#e2e8f0' : '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            width: '38px',
                            height: '38px',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#1e293b',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.2"
                            strokeLinecap="round" strokeLinejoin="round"
                        >
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>

                    <div className="brand-block" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                            src="/sarthi-logo1.png"
                            alt="SARTHI Logo"
                            style={{ height: '46px', display: 'block' }}
                        />
                    </div>
                    <div className="brand-text" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="brand-title" style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '0.5px', color: '#0f172a' }}>SARTHI</div>
                        <div className="brand-subtitle" style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                            System for Automated Review, Tracking & Holistic Inspection
                        </div>
                    </div>
                </div>

                <div ref={profileRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div 
                        className="user-profile-trigger"
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div style={{ 
                            width: '38px', height: '38px', 
                            borderRadius: '50%', 
                            background: '#0f172a', 
                            color: 'white', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '15px', fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
                            flexShrink: 0
                        }}>
                            {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-profile-meta" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.2', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
                                {user?.userName || 'Nitin Rajput'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Role: {(() => {
                                    const roleInput = user?.roleName || 'ERC Main IE';
                                    const roles = Array.isArray(roleInput) ? roleInput : [roleInput];
                                    const formatted = roles.map(r => {
                                        let str = String(r).trim();
                                        if (str === 'Main IE') return 'Railpad Main IE';
                                        if (str === 'Process IE') return 'Railpad Process IE';
                                        return str
                                            .replace(/Rail Process IE/gi, 'Railpad Process IE')
                                             .replace(/Rail Main IE/gi, 'Railpad Main IE');
                                    });
                                    const railpadRoles = formatted.filter(r => r.includes('Railpad') || r.includes('Main IE') || r.includes('Process IE'));
                                    const finalRoles = railpadRoles.length > 0 ? [...railpadRoles] : [...formatted];
                                    if (isMainMapped && !finalRoles.includes('Railpad Main IE')) {
                                        finalRoles.push('Railpad Main IE');
                                    }
                                    return Array.from(new Set(finalRoles)).join(' & ');
                                })()}</span>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                                <span style={{ color: '#475569' }}>EMP CODE : {user?.employeeCode || user?.employeeId || user?.userId || '12191'}</span>
                            </span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b', marginLeft: '2px', flexShrink: 0 }}>
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    {isProfileMenuOpen && (
                        <div 
                            className="profile-dropdown-menu"
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: '0',
                                marginTop: '10px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '14px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                                width: '250px',
                                maxWidth: 'calc(100vw - 20px)',
                                zIndex: 2000,
                                padding: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                boxSizing: 'border-box'
                            }}>
                            {/* Decorative up arrow */}
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '18px',
                                width: '10px',
                                height: '10px',
                                background: '#ffffff',
                                transform: 'rotate(45deg)',
                                borderLeft: '1px solid #e2e8f0',
                                borderTop: '1px solid #e2e8f0',
                                zIndex: 1
                            }} />

                            <button 
                                onClick={() => { setIsProfileMenuOpen(false); window.location.href = '/profile?tab=0'; }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', width: '100%',
                                    background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                    transition: 'background 0.15s', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>View Profile</span>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>

                            <button 
                                onClick={() => { setIsProfileMenuOpen(false); window.location.href = '/profile?tab=1'; }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', width: '100%',
                                    background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                    transition: 'background 0.15s', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"></path>
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                        </svg>
                                    </div>
                                    <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>Edit Profile</span>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>

                            <button 
                                onClick={() => { setIsProfileMenuOpen(false); window.location.href = '/profile?tab=2'; }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', width: '100%',
                                    background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                    transition: 'background 0.15s', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                    </div>
                                    <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>Change Password</span>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>

                            <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                            <button 
                                onClick={() => { setIsProfileMenuOpen(false); onLogout(); }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', width: '100%',
                                    background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                    transition: 'background 0.15s', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                    </div>
                                    <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>Logout</span>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, width: '100%', paddingTop: '60px', boxSizing: 'border-box' }}>
                <Sidebar
                    activeItem={activeItem}
                    isShiftActive={isShiftActive}
                    onItemClick={(item) => {
                        onItemClick(item);
                        setIsMobileMenuOpen(false);
                    }}
                    isOpen={isMobileMenuOpen}
                    expanded={isSidebarPinned || isSidebarHovered || isMobileMenuOpen}
                    onMouseEnter={() => setIsSidebarHovered(true)}
                    onMouseLeave={() => setIsSidebarHovered(false)}
                    onClick={() => setIsSidebarPinned(!isSidebarPinned)}
                    onClose={() => setIsMobileMenuOpen(false)}
                />

                <main className="main-content" style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', boxSizing: 'border-box', background: '#ffffff' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
