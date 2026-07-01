import React, { useState } from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children, activeItem, onItemClick, onLogout, user, isShiftActive }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

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

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.2', letterSpacing: '0.2px' }}>
                                {user?.userName || 'Nitin Rajput'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{user?.roleName || 'ERC Main IE'}</span>
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                                <span style={{ color: '#475569' }}>ID: {user?.employeeCode || user?.employeeId || '12191'}</span>
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ width: '1px', height: '32px', background: '#e2e8f0' }} />
                    
                    <button 
                        onClick={onLogout}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', 
                            borderRadius: '6px', color: '#334155', fontSize: '13px', fontWeight: '600', 
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                    </button>
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
