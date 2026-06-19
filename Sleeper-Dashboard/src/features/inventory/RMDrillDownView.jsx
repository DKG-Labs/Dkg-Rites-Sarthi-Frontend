import React, { useState } from 'react';
import IncomingVerificationDashboard from '../../pages/sleeperGeneral/rawMaterialVerification/IncomingVerificationDashboard';
import RMConsumptionVerification from './RMConsumptionVerification';
import RMInventoryRegister from './RMInventoryRegister';
import './RMDrillDownView.css';

const RMDrillDownView = ({ rmCategory, onBack }) => {
    const [activeTab, setActiveTab] = useState('incoming'); // incoming, consumption, register



    return (
        <div className="rm-drilldown-container fade-in">
            {/* Header */}
            <div className="drilldown-header">
                <button className="back-btn" onClick={onBack}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Inventory
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="drilldown-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('incoming')}
                >
                    Incoming RM Verification
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'consumption' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consumption')}
                >
                    RM Consumption Verification
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                    onClick={() => setActiveTab('register')}
                >
                    RM Inventory Register
                </button>
            </div>

            {/* Content Area */}
            <div className="drilldown-content">
                {activeTab === 'incoming' && (
                    <IncomingVerificationDashboard 
                        initialGroup="Incoming Verification" 
                        initialModuleId={rmCategory.moduleId}
                        hideHeader={true}
                    />
                )}
                {activeTab === 'consumption' && <RMConsumptionVerification rmCategory={rmCategory} />}
                {activeTab === 'register' && <RMInventoryRegister rmCategory={rmCategory} />}
            </div>
        </div>
    );
};

export default RMDrillDownView;
