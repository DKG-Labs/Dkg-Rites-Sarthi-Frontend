import React from 'react';
import './AnnexureLoader.css';

/**
 * AnnexureLoader - Premium Enterprise Loading Experience with spinning ring & RITES logo
 */
const AnnexureLoader = ({ 
  title = "Loading Inspection Calls...", 
  subtitle = "Fetching real-time inspection records...", 
  fullScreen = false 
}) => {
  return (
    <div className={`annexure-loader-overlay ${!fullScreen ? 'loader-contained' : ''}`}>
      <div className="annexure-loader-card">
        <div className="loader-logo-container">
          <div className="loader-spinner-ring"></div>
          <img 
            src="/login-assets/riteslogo.png" 
            alt="RITES Logo" 
            className="loader-rites-logo" 
            onError={(e) => {
              e.currentTarget.src = '/sarthi-logo1.png';
            }}
          />
        </div>
        
        <div className="loader-text-group">
          <h2 className="loader-main-text">{title}</h2>
          <p className="loader-sub-text">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default AnnexureLoader;
