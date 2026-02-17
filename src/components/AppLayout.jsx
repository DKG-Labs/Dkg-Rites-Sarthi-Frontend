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

  // Determine if sidebar should be hidden
  const shouldHideSidebar = isCallDeskRoute || isRailwayBoardRoute;

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
        <div className="header-right">
          {!shouldHideSidebar && (
            <button
              className="btn btn-sm btn-outline hamburger-btn"
              onClick={() => setIsSidebarOpen(open => !open)}
              aria-label="Toggle menu"
              style={{ marginRight: '8px' }}
            >
              ☰
            </button>
          )}
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {new Date().toLocaleString()}
          </div>
          <div className="user-info">
            <div className="user-avatar">{currentUser?.userName?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div>
              <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
                {currentUser?.userName || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {currentUser?.roleName || 'Inspector'}
              </div>
            </div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={handleLogout}>Logout</button>
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
                {currentUser?.roleName === 'CM' && (
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

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

