import { useState, useEffect } from 'react';

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, logoutUser } from '../services/authService';
import { ROUTES } from '../routes';
import { useInspection } from '../context/InspectionContext';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Avatar } from '@mui/material';
import { getUserProfile } from '../services/userProfileService';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';

import LogoutIcon from '@mui/icons-material/Logout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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
  const [anchorEl, setAnchorEl] = useState(null);
  const isProfileMenuOpen = Boolean(anchorEl);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const navigateToProfile = () => {
    handleProfileMenuClose();
    navigate(ROUTES.PROFILE);
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      // Fetch full profile to get profile image for the header avatar
      getUserProfile().then(profile => {
        if (profile && profile.profilePhotoPath) {
          setCurrentUser(prev => ({ ...prev, profilePhotoPath: profile.profilePhotoPath }));
        }
      }).catch(err => console.error("Could not fetch user profile for header", err));
    }
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
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            onClick={handleProfileClick}
          >
            <Avatar 
              src={currentUser?.profilePhotoPath}
              sx={{ 
                width: 38, height: 38, 
                background: '#0f172a', 
                color: 'white', 
                fontSize: '15px', fontWeight: '600',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)'
              }}
            >
              {currentUser?.userName?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b', marginLeft: '4px' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          <Menu
            anchorEl={anchorEl}
            id="profile-menu"
            open={isProfileMenuOpen}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 8px 24px rgba(149, 157, 165, 0.2))',
                mt: 1.5,
                width: '280px',
                borderRadius: '16px',
                padding: '8px',
                '& .MuiMenuItem-root': {
                  borderRadius: '12px',
                  mb: 0.5,
                  padding: '10px 12px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                  },
                },
                '& .MuiListItemIcon-root': {
                  minWidth: '40px',
                },
                '& .MuiListItemText-primary': {
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#1e293b',
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 24,
                  width: 12,
                  height: 12,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                  boxShadow: '-2px -2px 5px rgba(149, 157, 165, 0.05)'
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={navigateToProfile}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <ListItemIcon>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PersonIcon style={{ fontSize: '18px' }} />
                  </div>
                </ListItemIcon>
                <ListItemText>View Profile</ListItemText>
              </div>
              <ChevronRightIcon style={{ color: '#94a3b8', fontSize: '20px' }} />
            </MenuItem>
            
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate(`${ROUTES.PROFILE}?tab=1`); }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <ListItemIcon>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EditIcon style={{ fontSize: '18px' }} />
                  </div>
                </ListItemIcon>
                <ListItemText>Edit Profile</ListItemText>
              </div>
              <ChevronRightIcon style={{ color: '#94a3b8', fontSize: '20px' }} />
            </MenuItem>

            <MenuItem onClick={() => { handleProfileMenuClose(); navigate(`${ROUTES.PROFILE}?tab=2`); }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <ListItemIcon>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LockIcon style={{ fontSize: '18px' }} />
                  </div>
                </ListItemIcon>
                <ListItemText>Change Password</ListItemText>
              </div>
              <ChevronRightIcon style={{ color: '#94a3b8', fontSize: '20px' }} />
            </MenuItem>


            <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />
            
            <MenuItem onClick={handleLogout}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <ListItemIcon>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogoutIcon style={{ fontSize: '18px' }} />
                  </div>
                </ListItemIcon>
                <ListItemText sx={{ '& .MuiTypography-root': { color: '#ef4444' } }}>Logout</ListItemText>
              </div>
              <ChevronRightIcon style={{ color: '#94a3b8', fontSize: '20px' }} />
            </MenuItem>
          </Menu>
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
                {location.pathname.startsWith(ROUTES.PROFILE) ? (
                  <>
                    {!isSidebarCollapsed && (
                      <div style={{
                        margin: '16px 12px 24px',
                        borderRadius: '16px',
                        background: '#ffffff',
                        boxShadow: '0 8px 24px rgba(15, 76, 129, 0.08)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        
                        <div style={{ padding: '24px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          {/* Avatar */}
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0F4C81 0%, #2563eb 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: '800',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                            marginBottom: '12px',
                            position: 'relative',
                            zIndex: 2
                          }}>
                            {currentUser?.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                            {currentUser?.userName || 'User Profile'}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '600' }}>
                            {currentUser?.roleName || 'Employee'}
                          </span>
                        </div>
                      </div>
                    )}
                    <li
                      className="sidebar-item"
                      onClick={handleNavigateToLanding}
                      title="Home"
                    >
                      <span className="sidebar-icon">🏠</span>
                      <span className="sidebar-text">Home</span>
                    </li>
                    <li
                      className={`sidebar-item ${new URLSearchParams(location.search).get('tab') === '0' || !new URLSearchParams(location.search).get('tab') ? 'active' : ''}`}
                      onClick={() => { setIsSidebarOpen(false); navigate(`${ROUTES.PROFILE}?tab=0`); }}
                      title="View Profile"
                    >
                      <span className="sidebar-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PersonIcon fontSize="small" /></span>
                      <span className="sidebar-text">View Profile</span>
                    </li>
                    <li
                      className={`sidebar-item ${new URLSearchParams(location.search).get('tab') === '1' ? 'active' : ''}`}
                      onClick={() => { setIsSidebarOpen(false); navigate(`${ROUTES.PROFILE}?tab=1`); }}
                      title="Edit Profile"
                    >
                      <span className="sidebar-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EditIcon fontSize="small" /></span>
                      <span className="sidebar-text">Edit Profile</span>
                    </li>
                    <li
                      className={`sidebar-item ${new URLSearchParams(location.search).get('tab') === '2' ? 'active' : ''}`}
                      onClick={() => { setIsSidebarOpen(false); navigate(`${ROUTES.PROFILE}?tab=2`); }}
                      title="Change Password"
                    >
                      <span className="sidebar-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LockIcon fontSize="small" /></span>
                      <span className="sidebar-text">Change Password</span>
                    </li>
                    {/* Hiding Login Security per user request
                    <li
                      className={`sidebar-item ${new URLSearchParams(location.search).get('tab') === '3' ? 'active' : ''}`}
                      onClick={() => { setIsSidebarOpen(false); navigate(`${ROUTES.PROFILE}?tab=3`); }}
                      title="Login Security"
                    >
                      <span className="sidebar-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SecurityIcon fontSize="small" /></span>
                      <span className="sidebar-text">Login Security</span>
                    </li>
                    */}
                  </>
                ) : (
                  <>
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
                  </>
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

