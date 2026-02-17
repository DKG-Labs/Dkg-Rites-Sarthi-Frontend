import React from 'react';

const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="tabs-container">
    <div className="tabs-header">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            type="button"
            key={tab.id}
            className={`tab-card ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <div className="tab-card-label">{tab.label}</div>
            {tab.description && (
              <div className="tab-card-desc">{tab.description}</div>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default Tabs;
