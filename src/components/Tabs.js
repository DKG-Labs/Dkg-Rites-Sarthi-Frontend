import React, { useState } from 'react';

const Tabs = ({ tabs, activeTab, onChange }) => {
  const [hoveredTab, setHoveredTab] = useState(null);

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const isBlinking = Boolean(tab.highlight);
          const showTooltip = Boolean(tab.tooltip) && hoveredTab === tab.id;

          return (
            <div
              key={tab.id}
              className="tab-card-wrapper"
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                type="button"
                className={`tab-card ${isActive ? 'active' : ''} ${isBlinking ? 'tab-card-blinking' : ''}`}
                onClick={() => onChange(tab.id)}
                style={tab.style}
              >
                <div className="tab-card-label">
                  <span>{tab.label}</span>
                  {isBlinking && (
                    <span className="blinking-dot" />
                  )}
                </div>
                {tab.description && (
                  <div className="tab-card-desc">{tab.description}</div>
                )}
              </button>

              {/* Custom Styled Tooltip */}
              {tab.tooltip && (
                <div className={`custom-tab-tooltip ${showTooltip ? 'visible' : ''}`}>
                  <span className="tooltip-icon">⚠️</span>
                  <span>{tab.tooltip}</span>
                  <div className="tooltip-arrow" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
