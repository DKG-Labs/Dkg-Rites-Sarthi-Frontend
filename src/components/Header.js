import React from 'react';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-logo">SARTHI</div>
      </div>
      <div className="header-right">
        <div className="user-info">
          <span>IE (Inspection Engineer)</span>
          <div className="user-avatar">IE</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
