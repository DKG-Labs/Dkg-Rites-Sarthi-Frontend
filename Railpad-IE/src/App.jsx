import React, { useState } from 'react';
import RawMaterialForm from './components/RawMaterialForm';
import MixingForm from './components/MixingForm';
import SheetingForm from './components/SheetingForm';
import RheometerForm from './components/RheometerForm';
import PreShiftVerificationForm from './components/PreShiftVerificationForm';
import HourlyChecksForm from './components/HourlyChecksForm';
import HydraulicPressForm from './components/HydraulicPressForm';
import VisualInspectionForm from './components/VisualInspectionForm';
import TableView from './components/TableView';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import { isAuthenticated, logoutUser, getStoredUser } from './services/authService';
import ConfirmationModal from './components/common/ConfirmationModal';
import RawMaterialVerificationList from './components/RawMaterialVerificationList';
import ProductionVerificationDashboard from './components/ProductionVerification/ProductionVerificationDashboard';
import PortalHome from './components/PortalHome';
import FinalInspectionDashboard from './components/FinalInspection/FinalInspectionDashboard';

const SUB_CARDS = [
  { id: 'raw-material', title: 'Raw Material Weighment', description: 'Monitor and log raw material proportions' },
  { id: 'mixing', title: 'Mixing at Kneader & Mill', description: 'Monitor mixing parameters at Kneader/Mill' },
  { id: 'sheeting', title: 'Sheeting / Sizing', description: 'Verify physical formation of rubber sheets' },
  { id: 'rheometer', title: 'Rheometer Test', description: 'Ensure proper vulcanization time and temp' }
];

const PRE_SHIFT_SUB_CARDS = [
  { id: 'mould-verification', title: 'Mould Verification', description: 'Check dimensional accuracy and defects' }
];

const MOULDING_INSPECTION_SUB_CARDS = [
  { id: 'hydraulic-press', title: 'Moulding at Hydraulic Press', description: 'Monitor curing parameters during vulcanization at presses' },
  { id: 'visual-inspection', title: 'Finishing (Visual Inspection)', description: 'Visually verify physical condition and surface quality' }
];

const VERIFICATION_SUB_CARDS = [
  { id: 'natural-rubber', title: 'Natural Rubber', balance: '950 kg', pending: 2 },
  { id: 'rss1', title: 'RSS1', balance: '1,250 kg', pending: 2 },
  { id: 'rss2', title: 'RSS2', balance: '2,100 kg', pending: 1 },
  { id: 'rss3', title: 'RSS3', balance: '450 kg', pending: 2 },
  { id: 'sbr', title: 'SBR', balance: '1,500 kg', pending: 1 },
  { id: 'pbr', title: 'PBR', balance: '3,200 kg', pending: 3 },
  { id: 'carbon-black', title: 'Carbon Black', balance: '5,000 kg', pending: 2 }
];

const MODULES = [
  {
    id: 'batch-prep',
    title: 'Batch Preparation & Mixing',
    subtitle: 'Periodic checks for compounding, milling, and kneading operations',
    icon: '🌀'
  },
  {
    id: 'pre-shift',
    title: 'Pre-shift Verification',
    subtitle: 'Initial machine and safety check list',
    icon: '📋'
  },
  {
    id: 'moulding-inspection',
    title: 'Moulding and Final Inspection (Hourly Checks)',
    subtitle: 'Hourly checks for moulding process and final product inspection',
    icon: '🔍'
  },
  {
    id: 'raw-material-verification',
    title: 'Process IE - Incoming Raw Material Verification',
    subtitle: 'Digitally review, verify and approve vendor material entries',
    icon: '🏗️'
  },
  {
    id: 'production-verification',
    title: 'Process IE - Production Verification & Acceptance',
    subtitle: 'Review shift production, log rejections and finalize accepted inventory',
    icon: '✅'
  }
];

const App = () => {
  const [activeItem, setActiveItem] = useState('PortalHome');
  const [selectedModule, setSelectedModule] = useState('batch-prep');
  const [activeCard, setActiveCard] = useState('raw-material');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editIndex, setEditIndex] = useState(-1);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [entries, setEntries] = useState({
    'mould-verification': [],
    'raw-material': [],
    'mixing': [],
    'sheeting': [],
    'rheometer': [],
    'hydraulic-press': [],
    'visual-inspection': [],
    'natural-rubber': [],
    'rss1': [],
    'rss2': [],
    'rss3': [],
    'sbr': [],
    'pbr': [],
    'carbon-black': []
  });

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const loggedInUser = getStoredUser();

  const [currentShift, setCurrentShift] = useState({
    user: loggedInUser ? `Process IE - ${loggedInUser.userName}` : 'Process IE - Railpad-IE',
    shift: 'A',
    date: new Date().toLocaleDateString()
  });

  if (!isAuthenticated()) {
    window.location.href = '/';
    return null;
  }

  const handleAddEntry = (newData) => {
    const currentActiveCard = activeCard;
    if (editIndex > -1) {
      const newEntries = [...entries[currentActiveCard]];
      newEntries[editIndex] = newData;
      setEntries(prev => ({ ...prev, [currentActiveCard]: newEntries }));
    } else {
      setEntries(prev => ({
        ...prev,
        [currentActiveCard]: [newData, ...prev[currentActiveCard]]
      }));
    }
    closeForm();
  };

  const handleEdit = (item, index) => {
    if (!isShiftActive) return;
    setEditItem(item);
    setEditIndex(index);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    setEditIndex(-1);
  };

  const handleCompleteShift = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Complete Shift',
      message: 'Are you sure you want to complete your shift duty? This will lock all entries for this shift permanently.',
      type: 'warning',
      onConfirm: () => {
        setIsShiftActive(false);
        setActiveItem('PortalHome');
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleLogout = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Logout Confirmation',
      message: 'Are you sure you want to logout from RailPad IE?',
      type: 'danger',
      confirmText: 'Logout',
      onConfirm: () => {
        logoutUser();
        window.location.href = '/';
      }
    });
  };

  const activeDoc = [...SUB_CARDS, ...PRE_SHIFT_SUB_CARDS, ...MOULDING_INSPECTION_SUB_CARDS, ...VERIFICATION_SUB_CARDS].find(c => c.id === activeCard);

  return (
    <MainLayout 
      activeItem={activeItem} 
      onItemClick={(item) => setActiveItem(item)}
      onLogout={handleLogout}
      user={loggedInUser}
      isShiftActive={isShiftActive}
    >
      {activeItem === 'PortalHome' ? (
        <PortalHome 
          user={loggedInUser} 
          isShiftActive={isShiftActive}
          onModuleSelect={(moduleId) => {
            if (moduleId === 'IE') {
              setIsShiftActive(true);
              setActiveItem('IE');
              setSelectedModule('batch-prep');
              setActiveCard('raw-material');
            } else if (moduleId === 'FINAL_INSPECTION') {
              setActiveItem('FINAL_INSPECTION');
            } else {
              setActiveItem(moduleId);
            }
          }} 
        />
      ) : activeItem === 'FINAL_INSPECTION' ? (
        <div className="dashboard-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', width: '100%' }}>
          <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.025em',
                margin: '0 0 4px 0'
              }}>
                Final Inspection
              </h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
                Rail Pad quality acceptance and multi-layer verification
              </p>
            </div>
            <div style={{
              background: isShiftActive ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${isShiftActive ? '#10b981' : '#ef4444'}`,
              padding: '12px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: isShiftActive ? '#059669' : '#b91c1c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Shift Status
                </div>
                <div style={{ fontWeight: '700', color: isShiftActive ? '#065f46' : '#991b1b', fontSize: '14px' }}>
                  {isShiftActive ? 'ACTIVE (Ongoing Duty)' : 'COMPLETED (Duty Locked)'}
                </div>
              </div>
            </div>
          </header>
          <FinalInspectionDashboard user={loggedInUser} isShiftActive={isShiftActive} />
        </div>
      ) : (
        <div className="dashboard-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', width: '100%' }}>
          <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.025em',
                margin: '0 0 4px 0'
              }}>
                RailPad IE
              </h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
                Quality assurance and production management system
              </p>
            </div>
            <div style={{
              background: isShiftActive ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${isShiftActive ? '#10b981' : '#ef4444'}`,
              padding: '12px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: isShiftActive ? '#059669' : '#b91c1c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Shift Status
                </div>
                <div style={{ fontWeight: '700', color: isShiftActive ? '#065f46' : '#991b1b', fontSize: '14px' }}>
                  {isShiftActive ? 'ACTIVE (Ongoing Duty)' : 'COMPLETED (Duty Locked)'}
                </div>
              </div>
              {isShiftActive && (
                <button 
                  onClick={handleCompleteShift}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseEnter={e => e.target.style.background = '#059669'}
                  onMouseLeave={e => e.target.style.background = '#10b981'}
                >
                  Mark Duty Complete
                </button>
              )}
            </div>
          </header>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              {MODULES.map(mod => (
                <div
                  key={mod.id}
                  onClick={() => {
                    setSelectedModule(selectedModule === mod.id ? null : mod.id);
                    if (mod.id === 'pre-shift') {
                      setActiveCard('mould-verification');
                    } else if (mod.id === 'batch-prep') {
                      setActiveCard('raw-material');
                    } else if (mod.id === 'moulding-inspection') {
                      setActiveCard('hydraulic-press');
                    } else if (mod.id === 'raw-material-verification') {
                      setActiveCard('verification-dashboard');
                    } else if (mod.id === 'production-verification') {
                      setActiveCard('production-verification-dashboard');
                    }
                  }}
                  style={{
                    background: selectedModule === mod.id ? '#eff6ff' : '#ffffff',
                    border: `1px solid ${selectedModule === mod.id ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '85px',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: selectedModule === mod.id ? '0 0 0 1px #3b82f6' : 'none'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    <span style={{
                      fontWeight: '700',
                      fontSize: '12px',
                      color: selectedModule === mod.id ? '#1e40af' : '#111827',
                      lineHeight: '1.2',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {mod.title}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: selectedModule === mod.id ? '#3b82f6' : '#6b7280',
                      fontWeight: '500',
                      lineHeight: '1.1',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {mod.subtitle}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: '20px',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {mod.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-in" style={{ marginTop: '20px' }}>
            {selectedModule === 'batch-prep' ? (
              <>
                <div className="ie-tab-row">
                  {SUB_CARDS.map(tab => (
                    <div
                      key={tab.id}
                      className={`ie-tab-card ${activeCard === tab.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCard(tab.id);
                        closeForm();
                      }}
                    >
                      <span className="ie-tab-title">
                        {tab.title}
                      </span>
                      <span className="ie-tab-subtitle">{tab.description}</span>
                    </div>
                  ))}
                </div>

                <div className="ie-content-area">
                  <div className="vendor-section-header">
                    <h2 className="vendor-section-title">{activeDoc?.title || 'Module'} Overview</h2>
                    <p className="vendor-section-subtitle">Select and manage {(activeDoc?.title || '').toLowerCase()} for the current shift</p>
                  </div>

                  <div className="table-card">
                    <div className="action-bar-row">
                      <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input type="text" className="search-input" placeholder={`Search ${activeDoc?.title.toLowerCase()}...`} />
                      </div>
                      <button
                        className="export-btn"
                        onClick={() => {
                          setEditItem(null);
                          setEditIndex(-1);
                          setShowForm(true);
                        }}
                        disabled={!isShiftActive}
                      >
                        + Add New Entry
                      </button>
                    </div>
                    <TableView
                      type={activeCard}
                      data={entries[activeCard] || []}
                      isShiftActive={isShiftActive}
                      onEdit={handleEdit}
                    />
                  </div>
                </div>
              </>
            ) : selectedModule === 'pre-shift' ? (
              <>
                <div className="ie-tab-row">
                  {PRE_SHIFT_SUB_CARDS.map(tab => (
                    <div
                      key={tab.id}
                      className={`ie-tab-card ${activeCard === tab.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCard(tab.id);
                        closeForm();
                      }}
                    >
                      <span className="ie-tab-title">
                        {tab.title}
                      </span>
                      <span className="ie-tab-subtitle">{tab.description}</span>
                    </div>
                  ))}
                </div>

                <div className="ie-content-area fade-in">
                  <div className="vendor-section-header">
                    <h2 className="vendor-section-title">{PRE_SHIFT_SUB_CARDS.find(c => c.id === activeCard)?.title || 'Verification'} Overview</h2>
                    <p className="vendor-section-subtitle">Manage initial checks and readiness</p>
                  </div>

                  <div className="table-card">
                    <div className="action-bar-row">
                      <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input type="text" className="search-input" placeholder="Search entries..." />
                      </div>
                      <button
                        className="export-btn"
                        onClick={() => {
                          setEditItem(null);
                          setEditIndex(-1);
                          setShowForm(true);
                        }}
                        disabled={!isShiftActive}
                      >
                        + Add New Entry
                      </button>
                    </div>
                    <TableView
                      type={activeCard}
                      data={entries[activeCard] || []}
                      isShiftActive={isShiftActive}
                      onEdit={handleEdit}
                    />
                  </div>
                </div>
              </>
            ) : selectedModule === 'moulding-inspection' ? (
              <>
                <div className="ie-tab-row">
                  {MOULDING_INSPECTION_SUB_CARDS.map(tab => (
                    <div
                      key={tab.id}
                      className={`ie-tab-card ${activeCard === tab.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCard(tab.id);
                        closeForm();
                      }}
                    >
                      <span className="ie-tab-title">
                        {tab.title}
                      </span>
                      <span className="ie-tab-subtitle">{tab.description}</span>
                    </div>
                  ))}
                </div>

                <div className="ie-content-area fade-in">
                  <div className="vendor-section-header">
                    <h2 className="vendor-section-title">{MOULDING_INSPECTION_SUB_CARDS.find(c => c.id === activeCard)?.title || 'Inspection'} Overview</h2>
                    <p className="vendor-section-subtitle">Manage hourly checks and inspection data</p>
                  </div>

                  <div className="table-card">
                    <div className="action-bar-row">
                      <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input type="text" className="search-input" placeholder="Search entries..." />
                      </div>
                      <button
                        className="export-btn"
                        onClick={() => {
                          setEditItem(null);
                          setEditIndex(-1);
                          setShowForm(true);
                        }}
                        disabled={!isShiftActive}
                      >
                        + Add New Entry
                      </button>
                    </div>
                    <TableView
                      type={activeCard}
                      data={entries[activeCard] || []}
                      isShiftActive={isShiftActive}
                      onEdit={handleEdit}
                    />
                  </div>
                </div>
              </>
            ) : selectedModule === 'raw-material-verification' ? (
              <div className="fade-in">
                <div className="verification-module-header" style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                    Incoming Raw Material Verification
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '15px' }}>
                    Select a material to review and verify vendor inventory submissions
                  </p>
                </div>

                {activeCard === 'verification-dashboard' ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px'
                  }}>
                    {VERIFICATION_SUB_CARDS.map(card => (
                      <div
                        key={card.id}
                        className="verification-card"
                        onClick={() => setActiveCard(card.id)}
                        style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '24px',
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '4px',
                          height: '100%',
                          background: card.pending > 0 ? '#ef4444' : '#10b981'
                        }} />
                        
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>
                          {card.title}
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Balance Inventory</span>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{card.balance}</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Pending Verification</span>
                            <div style={{
                              background: card.pending > 0 ? '#fef2f2' : '#f0fdf4',
                              color: card.pending > 0 ? '#991b1b' : '#166534',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              {card.pending} {card.pending === 1 ? 'Entry' : 'Entries'}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          marginTop: '20px',
                          paddingTop: '16px',
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: '#3b82f6',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          <span>View Details</span>
                          <span>→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ie-content-area fade-in">
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        onClick={() => setActiveCard('verification-dashboard')}
                        style={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#475569'
                        }}
                      >
                        ← Back to Dashboard
                      </button>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                        {VERIFICATION_SUB_CARDS.find(c => c.id === activeCard)?.title} - Pending Entries
                      </h3>
                    </div>

                    <div className="table-card">
                      <RawMaterialVerificationList 
                        materialId={activeCard}
                        loggedInUser={loggedInUser}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : selectedModule === 'production-verification' ? (
              <div className="fade-in">
                <ProductionVerificationDashboard 
                  activeCard={activeCard}
                  setActiveCard={setActiveCard}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>👆</div>
                <h3>Select a Module</h3>
                <p>Click on anomalous module card above to drill down.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          {activeCard === 'raw-material' && (
            <RawMaterialForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
            />
          )}
          {activeCard === 'mixing' && (
            <MixingForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
            />
          )}
          {activeCard === 'sheeting' && (
            <SheetingForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
            />
          )}
          {activeCard === 'rheometer' && (
            <RheometerForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
            />
          )}
          {activeCard === 'mould-verification' && (
            <PreShiftVerificationForm
              type={activeCard}
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              currentShift={currentShift}
            />
          )}
          {activeCard === 'hydraulic-press' && (
            <HydraulicPressForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              currentShift={currentShift}
            />
          )}
          {activeCard === 'visual-inspection' && (
            <VisualInspectionForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              currentShift={currentShift}
            />
          )}
        </div>
      )}
      
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel !== false}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </MainLayout>
  );
};

export default App;
