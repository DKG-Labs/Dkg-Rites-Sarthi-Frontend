import React from 'react';
import { formatDate } from '../utils/helpers';

const LayoutHeader = React.memo(({ userEmail, onSidebarToggle }) => (
  <header className="app-header">
    <div className="header-left">
      <div className="app-logo">SARTHI</div>
      <div className="header-dashboard-label">Inspection Engineer Dashboard</div>
    </div>
    <div className="header-right">
      <button
        className="btn btn-sm btn-outline hamburger-btn"
        onClick={onSidebarToggle}
        aria-label="Toggle menu"
        style={{ marginRight: '8px' }}
      >
        ☰
      </button>
      <div className="header-date">
        {formatDate('2025-11-14T17:00:00')}
      </div>
      <div className="user-info">
        <div className="user-avatar">IE</div>
        <div>
          <div className="user-title">Inspector Engineer</div>
          <div>{userEmail}</div>
        </div>
      </div>
      <button className="btn btn-sm btn-outline">Logout</button>
    </div>
  </header>
));

export default LayoutHeader;
