/* eslint-disable */
import React from 'react';

/**
 * DKG_Tab — Module/Duty card tab
 * Matches Sleeper Vendor's ie-tab-card design language.
 */
const Tab = ({ icon, title, subtitle, onClick, isActive = false, className = '' }) => {
  return (
    <div className={`ie-tab-card ${className} ${isActive ? 'active' : ''}`} onClick={onClick}>
      {icon && (
        <span className="duty-tab-icon">
          {icon}
        </span>
      )}
      <div className="flex flex-col items-center justify-center">
          <span className="ie-tab-title">
              {title}
          </span>
          {subtitle && (
            <span className="ie-tab-subtitle">
              {subtitle}
            </span>
          )}
      </div>
    </div>
  );
};

export default Tab;
