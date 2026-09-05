import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import './RitesAdminDashboard.css';

const RitesAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeToast, setActiveToast] = useState(null);

  const handleCardClick = (cardName, status, route) => {
    if (status === 'under-construction') {
      setActiveToast(`"${cardName}" is under construction. It will be available soon!`);
      setTimeout(() => {
        setActiveToast(null);
      }, 4000);
      return;
    }

    if (route) {
      // Set local storage key to select the ERC tab when loading the Railway Board Dashboard
      if (route === ROUTES.RAILWAY_BOARD_DASHBOARD) {
        localStorage.setItem('dash_selectedProduct', 'ERC');
      }
      navigate(route);
    }
  };

  return (
    <div className="rites-admin-container">
      {/* Background Decorative Blobs for premium glassmorphism depth */}
      <div className="blob-1"></div>
      <div className="blob-2"></div>
      <div className="blob-3"></div>

      <header className="rites-admin-header">
        <div className="rites-admin-tag">
          <span className="badge-dot pulse" style={{ background: '#0d9488', width: '6px', height: '6px' }}></span>
          Administrative Command Center
        </div>
        <h1 className="rites-admin-title">Rites Admin Hub</h1>
        <p className="rites-admin-subtitle">
          Consolidated quality command center. Access active modules or check pending releases.
        </p>
      </header>

      {/* Grid of Command Cards */}
      <div className="rites-admin-grid">
        {/* Card 1: Check List */}
        <div 
          className="rites-admin-card checklist-card under-construction"
          onClick={() => handleCardClick('Check List', 'under-construction')}
        >
          <div className="card-status-badge under-construction-badge">
            <span className="badge-dot"></span>
            Under Construction
          </div>
          <div className="card-icon-container">
            <svg viewBox="0 0 24 24" className="card-svg-icon" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="card-title">Check List</h2>
          <p className="card-description">
            Standard operating checklists, dynamic templates, and automated compliance records.
          </p>
          <div className="card-footer">
            <span className="footer-action-text">Configure Checklist</span>
            <svg viewBox="0 0 24 24" className="footer-arrow-icon" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>

        {/* Card 2: Consignee Complaint */}
        <div 
          className="rites-admin-card complaint-card under-construction"
          onClick={() => handleCardClick('Consignee Complaint', 'under-construction')}
        >
          <div className="card-status-badge under-construction-badge">
            <span className="badge-dot"></span>
            Under Construction
          </div>
          <div className="card-icon-container">
            <svg viewBox="0 0 24 24" className="card-svg-icon" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="card-title">Consignee Complaint</h2>
          <p className="card-description">
            Track customer complaints, investigate quality deviations, and register feedback issues.
          </p>
          <div className="card-footer">
            <span className="footer-action-text">Manage Complaints</span>
            <svg viewBox="0 0 24 24" className="footer-arrow-icon" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>

        {/* Card 3: Railway Dashboard (Active) */}
        <div 
          className="rites-admin-card dashboard-card active-card"
          onClick={() => handleCardClick('Railway Dashboard', 'active', ROUTES.RAILWAY_BOARD_DASHBOARD)}
        >
          <div className="card-status-badge active-badge">
            <span className="badge-dot pulse"></span>
            Active Now
          </div>
          <div className="card-icon-container">
            <svg viewBox="0 0 24 24" className="card-svg-icon" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h2 className="card-title">Railway Dashboard</h2>
          <p className="card-description">
            Real-time tracking of manufacturing, dispatch statuses, inspection certs, and analytics.
          </p>
          <div className="card-footer">
            <span className="footer-action-text">Launch Dashboard</span>
            <svg viewBox="0 0 24 24" className="footer-arrow-icon" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>

        {/* Card 4: Certificate Storage Hub (Active) */}
        <div 
          className="rites-admin-card active-card"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            localStorage.setItem('adminActiveModule', 'certificates');
            navigate(ROUTES.ADMIN_DASHBOARD);
          }}
        >
          <div className="card-status-badge active-badge">
            <span className="badge-dot pulse"></span>
            Active Now
          </div>
          <div className="card-icon-container">
            <svg viewBox="0 0 24 24" className="card-svg-icon" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="card-title">Certificate Storage</h2>
          <p className="card-description">
            Upload, inspect, replace, and manage digital Inspection Certificates (ICs) in Azure Storage.
          </p>
          <div className="card-footer">
            <span className="footer-action-text">Open Storage Hub</span>
            <svg viewBox="0 0 24 24" className="footer-arrow-icon" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Modern custom toast alert when clicking on under construction cards */}
      {activeToast && (
        <div className="rites-admin-toast">
          <span className="toast-icon">🚧</span>
          <span className="toast-message">{activeToast}</span>
        </div>
      )}
    </div>
  );
};

export default RitesAdminDashboard;
