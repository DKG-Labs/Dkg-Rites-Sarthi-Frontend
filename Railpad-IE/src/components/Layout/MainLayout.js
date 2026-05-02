import React, { useState } from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children, activeItem, onItemClick, onLogout, user }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    const userInitial = user?.userName ? user.userName.charAt(0).toUpperCase() : 'I';

    return (
        <div className="main-layout-root">
            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                activeItem={activeItem}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                            style={{ background: '#f5f5f5', border: 'none', borderRadius: '4px', padding: '8px', display: 'flex' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
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
                                fontSize: 'var(--fs-sm)',
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

                <main className="main-content">
                    {children}
                </main>
            </div>
        </div >
    );
};

export default MainLayout;
