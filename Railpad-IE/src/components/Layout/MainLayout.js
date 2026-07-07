import React, { useState } from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children, activeItem, onItemClick, onLogout, user, isShiftActive }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const userInitial = user?.userName ? user.userName.charAt(0).toUpperCase() : 'I';

    return (
        <div className="main-layout-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ zIndex: 1002 }}
                />
            )}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>


                    <div className="brand-block" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                            src="/sarthi-logo1.png"
                            alt="SARTHI Logo"
                            style={{ height: '50px', display: 'block' }}
                        />
                    </div>
                    <div className="brand-text" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="brand-title" style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '0.5px', color: '#0f172a' }}>SARTHI</div>
                        <div className="brand-subtitle" style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                            System for Automated Review, Tracking & Holistic Inspection
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div 
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
                            boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)'
                        }}>
                            {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.2', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
                                {user?.userName || 'Nitin Rajput'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Role: {(user?.roleName || 'ERC Main IE').replace(/Rail Process IE/gi, 'Railpad Process IE').replace(/Rail Main IE/gi, 'Railpad Main IE')}</span>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                                <span style={{ color: '#475569' }}>EMP CODE : {user?.employeeCode || user?.employeeId || user?.userId || '12191'}</span>
                            </span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b', marginLeft: '4px' }}>
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    {isProfileMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            marginTop: '12px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            width: '280px',
                            zIndex: 2000,
                            padding: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            {/* Decorative up arrow (optional, to mimic a popover arrow) */}
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '24px',
                                width: '12px',
                                height: '12px',
                                background: '#ffffff',
                                transform: 'rotate(45deg)',
                                borderLeft: '1px solid #e2e8f0',
                                borderTop: '1px solid #e2e8f0',
                                zIndex: -1
                            }} />

                            <button 
                                onClick={() => { setIsProfileMenuOpen(false); window.location.href = 'http://localhost:3000/profile?tab=0'; }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', width: '100%',
                                    background: 'transparent', border: 'none', borderRadius: '12px', cursor: 'pointer',
                                    transition: 'background 0.2s', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: '500' }}>View Profile</span>
                                </div>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>

                            <button 
                                onClick={() => { setIsProfileMenuOpen(false); window.location.href = 'http://localhost:3000/profile?tab=1'; }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', width: '100%',
                                    background: 'transparent', border: 'none', borderRadius: '12px', cursor: 'pointer',
                                    transition: 'background 0.2s', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 20h9"></path>
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                        </svg>
                                    </div>
                                    <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: '500' }}>Edit Profile</span>
                                </div>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>

                            <button 
                                onClick={() => { setIsProfileMenuOpen(false); window.location.href = 'http://localhost:3000/profile?tab=2'; }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', width: '100%',
                                    background: 'transparent', border: 'none', borderRadius: '12px', cursor: 'pointer',
                                    transition: 'background 0.2s', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                    </div>
                                    <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: '500' }}>Change Password</span>
                                </div>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>


                            <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                            <button 
                                onClick={() => { setIsProfileMenuOpen(false); onLogout(); }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', width: '100%',
                                    background: 'transparent', border: 'none', borderRadius: '12px', cursor: 'pointer',
                                    transition: 'background 0.2s', textAlign: 'left'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                    </div>
                                    <span style={{ color: '#ef4444', fontSize: '15px', fontWeight: '500' }}>Logout</span>
                                </div>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, width: '100%', paddingTop: '70px', boxSizing: 'border-box' }}>
                <Sidebar
                    activeItem={activeItem}
                    isShiftActive={isShiftActive}
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

                <main className="main-content" style={{ flex: 1, padding: '24px', overflowY: 'auto', boxSizing: 'border-box', background: '#ffffff' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
