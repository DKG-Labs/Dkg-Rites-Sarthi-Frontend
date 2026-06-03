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
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                        style={{ background: '#f5f5f5', border: 'none', borderRadius: '4px', padding: '8px', display: 'none', cursor: 'pointer' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

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

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#1e3a5f',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '600'
                        }}>{userInitial}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{user?.userName || 'Railpad-IE'}</span>
                            <button
                                onClick={onLogout}
                                style={{ padding: '0', background: 'transparent', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
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

                <main className="main-content" style={{ flex: 1, padding: '24px', overflowY: 'auto', boxSizing: 'border-box', background: '#f8fafc' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
