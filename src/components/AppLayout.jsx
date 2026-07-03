import { useState, useEffect } from 'react';

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, logoutUser } from '../services/authService';
import { useInspection } from '../context/InspectionContext';
import { ROUTES } from '../routes';

/**
 * AppLayout - Main layout component with header and sidebar
 * Wraps all authenticated pages
 */
const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeInspectionType, clearInspectionData, setLandingActiveTab } = useInspection();

  const [currentUser, setCurrentUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('.main-content');
    if (mainEl) mainEl.scrollTop = 0;
  }, [location.pathname]);

  const handleLogout = () => {
    logoutUser();
    clearInspectionData();
    navigate(ROUTES.LOGIN);
  };

  const handleNavigateToLanding = () => {
    setLandingActiveTab('pending');
    setIsSidebarOpen(false);
    navigate(ROUTES.LANDING);
  };

  const handleNavigateToRawMaterial = () => {
    if (activeInspectionType === 'raw-material') {
      setIsSidebarOpen(false);
      navigate(ROUTES.RAW_MATERIAL);
    }
  };

  const handleNavigateToProcess = () => {
    if (activeInspectionType === 'process') {
      setIsSidebarOpen(false);
      navigate(ROUTES.PROCESS);
    }
  };

  const handleNavigateToFinalProduct = () => {
    if (activeInspectionType === 'final-product') {
      setIsSidebarOpen(false);
      navigate(ROUTES.FINAL_PRODUCT);
    }
  };

  const handleNavigateToCMDashboard = () => {
    setIsSidebarOpen(false);
    navigate(ROUTES.CM_DASHBOARD);
  };

  const handleNavigateToCallDesk = () => {
    setIsSidebarOpen(false);
    navigate(ROUTES.CALL_DESK);
  };

  const handleNavigateToFinance = () => {
    setIsSidebarOpen(false);
    navigate(ROUTES.FINANCE);
  };

  const isActivePage = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const isCallDeskRoute = location.pathname.startsWith(ROUTES.CALL_DESK);
  const isRailwayBoardRoute = location.pathname.startsWith(ROUTES.RAILWAY_BOARD_DASHBOARD);
  const isAdminRoute = location.pathname.startsWith(ROUTES.ADMIN_DASHBOARD);
  const isRitesAdminRoute = location.pathname.startsWith('/rites-admin');
  const isCMRoute = location.pathname.startsWith(ROUTES.CM_DASHBOARD);
  const isSmsRoute = location.pathname.startsWith('/sms');

  // Determine if sidebar should be hidden
  const shouldHideSidebar = isCallDeskRoute || isRailwayBoardRoute || isAdminRoute || isRitesAdminRoute || isCMRoute || isSmsRoute;

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <div className="brand-block">
            <img
              src="/sarthi-logo1.png"
              alt="SARTHI Logo"
              className="brand-logo"
            />
          </div>
          {/* <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {currentUser?.roleName === 'CM' ? 'Controlling Manager Dashboard' :
             currentUser?.roleName === 'CALL_DESK' ? 'Call Desk Dashboard' :
             currentUser?.roleName === 'Finance' ? 'Finance Dashboard' :
             'Inspection Engineer Dashboard'}
          </div> */}

          <div className="brand-text">
            <div className="brand-title">SARTHI</div>
            <div className="brand-subtitle">
              System for Automated Review, Tracking & Holistic Inspection
            </div>
          </div>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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
              {currentUser?.userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', lineHeight: '1.2', letterSpacing: '0.2px' }}>
                {currentUser?.userName || 'Nitin Rajput'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Role: {currentUser?.roleName || 'ERC Main IE'}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                <span style={{ color: '#475569' }}>EMP CODE : {currentUser?.employeeCode || currentUser?.employeeId || currentUser?.userId || '12191'}</span>
              </span>
            </div>
          </div>
          
          <div style={{ width: '1px', height: '32px', background: '#e2e8f0' }} />
          
          <button 
            onClick={handleLogout}
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

      <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {!shouldHideSidebar && (
          <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? '»' : '«'}
            </button>
            <nav>
              <ul className="sidebar-nav">
                {/* Landing Page - Only show for IE users (not CM, CALL_DESK, or Finance) */}
                {currentUser?.roleName !== 'CM' && currentUser?.roleName !== 'CALL_DESK' && currentUser?.roleName !== 'Finance' && (
                  <li
                    className={`sidebar-item ${isActivePage(ROUTES.LANDING) ? 'active' : ''}`}
                    onClick={handleNavigateToLanding}
                    title="Landing Page"
                  >
                    <span className="sidebar-icon">🏠</span>
                    <span className="sidebar-text">Landing Page</span>
                  </li>
                )}
                {/* Inspection modules - Only show for IE users (not CM, CALL_DESK, or Finance) */}
                {currentUser?.roleName !== 'CM' && currentUser?.roleName !== 'CALL_DESK' && currentUser?.roleName !== 'Finance' && (activeInspectionType === 'raw-material' || activeInspectionType === null) && (
                  <li
                    className={`sidebar-item ${isActivePage(ROUTES.RAW_MATERIAL) ? 'active' : ''}`}
                    onClick={handleNavigateToRawMaterial}
                    style={{ opacity: activeInspectionType === 'raw-material' ? 1 : 0.5, cursor: activeInspectionType === 'raw-material' ? 'pointer' : 'not-allowed' }}
                    title="Raw Material Inspection"
                  >
                    <span className="sidebar-icon">📦</span>
                    <span className="sidebar-text">Raw Material Inspection</span>
                  </li>
                )}
                {currentUser?.roleName !== 'CM' && currentUser?.roleName !== 'CALL_DESK' && currentUser?.roleName !== 'Finance' && (activeInspectionType === 'process' || activeInspectionType === null) && (
                  <li
                    className={`sidebar-item ${isActivePage(ROUTES.PROCESS) ? 'active' : ''}`}
                    onClick={handleNavigateToProcess}
                    style={{ opacity: activeInspectionType === 'process' ? 1 : 0.5, cursor: activeInspectionType === 'process' ? 'pointer' : 'not-allowed' }}
                    title="Process Inspection"
                  >
                    <span className="sidebar-icon">⚙️</span>
                    <span className="sidebar-text">Process Inspection</span>
                  </li>
                )}
                {currentUser?.roleName !== 'CM' && currentUser?.roleName !== 'CALL_DESK' && currentUser?.roleName !== 'Finance' && (activeInspectionType === 'final-product' || activeInspectionType === null) && (
                  <li
                    className={`sidebar-item ${isActivePage(ROUTES.FINAL_PRODUCT) ? 'active' : ''}`}
                    onClick={handleNavigateToFinalProduct}
                    style={{ opacity: activeInspectionType === 'final-product' ? 1 : 0.5, cursor: activeInspectionType === 'final-product' ? 'pointer' : 'not-allowed' }}
                    title="Final Product Inspection"
                  >
                    <span className="sidebar-icon">✅</span>
                    <span className="sidebar-text">Final Product Inspection</span>
                  </li>
                )}

                {/* CM Dashboard - Only show for CM role */}
                {(currentUser?.roleName === 'CM' || currentUser?.roleName === 'Control Manager' || currentUser?.roleName === 'Controlling Manager') && (
                  <li
                    className={`sidebar-item ${isActivePage(ROUTES.CM_DASHBOARD) ? 'active' : ''}`}
                    onClick={handleNavigateToCMDashboard}
                    title="CM Dashboard"
                  >
                    <span className="sidebar-icon">👔</span>
                    <span className="sidebar-text">CM Dashboard</span>
                  </li>
                )}
                {/* Call Desk - Only show for CALL_DESK role */}
                {currentUser?.roleName === 'CALL_DESK' && (
                  <li
                    className={`sidebar-item ${isActivePage(ROUTES.CALL_DESK) ? 'active' : ''}`}
                    onClick={handleNavigateToCallDesk}
                    title="Call Desk"
                  >
                    <span className="sidebar-icon">📞</span>
                    <span className="sidebar-text">Call Desk</span>
                  </li>
                )}
                {/* Finance Dashboard - Only show for Finance role */}
                {currentUser?.roleName === 'Finance' && (
                  <li
                    className={`sidebar-item ${isActivePage(ROUTES.FINANCE) ? 'active' : ''}`}
                    onClick={handleNavigateToFinance}
                    title="Finance Dashboard"
                  >
                    <span className="sidebar-icon">💰</span>
                    <span className="sidebar-text">Finance Dashboard</span>
                  </li>
                )}
              </ul>
            </nav>
          </aside>
        )}

        {!shouldHideSidebar && isSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
        )}

        <main className={`main-content ${shouldHideSidebar ? 'full-width-main' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

