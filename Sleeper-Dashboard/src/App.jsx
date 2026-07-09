import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import SleeperProcessDuty from './pages/sleeperGeneral/SleeperProcessDuty';
import SleeperProcessIEGeneral from './pages/sleeperGeneral/SleeperProcessIEGeneral';
import AttendingCallDashboard from './pages/sleeperGeneral/finalInspection/AttendingCallDashboard';
import SleeperFinalProductCertificate from './pages/sleeperGeneral/IC/SleeperFinalProductCertificate';
import { ShiftProvider } from './context/ShiftContext';
import { ToastProvider } from './context/ToastContext';
import MainDashboard from './pages/ProcessIE/MainDashboard';
import BatchWiseSleeperReport from './pages/ProcessIE/BatchWiseSleeperReport';
import LastShiftReport from './pages/ProcessIE/LastShiftReport';
import MonthlyReport from './pages/ProcessIE/MonthlyReport';
import DashboardTabs from './components/Navigation/DashboardTabs';
import LoginPage from './pages/LoginPage/LoginPage';
import UserProfilePage from './pages/UserProfile/UserProfilePage';
import { ROUTES } from './routes';
import { isAuthenticated, getStoredUser } from './services/authService';

const isSleeperRole = (role) => {
  if (!role) return false;
  // If it's a Rail-related role, it belongs to Railpad, not Sleeper
  if (typeof role === 'string' && role.includes('Rail')) return false;

  const sleeperRoles = ['Sleeper Process IE', 'Main IE'];
  return sleeperRoles.some(r =>
    role === r || (typeof role === 'string' && role.includes(r))
  );
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to the main application's login page at the root
    window.location.href = '/';
    return null;
  }
  
  const loggedInUser = getStoredUser();
  if (loggedInUser && !isSleeperRole(loggedInUser.roleName)) {
    // Prevent ERC/Railpad users from bypassing into Sleeper by checking role
    window.location.href = '/';
    return null;
  }
  
  return children;
};

/**
 * App Component - Main Entry Point
 */
const App = () => {
  const [mainView, setMainView] = useState(() => {
    return localStorage.getItem('activeMainView') || 'Main Dashboard';
  });

  // Persist mainView changes
  useEffect(() => {
    localStorage.setItem('activeMainView', mainView);
  }, [mainView]);

  // Listen for navigation events dispatched from components
  useEffect(() => {
    const handler = (e) => {
      const target = e.detail?.target;
      if (target) {
        switch (target) {
          case 'Sleeper process IE-General':
            setMainView('Sleeper process IE-General');
            break;
          case 'Sleeper process Duty':
            setMainView('Sleeper process Duty');
            break;
          case 'BatchWiseSleeperReport':
            setMainView('Batch Wise Sleeper Report');
            break;
          case 'LastShiftReport':
            setMainView('Last Shift Report');
            break;
          case 'MonthlyReport':
            setMainView('Monthly Performance Report');
            break;
          case 'AttendingCallDashboard':
            setMainView('Attending the Call Raised');
            break;
          case 'Sleeper Final IC':
            setMainView('Sleeper Final IC');
            break;
          case 'User Profile':
            setMainView('User Profile');
            break;
          default:
            setMainView('Main Dashboard');
        }
      }
    };
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  const renderView = () => {
    switch (mainView) {
      case 'Sleeper process IE-General':
        return <SleeperProcessIEGeneral />;
      case 'Sleeper process Duty':
        return <SleeperProcessDuty />;
      case 'Batch Wise Sleeper Report':
        return <div className="fade-in"><BatchWiseSleeperReport /></div>;
      case 'Last Shift Report':
        return <div className="fade-in"><LastShiftReport /></div>;
      case 'Monthly Performance Report':
        return <div className="fade-in"><MonthlyReport /></div>;
      case 'Attending the Call Raised':
        return <div className="fade-in"><AttendingCallDashboard /></div>;
      case 'Sleeper Final IC':
        return <div className="fade-in"><SleeperFinalProductCertificate /></div>;
      case 'User Profile':
        return <UserProfilePage onBack={() => setMainView('Main Dashboard')} />;
      case 'Main Dashboard':
      default:
        return <MainDashboard />;
    }
  };

  const showTabs = [
    'Batch Wise Sleeper Report',
    'Last Shift Report',
    'Monthly Performance Report'
  ].includes(mainView);

  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Navigate to="/" replace />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <ToastProvider>
              <ShiftProvider>
                <MainLayout activeItem={mainView} onItemClick={setMainView}>
                  {showTabs && (
                    <DashboardTabs activeItem={mainView} onItemClick={setMainView} />
                  )}
                  {renderView()}
                </MainLayout>
              </ShiftProvider>
            </ToastProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
