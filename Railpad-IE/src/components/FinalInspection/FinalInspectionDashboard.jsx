import React, { useState, useEffect } from 'react';

const FinalInspectionDashboard = ({ user, isShiftActive }) => {
  const [activeTab, setActiveTab] = useState('visual');
  const [selectedLot, setSelectedLot] = useState('LOT-2024-001');
  const [reTestActive, setReTestActive] = useState(false);
  const [reOfferActive, setReOfferActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Management for Dirty Form
  const [isDirty, setIsDirty] = useState(false);
  const [pendingLotId, setPendingLotId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // State for Visual & Dimensional Testing
  const [visualData, setVisualData] = useState({ dv: 0, dd: 0 });

  // State for Physical Properties (Tab 2)
  const [physicalData, setPhysicalData] = useState({
    hardness: [0, 0, 0],
    tensile: { before: 0, after: 0 },
    modulus: { before: 0, after: 0 },
    compressionSet: 0,
    tensionSet: 0,
    loadDeflection: 0
  });

  // State for Electrical & Chemical (Tab 3)
  const [elecData, setElecData] = useState({
    before: { f: 0, r: 0 },
    after: { f: 0, r: 0 },
    sg: { product: 0, baseline: 1.25 },
    ash: { product: 0, baseline: 35 }
  });

  // State for Specialized Tests (Tab 4)
  const [specType, setSpecType] = useState('CGRSP');
  const [specData, setSpecData] = useState({
    adhesion: [0, 0],
    secant: { p20: [0, 0], p90: [0, 0] },
    ncrgrsp: { peel: 0, hpull: 0, breaking: 0, denier: 0, epi: 0, thickness: 0 }
  });

  // Browser Warning for Unsaved Changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const loadLotData = (lotId) => {
    // In a real app, this would be an API call
    console.log(`Loading data for ${lotId}...`);
    setSelectedLot(lotId);
    setIsDirty(false);
    setPendingLotId(null);
    setShowConfirmModal(false);
    
    // Reset form states (simulating new data load)
    setVisualData({ dv: 0, dd: 0 });
    setPhysicalData({
      hardness: [0, 0, 0],
      tensile: { before: 0, after: 0 },
      modulus: { before: 0, after: 0 },
      compressionSet: 0,
      tensionSet: 0,
      loadDeflection: 0
    });
  };

  const handleLotClick = (lotId) => {
    if (lotId === selectedLot) return;

    if (isDirty) {
      setPendingLotId(lotId);
      setShowConfirmModal(true);
    } else {
      loadLotData(lotId);
    }
  };

  const handleDiscardChanges = () => {
    loadLotData(pendingLotId);
  };

  const handleSave = () => {
    // Simulate Save
    console.log("Persisting data to server...");
    setIsDirty(false);
    alert(`Data for ${selectedLot} saved successfully!`);
  };

  // Layer 2: Automated Calculations
  const calculateMedian = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[1]; // Median of 3
  };

  const calculateRetention = (before, after) => {
    if (!before) return 0;
    return ((after / before) * 100).toFixed(2);
  };

  const calculateMean = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(3) : 0;

  // AQL Config
  const aqlConfig = { n: 13, ac: 0, re: 1 };

  const getResult = (count) => {
    if (count <= aqlConfig.ac) return 'PASS';
    if (count >= aqlConfig.re) return 'FAIL';
    return 'MARGINAL';
  };

  // Tab 1 Logic
  const visualResult = getResult(visualData.dv);
  const dimensionalResult = getResult(visualData.dd);
  const finalDecision = (visualResult === 'PASS' && dimensionalResult === 'PASS') 
    ? 'LOT PASSED' 
    : (dimensionalResult !== 'PASS') ? 'RE-OFFER REQUIRED (Dimensional)' : 'RE-TEST REQUIRED (Visual)';

  // Tab 2 Logic
  const physicalResults = {
    hardness: calculateMedian(physicalData.hardness) >= 60 && calculateMedian(physicalData.hardness) <= 70 ? 'PASS' : 'FAIL',
    tensile: calculateRetention(physicalData.tensile.before, physicalData.tensile.after) >= 80 ? 'PASS' : 'FAIL',
    compression: physicalData.compressionSet <= 15 ? 'PASS' : 'FAIL',
    tension: physicalData.tensionSet <= 5 ? 'PASS' : 'FAIL',
    load: physicalData.loadDeflection >= 2 && physicalData.loadDeflection <= 4 ? 'PASS' : 'FAIL'
  };
  const failedCount = Object.values(physicalResults).filter(r => r === 'FAIL').length;
  const physicalDecision = failedCount === 0 ? 'LOT PASSED' : failedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT';

  // Tab 3 Logic
  const elecResults = {
    resistanceBefore: Math.min(elecData.before.f, elecData.before.r) >= 100 ? 'PASS' : 'FAIL',
    resistanceAfter: Math.min(elecData.after.f, elecData.after.r) >= 10 ? 'PASS' : 'FAIL',
    sg: Math.abs(elecData.sg.product - elecData.sg.baseline) <= 0.03 ? 'PASS' : 'FAIL',
    ash: Math.abs(elecData.ash.product - elecData.ash.baseline) <= 2 ? 'PASS' : 'FAIL'
  };
  const elecFailedCount = Object.values(elecResults).filter(r => r === 'FAIL').length;
  const elecDecision = elecFailedCount === 0 ? 'LOT PASSED' : elecFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT';

  // Tab 4 Logic
  const mean20 = calculateMean(specData.secant.p20);
  const mean90 = calculateMean(specData.secant.p90);
  const secantStiffness = mean20 && mean90 ? (70 / (mean90 - mean20)).toFixed(2) : 0;

  const specResults = specType === 'CGRSP' ? {
    adhesion: specData.adhesion.every(v => v >= 12) ? 'PASS' : 'FAIL',
    secant: secantStiffness >= 15 && secantStiffness <= 25 ? 'PASS' : 'FAIL'
  } : {
    peel: specData.ncrgrsp.peel >= 15 ? 'PASS' : 'FAIL',
    hpull: specData.ncrgrsp.hpull >= 120 ? 'PASS' : 'FAIL',
    breaking: specData.ncrgrsp.breaking >= 500 ? 'PASS' : 'FAIL',
    cord: specData.ncrgrsp.denier >= 800 ? 'PASS' : 'FAIL'
  };
  const specFailedCount = Object.values(specResults).filter(r => r === 'FAIL').length;
  const specDecision = specFailedCount === 0 ? 'LOT PASSED' : specFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT';

  const lots = [
    { id: 'LOT-2024-001', size: 1500, status: 'Pending' },
    { id: 'LOT-2024-002', size: 2000, status: 'Under Testing' },
    { id: 'LOT-2024-003', size: 1200, status: 'Passed' },
    { id: 'LOT-2024-004', size: 1800, status: 'Rejected' },
  ];

  const filteredLots = lots.filter(lot => lot.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const tabs = [
    { id: 'visual', label: 'Visual & Dimensional' },
    { id: 'physical', label: 'Physical Tests' },
    { id: 'electrical', label: 'Electrical & Chemical' },
    { id: 'specialized', label: 'Specialized Tests' },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', background: '#f8fafc', gap: '16px', padding: '0 16px 16px 16px', boxSizing: 'border-box', position: 'relative' }}>
      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalPop {
            from { opacity: 0; transform: scale(0.95) translateY(-20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}
      </style>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>Unsaved Changes</h3>
            <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 32px 0', lineHeight: '1.5' }}>
              You have unsaved changes in the current lot testing form. Switching lots will discard these changes. Do you want to continue?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#64748b',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                No, Keep Editing
              </button>
              <button 
                onClick={handleDiscardChanges}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        width: '200px',
        background: 'white',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lot Selection</h3>
            {isDirty && <span style={{ fontSize: '9px', background: '#fef2f2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>UNSAVED CHANGES</span>}
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search Lot ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                fontWeight: '500',
                outline: 'none',
                background: '#f8fafc',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {filteredLots.map(lot => (
            <div 
              key={lot.id}
              onClick={() => handleLotClick(lot.id)}
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: selectedLot === lot.id ? '#f0f9fa' : 'white',
                border: `2px solid ${selectedLot === lot.id ? '#21808d' : '#f1f5f9'}`,
                cursor: 'pointer',
                marginBottom: '10px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selectedLot === lot.id ? '0 4px 6px -1px rgba(33, 128, 141, 0.1)' : 'none'
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', fontSize: '11px', color: '#0f172a' }}>{lot.id}</span>
                  <span style={{ color: selectedLot === lot.id ? '#21808d' : '#cbd5e1', fontSize: '10px' }}>{selectedLot === lot.id ? '●' : '○'}</span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ 
                    fontSize: '9px', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    background: lot.status === 'Passed' ? '#dcfce7' : lot.status === 'Rejected' ? '#fee2e2' : lot.status === 'Under Testing' ? '#fef9c3' : '#f1f5f9',
                    color: lot.status === 'Passed' ? '#166534' : lot.status === 'Rejected' ? '#991b1b' : lot.status === 'Under Testing' ? '#854d0e' : '#475569',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'inline-block'
                  }}>
                    {lot.status}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>
                Size: <span style={{ fontWeight: '700', color: '#334155' }}>{lot.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '6px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '4px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '16px',
                border: 'none',
                background: activeTab === tab.id ? '#21808d' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          flex: 1,
          background: 'white',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                  {tabs.find(t => t.id === activeTab).label}
                </h2>
                <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px', fontWeight: '700', color: '#334155' }}>{selectedLot}</span>
                  <span>•</span>
                  <span>System Validation Enabled</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {isDirty && (
                  <div style={{ 
                    padding: '10px 18px', 
                    background: '#fff7ed', 
                    borderRadius: '12px', 
                    border: '1px solid #ffedd5', 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    color: '#c2410c',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ width: '8px', height: '8px', background: '#ea580c', borderRadius: '50%' }} />
                    UNSAVED DATA
                  </div>
                )}
                <div style={{ 
                  padding: '10px 18px', 
                  background: '#f0f9fa', 
                  borderRadius: '12px', 
                  border: '1px solid #b2dfdb', 
                  fontSize: '11px', 
                  fontWeight: '800', 
                  color: '#21808d',
                  letterSpacing: '0.05em'
                }}>
                  LAYER 3 DECISION ENGINE ACTIVE
                </div>
              </div>
            </div>
            
            {activeTab === 'visual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {/* Sampling Details */}
                <section>
                  <h4 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
                    Section 2.1: Sampling Details (AQL Config)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {[
                      { label: 'Lot Size', value: lots.find(l => l.id === selectedLot)?.size || '0' },
                      { label: 'Sample Size (N)', value: aqlConfig.n },
                      { label: 'Acceptance (Ac)', value: aqlConfig.ac },
                      { label: 'Rejection (Re)', value: aqlConfig.re }
                    ].map(field => (
                      <div key={field.label} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase' }}>{field.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{field.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Main Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '20px', padding: '28px', position: 'relative', background: '#fff' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: visualResult === 'PASS' ? '#10b981' : '#ef4444', borderRadius: '20px 0 0 20px' }} />
                    <h4 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '700', color: '#334155' }}>2.2 Visual Inspection</h4>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>Visual Not OK Count (Dv)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={visualData.dv}
                        onChange={(e) => {
                          setVisualData(prev => ({ ...prev, dv: Math.max(0, parseInt(e.target.value) || 0) }));
                          markDirty();
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '14px 18px', 
                          borderRadius: '12px', 
                          border: '2px solid #f1f5f9',
                          fontSize: '18px',
                          fontWeight: '800',
                          outline: 'none',
                          background: '#f8fafc',
                          transition: 'all 0.2s',
                          color: '#1e293b',
                          boxSizing: 'border-box'
                        }} 
                        placeholder="0" 
                      />
                    </div>
                    <div style={{ 
                      padding: '14px', 
                      borderRadius: '12px', 
                      background: visualResult === 'PASS' ? '#ecfdf5' : '#fef2f2', 
                      color: visualResult === 'PASS' ? '#059669' : '#b91c1c', 
                      fontSize: '13px', 
                      fontWeight: '900', 
                      textAlign: 'center',
                      border: `1px solid ${visualResult === 'PASS' ? '#a7f3d0' : '#fecaca'}`,
                      letterSpacing: '0.05em'
                    }}>
                      RESULT: {visualResult}
                    </div>
                  </section>

                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '20px', padding: '28px', position: 'relative', background: '#fff' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: dimensionalResult === 'PASS' ? '#10b981' : '#ef4444', borderRadius: '20px 0 0 20px' }} />
                    <h4 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '700', color: '#334155' }}>2.3 Dimensional Inspection</h4>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>Dimensional Not OK Count (Dd)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={visualData.dd}
                        onChange={(e) => {
                          setVisualData(prev => ({ ...prev, dd: Math.max(0, parseInt(e.target.value) || 0) }));
                          markDirty();
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '14px 18px', 
                          borderRadius: '12px', 
                          border: '2px solid #f1f5f9',
                          fontSize: '18px',
                          fontWeight: '800',
                          outline: 'none',
                          background: '#f8fafc',
                          transition: 'all 0.2s',
                          color: '#1e293b',
                          boxSizing: 'border-box'
                        }} 
                        placeholder="0" 
                      />
                    </div>
                    <div style={{ 
                      padding: '14px', 
                      borderRadius: '12px', 
                      background: dimensionalResult === 'PASS' ? '#ecfdf5' : '#fef2f2', 
                      color: dimensionalResult === 'PASS' ? '#059669' : '#b91c1c', 
                      fontSize: '13px', 
                      fontWeight: '900', 
                      textAlign: 'center',
                      border: `1px solid ${dimensionalResult === 'PASS' ? '#a7f3d0' : '#fecaca'}`,
                      letterSpacing: '0.05em'
                    }}>
                      RESULT: {dimensionalResult}
                    </div>
                  </section>
                </div>

                {/* Final Decision Block */}
                <section style={{ 
                  background: finalDecision === 'LOT PASSED' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)', 
                  padding: '40px', 
                  borderRadius: '24px', 
                  color: 'white',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px', fontWeight: '800' }}>Final Tab Decision Engine</div>
                      <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.03em' }}>{finalDecision}</div>
                      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '12px', fontWeight: '500' }}>
                        {finalDecision === 'LOT PASSED' 
                          ? 'Automated validation confirm lot meets all AQL standard requirements.' 
                          : 'Specific trigger identified. Follow Section 4/5 protocols below.'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {finalDecision.includes('RE-TEST') && (
                        <button 
                          onClick={() => setReTestActive(true)}
                          style={{ 
                            background: 'white', 
                            color: '#991b1b', 
                            border: 'none', 
                            padding: '16px 28px', 
                            borderRadius: '14px', 
                            fontWeight: '800',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          INITIATE RE-TEST
                        </button>
                      )}
                      {finalDecision.includes('RE-OFFER') && (
                        <button 
                          onClick={() => setReOfferActive(true)}
                          style={{ 
                            background: '#fbbf24', 
                            color: '#78350f', 
                            border: 'none', 
                            padding: '16px 28px', 
                            borderRadius: '14px', 
                            fontWeight: '800',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          ENABLE RE-OFFER
                        </button>
                      )}
                      <button 
                        onClick={handleSave}
                        style={{ 
                          background: '#21808d', 
                          color: 'white', 
                          border: 'none', 
                          padding: '16px 36px', 
                          borderRadius: '14px', 
                          fontWeight: '800',
                          fontSize: '14px',
                          cursor: 'pointer',
                          boxShadow: '0 10px 15px -3px rgba(33, 128, 141, 0.4)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 15px 20px -3px rgba(33, 128, 141, 0.5)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(33, 128, 141, 0.4)'}
                      >
                        Submit Final Result
                      </button>
                    </div>
                  </div>
                </section>

                {/* Dynamic Expansion: Re-test / 2nd Sampling */}
                {reTestActive && (
                  <section style={{ 
                    border: '2px solid #8b5cf6', 
                    borderRadius: '24px', 
                    padding: '36px', 
                    background: '#f5f3ff',
                    animation: 'slideDown 0.4s cubic-bezier(0, 0, 0.2, 1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#5b21b6' }}>
                          SRS Section 4: RE-TEST Protocol
                        </h3>
                        <p style={{ fontSize: '14px', color: '#7c3aed', marginTop: '6px', fontWeight: '500' }}>
                          Double sample size required (N=26) • Fresh samples must be used
                        </p>
                      </div>
                      <button 
                        onClick={() => setReTestActive(false)}
                        style={{ background: '#ede9fe', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: '800', padding: '10px 20px', borderRadius: '10px' }}
                      >
                        Close Protocol
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                      <div style={{ background: 'white', padding: '28px', borderRadius: '16px', border: '1px solid #ddd6fe' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '10px' }}>
                          New Visual Not OK Count (Re-test)
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          onChange={(e) => {
                            if (parseInt(e.target.value) < 0) e.target.value = 0;
                            markDirty();
                          }}
                          style={{ 
                            width: '100%', 
                            padding: '14px', 
                            borderRadius: '10px', 
                            border: '2px solid #ddd6fe',
                            fontSize: '18px',
                            fontWeight: '800',
                            color: '#1e293b',
                            boxSizing: 'border-box'
                          }} 
                          placeholder="0" 
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '16px', padding: '28px', border: '1px dashed #c084fc' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trigger 4.1 Validation</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#5b21b6', marginTop: '4px' }}>Within AQL limit → Lot Passes</div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Dynamic Expansion: Re-Offer */}
                {reOfferActive && (
                  <section style={{ 
                    border: '2px solid #fbbf24', 
                    borderRadius: '24px', 
                    padding: '36px', 
                    background: '#fffbeb',
                    animation: 'slideDown 0.4s cubic-bezier(0, 0, 0.2, 1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#92400e' }}>
                          SRS Section 5: RE-OFFER Protocol
                        </h3>
                        <p style={{ fontSize: '14px', color: '#b45309', marginTop: '6px', fontWeight: '500' }}>
                          Dimensional failure detected • One-time re-offering allowed
                        </p>
                      </div>
                      <button 
                        onClick={() => setReOfferActive(false)}
                        style={{ background: '#fef3c7', border: 'none', color: '#b45309', cursor: 'pointer', fontWeight: '800', padding: '10px 20px', borderRadius: '10px' }}
                      >
                        Close Protocol
                      </button>
                    </div>
                    <div style={{ padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #fde68a', textAlign: 'center' }}>
                      <div style={{ color: '#92400e', fontWeight: '800', fontSize: '16px', marginBottom: '20px' }}>Current Lot marked as "Rejected - Dimensions". Ready for Re-Offer.</div>
                      <button 
                        onClick={markDirty}
                        style={{ background: '#d97706', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px rgba(217, 119, 6, 0.2)' }}>
                        Record Fresh Re-Offer Samples
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'physical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {/* Layer 2: Test Config */}
                <section>
                  <h4 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
                    Section 2.1: Test Configuration (Auto-Generated)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {[
                      { label: 'Pad Type', value: 'CGRSP' },
                      { label: 'Hardness Target', value: '60-70 IRHD' },
                      { label: 'Tensile Retention', value: '≥ 80%' },
                      { label: 'Compression Set', value: '≤ 15%' }
                    ].map(field => (
                      <div key={field.label} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase' }}>{field.label}</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{field.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  {/* Hardness Test */}
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '20px', padding: '28px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#334155' }}>2.2 Hardness Test</h4>
                      <span style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', background: physicalResults.hardness === 'PASS' ? '#ecfdf5' : '#fef2f2', color: physicalResults.hardness === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800', letterSpacing: '0.05em' }}>
                        {physicalResults.hardness}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                      {physicalData.hardness.map((val, idx) => (
                        <div key={idx} style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700' }}>S{idx+1}</label>
                          <input 
                            type="number" 
                            min="0"
                            value={val}
                            onChange={(e) => {
                              const newH = [...physicalData.hardness];
                              newH[idx] = Math.max(0, parseInt(e.target.value) || 0);
                              setPhysicalData(prev => ({ ...prev, hardness: newH }));
                              markDirty();
                            }}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9', fontWeight: '800', fontSize: '16px', background: '#f8fafc', color: '#1e293b', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} 
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Median Value: <span style={{ fontWeight: '900', color: '#21808d', fontSize: '15px' }}>{calculateMedian(physicalData.hardness)} IRHD</span></div>
                  </section>

                  {/* Tensile Strength */}
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '20px', padding: '28px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#334155' }}>2.3 Tensile Strength</h4>
                      <span style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', background: physicalResults.tensile === 'PASS' ? '#ecfdf5' : '#fef2f2', color: physicalResults.tensile === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800', letterSpacing: '0.05em' }}>
                        {physicalResults.tensile}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700' }}>Before Ageing</label>
                        <input 
                          type="number" 
                          min="0"
                          value={physicalData.tensile.before}
                          onChange={(e) => {
                            setPhysicalData(prev => ({ ...prev, tensile: { ...prev.tensile, before: Math.max(0, parseFloat(e.target.value) || 0) } }));
                            markDirty();
                          }}
                          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9', fontWeight: '800', fontSize: '16px', background: '#f8fafc', color: '#1e293b', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700' }}>After Ageing</label>
                        <input 
                          type="number" 
                          min="0"
                          value={physicalData.tensile.after}
                          onChange={(e) => {
                            setPhysicalData(prev => ({ ...prev, tensile: { ...prev.tensile, after: Math.max(0, parseFloat(e.target.value) || 0) } }));
                            markDirty();
                          }}
                          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9', fontWeight: '800', fontSize: '16px', background: '#f8fafc', color: '#1e293b', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} 
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Retention: <span style={{ fontWeight: '900', color: '#21808d', fontSize: '15px' }}>{calculateRetention(physicalData.tensile.before, physicalData.tensile.after)}%</span></div>
                  </section>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  {[
                    { label: '2.5 Compression Set', key: 'compressionSet', res: physicalResults.compression },
                    { label: '2.6 Tension Set', key: 'tensionSet', res: physicalResults.tension },
                    { label: '2.7 Load Deflection', key: 'loadDeflection', res: physicalResults.load }
                  ].map(test => (
                    <div key={test.key} style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{test.label}</div>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: test.res === 'PASS' ? '#059669' : '#b91c1c' }}>{test.res}</span>
                      </div>
                      <input 
                        type="number" 
                        min="0"
                        value={physicalData[test.key]}
                        onChange={(e) => {
                          setPhysicalData(prev => ({ ...prev, [test.key]: Math.max(0, parseFloat(e.target.value) || 0) }));
                          markDirty();
                        }}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: '800', fontSize: '16px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }} 
                      />
                    </div>
                  ))}
                </div>

                {/* Layer 3: Physical Decision */}
                <section style={{ 
                  background: physicalDecision === 'LOT PASSED' ? '#0f172a' : physicalDecision.includes('PERMANENT') ? '#991b1b' : '#21808d', 
                  padding: '32px', 
                  borderRadius: '24px', 
                  color: 'white',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: '800' }}>Tab 2 Final Decision Engine</div>
                      <div style={{ fontSize: '28px', fontWeight: '900' }}>{physicalDecision}</div>
                      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '8px', fontWeight: '500' }}>
                        {failedCount === 1 ? 'Rule 4: Multiple sampling required for verification.' : failedCount > 1 ? 'Rule 5: Lot fails physical property audit.' : 'All physical properties verified.'}
                      </div>
                    </div>
                    {failedCount === 1 && (
                      <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                        INITIATE RE-TEST
                      </button>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'electrical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <section>
                  <h4 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
                    Section 2.1: Baseline Configuration
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    {[
                      { label: 'Approved SG Baseline', value: '1.25 ± 0.03' },
                      { label: 'Approved Ash %', value: '35% ± 2.0' },
                      { label: 'Dry Resistance Limit', value: '≥ 100 MΩ' }
                    ].map(field => (
                      <div key={field.label} style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{field.label}</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{field.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ border: '1px solid #f1f5f9', borderRadius: '24px', padding: '32px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#334155' }}>2.2 Electrical Resistance Test</h4>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '8px', background: elecResults.resistanceBefore === 'PASS' ? '#ecfdf5' : '#fef2f2', color: elecResults.resistanceBefore === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800' }}>Dry: {elecResults.resistanceBefore}</span>
                      <span style={{ fontSize: '11px', padding: '6px 14px', borderRadius: '8px', background: elecResults.resistanceAfter === 'PASS' ? '#ecfdf5' : '#fef2f2', color: elecResults.resistanceAfter === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800' }}>Wet: {elecResults.resistanceAfter}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '16px' }}>Dry Condition (MΩ)</div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <input type="number" min="0" placeholder="Forward" value={elecData.before.f} onChange={(e) => { setElecData(prev => ({ ...prev, before: { ...prev.before, f: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '800', fontSize: '16px', background: '#f8fafc', outline: 'none' }} />
                        <input type="number" min="0" placeholder="Reverse" value={elecData.before.r} onChange={(e) => { setElecData(prev => ({ ...prev, before: { ...prev.before, r: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '800', fontSize: '16px', background: '#f8fafc', outline: 'none' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', fontWeight: '500' }}>Minimum Value: <span style={{ color: '#21808d', fontWeight: '800' }}>{Math.min(elecData.before.f, elecData.before.r)} MΩ</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '16px' }}>Wet Condition (MΩ)</div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <input type="number" min="0" placeholder="Forward" value={elecData.after.f} onChange={(e) => { setElecData(prev => ({ ...prev, after: { ...prev.after, f: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '800', fontSize: '16px', background: '#f8fafc', outline: 'none' }} />
                        <input type="number" min="0" placeholder="Reverse" value={elecData.after.r} onChange={(e) => { setElecData(prev => ({ ...prev, after: { ...prev.after, r: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '800', fontSize: '16px', background: '#f8fafc', outline: 'none' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', fontWeight: '500' }}>Minimum Value: <span style={{ color: '#21808d', fontWeight: '800' }}>{Math.min(elecData.after.f, elecData.after.r)} MΩ</span></div>
                    </div>
                  </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '24px', padding: '32px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Specific Gravity Audit</h4>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: elecResults.sg === 'PASS' ? '#059669' : '#b91c1c' }}>{elecResults.sg}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Product SG</label>
                        <input type="number" min="0" placeholder="Product" onChange={(e) => { setElecData(prev => ({ ...prev, sg: { ...prev.sg, product: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Baseline SG</label>
                        <input type="number" min="0" placeholder="Baseline" value={elecData.sg.baseline} onChange={(e) => { setElecData(prev => ({ ...prev, sg: { ...prev.sg, baseline: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800' }} />
                      </div>
                    </div>
                  </section>
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '24px', padding: '32px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Ash Content % Audit</h4>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: elecResults.ash === 'PASS' ? '#059669' : '#b91c1c' }}>{elecResults.ash}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Product Ash %</label>
                        <input type="number" min="0" placeholder="Product %" onChange={(e) => { setElecData(prev => ({ ...prev, ash: { ...prev.ash, product: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Baseline Ash %</label>
                        <input type="number" min="0" placeholder="Baseline %" value={elecData.ash.baseline} onChange={(e) => { setElecData(prev => ({ ...prev, ash: { ...prev.ash, baseline: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800' }} />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Layer 3: Electrical Decision */}
                <section style={{ 
                  background: elecDecision === 'LOT PASSED' ? '#0f172a' : elecDecision.includes('PERMANENT') ? '#991b1b' : '#21808d', 
                  padding: '32px', 
                  borderRadius: '24px', 
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: '800' }}>Tab 3 Final Decision Engine</div>
                      <div style={{ fontSize: '28px', fontWeight: '900' }}>{elecDecision}</div>
                    </div>
                    {elecFailedCount === 1 && (
                      <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: '800' }}>
                        INITIATE RE-TEST
                      </button>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'specialized' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                      Specialized Configuration
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', padding: '4px', background: '#f1f5f9', borderRadius: '12px', width: 'fit-content' }}>
                      {['CGRSP', 'NCRGRSP'].map(t => (
                        <button key={t} onClick={() => { setSpecType(t); markDirty(); }} style={{ padding: '8px 24px', borderRadius: '10px', border: 'none', background: specType === t ? 'white' : 'transparent', color: specType === t ? '#21808d' : '#64748b', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: specType === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>{t}</button>
                      ))}
                    </div>
                  </div>
                </section>

                {specType === 'CGRSP' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <section style={{ border: '1px solid #f1f5f9', borderRadius: '24px', padding: '32px', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>2.2.1 Adhesion Strength (kN)</h4>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: specResults.adhesion === 'PASS' ? '#059669' : '#b91c1c' }}>{specResults.adhesion}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        {specData.adhesion.map((v, i) => (
                          <input key={i} type="number" min="0" placeholder={`S${i+1}`} onChange={(e) => {
                            const newA = [...specData.adhesion];
                            newA[i] = Math.max(0, parseFloat(e.target.value) || 0);
                            setSpecData(prev => ({ ...prev, adhesion: newA }));
                            markDirty();
                          }} style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '800', background: '#f8fafc' }} />
                        ))}
                      </div>
                    </section>
                    <section style={{ border: '1px solid #f1f5f9', borderRadius: '24px', padding: '32px', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>2.2.2 Secant Stiffness Audit</h4>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: specResults.secant === 'PASS' ? '#059669' : '#b91c1c' }}>{specResults.secant}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Mean 20kN</label>
                          <input type="number" min="0" placeholder="Value" onChange={(e) => { setSpecData(prev => ({ ...prev, secant: { ...prev.secant, p20: [Math.max(0, parseFloat(e.target.value) || 0), prev.secant.p20[1]] } })); markDirty(); }} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Mean 90kN</label>
                          <input type="number" min="0" placeholder="Value" onChange={(e) => { setSpecData(prev => ({ ...prev, secant: { ...prev.secant, p90: [Math.max(0, parseFloat(e.target.value) || 0), prev.secant.p90[1]] } })); markDirty(); }} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '900' }}>Stiffness: <span style={{ color: '#21808d' }}>{secantStiffness} kN/mm</span></div>
                    </section>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                    {[
                      { label: 'Peel Adhesion', key: 'peel', limit: '≥ 15' },
                      { label: 'H-Pull Test', key: 'hpull', limit: '≥ 120' },
                      { label: 'Breaking Load', key: 'breaking', limit: '≥ 500' },
                      { label: 'Cord Denier', key: 'denier', limit: '≥ 800' }
                    ].map(test => (
                      <div key={test.key} style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '16px', color: '#64748b' }}>{test.label}</div>
                        <input type="number" min="0" placeholder={test.limit} onChange={(e) => { setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, [test.key]: Math.max(0, parseFloat(e.target.value) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '900', background: '#f8fafc' }} />
                        <div style={{ fontSize: '10px', color: specResults[test.key] === 'PASS' ? '#059669' : '#b91c1c', marginTop: '12px', fontWeight: '900' }}>{specResults[test.key]}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Layer 3: Specialized Decision */}
                <section style={{ 
                  background: specDecision === 'LOT PASSED' ? '#0f172a' : specDecision.includes('PERMANENT') ? '#991b1b' : '#21808d', 
                  padding: '32px', 
                  borderRadius: '24px', 
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: '800' }}>Tab 4 Final Decision Engine</div>
                      <div style={{ fontSize: '28px', fontWeight: '900' }}>{specDecision}</div>
                    </div>
                    {specFailedCount === 1 && (
                      <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: '800' }}>
                        INITIATE RE-TEST
                      </button>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalInspectionDashboard;
