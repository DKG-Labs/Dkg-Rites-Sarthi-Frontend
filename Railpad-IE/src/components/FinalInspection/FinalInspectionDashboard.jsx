import React, { useState, useEffect } from 'react';
import { fetchInspectionCallById, fetchInspectionCallByCallNo } from '../../services/inspectionService';

const HardnessCell = ({ value, onChange, min, max }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const subValues = value.split(',').map(s => s.trim()).filter(s => s !== '');
  const hasOut = subValues.some(sv => {
    const v = parseFloat(sv);
    return isNaN(v) || v < min || v > max;
  });


  const cellStyle = {
    width: '100%',
    padding: '8px',
    border: hasOut ? '2px solid #fee2e2' : '1px solid #e2e8f0',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '700',
    background: hasOut ? '#fef2f2' : 'white',
    minHeight: '44px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onBlur={() => setIsEditing(false)}
        onChange={(e) => {
          const val = e.target.value;
          const parts = val.split(',');
          if (parts.length <= 5) {
            onChange(val);
          } else {
            onChange(parts.slice(0, 5).join(','));
          }
        }}
        style={{ ...cellStyle, outline: 'none', border: '2px solid #3b82f6', background: 'white', color: '#1e293b' }}
      />
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} style={{ ...cellStyle, cursor: 'text', gap: '2px' }}>
      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {subValues.map((sv, i) => {
          const v = parseFloat(sv);
          const isOut = isNaN(v) || v < min || v > max;
          return (
            <span key={i} style={{ color: isOut ? '#ef4444' : '#059669' }}>
              {sv}{i < subValues.length - 1 ? ',' : ''}
            </span>
          );
        })}
      </div>
      {value === '' && <span style={{ color: '#94a3b8', fontWeight: '400' }}>-</span>}
    </div>
  );
};


const FinalInspectionSkeleton = () => (
  <div style={{ display: 'flex', height: '100%', gap: '16px', width: '100%' }}>
    {/* Sidebar Skeleton */}
    <div style={{ width: '200px', background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid #e2e8f0' }}>
      <div className="skeleton-box" style={{ height: '20px', width: '100px', marginBottom: '20px' }}></div>
      <div className="skeleton-box" style={{ height: '40px', width: '100%', marginBottom: '20px' }}></div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="skeleton-box" style={{ height: '80px', width: '100%', marginBottom: '12px', borderRadius: '12px' }}></div>
      ))}
    </div>
    {/* Main Content Skeleton */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-box" style={{ height: '32px', width: '120px', borderRadius: '20px' }}></div>
        ))}
      </div>
      <div style={{ flex: 1, background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
        <div className="skeleton-box" style={{ height: '30px', width: '200px', marginBottom: '30px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i}>
              <div className="skeleton-box" style={{ height: '12px', width: '80px', marginBottom: '8px' }}></div>
              <div className="skeleton-box" style={{ height: '42px', width: '100%' }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const FinalInspectionDashboard = ({ user, isShiftActive, call }) => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('visual');
  const [selectedLot, setSelectedLot] = useState(null);
  const [reTestActive, setReTestActive] = useState(false);
  const [reOfferActive, setReOfferActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeLot = lots.find(l => l.id === selectedLot) || lots[0] || { railpadType: 'GRSP' };
  const activeRailpadType = activeLot.railpadType || 'GRSP';
  
  // State Management for Dirty Form
  const [isDirty, setIsDirty] = useState(false);
  const [pendingLotId, setPendingLotId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // State for Visual & Dimensional Testing
  const [visualData, setVisualData] = useState({ 
    dv: '', 
    dd: '', 
    visualReason: '', 
    dimReason: '',
    visualN: 25,
    dimN: 25
  });

  // State for Weight Testing (Double Sampling)
  const [weightData, setWeightData] = useState({
    samples1: Array(80).fill(''),
    samples2: Array(80).fill(''),
    n1: 80,
    ac1: 3,
    re1: 6,
    n2: 80,
    ac2: 9,
    re2: 10,
    min: 0, 
    max: 445,
    isSecondActive: false
  });

  const getWeightAQL = (lotSize) => {
    const size = parseInt(lotSize, 10) || 0;
    // Strictly following the IS 2500 Part I - 2000 (General Inspection Level-II) AQL 2.5 table provided
    if (size <= 500) {
      return { n1: 32, ac1: 1, re1: 3, n2: 32, ac2: 4, re2: 5, isSingle: false };
    }
    if (size <= 1200) {
      return { n1: 50, ac1: 2, re1: 5, n2: 50, ac2: 6, re2: 7, isSingle: false };
    }
    if (size <= 3200) {
      return { n1: 80, ac1: 3, re1: 6, n2: 80, ac2: 9, re2: 10, isSingle: false };
    }
    if (size <= 10000) {
      return { n1: 125, ac1: 5, re1: 9, n2: 125, ac2: 12, re2: 13, isSingle: false };
    }
    // Default fallback for very large lots
    return { n1: 125, ac1: 5, re1: 9, n2: 125, ac2: 12, re2: 13, isSingle: false };
  };

  const WEIGHT_TOLERANCE = {
    'RDSO/T-3703': { type: '6mm GRSP', max: 161 },
    'RDSO/T-3711': { type: '6mm GRSP', max: 174 },
    'RDSO/T-6618': { type: '6.2mm CGRSP', max: 167 },
    'RDSO/T-8327': { type: '6.2mm CGRSP', max: 154 },
    'RDSO/T-8528': { type: '10mm CGRSP', max: 445 },
    'RDSO/T-8747': { type: '10mm CGRSP', max: 425 },
  };

  const getHardnessTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { drawingNo: '', railpadType: '' };
    const type = lot.railpadType || '';
    
    if (type.includes('NCRGRSP')) return { a: { min: 75, max: 85 }, b: { min: 75, max: 85 } };
    if (type === '6mm GRSP') return { a: { min: 75, max: 85 }, b: { min: 75, max: 85 } };
    if (type === '10mm GRSP') return { a: { min: 70, max: 80 }, b: { min: 70, max: 80 } };
    if (type.includes('CGRSP')) return { a: { min: 75, max: 85 }, b: { min: 60, max: 70 } };
    return { a: { min: 75, max: 85 }, b: { min: 60, max: 70 } };
  };

  const getTensileTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { drawingNo: '', railpadType: '' };
    const type = lot.railpadType || '';

    if (type === '6mm GRSP') return { before: 120, after: 100, retention: 80 };
    if (type === '10mm GRSP') return { before: 120, after: 100, retention: 70 };
    if (type === '6.2mm CGRSP') return { before: 120, after: 100, retention: 80 };
    if (type === '10mm CGRSP') return { before: 125, after: 110, retention: 80 };
    if (type.includes('NCRGRSP')) return { before: 120, after: 100, retention: 80 };
    return { before: 120, after: 100, retention: 80 };
  };

  const getElongationTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { drawingNo: '', railpadType: '' };
    const type = lot.railpadType || '';

    if (type === '6mm GRSP') return { before: 200, after: 150, retention: 65 };
    if (type === '10mm GRSP') return { before: 200, after: 150, retention: 60 };
    if (type.includes('CGRSP')) return { before: 50, after: 180, retention: 60 };
    if (type.includes('NCRGRSP')) return { before: 200, after: 150, retention: 65 };
    return { before: 200, after: 150, retention: 65 };
  };

  const getModulusTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { drawingNo: '', railpadType: '' };
    const type = lot.railpadType || '';

    if (type === '6mm GRSP') return { min: 45, max: 60, changePos: 30, changeNeg: 10 };
    if (type === '10mm GRSP') return { min: 50, max: 75, changePos: 40, changeNeg: 10 };
    if (type.includes('CGRSP')) return { min: 25, max: 45, changePos: 30, changeNeg: 10 };
    if (type.includes('NCRGRSP')) return { min: 45, max: 60, changePos: 30, changeNeg: 10 };
    return { min: 45, max: 60, changePos: 30, changeNeg: 10 };
  };

  const getLoadDeflectionTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { railpadType: '' };
    const type = lot.railpadType || '';

    if (type.includes('GRSP 6mm') || type.includes('6mm GRSP')) return { min: 0.4, max: 0.6 };
    if (type.includes('GRSP 10mm') || type.includes('10mm GRSP')) return { min: 0.7, max: 1.0 };
    if (type.includes('CGRSP 6.2mm') || type.includes('6.2mm CGRSP')) return { min: 0.6, max: 0.9 };
    if (type.includes('CGRSP 10mm') || type.includes('10mm CGRSP')) return { min: 0.9, max: 1.2 };
    if (type.includes('NCRGRSP 6mm') || type.includes('6mm NCRGRSP')) return { min: 0.3, max: 0.5 };
    if (type.includes('NCRGRSP 10mm') || type.includes('10mm NCRGRSP')) return { min: 0.5, max: 0.8 };
    return { min: 0.4, max: 0.6 };
  };

  const getSGTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { railpadType: '' };
    const type = lot.railpadType || '';
    if (type.includes('CGRSP')) return { a: 1.27, b: 1.17, variation: 0.03 };
    if (type.includes('NCRGRSP')) return { a: 1.27, variation: 0.03 };
    return { a: 1.27, variation: 0.03 }; // Default for GRSP
  };

  const getAshTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { railpadType: '' };
    const type = lot.railpadType || '';
    if (type.includes('CGRSP')) return { a: 27, b: 20, variation: 5 };
    return { a: 27, variation: 5 };
  };

  const currentHardnessSpecs = getHardnessTolerance(selectedLot);
  const currentTensileSpecs = getTensileTolerance(selectedLot);
  const currentElongationSpecs = getElongationTolerance(selectedLot);
  const currentModulusSpecs = getModulusTolerance(selectedLot);
  const currentLoadSpecs = getLoadDeflectionTolerance(selectedLot);
  const currentSGSpecs = getSGTolerance(selectedLot);
  const currentAshSpecs = getAshTolerance(selectedLot);

  // State for Physical Properties (Tab 2)
  const [physicalData, setPhysicalData] = useState({
    hardness: {
      compoundA: ['', '', '', '', ''],
      compoundB: ['', '', '', '', '']
    },
    tensile: {
      before: ['', '', '', '', ''],
      after: ['', '', '', '', '']
    },
    elongation: {
      before: ['', '', '', '', ''],
      after: ['', '', '', '', '']
    },
    modulus: {
      before: ['', '', ''],
      after: ['', '', '']
    },
    compression: {
      initial: ['', '', ''],
      final: ['', '', '']
    },
    tension: {
      initial: ['', '', ''],
      final: ['', '', '']
    },
    loadTest: {
      pad1: Array(8).fill(0).map(() => ({ left: '', right: '' })),
      pad2: Array(8).fill(0).map(() => ({ left: '', right: '' }))
    }
  });

  // State for Electrical & Chemical (Tab 3)
  const [elecData, setElecData] = useState({
    resistance: [
      { bF: '', bR: '', aF: '', aR: '' },
      { bF: '', bR: '', aF: '', aR: '' },
      { bF: '', bR: '', aF: '', aR: '' }
    ],
    sg: {
      compoundA: [
        { air: '', water: '' },
        { air: '', water: '' },
        { air: '', water: '' }
      ],
      compoundB: [
        { air: '', water: '' },
        { air: '', water: '' },
        { air: '', water: '' }
      ]
    },
    ash: {
      compoundA: [
        { crucible: '', sample: '', ash: '' },
        { crucible: '', sample: '', ash: '' },
        { crucible: '', sample: '', ash: '' }
      ],
      compoundB: [
        { crucible: '', sample: '', ash: '' },
        { crucible: '', sample: '', ash: '' },
        { crucible: '', sample: '', ash: '' }
      ]
    }
  });

  // State for Specialized Tests (Tab 4)
  const [specType, setSpecType] = useState('CGRSP');
  const [specData, setSpecData] = useState({
    adhesion: ['', ''],
    secant: [
      { s20: { a: '', b: '', c: '', d: '' }, s90: { a: '', b: '', c: '', d: '' } },
      { s20: { a: '', b: '', c: '', d: '' }, s90: { a: '', b: '', c: '', d: '' } }
    ],
    ncrgrsp: {
      adhesion: [
        { peel: '', hpull: '' },
        { peel: '', hpull: '' }
      ],
      breaking: ['', '', '', '', ''],
      nylonCord: [
        { denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' },
        { denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' },
        { denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' }
      ]
    }
  });

  // --- PERSISTENCE LOGIC (Survive Refresh & Lot Switching) ---
  useEffect(() => {
    if (!selectedLot || !call?.callNo) return;
    
    const draftKey = `railpad_draft_${call.callNo}_${selectedLot}`;
    const draftData = {
      activeTab,
      visualData,
      weightData,
      physicalData,
      elecData,
      specData,
      specType,
      reTestActive,
      reOfferActive
    };
    
    sessionStorage.setItem(draftKey, JSON.stringify(draftData));
    // If data was entered, mark as dirty
    if (visualData.dv || visualData.dd || weightData.samples1.some(s => s !== '')) {
      setIsDirty(true);
    }
  }, [selectedLot, call?.callNo, activeTab, visualData, weightData, physicalData, elecData, specData, specType, reTestActive, reOfferActive]);

  useEffect(() => {
    if (!selectedLot || !call?.callNo) return;
    
    const draftKey = `railpad_draft_${call.callNo}_${selectedLot}`;
    const saved = sessionStorage.getItem(draftKey);
    
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.activeTab) setActiveTab(draft.activeTab);
        if (draft.visualData) setVisualData(draft.visualData);
        if (draft.weightData) setWeightData(draft.weightData);
        if (draft.physicalData) setPhysicalData(draft.physicalData);
        if (draft.elecData) setElecData(draft.elecData);
        if (draft.specData) setSpecData(draft.specData);
        if (draft.specType) setSpecType(draft.specType);
        if (draft.reTestActive !== undefined) setReTestActive(draft.reTestActive);
        if (draft.reOfferActive !== undefined) setReOfferActive(draft.reOfferActive);
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, [selectedLot, call?.callNo]);

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

  // Initialize Default Lot
  useEffect(() => {
    if (selectedLot) {
      loadLotData(selectedLot);
    }
  }, [selectedLot]);

  useEffect(() => {
    const loadCallDetails = async () => {
      const callId = call?.requestId || call?.id || call?.callNo;
      if (callId) {
        setLoading(true);
        try {
          const data = await fetchInspectionCallByCallNo(callId);
          if (data && data.lots) {
            // Map backend lot data to frontend format if needed
            const formattedLots = data.lots.map(l => ({
              id: l.lotNo,
              size: l.lotSize,
              status: l.status || 'Pending',
              drawingNo: data.drawingNo || 'N/A',
              railpadType: data.railPadType || 'GRSP'
            }));
            setLots(formattedLots);
            if (formattedLots.length > 0) {
              setSelectedLot(formattedLots[0].id);
            }
          }
        } catch (error) {
          console.error("Error loading call details:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadCallDetails();
  }, [call]);

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
    setVisualData({ 
      dv: '', 
      dd: '', 
      visualReason: '', 
      dimReason: '',
      visualN: 25,
      dimN: 25
    });
    const lot = lots.find(l => l.id === lotId) || { size: 1500, drawingNo: 'RDSO/T-8528' };
    const aql = getWeightAQL(lot.size);
    const tolerance = WEIGHT_TOLERANCE[lot.drawingNo] || { max: 445 };
    setWeightData({
      samples1: Array(aql.n1).fill(''),
      samples2: Array(aql.n2).fill(''),
      n1: aql.n1,
      ac1: aql.ac1,
      re1: aql.re1,
      n2: aql.n2,
      ac2: aql.ac2,
      re2: aql.re2,
      min: 0,
      max: tolerance.max,
      isSecondActive: false
    });
    setPhysicalData({
      hardness: {
        compoundA: ['', '', '', '', ''],
        compoundB: ['', '', '', '', '']
      },
      tensile: {
        before: ['', '', '', '', ''],
        after: ['', '', '', '', '']
      },
      elongation: {
        before: ['', '', '', '', ''],
        after: ['', '', '', '', '']
      },
      modulus: {
        before: ['', '', ''],
        after: ['', '', '']
      },
      compression: {
        initial: ['', '', ''],
        final: ['', '', '']
      },
      tension: {
        initial: ['', '', ''],
        final: ['', '', '']
      },
      loadTest: {
        pad1: Array(8).fill(0).map(() => ({ left: '', right: '' })),
        pad2: Array(8).fill(0).map(() => ({ left: '', right: '' }))
      }
    });
    setElecData({
      resistance: [
        { bF: '', bR: '', aF: '', aR: '' },
        { bF: '', bR: '', aF: '', aR: '' },
        { bF: '', bR: '', aF: '', aR: '' }
      ],
      sg: {
        compoundA: [{ air: '', water: '' }, { air: '', water: '' }, { air: '', water: '' }],
        compoundB: [{ air: '', water: '' }, { air: '', water: '' }, { air: '', water: '' }]
      },
      ash: {
        compoundA: [{ crucible: '', sample: '', ash: '' }, { crucible: '', sample: '', ash: '' }, { crucible: '', sample: '', ash: '' }],
        compoundB: [{ crucible: '', sample: '', ash: '' }, { crucible: '', sample: '', ash: '' }, { crucible: '', sample: '', ash: '' }]
      }
    });
    setSpecData({
      adhesion: ['', ''],
      secant: [
        { s20: { a: '', b: '', c: '', d: '' }, s90: { a: '', b: '', c: '', d: '' } },
        { s20: { a: '', b: '', c: '', d: '' }, s90: { a: '', b: '', c: '', d: '' } }
      ],
      ncrgrsp: {
        adhesion: [
          { peel: '', hpull: '' },
          { peel: '', hpull: '' }
        ],
        breaking: ['', '', '', '', ''],
        nylonCord: [
          { denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' },
          { denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' },
          { denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' }
        ]
      }
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

  const getResult = (count, ac = aqlConfig.ac, re = aqlConfig.re) => {
    if (count === '' || count === undefined) return 'PENDING';
    const c = parseInt(count);
    if (isNaN(c)) return 'PENDING';
    if (c <= ac) return 'PASS';
    if (c >= re) return 'FAIL';
    return 'MARGINAL';
  };

  // Tab 1 Logic
  const visualResult = getResult(visualData.dv);
  const dimensionalResult = getResult(visualData.dd);
  
  // Weight Result Logic (Double Sampling)
  const getWeightNotOk = (samples) => {
    return samples.filter(v => {
      if (v === '') return false;
      const val = parseFloat(v);
      return val > weightData.max;
    }).length;
  };
  
  // Hardness Logic
  const hardnessA = physicalData.hardness.compoundA;
  const hardnessB = physicalData.hardness.compoundB;
  
  const getHardnessOutCount = (values, min, max) => {
    return values.filter(v => {
      if (v === '') return false;
      const subValues = v.split(',').map(s => s.trim()).filter(s => s !== '');
      return subValues.some(sv => {
        const val = parseFloat(sv);
        return isNaN(val) || val < min || val > max;
      });
    }).length;
  };

  const isCGRSP = activeRailpadType.includes('CGRSP');
  const outA = getHardnessOutCount(hardnessA, currentHardnessSpecs.a.min, currentHardnessSpecs.a.max);
  const outB = isCGRSP ? getHardnessOutCount(hardnessB, currentHardnessSpecs.b.min, currentHardnessSpecs.b.max) : 0;
  const totalHardnessOut = outA + outB;
  
  const filledHardness = isCGRSP ? [...hardnessA, ...hardnessB].filter(v => v !== '').length : hardnessA.filter(v => v !== '').length;
  const totalRequired = isCGRSP ? 10 : 5;
  let hardnessStatus = 'PENDING';
  if (filledHardness >= totalRequired) {
    hardnessStatus = totalHardnessOut === 0 ? 'ACCEPTED' : 'MARGINAL';
  } else if (filledHardness > 0) {
    hardnessStatus = 'UNDER TESTING';
  }

  const downloadTemplate = (target) => {
    const sampleSize = target === 'samples1' ? weightData.n1 : weightData.n2;
    const headers = `Sample No.,Weight (g)`;
    const rows = Array(sampleSize).fill('').map((_, idx) => `${idx + 1},`);
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Weight_${target}_${selectedLot}.csv`;
    link.click();
  };

  const handleExcelImport = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      const values = [];
      const sampleSize = target === 'samples1' ? weightData.n1 : weightData.n2;
      
      for (let i = 1; i < lines.length && i <= sampleSize; i++) {
        const cols = lines[i].split(',');
        values.push(cols[1]?.trim() || '');
      }

      while (values.length < sampleSize) values.push('');

      setWeightData(prev => ({ ...prev, [target]: values }));
      markDirty();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const notOk1 = getWeightNotOk(weightData.samples1);
  const notOk2 = getWeightNotOk(weightData.samples2);
  const totalNotOk = notOk1 + notOk2;

  const filled1 = weightData.samples1.filter(v => v !== '').length;
  let weightStatus = 'PENDING';

  if (notOk1 >= weightData.re1) {
    weightStatus = 'REJECTED';
  } else if (filled1 >= weightData.n1) {
    if (notOk1 <= weightData.ac1) {
      weightStatus = 'ACCEPTED';
    } else {
      weightStatus = '2ND SAMPLING';
      const filled2 = weightData.samples2.filter(v => v !== '').length;
      if (totalNotOk >= weightData.re2) {
        weightStatus = 'REJECTED';
      } else if (filled2 >= weightData.n2) {
        weightStatus = totalNotOk <= weightData.ac2 ? 'ACCEPTED' : 'REJECTED';
      } else {
        weightStatus = 'PENDING';
      }
    }
  } else {
    weightStatus = filled1 > 0 ? 'UNDER TESTING' : 'PENDING';
  }
  
  const finalDecision = (visualResult === 'PASS' && dimensionalResult === 'PASS' && (weightStatus === 'ACCEPTED' || weightStatus === 'PENDING' || weightStatus === '2ND SAMPLING')) 
    ? 'LOT PASSED' 
    : (visualResult === 'PENDING' || dimensionalResult === 'PENDING') ? 'PENDING VERIFICATION'
    : (visualResult !== 'PASS' && dimensionalResult !== 'PASS') ? 'LOT REJECTED (Visual & Dimensional)'
    : (dimensionalResult !== 'PASS') ? 'RE-OFFER REQUIRED (Dimensional)' : 'RE-TEST REQUIRED (Visual)';

  // Tab 2 Logic
  const isPhysicalEmpty = (key) => physicalData[key] === '' || (Array.isArray(physicalData[key]) && physicalData[key].some(v => v === '')) || (typeof physicalData[key] === 'object' && Object.values(physicalData[key]).some(v => v === ''));

  const tensileOutCount = physicalData.tensile.before.filter((b, i) => {
    const a = physicalData.tensile.after[i];
    if (b === '' || a === '') return false;
    const bVal = parseFloat(b);
    const aVal = parseFloat(a);
    const ret = (aVal / bVal) * 100;
    return bVal < currentTensileSpecs.before || aVal < currentTensileSpecs.after || ret < currentTensileSpecs.retention;
  }).length;

  const filledTensile = physicalData.tensile.before.filter((v, i) => v !== '' && physicalData.tensile.after[i] !== '').length;

  const elongationOutCount = physicalData.elongation.before.filter((b, i) => {
    const a = physicalData.elongation.after[i];
    if (b === '' || a === '') return false;
    const bVal = parseFloat(b);
    const aVal = parseFloat(a);
    const ret = (aVal / bVal) * 100;
    return bVal < currentElongationSpecs.before || aVal < currentElongationSpecs.after || ret < currentElongationSpecs.retention;
  }).length;

  const filledElongation = physicalData.elongation.before.filter((v, i) => v !== '' && physicalData.elongation.after[i] !== '').length;

  const modulusOutCount = physicalData.modulus.before.filter((b, i) => {
    const a = physicalData.modulus.after[i];
    if (b === '' || a === '') return false;
    const bVal = parseFloat(b);
    const aVal = parseFloat(a);
    const change = ((aVal - bVal) / bVal) * 100;
    return bVal < currentModulusSpecs.min || bVal > currentModulusSpecs.max || change > currentModulusSpecs.changePos || change < -currentModulusSpecs.changeNeg;
  }).length;

  const filledModulus = physicalData.modulus.before.filter((v, i) => v !== '' && physicalData.modulus.after[i] !== '').length;

  const compressionOutCount = physicalData.compression.initial.filter((a, i) => {
    const b = physicalData.compression.final[i];
    if (a === '' || b === '') return false;
    const aVal = parseFloat(a);
    const bVal = parseFloat(b);
    const set = ((aVal - bVal) / aVal) * 100;
    return set > 30;
  }).length;
  const filledCompression = physicalData.compression.initial.filter((v, i) => v !== '' && physicalData.compression.final[i] !== '').length;

  const tensionOutCount = physicalData.tension.initial.filter((a, i) => {
    const b = physicalData.tension.final[i];
    if (a === '' || b === '') return false;
    const aVal = parseFloat(a);
    const bVal = parseFloat(b);
    const set = ((bVal - aVal) / aVal) * 100;
    return set > 25;
  }).length;
  const filledTension = physicalData.tension.initial.filter((v, i) => v !== '' && physicalData.tension.final[i] !== '').length;

  const getPadDeflection = (pad) => {
    const s8 = pad[7];
    if (s8.left === '' || s8.right === '') return null;
    return (parseFloat(s8.left) + parseFloat(s8.right)) / 2;
  };
  const pad1Defl = getPadDeflection(physicalData.loadTest.pad1);
  const pad2Defl = getPadDeflection(physicalData.loadTest.pad2);
  const loadOutCount = [pad1Defl, pad2Defl].filter(d => d !== null && (d < currentLoadSpecs.min || d > currentLoadSpecs.max)).length;
  const filledLoad = [pad1Defl, pad2Defl].filter(d => d !== null).length;

  const physicalResults = {
    hardness: totalHardnessOut > 0 ? 'FAIL' : (filledHardness >= totalRequired ? 'PASS' : 'PENDING'),
    tensile: tensileOutCount > 0 ? 'FAIL' : (filledTensile >= 5 ? 'PASS' : 'PENDING'),
    elongation: elongationOutCount > 0 ? 'FAIL' : (filledElongation >= 5 ? 'PASS' : 'PENDING'),
    modulus: modulusOutCount > 0 ? 'FAIL' : (filledModulus >= 3 ? 'PASS' : 'PENDING'),
    compression: compressionOutCount > 0 ? 'FAIL' : (filledCompression >= 3 ? 'PASS' : 'PENDING'),
    tension: tensionOutCount > 0 ? 'FAIL' : (filledTension >= 3 ? 'PASS' : 'PENDING'),
    load: loadOutCount > 0 ? 'FAIL' : (filledLoad >= 2 ? 'PASS' : 'PENDING')
  };
  const physicalFailedCount = Object.values(physicalResults).filter(r => r === 'FAIL').length;
  const physicalPendingCount = Object.values(physicalResults).filter(r => r === 'PENDING').length;
  const physicalDecision = physicalPendingCount > 0 ? 'PENDING VERIFICATION' : (physicalFailedCount === 0 ? 'LOT PASSED' : physicalFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT');

  // Tab 3 Logic
  const resOutCount = elecData.resistance.filter(r => {
    if (r.bF === '' || r.bR === '' || r.aF === '' || r.aR === '') return false;
    return Math.min(parseFloat(r.bF), parseFloat(r.bR)) < 100 || Math.min(parseFloat(r.aF), parseFloat(r.aR)) < 100;
  }).length;
  const resFilled = elecData.resistance.filter(r => r.bF !== '' && r.bR !== '' && r.aF !== '' && r.aR !== '').length;


  const sgAOutCount = elecData.sg.compoundA.filter(r => {
    if (r.air === '' || r.water === '') return false;
    const sg = parseFloat(r.air) / (parseFloat(r.air) - parseFloat(r.water));
    return sg > currentSGSpecs.a;
  }).length;
  const sgBOutCount = isCGRSP ? elecData.sg.compoundB.filter(r => {
    if (r.air === '' || r.water === '') return false;
    const sg = parseFloat(r.air) / (parseFloat(r.air) - parseFloat(r.water));
    return sg > currentSGSpecs.b;
  }).length : 0;
  const sgVarOutCount = isCGRSP ? elecData.sg.compoundA.filter((r, i) => {
    const rB = elecData.sg.compoundB[i];
    if (r.air === '' || r.water === '' || rB.air === '' || rB.water === '') return false;
    const sgA = parseFloat(r.air) / (parseFloat(r.air) - parseFloat(r.water));
    const sgB = parseFloat(rB.air) / (parseFloat(rB.air) - parseFloat(rB.water));
    return Math.abs(sgA - sgB) > currentSGSpecs.variation;
  }).length : 0;
  const totalSGOut = sgAOutCount + sgBOutCount + sgVarOutCount;
  const sgFilled = isCGRSP ? elecData.sg.compoundA.filter((r, i) => r.air !== '' && r.water !== '' && elecData.sg.compoundB[i].air !== '' && elecData.sg.compoundB[i].water !== '').length : elecData.sg.compoundA.filter(r => r.air !== '' && r.water !== '').length;

  const ashAOutCount = elecData.ash.compoundA.filter(r => {
    if (r.crucible === '' || r.sample === '' || r.ash === '') return false;
    const ash = ((parseFloat(r.ash) - parseFloat(r.crucible)) / (parseFloat(r.sample) - parseFloat(r.crucible))) * 100;
    return ash > currentAshSpecs.a;
  }).length;
  const ashBOutCount = isCGRSP ? elecData.ash.compoundB.filter(r => {
    if (r.crucible === '' || r.sample === '' || r.ash === '') return false;
    const ash = ((parseFloat(r.ash) - parseFloat(r.crucible)) / (parseFloat(r.sample) - parseFloat(r.crucible))) * 100;
    return ash > currentAshSpecs.b;
  }).length : 0;
  const ashVarOutCount = isCGRSP ? elecData.ash.compoundA.filter((r, i) => {
    const rB = elecData.ash.compoundB[i];
    if (r.crucible === '' || r.sample === '' || r.ash === '' || rB.crucible === '' || rB.sample === '' || rB.ash === '') return false;
    const ashA = ((parseFloat(r.ash) - parseFloat(r.crucible)) / (parseFloat(r.sample) - parseFloat(r.crucible))) * 100;
    const ashB = ((parseFloat(rB.ash) - parseFloat(rB.crucible)) / (parseFloat(rB.sample) - parseFloat(rB.crucible))) * 100;
    return Math.abs(ashA - ashB) > currentAshSpecs.variation;
  }).length : 0;
  const totalAshOut = ashAOutCount + ashBOutCount + ashVarOutCount;
  const ashFilled = isCGRSP ? elecData.ash.compoundA.filter((r, i) => r.crucible !== '' && r.sample !== '' && r.ash !== '' && elecData.ash.compoundB[i].crucible !== '' && elecData.ash.compoundB[i].sample !== '' && elecData.ash.compoundB[i].ash !== '').length : elecData.ash.compoundA.filter(r => r.crucible !== '' && r.sample !== '' && r.ash !== '').length;

  const elecResults = {
    resistance: resOutCount > 0 ? 'FAIL' : (resFilled >= 3 ? 'PASS' : 'PENDING'),
    sg: totalSGOut > 0 ? 'FAIL' : (sgFilled >= 3 ? 'PASS' : 'PENDING'),
    ash: totalAshOut > 0 ? 'FAIL' : (ashFilled >= 3 ? 'PASS' : 'PENDING')
  };
  const elecFailedCount = Object.values(elecResults).filter(r => r === 'FAIL').length;
  const elecPendingCount = Object.values(elecResults).filter(r => r === 'PENDING').length;
  const elecDecision = elecPendingCount > 0 ? 'PENDING VERIFICATION' : (elecFailedCount === 0 ? 'LOT PASSED' : elecFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT');

  // Tab 4 Logic: Dynamic & Durability Tests (Specialized)
  const secantResults = specData.secant.map(s => {
    const isS20Complete = s.s20 && Object.values(s.s20).every(v => v !== '');
    const isS90Complete = s.s90 && Object.values(s.s90).every(v => v !== '');
    const d1 = isS20Complete ? (parseFloat(s.s20.a) + parseFloat(s.s20.b) + parseFloat(s.s20.c) + parseFloat(s.s20.d)) / 4 : 0;
    const d2 = isS90Complete ? (parseFloat(s.s90.a) + parseFloat(s.s90.b) + parseFloat(s.s90.c) + parseFloat(s.s90.d)) / 4 : 0;
    const diff = d2 - d1;
    const stiffness = (isS20Complete && isS90Complete && Math.abs(diff) > 0.0001) ? (70 / diff).toFixed(2) : 0;
    return { d1, d2, stiffness, isS20Complete, isS90Complete };
  });

  const secantStatus = secantResults.some(r => r.stiffness !== 0 && (parseFloat(r.stiffness) < 15 || parseFloat(r.stiffness) > 25)) ? 'FAIL' : 
    (secantResults.every(r => r.isS20Complete && r.isS90Complete) ? 'PASS' : 'PENDING');

  const specResults = {
    adhesion: specData.adhesion.some(v => v !== '' && parseFloat(v) < 8) ? 'FAIL' : (specData.adhesion.every(v => v !== '') ? 'PASS' : 'PENDING'),
    secant: secantStatus
  };

  const ncrResults = {
    adhesion: (specData.ncrgrsp && specData.ncrgrsp.adhesion) ? specData.ncrgrsp.adhesion.some(v => (v.peel !== '' && parseFloat(v.peel) < 4) || (v.hpull !== '' && parseFloat(v.hpull) < 10)) ? 'FAIL' : (specData.ncrgrsp.adhesion.every(v => v.peel !== '' && v.hpull !== '') ? 'PASS' : 'PENDING') : 'PENDING',
    breaking: (specData.ncrgrsp && specData.ncrgrsp.breaking) ? specData.ncrgrsp.breaking.some(v => v !== '' && parseFloat(v) < 350) ? 'FAIL' : (specData.ncrgrsp.breaking.every(v => v !== '') ? 'PASS' : 'PENDING') : 'PENDING',
    cord: (specData.ncrgrsp && specData.ncrgrsp.nylonCord) ? specData.ncrgrsp.nylonCord.some(v => 
      (v.epi !== '' && (parseFloat(v.epi) < 22 || parseFloat(v.epi) > 26)) ||
      (v.thickness !== '' && parseFloat(v.thickness) < 0.75) ||
      (v.loadAtBreak !== '' && parseFloat(v.loadAtBreak) < 16) ||
      (v.elongation !== '' && parseFloat(v.elongation) > 20) ||
      (v.twists !== '' && (parseFloat(v.twists) < 380 || parseFloat(v.twists) > 400))
    ) ? 'FAIL' : (specData.ncrgrsp.nylonCord.every(v => Object.values(v).every(x => x !== '')) ? 'PASS' : 'PENDING') : 'PENDING'
  };

  const specFailedCount = Object.values(specResults).filter(r => r === 'FAIL').length;
  const specPendingCount = Object.values(specResults).filter(r => r === 'PENDING').length;
  const specDecision = specPendingCount > 0 && specFailedCount === 0 ? 'PENDING VERIFICATION' : (specFailedCount === 0 ? 'LOT PASSED' : specFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT');

  const ncrFailedCount = Object.values(ncrResults).filter(r => r === 'FAIL').length;
  const ncrPendingCount = Object.values(ncrResults).filter(r => r === 'PENDING').length;
  const ncrDecision = ncrPendingCount > 0 && ncrFailedCount === 0 ? 'PENDING VERIFICATION' : (ncrFailedCount === 0 ? 'LOT PASSED' : ncrFailedCount === 1 ? 'RE-TEST REQUIRED' : 'PERMANENT REJECT');

  const activeLotData = lots.find(l => l.id === selectedLot) || lots[0];

  const filteredLots = lots.filter(lot => lot.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const tabs = [
    { id: 'visual', label: 'Visual & Dimensional' },
    { id: 'physical', label: 'Physical & Ageing Properties' },
    { id: 'electrical', label: 'Electrical & Chemical' },
    { id: 'specialized', label: 'Dynamic & Durability Test' },
    { id: 'ncrgrsp', label: 'NCRGRSP Test' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 140px)', background: '#f8fafc', gap: '16px', padding: '0 16px 16px 16px', boxSizing: 'border-box' }}>
        <FinalInspectionSkeleton />
      </div>
    );
  }

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
          
          /* Hide number input spinners */
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
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
                {/* Badges removed per user request */}
              </div>
            </div>
            
            {activeTab === 'visual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
                {/* Unified Inspection Table */}
                <div style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontSize: '11px', width: '250px' }}>Inspection Parameter</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>No. of Samples</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Not OK Count</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>Reason of Rejection</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontSize: '11px', width: '120px' }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Visual Inspection */}
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: '#1e293b' }}>
                          Visual Inspection
                          <div style={{ fontSize: '9px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            value={visualData.visualN} 
                            readOnly
                            style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', background: '#f1f5f9' }}
                          />
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            value={visualData.dv} 
                            onChange={(e) => { setVisualData(prev => ({ ...prev, dv: e.target.value })); markDirty(); }}
                            style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '2px solid #cbd5e1', textAlign: 'center', fontWeight: '800', background: '#f8fafc' }}
                          />
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select 
                            disabled={!visualData.dv || parseInt(visualData.dv) === 0}
                            value={(!visualData.dv || parseInt(visualData.dv) === 0) ? '' : visualData.visualReason} 
                            onChange={(e) => { setVisualData(prev => ({ ...prev, visualReason: e.target.value })); markDirty(); }}
                            style={{ 
                              width: '100%', 
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              border: '1px solid #cbd5e1', 
                              fontSize: '13px', 
                              background: (!visualData.dv || parseInt(visualData.dv) === 0) ? '#f1f5f9' : 'white',
                              cursor: (!visualData.dv || parseInt(visualData.dv) === 0) ? 'not-allowed' : 'pointer',
                              color: (!visualData.dv || parseInt(visualData.dv) === 0) ? '#94a3b8' : '#1e293b'
                            }}
                          >
                            <option value="">-- Select Reason --</option>
                            <option value="Porosity">Porosity</option>
                            <option value="Blow Holes">Blow Holes</option>
                            <option value="Uncut Flash">Uncut Flash</option>
                            <option value="Surface Crack">Surface Crack</option>
                            <option value="Improper Finish">Improper Finish</option>
                            <option value="Others">Others</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: '800',
                            background: visualResult === 'PASS' ? '#dcfce7' : '#fee2e2',
                            color: visualResult === 'PASS' ? '#166534' : '#991b1b'
                          }}>
                            {visualResult}
                          </span>
                        </td>
                      </tr>
                      {/* Dimensional Inspection */}
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: '#1e293b' }}>
                          Dimensional Inspection
                          <div style={{ fontSize: '9px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            value={visualData.dimN} 
                            readOnly
                            style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', background: '#f1f5f9' }}
                          />
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            value={visualData.dd} 
                            onChange={(e) => { setVisualData(prev => ({ ...prev, dd: e.target.value })); markDirty(); }}
                            style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '2px solid #cbd5e1', textAlign: 'center', fontWeight: '800', background: '#f8fafc' }}
                          />
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select 
                            disabled={!visualData.dd || parseInt(visualData.dd) === 0}
                            value={(!visualData.dd || parseInt(visualData.dd) === 0) ? '' : visualData.dimReason} 
                            onChange={(e) => { setVisualData(prev => ({ ...prev, dimReason: e.target.value })); markDirty(); }}
                            style={{ 
                              width: '100%', 
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              border: '1px solid #cbd5e1', 
                              fontSize: '13px', 
                              background: (!visualData.dd || parseInt(visualData.dd) === 0) ? '#f1f5f9' : 'white',
                              cursor: (!visualData.dd || parseInt(visualData.dd) === 0) ? 'not-allowed' : 'pointer',
                              color: (!visualData.dd || parseInt(visualData.dd) === 0) ? '#94a3b8' : '#1e293b'
                            }}
                          >
                            <option value="">-- Select Reason --</option>
                            <option value="Length deviation">Length deviation</option>
                            <option value="Width deviation">Width deviation</option>
                            <option value="Thickness variation">Thickness variation</option>
                            <option value="Edge damage">Edge damage</option>
                            <option value="Warpage">Warpage</option>
                            <option value="Others">Others</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: '800',
                            background: dimensionalResult === 'PASS' ? '#dcfce7' : '#fee2e2',
                            color: dimensionalResult === 'PASS' ? '#166534' : '#991b1b'
                          }}>
                            {dimensionalResult}
                          </span>
                        </td>
                      </tr>
                      {/* Weight Testing Header */}
                      <tr style={{ background: '#f8fafc' }}>
                        <td style={{ padding: '16px', fontWeight: '800', color: '#0f172a' }}>
                          Weight Testing (gm)
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                            Type: {lots.find(l => l.id === selectedLot)?.railpadType} | Drg: {lots.find(l => l.id === selectedLot)?.drawingNo}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
                            Max Permissible Weight: {weightData.max}g
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>
                            {weightStatus === '2ND SAMPLING' ? 'Samples (n1/n2)' : 'Samples (n1)'}
                          </div>
                          <div style={{ fontWeight: '700', color: '#334155' }}>
                            {weightStatus === '2ND SAMPLING' ? `${weightData.n1} / ${weightData.n2}` : weightData.n1}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginBottom: '4px' }}>
                            {weightStatus === '2ND SAMPLING' ? 'Acc (Ac1/Ac2)' : 'Acc (Ac1)'}
                          </div>
                          <div style={{ fontWeight: '700', color: '#059669' }}>
                            {weightStatus === '2ND SAMPLING' ? `${weightData.ac1} / ${weightData.ac2}` : weightData.ac1}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700', marginBottom: '4px' }}>
                                {weightStatus === '2ND SAMPLING' ? 'Rej (Re1/Re2)' : 'Rej (Re1)'}
                              </div>
                              <div style={{ fontWeight: '700', color: '#b91c1c' }}>
                                {weightStatus === '2ND SAMPLING' ? `${weightData.re1} / ${weightData.re2}` : weightData.re1}
                              </div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => downloadTemplate(weightStatus === '2ND SAMPLING' && weightData.isSecondActive ? 'samples2' : 'samples1')}
                                className="action-btn action-btn--secondary"
                                style={{ 
                                  padding: '8px 16px', 
                                  fontSize: '11px', 
                                  background: '#fff', 
                                  border: '1px solid #e2e8f0', 
                                  borderRadius: '10px', 
                                  cursor: 'pointer',
                                  fontWeight: '700',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                              >
                                📥 Download Template
                              </button>
                              <button 
                                onClick={() => document.getElementById('weight-import-1').click()}
                                style={{ 
                                  padding: '8px 16px', 
                                  fontSize: '11px', 
                                  background: 'linear-gradient(135deg, #21808d 0%, #155e75 100%)', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '10px', 
                                  cursor: 'pointer',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 4px 12px rgba(33, 128, 141, 0.2)'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(33, 128, 141, 0.3)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 128, 141, 0.2)'; }}
                              >
                                📤 Import Data
                              </button>
                              <input id="weight-import-1" type="file" accept=".csv" onChange={(e) => handleExcelImport(e, weightStatus === '2ND SAMPLING' && weightData.isSecondActive ? 'samples2' : 'samples1')} style={{ display: 'none' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                           <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: '800',
                            background: weightStatus === 'ACCEPTED' ? '#dcfce7' : weightStatus === 'REJECTED' ? '#fee2e2' : weightStatus === '2ND SAMPLING' ? '#fff7ed' : '#f1f5f9',
                            color: weightStatus === 'ACCEPTED' ? '#166534' : weightStatus === 'REJECTED' ? '#991b1b' : weightStatus === '2ND SAMPLING' ? '#c2410c' : '#475569'
                          }}>
                            {weightStatus}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Weight Data Grid Section */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button 
                        onClick={() => setWeightData(prev => ({ ...prev, isSecondActive: false }))}
                        style={{ 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: '700', 
                          border: 'none',
                          background: !weightData.isSecondActive ? '#0f172a' : '#f1f5f9',
                          color: !weightData.isSecondActive ? 'white' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        FIRST SAMPLING ({filled1}/{weightData.n1})
                      </button>
                      {((weightStatus === '2ND SAMPLING') || (weightData.samples2.filter(v => v !== '').length > 0)) && (
                        <button 
                          onClick={() => setWeightData(prev => ({ ...prev, isSecondActive: true }))}
                          style={{ 
                            padding: '8px 16px', 
                            borderRadius: '8px', 
                            fontSize: '12px', 
                            fontWeight: '700', 
                            border: 'none',
                            background: weightData.isSecondActive ? '#0f172a' : '#f1f5f9',
                            color: weightData.isSecondActive ? 'white' : '#64748b',
                            cursor: 'pointer'
                          }}
                        >
                          SECOND SAMPLING ({weightData.samples2.filter(v => v !== '').length}/{weightData.n2})
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                      {((weightStatus === '2ND SAMPLING') || (weightData.samples2.filter(v => v !== '').length > 0)) && weightData.isSecondActive ? `Total Not OK: ${totalNotOk} / ${weightData.ac2} (Ac2)` : `Not OK: ${notOk1} / ${weightData.ac1} (Ac1)`}
                    </div>
                  </div>

                  {/* Weight Data Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(10, 1fr)', 
                    gap: '8px', 
                    maxHeight: '300px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {(weightData.isSecondActive ? weightData.samples2 : weightData.samples1).map((val, idx) => {
                      const isFailing = val !== '' && parseFloat(val) > weightData.max;
                      return (
                        <div key={idx} style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', top: '-4px', left: '4px', fontSize: '8px', color: '#94a3b8', fontWeight: '800', background: 'white', padding: '0 2px', zIndex: 1 }}>{idx + 1}</span>
                          <input 
                            type="number" 
                            value={val} 
                            onChange={(e) => {
                              const target = weightData.isSecondActive ? 'samples2' : 'samples1';
                              const newSamples = [...weightData[target]];
                              newSamples[idx] = e.target.value;
                              setWeightData(prev => ({ ...prev, [target]: newSamples }));
                              markDirty();
                            }}
                            style={{ 
                              width: '100%', 
                              padding: '8px 4px', 
                              borderRadius: '6px', 
                              border: isFailing ? '2px solid #fee2e2' : '1px solid #e2e8f0', 
                              textAlign: 'center', 
                              fontSize: '13px', 
                              fontWeight: '700',
                              background: isFailing ? '#fef2f2' : val === '' ? '#fcfcfc' : '#f0f9fa',
                              color: isFailing ? '#991b1b' : '#1e293b'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Final Decision Block */}
                {finalDecision !== 'PENDING VERIFICATION' && (
                  <section style={{ 
                    background: finalDecision === 'LOT PASSED' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)', 
                    padding: '12px 24px', 
                    borderRadius: '16px', 
                    color: 'white',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '2px', fontWeight: '800' }}>Final Tab Decision Engine</div>
                        <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.02em' }}>{finalDecision}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px', fontWeight: '500' }}>
                          {finalDecision === 'LOT PASSED' 
                            ? 'Automated validation confirm lot meets all AQL standard requirements.' 
                            : 'Specific trigger identified. Follow Section 4/5 protocols below.'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {finalDecision.includes('RE-TEST') && (
                          <button 
                            onClick={() => setReTestActive(true)}
                            style={{ 
                              background: 'white', 
                              color: '#991b1b', 
                              border: 'none', 
                              padding: '8px 16px', 
                              borderRadius: '8px', 
                              fontWeight: '800',
                              fontSize: '12px',
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
                            padding: '8px 20px', 
                            borderRadius: '8px', 
                            fontWeight: '800',
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(33, 128, 141, 0.3)'
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
                      { label: 'PAD', value: activeRailpadType },
                      { label: 'HARDNESS', value: isCGRSP ? '60-85' : '70-85' },
                      { label: 'TENSILE', value: `≥${currentTensileSpecs.retention}%` },
                      { label: 'ELONGATION', value: `≥${currentElongationSpecs.retention}%` },
                      { label: 'COMPRESSION', value: '≤30%' },
                      { label: 'TENSION', value: '≤25%' }
                    ].map(field => (
                      <div key={field.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700' }}>{field.label}:</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Hardness Section (New Layout) */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Hardness Shore 'A'</h4>
                      <div style={{ fontSize: '10px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Samples out of Tolerance: <span style={{ color: totalHardnessOut > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(totalHardnessOut).padStart(2, '0')}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Status: <span style={{ 
                          color: hardnessStatus === 'ACCEPTED' ? '#059669' : hardnessStatus === 'MARGINAL' ? '#f59e0b' : '#64748b', 
                          fontWeight: '800',
                          textTransform: 'uppercase'
                        }}>{hardnessStatus}</span>
                      </div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fff' }}>
                        <th style={{ width: '200px' }}></th>
                        {['S1', 'S2', 'S3', 'S4', 'S5'].map(s => (
                          <th key={s} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Compound A / Primary Hardness */}
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          {isCGRSP ? 'Compound A' : 'Hardness Result'}
                        </td>
                        {physicalData.hardness.compoundA.map((val, idx) => {
                          return (
                            <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                              <HardnessCell 
                                value={val} 
                                min={currentHardnessSpecs.a.min} 
                                max={currentHardnessSpecs.a.max} 
                                onChange={(newVal) => {
                                  setPhysicalData(prev => ({
                                    ...prev,
                                    hardness: { ...prev.hardness, compoundA: prev.hardness.compoundA.map((v, i) => i === idx ? newVal : v) }
                                  }));
                                  markDirty();
                                }} 
                              />
                            </td>
                          );
                        })}
                      </tr>
                      {/* Compound B (CGRSP Only) */}
                      {isCGRSP && (
                        <tr>
                          <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                            Compound B
                          </td>
                          {physicalData.hardness.compoundB.map((val, idx) => {
                            return (
                              <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                <HardnessCell 
                                  value={val} 
                                  min={currentHardnessSpecs.b.min} 
                                  max={currentHardnessSpecs.b.max} 
                                  onChange={(newVal) => {
                                    setPhysicalData(prev => ({
                                      ...prev,
                                      hardness: { ...prev.hardness, compoundB: prev.hardness.compoundB.map((v, i) => i === idx ? newVal : v) }
                                    }));
                                    markDirty();
                                  }} 
                                />
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Tensile Strength (kg/cm²)</h4>
                      <div style={{ fontSize: '10px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Sample out of Tolerance: <span style={{ color: tensileOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(tensileOutCount).padStart(2, '0')}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Status: <span style={{ 
                          color: physicalResults.tensile === 'PASS' ? '#059669' : physicalResults.tensile === 'FAIL' ? '#f59e0b' : '#64748b', 
                          fontWeight: '800',
                          textTransform: 'uppercase'
                        }}>{physicalResults.tensile === 'FAIL' ? 'MARGINAL' : physicalResults.tensile}</span>
                      </div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fff' }}>
                        <th style={{ width: '250px' }}></th>
                        {['S1', 'S2', 'S3', 'S4', 'S5'].map(s => (
                          <th key={s} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          Before Ageing (Kg/cm²)
                        </td>
                        {physicalData.tensile.before.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input 
                              type="number" 
                              value={val}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setPhysicalData(prev => ({
                                  ...prev,
                                  tensile: { ...prev.tensile, before: prev.tensile.before.map((v, i) => i === idx ? newVal : v) }
                                }));
                                markDirty();
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && parseFloat(val) < currentTensileSpecs.before) ? '#fef2f2' : 'white', color: (val !== '' && parseFloat(val) < currentTensileSpecs.before) ? '#ef4444' : '#059669' }}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          After Ageing (Kg/cm²)
                        </td>
                        {physicalData.tensile.after.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input 
                              type="number" 
                              value={val}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setPhysicalData(prev => ({
                                  ...prev,
                                  tensile: { ...prev.tensile, after: prev.tensile.after.map((v, i) => i === idx ? newVal : v) }
                                }));
                                markDirty();
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && parseFloat(val) < currentTensileSpecs.after) ? '#fef2f2' : 'white', color: (val !== '' && parseFloat(val) < currentTensileSpecs.after) ? '#ef4444' : '#059669' }}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          % Retention After Ageing
                        </td>
                        {physicalData.tensile.before.map((b, idx) => {
                          const a = physicalData.tensile.after[idx];
                          const ret = (b && a) ? ((parseFloat(a) / parseFloat(b)) * 100).toFixed(2) : '-';
                          const isLow = ret !== '-' && parseFloat(ret) < currentTensileSpecs.retention;
                          return (
                            <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: isLow ? '#ef4444' : '#21808d', background: '#f8fafc' }}>
                              {ret}{ret !== '-' ? '%' : ''}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Elongation at Break Section */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Elongation at Break (%)</h4>
                      <div style={{ fontSize: '10px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Sample out of Tolerance: <span style={{ color: elongationOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(elongationOutCount).padStart(2, '0')}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Status: <span style={{ 
                          color: physicalResults.elongation === 'PASS' ? '#059669' : physicalResults.elongation === 'FAIL' ? '#f59e0b' : '#64748b', 
                          fontWeight: '800',
                          textTransform: 'uppercase'
                        }}>{physicalResults.elongation === 'FAIL' ? 'MARGINAL' : physicalResults.elongation}</span>
                      </div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fff' }}>
                        <th style={{ width: '250px' }}></th>
                        {['S1', 'S2', 'S3', 'S4', 'S5'].map(s => (
                          <th key={s} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          Before Ageing (%)
                        </td>
                        {physicalData.elongation.before.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input 
                              type="number" 
                              value={val}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setPhysicalData(prev => ({
                                  ...prev,
                                  elongation: { ...prev.elongation, before: prev.elongation.before.map((v, i) => i === idx ? newVal : v) }
                                }));
                                markDirty();
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && parseFloat(val) < currentElongationSpecs.before) ? '#fef2f2' : 'white', color: (val !== '' && parseFloat(val) < currentElongationSpecs.before) ? '#ef4444' : '#059669' }}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          After Ageing (%)
                        </td>
                        {physicalData.elongation.after.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input 
                              type="number" 
                              value={val}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setPhysicalData(prev => ({
                                  ...prev,
                                  elongation: { ...prev.elongation, after: prev.elongation.after.map((v, i) => i === idx ? newVal : v) }
                                }));
                                markDirty();
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && parseFloat(val) < currentElongationSpecs.after) ? '#fef2f2' : 'white', color: (val !== '' && parseFloat(val) < currentElongationSpecs.after) ? '#ef4444' : '#059669' }}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          % Retention After Ageing
                        </td>
                        {physicalData.elongation.before.map((b, idx) => {
                          const a = physicalData.elongation.after[idx];
                          const ret = (b && a) ? ((parseFloat(a) / parseFloat(b)) * 100).toFixed(2) : '-';
                          const isLow = ret !== '-' && parseFloat(ret) < currentElongationSpecs.retention;
                          return (
                            <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: isLow ? '#ef4444' : '#21808d', background: '#f8fafc' }}>
                              {ret}{ret !== '-' ? '%' : ''}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Relaxed Modulus Section */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Relaxed Modulus at 100% Elongation</h4>
                      <div style={{ fontSize: '10px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Sample out of Tolerance: <span style={{ color: modulusOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(modulusOutCount).padStart(2, '0')}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Status: <span style={{ 
                          color: physicalResults.modulus === 'PASS' ? '#059669' : physicalResults.modulus === 'FAIL' ? '#f59e0b' : '#64748b', 
                          fontWeight: '800',
                          textTransform: 'uppercase'
                        }}>{physicalResults.modulus === 'FAIL' ? 'MARGINAL' : physicalResults.modulus}</span>
                      </div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fff' }}>
                        <th style={{ width: '250px' }}></th>
                        {['S1', 'S2', 'S3'].map(s => (
                          <th key={s} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{s}</th>
                        ))}
                        <th style={{ flex: 1 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          Before Ageing (Kg/cm²)
                        </td>
                        {physicalData.modulus.before.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input 
                              type="number" 
                              value={val}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setPhysicalData(prev => ({
                                  ...prev,
                                  modulus: { ...prev.modulus, before: prev.modulus.before.map((v, i) => i === idx ? newVal : v) }
                                }));
                                markDirty();
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && (parseFloat(val) < currentModulusSpecs.min || parseFloat(val) > currentModulusSpecs.max)) ? '#fef2f2' : 'white', color: (val !== '' && (parseFloat(val) < currentModulusSpecs.min || parseFloat(val) > currentModulusSpecs.max)) ? '#ef4444' : '#059669' }}
                            />
                          </td>
                        ))}
                        <td></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          After Ageing (Kg/cm²)
                        </td>
                        {physicalData.modulus.after.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input 
                              type="number" 
                              value={val}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setPhysicalData(prev => ({
                                  ...prev,
                                  modulus: { ...prev.modulus, after: prev.modulus.after.map((v, i) => i === idx ? newVal : v) }
                                }));
                                markDirty();
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: 'white' }}
                            />
                          </td>
                        ))}
                        <td></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                          % Change in Modulus
                        </td>
                        {physicalData.modulus.before.map((b, idx) => {
                          const a = physicalData.modulus.after[idx];
                          const change = (b && a) ? (((parseFloat(a) - parseFloat(b)) / parseFloat(b)) * 100).toFixed(2) : '-';
                          const isOut = change !== '-' && (parseFloat(change) > currentModulusSpecs.changePos || parseFloat(change) < -currentModulusSpecs.changeNeg);
                          return (
                            <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: isOut ? '#ef4444' : '#21808d', background: '#f8fafc' }}>
                              {change}{change !== '-' ? '%' : ''}
                            </td>
                          );
                        })}
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Compression Set Section */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Compression Set subjected to 50% Compression</h4>
                      <div style={{ fontSize: '10px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Sample out of Tolerance: <span style={{ color: compressionOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(compressionOutCount).padStart(2, '0')}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Status: <span style={{ color: physicalResults.compression === 'PASS' ? '#059669' : physicalResults.compression === 'FAIL' ? '#f59e0b' : '#64748b', fontWeight: '800' }}>{physicalResults.compression === 'FAIL' ? 'MARGINAL' : physicalResults.compression}</span>
                      </div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fff' }}>
                        <th style={{ width: '250px' }}></th>
                        {['S1', 'S2', 'S3'].map(s => <th key={s} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{s}</th>)}
                        <th style={{ flex: 1 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Initial Thickness (A) in mm</td>
                        {physicalData.compression.initial.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input type="number" value={val} onChange={(e) => setPhysicalData(prev => ({ ...prev, compression: { ...prev.compression, initial: prev.compression.initial.map((v, i) => i === idx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                          </td>
                        ))}
                        <td></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Final Thickness (B) in mm</td>
                        {physicalData.compression.final.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input type="number" value={val} onChange={(e) => setPhysicalData(prev => ({ ...prev, compression: { ...prev.compression, final: prev.compression.final.map((v, i) => i === idx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                          </td>
                        ))}
                        <td></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Compression Set ((A-B)/A*100)</td>
                        {physicalData.compression.initial.map((a, idx) => {
                          const b = physicalData.compression.final[idx];
                          const set = (a && b) ? (((parseFloat(a) - parseFloat(b)) / parseFloat(a)) * 100).toFixed(2) : '-';
                          return <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: (set !== '-' && parseFloat(set) > 30) ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{set}{set !== '-' ? '%' : ''}</td>;
                        })}
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tension Set Section */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Tension Set subjected to 50% Stretch</h4>
                      <div style={{ fontSize: '10px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Sample out of Tolerance: <span style={{ color: tensionOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(tensionOutCount).padStart(2, '0')}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Status: <span style={{ color: physicalResults.tension === 'PASS' ? '#059669' : physicalResults.tension === 'FAIL' ? '#f59e0b' : '#64748b', fontWeight: '800' }}>{physicalResults.tension === 'FAIL' ? 'MARGINAL' : physicalResults.tension}</span>
                      </div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fff' }}>
                        <th style={{ width: '250px' }}></th>
                        {['S1', 'S2', 'S3'].map(s => <th key={s} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{s}</th>)}
                        <th style={{ flex: 1 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Initial Length (A) in mm</td>
                        {physicalData.tension.initial.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input type="number" value={val} onChange={(e) => setPhysicalData(prev => ({ ...prev, tension: { ...prev.tension, initial: prev.tension.initial.map((v, i) => i === idx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                          </td>
                        ))}
                        <td></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Final Length (B) in mm</td>
                        {physicalData.tension.final.map((val, idx) => (
                          <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                            <input type="number" value={val} onChange={(e) => setPhysicalData(prev => ({ ...prev, tension: { ...prev.tension, final: prev.tension.final.map((v, i) => i === idx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                          </td>
                        ))}
                        <td></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Tension Set ((B-A)/A*100)</td>
                        {physicalData.tension.initial.map((a, idx) => {
                          const b = physicalData.tension.final[idx];
                          const set = (a && b) ? (((parseFloat(b) - parseFloat(a)) / parseFloat(a)) * 100).toFixed(2) : '-';
                          return <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: (set !== '-' && parseFloat(set) > 25) ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{set}{set !== '-' ? '%' : ''}</td>;
                        })}
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Load Compression Test Section */}
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Load Compression Test</h4>
                      <div style={{ fontSize: '10px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        Status: <span style={{ color: physicalResults.load === 'PASS' ? '#059669' : physicalResults.load === 'FAIL' ? '#f59e0b' : '#64748b', fontWeight: '800' }}>{physicalResults.load === 'FAIL' ? 'MARGINAL' : physicalResults.load}</span>
                      </div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fcfcfc' }}>
                        <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }} rowSpan="2">Load (Tonnes)</th>
                        <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }} colSpan="3">Pad 1</th>
                        <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }} colSpan="3">Pad 2</th>
                      </tr>
                      <tr style={{ background: '#fcfcfc' }}>
                        <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>L Gauge</th>
                        <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>R Gauge</th>
                        <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9', background: '#f0f9ff' }}>Defl (mm)</th>
                        <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>L Gauge</th>
                        <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>R Gauge</th>
                        <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9', background: '#f0f9ff' }}>Defl (mm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0.08, 0.76, 1.52, 2.28, 3.8, 7.6, 11.4, 15.2].map((load, idx) => (
                        <tr key={load}>
                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '800', background: '#f8fafc', border: '1px solid #f1f5f9' }}>{load}</td>
                          {['pad1', 'pad2'].map(padKey => {
                            const data = physicalData.loadTest[padKey][idx];
                            const defl = (data.left && data.right) ? ((parseFloat(data.left) + parseFloat(data.right)) / 2).toFixed(2) : '-';
                            const isOutAtEnd = idx === 7 && defl !== '-' && (parseFloat(defl) < currentLoadSpecs.min || parseFloat(defl) > currentLoadSpecs.max);
                            return (
                              <React.Fragment key={padKey}>
                                <td style={{ padding: '4px', border: '1px solid #f1f5f9' }}>
                                  <input type="number" value={data.left} onChange={(e) => setPhysicalData(prev => ({ ...prev, loadTest: { ...prev.loadTest, [padKey]: prev.loadTest[padKey].map((v, i) => i === idx ? { ...v, left: e.target.value } : v) } }))} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }} />
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #f1f5f9' }}>
                                  <input type="number" value={data.right} onChange={(e) => setPhysicalData(prev => ({ ...prev, loadTest: { ...prev.loadTest, [padKey]: prev.loadTest[padKey].map((v, i) => i === idx ? { ...v, right: e.target.value } : v) } }))} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }} />
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '900', background: '#f8fafc', border: '1px solid #f1f5f9', color: isOutAtEnd ? '#ef4444' : '#21808d' }}>{defl}</td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
                {/* 8) Electrical Resistance Test */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Electrical Resistance Test (Mega Ohms)</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Samples out of Tolerance: <span style={{ color: resOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(resOutCount).padStart(2, '0')}</span>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: elecResults.resistance === 'PASS' ? '#dcfce7' : elecResults.resistance === 'FAIL' ? '#fef3c7' : '#fee2e2', color: elecResults.resistance === 'PASS' ? '#166534' : elecResults.resistance === 'FAIL' ? '#b45309' : '#991b1b' }}>{elecResults.resistance === 'FAIL' ? 'MARGINAL' : elecResults.resistance}</span>
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                          <th colSpan="3" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f0f9fa', fontSize: '12px', color: '#21808d', fontWeight: '800' }}>Before Immersion</th>
                          <th colSpan="3" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#fff7ed', fontSize: '12px', color: '#c2410c', fontWeight: '800' }}>After Immersion*</th>
                        </tr>
                        <tr>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Forward</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Reverse</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', background: '#f8fafc' }}>Lower Value</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Forward</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Reverse</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', background: '#f8fafc' }}>Lower Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {elecData.resistance.map((row, idx) => {
                          const bMin = (row.bF && row.bR) ? Math.min(parseFloat(row.bF), parseFloat(row.bR)) : '-';
                          const aMin = (row.aF && row.aR) ? Math.min(parseFloat(row.aF), parseFloat(row.aR)) : '-';
                          return (
                            <tr key={idx}>
                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={row.bF} onChange={(e) => setElecData(prev => ({ ...prev, resistance: prev.resistance.map((r, i) => i === idx ? { ...r, bF: e.target.value } : r) }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={row.bR} onChange={(e) => setElecData(prev => ({ ...prev, resistance: prev.resistance.map((r, i) => i === idx ? { ...r, bR: e.target.value } : r) }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: bMin !== '-' && bMin < 100 ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{bMin}</td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={row.aF} onChange={(e) => setElecData(prev => ({ ...prev, resistance: prev.resistance.map((r, i) => i === idx ? { ...r, aF: e.target.value } : r) }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={row.aR} onChange={(e) => setElecData(prev => ({ ...prev, resistance: prev.resistance.map((r, i) => i === idx ? { ...r, aR: e.target.value } : r) }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: aMin !== '-' && aMin < 100 ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{aMin}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Specific Gravity */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Specific Gravity</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Samples out of Tolerance: <span style={{ color: totalSGOut > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(totalSGOut).padStart(2, '0')}</span>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: elecResults.sg === 'PASS' ? '#dcfce7' : elecResults.sg === 'FAIL' ? '#fef3c7' : '#fee2e2', color: elecResults.sg === 'PASS' ? '#166534' : elecResults.sg === 'FAIL' ? '#b45309' : '#991b1b' }}>{elecResults.sg === 'FAIL' ? 'MARGINAL' : elecResults.sg}</span>
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                          <th colSpan="3" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Compound A</th>
                          {isCGRSP && <th colSpan="3" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Compound B</th>}
                          {isCGRSP && <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Variation</th>}
                        </tr>
                        <tr>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Wt. Air (g)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Wt. Water (g)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', background: '#f8fafc' }}>S.G.</th>
                          {isCGRSP && <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Wt. Air (g)</th>}
                          {isCGRSP && <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Wt. Water (g)</th>}
                          {isCGRSP && <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', background: '#f8fafc' }}>S.G.</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 1, 2].map(idx => {
                          const rA = elecData.sg.compoundA[idx];
                          const rB = elecData.sg.compoundB[idx];
                          const sgA = (rA.air && rA.water) ? (parseFloat(rA.air) / (parseFloat(rA.air) - parseFloat(rA.water))).toFixed(3) : '-';
                          const sgB = (rB.air && rB.water) ? (parseFloat(rB.air) / (parseFloat(rB.air) - parseFloat(rB.water))).toFixed(3) : '-';
                          const variation = (sgA !== '-' && sgB !== '-') ? (parseFloat(sgA) - parseFloat(sgB)).toFixed(3) : '-';
                          
                          return (
                            <tr key={idx}>
                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={rA.air} onChange={(e) => setElecData(prev => ({ ...prev, sg: { ...prev.sg, compoundA: prev.sg.compoundA.map((r, i) => i === idx ? { ...r, air: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={rA.water} onChange={(e) => setElecData(prev => ({ ...prev, sg: { ...prev.sg, compoundA: prev.sg.compoundA.map((r, i) => i === idx ? { ...r, water: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: sgA !== '-' && parseFloat(sgA) > currentSGSpecs.a ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{sgA}</td>
                              
                              {isCGRSP && (
                                <>
                                  <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                    <input type="number" value={rB.air} onChange={(e) => setElecData(prev => ({ ...prev, sg: { ...prev.sg, compoundB: prev.sg.compoundB.map((r, i) => i === idx ? { ...r, air: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                  </td>
                                  <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                    <input type="number" value={rB.water} onChange={(e) => setElecData(prev => ({ ...prev, sg: { ...prev.sg, compoundB: prev.sg.compoundB.map((r, i) => i === idx ? { ...r, water: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: sgB !== '-' && parseFloat(sgB) > currentSGSpecs.b ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{sgB}</td>
                                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: variation !== '-' && Math.abs(parseFloat(variation)) > currentSGSpecs.variation ? '#ef4444' : '#64748b', background: '#f8fafc' }}>{variation}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ash Content */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Ash Content</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                        No. of Samples out of Tolerance: <span style={{ color: totalAshOut > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(totalAshOut).padStart(2, '0')}</span>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: elecResults.ash === 'PASS' ? '#dcfce7' : elecResults.ash === 'FAIL' ? '#fef3c7' : '#fee2e2', color: elecResults.ash === 'PASS' ? '#166534' : elecResults.ash === 'FAIL' ? '#b45309' : '#991b1b' }}>{elecResults.ash === 'FAIL' ? 'MARGINAL' : elecResults.ash}</span>
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                          <th colSpan="4" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Product A</th>
                          {isCGRSP && <th colSpan="4" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Product B</th>}
                          {isCGRSP && <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Variation</th>}
                        </tr>
                        <tr>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Crucible</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Sample+Cr</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Ash+Cr</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', background: '#f8fafc' }}>% Ash</th>
                          {isCGRSP && (
                            <>
                              <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Crucible</th>
                              <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Sample+Cr</th>
                              <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Ash+Cr</th>
                              <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', background: '#f8fafc' }}>% Ash</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 1, 2].map(idx => {
                          const rA = elecData.ash.compoundA[idx];
                          const rB = elecData.ash.compoundB[idx];
                          const ashA = (rA.crucible && rA.sample && rA.ash) ? (((parseFloat(rA.ash) - parseFloat(rA.crucible)) / (parseFloat(rA.sample) - parseFloat(rA.crucible))) * 100).toFixed(2) : '-';
                          const ashB = (rB.crucible && rB.sample && rB.ash) ? (((parseFloat(rB.ash) - parseFloat(rB.crucible)) / (parseFloat(rB.sample) - parseFloat(rB.crucible))) * 100).toFixed(2) : '-';
                          const variation = (ashA !== '-' && ashB !== '-') ? (parseFloat(ashA) - parseFloat(ashB)).toFixed(2) : '-';
                          
                          return (
                            <tr key={idx}>
                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={rA.crucible} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundA: prev.ash.compoundA.map((r, i) => i === idx ? { ...r, crucible: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={rA.sample} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundA: prev.ash.compoundA.map((r, i) => i === idx ? { ...r, sample: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={rA.ash} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundA: prev.ash.compoundA.map((r, i) => i === idx ? { ...r, ash: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: ashA !== '-' && parseFloat(ashA) > currentAshSpecs.a ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{ashA}%</td>
                              
                              {isCGRSP && (
                                <>
                                  <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                    <input type="number" value={rB.crucible} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundB: prev.ash.compoundB.map((r, i) => i === idx ? { ...r, crucible: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                  </td>
                                  <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                    <input type="number" value={rB.sample} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundB: prev.ash.compoundB.map((r, i) => i === idx ? { ...r, sample: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                  </td>
                                  <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                    <input type="number" value={rB.ash} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundB: prev.ash.compoundB.map((r, i) => i === idx ? { ...r, ash: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: ashB !== '-' && parseFloat(ashB) > currentAshSpecs.b ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{ashB}%</td>
                                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: variation !== '-' && Math.abs(parseFloat(variation)) > currentAshSpecs.variation ? '#ef4444' : '#64748b', background: '#f8fafc' }}>{variation}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {elecFailedCount === 1 && (
                          <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13px' }}>
                            INITIATE RE-TEST
                          </button>
                        )}
                        <button onClick={handleSave} style={{ background: '#21808d', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 12px rgba(33,128,141,0.2)' }}>
                          Save & Submit Module
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'specialized' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease-out' }}>
                {/* Adhesion Test */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Adhesion Test</h3>
                      <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType} | Standard: ≥8 Kgf</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: specResults.adhesion === 'PASS' ? '#dcfce7' : specResults.adhesion === 'FAIL' ? '#fef3c7' : '#fee2e2', color: specResults.adhesion === 'PASS' ? '#166534' : specResults.adhesion === 'FAIL' ? '#b45309' : '#991b1b' }}>{specResults.adhesion === 'FAIL' ? 'MARGINAL' : specResults.adhesion}</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Sample 1 (S1)', 'Sample 2 (S2)'].map(s => <th key={s} style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b', fontWeight: '700', borderBottom: '2px solid #f1f5f9' }}>{s}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {specData.adhesion.map((v, i) => (
                            <td key={i} style={{ padding: '12px', border: '1px solid #f1f5f9' }}>
                              <input type="number" value={v} onChange={(e) => {
                                const val = e.target.value;
                                const newA = [...specData.adhesion];
                                newA[i] = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
                                setSpecData(prev => ({ ...prev, adhesion: newA }));
                                markDirty();
                              }} style={{ width: '100%', padding: '12px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '16px', background: v !== '' && v < 8 ? '#fef2f2' : 'transparent', color: v !== '' && v < 8 ? '#ef4444' : '#21808d' }} />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Secant Stiffness */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Secant Stiffness</h3>
                      <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType} | Standard: 15 - 25 kN/mm</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: specResults.secant === 'PASS' ? '#dcfce7' : specResults.secant === 'FAIL' ? '#fef3c7' : '#fee2e2', color: specResults.secant === 'PASS' ? '#166534' : specResults.secant === 'FAIL' ? '#b45309' : '#991b1b' }}>{specResults.secant === 'FAIL' ? 'MARGINAL' : specResults.secant}</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Sample No.</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Load (kN)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>A (mm)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>B (mm)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>C (mm)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>D (mm)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', background: '#f8fafc' }}>Mean Value</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', background: '#f1f5f9' }}>Static Secant Stiffness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {specData.secant.map((sample, sIdx) => {
                          const res = secantResults[sIdx];
                          return (
                            <React.Fragment key={sIdx}>
                              <tr>
                                <td rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#475569' }}>{sIdx + 1}</td>
                                <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#64748b' }}>20</td>
                                {['a', 'b', 'c', 'd'].map(key => (
                                  <td key={key} style={{ padding: '2px', border: '1px solid #e2e8f0' }}>
                                    <input type="number" value={sample.s20[key]} onChange={(e) => {
                                      const newVal = [...specData.secant];
                                      newVal[sIdx].s20[key] = e.target.value;
                                      setSpecData(prev => ({ ...prev, secant: newVal }));
                                      markDirty();
                                    }} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                  </td>
                                ))}
                                <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{res.isS20Complete ? res.d1.toFixed(3) : '-'}</td>
                                <td rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: res.stiffness >= 15 && res.stiffness <= 25 ? '#166534' : '#ef4444', background: '#f1f5f9', fontSize: '18px' }}>
                                  {res.stiffness > 0 ? res.stiffness : '-'}
                                </td>
                              </tr>
                              <tr>
                                <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#64748b' }}>90</td>
                                {['a', 'b', 'c', 'd'].map(key => (
                                  <td key={key} style={{ padding: '2px', border: '1px solid #e2e8f0' }}>
                                    <input type="number" value={sample.s90[key]} onChange={(e) => {
                                      const newVal = [...specData.secant];
                                      newVal[sIdx].s90[key] = e.target.value;
                                      setSpecData(prev => ({ ...prev, secant: newVal }));
                                      markDirty();
                                    }} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                  </td>
                                ))}
                                <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{res.isS90Complete ? res.d2.toFixed(3) : '-'}</td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Specialized Decision */}
                {specDecision !== 'PENDING VERIFICATION' && (
                  <section style={{ background: specDecision === 'LOT PASSED' ? '#0f172a' : specDecision.includes('PERMANENT') ? '#991b1b' : '#21808d', padding: '16px 24px', borderRadius: '16px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: '800' }}>Tab 4 Final Decision</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{specDecision}</div>
                      </div>
                      {specFailedCount === 1 && (
                        <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13px' }}>INITIATE RE-TEST</button>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'ncrgrsp' && specData.ncrgrsp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
                {/* Adhesion Test */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Adhesion Test</h3>
                      <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>Limit: Peel ≥ 4.0 Kgf | H-Pull ≥ 10 Kgf</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: ncrResults.adhesion === 'PASS' ? '#dcfce7' : ncrResults.adhesion === 'FAIL' ? '#fef3c7' : '#fee2e2', color: ncrResults.adhesion === 'PASS' ? '#166534' : ncrResults.adhesion === 'FAIL' ? '#b45309' : '#991b1b' }}>{ncrResults.adhesion === 'FAIL' ? 'MARGINAL' : ncrResults.adhesion}</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample No.</th>
                          <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Peel Adhesion (Kgf)</th>
                          <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>H-Pull Test (Kgf)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {specData.ncrgrsp.adhesion && specData.ncrgrsp.adhesion.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#475569' }}>S{idx + 1}</td>
                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <input type="number" value={row.peel} onChange={(e) => {
                                const newVal = [...specData.ncrgrsp.adhesion];
                                newVal[idx].peel = e.target.value;
                                setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, adhesion: newVal } }));
                                markDirty();
                              }} style={{ width: '100%', padding: '10px', border: 'none', textAlign: 'center', fontWeight: '900', fontSize: '15px', color: row.peel !== '' && row.peel < 4 ? '#ef4444' : '#21808d' }} />
                            </td>
                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <input type="number" value={row.hpull} onChange={(e) => {
                                const newVal = [...specData.ncrgrsp.adhesion];
                                newVal[idx].hpull = e.target.value;
                                setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, adhesion: newVal } }));
                                markDirty();
                              }} style={{ width: '100%', padding: '10px', border: 'none', textAlign: 'center', fontWeight: '900', fontSize: '15px', color: row.hpull !== '' && row.hpull < 10 ? '#ef4444' : '#21808d' }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Breaking Load */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Breaking Load</h3>
                      <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>Limit: 350 Kgf Min</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: ncrResults.breaking === 'PASS' ? '#dcfce7' : ncrResults.breaking === 'FAIL' ? '#fef3c7' : '#fee2e2', color: ncrResults.breaking === 'PASS' ? '#166534' : ncrResults.breaking === 'FAIL' ? '#b45309' : '#991b1b' }}>{ncrResults.breaking === 'FAIL' ? 'MARGINAL' : ncrResults.breaking}</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['S1', 'S2', 'S3', 'S4', 'S5'].map(s => <th key={s} style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>{s}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {specData.ncrgrsp.breaking && specData.ncrgrsp.breaking.map((v, i) => (
                            <td key={i} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <input type="number" value={v} onChange={(e) => {
                                const newVal = [...specData.ncrgrsp.breaking];
                                newVal[i] = e.target.value;
                                setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, breaking: newVal } }));
                                markDirty();
                              }} style={{ width: '100%', padding: '10px', border: 'none', textAlign: 'center', fontWeight: '900', fontSize: '15px', color: v !== '' && v < 350 ? '#ef4444' : '#21808d' }} />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Physical Properties of Nylon Cord */}
                <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Physical Properties of Nylon Cord</h3>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: ncrResults.cord === 'PASS' ? '#dcfce7' : ncrResults.cord === 'FAIL' ? '#fef3c7' : '#fee2e2', color: ncrResults.cord === 'PASS' ? '#166534' : ncrResults.cord === 'FAIL' ? '#b45309' : '#991b1b' }}>{ncrResults.cord === 'FAIL' ? 'MARGINAL' : ncrResults.cord}</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Sample</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Denier (gm/9000m)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>No. of end/inch (22-26)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Thickness (0.75 min)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Load at Break (16 min)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Elongation (20% max)</th>
                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Twists/m (380-400)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {specData.ncrgrsp.nylonCord && specData.ncrgrsp.nylonCord.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#475569' }}>S{idx + 1}</td>
                            {Object.keys(row).map(key => (
                              <td key={key} style={{ padding: '2px', border: '1px solid #e2e8f0' }}>
                                <input type="number" value={row[key]} onChange={(e) => {
                                  const newVal = [...specData.ncrgrsp.nylonCord];
                                  newVal[idx][key] = e.target.value;
                                  setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, nylonCord: newVal } }));
                                  markDirty();
                                }} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NCR Decision */}
                {ncrDecision !== 'PENDING VERIFICATION' && (
                  <section style={{ background: ncrDecision === 'LOT PASSED' ? '#0f172a' : ncrDecision.includes('PERMANENT') ? '#991b1b' : '#21808d', padding: '16px 24px', borderRadius: '16px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: '800' }}>NCRGRSP Final Decision</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{ncrDecision}</div>
                      </div>
                      {ncrFailedCount === 1 && (
                        <button style={{ background: 'white', color: '#21808d', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13px' }}>INITIATE RE-TEST</button>
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
