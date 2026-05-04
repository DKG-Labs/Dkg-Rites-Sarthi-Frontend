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
  const [visualData, setVisualData] = useState({ dv: '', dd: '' });

  // State for Physical Properties (Tab 2)
  const [physicalData, setPhysicalData] = useState({
    hardness: ['', '', ''],
    tensile: { tsBefore: '', tsAfter: '', elBefore: '', elAfter: '' },
    modulus: { before: '', after: '' },
    compressionSet: '',
    tensionSet: '',
    loadDeflection: ''
  });

  // State for Electrical & Chemical (Tab 3)
  const [elecData, setElecData] = useState({
    before: { f: '', r: '' },
    after: { f: '', r: '' },
    sg: { product: '', baseline: 1.25 },
    ash: { product: '', baseline: 35 }
  });

  // State for Specialized Tests (Tab 4)
  const [specType, setSpecType] = useState('CGRSP');
  const [specData, setSpecData] = useState({
    adhesion: ['', ''],
    secant: { p20: '', p90: '' },
    ncrgrsp: { peel: '', hpull: '', breaking: '', denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' }
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
    setVisualData({ dv: '', dd: '' });
    setPhysicalData({
      hardness: ['', '', ''],
      tensile: { tsBefore: '', tsAfter: '', elBefore: '', elAfter: '' },
      modulus: { before: '', after: '' },
      compressionSet: '',
      tensionSet: '',
      loadDeflection: ''
    });
    setElecData({
      before: { f: '', r: '' },
      after: { f: '', r: '' },
      sg: { product: '', baseline: 1.25 },
      ash: { product: '', baseline: 35 }
    });
    setSpecData({
      adhesion: ['', ''],
      secant: { p20: '', p90: '' },
      ncrgrsp: { peel: '', hpull: '', breaking: '', denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' }
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
    const validValues = arr.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (validValues.length < 3) return 0;
    const sorted = [...validValues].sort((a, b) => a - b);
    return sorted[1]; // Median of 3
  };

  const calculateRetention = (before, after) => {
    const b = parseFloat(before);
    const a = parseFloat(after);
    if (isNaN(b) || isNaN(a) || b === 0) return 0;
    return ((a / b) * 100).toFixed(2);
  };

  const calculateMean = (arr) => {
    const validValues = arr.map(v => parseFloat(v)).filter(v => !isNaN(v));
    return validValues.length ? (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(3) : 0;
  };

  // AQL Config
  const aqlConfig = { n: 13, ac: 0, re: 1 };

  const getResult = (count) => {
    if (count <= aqlConfig.ac) return 'PASS';
    if (count >= aqlConfig.re) return 'FAIL';
    return 'MARGINAL';
  };

  // Tab 1 Logic
  const visualResult = visualData.dv === '' ? 'PENDING' : getResult(visualData.dv);
  const dimensionalResult = visualData.dd === '' ? 'PENDING' : getResult(visualData.dd);
  const finalDecision = (visualResult === 'PASS' && dimensionalResult === 'PASS') 
    ? 'LOT PASSED' 
    : (visualResult === 'PENDING' || dimensionalResult === 'PENDING') ? 'PENDING VERIFICATION'
    : (visualResult !== 'PASS' && dimensionalResult !== 'PASS') ? 'LOT REJECTED (Visual & Dimensional)'
    : (dimensionalResult !== 'PASS') ? 'RE-OFFER REQUIRED (Dimensional)' : 'RE-TEST REQUIRED (Visual)';

  // Tab 2 Logic
  const isPhysicalEmpty = (key) => physicalData[key] === '' || (Array.isArray(physicalData[key]) && physicalData[key].some(v => v === '')) || (typeof physicalData[key] === 'object' && Object.values(physicalData[key]).some(v => v === ''));

  const physicalResults = {
    hardness: physicalData.hardness.some(v => v === '') ? 'PENDING' : (calculateMedian(physicalData.hardness) >= 60 && calculateMedian(physicalData.hardness) <= 70 ? 'PASS' : 'FAIL'),
    tensile: (physicalData.tensile.tsBefore === '' || physicalData.tensile.tsAfter === '') ? 'PENDING' : (calculateRetention(physicalData.tensile.tsBefore, physicalData.tensile.tsAfter) >= 80 ? 'PASS' : 'FAIL'),
    elongation: (physicalData.tensile.elBefore === '' || physicalData.tensile.elAfter === '') ? 'PENDING' : (calculateRetention(physicalData.tensile.elBefore, physicalData.tensile.elAfter) >= 80 ? 'PASS' : 'FAIL'),
    modulus: (physicalData.modulus.before === '' || physicalData.modulus.after === '') ? 'PENDING' : (Math.abs(calculateRetention(physicalData.modulus.before, physicalData.modulus.after) - 100) <= 20 ? 'PASS' : 'FAIL'),
    compression: physicalData.compressionSet === '' ? 'PENDING' : (physicalData.compressionSet <= 15 ? 'PASS' : 'FAIL'),
    tension: physicalData.tensionSet === '' ? 'PENDING' : (physicalData.tensionSet <= 5 ? 'PASS' : 'FAIL'),
    load: physicalData.loadDeflection === '' ? 'PENDING' : (physicalData.loadDeflection >= 2 && physicalData.loadDeflection <= 4 ? 'PASS' : 'FAIL')
  };
  const physicalFailedCount = Object.values(physicalResults).filter(r => r === 'FAIL').length;
  const physicalPendingCount = Object.values(physicalResults).filter(r => r === 'PENDING').length;
  const physicalDecision = physicalPendingCount > 0 ? 'PENDING VERIFICATION' : (physicalFailedCount === 0 ? 'LOT PASSED' : physicalFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT');

  // Tab 3 Logic
  const elecResults = {
    resistanceBefore: (elecData.before.f === '' || elecData.before.r === '') ? 'PENDING' : (Math.min(elecData.before.f, elecData.before.r) >= 100 ? 'PASS' : 'FAIL'),
    resistanceAfter: (elecData.after.f === '' || elecData.after.r === '') ? 'PENDING' : (Math.min(elecData.after.f, elecData.after.r) >= 10 ? 'PASS' : 'FAIL'),
    sg: elecData.sg.product === '' ? 'PENDING' : (Math.abs(elecData.sg.product - elecData.sg.baseline) <= 0.03 ? 'PASS' : 'FAIL'),
    ash: elecData.ash.product === '' ? 'PENDING' : (Math.abs(elecData.ash.product - elecData.ash.baseline) <= 2 ? 'PASS' : 'FAIL')
  };
  const elecFailedCount = Object.values(elecResults).filter(r => r === 'FAIL').length;
  const elecPendingCount = Object.values(elecResults).filter(r => r === 'PENDING').length;
  const elecDecision = elecPendingCount > 0 ? 'PENDING VERIFICATION' : (elecFailedCount === 0 ? 'LOT PASSED' : elecFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT');

  // Tab 4 Logic
  const p20Val = parseFloat(specData.secant.p20);
  const p90Val = parseFloat(specData.secant.p90);
  const secantStiffness = (specData.secant.p20 === '' || specData.secant.p90 === '') ? 0 : (p20Val && p90Val && p90Val !== p20Val ? (70 / (p90Val - p20Val)).toFixed(2) : 0);

  const specResults = specType === 'CGRSP' ? {
    adhesion: specData.adhesion.some(v => v === '') ? 'PENDING' : (specData.adhesion.every(v => v >= 12) ? 'PASS' : 'FAIL'),
    secant: (specData.secant.p20 === '' || specData.secant.p90 === '') ? 'PENDING' : (secantStiffness >= 15 && secantStiffness <= 25 ? 'PASS' : 'FAIL')
  } : {
    peel: specData.ncrgrsp.peel === '' ? 'PENDING' : (specData.ncrgrsp.peel >= 15 ? 'PASS' : 'FAIL'),
    hpull: specData.ncrgrsp.hpull === '' ? 'PENDING' : (specData.ncrgrsp.hpull >= 120 ? 'PASS' : 'FAIL'),
    breaking: specData.ncrgrsp.breaking === '' ? 'PENDING' : (specData.ncrgrsp.breaking >= 500 ? 'PASS' : 'FAIL'),
    cord: (specData.ncrgrsp.denier === '' || specData.ncrgrsp.epi === '' || specData.ncrgrsp.thickness === '' || specData.ncrgrsp.loadAtBreak === '' || specData.ncrgrsp.elongation === '' || specData.ncrgrsp.twists === '') ? 'PENDING' : (specData.ncrgrsp.denier >= 800 && specData.ncrgrsp.loadAtBreak >= 10 ? 'PASS' : 'FAIL')
  };
  const specFailedCount = Object.values(specResults).filter(r => r === 'FAIL').length;
  const specPendingCount = Object.values(specResults).filter(r => r === 'PENDING').length;
  const specDecision = specPendingCount > 0 ? 'PENDING VERIFICATION' : (specFailedCount === 0 ? 'LOT PASSED' : specFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT');

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                padding: '8px 12px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.id ? '#21808d' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
                fontWeight: '700',
                fontSize: '12px',
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
          <div style={{ padding: '12px 20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0', letterSpacing: '-0.02em' }}>
                  {tabs.find(t => t.id === activeTab).label}
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', fontWeight: '700', color: '#334155' }}>{selectedLot}</span>
                  <span>•</span>
                  <span>System Validation Enabled</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isDirty && (
                  <div style={{ 
                    padding: '6px 12px', 
                    background: '#fff7ed', 
                    borderRadius: '8px', 
                    border: '1px solid #ffedd5', 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    color: '#c2410c',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ width: '6px', height: '6px', background: '#ea580c', borderRadius: '50%' }} />
                    UNSAVED
                  </div>
                )}
                <div style={{ 
                  padding: '6px 12px', 
                  background: '#f0f9fa', 
                  borderRadius: '8px', 
                  border: '1px solid #b2dfdb', 
                  fontSize: '10px', 
                  fontWeight: '800', 
                  color: '#21808d',
                  letterSpacing: '0.05em'
                }}>
                  DECISION ENGINE ACTIVE
                </div>
              </div>
            </div>
            
            {activeTab === 'visual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Sampling Details */}
                <section>
                  <h4 style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                    Sampling Details (AQL Config)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {[
                      { label: 'Lot Size', value: lots.find(l => l.id === selectedLot)?.size || '0' },
                      { label: 'Sample N', value: aqlConfig.n },
                      { label: 'Acc (Ac)', value: aqlConfig.ac },
                      { label: 'Rej (Re)', value: aqlConfig.re }
                    ].map(field => (
                      <div key={field.label} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px', fontWeight: '700', textTransform: 'uppercase' }}>{field.label}</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{field.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Main Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', position: 'relative', background: '#fff' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: visualResult === 'PASS' ? '#10b981' : '#ef4444', borderRadius: '16px 0 0 16px' }} />
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#334155' }}>2.2 Visual Inspection</h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Visual Not OK Count (Dv)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={visualData.dv}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVisualData(prev => ({ ...prev, dv: val === '' ? '' : Math.max(0, parseInt(val) || 0) }));
                          markDirty();
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '10px 14px', 
                          borderRadius: '10px', 
                          border: '2px solid #f1f5f9',
                          fontSize: '16px',
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
                      padding: '10px', 
                      borderRadius: '10px', 
                      background: visualResult === 'PASS' ? '#ecfdf5' : '#fef2f2', 
                      color: visualResult === 'PASS' ? '#059669' : '#b91c1c', 
                      fontSize: '11px', 
                      fontWeight: '900', 
                      textAlign: 'center',
                      border: `1px solid ${visualResult === 'PASS' ? '#a7f3d0' : '#fecaca'}`,
                      letterSpacing: '0.05em'
                    }}>
                      RESULT: {visualResult}
                    </div>
                  </section>

                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', position: 'relative', background: '#fff' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: dimensionalResult === 'PASS' ? '#10b981' : '#ef4444', borderRadius: '16px 0 0 16px' }} />
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#334155' }}>2.3 Dimensional Inspection</h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Dimensional Not OK Count (Dd)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={visualData.dd}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVisualData(prev => ({ ...prev, dd: val === '' ? '' : Math.max(0, parseInt(val) || 0) }));
                          markDirty();
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '10px 14px', 
                          borderRadius: '10px', 
                          border: '2px solid #f1f5f9',
                          fontSize: '16px',
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
                      padding: '10px', 
                      borderRadius: '10px', 
                      background: dimensionalResult === 'PASS' ? '#ecfdf5' : '#fef2f2', 
                      color: dimensionalResult === 'PASS' ? '#059669' : '#b91c1c', 
                      fontSize: '11px', 
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
                {finalDecision !== 'PENDING VERIFICATION' && (
                  <section style={{ 
                    background: finalDecision === 'LOT PASSED' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)', 
                    padding: '20px 32px', 
                    borderRadius: '20px', 
                    color: 'white',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px', fontWeight: '800' }}>Final Tab Decision Engine</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.03em' }}>{finalDecision}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontWeight: '500' }}>
                          {finalDecision === 'LOT PASSED' 
                            ? 'Automated validation confirm lot meets all AQL standard requirements.' 
                            : 'Specific trigger identified. Follow Section 4/5 protocols below.'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {finalDecision.includes('RE-TEST') && (
                          <button 
                            onClick={() => setReTestActive(true)}
                            style={{ 
                              background: 'white', 
                              color: '#991b1b', 
                              border: 'none', 
                              padding: '12px 20px', 
                              borderRadius: '10px', 
                              fontWeight: '800',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s'
                            }}
                          >
                            INITIATE RE-TEST
                          </button>
                        )}
                        <button 
                          onClick={handleSave}
                          style={{ 
                            background: '#21808d', 
                            color: 'white', 
                            border: 'none', 
                            padding: '12px 28px', 
                            borderRadius: '10px', 
                            fontWeight: '800',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 15px -3px rgba(33, 128, 141, 0.4)'
                          }}
                        >
                          Submit Final Result
                        </button>
                      </div>
                    </div>
                  </section>
                )}

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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Layer 2: Test Config */}
                <section style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#94a3b8', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CONFIG:</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { label: 'PAD', value: 'CGRSP' },
                      { label: 'HARDNESS', value: '60-70' },
                      { label: 'TENSILE', value: '≥80%' },
                      { label: 'COMPRESSION', value: '≤15%' }
                    ].map(field => (
                      <div key={field.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700' }}>{field.label}:</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Hardness Test */}
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '12px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#334155' }}>2.2 Hardness Test</h4>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: physicalResults.hardness === 'PASS' ? '#ecfdf5' : '#fef2f2', color: physicalResults.hardness === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800' }}>
                        {physicalResults.hardness}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      {physicalData.hardness.map((val, idx) => (
                        <div key={idx} style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: '700' }}>S{idx+1}</label>
                          <input 
                            type="number" 
                            min="0"
                            value={val}
                            onChange={(e) => {
                              const v = e.target.value;
                              const newH = [...physicalData.hardness];
                              newH[idx] = v === '' ? '' : Math.max(0, parseInt(v) || 0);
                              setPhysicalData(prev => ({ ...prev, hardness: newH }));
                              markDirty();
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9', fontWeight: '800', fontSize: '14px', background: '#f8fafc', color: '#1e293b', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} 
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                      Median Value: <span style={{ fontWeight: '900', color: '#21808d', fontSize: '13px' }}>
                        {physicalData.hardness.some(v => v === '') ? '-' : `${calculateMedian(physicalData.hardness)} IRHD`}
                      </span>
                    </div>
                  </section>

                  {/* Tensile Strength */}
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '12px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#334155' }}>2.3 Tensile & Elongation</h4>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: physicalResults.tensile === 'PASS' ? '#ecfdf5' : '#fef2f2', color: physicalResults.tensile === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800' }}>TS:{physicalResults.tensile}</span>
                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: physicalResults.elongation === 'PASS' ? '#ecfdf5' : '#fef2f2', color: physicalResults.elongation === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800' }}>EL:{physicalResults.elongation}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Tensile (MPa)</span>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#21808d' }}>{(physicalData.tensile.tsBefore === '' || physicalData.tensile.tsAfter === '') ? '' : `${calculateRetention(physicalData.tensile.tsBefore, physicalData.tensile.tsAfter)}%`}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="number" placeholder="B" value={physicalData.tensile.tsBefore} onChange={(e) => { const v = e.target.value; setPhysicalData(prev => ({ ...prev, tensile: { ...prev.tensile, tsBefore: v === '' ? '' : Math.max(0, parseFloat(v) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #f1f5f9', fontWeight: '800', fontSize: '13px', background: '#f8fafc' }} />
                          <input type="number" placeholder="A" value={physicalData.tensile.tsAfter} onChange={(e) => { const v = e.target.value; setPhysicalData(prev => ({ ...prev, tensile: { ...prev.tensile, tsAfter: v === '' ? '' : Math.max(0, parseFloat(v) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #f1f5f9', fontWeight: '800', fontSize: '13px', background: '#f8fafc' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Elongation (%)</span>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#21808d' }}>{(physicalData.tensile.elBefore === '' || physicalData.tensile.elAfter === '') ? '' : `${calculateRetention(physicalData.tensile.elBefore, physicalData.tensile.elAfter)}%`}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="number" placeholder="B" value={physicalData.tensile.elBefore} onChange={(e) => { const v = e.target.value; setPhysicalData(prev => ({ ...prev, tensile: { ...prev.tensile, elBefore: v === '' ? '' : Math.max(0, parseFloat(v) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #f1f5f9', fontWeight: '800', fontSize: '13px', background: '#f8fafc' }} />
                          <input type="number" placeholder="A" value={physicalData.tensile.elAfter} onChange={(e) => { const v = e.target.value; setPhysicalData(prev => ({ ...prev, tensile: { ...prev.tensile, elAfter: v === '' ? '' : Math.max(0, parseFloat(v) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #f1f5f9', fontWeight: '800', fontSize: '13px', background: '#f8fafc' }} />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  {/* Modulus Section */}
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '12px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>2.4 Modulus</h4>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: physicalResults.modulus === 'PASS' ? '#059669' : '#b91c1c' }}>{physicalResults.modulus}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <input type="number" placeholder="B" value={physicalData.modulus.before} onChange={(e) => { const v = e.target.value; setPhysicalData(prev => ({ ...prev, modulus: { ...prev.modulus, before: v === '' ? '' : Math.max(0, parseFloat(v) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #f1f5f9', fontSize: '13px', fontWeight: '800' }} />
                      <input type="number" placeholder="A" value={physicalData.modulus.after} onChange={(e) => { const v = e.target.value; setPhysicalData(prev => ({ ...prev, modulus: { ...prev.modulus, after: v === '' ? '' : Math.max(0, parseFloat(v) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #f1f5f9', fontSize: '13px', fontWeight: '800' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>% Change: <span style={{ fontWeight: '800', color: '#21808d' }}>{(physicalData.modulus.before === '' || physicalData.modulus.after === '') ? '-' : `${Math.abs(calculateRetention(physicalData.modulus.before, physicalData.modulus.after) - 100).toFixed(2)}%`}</span></div>
                  </section>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', flex: 1 }}>
                    {[
                      { label: '2.5 Comp Set', key: 'compressionSet', res: physicalResults.compression },
                      { label: '2.6 Ten Set', key: 'tensionSet', res: physicalResults.tension },
                      { label: '2.7 Load Defl', key: 'loadDeflection', res: physicalResults.load }
                    ].map(test => (
                      <div key={test.key} style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>{test.label}</div>
                          <span style={{ fontSize: '9px', fontWeight: '900', color: test.res === 'PASS' ? '#059669' : '#b91c1c' }}>{test.res}</span>
                        </div>
                        <input 
                          type="number" 
                          min="0"
                          value={physicalData[test.key]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPhysicalData(prev => ({ ...prev, [test.key]: val === '' ? '' : Math.max(0, parseFloat(val) || 0) }));
                            markDirty();
                          }}
                          style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: '800', fontSize: '14px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layer 3: Physical Decision */}
                {physicalDecision !== 'PENDING VERIFICATION' && (
                  <section style={{ 
                    background: physicalDecision === 'LOT PASSED' ? '#0f172a' : physicalDecision.includes('PERMANENT') ? '#991b1b' : '#21808d', 
                    padding: '12px 20px', 
                    borderRadius: '12px', 
                    color: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px', fontWeight: '800' }}>Tab 2 Final Decision</div>
                        <div style={{ fontSize: '18px', fontWeight: '900' }}>{physicalDecision}</div>
                      </div>
                      {physicalFailedCount === 1 && (
                        <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>
                          INITIATE RE-TEST
                        </button>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'electrical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                  <h4 style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                    Baseline Configuration
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {[
                      { label: 'SG Baseline', value: '1.25 ± 0.03' },
                      { label: 'Ash %', value: '35% ± 2.0' },
                      { label: 'Dry Resistance', value: '≥ 100 MΩ' }
                    ].map(field => (
                      <div key={field.label} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px', fontWeight: '700', textTransform: 'uppercase' }}>{field.label}</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{field.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#334155' }}>2.2 Electrical Resistance Test</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', background: elecResults.resistanceBefore === 'PASS' ? '#ecfdf5' : '#fef2f2', color: elecResults.resistanceBefore === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800' }}>Dry: {elecResults.resistanceBefore}</span>
                      <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', background: elecResults.resistanceAfter === 'PASS' ? '#ecfdf5' : '#fef2f2', color: elecResults.resistanceAfter === 'PASS' ? '#059669' : '#b91c1c', fontWeight: '800' }}>Wet: {elecResults.resistanceAfter}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '12px' }}>Dry Condition (MΩ)</div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="number" min="0" placeholder="Forward" value={elecData.before.f} onChange={(e) => { const val = e.target.value; setElecData(prev => ({ ...prev, before: { ...prev.before, f: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800', fontSize: '15px', background: '#f8fafc', outline: 'none' }} />
                        <input type="number" min="0" placeholder="Reverse" value={elecData.before.r} onChange={(e) => { const val = e.target.value; setElecData(prev => ({ ...prev, before: { ...prev.before, r: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800', fontSize: '15px', background: '#f8fafc', outline: 'none' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontWeight: '500' }}>
                        Min: <span style={{ color: '#21808d', fontWeight: '800' }}>
                          {(elecData.before.f === '' || elecData.before.r === '') ? '-' : `${Math.min(elecData.before.f, elecData.before.r)} MΩ`}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '12px' }}>Wet Condition (MΩ)</div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="number" min="0" placeholder="Forward" value={elecData.after.f} onChange={(e) => { const val = e.target.value; setElecData(prev => ({ ...prev, after: { ...prev.after, f: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800', fontSize: '15px', background: '#f8fafc', outline: 'none' }} />
                        <input type="number" min="0" placeholder="Reverse" value={elecData.after.r} onChange={(e) => { const val = e.target.value; setElecData(prev => ({ ...prev, after: { ...prev.after, r: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800', fontSize: '15px', background: '#f8fafc', outline: 'none' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontWeight: '500' }}>
                        Min: <span style={{ color: '#21808d', fontWeight: '800' }}>
                          {(elecData.after.f === '' || elecData.after.r === '') ? '-' : `${Math.min(elecData.after.f, elecData.after.r)} MΩ`}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Specific Gravity Audit</h4>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: elecResults.sg === 'PASS' ? '#059669' : '#b91c1c' }}>{elecResults.sg}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Product SG</label>
                        <input type="number" min="0" placeholder="Product" value={elecData.sg.product} onChange={(e) => { const val = e.target.value; setElecData(prev => ({ ...prev, sg: { ...prev.sg, product: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '800', fontSize: '14px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Baseline SG</label>
                        <input type="number" min="0" placeholder="Baseline" value={elecData.sg.baseline} onChange={(e) => { const val = e.target.value; setElecData(prev => ({ ...prev, sg: { ...prev.sg, baseline: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '800', fontSize: '14px' }} />
                      </div>
                    </div>
                  </section>
                  <section style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Ash Content % Audit</h4>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: elecResults.ash === 'PASS' ? '#059669' : '#b91c1c' }}>{elecResults.ash}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Product Ash %</label>
                        <input type="number" min="0" placeholder="Product %" value={elecData.ash.product} onChange={(e) => { const val = e.target.value; setElecData(prev => ({ ...prev, ash: { ...prev.ash, product: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '800', fontSize: '14px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Baseline Ash %</label>
                        <input type="number" min="0" placeholder="Baseline %" value={elecData.ash.baseline} onChange={(e) => { const val = e.target.value; setElecData(prev => ({ ...prev, ash: { ...prev.ash, baseline: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '800', fontSize: '14px' }} />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Layer 3: Electrical Decision */}
                {elecDecision !== 'PENDING VERIFICATION' && (
                  <section style={{ 
                    background: elecDecision === 'LOT PASSED' ? '#0f172a' : elecDecision.includes('PERMANENT') ? '#991b1b' : '#21808d', 
                    padding: '16px 24px', 
                    borderRadius: '16px', 
                    color: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: '800' }}>Tab 3 Final Decision Engine</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{elecDecision}</div>
                      </div>
                      {elecFailedCount === 1 && (
                        <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13px' }}>
                          INITIATE RE-TEST
                        </button>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'specialized' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                      Specialized Configuration
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', padding: '4px', background: '#f1f5f9', borderRadius: '12px', width: 'fit-content' }}>
                      {['CGRSP', 'NCRGRSP'].map(t => (
                        <button key={t} onClick={() => { setSpecType(t); markDirty(); }} style={{ padding: '6px 20px', borderRadius: '10px', border: 'none', background: specType === t ? 'white' : 'transparent', color: specType === t ? '#21808d' : '#64748b', fontSize: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: specType === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>{t}</button>
                      ))}
                    </div>
                  </div>
                </section>

                {specType === 'CGRSP' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <section style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>2.2.1 Adhesion Strength (kN)</h4>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: specResults.adhesion === 'PASS' ? '#059669' : '#b91c1c' }}>{specResults.adhesion}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {specData.adhesion.map((v, i) => (
                          <input key={i} type="number" min="0" placeholder={`S${i+1}`} value={v} onChange={(e) => {
                            const val = e.target.value;
                            const newA = [...specData.adhesion];
                            newA[i] = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
                            setSpecData(prev => ({ ...prev, adhesion: newA }));
                            markDirty();
                          }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '800', background: '#f8fafc', fontSize: '14px' }} />
                        ))}
                      </div>
                    </section>
                    <section style={{ border: '1px solid #f1f5f9', borderRadius: '16px', padding: '16px', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>2.2.2 Secant Stiffness Audit</h4>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: specResults.secant === 'PASS' ? '#059669' : '#b91c1c' }}>{specResults.secant}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Mean 20kN</label>
                          <input type="number" min="0" placeholder="Value" value={specData.secant.p20} onChange={(e) => { const val = e.target.value; setSpecData(prev => ({ ...prev, secant: { ...prev.secant, p20: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '800' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Mean 90kN</label>
                          <input type="number" min="0" placeholder="Value" value={specData.secant.p90} onChange={(e) => { const val = e.target.value; setSpecData(prev => ({ ...prev, secant: { ...prev.secant, p90: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '800' }} />
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: '900' }}>
                        Stiffness: <span style={{ color: '#21808d' }}>
                          {(specData.secant.p20 === '' || specData.secant.p90 === '') ? '-' : `${secantStiffness} kN/mm`}
                        </span>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {[
                      { label: 'Peel Adh', key: 'peel', limit: '≥ 15' },
                      { label: 'H-Pull', key: 'hpull', limit: '≥ 120' },
                      { label: 'Break Load', key: 'breaking', limit: '≥ 500' },
                      { label: 'Denier', key: 'denier', limit: '≥ 800' },
                      { label: 'EPI', key: 'epi', limit: '-' },
                      { label: 'Thickness', key: 'thickness', limit: '-' },
                      { label: 'Load/Break', key: 'loadAtBreak', limit: '-' },
                      { label: 'Elongation', key: 'elongation', limit: '-' },
                      { label: 'Twists/M', key: 'twists', limit: '-' }
                    ].map(test => (
                      <div key={test.key} style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '9px', fontWeight: '800', marginBottom: '4px', color: '#64748b' }}>{test.label}</div>
                        <input type="number" min="0" placeholder={test.limit} value={specData.ncrgrsp[test.key]} onChange={(e) => { const val = e.target.value; setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, [test.key]: val === '' ? '' : Math.max(0, parseFloat(val) || 0) } })); markDirty(); }} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '900', background: '#f8fafc', fontSize: '13px' }} />
                        <div style={{ fontSize: '9px', color: specResults[test.key] === 'PASS' ? '#059669' : '#b91c1c', marginTop: '4px', fontWeight: '900' }}>{test.key === 'cord' ? specResults.cord : specResults[test.key] || 'PENDING'}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Layer 3: Specialized Decision */}
                {specDecision !== 'PENDING VERIFICATION' && (
                  <section style={{ 
                    background: specDecision === 'LOT PASSED' ? '#0f172a' : specDecision.includes('PERMANENT') ? '#991b1b' : '#21808d', 
                    padding: '16px 24px', 
                    borderRadius: '16px', 
                    color: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: '800' }}>Tab 4 Final Decision Engine</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{specDecision}</div>
                      </div>
                      {specFailedCount === 1 && (
                        <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13px' }}>
                          INITIATE RE-TEST
                        </button>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalInspectionDashboard;
