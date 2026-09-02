import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { fetchInspectionCallById, fetchInspectionCallByCallNo } from '../../services/inspectionService';
import { finalInspectionLotResultsService } from '../../services/finalInspectionLotResultsService';
import { finalVisualDimensionalInspectionService } from '../../services/finalVisualDimensionalInspectionService';
import { finalWeightTestService } from '../../services/finalWeightTestService';
import { finalHardnessTestService } from '../../services/finalHardnessTestService';
import { finalTensileStrengthService } from '../../services/finalTensileStrengthService';
import { finalElongationService } from '../../services/finalElongationService';
import { finalModulusService } from '../../services/finalModulusService';
import { finalCompressionSetService } from '../../services/finalCompressionSetService';
import { finalTensionSetService } from '../../services/finalTensionSetService';
import { finalLoadTestService } from '../../services/finalLoadTestService';
import { finalElectricalResistanceService } from '../../services/finalElectricalResistanceService';
import { finalSpecificGravityService } from '../../services/finalSpecificGravityService';
import { finalAshContentService } from '../../services/finalAshContentService';
import { finalAdhesionService } from '../../services/finalAdhesionService';
import { finalSecantStiffnessService } from '../../services/finalSecantStiffnessService';
import { finalNcrAdhesionService } from '../../services/finalNcrAdhesionService';
import { finalNcrBreakingLoadService } from '../../services/finalNcrBreakingLoadService';
import { finalNcrNylonCordService } from '../../services/finalNcrNylonCordService';
import { finalResilienceTestService } from '../../services/finalResilienceTestService';
import { finalOzoneTestService } from '../../services/finalOzoneTestService';
import { finalPeriodicTgaService } from '../../services/finalPeriodicTgaService';
import { finalPeriodicDurabilityService } from '../../services/finalPeriodicDurabilityService';
import { finalPeriodicAbrasionService } from '../../services/finalPeriodicAbrasionService';
import { performTransitionAction } from '../../services/workflowService';
import { getStoredUser } from '../../services/authService';
import { fetchCallImages, saveCallImages } from '../../services/imageService';
import { getImages, saveImages } from '../../utils/imageStorage';
import ImageCaptureComponent from '../ImageCaptureComponent';
import Notification from '../Notification';
import AnnexureLoader from '../annexures/AnnexureLoader';
import PeriodicTestingTab from './PeriodicTestingTab';

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
        placeholder="H1,H2,H3,H4,H5"
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
      {value === '' && <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '11px' }}>H1,H2,H3,H4,H5</span>}
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

const SECTION_CONFIG = {
  hardness: { name: "Hardness Shore 'A'", primaryCount: 5, doubleCount: 10, startSample: 1 },
  tensile: { name: "Tensile Strength (kg/cm²)", primaryCount: 5, doubleCount: 10, startSample: 1 },
  elongation: { name: 'Elongation at Break (%)', primaryCount: 5, doubleCount: 10, startSample: 1 },
  modulus: { name: 'Relaxed Modulus at 100% Elongation', primaryCount: 3, doubleCount: 6, startSample: 1 },
  compression: { name: 'Compression Set (50% Compression)', primaryCount: 3, doubleCount: 6, startSample: 1 },
  tension: { name: 'Tension Set (50% Stretch)', primaryCount: 3, doubleCount: 6, startSample: 1 },
  load: { name: 'Load Compression Test', primaryCount: 2, doubleCount: 4, startSample: 1 },
  resistance: { name: 'Electrical Resistance Test', primaryCount: 3, doubleCount: 6, startSample: 1 },
  sg: { name: 'Specific Gravity', primaryCount: 3, doubleCount: 6, startSample: 1 },
  ash: { name: 'Ash Content', primaryCount: 3, doubleCount: 6, startSample: 1 },
  adhesion: { name: 'Dynamic & Durability - Adhesion', primaryCount: 2, doubleCount: 4, startSample: 1 },
  secant: { name: 'Dynamic & Durability - Secant', primaryCount: 2, doubleCount: 4, startSample: 1 },
  ncrAdhesion: { name: 'NCRGRSP Adhesion', primaryCount: 2, doubleCount: 4, startSample: 1 },
  ncrBreaking: { name: 'NCRGRSP Breaking Load', primaryCount: 5, doubleCount: 10, startSample: 1 },
  ncrCord: { name: 'NCRGRSP Nylon Cord', primaryCount: 3, doubleCount: 6, startSample: 1 },
  resilience: { name: 'Resilience Test', primaryCount: 3, doubleCount: 6, startSample: 1 },
  ozone: { name: 'Ozone Test', primaryCount: 1, doubleCount: 2, startSample: 1 },
  tga: { name: 'Periodic - TGA', primaryCount: 5, doubleCount: 0, startSample: 1 },
  durability: { name: 'Periodic - Durability', primaryCount: 5, doubleCount: 0, startSample: 1 },
  abrasion: { name: 'Periodic - Abrasion', primaryCount: 5, doubleCount: 0, startSample: 1 }
};

const padHardness = (h, targetSize = 15) => {
  const pad = (arr) => {
    const a = Array.isArray(arr) ? arr : [];
    const padded = [];
    for (let i = 0; i < targetSize; i++) {
      padded.push(a[i] !== null && a[i] !== undefined ? a[i] : '');
    }
    return padded;
  };
  return {
    compoundA: pad(h?.compoundA),
    compoundB: pad(h?.compoundB)
  };
};

const padPhysicalData = (pd) => {
  const pad = (arr, size, fill = '') => {
    const a = Array.isArray(arr) ? arr : [];
    const padded = [];
    for (let i = 0; i < size; i++) {
      const val = a[i];
      if (val === null || val === undefined) {
        padded.push(typeof fill === 'object' ? JSON.parse(JSON.stringify(fill)) : fill);
      } else {
        padded.push(val);
      }
    }
    return padded;
  };
  return {
    hardness: padHardness(pd?.hardness, 15),
    tensile: {
      before: pad(pd?.tensile?.before, 15),
      after: pad(pd?.tensile?.after, 15)
    },
    elongation: {
      before: pad(pd?.elongation?.before, 15),
      after: pad(pd?.elongation?.after, 15)
    },
    modulus: {
      before: pad(pd?.modulus?.before, 9),
      after: pad(pd?.modulus?.after, 9)
    },
    compression: {
      initial: pad(pd?.compression?.initial, 9),
      final: pad(pd?.compression?.final, 9)
    },
    tension: {
      initial: pad(pd?.tension?.initial, 9),
      final: pad(pd?.tension?.final, 9)
    },
    loadTest: {
      loads: pad(pd?.loadTest?.loads, 8, ''),
      pad1: pad(pd?.loadTest?.pad1, 8, { left: '', right: '' }),
      pad2: pad(pd?.loadTest?.pad2, 8, { left: '', right: '' }),
      mPad1: pad(pd?.loadTest?.mPad1, 8, { left: '', right: '' }),
      mPad2: pad(pd?.loadTest?.mPad2, 8, { left: '', right: '' }),
      mPad3: pad(pd?.loadTest?.mPad3, 8, { left: '', right: '' }),
      mPad4: pad(pd?.loadTest?.mPad4, 8, { left: '', right: '' })
    },
    resilience: pad(pd?.resilience, 3, { i1: '', i2: '', i3: '', i4: '', i5: '', i6: '' })
  };
};

const padElecData = (ed) => {
  const pad = (arr, size, fill = '') => {
    const a = Array.isArray(arr) ? arr : [];
    const padded = [];
    for (let i = 0; i < size; i++) {
      const val = a[i];
      if (val === null || val === undefined) {
        padded.push(typeof fill === 'object' ? JSON.parse(JSON.stringify(fill)) : fill);
      } else {
        padded.push(val);
      }
    }
    return padded;
  };
  return {
    resistance: pad(ed?.resistance, 9, { bF: '', bR: '', aF: '', aR: '' }),
    sg: {
      compoundA: pad(ed?.sg?.compoundA, 9, { air: '', water: '' }),
      compoundB: pad(ed?.sg?.compoundB, 9, { air: '', water: '' })
    },
    ash: {
      compoundA: pad(ed?.ash?.compoundA, 9, { crucible: '', sample: '', ash: '' }),
      compoundB: pad(ed?.ash?.compoundB, 9, { crucible: '', sample: '', ash: '' })
    },
    ozone: pad(ed?.ozone, 1, { initial: '40', stretched: '52', obs: '' })
  };
};

const padPeriodicData = (prd) => {
  const sanitize = (arr, defaultObj) => {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.map(item => ({ ...defaultObj, ...item }));
    }
    return [{ ...defaultObj }];
  };
  return {
    tga: {
      dateOfLastTest: prd?.tga?.dateOfLastTest || '',
      qtyProduced: prd?.tga?.qtyProduced || '',
      threshold: 30000,
      samples: sanitize(prd?.tga?.samples, { lotNo: '', sampleNo: '', weight: '', tempRange: '', polymer: '' })
    },
    durability: {
      dateOfLastTest: prd?.durability?.dateOfLastTest || '',
      qtyProduced: prd?.durability?.qtyProduced || '',
      threshold: 100000,
      samples: sanitize(prd?.durability?.samples, { lotNo: '', initialThick: '', finalThick: '', initialLoad: '', finalLoad: '' })
    },
    abrasion: {
      dateOfLastTest: prd?.abrasion?.dateOfLastTest || '',
      qtyProduced: prd?.abrasion?.qtyProduced || '',
      threshold: 100000,
      samples: sanitize(prd?.abrasion?.samples, { lotNo: '', sampleNo: '', initialMass: '', finalMass: '', relativeLoss: '' })
    }
  };
};

const padSpecData = (sd) => {
  const pad = (arr, size, fill = '') => {
    const a = Array.isArray(arr) ? arr : [];
    const padded = [];
    for (let i = 0; i < size; i++) {
      const val = a[i];
      if (val === null || val === undefined) {
        padded.push(typeof fill === 'object' ? JSON.parse(JSON.stringify(fill)) : fill);
      } else {
        padded.push(val);
      }
    }
    return padded;
  };
  return {
    adhesion: pad(sd?.adhesion, 6),
    secant: pad(sd?.secant, 6, { s20: { a: '', b: '', c: '', d: '' }, s90: { a: '', b: '', c: '', d: '' } }),
    ncrgrsp: {
      adhesion: pad(sd?.ncrgrsp?.adhesion, 6, { peel: '', hpull: '' }),
      breaking: pad(sd?.ncrgrsp?.breaking, 15),
      nylonCord: pad(sd?.ncrgrsp?.nylonCord, 9, { denier: '', epi: '', thickness: '', loadAtBreak: '', elongation: '', twists: '' })
    }
  };
};

const FinalInspectionDashboard = ({ user, isShiftActive, call, onUpdateCall, onPauseComplete }) => {
  const currentCallId = call?.callNo || call?.icNumber || call?.requestId || (call?.id ? String(call.id) : '');
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [activeTab, setActiveTab] = useState('visual');
  const [selectedLot, setSelectedLot] = useState(null);
  const [reTestActive, setReTestActive] = useState(false);
  const [reOfferActive, setReOfferActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubmoduleTab, setActiveSubmoduleTab] = useState('visualDim');
  const [visibleLoadRows, setVisibleLoadRows] = useState(4);

  const handleDeleteRow = (indexToDelete) => {
    if (visibleLoadRows <= 1) return;
    
    setPhysicalData(prev => {
      const newData = { ...prev };
      const loadTest = { ...newData.loadTest };
      
      const newLoads = [...loadTest.loads];
      newLoads.splice(indexToDelete, 1);
      newLoads.push('');
      loadTest.loads = newLoads;

      ['pad1', 'pad2', 'mPad1', 'mPad2', 'mPad3', 'mPad4'].forEach(padKey => {
        const newPad = [...loadTest[padKey]];
        newPad.splice(indexToDelete, 1);
        newPad.push({ left: '', right: '' });
        loadTest[padKey] = newPad;
      });

      return { ...newData, loadTest };
    });
    setVisibleLoadRows(prev => prev - 1);
  };

  const activeLot = lots.find(l => l.id === selectedLot) || lots[0] || { railpadType: call?.railPadType || 'GRSP' };
  const activeRailpadType = activeLot.railpadType || call?.railPadType || call?.railpadType || 'GRSP';
  const isNCRGRSP = (activeRailpadType || '').toUpperCase().includes('NCR') || (call?.railPadType || '').toUpperCase().includes('NCR') || (call?.railpadType || '').toUpperCase().includes('NCR');

  // State Management for Dirty Form
  const [isDirty, setIsDirty] = useState(false);
  const [pendingLotId, setPendingLotId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };



  const [capturedImages, setCapturedImages] = useState([]);

  // Fetch saved inspection photos for this final call
  useEffect(() => {
    if (!currentCallId) {
      setCapturedImages([]);
      return;
    }
    setCapturedImages([]);
    let isMounted = true;
    fetchCallImages(currentCallId, 'RAILPAD_FINAL').then(imgs => {
      if (!isMounted) return;
      if (imgs && imgs.length > 0) {
        setCapturedImages(imgs);
      } else {
        getImages(`railpad_final_images_${currentCallId}`).then(cached => {
          if (isMounted && cached && cached.length > 0) setCapturedImages(cached);
        });
      }
    }).catch(err => {
      console.warn('Error fetching final call images:', err);
      if (isMounted) {
        getImages(`railpad_final_images_${currentCallId}`).then(cached => {
          if (isMounted && cached && cached.length > 0) setCapturedImages(cached);
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentCallId]);

  // State for Final Inspection Results
  const [remarks, setRemarks] = useState('');
  const [sealingType, setSealingType] = useState('RITES_HOLOGRAM');
  const [steelStampNumber, setSteelStampNumber] = useState('');
  const [hologramEntries, setHologramEntries] = useState([]);
  const [loadedLot, setLoadedLot] = useState(null);

  // State for NCRGRSP Sets Quantity Summary (Used in IC Section 6, 7, 8)
  const [ncrSetsOffered, setNcrSetsOffered] = useState('');
  const [ncrSetsAccepted, setNcrSetsAccepted] = useState('');
  const [ncrSetsRejected, setNcrSetsRejected] = useState('');

  // Auto-initialize NCRGRSP Sets Offered from vendor entry (no_of_sets column in rail_inspection_call)
  useEffect(() => {
    if (isNCRGRSP) {
      const vendorOffered = call?.noOfSets || call?.no_of_sets || call?.noSets || call?.callQty || call?.totalOfferedQty || call?.offeredQty || call?.qtyDesiredForFinal || (lots.length > 0 ? lots.reduce((acc, l) => acc + (Number(l.size) || 0), 0) : '');
      const possibleCallIds = Array.from(new Set([
        currentCallId,
        call?.callNo,
        call?.icNumber,
        call?.requestId,
        call?.id ? String(call.id) : null
      ].filter(Boolean)));

      let savedOffered = null;
      let savedAccepted = null;
      let savedRejected = null;
      for (const cid of possibleCallIds) {
        const o = localStorage.getItem(`railpad_ncr_sets_offered_${cid}`);
        const a = localStorage.getItem(`railpad_ncr_sets_accepted_${cid}`);
        const r = localStorage.getItem(`railpad_ncr_sets_rejected_${cid}`);
        if (o !== null && o !== '' && !savedOffered) savedOffered = o;
        if (a !== null && a !== '' && !savedAccepted) savedAccepted = a;
        if (r !== null && r !== '' && !savedRejected) savedRejected = r;
      }

      if (savedOffered !== null && savedOffered !== '') {
        setNcrSetsOffered(savedOffered);
      } else if (vendorOffered) {
        setNcrSetsOffered(String(vendorOffered));
      }

      if (savedAccepted !== null && savedAccepted !== '') {
        setNcrSetsAccepted(savedAccepted);
      }
      if (savedRejected !== null && savedRejected !== '') {
        setNcrSetsRejected(savedRejected);
      }
    }
  }, [isNCRGRSP, call, lots, currentCallId]);

  const handleNcrSetsAcceptedChange = (val) => {
    setNcrSetsAccepted(val);
    markDirty();
    const offeredNum = parseFloat(ncrSetsOffered);
    const acceptedNum = parseFloat(val);
    let rejectedStr = '';
    if (!isNaN(offeredNum) && !isNaN(acceptedNum)) {
      const rejectedNum = Math.max(0, offeredNum - acceptedNum);
      rejectedStr = String(rejectedNum);
      setNcrSetsRejected(rejectedStr);
    } else {
      setNcrSetsRejected('');
    }

    const possibleCallIds = Array.from(new Set([
      currentCallId,
      call?.callNo,
      call?.icNumber,
      call?.requestId,
      call?.id ? String(call.id) : null
    ].filter(Boolean)));
    possibleCallIds.forEach(cid => {
      localStorage.setItem(`railpad_ncr_sets_accepted_${cid}`, val);
      localStorage.setItem(`railpad_ncr_sets_rejected_${cid}`, rejectedStr);
    });
  };

  const handleNcrSetsOfferedChange = (val) => {
    setNcrSetsOffered(val);
    markDirty();
    const offeredNum = parseFloat(val);
    const acceptedNum = parseFloat(ncrSetsAccepted);
    let rejectedStr = '';
    if (!isNaN(offeredNum) && !isNaN(acceptedNum)) {
      const rejectedNum = Math.max(0, offeredNum - acceptedNum);
      rejectedStr = String(rejectedNum);
      setNcrSetsRejected(rejectedStr);
    }

    const possibleCallIds = Array.from(new Set([
      currentCallId,
      call?.callNo,
      call?.icNumber,
      call?.requestId,
      call?.id ? String(call.id) : null
    ].filter(Boolean)));
    possibleCallIds.forEach(cid => {
      localStorage.setItem(`railpad_ncr_sets_offered_${cid}`, val);
      if (rejectedStr) {
        localStorage.setItem(`railpad_ncr_sets_rejected_${cid}`, rejectedStr);
      }
    });
  };

  // State for Visual & Dimensional Testing
  const [visualData, setVisualData] = useState({
    dv: '',
    dd: '',
    visualReason: '',
    dimReason: '',
    visualN: 25,
    dimN: 25
  });
  const [dbDimensionalStatus, setDbDimensionalStatus] = useState(null);
  const [dbDimensionalNotOk, setDbDimensionalNotOk] = useState(null);

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

  const [showWeightSecond, setShowWeightSecond] = useState(false);
  const [showWeightPopup, setShowWeightPopup] = useState(false);

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
    'RDSO/T-8694': { type: '10mm CGRSP', max: 445 },
    'RDSO/T-8747': { type: '10mm CGRSP', max: 425 },
    'RDSO/T-8998': { type: '10mm CGRSP', max: 445 },
  };

  const getVisualDimSampleSize = (lotOrId) => {
    const lot = (typeof lotOrId === 'object' && lotOrId) ? lotOrId : (lots.find(l => l.id === lotOrId) || { size: 1500, railpadType: '' });
    const type = (lot?.railpadType || activeRailpadType || '').toUpperCase();
    const size = parseInt(lot?.size, 10) || 0;
    if (type.includes('NCR')) {
      // Minimum 1% of the lot size, subject to minimum 10 nos.
      return Math.max(10, Math.ceil(size * 0.01));
    }
    return 25;
  };

  const getHardnessTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { drawingNo: '', railpadType: '' };
    const type = lot.railpadType || activeRailpadType || '';

    if (type.includes('NCRGRSP') || type.includes('NCR')) return { a: { min: 75, max: 85 }, b: { min: 75, max: 85 } };
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
    const rawType = (lot.railpadType || activeRailpadType || '').toLowerCase();

    // 10mm CGRSP: 0.9 to 1.2
    if (rawType.includes('cgrsp') && (rawType.includes('10') || rawType.includes('10mm') || rawType.includes('10.00mm') || rawType.includes('10.0mm'))) {
      return { min: 0.9, max: 1.2 };
    }
    // 6.2mm CGRSP: 0.6 to 0.9
    if (rawType.includes('cgrsp') && (rawType.includes('6.2') || rawType.includes('6.2mm') || rawType.includes('6.20mm'))) {
      return { min: 0.6, max: 0.9 };
    }
    // 6mm NCRGRSP / NCRNRSGP: 0.3 to 0.5
    if ((rawType.includes('ncr') || rawType.includes('ncrgrsp') || rawType.includes('ncrnrsgp')) && (rawType.includes('6') || rawType.includes('6mm') || rawType.includes('6.00mm') || rawType.includes('6.0mm'))) {
      return { min: 0.3, max: 0.5 };
    }
    // 10mm NCRGRSP / NCRNRSGP: 0.5 to 0.8
    if ((rawType.includes('ncr') || rawType.includes('ncrgrsp') || rawType.includes('ncrnrsgp')) && (rawType.includes('10') || rawType.includes('10mm') || rawType.includes('10.00mm') || rawType.includes('10.0mm'))) {
      return { min: 0.5, max: 0.8 };
    }
    // 10mm GRSP: 0.7 to 1.0
    if (rawType.includes('10') || rawType.includes('10mm') || rawType.includes('10.00mm')) {
      return { min: 0.7, max: 1.0 };
    }
    // 6mm GRSP: 0.4 to 0.6
    if (rawType.includes('6') || rawType.includes('6mm') || rawType.includes('6.00mm')) {
      return { min: 0.4, max: 0.6 };
    }
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

  const getSecantTolerance = (lotId) => {
    const lot = lots.find(l => l.id === lotId) || { railpadType: '' };
    const type = (lot.railpadType || activeRailpadType || '').toLowerCase();

    if (type.includes('6.2') && type.includes('cgrsp')) return { min: 100, max: 240 };
    if (type.includes('10mm') && type.includes('cgrsp')) return { min: 100, max: 170 };
    if (type.includes('6mm') && type.includes('ncr')) return { min: 150, max: 250 };
    if (type.includes('10mm') && type.includes('ncr')) return { min: 100, max: 170 };
    if (type.includes('10mm') && type.includes('grsp')) return { min: 100, max: 170 };
    if (type.includes('6mm') && type.includes('grsp')) return { min: 150, max: 250 };

    if (type.includes('6.2')) return { min: 100, max: 240 };
    if (type.includes('10mm')) return { min: 100, max: 170 };
    if (type.includes('cgrsp')) return { min: 100, max: 240 };
    return { min: 150, max: 250 };
  };

  const currentHardnessSpecs = getHardnessTolerance(selectedLot);
  const currentTensileSpecs = getTensileTolerance(selectedLot);
  const currentElongationSpecs = getElongationTolerance(selectedLot);
  const currentModulusSpecs = getModulusTolerance(selectedLot);
  const currentLoadSpecs = getLoadDeflectionTolerance(selectedLot);
  const currentSGSpecs = getSGTolerance(selectedLot);
  const currentAshSpecs = getAshTolerance(selectedLot);
  const currentSecantSpecs = getSecantTolerance(selectedLot);

  // State for Physical Properties (Tab 2)
  const [physicalData, setPhysicalData] = useState(() => padPhysicalData(null));

  // State for Electrical & Chemical (Tab 3)
  const [elecData, setElecData] = useState(() => padElecData(null));

  // State for Specialized Tests (Tab 4)
  const [specType, setSpecType] = useState('CGRSP');
  const [specData, setSpecData] = useState(() => padSpecData(null));

  // State for Periodic Tests
  const [periodicData, setPeriodicData] = useState(() => padPeriodicData(null));

  // Refs and effect for double-sampling weight panel visibility
  // IMPORTANT: These must be declared here (before any early returns) to satisfy React Rules of Hooks.
  const lastInitializedLotRef = React.useRef(null);
  const prevRequiredRef = React.useRef(false);

  useEffect(() => {
    // If data hasn't loaded yet for the selected lot, do nothing
    if (loadedLot !== selectedLot) {
      return;
    }

    const notOk1Inline = weightData.samples1.filter(v => {
      if (v === '') return false;
      const val = parseFloat(v);
      return val > weightData.max;
    }).length;

    const is2ndRequired = notOk1Inline > weightData.ac1 && notOk1Inline < weightData.re1;
    const has2ndData = weightData.samples2.some(v => v !== '');

    // If this lot was not initialized yet, set initial visibility without transitions
    if (lastInitializedLotRef.current !== selectedLot) {
      lastInitializedLotRef.current = selectedLot;
      prevRequiredRef.current = is2ndRequired;
      setShowWeightSecond(is2ndRequired || has2ndData);
      setShowWeightPopup(false);
      return;
    }

    const wasRequired = prevRequiredRef.current;

    // Auto-open if it becomes required
    if (is2ndRequired && !showWeightSecond) {
      setShowWeightSecond(true);
    }

    // Detect transition from required -> not required
    if (wasRequired && !is2ndRequired) {
      if (has2ndData) {
        setShowWeightPopup(true);
      } else {
        setShowWeightSecond(false);
        if (weightData.isSecondActive) {
          setWeightData(prev => ({ ...prev, isSecondActive: false }));
        }
      }
    }

    prevRequiredRef.current = is2ndRequired;
  }, [weightData, showWeightSecond, selectedLot, loadedLot]);


  // --- PERSISTENCE LOGIC (Survive Refresh & Lot Switching) ---
  useEffect(() => {
    if (!selectedLot || !currentCallId) return;
    // ONLY save if we have finished loading the draft for the active lot!
    if (loadedLot !== selectedLot) return;

    const draftData = {
      activeTab,
      visualData,
      weightData,
      physicalData,
      elecData,
      specData,
      periodicData,
      specType,
      reTestActive,
      reOfferActive,
      remarks,
      sealingType,
      steelStampNumber,
      hologramEntries,
      dbDimensionalStatus,
      dbDimensionalNotOk,
      ncrSetsOffered,
      ncrSetsAccepted,
      ncrSetsRejected
    };

    const possibleCallIds = Array.from(new Set([
      currentCallId,
      call?.callNo,
      call?.icNumber,
      call?.requestId,
      call?.id ? String(call.id) : null
    ].filter(Boolean)));

    possibleCallIds.forEach(cid => {
      localStorage.setItem(`railpad_draft_${cid}_${selectedLot}`, JSON.stringify(draftData));
      localStorage.setItem(`railpad_selected_lot_${cid}`, selectedLot);
      localStorage.setItem(`railpad_call_hologram_${cid}`, JSON.stringify(hologramEntries));
      localStorage.setItem(`railpad_call_sealing_type_${cid}`, sealingType);
      if (isNCRGRSP) {
        if (ncrSetsOffered !== undefined && ncrSetsOffered !== '') localStorage.setItem(`railpad_ncr_sets_offered_${cid}`, ncrSetsOffered);
        if (ncrSetsAccepted !== undefined && ncrSetsAccepted !== '') localStorage.setItem(`railpad_ncr_sets_accepted_${cid}`, ncrSetsAccepted);
        if (ncrSetsRejected !== undefined && ncrSetsRejected !== '') localStorage.setItem(`railpad_ncr_sets_rejected_${cid}`, ncrSetsRejected);
      }
    });

    // If data was entered, mark as dirty
    if (visualData.dv || visualData.dd || weightData.samples1.some(s => s !== '') || remarks || sealingType || ncrSetsAccepted) {
      setIsDirty(true);
    }
  }, [selectedLot, currentCallId, activeTab, visualData, weightData, physicalData, elecData, specData, periodicData, specType, reTestActive, reOfferActive, remarks, sealingType, steelStampNumber, hologramEntries, loadedLot, dbDimensionalStatus, dbDimensionalNotOk, ncrSetsOffered, ncrSetsAccepted, ncrSetsRejected, isNCRGRSP]);

  // Drafts are auto-saved in real-time, so no browser reload warning is needed.

  // Initialize Default Lot
  useEffect(() => {
    if (selectedLot) {
      loadLotData(selectedLot);
    }
  }, [selectedLot]);

  // Reset tab to visual if activeTab is not applicable for the active railpad type
  useEffect(() => {
    const isNCR = (activeRailpadType || '').toUpperCase().includes('NCR') || (call?.railPadType || '').toUpperCase().includes('NCR') || (call?.railpadType || '').toUpperCase().includes('NCR');
    if (isNCR) {
      if (activeTab === 'specialized') {
        setActiveTab('visual');
      }
      if (activeSubmoduleTab === 'specialized') {
        setActiveSubmoduleTab('visualDim');
      }
    } else {
      if (activeTab === 'ncrgrsp') {
        setActiveTab('visual');
      }
      if (activeSubmoduleTab === 'ncrgrsp') {
        setActiveSubmoduleTab('visualDim');
      }
    }
  }, [activeRailpadType, activeTab, activeSubmoduleTab, call]);

  useEffect(() => {
    const loadCallDetails = async () => {
      const callId = call?.requestId || call?.id || call?.callNo;
      if (callId) {
        setLoading(true);
        let shouldKeepLoading = false;
        try {
          const [dataResult, savedLotResultsResult] = await Promise.allSettled([
            fetchInspectionCallByCallNo(callId),
            finalInspectionLotResultsService.getByCallNo(callId)
          ]);
          const data = dataResult.status === 'fulfilled' ? dataResult.value : null;
          const savedLotResults = savedLotResultsResult.status === 'fulfilled' ? (savedLotResultsResult.value || []) : [];
          if (data && data.lots) {
            // Map backend lot data to frontend format if needed
            const formattedLots = data.lots.map(l => {
              const cachedStatus = localStorage.getItem(`railpad_status_${currentCallId}_${l.lotNo}`);
              let lotStatus = 'Pending';
              if (cachedStatus) {
                if (cachedStatus === 'ACCEPTED') {
                  lotStatus = 'Passed';
                } else if (cachedStatus === 'RE-OFFERED') {
                  lotStatus = 'RE-OFFERED';
                } else if (cachedStatus === 'REJECTED') {
                  lotStatus = 'Rejected';
                } else if (cachedStatus === 'PENDING') {
                  lotStatus = 'Pending';
                } else {
                  lotStatus = cachedStatus || 'Pending';
                }
              } else {
                const savedResult = savedLotResults.find(r => r.lotNo === l.lotNo);
                if (savedResult) {
                  if (savedResult.overallStatus === 'ACCEPTED') {
                    lotStatus = 'Passed';
                  } else if (savedResult.overallStatus === 'RE-OFFERED') {
                    lotStatus = 'RE-OFFERED';
                  } else if (savedResult.overallStatus === 'REJECTED') {
                    lotStatus = 'Rejected';
                  } else if (savedResult.overallStatus === 'PENDING') {
                    lotStatus = 'Pending';
                  } else {
                    lotStatus = savedResult.overallStatus || 'Pending';
                  }
                }
              }
              return {
                id: l.lotNo,
                size: l.lotSize,
                status: lotStatus,
                drawingNo: data.drawingNo || 'N/A',
                railpadType: data.railPadType || 'GRSP'
              };
            });
            setLots(formattedLots);
            if (formattedLots.length > 0) {
              const savedLotId = localStorage.getItem(`railpad_selected_lot_${currentCallId}`);
              const lotExists = formattedLots.some(l => l.id === savedLotId);
              const targetLot = lotExists ? savedLotId : formattedLots[0].id;
              setSelectedLot(targetLot);
              shouldKeepLoading = true;
              loadLotData(targetLot);
            }
            // Notify parent about the full call details (for the header)
            if (onUpdateCall) {
              onUpdateCall(data);
            }

            if (data && (data.noOfSets !== undefined && data.noOfSets !== null || data.no_of_sets !== undefined && data.no_of_sets !== null)) {
              const backendSets = String(data.noOfSets || data.no_of_sets);
              const possibleCallIds = Array.from(new Set([
                currentCallId,
                call?.callNo,
                call?.icNumber,
                call?.requestId,
                call?.id ? String(call.id) : null
              ].filter(Boolean)));
              
              let savedOff = null;
              for (const cid of possibleCallIds) {
                const o = localStorage.getItem(`railpad_ncr_sets_offered_${cid}`);
                if (o !== null && o !== '' && !savedOff) savedOff = o;
              }
              if (!savedOff && backendSets) {
                setNcrSetsOffered(backendSets);
              }
            }
          }
        } catch (error) {
          console.error("Error loading call details:", error);
        } finally {
          if (!shouldKeepLoading) {
            setLoading(false);
          }
        }
      }
    };
    loadCallDetails();
  }, [call?.requestId, call?.id, call?.callNo, currentCallId]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const loadLotData = async (lotId) => {
    // In a real app, this would be an API call
    console.log(`Loading data for ${lotId}...`);
    setLoading(true);
    setSelectedLot(lotId);
    setIsDirty(false);
    setPendingLotId(null);
    setShowConfirmModal(false);
    setShowWeightSecond(false);
    setShowWeightPopup(false);

    if (currentCallId) {
      localStorage.setItem(`railpad_selected_lot_${currentCallId}`, lotId);
    }
    // Check if there is saved draft in localStorage first!
    const possibleCallIds = Array.from(new Set([
      currentCallId,
      call?.callNo,
      call?.icNumber,
      call?.requestId,
      call?.id ? String(call.id) : null
    ].filter(Boolean)));

    let saved = null;
    let matchingCallId = currentCallId;
    for (const cid of possibleCallIds) {
      const draftKey = `railpad_draft_${cid}_${lotId}`;
      const item = localStorage.getItem(draftKey);
      if (item) {
        saved = item;
        matchingCallId = cid;
        break;
      }
    }

    if (saved) {
      try {
        const draft = JSON.parse(saved);
        const lotForDraft = lots.find(l => l.id === lotId) || { size: 1500, railpadType: '' };
        const calculatedDraftN = getVisualDimSampleSize(lotForDraft);
        if (draft.visualData) {
          setVisualData({
            ...draft.visualData,
            visualN: (lotForDraft.railpadType || activeRailpadType || '').toUpperCase().includes('NCR') ? calculatedDraftN : (draft.visualData.visualN || calculatedDraftN),
            dimN: (lotForDraft.railpadType || activeRailpadType || '').toUpperCase().includes('NCR') ? calculatedDraftN : (draft.visualData.dimN || calculatedDraftN)
          });
        }
        if (draft.weightData) setWeightData(draft.weightData);

        let paddedPhys = padPhysicalData(draft.physicalData);
        setPhysicalData(paddedPhys);

        let paddedElec = padElecData(draft.elecData);
        setElecData(paddedElec);

        let paddedSpec = padSpecData(draft.specData);
        setSpecData(paddedSpec);

        let paddedPeriodic = padPeriodicData(draft.periodicData);
        setPeriodicData(paddedPeriodic);

        if (draft.specType) setSpecType(draft.specType);
        if (draft.reTestActive !== undefined) setReTestActive(draft.reTestActive);
        if (draft.reOfferActive !== undefined) setReOfferActive(draft.reOfferActive);
        let savedCallHolo = null;
        let savedCallSeal = null;
        for (const cid of possibleCallIds) {
          const h = localStorage.getItem(`railpad_call_hologram_${cid}`);
          const s = localStorage.getItem(`railpad_call_sealing_type_${cid}`);
          if (h && !savedCallHolo) savedCallHolo = h;
          if (s && !savedCallSeal) savedCallSeal = s;
        }

        let finalHolo = draft.hologramEntries || [];
        let finalSeal = draft.sealingType || 'RITES_HOLOGRAM';
        if (savedCallHolo !== null) {
          try {
            const parsed = JSON.parse(savedCallHolo);
            if (Array.isArray(parsed)) finalHolo = parsed;
          } catch (e) {}
        }
        if (savedCallSeal !== null && savedCallSeal !== '') finalSeal = savedCallSeal;

        setRemarks(draft.remarks || '');
        setSealingType(finalSeal);
        setSteelStampNumber(draft.steelStampNumber || '');
        setHologramEntries(finalHolo);

        if (isNCRGRSP) {
          let sOff = null;
          let sAcc = null;
          let sRej = null;
          for (const cid of possibleCallIds) {
            const o = localStorage.getItem(`railpad_ncr_sets_offered_${cid}`);
            const a = localStorage.getItem(`railpad_ncr_sets_accepted_${cid}`);
            const r = localStorage.getItem(`railpad_ncr_sets_rejected_${cid}`);
            if (o !== null && o !== '' && !sOff) sOff = o;
            if (a !== null && a !== '' && !sAcc) sAcc = a;
            if (r !== null && r !== '' && !sRej) sRej = r;
          }
          if (!sOff && draft.ncrSetsOffered) sOff = draft.ncrSetsOffered;
          if (!sAcc && draft.ncrSetsAccepted) sAcc = draft.ncrSetsAccepted;
          if (!sRej && draft.ncrSetsRejected) sRej = draft.ncrSetsRejected;

          if (sOff !== undefined && sOff !== null && sOff !== '') setNcrSetsOffered(sOff);
          if (sAcc !== undefined && sAcc !== null && sAcc !== '') setNcrSetsAccepted(sAcc);
          if (sRej !== undefined && sRej !== null && sRej !== '') setNcrSetsRejected(sRej);
        }

        if (draft.dbDimensionalStatus !== undefined) {
          setDbDimensionalStatus(draft.dbDimensionalStatus);
          // Restore the original DB count so RE-OFFERED logic works correctly
          if (draft.dbDimensionalNotOk !== undefined) {
            setDbDimensionalNotOk(draft.dbDimensionalNotOk);
          }
        } else {
          // Fallback just in case
          let visualDbData = null;
          try {
            if (currentCallId && lotId) {
              visualDbData = await finalVisualDimensionalInspectionService.getByCallAndLot(currentCallId, lotId);
            }
          } catch (e) {
            console.error("Error loading visual/dimensional data from backend:", e);
          }
          setDbDimensionalStatus(visualDbData?.dimensionalResult || null);
          setDbDimensionalNotOk(
            visualDbData?.dimensionalNotOk !== null && visualDbData?.dimensionalNotOk !== undefined
              ? String(visualDbData.dimensionalNotOk)
              : null
          );
        }

        // Mark that we have finished loading the draft for this lot
        setLoadedLot(lotId);
        setLoading(false);
        return;
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }

    try {
      // --- NON-DRAFT DB LOAD PATH (OPTIMIZED PARALLEL FETCH) ---
      let visualDbData = null;
      let lotResults = [];
      let hardnessDbData = null;
      let tensileDbData = null;
      let elongationDbData = null;
      let modulusDbData = null;
      let compressionDbData = null;
      let tensionDbData = null;
      let loadDbData = null;
      let electricalDbData = null;
      let sgDbData = null;
      let ashDbData = null;
      let adhesionDbData = null;
      let secantDbData = null;
      let ncrAdhesionDbData = null;
      let ncrBreakingDbData = null;
      let ncrCordDbData = null;
      let weightDbData = null;
      let resilienceDbData = null;
      let ozoneDbData = null;
      let periodicTgaDbData = null;
      let periodicDurabilityDbData = null;
      let periodicAbrasionDbData = null;

      const apiCallNo = call?.callNo || call?.icNumber || currentCallId;

      if (apiCallNo && lotId) {
        const results = await Promise.allSettled([
          finalVisualDimensionalInspectionService.getByCallAndLot(apiCallNo, lotId),
          finalInspectionLotResultsService.getByCallNo(apiCallNo),
          finalHardnessTestService.getByCallAndLot(apiCallNo, lotId),
          finalTensileStrengthService.getByCallAndLot(apiCallNo, lotId),
          finalElongationService.getByCallAndLot(apiCallNo, lotId),
          finalModulusService.getByCallAndLot(apiCallNo, lotId),
          finalCompressionSetService.getByCallAndLot(apiCallNo, lotId),
          finalTensionSetService.getByCallAndLot(apiCallNo, lotId),
          finalLoadTestService.getByCallAndLot(apiCallNo, lotId),
          finalElectricalResistanceService.getByCallAndLot(apiCallNo, lotId),
          finalSpecificGravityService.getByCallAndLot(apiCallNo, lotId),
          finalAshContentService.getByCallAndLot(apiCallNo, lotId),
          finalAdhesionService.getByCallAndLot(apiCallNo, lotId),
          finalSecantStiffnessService.getByCallAndLot(apiCallNo, lotId),
          finalNcrAdhesionService.getByCallAndLot(apiCallNo, lotId),
          finalNcrBreakingLoadService.getByCallAndLot(apiCallNo, lotId),
          finalNcrNylonCordService.getByCallAndLot(apiCallNo, lotId),
          finalWeightTestService.getByCallAndLot(apiCallNo, lotId),
          finalResilienceTestService.getByCallAndLot(apiCallNo, lotId),
          finalOzoneTestService.getByCallAndLot(apiCallNo, lotId),
          finalPeriodicTgaService.getByCallAndLot(apiCallNo, lotId),
          finalPeriodicDurabilityService.getByCallAndLot(apiCallNo, lotId),
          finalPeriodicAbrasionService.getByCallAndLot(apiCallNo, lotId)
        ]);

        visualDbData = results[0].status === 'fulfilled' ? results[0].value : null;
        lotResults = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
        hardnessDbData = results[2].status === 'fulfilled' ? results[2].value : null;
        tensileDbData = results[3].status === 'fulfilled' ? results[3].value : null;
        elongationDbData = results[4].status === 'fulfilled' ? results[4].value : null;
        modulusDbData = results[5].status === 'fulfilled' ? results[5].value : null;
        compressionDbData = results[6].status === 'fulfilled' ? results[6].value : null;
        tensionDbData = results[7].status === 'fulfilled' ? results[7].value : null;
        loadDbData = results[8].status === 'fulfilled' ? results[8].value : null;
        electricalDbData = results[9].status === 'fulfilled' ? results[9].value : null;
        sgDbData = results[10].status === 'fulfilled' ? results[10].value : null;
        ashDbData = results[11].status === 'fulfilled' ? results[11].value : null;
        adhesionDbData = results[12].status === 'fulfilled' ? results[12].value : null;
        secantDbData = results[13].status === 'fulfilled' ? results[13].value : null;
        ncrAdhesionDbData = results[14].status === 'fulfilled' ? results[14].value : null;
        ncrBreakingDbData = results[15].status === 'fulfilled' ? results[15].value : null;
        ncrCordDbData = results[16].status === 'fulfilled' ? results[16].value : null;
        weightDbData = results[17].status === 'fulfilled' ? results[17].value : null;
        resilienceDbData = results[18].status === 'fulfilled' ? results[18].value : null;
        ozoneDbData = results[19].status === 'fulfilled' ? results[19].value : null;
        periodicTgaDbData = results[20].status === 'fulfilled' ? results[20].value : null;
        periodicDurabilityDbData = results[21].status === 'fulfilled' ? results[21].value : null;
        periodicAbrasionDbData = results[22].status === 'fulfilled' ? results[22].value : null;
      }

      const currentLotResult = lotResults.find(r => r.lotNo === lotId);
      let finalRemarks = '';
      let finalSteelStampNumber = '';
      let finalSpecType = 'CGRSP';
      let finalReTestActive = false;
      let finalReOfferActive = false;

      // Check Call-wide Hologram / Sealing entries first
      const callHoloKey = `railpad_call_hologram_${currentCallId}`;
      const callSealKey = `railpad_call_sealing_type_${currentCallId}`;
      const savedCallHolo = localStorage.getItem(callHoloKey);
      const savedCallSeal = localStorage.getItem(callSealKey);

      let finalHologramEntries = [];
      let finalSealingType = 'RITES_HOLOGRAM';

      if (savedCallHolo) {
        try {
          const parsed = JSON.parse(savedCallHolo);
          if (Array.isArray(parsed) && parsed.length > 0) finalHologramEntries = parsed;
        } catch (e) {}
      }
      if (savedCallSeal !== null && savedCallSeal !== '') {
        finalSealingType = savedCallSeal;
      } else {
        // If not in localStorage, check if ANY lot in lotResults has hologram from DB
        const lotWithHolo = lotResults.find(r => r.hologram);
        if (lotWithHolo && lotWithHolo.hologram) {
          finalSealingType = 'RITES_HOLOGRAM';
          finalHologramEntries = lotWithHolo.hologram.split(',').map((part, idx) => {
            if (part.includes('-')) {
              const rangeParts = part.split('-');
              return { id: Date.now() + idx, type: 'range', from: rangeParts[0] || '', to: rangeParts[1] || '' };
            } else {
              return { id: Date.now() + idx, type: 'single', value: part || '' };
            }
          });
          localStorage.setItem(callHoloKey, JSON.stringify(finalHologramEntries));
          localStorage.setItem(callSealKey, finalSealingType);
        }
      }

      if (currentLotResult) {
        finalRemarks = currentLotResult.remarks || '';
        finalSpecType = currentLotResult.railpadType || 'CGRSP';
        if (finalHologramEntries.length === 0 && currentLotResult.hologram) {
          finalSealingType = 'RITES_HOLOGRAM';
          finalHologramEntries = currentLotResult.hologram.split(',').map((part, idx) => {
            if (part.includes('-')) {
              const rangeParts = part.split('-');
              return { id: Date.now() + idx, type: 'range', from: rangeParts[0] || '', to: rangeParts[1] || '' };
            } else {
              return { id: Date.now() + idx, type: 'single', value: part || '' };
            }
          });
          localStorage.setItem(callHoloKey, JSON.stringify(finalHologramEntries));
          localStorage.setItem(callSealKey, finalSealingType);
        }
      }

      let finalDbDimensionalStatus = visualDbData ? (visualDbData.dimensionalResult || null) : null;
      setDbDimensionalStatus(finalDbDimensionalStatus);
      // Track the original not-ok count from DB so we know if the user has changed it
      let finalDbDimensionalNotOk = visualDbData && visualDbData.dimensionalNotOk !== null && visualDbData.dimensionalNotOk !== undefined
        ? String(visualDbData.dimensionalNotOk)
        : null;
      setDbDimensionalNotOk(finalDbDimensionalNotOk);

      const lot = lots.find(l => l.id === lotId) || { size: 1500, drawingNo: 'RDSO/T-8528' };
      const calculatedSampleN = getVisualDimSampleSize(lot);

      let baseVisual;
      if (visualDbData) {
        baseVisual = {
          visualN: (lot.railpadType || activeRailpadType || '').toUpperCase().includes('NCR') ? calculatedSampleN : (visualDbData.visualSamples || calculatedSampleN),
          dv: visualDbData.visualNotOk !== null && visualDbData.visualNotOk !== undefined ? String(visualDbData.visualNotOk) : '',
          visualReason: visualDbData.visualReason || '',
          dimN: (lot.railpadType || activeRailpadType || '').toUpperCase().includes('NCR') ? calculatedSampleN : (visualDbData.dimensionalSamples || calculatedSampleN),
          dd: visualDbData.dimensionalNotOk !== null && visualDbData.dimensionalNotOk !== undefined ? String(visualDbData.dimensionalNotOk) : '',
          dimReason: visualDbData.dimensionalReason || ''
        };
      } else {
        baseVisual = {
          dv: '',
          dd: '',
          visualReason: '',
          dimReason: '',
          visualN: calculatedSampleN,
          dimN: calculatedSampleN
        };
      }
      setVisualData(baseVisual);

      const aql = getWeightAQL(lot.size);
      const tolerance = WEIGHT_TOLERANCE[lot.drawingNo] || { max: 445 };

      let baseWeight;
      if (weightDbData) {
        const s1 = Array(weightDbData.n1 || aql.n1).fill('');
        const s2 = Array(weightDbData.n2 || aql.n2).fill('');
        if (weightDbData.samples) {
          weightDbData.samples.forEach(s => {
            if (s.samplingNo === 1 && s.sampleNo >= 1 && s.sampleNo <= s1.length) {
              s1[s.sampleNo - 1] = s.sampleValue !== null && s.sampleValue !== undefined ? String(s.sampleValue) : '';
            } else if (s.samplingNo === 2 && s.sampleNo >= 1 && s.sampleNo <= s2.length) {
              s2[s.sampleNo - 1] = s.sampleValue !== null && s.sampleValue !== undefined ? String(s.sampleValue) : '';
            }
          });
        }
        baseWeight = {
          samples1: s1,
          samples2: s2,
          n1: weightDbData.n1 || aql.n1,
          ac1: weightDbData.ac1 !== null && weightDbData.ac1 !== undefined ? weightDbData.ac1 : aql.ac1,
          re1: weightDbData.re1 !== null && weightDbData.re1 !== undefined ? weightDbData.re1 : aql.re1,
          n2: weightDbData.n2 || aql.n2,
          ac2: weightDbData.ac2 !== null && weightDbData.ac2 !== undefined ? weightDbData.ac2 : aql.ac2,
          re2: weightDbData.re2 !== null && weightDbData.re2 !== undefined ? weightDbData.re2 : aql.re2,
          min: weightDbData.minWeight !== null && weightDbData.minWeight !== undefined ? weightDbData.minWeight : 0,
          max: weightDbData.maxWeight !== null && weightDbData.maxWeight !== undefined ? weightDbData.maxWeight : tolerance.max,
          isSecondActive: weightDbData.isSecondActive || false
        };
      } else {
        baseWeight = {
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
        };
      }
      setWeightData(baseWeight);
      let basePhys = padPhysicalData(null);
      if (hardnessDbData) {
        basePhys.hardness = {
          compoundA: [
            hardnessDbData.sampleA1 || '', hardnessDbData.sampleA2 || '', hardnessDbData.sampleA3 || '', hardnessDbData.sampleA4 || '', hardnessDbData.sampleA5 || '',
            hardnessDbData.marginalA1 || '', hardnessDbData.marginalA2 || '', hardnessDbData.marginalA3 || '', hardnessDbData.marginalA4 || '', hardnessDbData.marginalA5 || '',
            hardnessDbData.marginalA6 || '', hardnessDbData.marginalA7 || '', hardnessDbData.marginalA8 || '', hardnessDbData.marginalA9 || '', hardnessDbData.marginalA10 || ''
          ],
          compoundB: [
            hardnessDbData.sampleB1 || '', hardnessDbData.sampleB2 || '', hardnessDbData.sampleB3 || '', hardnessDbData.sampleB4 || '', hardnessDbData.sampleB5 || '',
            hardnessDbData.marginalB1 || '', hardnessDbData.marginalB2 || '', hardnessDbData.marginalB3 || '', hardnessDbData.marginalB4 || '', hardnessDbData.marginalB5 || '',
            hardnessDbData.marginalB6 || '', hardnessDbData.marginalB7 || '', hardnessDbData.marginalB8 || '', hardnessDbData.marginalB9 || '', hardnessDbData.marginalB10 || ''
          ]
        };
      }
      if (tensileDbData) {
        basePhys.tensile = {
          before: [
            tensileDbData.sampleBefore1 || '', tensileDbData.sampleBefore2 || '', tensileDbData.sampleBefore3 || '', tensileDbData.sampleBefore4 || '', tensileDbData.sampleBefore5 || '',
            tensileDbData.marginalBefore1 || '', tensileDbData.marginalBefore2 || '', tensileDbData.marginalBefore3 || '', tensileDbData.marginalBefore4 || '', tensileDbData.marginalBefore5 || '',
            tensileDbData.marginalBefore6 || '', tensileDbData.marginalBefore7 || '', tensileDbData.marginalBefore8 || '', tensileDbData.marginalBefore9 || '', tensileDbData.marginalBefore10 || ''
          ],
          after: [
            tensileDbData.sampleAfter1 || '', tensileDbData.sampleAfter2 || '', tensileDbData.sampleAfter3 || '', tensileDbData.sampleAfter4 || '', tensileDbData.sampleAfter5 || '',
            tensileDbData.marginalAfter1 || '', tensileDbData.marginalAfter2 || '', tensileDbData.marginalAfter3 || '', tensileDbData.marginalAfter4 || '', tensileDbData.marginalAfter5 || '',
            tensileDbData.marginalAfter6 || '', tensileDbData.marginalAfter7 || '', tensileDbData.marginalAfter8 || '', tensileDbData.marginalAfter9 || '', tensileDbData.marginalAfter10 || ''
          ]
        };
      }
      if (elongationDbData) {
        basePhys.elongation = {
          before: [
            elongationDbData.sampleBefore1 || '', elongationDbData.sampleBefore2 || '', elongationDbData.sampleBefore3 || '', elongationDbData.sampleBefore4 || '', elongationDbData.sampleBefore5 || '',
            elongationDbData.marginalBefore1 || '', elongationDbData.marginalBefore2 || '', elongationDbData.marginalBefore3 || '', elongationDbData.marginalBefore4 || '', elongationDbData.marginalBefore5 || '',
            elongationDbData.marginalBefore6 || '', elongationDbData.marginalBefore7 || '', elongationDbData.marginalBefore8 || '', elongationDbData.marginalBefore9 || '', elongationDbData.marginalBefore10 || ''
          ],
          after: [
            elongationDbData.sampleAfter1 || '', elongationDbData.sampleAfter2 || '', elongationDbData.sampleAfter3 || '', elongationDbData.sampleAfter4 || '', elongationDbData.sampleAfter5 || '',
            elongationDbData.marginalAfter1 || '', elongationDbData.marginalAfter2 || '', elongationDbData.marginalAfter3 || '', elongationDbData.marginalAfter4 || '', elongationDbData.marginalAfter5 || '',
            elongationDbData.marginalAfter6 || '', elongationDbData.marginalAfter7 || '', elongationDbData.marginalAfter8 || '', elongationDbData.marginalAfter9 || '', elongationDbData.marginalAfter10 || ''
          ]
        };
      }
      if (modulusDbData) {
        basePhys.modulus = {
          before: [
            modulusDbData.sampleBefore1 || '', modulusDbData.sampleBefore2 || '', modulusDbData.sampleBefore3 || '',
            modulusDbData.marginalBefore1 || '', modulusDbData.marginalBefore2 || '', modulusDbData.marginalBefore3 || '',
            modulusDbData.marginalBefore4 || '', modulusDbData.marginalBefore5 || '', modulusDbData.marginalBefore6 || ''
          ],
          after: [
            modulusDbData.sampleAfter1 || '', modulusDbData.sampleAfter2 || '', modulusDbData.sampleAfter3 || '',
            modulusDbData.marginalAfter1 || '', modulusDbData.marginalAfter2 || '', modulusDbData.marginalAfter3 || '',
            modulusDbData.marginalAfter4 || '', modulusDbData.marginalAfter5 || '', modulusDbData.marginalAfter6 || ''
          ]
        };
      }
      if (compressionDbData) {
        basePhys.compression = {
          initial: [
            compressionDbData.sampleInitial1 || '', compressionDbData.sampleInitial2 || '', compressionDbData.sampleInitial3 || '',
            compressionDbData.marginalInitial1 || '', compressionDbData.marginalInitial2 || '', compressionDbData.marginalInitial3 || '',
            compressionDbData.marginalInitial4 || '', compressionDbData.marginalInitial5 || '', compressionDbData.marginalInitial6 || ''
          ],
          final: [
            compressionDbData.sampleFinal1 || '', compressionDbData.sampleFinal2 || '', compressionDbData.sampleFinal3 || '',
            compressionDbData.marginalFinal1 || '', compressionDbData.marginalFinal2 || '', compressionDbData.marginalFinal3 || '',
            compressionDbData.marginalFinal4 || '', compressionDbData.marginalFinal5 || '', compressionDbData.marginalFinal6 || ''
          ]
        };
      }
      if (tensionDbData) {
        basePhys.tension = {
          initial: [
            tensionDbData.sampleInitial1 || '', tensionDbData.sampleInitial2 || '', tensionDbData.sampleInitial3 || '',
            tensionDbData.marginalInitial1 || '', tensionDbData.marginalInitial2 || '', tensionDbData.marginalInitial3 || '',
            tensionDbData.marginalInitial4 || '', tensionDbData.marginalInitial5 || '', tensionDbData.marginalInitial6 || ''
          ],
          final: [
            tensionDbData.sampleFinal1 || '', tensionDbData.sampleFinal2 || '', tensionDbData.sampleFinal3 || '',
            tensionDbData.marginalFinal1 || '', tensionDbData.marginalFinal2 || '', tensionDbData.marginalFinal3 || '',
            tensionDbData.marginalFinal4 || '', tensionDbData.marginalFinal5 || '', tensionDbData.marginalFinal6 || ''
          ]
        };
      }
      if (loadDbData) {
        const defaultLoads = padPhysicalData(null).loadTest.loads;
        basePhys.loadTest = {
          loads: [
            (loadDbData.load1 !== undefined && loadDbData.load1 !== null && loadDbData.load1 !== '') ? loadDbData.load1 : (defaultLoads[0] || ''),
            (loadDbData.load2 !== undefined && loadDbData.load2 !== null && loadDbData.load2 !== '') ? loadDbData.load2 : (defaultLoads[1] || ''),
            (loadDbData.load3 !== undefined && loadDbData.load3 !== null && loadDbData.load3 !== '') ? loadDbData.load3 : (defaultLoads[2] || ''),
            (loadDbData.load4 !== undefined && loadDbData.load4 !== null && loadDbData.load4 !== '') ? loadDbData.load4 : (defaultLoads[3] || ''),
            (loadDbData.load5 !== undefined && loadDbData.load5 !== null && loadDbData.load5 !== '') ? loadDbData.load5 : (defaultLoads[4] || ''),
            (loadDbData.load6 !== undefined && loadDbData.load6 !== null && loadDbData.load6 !== '') ? loadDbData.load6 : (defaultLoads[5] || ''),
            (loadDbData.load7 !== undefined && loadDbData.load7 !== null && loadDbData.load7 !== '') ? loadDbData.load7 : (defaultLoads[6] || ''),
            (loadDbData.load8 !== undefined && loadDbData.load8 !== null && loadDbData.load8 !== '') ? loadDbData.load8 : (defaultLoads[7] || '')
          ],
          pad1: [
            { left: loadDbData.pad1L1 || '', right: loadDbData.pad1R1 || '' },
            { left: loadDbData.pad1L2 || '', right: loadDbData.pad1R2 || '' },
            { left: loadDbData.pad1L3 || '', right: loadDbData.pad1R3 || '' },
            { left: loadDbData.pad1L4 || '', right: loadDbData.pad1R4 || '' },
            { left: loadDbData.pad1L5 || '', right: loadDbData.pad1R5 || '' },
            { left: loadDbData.pad1L6 || '', right: loadDbData.pad1R6 || '' },
            { left: loadDbData.pad1L7 || '', right: loadDbData.pad1R7 || '' },
            { left: loadDbData.pad1L8 || '', right: loadDbData.pad1R8 || '' }
          ],
          pad2: [
            { left: loadDbData.pad2L1 || '', right: loadDbData.pad2R1 || '' },
            { left: loadDbData.pad2L2 || '', right: loadDbData.pad2R2 || '' },
            { left: loadDbData.pad2L3 || '', right: loadDbData.pad2R3 || '' },
            { left: loadDbData.pad2L4 || '', right: loadDbData.pad2R4 || '' },
            { left: loadDbData.pad2L5 || '', right: loadDbData.pad2R5 || '' },
            { left: loadDbData.pad2L6 || '', right: loadDbData.pad2R6 || '' },
            { left: loadDbData.pad2L7 || '', right: loadDbData.pad2R7 || '' },
            { left: loadDbData.pad2L8 || '', right: loadDbData.pad2R8 || '' }
          ],        mPad1: [
            { left: loadDbData.mpad1L1 || '', right: loadDbData.mpad1R1 || '' },
            { left: loadDbData.mpad1L2 || '', right: loadDbData.mpad1R2 || '' },
            { left: loadDbData.mpad1L3 || '', right: loadDbData.mpad1R3 || '' },
            { left: loadDbData.mpad1L4 || '', right: loadDbData.mpad1R4 || '' },
            { left: loadDbData.mpad1L5 || '', right: loadDbData.mpad1R5 || '' },
            { left: loadDbData.mpad1L6 || '', right: loadDbData.mpad1R6 || '' },
            { left: loadDbData.mpad1L7 || '', right: loadDbData.mpad1R7 || '' },
            { left: loadDbData.mpad1L8 || '', right: loadDbData.mpad1R8 || '' }
          ],
          mPad2: [
            { left: loadDbData.mpad2L1 || '', right: loadDbData.mpad2R1 || '' },
            { left: loadDbData.mpad2L2 || '', right: loadDbData.mpad2R2 || '' },
            { left: loadDbData.mpad2L3 || '', right: loadDbData.mpad2R3 || '' },
            { left: loadDbData.mpad2L4 || '', right: loadDbData.mpad2R4 || '' },
            { left: loadDbData.mpad2L5 || '', right: loadDbData.mpad2R5 || '' },
            { left: loadDbData.mpad2L6 || '', right: loadDbData.mpad2R6 || '' },
            { left: loadDbData.mpad2L7 || '', right: loadDbData.mpad2R7 || '' },
            { left: loadDbData.mpad2L8 || '', right: loadDbData.mpad2R8 || '' }
          ],
          mPad3: [
            { left: loadDbData.mpad3L1 || '', right: loadDbData.mpad3R1 || '' },
            { left: loadDbData.mpad3L2 || '', right: loadDbData.mpad3R2 || '' },
            { left: loadDbData.mpad3L3 || '', right: loadDbData.mpad3R3 || '' },
            { left: loadDbData.mpad3L4 || '', right: loadDbData.mpad3R4 || '' },
            { left: loadDbData.mpad3L5 || '', right: loadDbData.mpad3R5 || '' },
            { left: loadDbData.mpad3L6 || '', right: loadDbData.mpad3R6 || '' },
            { left: loadDbData.mpad3L7 || '', right: loadDbData.mpad3R7 || '' },
            { left: loadDbData.mpad3L8 || '', right: loadDbData.mpad3R8 || '' }
          ],
          mPad4: [
            { left: loadDbData.mpad4L1 || '', right: loadDbData.mpad4R1 || '' },
            { left: loadDbData.mpad4L2 || '', right: loadDbData.mpad4R2 || '' },
            { left: loadDbData.mpad4L3 || '', right: loadDbData.mpad4R3 || '' },
            { left: loadDbData.mpad4L4 || '', right: loadDbData.mpad4R4 || '' },
            { left: loadDbData.mpad4L5 || '', right: loadDbData.mpad4R5 || '' },
            { left: loadDbData.mpad4L6 || '', right: loadDbData.mpad4R6 || '' },
            { left: loadDbData.mpad4L7 || '', right: loadDbData.mpad4R7 || '' },
            { left: loadDbData.mpad4L8 || '', right: loadDbData.mpad4R8 || '' }
          ]
        };
      }
      if (resilienceDbData) {
        basePhys.resilience = [
          { i1: resilienceDbData.s1Impact1 || '', i2: resilienceDbData.s1Impact2 || '', i3: resilienceDbData.s1Impact3 || '', i4: resilienceDbData.s1Impact4 || '', i5: resilienceDbData.s1Impact5 || '', i6: resilienceDbData.s1Impact6 || '' },
          { i1: resilienceDbData.s2Impact1 || '', i2: resilienceDbData.s2Impact2 || '', i3: resilienceDbData.s2Impact3 || '', i4: resilienceDbData.s2Impact4 || '', i5: resilienceDbData.s2Impact5 || '', i6: resilienceDbData.s2Impact6 || '' },
          { i1: resilienceDbData.s3Impact1 || '', i2: resilienceDbData.s3Impact2 || '', i3: resilienceDbData.s3Impact3 || '', i4: resilienceDbData.s3Impact4 || '', i5: resilienceDbData.s3Impact5 || '', i6: resilienceDbData.s3Impact6 || '' }
        ];
      }
      basePhys = padPhysicalData(basePhys);
      setPhysicalData(basePhys);
      let baseElec = padElecData(null);
      if (electricalDbData) {
        baseElec.resistance = [
          { bF: electricalDbData.s1BeforeForward || '', bR: electricalDbData.s1BeforeReverse || '', aF: electricalDbData.s1AfterForward || '', aR: electricalDbData.s1AfterReverse || '' },
          { bF: electricalDbData.s2BeforeForward || '', bR: electricalDbData.s2BeforeReverse || '', aF: electricalDbData.s2AfterForward || '', aR: electricalDbData.s2AfterReverse || '' },
          { bF: electricalDbData.s3BeforeForward || '', bR: electricalDbData.s3BeforeReverse || '', aF: electricalDbData.s3AfterForward || '', aR: electricalDbData.s3AfterReverse || '' },
          { bF: electricalDbData.s4BeforeForward || '', bR: electricalDbData.s4BeforeReverse || '', aF: electricalDbData.s4AfterForward || '', aR: electricalDbData.s4AfterReverse || '' },
          { bF: electricalDbData.s5BeforeForward || '', bR: electricalDbData.s5BeforeReverse || '', aF: electricalDbData.s5AfterForward || '', aR: electricalDbData.s5AfterReverse || '' },
          { bF: electricalDbData.s6BeforeForward || '', bR: electricalDbData.s6BeforeReverse || '', aF: electricalDbData.s6AfterForward || '', aR: electricalDbData.s6AfterReverse || '' }
        ];
      }
      if (sgDbData) {
        baseElec.sg = {
          compoundA: [
            { air: sgDbData.s1AAir || '', water: sgDbData.s1AWater || '' },
            { air: sgDbData.s2AAir || '', water: sgDbData.s2AWater || '' },
            { air: sgDbData.s3AAir || '', water: sgDbData.s3AWater || '' },
            { air: sgDbData.m1AAir || '', water: sgDbData.m1AWater || '' },
            { air: sgDbData.m2AAir || '', water: sgDbData.m2AWater || '' },
            { air: sgDbData.m3AAir || '', water: sgDbData.m3AWater || '' },
            { air: sgDbData.m4AAir || '', water: sgDbData.m4AWater || '' },
            { air: sgDbData.m5AAir || '', water: sgDbData.m5AWater || '' },
            { air: sgDbData.m6AAir || '', water: sgDbData.m6AWater || '' }
          ],
          compoundB: [
            { air: sgDbData.s1BAir || '', water: sgDbData.s1BWater || '' },
            { air: sgDbData.s2BAir || '', water: sgDbData.s2BWater || '' },
            { air: sgDbData.s3BAir || '', water: sgDbData.s3BWater || '' },
            { air: sgDbData.m1BAir || '', water: sgDbData.m1BWater || '' },
            { air: sgDbData.m2BAir || '', water: sgDbData.m2BWater || '' },
            { air: sgDbData.m3BAir || '', water: sgDbData.m3BWater || '' },
            { air: sgDbData.m4BAir || '', water: sgDbData.m4BWater || '' },
            { air: sgDbData.m5BAir || '', water: sgDbData.m5BWater || '' },
            { air: sgDbData.m6BAir || '', water: sgDbData.m6BWater || '' }
          ]
        };
      }
      if (ashDbData) {
        baseElec.ash = {
          compoundA: [
            { crucible: ashDbData.s1ACrucible || '', sample: ashDbData.s1ASample || '', ash: ashDbData.s1AAsh || '' },
            { crucible: ashDbData.s2ACrucible || '', sample: ashDbData.s2ASample || '', ash: ashDbData.s2AAsh || '' },
            { crucible: ashDbData.s3ACrucible || '', sample: ashDbData.s3ASample || '', ash: ashDbData.s3AAsh || '' },
            { crucible: ashDbData.m1ACrucible || '', sample: ashDbData.m1ASample || '', ash: ashDbData.m1AAsh || '' },
            { crucible: ashDbData.m2ACrucible || '', sample: ashDbData.m2ASample || '', ash: ashDbData.m2AAsh || '' },
            { crucible: ashDbData.m3ACrucible || '', sample: ashDbData.m3ASample || '', ash: ashDbData.m3AAsh || '' },
            { crucible: ashDbData.m4ACrucible || '', sample: ashDbData.m4ASample || '', ash: ashDbData.m4AAsh || '' },
            { crucible: ashDbData.m5ACrucible || '', sample: ashDbData.m5ASample || '', ash: ashDbData.m5AAsh || '' },
            { crucible: ashDbData.m6ACrucible || '', sample: ashDbData.m6ASample || '', ash: ashDbData.m6AAsh || '' }
          ],
          compoundB: [
            { crucible: ashDbData.s1BCrucible || '', sample: ashDbData.s1BSample || '', ash: ashDbData.s1BAsh || '' },
            { crucible: ashDbData.s2BCrucible || '', sample: ashDbData.s2BSample || '', ash: ashDbData.s2BAsh || '' },
            { crucible: ashDbData.s3BCrucible || '', sample: ashDbData.s3BSample || '', ash: ashDbData.s3BAsh || '' },
            { crucible: ashDbData.m1BCrucible || '', sample: ashDbData.m1BSample || '', ash: ashDbData.m1BAsh || '' },
            { crucible: ashDbData.m2BCrucible || '', sample: ashDbData.m2BSample || '', ash: ashDbData.m2BAsh || '' },
            { crucible: ashDbData.m3BCrucible || '', sample: ashDbData.m3BSample || '', ash: ashDbData.m3BAsh || '' },
            { crucible: ashDbData.m4BCrucible || '', sample: ashDbData.m4BSample || '', ash: ashDbData.m4BAsh || '' },
            { crucible: ashDbData.m5BCrucible || '', sample: ashDbData.m5BSample || '', ash: ashDbData.m5BAsh || '' },
            { crucible: ashDbData.m6BCrucible || '', sample: ashDbData.m6BSample || '', ash: ashDbData.m6BAsh || '' }
          ]
        };
      }
      if (ozoneDbData) {
        baseElec.ozone = [
          { initial: ozoneDbData.initialLength || '40', stretched: ozoneDbData.stretchedLength || '52', obs: ozoneDbData.observation || '' }
        ];
      }
      baseElec = padElecData(baseElec);
      setElecData(baseElec);

      let baseSpec = padSpecData(null);
      if (adhesionDbData) {
        baseSpec.adhesion = [
          adhesionDbData.sample1 || '', adhesionDbData.sample2 || '',
          adhesionDbData.marginal1 || '', adhesionDbData.marginal2 || '', adhesionDbData.marginal3 || '', adhesionDbData.marginal4 || ''
        ];
      }
      if (secantDbData) {
        baseSpec.secant = [
          {
            s20: { a: secantDbData.s1S20A || '', b: secantDbData.s1S20B || '', c: secantDbData.s1S20C || '', d: secantDbData.s1S20D || '' },
            s90: { a: secantDbData.s1S90A || '', b: secantDbData.s1S90B || '', c: secantDbData.s1S90C || '', d: secantDbData.s1S90D || '' }
          },
          {
            s20: { a: secantDbData.s2S20A || '', b: secantDbData.s2S20B || '', c: secantDbData.s2S20C || '', d: secantDbData.s2S20D || '' },
            s90: { a: secantDbData.s2S90A || '', b: secantDbData.s2S90B || '', c: secantDbData.s2S90C || '', d: secantDbData.s2S90D || '' }
          },
          {
            s20: { a: secantDbData.m1S20A || '', b: secantDbData.m1S20B || '', c: secantDbData.m1S20C || '', d: secantDbData.m1S20D || '' },
            s90: { a: secantDbData.m1S90A || '', b: secantDbData.m1S90B || '', c: secantDbData.m1S90C || '', d: secantDbData.m1S90D || '' }
          },
          {
            s20: { a: secantDbData.m2S20A || '', b: secantDbData.m2S20B || '', c: secantDbData.m2S20C || '', d: secantDbData.m2S20D || '' },
            s90: { a: secantDbData.m2S90A || '', b: secantDbData.m2S90B || '', c: secantDbData.m2S90C || '', d: secantDbData.m2S90D || '' }
          },
          {
            s20: { a: secantDbData.m3S20A || '', b: secantDbData.m3S20B || '', c: secantDbData.m3S20C || '', d: secantDbData.m3S20D || '' },
            s90: { a: secantDbData.m3S90A || '', b: secantDbData.m3S90B || '', c: secantDbData.m3S90C || '', d: secantDbData.m3S90D || '' }
          },
          {
            s20: { a: secantDbData.m4S20A || '', b: secantDbData.m4S20B || '', c: secantDbData.m4S20C || '', d: secantDbData.m4S20D || '' },
            s90: { a: secantDbData.m4S90A || '', b: secantDbData.m4S90B || '', c: secantDbData.m4S90C || '', d: secantDbData.m4S90D || '' }
          }
        ];
      }
      if (ncrAdhesionDbData) {
        baseSpec.ncrgrsp = baseSpec.ncrgrsp || {};
        baseSpec.ncrgrsp.adhesion = [
          { peel: ncrAdhesionDbData.s1Peel || '', hpull: ncrAdhesionDbData.s1Hpull || '' },
          { peel: ncrAdhesionDbData.s2Peel || '', hpull: ncrAdhesionDbData.s2Hpull || '' },
          { peel: ncrAdhesionDbData.m1Peel || '', hpull: ncrAdhesionDbData.m1Hpull || '' },
          { peel: ncrAdhesionDbData.m2Peel || '', hpull: ncrAdhesionDbData.m2Hpull || '' },
          { peel: ncrAdhesionDbData.m3Peel || '', hpull: ncrAdhesionDbData.m3Hpull || '' },
          { peel: ncrAdhesionDbData.m4Peel || '', hpull: ncrAdhesionDbData.m4Hpull || '' }
        ];
      }
      if (ncrBreakingDbData) {
        baseSpec.ncrgrsp = baseSpec.ncrgrsp || {};
        baseSpec.ncrgrsp.breaking = [
          ncrBreakingDbData.sample1 || '', ncrBreakingDbData.sample2 || '', ncrBreakingDbData.sample3 || '', ncrBreakingDbData.sample4 || '', ncrBreakingDbData.sample5 || '',
          ncrBreakingDbData.marginal1 || '', ncrBreakingDbData.marginal2 || '', ncrBreakingDbData.marginal3 || '', ncrBreakingDbData.marginal4 || '', ncrBreakingDbData.marginal5 || '',
          ncrBreakingDbData.marginal6 || '', ncrBreakingDbData.marginal7 || '', ncrBreakingDbData.marginal8 || '', ncrBreakingDbData.marginal9 || '', ncrBreakingDbData.marginal10 || ''
        ];
      }
      if (ncrCordDbData) {
        baseSpec.ncrgrsp = baseSpec.ncrgrsp || {};
        baseSpec.ncrgrsp.nylonCord = [
          { denier: ncrCordDbData.s1Denier || '', epi: ncrCordDbData.s1Epi || '', thickness: ncrCordDbData.s1Thickness || '', loadAtBreak: ncrCordDbData.s1LoadAtBreak || '', elongation: ncrCordDbData.s1Elongation || '', twists: ncrCordDbData.s1Twists || '' },
          { denier: ncrCordDbData.s2Denier || '', epi: ncrCordDbData.s2Epi || '', thickness: ncrCordDbData.s2Thickness || '', loadAtBreak: ncrCordDbData.s2LoadAtBreak || '', elongation: ncrCordDbData.s2Elongation || '', twists: ncrCordDbData.s2Twists || '' },
          { denier: ncrCordDbData.s3Denier || '', epi: ncrCordDbData.s3Epi || '', thickness: ncrCordDbData.s3Thickness || '', loadAtBreak: ncrCordDbData.s3LoadAtBreak || '', elongation: ncrCordDbData.s3Elongation || '', twists: ncrCordDbData.s3Twists || '' },
          { denier: ncrCordDbData.m1Denier || '', epi: ncrCordDbData.m1Epi || '', thickness: ncrCordDbData.m1Thickness || '', loadAtBreak: ncrCordDbData.m1LoadAtBreak || '', elongation: ncrCordDbData.m1Elongation || '', twists: ncrCordDbData.m1Twists || '' },
          { denier: ncrCordDbData.m2Denier || '', epi: ncrCordDbData.m2Epi || '', thickness: ncrCordDbData.m2Thickness || '', loadAtBreak: ncrCordDbData.m2LoadAtBreak || '', elongation: ncrCordDbData.m2Elongation || '', twists: ncrCordDbData.m2Twists || '' },
          { denier: ncrCordDbData.m3Denier || '', epi: ncrCordDbData.m3Epi || '', thickness: ncrCordDbData.m3Thickness || '', loadAtBreak: ncrCordDbData.m3LoadAtBreak || '', elongation: ncrCordDbData.m3Elongation || '', twists: ncrCordDbData.m3Twists || '' },
          { denier: ncrCordDbData.m4Denier || '', epi: ncrCordDbData.m4Epi || '', thickness: ncrCordDbData.m4Thickness || '', loadAtBreak: ncrCordDbData.m4LoadAtBreak || '', elongation: ncrCordDbData.m4Elongation || '', twists: ncrCordDbData.m4Twists || '' },
          { denier: ncrCordDbData.m5Denier || '', epi: ncrCordDbData.m5Epi || '', thickness: ncrCordDbData.m5Thickness || '', loadAtBreak: ncrCordDbData.m5LoadAtBreak || '', elongation: ncrCordDbData.m5Elongation || '', twists: ncrCordDbData.m5Twists || '' },
          { denier: ncrCordDbData.m6Denier || '', epi: ncrCordDbData.m6Epi || '', thickness: ncrCordDbData.m6Thickness || '', loadAtBreak: ncrCordDbData.m6LoadAtBreak || '', elongation: ncrCordDbData.m6Elongation || '', twists: ncrCordDbData.m6Twists || '' }
        ];
      }
      baseSpec = padSpecData(baseSpec);
      setSpecData(baseSpec);

      let basePeriodic = padPeriodicData(null);
      if (periodicTgaDbData) {
        basePeriodic.tga.dateOfLastTest = periodicTgaDbData.dateOfLastTest || '';
        basePeriodic.tga.qtyProduced = periodicTgaDbData.qtyProducedSinceLastTest !== null && periodicTgaDbData.qtyProducedSinceLastTest !== undefined ? String(periodicTgaDbData.qtyProducedSinceLastTest) : '';
        const rawTga = [
          { lotNo: periodicTgaDbData.s1LotNo || '', sampleNo: periodicTgaDbData.s1SampleNo || '', weight: periodicTgaDbData.s1SampleWt || '', tempRange: periodicTgaDbData.s1TempRange || '', polymer: periodicTgaDbData.s1PolymerContent || '' },
          { lotNo: periodicTgaDbData.s2LotNo || '', sampleNo: periodicTgaDbData.s2SampleNo || '', weight: periodicTgaDbData.s2SampleWt || '', tempRange: periodicTgaDbData.s2TempRange || '', polymer: periodicTgaDbData.s2PolymerContent || '' },
          { lotNo: periodicTgaDbData.s3LotNo || '', sampleNo: periodicTgaDbData.s3SampleNo || '', weight: periodicTgaDbData.s3SampleWt || '', tempRange: periodicTgaDbData.s3TempRange || '', polymer: periodicTgaDbData.s3PolymerContent || '' },
          { lotNo: periodicTgaDbData.s4LotNo || '', sampleNo: periodicTgaDbData.s4SampleNo || '', weight: periodicTgaDbData.s4SampleWt || '', tempRange: periodicTgaDbData.s4TempRange || '', polymer: periodicTgaDbData.s4PolymerContent || '' },
          { lotNo: periodicTgaDbData.s5LotNo || '', sampleNo: periodicTgaDbData.s5SampleNo || '', weight: periodicTgaDbData.s5SampleWt || '', tempRange: periodicTgaDbData.s5TempRange || '', polymer: periodicTgaDbData.s5PolymerContent || '' }
        ];
        const tgaSamples = rawTga.filter((s, idx) => idx === 0 || s.lotNo || s.sampleNo || s.weight || s.tempRange || s.polymer);
        basePeriodic.tga.samples = tgaSamples.length > 0 ? tgaSamples : [{ lotNo: '', sampleNo: '', weight: '', tempRange: '', polymer: '' }];
      }
      if (periodicDurabilityDbData) {
        basePeriodic.durability.dateOfLastTest = periodicDurabilityDbData.dateOfLastTest || '';
        basePeriodic.durability.qtyProduced = periodicDurabilityDbData.qtyProducedSinceLastTest !== null && periodicDurabilityDbData.qtyProducedSinceLastTest !== undefined ? String(periodicDurabilityDbData.qtyProducedSinceLastTest) : '';
        const rawDur = [
          { lotNo: periodicDurabilityDbData.s1LotNo || '', initialThick: periodicDurabilityDbData.s1InitialThickness || '', finalThick: periodicDurabilityDbData.s1FinalThickness || '', initialLoad: periodicDurabilityDbData.s1InitialLoadComp || '', finalLoad: periodicDurabilityDbData.s1FinalLoadComp || '' },
          { lotNo: periodicDurabilityDbData.s2LotNo || '', initialThick: periodicDurabilityDbData.s2InitialThickness || '', finalThick: periodicDurabilityDbData.s2FinalThickness || '', initialLoad: periodicDurabilityDbData.s2InitialLoadComp || '', finalLoad: periodicDurabilityDbData.s2FinalLoadComp || '' },
          { lotNo: periodicDurabilityDbData.s3LotNo || '', initialThick: periodicDurabilityDbData.s3InitialThickness || '', finalThick: periodicDurabilityDbData.s3FinalThickness || '', initialLoad: periodicDurabilityDbData.s3InitialLoadComp || '', finalLoad: periodicDurabilityDbData.s3FinalLoadComp || '' },
          { lotNo: periodicDurabilityDbData.s4LotNo || '', initialThick: periodicDurabilityDbData.s4InitialThickness || '', finalThick: periodicDurabilityDbData.s4FinalThickness || '', initialLoad: periodicDurabilityDbData.s4InitialLoadComp || '', finalLoad: periodicDurabilityDbData.s4FinalLoadComp || '' },
          { lotNo: periodicDurabilityDbData.s5LotNo || '', initialThick: periodicDurabilityDbData.s5InitialThickness || '', finalThick: periodicDurabilityDbData.s5FinalThickness || '', initialLoad: periodicDurabilityDbData.s5InitialLoadComp || '', finalLoad: periodicDurabilityDbData.s5FinalLoadComp || '' }
        ];
        const durSamples = rawDur.filter((s, idx) => idx === 0 || s.lotNo || s.initialThick || s.finalThick || s.initialLoad || s.finalLoad);
        basePeriodic.durability.samples = durSamples.length > 0 ? durSamples : [{ lotNo: '', initialThick: '', finalThick: '', initialLoad: '', finalLoad: '' }];
      }
      if (periodicAbrasionDbData) {
        basePeriodic.abrasion.dateOfLastTest = periodicAbrasionDbData.dateOfLastTest || '';
        basePeriodic.abrasion.qtyProduced = periodicAbrasionDbData.qtyProducedSinceLastTest !== null && periodicAbrasionDbData.qtyProducedSinceLastTest !== undefined ? String(periodicAbrasionDbData.qtyProducedSinceLastTest) : '';
        const rawAbr = [
          { lotNo: periodicAbrasionDbData.s1LotNo || '', sampleNo: periodicAbrasionDbData.s1SampleNo || '', initialMass: periodicAbrasionDbData.s1InitialMass || '', finalMass: periodicAbrasionDbData.s1FinalMass || '', relativeLoss: periodicAbrasionDbData.s1RelativeLoss || '' },
          { lotNo: periodicAbrasionDbData.s2LotNo || '', sampleNo: periodicAbrasionDbData.s2SampleNo || '', initialMass: periodicAbrasionDbData.s2InitialMass || '', finalMass: periodicAbrasionDbData.s2FinalMass || '', relativeLoss: periodicAbrasionDbData.s2RelativeLoss || '' },
          { lotNo: periodicAbrasionDbData.s3LotNo || '', sampleNo: periodicAbrasionDbData.s3SampleNo || '', initialMass: periodicAbrasionDbData.s3InitialMass || '', finalMass: periodicAbrasionDbData.s3FinalMass || '', relativeLoss: periodicAbrasionDbData.s3RelativeLoss || '' },
          { lotNo: periodicAbrasionDbData.s4LotNo || '', sampleNo: periodicAbrasionDbData.s4SampleNo || '', initialMass: periodicAbrasionDbData.s4InitialMass || '', finalMass: periodicAbrasionDbData.s4FinalMass || '', relativeLoss: periodicAbrasionDbData.s4RelativeLoss || '' },
          { lotNo: periodicAbrasionDbData.s5LotNo || '', sampleNo: periodicAbrasionDbData.s5SampleNo || '', initialMass: periodicAbrasionDbData.s5InitialMass || '', finalMass: periodicAbrasionDbData.s5FinalMass || '', relativeLoss: periodicAbrasionDbData.s5RelativeLoss || '' }
        ];
        const abrSamples = rawAbr.filter((s, idx) => idx === 0 || s.lotNo || s.sampleNo || s.initialMass || s.finalMass || s.relativeLoss);
        basePeriodic.abrasion.samples = abrSamples.length > 0 ? abrSamples : [{ lotNo: '', sampleNo: '', initialMass: '', finalMass: '', relativeLoss: '' }];
      }
      setPeriodicData(basePeriodic);
      setRemarks(finalRemarks);
      setSealingType(finalSealingType);
      setSteelStampNumber(finalSteelStampNumber);
      setHologramEntries(finalHologramEntries);
      setSpecType(finalSpecType);
      setReTestActive(finalReTestActive);
      setReOfferActive(finalReOfferActive);

      let currentNcrOff = ncrSetsOffered;
      let currentNcrAcc = ncrSetsAccepted;
      let currentNcrRej = ncrSetsRejected;

      if (isNCRGRSP) {
        for (const cid of possibleCallIds) {
          const o = localStorage.getItem(`railpad_ncr_sets_offered_${cid}`);
          const a = localStorage.getItem(`railpad_ncr_sets_accepted_${cid}`);
          const r = localStorage.getItem(`railpad_ncr_sets_rejected_${cid}`);
          if (o !== null && o !== '' && !currentNcrOff) currentNcrOff = o;
          if (a !== null && a !== '' && !currentNcrAcc) currentNcrAcc = a;
          if (r !== null && r !== '' && !currentNcrRej) currentNcrRej = r;
        }
        if (currentNcrOff !== null && currentNcrOff !== undefined && currentNcrOff !== '') setNcrSetsOffered(currentNcrOff);
        if (currentNcrAcc !== null && currentNcrAcc !== undefined && currentNcrAcc !== '') setNcrSetsAccepted(currentNcrAcc);
        if (currentNcrRej !== null && currentNcrRej !== undefined && currentNcrRej !== '') setNcrSetsRejected(currentNcrRej);
      }

      // Explicitly persist the freshly fetched database data as initial draft
      const initialDraftData = {
        activeTab: 'visual',
        visualData: baseVisual,
        weightData: baseWeight,
        physicalData: basePhys,
        elecData: baseElec,
        specData: baseSpec,
        specType: finalSpecType,
        reTestActive: finalReTestActive,
        reOfferActive: finalReOfferActive,
        remarks: finalRemarks,
        sealingType: finalSealingType,
        steelStampNumber: finalSteelStampNumber,
        hologramEntries: finalHologramEntries,
        dbDimensionalStatus: finalDbDimensionalStatus,
        ncrSetsOffered: currentNcrOff || '',
        ncrSetsAccepted: currentNcrAcc || '',
        ncrSetsRejected: currentNcrRej || ''
      };
      localStorage.setItem(draftKey, JSON.stringify(initialDraftData));
    } catch (err) {
      console.error("Error loading lot data:", err);
    } finally {
      // Set the loaded lot ref so we know loading is complete!
      setLoadedLot(lotId);
      setLoading(false);
    }
  }

  const handleLotClick = (lotId) => {
    if (lotId === selectedLot) return;
    setLoading(true);
    setSelectedLot(lotId);
  };

  const handleDiscardChanges = () => {
    if (selectedLot && currentCallId) {
      const draftKey = `railpad_draft_${currentCallId}_${selectedLot}`;
      localStorage.removeItem(draftKey);
      localStorage.removeItem(`railpad_status_${currentCallId}_${selectedLot}`);
    }
    setLoading(true);
    setSelectedLot(pendingLotId);
  };

  const buildOtherLotSavePromises = (oLot, draft) => {
    if (!draft) return [];
    const oLotId = oLot.id;
    const oRailpadType = oLot.railpadType || call?.railpadType || '';
    const oIsNCRGRSP = /NCR\s*GRSP/i.test(oRailpadType);
    const oOfferedQty = oLot.size || 0;

    const tVisual = draft.visualData || { visualN: 25, dimN: 25, dv: '', dd: '', visualReason: '', dimReason: '' };
    const tWeight = draft.weightData || { samples1: [], samples2: [], n1: 10, n2: 10, min: 0, max: 0, isSecondActive: false };
    const tPhys = padPhysicalData(draft.physicalData);
    const tElec = padElecData(draft.elecData);
    const tSpec = padSpecData(draft.specData);
    const tPeriodic = padPeriodicData(draft.periodicData);
    const tRemarks = draft.remarks || remarks || '';
    const tSealing = sealingType || draft.sealingType || 'RITES_HOLOGRAM';
    const tHolo = (hologramEntries && hologramEntries.length > 0) ? hologramEntries : (draft.hologramEntries || []);

    let formattedDate = null;
    if (call?.dateOfInspection) {
      if (Array.isArray(call.dateOfInspection) && call.dateOfInspection.length >= 3) {
        const year = call.dateOfInspection[0];
        const month = String(call.dateOfInspection[1]).padStart(2, '0');
        const day = String(call.dateOfInspection[2]).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else {
        try {
          formattedDate = new Date(call.dateOfInspection).toISOString().split('T')[0];
        } catch (e) {
          formattedDate = new Date().toISOString().split('T')[0];
        }
      }
    } else {
      formattedDate = new Date().toISOString().split('T')[0];
    }

    const currentUserObj = getStoredUser();
    const userId = currentUserObj?.userId || 0;

    const dvNum = tVisual.dv !== '' && tVisual.dv !== null && tVisual.dv !== undefined ? parseInt(tVisual.dv, 10) : null;
    const vStatus = dvNum === null ? 'PENDING' : dvNum === 0 ? 'PASS' : 'FAIL';

    const ddNum = tVisual.dd !== '' && tVisual.dd !== null && tVisual.dd !== undefined ? parseInt(tVisual.dd, 10) : null;
    const dStatus = ddNum === null ? 'PENDING' : ddNum === 0 ? 'PASS' : (ddNum <= 1 && draft.dbDimensionalStatus === null) ? 'RE-OFFERED' : 'FAIL';

    let hologramStr = '';
    if (tSealing === 'RITES_HOLOGRAM' && tHolo.length > 0) {
      hologramStr = tHolo.map(h => (h.type === 'range' ? `${h.from}-${h.to}` : h.value)).join(',');
    }

    const lotOverallStatus = (vStatus === 'PASS' && dStatus === 'PASS') ? 'ACCEPTED' : (dStatus === 'RE-OFFERED') ? 'RE-OFFERED' : (vStatus === 'PENDING' || dStatus === 'PENDING') ? 'PENDING' : 'REJECTED';
    const acceptedQty = lotOverallStatus === 'ACCEPTED' ? oOfferedQty : 0;
    const rejectedQty = lotOverallStatus === 'REJECTED' ? oOfferedQty : 0;

    const savePayload = {
      callNo: currentCallId,
      shift: call?.shift || 'A',
      dateOfInspection: formattedDate,
      plantId: call?.plantId || 'N/A',
      rlyPoSrNo: call?.rlyPoSrNo || 'N/A',
      vendorName: call?.vendorName || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      railpadType: oRailpadType,
      lotNo: oLotId,
      offeredQty: (oIsNCRGRSP && ncrSetsOffered !== '') ? parseInt(ncrSetsOffered, 10) : oOfferedQty,
      acceptedQty: (oIsNCRGRSP && ncrSetsAccepted !== '') ? parseInt(ncrSetsAccepted, 10) : acceptedQty,
      rejectedQty: (oIsNCRGRSP && ncrSetsRejected !== '') ? parseInt(ncrSetsRejected, 10) : rejectedQty,
      visualDimensionalStatus: vStatus,
      physicalAgeingPropertiesStatus: 'PASS',
      electricalChemicalStatus: 'PASS',
      dynamicDurabilityTestStatus: 'PASS',
      ncrgrspStatus: oIsNCRGRSP ? 'PASS' : null,
      overallStatus: lotOverallStatus,
      hologram: hologramStr,
      remarks: tRemarks || '',
      userId: userId ? parseInt(userId, 10) : null,
      sectionResults: [
        { sectionKey: 'visual', sectionName: 'Visual Inspection', sampleSize: String(tVisual.visualN || 25), status: vStatus },
        { sectionKey: 'dimensional', sectionName: 'Dimensional Inspection', sampleSize: String(tVisual.dimN || 25), status: dStatus }
      ]
    };

    const currentVisualN = oIsNCRGRSP ? getVisualDimSampleSize(oLot) : (tVisual.visualN || 25);
    const currentDimN = oIsNCRGRSP ? getVisualDimSampleSize(oLot) : (tVisual.dimN || 25);

    const visualDimPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      visualSamples: currentVisualN,
      visualNotOk: tVisual.dv !== '' && tVisual.dv !== null ? parseInt(tVisual.dv, 10) : 0,
      visualReason: tVisual.visualReason || '',
      visualResult: vStatus,
      dimensionalSamples: currentDimN,
      dimensionalNotOk: tVisual.dd !== '' && tVisual.dd !== null ? parseInt(tVisual.dd, 10) : 0,
      dimensionalReason: tVisual.dimReason || '',
      dimensionalResult: dStatus,
      totalRejected: (tVisual.dv !== '' && tVisual.dv !== null ? parseInt(tVisual.dv, 10) : 0) + (tVisual.dd !== '' && tVisual.dd !== null ? parseInt(tVisual.dd, 10) : 0)
    };

    const weightSamplesList = [];
    (tWeight.samples1 || []).forEach((val, index) => {
      if (val !== '' && val !== null && val !== undefined) {
        const parsedVal = parseFloat(val);
        weightSamplesList.push({ samplingNo: 1, sampleNo: index + 1, sampleValue: parsedVal, isRejected: parsedVal > tWeight.max });
      }
    });
    (tWeight.samples2 || []).forEach((val, index) => {
      if (val !== '' && val !== null && val !== undefined) {
        const parsedVal = parseFloat(val);
        weightSamplesList.push({ samplingNo: 2, sampleNo: index + 1, sampleValue: parsedVal, isRejected: parsedVal > tWeight.max });
      }
    });

    const weightTestPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      weightMin: tWeight.min,
      weightMax: tWeight.max,
      weightStatus: 'PASS',
      samples: weightSamplesList
    };

    const hardnessPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      sampleA1: tPhys.hardness.compoundA[0] || '', sampleA2: tPhys.hardness.compoundA[1] || '', sampleA3: tPhys.hardness.compoundA[2] || '', sampleA4: tPhys.hardness.compoundA[3] || '', sampleA5: tPhys.hardness.compoundA[4] || '',
      marginalA1: tPhys.hardness.compoundA[5] || '', marginalA2: tPhys.hardness.compoundA[6] || '', marginalA3: tPhys.hardness.compoundA[7] || '', marginalA4: tPhys.hardness.compoundA[8] || '', marginalA5: tPhys.hardness.compoundA[9] || '',
      sampleB1: tPhys.hardness.compoundB[0] || '', sampleB2: tPhys.hardness.compoundB[1] || '', sampleB3: tPhys.hardness.compoundB[2] || '', sampleB4: tPhys.hardness.compoundB[3] || '', sampleB5: tPhys.hardness.compoundB[4] || '',
      marginalB1: tPhys.hardness.compoundB[5] || '', marginalB2: tPhys.hardness.compoundB[6] || '', marginalB3: tPhys.hardness.compoundB[7] || '', marginalB4: tPhys.hardness.compoundB[8] || '', marginalB5: tPhys.hardness.compoundB[9] || '',
      hardnessStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const tensilePayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      sampleBefore1: tPhys.tensile.before[0] || '', sampleBefore2: tPhys.tensile.before[1] || '', sampleBefore3: tPhys.tensile.before[2] || '', sampleBefore4: tPhys.tensile.before[3] || '', sampleBefore5: tPhys.tensile.before[4] || '',
      marginalBefore1: tPhys.tensile.before[5] || '', marginalBefore2: tPhys.tensile.before[6] || '', marginalBefore3: tPhys.tensile.before[7] || '', marginalBefore4: tPhys.tensile.before[8] || '', marginalBefore5: tPhys.tensile.before[9] || '',
      sampleAfter1: tPhys.tensile.after[0] || '', sampleAfter2: tPhys.tensile.after[1] || '', sampleAfter3: tPhys.tensile.after[2] || '', sampleAfter4: tPhys.tensile.after[3] || '', sampleAfter5: tPhys.tensile.after[4] || '',
      marginalAfter1: tPhys.tensile.after[5] || '', marginalAfter2: tPhys.tensile.after[6] || '', marginalAfter3: tPhys.tensile.after[7] || '', marginalAfter4: tPhys.tensile.after[8] || '', marginalAfter5: tPhys.tensile.after[9] || '',
      tensileStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const elongationPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      sampleBefore1: tPhys.elongation.before[0] || '', sampleBefore2: tPhys.elongation.before[1] || '', sampleBefore3: tPhys.elongation.before[2] || '', sampleBefore4: tPhys.elongation.before[3] || '', sampleBefore5: tPhys.elongation.before[4] || '',
      marginalBefore1: tPhys.elongation.before[5] || '', marginalBefore2: tPhys.elongation.before[6] || '', marginalBefore3: tPhys.elongation.before[7] || '', marginalBefore4: tPhys.elongation.before[8] || '', marginalBefore5: tPhys.elongation.before[9] || '',
      sampleAfter1: tPhys.elongation.after[0] || '', sampleAfter2: tPhys.elongation.after[1] || '', sampleAfter3: tPhys.elongation.after[2] || '', sampleAfter4: tPhys.elongation.after[3] || '', sampleAfter5: tPhys.elongation.after[4] || '',
      marginalAfter1: tPhys.elongation.after[5] || '', marginalAfter2: tPhys.elongation.after[6] || '', marginalAfter3: tPhys.elongation.after[7] || '', marginalAfter4: tPhys.elongation.after[8] || '', marginalAfter5: tPhys.elongation.after[9] || '',
      elongationStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const modulusPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      sampleBefore1: tPhys.modulus.before[0] || '', sampleBefore2: tPhys.modulus.before[1] || '', sampleBefore3: tPhys.modulus.before[2] || '',
      marginalBefore1: tPhys.modulus.before[3] || '', marginalBefore2: tPhys.modulus.before[4] || '', marginalBefore3: tPhys.modulus.before[5] || '',
      sampleAfter1: tPhys.modulus.after[0] || '', sampleAfter2: tPhys.modulus.after[1] || '', sampleAfter3: tPhys.modulus.after[2] || '',
      marginalAfter1: tPhys.modulus.after[3] || '', marginalAfter2: tPhys.modulus.after[4] || '', marginalAfter3: tPhys.modulus.after[5] || '',
      modulusStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const compressionPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      sampleInitial1: tPhys.compression.initial[0] || '', sampleInitial2: tPhys.compression.initial[1] || '', sampleInitial3: tPhys.compression.initial[2] || '',
      marginalInitial1: tPhys.compression.initial[3] || '', marginalInitial2: tPhys.compression.initial[4] || '', marginalInitial3: tPhys.compression.initial[5] || '',
      sampleFinal1: tPhys.compression.final[0] || '', sampleFinal2: tPhys.compression.final[1] || '', sampleFinal3: tPhys.compression.final[2] || '',
      marginalFinal1: tPhys.compression.final[3] || '', marginalFinal2: tPhys.compression.final[4] || '', marginalFinal3: tPhys.compression.final[5] || '',
      compressionStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const tensionPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      sampleInitial1: tPhys.tension.initial[0] || '', sampleInitial2: tPhys.tension.initial[1] || '', sampleInitial3: tPhys.tension.initial[2] || '',
      marginalInitial1: tPhys.tension.initial[3] || '', marginalInitial2: tPhys.tension.initial[4] || '', marginalInitial3: tPhys.tension.initial[5] || '',
      sampleFinal1: tPhys.tension.final[0] || '', sampleFinal2: tPhys.tension.final[1] || '', sampleFinal3: tPhys.tension.final[2] || '',
      marginalFinal1: tPhys.tension.final[3] || '', marginalFinal2: tPhys.tension.final[4] || '', marginalFinal3: tPhys.tension.final[5] || '',
      tensionStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const loadPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      load1: tPhys?.loadTest?.loads?.[0] || '',
      load2: tPhys?.loadTest?.loads?.[1] || '',
      load3: tPhys?.loadTest?.loads?.[2] || '',
      load4: tPhys?.loadTest?.loads?.[3] || '',
      load5: tPhys?.loadTest?.loads?.[4] || '',
      load6: tPhys?.loadTest?.loads?.[5] || '',
      load7: tPhys?.loadTest?.loads?.[6] || '',
      load8: tPhys?.loadTest?.loads?.[7] || '',
      pad1L1: tPhys.loadTest.pad1[0]?.left || '', pad1R1: tPhys.loadTest.pad1[0]?.right || '',
      pad1L2: tPhys.loadTest.pad1[1]?.left || '', pad1R2: tPhys.loadTest.pad1[1]?.right || '',
      pad1L3: tPhys.loadTest.pad1[2]?.left || '', pad1R3: tPhys.loadTest.pad1[2]?.right || '',
      pad1L4: tPhys.loadTest.pad1[3]?.left || '', pad1R4: tPhys.loadTest.pad1[3]?.right || '',
      pad1L5: tPhys.loadTest.pad1[4]?.left || '', pad1R5: tPhys.loadTest.pad1[4]?.right || '',
      pad1L6: tPhys.loadTest.pad1[5]?.left || '', pad1R6: tPhys.loadTest.pad1[5]?.right || '',
      pad1L7: tPhys.loadTest.pad1[6]?.left || '', pad1R7: tPhys.loadTest.pad1[6]?.right || '',
      pad1L8: tPhys.loadTest.pad1[7]?.left || '', pad1R8: tPhys.loadTest.pad1[7]?.right || '',
      pad2L1: tPhys.loadTest.pad2[0]?.left || '', pad2R1: tPhys.loadTest.pad2[0]?.right || '',
      pad2L2: tPhys.loadTest.pad2[1]?.left || '', pad2R2: tPhys.loadTest.pad2[1]?.right || '',
      pad2L3: tPhys.loadTest.pad2[2]?.left || '', pad2R3: tPhys.loadTest.pad2[2]?.right || '',
      pad2L4: tPhys.loadTest.pad2[3]?.left || '', pad2R4: tPhys.loadTest.pad2[3]?.right || '',
      pad2L5: tPhys.loadTest.pad2[4]?.left || '', pad2R5: tPhys.loadTest.pad2[4]?.right || '',
      pad2L6: tPhys.loadTest.pad2[5]?.left || '', pad2R6: tPhys.loadTest.pad2[5]?.right || '',
      pad2L7: tPhys.loadTest.pad2[6]?.left || '', pad2R7: tPhys.loadTest.pad2[6]?.right || '',
      pad2L8: tPhys.loadTest.pad2[7]?.left || '', pad2R8: tPhys.loadTest.pad2[7]?.right || '',
      mpad1L1: tPhys.loadTest.mPad1[0]?.left || '', mpad1R1: tPhys.loadTest.mPad1[0]?.right || '',
      mpad1L2: tPhys.loadTest.mPad1[1]?.left || '', mpad1R2: tPhys.loadTest.mPad1[1]?.right || '',
      mpad1L3: tPhys.loadTest.mPad1[2]?.left || '', mpad1R3: tPhys.loadTest.mPad1[2]?.right || '',
      mpad1L4: tPhys.loadTest.mPad1[3]?.left || '', mpad1R4: tPhys.loadTest.mPad1[3]?.right || '',
      mpad1L5: tPhys.loadTest.mPad1[4]?.left || '', mpad1R5: tPhys.loadTest.mPad1[4]?.right || '',
      mpad1L6: tPhys.loadTest.mPad1[5]?.left || '', mpad1R6: tPhys.loadTest.mPad1[5]?.right || '',
      mpad1L7: tPhys.loadTest.mPad1[6]?.left || '', mpad1R7: tPhys.loadTest.mPad1[6]?.right || '',
      mpad1L8: tPhys.loadTest.mPad1[7]?.left || '', mpad1R8: tPhys.loadTest.mPad1[7]?.right || '',
      mpad2L1: tPhys.loadTest.mPad2[0]?.left || '', mpad2R1: tPhys.loadTest.mPad2[0]?.right || '',
      mpad2L2: tPhys.loadTest.mPad2[1]?.left || '', mpad2R2: tPhys.loadTest.mPad2[1]?.right || '',
      mpad2L3: tPhys.loadTest.mPad2[2]?.left || '', mpad2R3: tPhys.loadTest.mPad2[2]?.right || '',
      mpad2L4: tPhys.loadTest.mPad2[3]?.left || '', mpad2R4: tPhys.loadTest.mPad2[3]?.right || '',
      mpad2L5: tPhys.loadTest.mPad2[4]?.left || '', mpad2R5: tPhys.loadTest.mPad2[4]?.right || '',
      mpad2L6: tPhys.loadTest.mPad2[5]?.left || '', mpad2R6: tPhys.loadTest.mPad2[5]?.right || '',
      mpad2L7: tPhys.loadTest.mPad2[6]?.left || '', mpad2R7: tPhys.loadTest.mPad2[6]?.right || '',
      mpad2L8: tPhys.loadTest.mPad2[7]?.left || '', mpad2R8: tPhys.loadTest.mPad2[7]?.right || '',
      mpad3L1: tPhys.loadTest.mPad3[0]?.left || '', mpad3R1: tPhys.loadTest.mPad3[0]?.right || '',
      mpad3L2: tPhys.loadTest.mPad3[1]?.left || '', mpad3R2: tPhys.loadTest.mPad3[1]?.right || '',
      mpad3L3: tPhys.loadTest.mPad3[2]?.left || '', mpad3R3: tPhys.loadTest.mPad3[2]?.right || '',
      mpad3L4: tPhys.loadTest.mPad3[3]?.left || '', mpad3R4: tPhys.loadTest.mPad3[3]?.right || '',
      mpad3L5: tPhys.loadTest.mPad3[4]?.left || '', mpad3R5: tPhys.loadTest.mPad3[4]?.right || '',
      mpad3L6: tPhys.loadTest.mPad3[5]?.left || '', mpad3R6: tPhys.loadTest.mPad3[5]?.right || '',
      mpad3L7: tPhys.loadTest.mPad3[6]?.left || '', mpad3R7: tPhys.loadTest.mPad3[6]?.right || '',
      mpad3L8: tPhys.loadTest.mPad3[7]?.left || '', mpad3R8: tPhys.loadTest.mPad3[7]?.right || '',
      mpad4L1: tPhys.loadTest.mPad4[0]?.left || '', mpad4R1: tPhys.loadTest.mPad4[0]?.right || '',
      mpad4L2: tPhys.loadTest.mPad4[1]?.left || '', mpad4R2: tPhys.loadTest.mPad4[1]?.right || '',
      mpad4L3: tPhys.loadTest.mPad4[2]?.left || '', mpad4R3: tPhys.loadTest.mPad4[2]?.right || '',
      mpad4L4: tPhys.loadTest.mPad4[3]?.left || '', mpad4R4: tPhys.loadTest.mPad4[3]?.right || '',
      mpad4L5: tPhys.loadTest.mPad4[4]?.left || '', mpad4R5: tPhys.loadTest.mPad4[4]?.right || '',
      mpad4L6: tPhys.loadTest.mPad4[5]?.left || '', mpad4R6: tPhys.loadTest.mPad4[5]?.right || '',
      mpad4L7: tPhys.loadTest.mPad4[6]?.left || '', mpad4R7: tPhys.loadTest.mPad4[6]?.right || '',
      mpad4L8: tPhys.loadTest.mPad4[7]?.left || '', mpad4R8: tPhys.loadTest.mPad4[7]?.right || '',
      loadStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const electricalPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      s1BeforeForward: tElec.resistance[0]?.bF || '', s1BeforeReverse: tElec.resistance[0]?.bR || '',
      s2BeforeForward: tElec.resistance[1]?.bF || '', s2BeforeReverse: tElec.resistance[1]?.bR || '',
      s3BeforeForward: tElec.resistance[2]?.bF || '', s3BeforeReverse: tElec.resistance[2]?.bR || '',
      s4BeforeForward: tElec.resistance[3]?.bF || '', s4BeforeReverse: tElec.resistance[3]?.bR || '',
      s5BeforeForward: tElec.resistance[4]?.bF || '', s5BeforeReverse: tElec.resistance[4]?.bR || '',
      s6BeforeForward: tElec.resistance[5]?.bF || '', s6BeforeReverse: tElec.resistance[5]?.bR || '',
      s1AfterForward: tElec.resistance[0]?.aF || '', s1AfterReverse: tElec.resistance[0]?.aR || '',
      s2AfterForward: tElec.resistance[1]?.aF || '', s2AfterReverse: tElec.resistance[1]?.aR || '',
      s3AfterForward: tElec.resistance[2]?.aF || '', s3AfterReverse: tElec.resistance[2]?.aR || '',
      s4AfterForward: tElec.resistance[3]?.aF || '', s4AfterReverse: tElec.resistance[3]?.aR || '',
      s5AfterForward: tElec.resistance[4]?.aF || '', s5AfterReverse: tElec.resistance[4]?.aR || '',
      s6AfterForward: tElec.resistance[5]?.aF || '', s6AfterReverse: tElec.resistance[5]?.aR || '',
      electricalStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const sgPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      s1AAir: tElec.sg.compoundA[0]?.air || '', s2AAir: tElec.sg.compoundA[1]?.air || '', s3AAir: tElec.sg.compoundA[2]?.air || '',
      m1AAir: tElec.sg.compoundA[3]?.air || '', m2AAir: tElec.sg.compoundA[4]?.air || '', m3AAir: tElec.sg.compoundA[5]?.air || '',
      m4AAir: tElec.sg.compoundA[6]?.air || '', m5AAir: tElec.sg.compoundA[7]?.air || '', m6AAir: tElec.sg.compoundA[8]?.air || '',
      s1AWater: tElec.sg.compoundA[0]?.water || '', s2AWater: tElec.sg.compoundA[1]?.water || '', s3AWater: tElec.sg.compoundA[2]?.water || '',
      m1AWater: tElec.sg.compoundA[3]?.water || '', m2AWater: tElec.sg.compoundA[4]?.water || '', m3AWater: tElec.sg.compoundA[5]?.water || '',
      m4AWater: tElec.sg.compoundA[6]?.water || '', m5AWater: tElec.sg.compoundA[7]?.water || '', m6AWater: tElec.sg.compoundA[8]?.water || '',
      s1BAir: tElec.sg.compoundB[0]?.air || '', s2BAir: tElec.sg.compoundB[1]?.air || '', s3BAir: tElec.sg.compoundB[2]?.air || '',
      m1BAir: tElec.sg.compoundB[3]?.air || '', m2BAir: tElec.sg.compoundB[4]?.air || '', m3BAir: tElec.sg.compoundB[5]?.air || '',
      m4BAir: tElec.sg.compoundB[6]?.air || '', m5BAir: tElec.sg.compoundB[7]?.air || '', m6BAir: tElec.sg.compoundB[8]?.air || '',
      s1BWater: tElec.sg.compoundB[0]?.water || '', s2BWater: tElec.sg.compoundB[1]?.water || '', s3BWater: tElec.sg.compoundB[2]?.water || '',
      m1BWater: tElec.sg.compoundB[3]?.water || '', m2BWater: tElec.sg.compoundB[4]?.water || '', m3BWater: tElec.sg.compoundB[5]?.water || '',
      m4BWater: tElec.sg.compoundB[6]?.water || '', m5BWater: tElec.sg.compoundB[7]?.water || '', m6BWater: tElec.sg.compoundB[8]?.water || '',
      sgStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const ashPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      s1ACrucible: tElec.ash.compoundA[0]?.crucible || '', s1ASample: tElec.ash.compoundA[0]?.sample || '', s1AAsh: tElec.ash.compoundA[0]?.ash || '',
      s2ACrucible: tElec.ash.compoundA[1]?.crucible || '', s2ASample: tElec.ash.compoundA[1]?.sample || '', s2AAsh: tElec.ash.compoundA[1]?.ash || '',
      s3ACrucible: tElec.ash.compoundA[2]?.crucible || '', s3ASample: tElec.ash.compoundA[2]?.sample || '', s3AAsh: tElec.ash.compoundA[2]?.ash || '',
      m1ACrucible: tElec.ash.compoundA[3]?.crucible || '', m1ASample: tElec.ash.compoundA[3]?.sample || '', m1AAsh: tElec.ash.compoundA[3]?.ash || '',
      m2ACrucible: tElec.ash.compoundA[4]?.crucible || '', m2ASample: tElec.ash.compoundA[4]?.sample || '', m2AAsh: tElec.ash.compoundA[4]?.ash || '',
      m3ACrucible: tElec.ash.compoundA[5]?.crucible || '', m3ASample: tElec.ash.compoundA[5]?.sample || '', m3AAsh: tElec.ash.compoundA[5]?.ash || '',
      m4ACrucible: tElec.ash.compoundA[6]?.crucible || '', m4ASample: tElec.ash.compoundA[6]?.sample || '', m4AAsh: tElec.ash.compoundA[6]?.ash || '',
      m5ACrucible: tElec.ash.compoundA[7]?.crucible || '', m5ASample: tElec.ash.compoundA[7]?.sample || '', m5AAsh: tElec.ash.compoundA[7]?.ash || '',
      m6ACrucible: tElec.ash.compoundA[8]?.crucible || '', m6ASample: tElec.ash.compoundA[8]?.sample || '', m6AAsh: tElec.ash.compoundA[8]?.ash || '',
      s1BCrucible: tElec.ash.compoundB[0]?.crucible || '', s1BSample: tElec.ash.compoundB[0]?.sample || '', s1BAsh: tElec.ash.compoundB[0]?.ash || '',
      s2BCrucible: tElec.ash.compoundB[1]?.crucible || '', s2BSample: tElec.ash.compoundB[1]?.sample || '', s2BAsh: tElec.ash.compoundB[1]?.ash || '',
      s3BCrucible: tElec.ash.compoundB[2]?.crucible || '', s3BSample: tElec.ash.compoundB[2]?.sample || '', s3BAsh: tElec.ash.compoundB[2]?.ash || '',
      m1BCrucible: tElec.ash.compoundB[3]?.crucible || '', m1BSample: tElec.ash.compoundB[3]?.sample || '', m1BAsh: tElec.ash.compoundB[3]?.ash || '',
      m2BCrucible: tElec.ash.compoundB[4]?.crucible || '', m2BSample: tElec.ash.compoundB[4]?.sample || '', m2BAsh: tElec.ash.compoundB[4]?.ash || '',
      m3BCrucible: tElec.ash.compoundB[5]?.crucible || '', m3BSample: tElec.ash.compoundB[5]?.sample || '', m3BAsh: tElec.ash.compoundB[5]?.ash || '',
      m4BCrucible: tElec.ash.compoundB[6]?.crucible || '', m4BSample: tElec.ash.compoundB[6]?.sample || '', m4BAsh: tElec.ash.compoundB[6]?.ash || '',
      m5BCrucible: tElec.ash.compoundB[7]?.crucible || '', m5BSample: tElec.ash.compoundB[7]?.sample || '', m5BAsh: tElec.ash.compoundB[7]?.ash || '',
      m6BCrucible: tElec.ash.compoundB[8]?.crucible || '', m6BSample: tElec.ash.compoundB[8]?.sample || '', m6BAsh: tElec.ash.compoundB[8]?.ash || '',
      ashStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const adhesionPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      sample1: tSpec.adhesion[0] || '', sample2: tSpec.adhesion[1] || '',
      marginal1: tSpec.adhesion[2] || '', marginal2: tSpec.adhesion[3] || '',
      marginal3: tSpec.adhesion[4] || '', marginal4: tSpec.adhesion[5] || '',
      adhesionStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const secantPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      s1S20A: tSpec.secant[0]?.s20?.a || '', s1S20B: tSpec.secant[0]?.s20?.b || '', s1S20C: tSpec.secant[0]?.s20?.c || '', s1S20D: tSpec.secant[0]?.s20?.d || '',
      s1S90A: tSpec.secant[0]?.s90?.a || '', s1S90B: tSpec.secant[0]?.s90?.b || '', s1S90C: tSpec.secant[0]?.s90?.c || '', s1S90D: tSpec.secant[0]?.s90?.d || '',
      s2S20A: tSpec.secant[1]?.s20?.a || '', s2S20B: tSpec.secant[1]?.s20?.b || '', s2S20C: tSpec.secant[1]?.s20?.c || '', s2S20D: tSpec.secant[1]?.s20?.d || '',
      s2S90A: tSpec.secant[1]?.s90?.a || '', s2S90B: tSpec.secant[1]?.s90?.b || '', s2S90C: tSpec.secant[1]?.s90?.c || '', s2S90D: tSpec.secant[1]?.s90?.d || '',
      m1S20A: tSpec.secant[2]?.s20?.a || '', m1S20B: tSpec.secant[2]?.s20?.b || '', m1S20C: tSpec.secant[2]?.s20?.c || '', m1S20D: tSpec.secant[2]?.s20?.d || '',
      m1S90A: tSpec.secant[2]?.s90?.a || '', m1S90B: tSpec.secant[2]?.s90?.b || '', m1S90C: tSpec.secant[2]?.s90?.c || '', m1S90D: tSpec.secant[2]?.s90?.d || '',
      m2S20A: tSpec.secant[3]?.s20?.a || '', m2S20B: tSpec.secant[3]?.s20?.b || '', m2S20C: tSpec.secant[3]?.s20?.c || '', m2S20D: tSpec.secant[3]?.s20?.d || '',
      m2S90A: tSpec.secant[3]?.s90?.a || '', m2S90B: tSpec.secant[3]?.s90?.b || '', m2S90C: tSpec.secant[3]?.s90?.c || '', m2S90D: tSpec.secant[3]?.s90?.d || '',
      m3S20A: tSpec.secant[4]?.s20?.a || '', m3S20B: tSpec.secant[4]?.s20?.b || '', m3S20C: tSpec.secant[4]?.s20?.c || '', m3S20D: tSpec.secant[4]?.s20?.d || '',
      m3S90A: tSpec.secant[4]?.s90?.a || '', m3S90B: tSpec.secant[4]?.s90?.b || '', m3S90C: tSpec.secant[4]?.s90?.c || '', m3S90D: tSpec.secant[4]?.s90?.d || '',
      m4S20A: tSpec.secant[5]?.s20?.a || '', m4S20B: tSpec.secant[5]?.s20?.b || '', m4S20C: tSpec.secant[5]?.s20?.c || '', m4S20D: tSpec.secant[5]?.s20?.d || '',
      m4S90A: tSpec.secant[5]?.s90?.a || '', m4S90B: tSpec.secant[5]?.s90?.b || '', m4S90C: tSpec.secant[5]?.s90?.c || '', m4S90D: tSpec.secant[5]?.s90?.d || '',
      secantStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const resiliencePayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      s1Impact1: tPhys.resilience[0]?.i1 || '', s1Impact2: tPhys.resilience[0]?.i2 || '', s1Impact3: tPhys.resilience[0]?.i3 || '', s1Impact4: tPhys.resilience[0]?.i4 || '', s1Impact5: tPhys.resilience[0]?.i5 || '', s1Impact6: tPhys.resilience[0]?.i6 || '',
      s2Impact1: tPhys.resilience[1]?.i1 || '', s2Impact2: tPhys.resilience[1]?.i2 || '', s2Impact3: tPhys.resilience[1]?.i3 || '', s2Impact4: tPhys.resilience[1]?.i4 || '', s2Impact5: tPhys.resilience[1]?.i5 || '', s2Impact6: tPhys.resilience[1]?.i6 || '',
      s3Impact1: tPhys.resilience[2]?.i1 || '', s3Impact2: tPhys.resilience[2]?.i2 || '', s3Impact3: tPhys.resilience[2]?.i3 || '', s3Impact4: tPhys.resilience[2]?.i4 || '', s3Impact5: tPhys.resilience[2]?.i5 || '', s3Impact6: tPhys.resilience[2]?.i6 || '',
      resilienceStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const ozonePayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      initialLength: tElec.ozone[0]?.initial || '',
      stretchedLength: tElec.ozone[0]?.stretched || '',
      observation: tElec.ozone[0]?.obs || '',
      ozoneStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
    };

    const tgaPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      dateOfLastTest: tPeriodic.tga.dateOfLastTest,
      qtyProducedSinceLastTest: tPeriodic.tga.qtyProduced ? parseInt(tPeriodic.tga.qtyProduced, 10) : null,
      s1LotNo: tPeriodic.tga.samples[0]?.lotNo || '', s1SampleNo: tPeriodic.tga.samples[0]?.sampleNo || '', s1SampleWt: tPeriodic.tga.samples[0]?.weight || '', s1TempRange: tPeriodic.tga.samples[0]?.tempRange || '', s1PolymerContent: tPeriodic.tga.samples[0]?.polymer || '',
      s2LotNo: tPeriodic.tga.samples[1]?.lotNo || '', s2SampleNo: tPeriodic.tga.samples[1]?.sampleNo || '', s2SampleWt: tPeriodic.tga.samples[1]?.weight || '', s2TempRange: tPeriodic.tga.samples[1]?.tempRange || '', s2PolymerContent: tPeriodic.tga.samples[1]?.polymer || '',
      s3LotNo: tPeriodic.tga.samples[2]?.lotNo || '', s3SampleNo: tPeriodic.tga.samples[2]?.sampleNo || '', s3SampleWt: tPeriodic.tga.samples[2]?.weight || '', s3TempRange: tPeriodic.tga.samples[2]?.tempRange || '', s3PolymerContent: tPeriodic.tga.samples[2]?.polymer || '',
      s4LotNo: tPeriodic.tga.samples[3]?.lotNo || '', s4SampleNo: tPeriodic.tga.samples[3]?.sampleNo || '', s4SampleWt: tPeriodic.tga.samples[3]?.weight || '', s4TempRange: tPeriodic.tga.samples[3]?.tempRange || '', s4PolymerContent: tPeriodic.tga.samples[3]?.polymer || '',
      s5LotNo: tPeriodic.tga.samples[4]?.lotNo || '', s5SampleNo: tPeriodic.tga.samples[4]?.sampleNo || '', s5SampleWt: tPeriodic.tga.samples[4]?.weight || '', s5TempRange: tPeriodic.tga.samples[4]?.tempRange || '', s5PolymerContent: tPeriodic.tga.samples[4]?.polymer || '',
      tgaStatus: 'PASS', remarks: tRemarks || ''
    };

    const durabilityPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      dateOfLastTest: tPeriodic.durability.dateOfLastTest,
      qtyProducedSinceLastTest: tPeriodic.durability.qtyProduced ? parseInt(tPeriodic.durability.qtyProduced, 10) : null,
      s1LotNo: tPeriodic.durability.samples[0]?.lotNo || '', s1InitialThickness: tPeriodic.durability.samples[0]?.initialThick || '', s1FinalThickness: tPeriodic.durability.samples[0]?.finalThick || '', s1InitialLoadComp: tPeriodic.durability.samples[0]?.initialLoad || '', s1FinalLoadComp: tPeriodic.durability.samples[0]?.finalLoad || '',
      s2LotNo: tPeriodic.durability.samples[1]?.lotNo || '', s2InitialThickness: tPeriodic.durability.samples[1]?.initialThick || '', s2FinalThickness: tPeriodic.durability.samples[1]?.finalThick || '', s2InitialLoadComp: tPeriodic.durability.samples[1]?.initialLoad || '', s2FinalLoadComp: tPeriodic.durability.samples[1]?.finalLoad || '',
      s3LotNo: tPeriodic.durability.samples[2]?.lotNo || '', s3InitialThickness: tPeriodic.durability.samples[2]?.initialThick || '', s3FinalThickness: tPeriodic.durability.samples[2]?.finalThick || '', s3InitialLoadComp: tPeriodic.durability.samples[2]?.initialLoad || '', s3FinalLoadComp: tPeriodic.durability.samples[2]?.finalLoad || '',
      s4LotNo: tPeriodic.durability.samples[3]?.lotNo || '', s4InitialThickness: tPeriodic.durability.samples[3]?.initialThick || '', s4FinalThickness: tPeriodic.durability.samples[3]?.finalThick || '', s4InitialLoadComp: tPeriodic.durability.samples[3]?.initialLoad || '', s4FinalLoadComp: tPeriodic.durability.samples[3]?.finalLoad || '',
      s5LotNo: tPeriodic.durability.samples[4]?.lotNo || '', s5InitialThickness: tPeriodic.durability.samples[4]?.initialThick || '', s5FinalThickness: tPeriodic.durability.samples[4]?.finalThick || '', s5InitialLoadComp: tPeriodic.durability.samples[4]?.initialLoad || '', s5FinalLoadComp: tPeriodic.durability.samples[4]?.finalLoad || '',
      durabilityStatus: 'PASS', remarks: tRemarks || ''
    };

    const abrasionPayload = {
      callNo: currentCallId,
      lotNo: oLotId,
      plantId: call?.plantId || 'N/A',
      vendorCode: call?.vendorCode || 'N/A',
      shift: call?.shift || 'A',
      railpadType: oRailpadType,
      offeredQty: oOfferedQty,
      dateOfLastTest: tPeriodic.abrasion.dateOfLastTest,
      qtyProducedSinceLastTest: tPeriodic.abrasion.qtyProduced ? parseInt(tPeriodic.abrasion.qtyProduced, 10) : null,
      s1LotNo: tPeriodic.abrasion.samples[0]?.lotNo || '', s1SampleNo: tPeriodic.abrasion.samples[0]?.sampleNo || '', s1InitialMass: tPeriodic.abrasion.samples[0]?.initialMass || '', s1FinalMass: tPeriodic.abrasion.samples[0]?.finalMass || '', s1RelativeLoss: tPeriodic.abrasion.samples[0]?.relativeLoss || '',
      s2LotNo: tPeriodic.abrasion.samples[1]?.lotNo || '', s2SampleNo: tPeriodic.abrasion.samples[1]?.sampleNo || '', s2InitialMass: tPeriodic.abrasion.samples[1]?.initialMass || '', s2FinalMass: tPeriodic.abrasion.samples[1]?.finalMass || '', s2RelativeLoss: tPeriodic.abrasion.samples[1]?.relativeLoss || '',
      s3LotNo: tPeriodic.abrasion.samples[2]?.lotNo || '', s3SampleNo: tPeriodic.abrasion.samples[2]?.sampleNo || '', s3InitialMass: tPeriodic.abrasion.samples[2]?.initialMass || '', s3FinalMass: tPeriodic.abrasion.samples[2]?.finalMass || '', s3RelativeLoss: tPeriodic.abrasion.samples[2]?.relativeLoss || '',
      s4LotNo: tPeriodic.abrasion.samples[3]?.lotNo || '', s4SampleNo: tPeriodic.abrasion.samples[3]?.sampleNo || '', s4InitialMass: tPeriodic.abrasion.samples[3]?.initialMass || '', s4FinalMass: tPeriodic.abrasion.samples[3]?.finalMass || '', s4RelativeLoss: tPeriodic.abrasion.samples[3]?.relativeLoss || '',
      s5LotNo: tPeriodic.abrasion.samples[4]?.lotNo || '', s5SampleNo: tPeriodic.abrasion.samples[4]?.sampleNo || '', s5InitialMass: tPeriodic.abrasion.samples[4]?.initialMass || '', s5FinalMass: tPeriodic.abrasion.samples[4]?.finalMass || '', s5RelativeLoss: tPeriodic.abrasion.samples[4]?.relativeLoss || '',
      abrasionStatus: 'PASS', remarks: tRemarks || ''
    };

    const lotPromises = [
      finalInspectionLotResultsService.save(savePayload),
      finalVisualDimensionalInspectionService.save(visualDimPayload),
      finalWeightTestService.save(weightTestPayload),
      finalHardnessTestService.save(hardnessPayload),
      finalTensileStrengthService.save(tensilePayload),
      finalElongationService.save(elongationPayload),
      finalModulusService.save(modulusPayload),
      finalCompressionSetService.save(compressionPayload),
      finalTensionSetService.save(tensionPayload),
      finalLoadTestService.save(loadPayload),
      finalElectricalResistanceService.save(electricalPayload),
      finalSpecificGravityService.save(sgPayload),
      finalAshContentService.save(ashPayload),
      finalAdhesionService.save(adhesionPayload),
      finalSecantStiffnessService.save(secantPayload),
      finalResilienceTestService.save(resiliencePayload),
      finalOzoneTestService.save(ozonePayload),
      finalPeriodicTgaService.save(tgaPayload),
      finalPeriodicDurabilityService.save(durabilityPayload),
      finalPeriodicAbrasionService.save(abrasionPayload)
    ];

    if (oIsNCRGRSP) {
      const ncrAdhesionPayload = {
        callNo: currentCallId,
        lotNo: oLotId,
        plantId: call?.plantId || 'N/A',
        vendorCode: call?.vendorCode || 'N/A',
        shift: call?.shift || 'A',
        railpadType: oRailpadType,
        offeredQty: oOfferedQty,
        s1Peel: tSpec.ncrgrsp?.adhesion[0]?.peel || '', s1Hpull: tSpec.ncrgrsp?.adhesion[0]?.hpull || '',
        s2Peel: tSpec.ncrgrsp?.adhesion[1]?.peel || '', s2Hpull: tSpec.ncrgrsp?.adhesion[1]?.hpull || '',
        m1Peel: tSpec.ncrgrsp?.adhesion[2]?.peel || '', m1Hpull: tSpec.ncrgrsp?.adhesion[2]?.hpull || '',
        m2Peel: tSpec.ncrgrsp?.adhesion[3]?.peel || '', m2Hpull: tSpec.ncrgrsp?.adhesion[3]?.hpull || '',
        m3Peel: tSpec.ncrgrsp?.adhesion[4]?.peel || '', m3Hpull: tSpec.ncrgrsp?.adhesion[4]?.hpull || '',
        m4Peel: tSpec.ncrgrsp?.adhesion[5]?.peel || '', m4Hpull: tSpec.ncrgrsp?.adhesion[5]?.hpull || '',
        ncrAdhesionStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
      };

      const ncrBreakingPayload = {
        callNo: currentCallId,
        lotNo: oLotId,
        plantId: call?.plantId || 'N/A',
        vendorCode: call?.vendorCode || 'N/A',
        shift: call?.shift || 'A',
        railpadType: oRailpadType,
        offeredQty: oOfferedQty,
        sample1: tSpec.ncrgrsp?.breaking[0] || '', sample2: tSpec.ncrgrsp?.breaking[1] || '', sample3: tSpec.ncrgrsp?.breaking[2] || '', sample4: tSpec.ncrgrsp?.breaking[3] || '', sample5: tSpec.ncrgrsp?.breaking[4] || '',
        marginal1: tSpec.ncrgrsp?.breaking[5] || '', marginal2: tSpec.ncrgrsp?.breaking[6] || '', marginal3: tSpec.ncrgrsp?.breaking[7] || '', marginal4: tSpec.ncrgrsp?.breaking[8] || '', marginal5: tSpec.ncrgrsp?.breaking[9] || '',
        marginal6: tSpec.ncrgrsp?.breaking[10] || '', marginal7: tSpec.ncrgrsp?.breaking[11] || '', marginal8: tSpec.ncrgrsp?.breaking[12] || '', marginal9: tSpec.ncrgrsp?.breaking[13] || '', marginal10: tSpec.ncrgrsp?.breaking[14] || '',
        ncrBreakingStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
      };

      const ncrCordPayload = {
        callNo: currentCallId,
        lotNo: oLotId,
        plantId: call?.plantId || 'N/A',
        vendorCode: call?.vendorCode || 'N/A',
        shift: call?.shift || 'A',
        railpadType: oRailpadType,
        offeredQty: oOfferedQty,
        s1Denier: tSpec.ncrgrsp?.nylonCord[0]?.denier || '', s1Epi: tSpec.ncrgrsp?.nylonCord[0]?.epi || '', s1Thickness: tSpec.ncrgrsp?.nylonCord[0]?.thickness || '', s1LoadAtBreak: tSpec.ncrgrsp?.nylonCord[0]?.loadAtBreak || '', s1Elongation: tSpec.ncrgrsp?.nylonCord[0]?.elongation || '', s1Twists: tSpec.ncrgrsp?.nylonCord[0]?.twists || '',
        s2Denier: tSpec.ncrgrsp?.nylonCord[1]?.denier || '', s2Epi: tSpec.ncrgrsp?.nylonCord[1]?.epi || '', s2Thickness: tSpec.ncrgrsp?.nylonCord[1]?.thickness || '', s2LoadAtBreak: tSpec.ncrgrsp?.nylonCord[1]?.loadAtBreak || '', s2Elongation: tSpec.ncrgrsp?.nylonCord[1]?.elongation || '', s2Twists: tSpec.ncrgrsp?.nylonCord[1]?.twists || '',
        s3Denier: tSpec.ncrgrsp?.nylonCord[2]?.denier || '', s3Epi: tSpec.ncrgrsp?.nylonCord[2]?.epi || '', s3Thickness: tSpec.ncrgrsp?.nylonCord[2]?.thickness || '', s3LoadAtBreak: tSpec.ncrgrsp?.nylonCord[2]?.loadAtBreak || '', s3Elongation: tSpec.ncrgrsp?.nylonCord[2]?.elongation || '', s3Twists: tSpec.ncrgrsp?.nylonCord[2]?.twists || '',
        m1Denier: tSpec.ncrgrsp?.nylonCord[3]?.denier || '', m1Epi: tSpec.ncrgrsp?.nylonCord[3]?.epi || '', m1Thickness: tSpec.ncrgrsp?.nylonCord[3]?.thickness || '', m1LoadAtBreak: tSpec.ncrgrsp?.nylonCord[3]?.loadAtBreak || '', m1Elongation: tSpec.ncrgrsp?.nylonCord[3]?.elongation || '', m1Twists: tSpec.ncrgrsp?.nylonCord[3]?.twists || '',
        m2Denier: tSpec.ncrgrsp?.nylonCord[4]?.denier || '', m2Epi: tSpec.ncrgrsp?.nylonCord[4]?.epi || '', m2Thickness: tSpec.ncrgrsp?.nylonCord[4]?.thickness || '', m2LoadAtBreak: tSpec.ncrgrsp?.nylonCord[4]?.loadAtBreak || '', m2Elongation: tSpec.ncrgrsp?.nylonCord[4]?.elongation || '', m2Twists: tSpec.ncrgrsp?.nylonCord[4]?.twists || '',
        m3Denier: tSpec.ncrgrsp?.nylonCord[5]?.denier || '', m3Epi: tSpec.ncrgrsp?.nylonCord[5]?.epi || '', m3Thickness: tSpec.ncrgrsp?.nylonCord[5]?.thickness || '', m3LoadAtBreak: tSpec.ncrgrsp?.nylonCord[5]?.loadAtBreak || '', m3Elongation: tSpec.ncrgrsp?.nylonCord[5]?.elongation || '', m3Twists: tSpec.ncrgrsp?.nylonCord[5]?.twists || '',
        m4Denier: tSpec.ncrgrsp?.nylonCord[6]?.denier || '', m4Epi: tSpec.ncrgrsp?.nylonCord[6]?.epi || '', m4Thickness: tSpec.ncrgrsp?.nylonCord[6]?.thickness || '', m4LoadAtBreak: tSpec.ncrgrsp?.nylonCord[6]?.loadAtBreak || '', m4Elongation: tSpec.ncrgrsp?.nylonCord[6]?.elongation || '', m4Twists: tSpec.ncrgrsp?.nylonCord[6]?.twists || '',
        m5Denier: tSpec.ncrgrsp?.nylonCord[7]?.denier || '', m5Epi: tSpec.ncrgrsp?.nylonCord[7]?.epi || '', m5Thickness: tSpec.ncrgrsp?.nylonCord[7]?.thickness || '', m5LoadAtBreak: tSpec.ncrgrsp?.nylonCord[7]?.loadAtBreak || '', m5Elongation: tSpec.ncrgrsp?.nylonCord[7]?.elongation || '', m5Twists: tSpec.ncrgrsp?.nylonCord[7]?.twists || '',
        m6Denier: tSpec.ncrgrsp?.nylonCord[8]?.denier || '', m6Epi: tSpec.ncrgrsp?.nylonCord[8]?.epi || '', m6Thickness: tSpec.ncrgrsp?.nylonCord[8]?.thickness || '', m6LoadAtBreak: tSpec.ncrgrsp?.nylonCord[8]?.loadAtBreak || '', m6Elongation: tSpec.ncrgrsp?.nylonCord[8]?.elongation || '', m6Twists: tSpec.ncrgrsp?.nylonCord[8]?.twists || '',
        ncrCordStatus: 'PASS', notOkCount: 0, remarks: tRemarks || ''
      };

      lotPromises.push(
        finalNcrAdhesionService.save(ncrAdhesionPayload),
        finalNcrBreakingLoadService.save(ncrBreakingPayload),
        finalNcrNylonCordService.save(ncrCordPayload)
      );
    }

    return lotPromises;
  };

  const handleSaveAction = async (actionType) => {
    if (actionType === 'FINISH') {
      if (!remarks.trim()) {
        showNotification('Remarks are required to finish the inspection.', 'warning');
        return;
      }
      if (isNCRGRSP && (!ncrSetsAccepted || ncrSetsAccepted.trim() === '')) {
        showNotification('Sets Accepted is required for NCRGRSP before finishing inspection.', 'warning');
        return;
      }
      if (activeLotOverallStatus === 'ACCEPTED' && sealingType === 'RITES_HOLOGRAM' && hologramEntries.length === 0) {
        showNotification('At least one hologram entry must be added when using Holograms for an accepted lot.', 'warning');
        return;
      }
      if (activeLotOverallStatus === 'ACCEPTED' && sealingType === 'RITES_HOLOGRAM') {
        const hasEmptyHolo = hologramEntries.some(h => (h.type === 'range' && (!h.from || !h.to)) || (h.type === 'single' && !h.value));
        if (hasEmptyHolo) {
          showNotification('Please fill out all added hologram numbers completely.', 'warning');
          return;
        }
      }

      if (!capturedImages || capturedImages.length < 5) {
        showNotification(`At least 5 inspection images are required to finish inspection (Currently: ${capturedImages?.length || 0})`, 'error');
        return;
      }

      try {
        setIsSubmitting(true);
        setSubmitMessage('Saving Inspection Data...');

        const possibleCallIds = Array.from(new Set([
          currentCallId,
          call?.callNo,
          call?.icNumber,
          call?.requestId,
          call?.id ? String(call.id) : null
        ].filter(Boolean)));

        if (isNCRGRSP) {
          possibleCallIds.forEach(cid => {
            localStorage.setItem(`railpad_ncr_sets_offered_${cid}`, ncrSetsOffered);
            localStorage.setItem(`railpad_ncr_sets_accepted_${cid}`, ncrSetsAccepted);
            localStorage.setItem(`railpad_ncr_sets_rejected_${cid}`, ncrSetsRejected);
          });
        }
        let hologramStr = '';
        if (sealingType === 'RITES_HOLOGRAM' && hologramEntries.length > 0) {
          hologramStr = hologramEntries.map(h => {
            if (h.type === 'range') {
              return `${h.from}-${h.to}`;
            } else {
              return h.value;
            }
          }).join(',');
        }

        const visualStatus = visualResult;
        const dimensionalStatus = dimensionalResult;
        const physicalStatus = physicalDecision === 'LOT PASSED' ? 'PASS' : physicalDecision === 'PENDING VERIFICATION' ? 'PENDING' : physicalDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
        const elecStatus = elecDecision === 'LOT PASSED' ? 'PASS' : elecDecision === 'PENDING VERIFICATION' ? 'PENDING' : elecDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
        const specStatus = specDecision === 'LOT PASSED' ? 'PASS' : specDecision === 'PENDING VERIFICATION' ? 'PENDING' : specDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
        const ncrStatus = ncrDecision === 'LOT PASSED' ? 'PASS' : ncrDecision === 'PENDING VERIFICATION' ? 'PENDING' : ncrDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';

        const isDimensionalReOffered = dimensionalStatus === 'RE-OFFERED' || dimensionalStatus === 'RE-OFFER';
        const isWeightPass = isNCRGRSP ? true : (weightStatus === 'ACCEPTED');
        const isWeightPending = isNCRGRSP ? false : (!isWeightPass && weightStatus !== 'REJECTED');
        const isAllCorePass = visualStatus === 'PASS' && dimensionalStatus === 'PASS' && isWeightPass;
        const isAnyCorePending = visualStatus === 'PENDING'
          || (dimensionalStatus === 'PENDING' && !isDimensionalReOffered)
          || isWeightPending
          || physicalStatus === 'PENDING' || physicalStatus === 'RE-TEST'
          || elecStatus === 'PENDING' || elecStatus === 'RE-TEST'
          || specStatus === 'PENDING' || specStatus === 'RE-TEST'
          || (isNCRGRSP && (ncrStatus === 'PENDING' || ncrStatus === 'RE-TEST'));

        let activeLotOverallStatus = 'PENDING';
        let acceptedQty = 0;
        let rejectedQty = 0;
        const offeredQty = activeLot?.size || 0;

        if (isDimensionalReOffered) {
          activeLotOverallStatus = 'RE-OFFERED';
          acceptedQty = 0;
          rejectedQty = 0;
        } else if (isAnyCorePending) {
          activeLotOverallStatus = 'PENDING';
          acceptedQty = 0;
          rejectedQty = 0;
        } else if (isAllCorePass) {
          activeLotOverallStatus = 'ACCEPTED';
          acceptedQty = offeredQty;
          rejectedQty = 0;
        } else {
          activeLotOverallStatus = 'REJECTED';
          acceptedQty = 0;
          rejectedQty = offeredQty;
        }

        let formattedDate = null;
        if (call?.dateOfInspection) {
          if (Array.isArray(call.dateOfInspection) && call.dateOfInspection.length >= 3) {
            const year = call.dateOfInspection[0];
            const month = String(call.dateOfInspection[1]).padStart(2, '0');
            const day = String(call.dateOfInspection[2]).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          } else {
            try {
              formattedDate = new Date(call.dateOfInspection).toISOString().split('T')[0];
            } catch (e) {
              formattedDate = new Date().toISOString().split('T')[0];
            }
          }
        } else {
          formattedDate = new Date().toISOString().split('T')[0];
        }

        const currentUserObj = getStoredUser();
        const userId = currentUserObj?.userId || 0;

        const localActiveSections = [
          'hardness', 'tensile', 'elongation', 'modulus', 'compression', 'tension', 'load',
          'resistance', 'sg', 'ash', 'adhesion', 'secant', 'resilience', 'ozone'
        ];
        if (isNCRGRSP) {
          localActiveSections.push('ncrAdhesion', 'ncrBreaking', 'ncrCord');
        }

        const isTgaMandatory = parseInt(periodicData?.tga?.qtyProduced || 0, 10) >= 30000;
        const isDurabilityMandatory = parseInt(periodicData?.durability?.qtyProduced || 0, 10) >= 100000;
        const isAbrasionMandatory = parseInt(periodicData?.abrasion?.qtyProduced || 0, 10) >= 100000;
        if (isTgaMandatory) localActiveSections.push('tga');
        if (isDurabilityMandatory) localActiveSections.push('durability');
        if (isAbrasionMandatory) localActiveSections.push('abrasion');

        const localRawReports = {};
        localActiveSections.forEach(key => {
          localRawReports[key] = getSectionRawInfo(key);
        });

        const localOutOfSpecPrimary = localActiveSections.filter(key => {
          const rep = localRawReports[key];
          return rep && rep.primaryFilled === rep.primaryCount && rep.primaryOutCount > 0;
        });
        const localShowMarginal = localOutOfSpecPrimary.length === 1;
        const localMarginalKey = localShowMarginal ? localOutOfSpecPrimary[0] : null;

        const hasLocalTgaQty = periodicData?.tga?.qtyProduced !== '' && periodicData?.tga?.qtyProduced !== null && periodicData?.tga?.qtyProduced !== undefined;
        const hasLocalDurabilityQty = periodicData?.durability?.qtyProduced !== '' && periodicData?.durability?.qtyProduced !== null && periodicData?.durability?.qtyProduced !== undefined;
        const hasLocalAbrasionQty = periodicData?.abrasion?.qtyProduced !== '' && periodicData?.abrasion?.qtyProduced !== null && periodicData?.abrasion?.qtyProduced !== undefined;

        const isLocalTgaMandatory = hasLocalTgaQty && parseInt(periodicData?.tga?.qtyProduced || 0, 10) >= 30000;
        const isLocalDurabilityMandatory = hasLocalDurabilityQty && parseInt(periodicData?.durability?.qtyProduced || 0, 10) >= 100000;
        const isLocalAbrasionMandatory = hasLocalAbrasionQty && parseInt(periodicData?.abrasion?.qtyProduced || 0, 10) >= 100000;

        const localGetSectionStatus = (key) => {
          const rep = localRawReports[key];
          if (!rep) return 'PENDING';

          if (key === 'tga') {
            if (!hasLocalTgaQty) return 'PENDING';
            if (!isLocalTgaMandatory) {
              if (rep.primaryFilled === 0) return 'BYPASSED';
              if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
              return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
            }
          }
          if (key === 'durability') {
            if (!hasLocalDurabilityQty) return 'PENDING';
            if (!isLocalDurabilityMandatory) {
              if (rep.primaryFilled === 0) return 'BYPASSED';
              if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
              return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
            }
          }
          if (key === 'abrasion') {
            if (!hasLocalAbrasionQty) return 'PENDING';
            if (!isLocalAbrasionMandatory) {
              if (rep.primaryFilled === 0) return 'BYPASSED';
              if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
              return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
            }
          }

          if (rep.primaryFilled < rep.primaryCount) {
            return rep.primaryFilled > 0 ? 'UNDER TESTING' : 'PENDING';
          }
          if (rep.primaryOutCount === 0) return 'PASS';
          if (key === localMarginalKey) {
            if (rep.doubleFilled < rep.doubleCount) {
              return rep.doubleFilled > 0 ? 'UNDER TESTING' : 'PENDING';
            } else {
              return rep.doubleOutCount === 0 ? 'PASS' : 'FAIL';
            }
          } else {
            return 'FAIL';
          }
        };

        const sectionResultsPayload = [
          {
            sectionKey: 'visual',
            sectionName: 'Visual Inspection',
            sampleSize: String(visualData.visualN || 25),
            status: visualResult
          },
          {
            sectionKey: 'dimensional',
            sectionName: 'Dimensional Inspection',
            sampleSize: String(visualData.dimN || 25),
            status: dimensionalResult
          },
          ...(!isNCRGRSP ? [{
            sectionKey: 'weight',
            sectionName: 'Weight Test',
            sampleSize: String((weightData.isSecondActive || showWeightSecond) ? `${weightData.n1} + ${weightData.n2}` : weightData.n1),
            status: weightStatus === 'ACCEPTED' ? 'PASS' : weightStatus === 'REJECTED' ? 'FAIL' : weightStatus
          }] : []),
          ...localActiveSections.map(k => {
            const rep = localRawReports[k];
            const name = SECTION_CONFIG[k]?.name || k;
            const size = (rep && (rep.doubleFilled > 0 || k === localMarginalKey)) ? `${rep.primaryCount} + ${rep.doubleCount}` : (rep ? rep.primaryCount : 0);
            return {
              sectionKey: k,
              sectionName: name,
              sampleSize: String(size),
              status: localGetSectionStatus(k)
            };
          })
        ];

        const savePayload = {
          callNo: currentCallId,
          shift: call?.shift || 'A',
          dateOfInspection: formattedDate,
          plantId: call?.plantId || 'N/A',
          rlyPoSrNo: call?.rlyPoSrNo || 'N/A',
          vendorName: call?.vendorName || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          railpadType: activeRailpadType,
          lotNo: selectedLot,
          offeredQty: (isNCRGRSP && ncrSetsOffered !== '') ? parseInt(ncrSetsOffered, 10) : offeredQty,
          acceptedQty: (isNCRGRSP && ncrSetsAccepted !== '') ? parseInt(ncrSetsAccepted, 10) : acceptedQty,
          rejectedQty: (isNCRGRSP && ncrSetsRejected !== '') ? parseInt(ncrSetsRejected, 10) : rejectedQty,
          visualDimensionalStatus: visualStatus,
          physicalAgeingPropertiesStatus: physicalStatus,
          electricalChemicalStatus: elecStatus,
          dynamicDurabilityTestStatus: specStatus,
          ncrgrspStatus: isNCRGRSP ? ncrStatus : null,
          overallStatus: activeLotOverallStatus,
          hologram: hologramStr,
          remarks: remarks || '',
          userId: userId ? parseInt(userId, 10) : null,
          sectionResults: sectionResultsPayload
        };

        const currentVisualN = isNCRGRSP ? getVisualDimSampleSize(lots.find(l => l.id === selectedLot)) : (visualData.visualN || 25);
        const currentDimN = isNCRGRSP ? getVisualDimSampleSize(lots.find(l => l.id === selectedLot)) : (visualData.dimN || 25);

        const visualDimPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          visualSamples: currentVisualN,
          visualNotOk: visualData.dv !== '' ? parseInt(visualData.dv, 10) : 0,
          visualReason: visualData.visualReason || '',
          visualResult: visualResult,
          dimensionalSamples: currentDimN,
          dimensionalNotOk: visualData.dd !== '' ? parseInt(visualData.dd, 10) : 0,
          dimensionalReason: visualData.dimReason || '',
          dimensionalResult: dimensionalResult,
          totalRejected: (visualData.dv !== '' ? parseInt(visualData.dv, 10) : 0) + (visualData.dd !== '' ? parseInt(visualData.dd, 10) : 0)
        };

        const weightSamplesList = [];
        weightData.samples1.forEach((val, index) => {
          if (val !== '' && val !== null && val !== undefined) {
            const parsedVal = parseFloat(val);
            weightSamplesList.push({ samplingNo: 1, sampleNo: index + 1, sampleValue: parsedVal, isRejected: parsedVal > weightData.max });
          }
        });
        weightData.samples2.forEach((val, index) => {
          if (val !== '' && val !== null && val !== undefined) {
            const parsedVal = parseFloat(val);
            weightSamplesList.push({ samplingNo: 2, sampleNo: index + 1, sampleValue: parsedVal, isRejected: parsedVal > weightData.max });
          }
        });

        const weightTestPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          weightMin: weightData.min,
          weightMax: weightData.max,
          weightStatus: weightStatus === 'ACCEPTED' ? 'PASS' : weightStatus === 'REJECTED' ? 'FAIL' : weightStatus,
          samples: weightSamplesList
        };

        const hardnessPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleA1: physicalData.hardness.compoundA[0] || '',
          sampleA2: physicalData.hardness.compoundA[1] || '',
          sampleA3: physicalData.hardness.compoundA[2] || '',
          sampleA4: physicalData.hardness.compoundA[3] || '',
          sampleA5: physicalData.hardness.compoundA[4] || '',
          marginalA1: physicalData.hardness.compoundA[5] || '',
          marginalA2: physicalData.hardness.compoundA[6] || '',
          marginalA3: physicalData.hardness.compoundA[7] || '',
          marginalA4: physicalData.hardness.compoundA[8] || '',
          marginalA5: physicalData.hardness.compoundA[9] || '',
          sampleB1: physicalData.hardness.compoundB[0] || '',
          sampleB2: physicalData.hardness.compoundB[1] || '',
          sampleB3: physicalData.hardness.compoundB[2] || '',
          sampleB4: physicalData.hardness.compoundB[3] || '',
          sampleB5: physicalData.hardness.compoundB[4] || '',
          marginalB1: physicalData.hardness.compoundB[5] || '',
          marginalB2: physicalData.hardness.compoundB[6] || '',
          marginalB3: physicalData.hardness.compoundB[7] || '',
          marginalB4: physicalData.hardness.compoundB[8] || '',
          marginalB5: physicalData.hardness.compoundB[9] || '',
          hardnessStatus: getSectionStatus('hardness'),
          notOkCount: rawReports['hardness'] ? (rawReports['hardness'].primaryOutCount + rawReports['hardness'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const tensilePayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleBefore1: physicalData.tensile.before[0] || '',
          sampleBefore2: physicalData.tensile.before[1] || '',
          sampleBefore3: physicalData.tensile.before[2] || '',
          sampleBefore4: physicalData.tensile.before[3] || '',
          sampleBefore5: physicalData.tensile.before[4] || '',
          marginalBefore1: physicalData.tensile.before[5] || '',
          marginalBefore2: physicalData.tensile.before[6] || '',
          marginalBefore3: physicalData.tensile.before[7] || '',
          marginalBefore4: physicalData.tensile.before[8] || '',
          marginalBefore5: physicalData.tensile.before[9] || '',
          sampleAfter1: physicalData.tensile.after[0] || '',
          sampleAfter2: physicalData.tensile.after[1] || '',
          sampleAfter3: physicalData.tensile.after[2] || '',
          sampleAfter4: physicalData.tensile.after[3] || '',
          sampleAfter5: physicalData.tensile.after[4] || '',
          marginalAfter1: physicalData.tensile.after[5] || '',
          marginalAfter2: physicalData.tensile.after[6] || '',
          marginalAfter3: physicalData.tensile.after[7] || '',
          marginalAfter4: physicalData.tensile.after[8] || '',
          marginalAfter5: physicalData.tensile.after[9] || '',
          tensileStatus: getSectionStatus('tensile'),
          notOkCount: rawReports['tensile'] ? (rawReports['tensile'].primaryOutCount + rawReports['tensile'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const elongationPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleBefore1: physicalData.elongation.before[0] || '',
          sampleBefore2: physicalData.elongation.before[1] || '',
          sampleBefore3: physicalData.elongation.before[2] || '',
          sampleBefore4: physicalData.elongation.before[3] || '',
          sampleBefore5: physicalData.elongation.before[4] || '',
          marginalBefore1: physicalData.elongation.before[5] || '',
          marginalBefore2: physicalData.elongation.before[6] || '',
          marginalBefore3: physicalData.elongation.before[7] || '',
          marginalBefore4: physicalData.elongation.before[8] || '',
          marginalBefore5: physicalData.elongation.before[9] || '',
          sampleAfter1: physicalData.elongation.after[0] || '',
          sampleAfter2: physicalData.elongation.after[1] || '',
          sampleAfter3: physicalData.elongation.after[2] || '',
          sampleAfter4: physicalData.elongation.after[3] || '',
          sampleAfter5: physicalData.elongation.after[4] || '',
          marginalAfter1: physicalData.elongation.after[5] || '',
          marginalAfter2: physicalData.elongation.after[6] || '',
          marginalAfter3: physicalData.elongation.after[7] || '',
          marginalAfter4: physicalData.elongation.after[8] || '',
          marginalAfter5: physicalData.elongation.after[9] || '',
          elongationStatus: getSectionStatus('elongation'),
          notOkCount: rawReports['elongation'] ? (rawReports['elongation'].primaryOutCount + rawReports['elongation'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const modulusPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleBefore1: physicalData.modulus.before[0] || '',
          sampleBefore2: physicalData.modulus.before[1] || '',
          sampleBefore3: physicalData.modulus.before[2] || '',
          marginalBefore1: physicalData.modulus.before[3] || '',
          marginalBefore2: physicalData.modulus.before[4] || '',
          marginalBefore3: physicalData.modulus.before[5] || '',
          sampleAfter1: physicalData.modulus.after[0] || '',
          sampleAfter2: physicalData.modulus.after[1] || '',
          sampleAfter3: physicalData.modulus.after[2] || '',
          marginalAfter1: physicalData.modulus.after[3] || '',
          marginalAfter2: physicalData.modulus.after[4] || '',
          marginalAfter3: physicalData.modulus.after[5] || '',
          modulusStatus: getSectionStatus('modulus'),
          notOkCount: rawReports['modulus'] ? (rawReports['modulus'].primaryOutCount + rawReports['modulus'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const compressionPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleInitial1: physicalData.compression.initial[0] || '',
          sampleInitial2: physicalData.compression.initial[1] || '',
          sampleInitial3: physicalData.compression.initial[2] || '',
          marginalInitial1: physicalData.compression.initial[3] || '',
          marginalInitial2: physicalData.compression.initial[4] || '',
          marginalInitial3: physicalData.compression.initial[5] || '',
          sampleFinal1: physicalData.compression.final[0] || '',
          sampleFinal2: physicalData.compression.final[1] || '',
          sampleFinal3: physicalData.compression.final[2] || '',
          marginalFinal1: physicalData.compression.final[3] || '',
          marginalFinal2: physicalData.compression.final[4] || '',
          marginalFinal3: physicalData.compression.final[5] || '',
          compressionStatus: getSectionStatus('compression'),
          notOkCount: rawReports['compression'] ? (rawReports['compression'].primaryOutCount + rawReports['compression'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const tensionPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleInitial1: physicalData.tension.initial[0] || '',
          sampleInitial2: physicalData.tension.initial[1] || '',
          sampleInitial3: physicalData.tension.initial[2] || '',
          marginalInitial1: physicalData.tension.initial[3] || '',
          marginalInitial2: physicalData.tension.initial[4] || '',
          marginalInitial3: physicalData.tension.initial[5] || '',
          marginalInitial4: physicalData.tension.initial[6] || '',
          marginalInitial5: physicalData.tension.initial[7] || '',
          marginalInitial6: physicalData.tension.initial[8] || '',
          sampleFinal1: physicalData.tension.final[0] || '',
          sampleFinal2: physicalData.tension.final[1] || '',
          sampleFinal3: physicalData.tension.final[2] || '',
          marginalFinal1: physicalData.tension.final[3] || '',
          marginalFinal2: physicalData.tension.final[4] || '',
          marginalFinal3: physicalData.tension.final[5] || '',
          marginalFinal4: physicalData.tension.final[6] || '',
          marginalFinal5: physicalData.tension.final[7] || '',
          marginalFinal6: physicalData.tension.final[8] || '',
          tensionStatus: getSectionStatus('tension'),
          notOkCount: rawReports['tension'] ? (rawReports['tension'].primaryOutCount + rawReports['tension'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const loadReport = rawReports['load'];
        const loadStatusStr = getSectionStatus('load');

        const loadPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          load1: physicalData.loadTest?.loads?.[0] || '',
          load2: physicalData.loadTest?.loads?.[1] || '',
          load3: physicalData.loadTest?.loads?.[2] || '',
          load4: physicalData.loadTest?.loads?.[3] || '',
          load5: physicalData.loadTest?.loads?.[4] || '',
          load6: physicalData.loadTest?.loads?.[5] || '',
          load7: physicalData.loadTest?.loads?.[6] || '',
          load8: physicalData.loadTest?.loads?.[7] || '',
          pad1L1: physicalData.loadTest.pad1[0]?.left || '',
          pad1L2: physicalData.loadTest.pad1[1]?.left || '',
          pad1L3: physicalData.loadTest.pad1[2]?.left || '',
          pad1L4: physicalData.loadTest.pad1[3]?.left || '',
          pad1L5: physicalData.loadTest.pad1[4]?.left || '',
          pad1L6: physicalData.loadTest.pad1[5]?.left || '',
          pad1L7: physicalData.loadTest.pad1[6]?.left || '',
          pad1L8: physicalData.loadTest.pad1[7]?.left || '',
          pad1R1: physicalData.loadTest.pad1[0]?.right || '',
          pad1R2: physicalData.loadTest.pad1[1]?.right || '',
          pad1R3: physicalData.loadTest.pad1[2]?.right || '',
          pad1R4: physicalData.loadTest.pad1[3]?.right || '',
          pad1R5: physicalData.loadTest.pad1[4]?.right || '',
          pad1R6: physicalData.loadTest.pad1[5]?.right || '',
          pad1R7: physicalData.loadTest.pad1[6]?.right || '',
          pad1R8: physicalData.loadTest.pad1[7]?.right || '',
          pad2L1: physicalData.loadTest.pad2[0]?.left || '',
          pad2L2: physicalData.loadTest.pad2[1]?.left || '',
          pad2L3: physicalData.loadTest.pad2[2]?.left || '',
          pad2L4: physicalData.loadTest.pad2[3]?.left || '',
          pad2L5: physicalData.loadTest.pad2[4]?.left || '',
          pad2L6: physicalData.loadTest.pad2[5]?.left || '',
          pad2L7: physicalData.loadTest.pad2[6]?.left || '',
          pad2L8: physicalData.loadTest.pad2[7]?.left || '',
          pad2R1: physicalData.loadTest.pad2[0]?.right || '',
          pad2R2: physicalData.loadTest.pad2[1]?.right || '',
          pad2R3: physicalData.loadTest.pad2[2]?.right || '',
          pad2R4: physicalData.loadTest.pad2[3]?.right || '',
          pad2R5: physicalData.loadTest.pad2[4]?.right || '',
          pad2R6: physicalData.loadTest.pad2[5]?.right || '',
          pad2R7: physicalData.loadTest.pad2[6]?.right || '',
          pad2R8: physicalData.loadTest.pad2[7]?.right || '',
          mpad1L1: physicalData.loadTest.mPad1[0]?.left || '',
          mpad1L2: physicalData.loadTest.mPad1[1]?.left || '',
          mpad1L3: physicalData.loadTest.mPad1[2]?.left || '',
          mpad1L4: physicalData.loadTest.mPad1[3]?.left || '',
          mpad1L5: physicalData.loadTest.mPad1[4]?.left || '',
          mpad1L6: physicalData.loadTest.mPad1[5]?.left || '',
          mpad1L7: physicalData.loadTest.mPad1[6]?.left || '',
          mpad1L8: physicalData.loadTest.mPad1[7]?.left || '',
          mpad1R1: physicalData.loadTest.mPad1[0]?.right || '',
          mpad1R2: physicalData.loadTest.mPad1[1]?.right || '',
          mpad1R3: physicalData.loadTest.mPad1[2]?.right || '',
          mpad1R4: physicalData.loadTest.mPad1[3]?.right || '',
          mpad1R5: physicalData.loadTest.mPad1[4]?.right || '',
          mpad1R6: physicalData.loadTest.mPad1[5]?.right || '',
          mpad1R7: physicalData.loadTest.mPad1[6]?.right || '',
          mpad1R8: physicalData.loadTest.mPad1[7]?.right || '',
          mpad2L1: physicalData.loadTest.mPad2[0]?.left || '',
          mpad2L2: physicalData.loadTest.mPad2[1]?.left || '',
          mpad2L3: physicalData.loadTest.mPad2[2]?.left || '',
          mpad2L4: physicalData.loadTest.mPad2[3]?.left || '',
          mpad2L5: physicalData.loadTest.mPad2[4]?.left || '',
          mpad2L6: physicalData.loadTest.mPad2[5]?.left || '',
          mpad2L7: physicalData.loadTest.mPad2[6]?.left || '',
          mpad2L8: physicalData.loadTest.mPad2[7]?.left || '',
          mpad2R1: physicalData.loadTest.mPad2[0]?.right || '',
          mpad2R2: physicalData.loadTest.mPad2[1]?.right || '',
          mpad2R3: physicalData.loadTest.mPad2[2]?.right || '',
          mpad2R4: physicalData.loadTest.mPad2[3]?.right || '',
          mpad2R5: physicalData.loadTest.mPad2[4]?.right || '',
          mpad2R6: physicalData.loadTest.mPad2[5]?.right || '',
          mpad2R7: physicalData.loadTest.mPad2[6]?.right || '',
          mpad2R8: physicalData.loadTest.mPad2[7]?.right || '',
          mpad3L1: physicalData.loadTest.mPad3[0]?.left || '',
          mpad3L2: physicalData.loadTest.mPad3[1]?.left || '',
          mpad3L3: physicalData.loadTest.mPad3[2]?.left || '',
          mpad3L4: physicalData.loadTest.mPad3[3]?.left || '',
          mpad3L5: physicalData.loadTest.mPad3[4]?.left || '',
          mpad3L6: physicalData.loadTest.mPad3[5]?.left || '',
          mpad3L7: physicalData.loadTest.mPad3[6]?.left || '',
          mpad3L8: physicalData.loadTest.mPad3[7]?.left || '',
          mpad3R1: physicalData.loadTest.mPad3[0]?.right || '',
          mpad3R2: physicalData.loadTest.mPad3[1]?.right || '',
          mpad3R3: physicalData.loadTest.mPad3[2]?.right || '',
          mpad3R4: physicalData.loadTest.mPad3[3]?.right || '',
          mpad3R5: physicalData.loadTest.mPad3[4]?.right || '',
          mpad3R6: physicalData.loadTest.mPad3[5]?.right || '',
          mpad3R7: physicalData.loadTest.mPad3[6]?.right || '',
          mpad3R8: physicalData.loadTest.mPad3[7]?.right || '',
          mpad4L1: physicalData.loadTest.mPad4[0]?.left || '',
          mpad4L2: physicalData.loadTest.mPad4[1]?.left || '',
          mpad4L3: physicalData.loadTest.mPad4[2]?.left || '',
          mpad4L4: physicalData.loadTest.mPad4[3]?.left || '',
          mpad4L5: physicalData.loadTest.mPad4[4]?.left || '',
          mpad4L6: physicalData.loadTest.mPad4[5]?.left || '',
          mpad4L7: physicalData.loadTest.mPad4[6]?.left || '',
          mpad4L8: physicalData.loadTest.mPad4[7]?.left || '',
          mpad4R1: physicalData.loadTest.mPad4[0]?.right || '',
          mpad4R2: physicalData.loadTest.mPad4[1]?.right || '',
          mpad4R3: physicalData.loadTest.mPad4[2]?.right || '',
          mpad4R4: physicalData.loadTest.mPad4[3]?.right || '',
          mpad4R5: physicalData.loadTest.mPad4[4]?.right || '',
          mpad4R6: physicalData.loadTest.mPad4[5]?.right || '',
          mpad4R7: physicalData.loadTest.mPad4[6]?.right || '',
          mpad4R8: physicalData.loadTest.mPad4[7]?.right || '',
          loadStatus: loadStatusStr,
          notOkCount: loadReport ? (loadReport.primaryOutCount + loadReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const resReport = rawReports['resistance'];
        const resStatusStr = getSectionStatus('resistance');

        const electricalPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1BeforeForward: elecData.resistance[0]?.bF || '',
          s2BeforeForward: elecData.resistance[1]?.bF || '',
          s3BeforeForward: elecData.resistance[2]?.bF || '',
          m1BeforeForward: elecData.resistance[3]?.bF || '',
          m2BeforeForward: elecData.resistance[4]?.bF || '',
          m3BeforeForward: elecData.resistance[5]?.bF || '',
          m4BeforeForward: elecData.resistance[6]?.bF || '',
          m5BeforeForward: elecData.resistance[7]?.bF || '',
          m6BeforeForward: elecData.resistance[8]?.bF || '',
          s1BeforeReverse: elecData.resistance[0]?.bR || '',
          s2BeforeReverse: elecData.resistance[1]?.bR || '',
          s3BeforeReverse: elecData.resistance[2]?.bR || '',
          m1BeforeReverse: elecData.resistance[3]?.bR || '',
          m2BeforeReverse: elecData.resistance[4]?.bR || '',
          m3BeforeReverse: elecData.resistance[5]?.bR || '',
          m4BeforeReverse: elecData.resistance[6]?.bR || '',
          m5BeforeReverse: elecData.resistance[7]?.bR || '',
          m6BeforeReverse: elecData.resistance[8]?.bR || '',
          s1AfterForward: elecData.resistance[0]?.aF || '',
          s2AfterForward: elecData.resistance[1]?.aF || '',
          s3AfterForward: elecData.resistance[2]?.aF || '',
          m1AfterForward: elecData.resistance[3]?.aF || '',
          m2AfterForward: elecData.resistance[4]?.aF || '',
          m3AfterForward: elecData.resistance[5]?.aF || '',
          m4AfterForward: elecData.resistance[6]?.aF || '',
          m5AfterForward: elecData.resistance[7]?.aF || '',
          m6AfterForward: elecData.resistance[8]?.aF || '',
          s1AfterReverse: elecData.resistance[0]?.aR || '',
          s2AfterReverse: elecData.resistance[1]?.aR || '',
          s3AfterReverse: elecData.resistance[2]?.aR || '',
          m1AfterReverse: elecData.resistance[3]?.aR || '',
          m2AfterReverse: elecData.resistance[4]?.aR || '',
          m3AfterReverse: elecData.resistance[5]?.aR || '',
          m4AfterReverse: elecData.resistance[6]?.aR || '',
          m5AfterReverse: elecData.resistance[7]?.aR || '',
          m6AfterReverse: elecData.resistance[8]?.aR || '',
          electricalStatus: resStatusStr,
          notOkCount: resReport ? (resReport.primaryOutCount + resReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const sgReport = rawReports['sg'];
        const sgStatusStr = getSectionStatus('sg');

        const sgPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1AAir: elecData.sg.compoundA[0]?.air || '',
          s2AAir: elecData.sg.compoundA[1]?.air || '',
          s3AAir: elecData.sg.compoundA[2]?.air || '',
          m1AAir: elecData.sg.compoundA[3]?.air || '',
          m2AAir: elecData.sg.compoundA[4]?.air || '',
          m3AAir: elecData.sg.compoundA[5]?.air || '',
          m4AAir: elecData.sg.compoundA[6]?.air || '',
          m5AAir: elecData.sg.compoundA[7]?.air || '',
          m6AAir: elecData.sg.compoundA[8]?.air || '',
          s1AWater: elecData.sg.compoundA[0]?.water || '',
          s2AWater: elecData.sg.compoundA[1]?.water || '',
          s3AWater: elecData.sg.compoundA[2]?.water || '',
          m1AWater: elecData.sg.compoundA[3]?.water || '',
          m2AWater: elecData.sg.compoundA[4]?.water || '',
          m3AWater: elecData.sg.compoundA[5]?.water || '',
          m4AWater: elecData.sg.compoundA[6]?.water || '',
          m5AWater: elecData.sg.compoundA[7]?.water || '',
          m6AWater: elecData.sg.compoundA[8]?.water || '',
          s1BAir: elecData.sg.compoundB[0]?.air || '',
          s2BAir: elecData.sg.compoundB[1]?.air || '',
          s3BAir: elecData.sg.compoundB[2]?.air || '',
          m1BAir: elecData.sg.compoundB[3]?.air || '',
          m2BAir: elecData.sg.compoundB[4]?.air || '',
          m3BAir: elecData.sg.compoundB[5]?.air || '',
          m4BAir: elecData.sg.compoundB[6]?.air || '',
          m5BAir: elecData.sg.compoundB[7]?.air || '',
          m6BAir: elecData.sg.compoundB[8]?.air || '',
          s1BWater: elecData.sg.compoundB[0]?.water || '',
          s2BWater: elecData.sg.compoundB[1]?.water || '',
          s3BWater: elecData.sg.compoundB[2]?.water || '',
          m1BWater: elecData.sg.compoundB[3]?.water || '',
          m2BWater: elecData.sg.compoundB[4]?.water || '',
          m3BWater: elecData.sg.compoundB[5]?.water || '',
          m4BWater: elecData.sg.compoundB[6]?.water || '',
          m5BWater: elecData.sg.compoundB[7]?.water || '',
          m6BWater: elecData.sg.compoundB[8]?.water || '',
          sgStatus: sgStatusStr,
          notOkCount: sgReport ? (sgReport.primaryOutCount + sgReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ashReport = rawReports['ash'];
        const ashStatusStr = getSectionStatus('ash');
        const ashPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1ACrucible: elecData.ash.compoundA[0]?.crucible || '',
          s1ASample: elecData.ash.compoundA[0]?.sample || '',
          s1AAsh: elecData.ash.compoundA[0]?.ash || '',
          s2ACrucible: elecData.ash.compoundA[1]?.crucible || '',
          s2ASample: elecData.ash.compoundA[1]?.sample || '',
          s2AAsh: elecData.ash.compoundA[1]?.ash || '',
          s3ACrucible: elecData.ash.compoundA[2]?.crucible || '',
          s3ASample: elecData.ash.compoundA[2]?.sample || '',
          s3AAsh: elecData.ash.compoundA[2]?.ash || '',
          m1ACrucible: elecData.ash.compoundA[3]?.crucible || '',
          m1ASample: elecData.ash.compoundA[3]?.sample || '',
          m1AAsh: elecData.ash.compoundA[3]?.ash || '',
          m2ACrucible: elecData.ash.compoundA[4]?.crucible || '',
          m2ASample: elecData.ash.compoundA[4]?.sample || '',
          m2AAsh: elecData.ash.compoundA[4]?.ash || '',
          m3ACrucible: elecData.ash.compoundA[5]?.crucible || '',
          m3ASample: elecData.ash.compoundA[5]?.sample || '',
          m3AAsh: elecData.ash.compoundA[5]?.ash || '',
          m4ACrucible: elecData.ash.compoundA[6]?.crucible || '',
          m4ASample: elecData.ash.compoundA[6]?.sample || '',
          m4AAsh: elecData.ash.compoundA[6]?.ash || '',
          m5ACrucible: elecData.ash.compoundA[7]?.crucible || '',
          m5ASample: elecData.ash.compoundA[7]?.sample || '',
          m5AAsh: elecData.ash.compoundA[7]?.ash || '',
          m6ACrucible: elecData.ash.compoundA[8]?.crucible || '',
          m6ASample: elecData.ash.compoundA[8]?.sample || '',
          m6AAsh: elecData.ash.compoundA[8]?.ash || '',
          s1BCrucible: elecData.ash.compoundB[0]?.crucible || '',
          s1BSample: elecData.ash.compoundB[0]?.sample || '',
          s1BAsh: elecData.ash.compoundB[0]?.ash || '',
          s2BCrucible: elecData.ash.compoundB[1]?.crucible || '',
          s2BSample: elecData.ash.compoundB[1]?.sample || '',
          s2BAsh: elecData.ash.compoundB[1]?.ash || '',
          s3BCrucible: elecData.ash.compoundB[2]?.crucible || '',
          s3BSample: elecData.ash.compoundB[2]?.sample || '',
          s3BAsh: elecData.ash.compoundB[2]?.ash || '',
          m1BCrucible: elecData.ash.compoundB[3]?.crucible || '',
          m1BSample: elecData.ash.compoundB[3]?.sample || '',
          m1BAsh: elecData.ash.compoundB[3]?.ash || '',
          m2BCrucible: elecData.ash.compoundB[4]?.crucible || '',
          m2BSample: elecData.ash.compoundB[4]?.sample || '',
          m2BAsh: elecData.ash.compoundB[4]?.ash || '',
          m3BCrucible: elecData.ash.compoundB[5]?.crucible || '',
          m3BSample: elecData.ash.compoundB[5]?.sample || '',
          m3BAsh: elecData.ash.compoundB[5]?.ash || '',
          m4BCrucible: elecData.ash.compoundB[6]?.crucible || '',
          m4BSample: elecData.ash.compoundB[6]?.sample || '',
          m4BAsh: elecData.ash.compoundB[6]?.ash || '',
          m5BCrucible: elecData.ash.compoundB[7]?.crucible || '',
          m5BSample: elecData.ash.compoundB[7]?.sample || '',
          m5BAsh: elecData.ash.compoundB[7]?.ash || '',
          m6BCrucible: elecData.ash.compoundB[8]?.crucible || '',
          m6BSample: elecData.ash.compoundB[8]?.sample || '',
          m6BAsh: elecData.ash.compoundB[8]?.ash || '',
          ashStatus: ashStatusStr,
          notOkCount: ashReport ? (ashReport.primaryOutCount + ashReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const adhesionReport = rawReports['adhesion'];
        const adhesionStatusStr = getSectionStatus('adhesion');
        const adhesionPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sample1: specData.adhesion[0] || '',
          sample2: specData.adhesion[1] || '',
          marginal1: specData.adhesion[2] || '',
          marginal2: specData.adhesion[3] || '',
          marginal3: specData.adhesion[4] || '',
          marginal4: specData.adhesion[5] || '',
          adhesionStatus: adhesionStatusStr,
          notOkCount: adhesionReport ? (adhesionReport.primaryOutCount + adhesionReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const secantReport = rawReports['secant'];
        const secantStatusStr = getSectionStatus('secant');
        const secantPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1S20A: specData.secant[0]?.s20?.a || '',
          s1S20B: specData.secant[0]?.s20?.b || '',
          s1S20C: specData.secant[0]?.s20?.c || '',
          s1S20D: specData.secant[0]?.s20?.d || '',
          s1S90A: specData.secant[0]?.s90?.a || '',
          s1S90B: specData.secant[0]?.s90?.b || '',
          s1S90C: specData.secant[0]?.s90?.c || '',
          s1S90D: specData.secant[0]?.s90?.d || '',
          s2S20A: specData.secant[1]?.s20?.a || '',
          s2S20B: specData.secant[1]?.s20?.b || '',
          s2S20C: specData.secant[1]?.s20?.c || '',
          s2S20D: specData.secant[1]?.s20?.d || '',
          s2S90A: specData.secant[1]?.s90?.a || '',
          s2S90B: specData.secant[1]?.s90?.b || '',
          s2S90C: specData.secant[1]?.s90?.c || '',
          s2S90D: specData.secant[1]?.s90?.d || '',
          m1S20A: specData.secant[2]?.s20?.a || '',
          m1S20B: specData.secant[2]?.s20?.b || '',
          m1S20C: specData.secant[2]?.s20?.c || '',
          m1S20D: specData.secant[2]?.s20?.d || '',
          m1S90A: specData.secant[2]?.s90?.a || '',
          m1S90B: specData.secant[2]?.s90?.b || '',
          m1S90C: specData.secant[2]?.s90?.c || '',
          m1S90D: specData.secant[2]?.s90?.d || '',
          m2S20A: specData.secant[3]?.s20?.a || '',
          m2S20B: specData.secant[3]?.s20?.b || '',
          m2S20C: specData.secant[3]?.s20?.c || '',
          m2S20D: specData.secant[3]?.s20?.d || '',
          m2S90A: specData.secant[3]?.s90?.a || '',
          m2S90B: specData.secant[3]?.s90?.b || '',
          m2S90C: specData.secant[3]?.s90?.c || '',
          m2S90D: specData.secant[3]?.s90?.d || '',
          m3S20A: specData.secant[4]?.s20?.a || '',
          m3S20B: specData.secant[4]?.s20?.b || '',
          m3S20C: specData.secant[4]?.s20?.c || '',
          m3S20D: specData.secant[4]?.s20?.d || '',
          m3S90A: specData.secant[4]?.s90?.a || '',
          m3S90B: specData.secant[4]?.s90?.b || '',
          m3S90C: specData.secant[4]?.s90?.c || '',
          m3S90D: specData.secant[4]?.s90?.d || '',
          m4S20A: specData.secant[5]?.s20?.a || '',
          m4S20B: specData.secant[5]?.s20?.b || '',
          m4S20C: specData.secant[5]?.s20?.c || '',
          m4S20D: specData.secant[5]?.s20?.d || '',
          m4S90A: specData.secant[5]?.s90?.a || '',
          m4S90B: specData.secant[5]?.s90?.b || '',
          m4S90C: specData.secant[5]?.s90?.c || '',
          m4S90D: specData.secant[5]?.s90?.d || '',
          secantStatus: secantStatusStr,
          notOkCount: secantReport ? (secantReport.primaryOutCount + secantReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ncrAdhesionReport = rawReports['ncrAdhesion'];
        const ncrAdhesionStatusStr = getSectionStatus('ncrAdhesion');
        const ncrAdhesionPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1Peel: specData.ncrgrsp?.adhesion[0]?.peel || '',
          s1Hpull: specData.ncrgrsp?.adhesion[0]?.hpull || '',
          s2Peel: specData.ncrgrsp?.adhesion[1]?.peel || '',
          s2Hpull: specData.ncrgrsp?.adhesion[1]?.hpull || '',
          m1Peel: specData.ncrgrsp?.adhesion[2]?.peel || '',
          m1Hpull: specData.ncrgrsp?.adhesion[2]?.hpull || '',
          m2Peel: specData.ncrgrsp?.adhesion[3]?.peel || '',
          m2Hpull: specData.ncrgrsp?.adhesion[3]?.hpull || '',
          m3Peel: specData.ncrgrsp?.adhesion[4]?.peel || '',
          m3Hpull: specData.ncrgrsp?.adhesion[4]?.hpull || '',
          m4Peel: specData.ncrgrsp?.adhesion[5]?.peel || '',
          m4Hpull: specData.ncrgrsp?.adhesion[5]?.hpull || '',
          ncrAdhesionStatus: ncrAdhesionStatusStr,
          notOkCount: ncrAdhesionReport ? (ncrAdhesionReport.primaryOutCount + ncrAdhesionReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ncrBreakingReport = rawReports['ncrBreaking'];
        const ncrBreakingStatusStr = getSectionStatus('ncrBreaking');
        const ncrBreakingPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sample1: specData.ncrgrsp?.breaking[0] || '',
          sample2: specData.ncrgrsp?.breaking[1] || '',
          sample3: specData.ncrgrsp?.breaking[2] || '',
          sample4: specData.ncrgrsp?.breaking[3] || '',
          sample5: specData.ncrgrsp?.breaking[4] || '',
          marginal1: specData.ncrgrsp?.breaking[5] || '',
          marginal2: specData.ncrgrsp?.breaking[6] || '',
          marginal3: specData.ncrgrsp?.breaking[7] || '',
          marginal4: specData.ncrgrsp?.breaking[8] || '',
          marginal5: specData.ncrgrsp?.breaking[9] || '',
          marginal6: specData.ncrgrsp?.breaking[10] || '',
          marginal7: specData.ncrgrsp?.breaking[11] || '',
          marginal8: specData.ncrgrsp?.breaking[12] || '',
          marginal9: specData.ncrgrsp?.breaking[13] || '',
          marginal10: specData.ncrgrsp?.breaking[14] || '',
          ncrBreakingStatus: ncrBreakingStatusStr,
          notOkCount: ncrBreakingReport ? (ncrBreakingReport.primaryOutCount + ncrBreakingReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ncrCordReport = rawReports['ncrCord'];
        const ncrCordStatusStr = getSectionStatus('ncrCord');
        const ncrCordPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1Denier: specData.ncrgrsp?.nylonCord[0]?.denier || '',
          s1Epi: specData.ncrgrsp?.nylonCord[0]?.epi || '',
          s1Thickness: specData.ncrgrsp?.nylonCord[0]?.thickness || '',
          s1LoadAtBreak: specData.ncrgrsp?.nylonCord[0]?.loadAtBreak || '',
          s1Elongation: specData.ncrgrsp?.nylonCord[0]?.elongation || '',
          s1Twists: specData.ncrgrsp?.nylonCord[0]?.twists || '',
          s2Denier: specData.ncrgrsp?.nylonCord[1]?.denier || '',
          s2Epi: specData.ncrgrsp?.nylonCord[1]?.epi || '',
          s2Thickness: specData.ncrgrsp?.nylonCord[1]?.thickness || '',
          s2LoadAtBreak: specData.ncrgrsp?.nylonCord[1]?.loadAtBreak || '',
          s2Elongation: specData.ncrgrsp?.nylonCord[1]?.elongation || '',
          s2Twists: specData.ncrgrsp?.nylonCord[1]?.twists || '',
          s3Denier: specData.ncrgrsp?.nylonCord[2]?.denier || '',
          s3Epi: specData.ncrgrsp?.nylonCord[2]?.epi || '',
          s3Thickness: specData.ncrgrsp?.nylonCord[2]?.thickness || '',
          s3LoadAtBreak: specData.ncrgrsp?.nylonCord[2]?.loadAtBreak || '',
          s3Elongation: specData.ncrgrsp?.nylonCord[2]?.elongation || '',
          s3Twists: specData.ncrgrsp?.nylonCord[2]?.twists || '',
          m1Denier: specData.ncrgrsp?.nylonCord[3]?.denier || '',
          m1Epi: specData.ncrgrsp?.nylonCord[3]?.epi || '',
          m1Thickness: specData.ncrgrsp?.nylonCord[3]?.thickness || '',
          m1LoadAtBreak: specData.ncrgrsp?.nylonCord[3]?.loadAtBreak || '',
          m1Elongation: specData.ncrgrsp?.nylonCord[3]?.elongation || '',
          m1Twists: specData.ncrgrsp?.nylonCord[3]?.twists || '',
          m2Denier: specData.ncrgrsp?.nylonCord[4]?.denier || '',
          m2Epi: specData.ncrgrsp?.nylonCord[4]?.epi || '',
          m2Thickness: specData.ncrgrsp?.nylonCord[4]?.thickness || '',
          m2LoadAtBreak: specData.ncrgrsp?.nylonCord[4]?.loadAtBreak || '',
          m2Elongation: specData.ncrgrsp?.nylonCord[4]?.elongation || '',
          m2Twists: specData.ncrgrsp?.nylonCord[4]?.twists || '',
          m3Denier: specData.ncrgrsp?.nylonCord[5]?.denier || '',
          m3Epi: specData.ncrgrsp?.nylonCord[5]?.epi || '',
          m3Thickness: specData.ncrgrsp?.nylonCord[5]?.thickness || '',
          m3LoadAtBreak: specData.ncrgrsp?.nylonCord[5]?.loadAtBreak || '',
          m3Elongation: specData.ncrgrsp?.nylonCord[5]?.elongation || '',
          m3Twists: specData.ncrgrsp?.nylonCord[5]?.twists || '',
          m4Denier: specData.ncrgrsp?.nylonCord[6]?.denier || '',
          m4Epi: specData.ncrgrsp?.nylonCord[6]?.epi || '',
          m4Thickness: specData.ncrgrsp?.nylonCord[6]?.thickness || '',
          m4LoadAtBreak: specData.ncrgrsp?.nylonCord[6]?.loadAtBreak || '',
          m4Elongation: specData.ncrgrsp?.nylonCord[6]?.elongation || '',
          m4Twists: specData.ncrgrsp?.nylonCord[6]?.twists || '',
          m5Denier: specData.ncrgrsp?.nylonCord[7]?.denier || '',
          m5Epi: specData.ncrgrsp?.nylonCord[7]?.epi || '',
          m5Thickness: specData.ncrgrsp?.nylonCord[7]?.thickness || '',
          m5LoadAtBreak: specData.ncrgrsp?.nylonCord[7]?.loadAtBreak || '',
          m5Elongation: specData.ncrgrsp?.nylonCord[7]?.elongation || '',
          m5Twists: specData.ncrgrsp?.nylonCord[7]?.twists || '',
          m6Denier: specData.ncrgrsp?.nylonCord[8]?.denier || '',
          m6Epi: specData.ncrgrsp?.nylonCord[8]?.epi || '',
          m6Thickness: specData.ncrgrsp?.nylonCord[8]?.thickness || '',
          m6LoadAtBreak: specData.ncrgrsp?.nylonCord[8]?.loadAtBreak || '',
          m6Elongation: specData.ncrgrsp?.nylonCord[8]?.elongation || '',
          m6Twists: specData.ncrgrsp?.nylonCord[8]?.twists || '',
          ncrCordStatus: ncrCordStatusStr,
          notOkCount: ncrCordReport ? (ncrCordReport.primaryOutCount + ncrCordReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        console.log('Saving all submodule results in parallel...');
        setSubmitMessage('Saving Inspection Data...');
        const savePromises = [
          finalInspectionLotResultsService.save(savePayload),
          finalVisualDimensionalInspectionService.save(visualDimPayload),
          finalWeightTestService.save(weightTestPayload),
          finalHardnessTestService.save(hardnessPayload),
          finalTensileStrengthService.save(tensilePayload),
          finalElongationService.save(elongationPayload),
          finalModulusService.save(modulusPayload),
          finalCompressionSetService.save(compressionPayload),
          finalTensionSetService.save(tensionPayload),
          finalLoadTestService.save(loadPayload),
          finalElectricalResistanceService.save(electricalPayload),
          finalSpecificGravityService.save(sgPayload),
          finalAshContentService.save(ashPayload),
          finalAdhesionService.save(adhesionPayload),
          finalSecantStiffnessService.save(secantPayload)
        ];

        if (isNCRGRSP) {
          savePromises.push(
            finalNcrAdhesionService.save(ncrAdhesionPayload),
            finalNcrBreakingLoadService.save(ncrBreakingPayload),
            finalNcrNylonCordService.save(ncrCordPayload)
          );
        }

        const resilienceReport = rawReports['resilience'];
        const resilienceStatusStr = getSectionStatus('resilience');
        const resiliencePayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1Impact1: physicalData.resilience[0]?.i1 || '',
          s1Impact2: physicalData.resilience[0]?.i2 || '',
          s1Impact3: physicalData.resilience[0]?.i3 || '',
          s1Impact4: physicalData.resilience[0]?.i4 || '',
          s1Impact5: physicalData.resilience[0]?.i5 || '',
          s1Impact6: physicalData.resilience[0]?.i6 || '',
          s2Impact1: physicalData.resilience[1]?.i1 || '',
          s2Impact2: physicalData.resilience[1]?.i2 || '',
          s2Impact3: physicalData.resilience[1]?.i3 || '',
          s2Impact4: physicalData.resilience[1]?.i4 || '',
          s2Impact5: physicalData.resilience[1]?.i5 || '',
          s2Impact6: physicalData.resilience[1]?.i6 || '',
          s3Impact1: physicalData.resilience[2]?.i1 || '',
          s3Impact2: physicalData.resilience[2]?.i2 || '',
          s3Impact3: physicalData.resilience[2]?.i3 || '',
          s3Impact4: physicalData.resilience[2]?.i4 || '',
          s3Impact5: physicalData.resilience[2]?.i5 || '',
          s3Impact6: physicalData.resilience[2]?.i6 || '',
          resilienceStatus: resilienceStatusStr,
          notOkCount: resilienceReport ? (resilienceReport.primaryOutCount + resilienceReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ozoneReport = rawReports['ozone'];
        const ozoneStatusStr = getSectionStatus('ozone');
        const ozonePayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          initialLength: elecData.ozone[0]?.initial || '',
          stretchedLength: elecData.ozone[0]?.stretched || '',
          observation: elecData.ozone[0]?.obs || '',
          ozoneStatus: ozoneStatusStr,
          notOkCount: ozoneReport ? (ozoneReport.primaryOutCount + ozoneReport.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const tgaPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          dateOfLastTest: periodicData.tga.dateOfLastTest,
          qtyProducedSinceLastTest: periodicData.tga.qtyProduced ? parseInt(periodicData.tga.qtyProduced, 10) : null,
          s1LotNo: periodicData.tga.samples[0]?.lotNo || '',
          s1SampleNo: periodicData.tga.samples[0]?.sampleNo || '',
          s1SampleWt: periodicData.tga.samples[0]?.weight || '',
          s1TempRange: periodicData.tga.samples[0]?.tempRange || '',
          s1PolymerContent: periodicData.tga.samples[0]?.polymer || '',
          s2LotNo: periodicData.tga.samples[1]?.lotNo || '',
          s2SampleNo: periodicData.tga.samples[1]?.sampleNo || '',
          s2SampleWt: periodicData.tga.samples[1]?.weight || '',
          s2TempRange: periodicData.tga.samples[1]?.tempRange || '',
          s2PolymerContent: periodicData.tga.samples[1]?.polymer || '',
          s3LotNo: periodicData.tga.samples[2]?.lotNo || '',
          s3SampleNo: periodicData.tga.samples[2]?.sampleNo || '',
          s3SampleWt: periodicData.tga.samples[2]?.weight || '',
          s3TempRange: periodicData.tga.samples[2]?.tempRange || '',
          s3PolymerContent: periodicData.tga.samples[2]?.polymer || '',
          s4LotNo: periodicData.tga.samples[3]?.lotNo || '',
          s4SampleNo: periodicData.tga.samples[3]?.sampleNo || '',
          s4SampleWt: periodicData.tga.samples[3]?.weight || '',
          s4TempRange: periodicData.tga.samples[3]?.tempRange || '',
          s4PolymerContent: periodicData.tga.samples[3]?.polymer || '',
          s5LotNo: periodicData.tga.samples[4]?.lotNo || '',
          s5SampleNo: periodicData.tga.samples[4]?.sampleNo || '',
          s5SampleWt: periodicData.tga.samples[4]?.weight || '',
          s5TempRange: periodicData.tga.samples[4]?.tempRange || '',
          s5PolymerContent: periodicData.tga.samples[4]?.polymer || '',
          tgaStatus: getSectionStatus('tga'),
          remarks: remarks || ''
        };

        const durabilityPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          dateOfLastTest: periodicData.durability.dateOfLastTest,
          qtyProducedSinceLastTest: periodicData.durability.qtyProduced ? parseInt(periodicData.durability.qtyProduced, 10) : null,
          s1LotNo: periodicData.durability.samples[0]?.lotNo || '',
          s1InitialThickness: periodicData.durability.samples[0]?.initialThick || '',
          s1FinalThickness: periodicData.durability.samples[0]?.finalThick || '',
          s1InitialLoadComp: periodicData.durability.samples[0]?.initialLoad || '',
          s1FinalLoadComp: periodicData.durability.samples[0]?.finalLoad || '',
          s2LotNo: periodicData.durability.samples[1]?.lotNo || '',
          s2InitialThickness: periodicData.durability.samples[1]?.initialThick || '',
          s2FinalThickness: periodicData.durability.samples[1]?.finalThick || '',
          s2InitialLoadComp: periodicData.durability.samples[1]?.initialLoad || '',
          s2FinalLoadComp: periodicData.durability.samples[1]?.finalLoad || '',
          s3LotNo: periodicData.durability.samples[2]?.lotNo || '',
          s3InitialThickness: periodicData.durability.samples[2]?.initialThick || '',
          s3FinalThickness: periodicData.durability.samples[2]?.finalThick || '',
          s3InitialLoadComp: periodicData.durability.samples[2]?.initialLoad || '',
          s3FinalLoadComp: periodicData.durability.samples[2]?.finalLoad || '',
          s4LotNo: periodicData.durability.samples[3]?.lotNo || '',
          s4InitialThickness: periodicData.durability.samples[3]?.initialThick || '',
          s4FinalThickness: periodicData.durability.samples[3]?.finalThick || '',
          s4InitialLoadComp: periodicData.durability.samples[3]?.initialLoad || '',
          s4FinalLoadComp: periodicData.durability.samples[3]?.finalLoad || '',
          s5LotNo: periodicData.durability.samples[4]?.lotNo || '',
          s5InitialThickness: periodicData.durability.samples[4]?.initialThick || '',
          s5FinalThickness: periodicData.durability.samples[4]?.finalThick || '',
          s5InitialLoadComp: periodicData.durability.samples[4]?.initialLoad || '',
          s5FinalLoadComp: periodicData.durability.samples[4]?.finalLoad || '',
          durabilityStatus: getSectionStatus('durability'),
          remarks: remarks || ''
        };

        const abrasionPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          dateOfLastTest: periodicData.abrasion.dateOfLastTest,
          qtyProducedSinceLastTest: periodicData.abrasion.qtyProduced ? parseInt(periodicData.abrasion.qtyProduced, 10) : null,
          s1LotNo: periodicData.abrasion.samples[0]?.lotNo || '',
          s1SampleNo: periodicData.abrasion.samples[0]?.sampleNo || '',
          s1InitialMass: periodicData.abrasion.samples[0]?.initialMass || '',
          s1FinalMass: periodicData.abrasion.samples[0]?.finalMass || '',
          s1RelativeLoss: periodicData.abrasion.samples[0]?.relativeLoss || '',
          s2LotNo: periodicData.abrasion.samples[1]?.lotNo || '',
          s2SampleNo: periodicData.abrasion.samples[1]?.sampleNo || '',
          s2InitialMass: periodicData.abrasion.samples[1]?.initialMass || '',
          s2FinalMass: periodicData.abrasion.samples[1]?.finalMass || '',
          s2RelativeLoss: periodicData.abrasion.samples[1]?.relativeLoss || '',
          s3LotNo: periodicData.abrasion.samples[2]?.lotNo || '',
          s3SampleNo: periodicData.abrasion.samples[2]?.sampleNo || '',
          s3InitialMass: periodicData.abrasion.samples[2]?.initialMass || '',
          s3FinalMass: periodicData.abrasion.samples[2]?.finalMass || '',
          s3RelativeLoss: periodicData.abrasion.samples[2]?.relativeLoss || '',
          s4LotNo: periodicData.abrasion.samples[3]?.lotNo || '',
          s4SampleNo: periodicData.abrasion.samples[3]?.sampleNo || '',
          s4InitialMass: periodicData.abrasion.samples[3]?.initialMass || '',
          s4FinalMass: periodicData.abrasion.samples[3]?.finalMass || '',
          s4RelativeLoss: periodicData.abrasion.samples[3]?.relativeLoss || '',
          s5LotNo: periodicData.abrasion.samples[4]?.lotNo || '',
          s5SampleNo: periodicData.abrasion.samples[4]?.sampleNo || '',
          s5InitialMass: periodicData.abrasion.samples[4]?.initialMass || '',
          s5FinalMass: periodicData.abrasion.samples[4]?.finalMass || '',
          s5RelativeLoss: periodicData.abrasion.samples[4]?.relativeLoss || '',
          abrasionStatus: getSectionStatus('abrasion'),
          remarks: remarks || ''
        };

        savePromises.push(
          finalResilienceTestService.save(resiliencePayload),
          finalOzoneTestService.save(ozonePayload),
          finalPeriodicTgaService.save(tgaPayload),
          finalPeriodicDurabilityService.save(durabilityPayload),
          finalPeriodicAbrasionService.save(abrasionPayload)
        );

        const otherLotsFinish = lots.filter(l => l.id !== selectedLot);
        for (const oLot of otherLotsFinish) {
          const oDraftKey = `railpad_draft_${currentCallId}_${oLot.id}`;
          const oDraftSaved = localStorage.getItem(oDraftKey);
          if (oDraftSaved) {
            try {
              const oDraft = JSON.parse(oDraftSaved);
              savePromises.push(...buildOtherLotSavePromises(oLot, oDraft));
            } catch (err) {
              console.error(`Error saving other lot ${oLot.id}:`, err);
            }
          }
        }

        await Promise.all(savePromises);
        setDbDimensionalStatus(dimensionalResult);

        // Save captured inspection photos
        if (capturedImages && capturedImages.length > 0) {
          try {
            await saveCallImages(currentCallId, {
              typeOfCall: 'RAILPAD_FINAL',
              capturedImages,
              shift: call?.shift || 'A',
              dateOfInspection: formattedDate,
              userId: userId ? String(userId) : '0'
            });
            await saveImages(`railpad_final_images_${currentCallId}`, capturedImages);
          } catch (imgErr) {
            console.error('Error saving captured images on finish:', imgErr);
          }
        }

        setSubmitMessage('Finishing Inspection...');
        const workflowActionData = {
          workflowTransitionId: call?.workflowTransitionId || call?.id,
          requestId: currentCallId,
          action: 'FINISH',
          remarks: remarks || `Inspection completed with status: ${activeLotOverallStatus}`,
          actionBy: userId,
          pincode: call?.pincode || '560001',
          dateOfInspection: formattedDate
        };

        await performTransitionAction(workflowActionData);

        const updatedLots = lots.map(l => {
          if (l.id === selectedLot) {
            return {
              ...l,
              status: activeLotOverallStatus === 'ACCEPTED' ? 'Passed'
                : activeLotOverallStatus === 'RE-OFFERED' ? 'RE-OFFERED'
                : 'Rejected'
            };
          }
          return l;
        });
        setLots(updatedLots);
        setIsDirty(false);
        setIsSubmitting(false);

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`railpad_draft_${currentCallId}_`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem(`railpad_selected_lot_${currentCallId}`);
        localStorage.removeItem(`railpad_call_hologram_${currentCallId}`);
        localStorage.removeItem(`railpad_call_sealing_type_${currentCallId}`);
        showNotification(`Inspection finished successfully. All inspected lots have been saved.`, 'success');
        if (onPauseComplete) {
          setTimeout(() => {
            onPauseComplete();
          }, 1000);
        }
      } catch (error) {
        console.error('Error during finish inspection:', error);
        setIsSubmitting(false);
        let userMessage = 'Unable to finish the inspection at this time. Please try again later.';
        if (error.message) {
          if (error.message.includes('Failed to fetch') || error.message.includes('Network') || error.message.includes('network')) {
            userMessage = 'Network issue detected. Please check your connection and try again.';
          } else if (error.message.includes('save') || error.message.includes('Save')) {
            userMessage = 'Some inspection data could not be saved. Please retry the operation.';
          } else if (error.message.includes('already') || error.message.includes('processed') || error.message.includes('finished')) {
            userMessage = error.message;
          }
        }
        showNotification(userMessage, 'error');
      }
    } else if (actionType === 'DRAFT' || actionType === 'PAUSE') {
      try {
        setIsSubmitting(true);
        setSubmitMessage(actionType === 'DRAFT' ? 'Saving Draft to Database...' : 'Saving Inspection Data...');
        // Save the data to backend API
        let hologramStr = '';
        if (sealingType === 'RITES_HOLOGRAM' && hologramEntries.length > 0) {
          hologramStr = hologramEntries.map(h => {
            if (h.type === 'range') {
              return `${h.from}-${h.to}`;
            } else {
              return h.value;
            }
          }).join(',');
        }

        const visualStatus = visualResult;
        const dimensionalStatus = dimensionalResult;
        const physicalStatus = physicalDecision === 'LOT PASSED' ? 'PASS' : physicalDecision === 'PENDING VERIFICATION' ? 'PENDING' : physicalDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
        const elecStatus = elecDecision === 'LOT PASSED' ? 'PASS' : elecDecision === 'PENDING VERIFICATION' ? 'PENDING' : elecDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
        const specStatus = specDecision === 'LOT PASSED' ? 'PASS' : specDecision === 'PENDING VERIFICATION' ? 'PENDING' : specDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
        const ncrStatus = ncrDecision === 'LOT PASSED' ? 'PASS' : ncrDecision === 'PENDING VERIFICATION' ? 'PENDING' : ncrDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';

        // Accepted / Rejected qty is determined by ONLY 3 sections:
        // Visual Inspection, Dimensional Inspection, Weight Test.
        // Priority: RE-OFFERED (dimensional) > PENDING > ACCEPTED > REJECTED
        const isDimensionalReOffered = dimensionalStatus === 'RE-OFFERED' || dimensionalStatus === 'RE-OFFER';
        const isWeightPass = isNCRGRSP ? true : (weightStatus === 'ACCEPTED');
        const isWeightPending = isNCRGRSP ? false : (!isWeightPass && weightStatus !== 'REJECTED');
        const isAllCorePass = visualStatus === 'PASS' && dimensionalStatus === 'PASS' && isWeightPass;
        // PENDING check covers ALL sections - if any section (incl. Physical/Elec/Spec) is not yet done, lot stays PENDING
        const isAnyCorePending = visualStatus === 'PENDING'
          || (dimensionalStatus === 'PENDING' && !isDimensionalReOffered)
          || isWeightPending
          || physicalStatus === 'PENDING' || physicalStatus === 'RE-TEST'
          || elecStatus === 'PENDING' || elecStatus === 'RE-TEST'
          || specStatus === 'PENDING' || specStatus === 'RE-TEST'
          || (isNCRGRSP && (ncrStatus === 'PENDING' || ncrStatus === 'RE-TEST'));

        let activeLotOverallStatus = 'PENDING';
        let acceptedQty = 0;
        let rejectedQty = 0;
        const offeredQty = activeLot?.size || 0;

        if (isDimensionalReOffered) {
          // Dimensional re-offered → lot is RE-OFFERED, both qty = 0
          activeLotOverallStatus = 'RE-OFFERED';
          acceptedQty = 0;
          rejectedQty = 0;
        } else if (isAnyCorePending) {
          // Any section still pending / in-progress → lot is PENDING
          activeLotOverallStatus = 'PENDING';
          acceptedQty = 0;
          rejectedQty = 0;
        } else if (isAllCorePass) {
          // All sections pass → lot ACCEPTED
          activeLotOverallStatus = 'ACCEPTED';
          acceptedQty = offeredQty;
          rejectedQty = 0;
        } else {
          // Any of the sections failed / not pass → lot REJECTED
          activeLotOverallStatus = 'REJECTED';
          acceptedQty = 0;
          rejectedQty = offeredQty;
        }

        // Convert dateOfInspection format if present
        let formattedDate = null;
        if (call?.dateOfInspection) {
          if (Array.isArray(call.dateOfInspection) && call.dateOfInspection.length >= 3) {
            const year = call.dateOfInspection[0];
            const month = String(call.dateOfInspection[1]).padStart(2, '0');
            const day = String(call.dateOfInspection[2]).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          } else {
            try {
              formattedDate = new Date(call.dateOfInspection).toISOString().split('T')[0];
            } catch (e) {
              formattedDate = new Date().toISOString().split('T')[0];
            }
          }
        } else {
          formattedDate = new Date().toISOString().split('T')[0];
        }

        const currentUserObj = getStoredUser();
        const userId = currentUserObj?.userId || 0;

        const localActiveSections = [
          'hardness', 'tensile', 'elongation', 'modulus', 'compression', 'tension', 'load',
          'resistance', 'sg', 'ash', 'adhesion', 'secant', 'resilience', 'ozone'
        ];
        if (isNCRGRSP) {
          localActiveSections.push('ncrAdhesion', 'ncrBreaking', 'ncrCord');
        }

        const isTgaMandatory = parseInt(periodicData?.tga?.qtyProduced || 0, 10) >= 30000;
        const isDurabilityMandatory = parseInt(periodicData?.durability?.qtyProduced || 0, 10) >= 100000;
        const isAbrasionMandatory = parseInt(periodicData?.abrasion?.qtyProduced || 0, 10) >= 100000;
        if (isTgaMandatory) localActiveSections.push('tga');
        if (isDurabilityMandatory) localActiveSections.push('durability');
        if (isAbrasionMandatory) localActiveSections.push('abrasion');

        const localRawReports = {};
        localActiveSections.forEach(key => {
          localRawReports[key] = getSectionRawInfo(key);
        });

        const localOutOfSpecPrimary = localActiveSections.filter(key => {
          const rep = localRawReports[key];
          return rep && rep.primaryFilled === rep.primaryCount && rep.primaryOutCount > 0;
        });
        const localShowMarginal = localOutOfSpecPrimary.length === 1;
        const localMarginalKey = localShowMarginal ? localOutOfSpecPrimary[0] : null;

        const hasLocalTgaQtyPause = periodicData?.tga?.qtyProduced !== '' && periodicData?.tga?.qtyProduced !== null && periodicData?.tga?.qtyProduced !== undefined;
        const hasLocalDurabilityQtyPause = periodicData?.durability?.qtyProduced !== '' && periodicData?.durability?.qtyProduced !== null && periodicData?.durability?.qtyProduced !== undefined;
        const hasLocalAbrasionQtyPause = periodicData?.abrasion?.qtyProduced !== '' && periodicData?.abrasion?.qtyProduced !== null && periodicData?.abrasion?.qtyProduced !== undefined;

        const isLocalTgaMandatoryPause = hasLocalTgaQtyPause && parseInt(periodicData?.tga?.qtyProduced || 0, 10) >= 30000;
        const isLocalDurabilityMandatoryPause = hasLocalDurabilityQtyPause && parseInt(periodicData?.durability?.qtyProduced || 0, 10) >= 100000;
        const isLocalAbrasionMandatoryPause = hasLocalAbrasionQtyPause && parseInt(periodicData?.abrasion?.qtyProduced || 0, 10) >= 100000;

        const localGetSectionStatus = (key) => {
          const rep = localRawReports[key];
          if (!rep) return 'PENDING';

          if (key === 'tga') {
            if (!hasLocalTgaQtyPause) return 'PENDING';
            if (!isLocalTgaMandatoryPause) {
              if (rep.primaryFilled === 0) return 'BYPASSED';
              if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
              return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
            }
          }
          if (key === 'durability') {
            if (!hasLocalDurabilityQtyPause) return 'PENDING';
            if (!isLocalDurabilityMandatoryPause) {
              if (rep.primaryFilled === 0) return 'BYPASSED';
              if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
              return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
            }
          }
          if (key === 'abrasion') {
            if (!hasLocalAbrasionQtyPause) return 'PENDING';
            if (!isLocalAbrasionMandatoryPause) {
              if (rep.primaryFilled === 0) return 'BYPASSED';
              if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
              return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
            }
          }

          if (rep.primaryFilled < rep.primaryCount) {
            return rep.primaryFilled > 0 ? 'UNDER TESTING' : 'PENDING';
          }
          if (rep.primaryOutCount === 0) return 'PASS';
          if (key === localMarginalKey) {
            if (rep.doubleFilled < rep.doubleCount) {
              return rep.doubleFilled > 0 ? 'UNDER TESTING' : 'PENDING';
            } else {
              return rep.doubleOutCount === 0 ? 'PASS' : 'FAIL';
            }
          } else {
            return 'FAIL';
          }
        };

        const sectionResultsPayload = [
          {
            sectionKey: 'visual',
            sectionName: 'Visual Inspection',
            sampleSize: String(visualData.visualN || 25),
            status: visualResult
          },
          {
            sectionKey: 'dimensional',
            sectionName: 'Dimensional Inspection',
            sampleSize: String(visualData.dimN || 25),
            status: dimensionalResult
          },
          ...(!isNCRGRSP ? [{
            sectionKey: 'weight',
            sectionName: 'Weight Test',
            sampleSize: String((weightData.isSecondActive || showWeightSecond) ? `${weightData.n1} + ${weightData.n2}` : weightData.n1),
            status: weightStatus === 'ACCEPTED' ? 'PASS' : weightStatus === 'REJECTED' ? 'FAIL' : weightStatus
          }] : []),
          ...localActiveSections.map(k => {
            const rep = localRawReports[k];
            const name = SECTION_CONFIG[k]?.name || k;
            const size = (rep && (rep.doubleFilled > 0 || k === localMarginalKey)) ? `${rep.primaryCount} + ${rep.doubleCount}` : (rep ? rep.primaryCount : 0);
            return {
              sectionKey: k,
              sectionName: name,
              sampleSize: String(size),
              status: localGetSectionStatus(k)
            };
          })
        ];

        const savePayload = {
          callNo: currentCallId,
          shift: call?.shift || 'A',
          dateOfInspection: formattedDate,
          plantId: call?.plantId || 'N/A',
          rlyPoSrNo: call?.rlyPoSrNo || 'N/A',
          vendorName: call?.vendorName || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          railpadType: activeRailpadType,
          lotNo: selectedLot,
          offeredQty: (isNCRGRSP && ncrSetsOffered !== '') ? parseInt(ncrSetsOffered, 10) : offeredQty,
          acceptedQty: (isNCRGRSP && ncrSetsAccepted !== '') ? parseInt(ncrSetsAccepted, 10) : acceptedQty,
          rejectedQty: (isNCRGRSP && ncrSetsRejected !== '') ? parseInt(ncrSetsRejected, 10) : rejectedQty,
          visualDimensionalStatus: visualStatus,
          physicalAgeingPropertiesStatus: physicalStatus,
          electricalChemicalStatus: elecStatus,
          dynamicDurabilityTestStatus: specStatus,
          ncrgrspStatus: isNCRGRSP ? ncrStatus : null,
          overallStatus: activeLotOverallStatus,
          hologram: hologramStr,
          remarks: remarks || '',
          userId: userId ? parseInt(userId, 10) : null,
          sectionResults: sectionResultsPayload
        };

        const currentVisualN = isNCRGRSP ? getVisualDimSampleSize(lots.find(l => l.id === selectedLot)) : (visualData.visualN || 25);
        const currentDimN = isNCRGRSP ? getVisualDimSampleSize(lots.find(l => l.id === selectedLot)) : (visualData.dimN || 25);

        const visualDimPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          visualSamples: currentVisualN,
          visualNotOk: visualData.dv !== '' ? parseInt(visualData.dv, 10) : 0,
          visualReason: visualData.visualReason || '',
          visualResult: visualResult,
          dimensionalSamples: currentDimN,
          dimensionalNotOk: visualData.dd !== '' ? parseInt(visualData.dd, 10) : 0,
          dimensionalReason: visualData.dimReason || '',
          dimensionalResult: dimensionalResult,
          totalRejected: (visualData.dv !== '' ? parseInt(visualData.dv, 10) : 0) + (visualData.dd !== '' ? parseInt(visualData.dd, 10) : 0)
        };

        const weightSamplesList = [];
        weightData.samples1.forEach((val, index) => {
          if (val !== '' && val !== null && val !== undefined) {
            const parsedVal = parseFloat(val);
            weightSamplesList.push({ samplingNo: 1, sampleNo: index + 1, sampleValue: parsedVal, isRejected: parsedVal > weightData.max });
          }
        });
        weightData.samples2.forEach((val, index) => {
          if (val !== '' && val !== null && val !== undefined) {
            const parsedVal = parseFloat(val);
            weightSamplesList.push({ samplingNo: 2, sampleNo: index + 1, sampleValue: parsedVal, isRejected: parsedVal > weightData.max });
          }
        });

        const weightTestPayload = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          weightMin: weightData.min,
          weightMax: weightData.max,
          weightStatus: weightStatus === 'ACCEPTED' ? 'PASS' : weightStatus === 'REJECTED' ? 'FAIL' : weightStatus,
          samples: weightSamplesList
        };

        const hardnessPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleA1: physicalData.hardness.compoundA[0] || '',
          sampleA2: physicalData.hardness.compoundA[1] || '',
          sampleA3: physicalData.hardness.compoundA[2] || '',
          sampleA4: physicalData.hardness.compoundA[3] || '',
          sampleA5: physicalData.hardness.compoundA[4] || '',
          marginalA1: physicalData.hardness.compoundA[5] || '',
          marginalA2: physicalData.hardness.compoundA[6] || '',
          marginalA3: physicalData.hardness.compoundA[7] || '',
          marginalA4: physicalData.hardness.compoundA[8] || '',
          marginalA5: physicalData.hardness.compoundA[9] || '',
          sampleB1: physicalData.hardness.compoundB[0] || '',
          sampleB2: physicalData.hardness.compoundB[1] || '',
          sampleB3: physicalData.hardness.compoundB[2] || '',
          sampleB4: physicalData.hardness.compoundB[3] || '',
          sampleB5: physicalData.hardness.compoundB[4] || '',
          marginalB1: physicalData.hardness.compoundB[5] || '',
          marginalB2: physicalData.hardness.compoundB[6] || '',
          marginalB3: physicalData.hardness.compoundB[7] || '',
          marginalB4: physicalData.hardness.compoundB[8] || '',
          marginalB5: physicalData.hardness.compoundB[9] || '',
          hardnessStatus: getSectionStatus('hardness'),
          notOkCount: localRawReports['hardness'] ? (localRawReports['hardness'].primaryOutCount + localRawReports['hardness'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const tensilePayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleBefore1: physicalData.tensile.before[0] || '',
          sampleBefore2: physicalData.tensile.before[1] || '',
          sampleBefore3: physicalData.tensile.before[2] || '',
          sampleBefore4: physicalData.tensile.before[3] || '',
          sampleBefore5: physicalData.tensile.before[4] || '',
          marginalBefore1: physicalData.tensile.before[5] || '',
          marginalBefore2: physicalData.tensile.before[6] || '',
          marginalBefore3: physicalData.tensile.before[7] || '',
          marginalBefore4: physicalData.tensile.before[8] || '',
          marginalBefore5: physicalData.tensile.before[9] || '',
          sampleAfter1: physicalData.tensile.after[0] || '',
          sampleAfter2: physicalData.tensile.after[1] || '',
          sampleAfter3: physicalData.tensile.after[2] || '',
          sampleAfter4: physicalData.tensile.after[3] || '',
          sampleAfter5: physicalData.tensile.after[4] || '',
          marginalAfter1: physicalData.tensile.after[5] || '',
          marginalAfter2: physicalData.tensile.after[6] || '',
          marginalAfter3: physicalData.tensile.after[7] || '',
          marginalAfter4: physicalData.tensile.after[8] || '',
          marginalAfter5: physicalData.tensile.after[9] || '',
          tensileStatus: getSectionStatus('tensile'),
          notOkCount: localRawReports['tensile'] ? (localRawReports['tensile'].primaryOutCount + localRawReports['tensile'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const elongationPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleBefore1: physicalData.elongation.before[0] || '',
          sampleBefore2: physicalData.elongation.before[1] || '',
          sampleBefore3: physicalData.elongation.before[2] || '',
          sampleBefore4: physicalData.elongation.before[3] || '',
          sampleBefore5: physicalData.elongation.before[4] || '',
          marginalBefore1: physicalData.elongation.before[5] || '',
          marginalBefore2: physicalData.elongation.before[6] || '',
          marginalBefore3: physicalData.elongation.before[7] || '',
          marginalBefore4: physicalData.elongation.before[8] || '',
          marginalBefore5: physicalData.elongation.before[9] || '',
          sampleAfter1: physicalData.elongation.after[0] || '',
          sampleAfter2: physicalData.elongation.after[1] || '',
          sampleAfter3: physicalData.elongation.after[2] || '',
          sampleAfter4: physicalData.elongation.after[3] || '',
          sampleAfter5: physicalData.elongation.after[4] || '',
          marginalAfter1: physicalData.elongation.after[5] || '',
          marginalAfter2: physicalData.elongation.after[6] || '',
          marginalAfter3: physicalData.elongation.after[7] || '',
          marginalAfter4: physicalData.elongation.after[8] || '',
          marginalAfter5: physicalData.elongation.after[9] || '',
          elongationStatus: getSectionStatus('elongation'),
          notOkCount: localRawReports['elongation'] ? (localRawReports['elongation'].primaryOutCount + localRawReports['elongation'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const modulusPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleBefore1: physicalData.modulus.before[0] || '',
          sampleBefore2: physicalData.modulus.before[1] || '',
          sampleBefore3: physicalData.modulus.before[2] || '',
          marginalBefore1: physicalData.modulus.before[3] || '',
          marginalBefore2: physicalData.modulus.before[4] || '',
          marginalBefore3: physicalData.modulus.before[5] || '',
          sampleAfter1: physicalData.modulus.after[0] || '',
          sampleAfter2: physicalData.modulus.after[1] || '',
          sampleAfter3: physicalData.modulus.after[2] || '',
          marginalAfter1: physicalData.modulus.after[3] || '',
          marginalAfter2: physicalData.modulus.after[4] || '',
          marginalAfter3: physicalData.modulus.after[5] || '',
          modulusStatus: getSectionStatus('modulus'),
          notOkCount: localRawReports['modulus'] ? (localRawReports['modulus'].primaryOutCount + localRawReports['modulus'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const compressionPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleInitial1: physicalData.compression.initial[0] || '',
          sampleInitial2: physicalData.compression.initial[1] || '',
          sampleInitial3: physicalData.compression.initial[2] || '',
          marginalInitial1: physicalData.compression.initial[3] || '',
          marginalInitial2: physicalData.compression.initial[4] || '',
          marginalInitial3: physicalData.compression.initial[5] || '',
          sampleFinal1: physicalData.compression.final[0] || '',
          sampleFinal2: physicalData.compression.final[1] || '',
          sampleFinal3: physicalData.compression.final[2] || '',
          marginalFinal1: physicalData.compression.final[3] || '',
          marginalFinal2: physicalData.compression.final[4] || '',
          marginalFinal3: physicalData.compression.final[5] || '',
          compressionStatus: getSectionStatus('compression'),
          notOkCount: localRawReports['compression'] ? (localRawReports['compression'].primaryOutCount + localRawReports['compression'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const tensionPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sampleInitial1: physicalData.tension.initial[0] || '',
          sampleInitial2: physicalData.tension.initial[1] || '',
          sampleInitial3: physicalData.tension.initial[2] || '',
          marginalInitial1: physicalData.tension.initial[3] || '',
          marginalInitial2: physicalData.tension.initial[4] || '',
          marginalInitial3: physicalData.tension.initial[5] || '',
          marginalInitial4: physicalData.tension.initial[6] || '',
          marginalInitial5: physicalData.tension.initial[7] || '',
          marginalInitial6: physicalData.tension.initial[8] || '',
          sampleFinal1: physicalData.tension.final[0] || '',
          sampleFinal2: physicalData.tension.final[1] || '',
          sampleFinal3: physicalData.tension.final[2] || '',
          marginalFinal1: physicalData.tension.final[3] || '',
          marginalFinal2: physicalData.tension.final[4] || '',
          marginalFinal3: physicalData.tension.final[5] || '',
          marginalFinal4: physicalData.tension.final[6] || '',
          marginalFinal5: physicalData.tension.final[7] || '',
          marginalFinal6: physicalData.tension.final[8] || '',
          tensionStatus: getSectionStatus('tension'),
          notOkCount: localRawReports['tension'] ? (localRawReports['tension'].primaryOutCount + localRawReports['tension'].doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const loadReportPause = localRawReports['load'];
        const loadStatusStrPause = getSectionStatus('load');

        const loadPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          load1: physicalData.loadTest?.loads?.[0] || '',
          load2: physicalData.loadTest?.loads?.[1] || '',
          load3: physicalData.loadTest?.loads?.[2] || '',
          load4: physicalData.loadTest?.loads?.[3] || '',
          load5: physicalData.loadTest?.loads?.[4] || '',
          load6: physicalData.loadTest?.loads?.[5] || '',
          load7: physicalData.loadTest?.loads?.[6] || '',
          load8: physicalData.loadTest?.loads?.[7] || '',
          pad1L1: physicalData.loadTest.pad1[0]?.left || '',
          pad1L2: physicalData.loadTest.pad1[1]?.left || '',
          pad1L3: physicalData.loadTest.pad1[2]?.left || '',
          pad1L4: physicalData.loadTest.pad1[3]?.left || '',
          pad1L5: physicalData.loadTest.pad1[4]?.left || '',
          pad1L6: physicalData.loadTest.pad1[5]?.left || '',
          pad1L7: physicalData.loadTest.pad1[6]?.left || '',
          pad1L8: physicalData.loadTest.pad1[7]?.left || '',
          pad1R1: physicalData.loadTest.pad1[0]?.right || '',
          pad1R2: physicalData.loadTest.pad1[1]?.right || '',
          pad1R3: physicalData.loadTest.pad1[2]?.right || '',
          pad1R4: physicalData.loadTest.pad1[3]?.right || '',
          pad1R5: physicalData.loadTest.pad1[4]?.right || '',
          pad1R6: physicalData.loadTest.pad1[5]?.right || '',
          pad1R7: physicalData.loadTest.pad1[6]?.right || '',
          pad1R8: physicalData.loadTest.pad1[7]?.right || '',
          pad2L1: physicalData.loadTest.pad2[0]?.left || '',
          pad2L2: physicalData.loadTest.pad2[1]?.left || '',
          pad2L3: physicalData.loadTest.pad2[2]?.left || '',
          pad2L4: physicalData.loadTest.pad2[3]?.left || '',
          pad2L5: physicalData.loadTest.pad2[4]?.left || '',
          pad2L6: physicalData.loadTest.pad2[5]?.left || '',
          pad2L7: physicalData.loadTest.pad2[6]?.left || '',
          pad2L8: physicalData.loadTest.pad2[7]?.left || '',
          pad2R1: physicalData.loadTest.pad2[0]?.right || '',
          pad2R2: physicalData.loadTest.pad2[1]?.right || '',
          pad2R3: physicalData.loadTest.pad2[2]?.right || '',
          pad2R4: physicalData.loadTest.pad2[3]?.right || '',
          pad2R5: physicalData.loadTest.pad2[4]?.right || '',
          pad2R6: physicalData.loadTest.pad2[5]?.right || '',
          pad2R7: physicalData.loadTest.pad2[6]?.right || '',
          pad2R8: physicalData.loadTest.pad2[7]?.right || '',
          mpad1L1: physicalData.loadTest.mPad1[0]?.left || '',
          mpad1L2: physicalData.loadTest.mPad1[1]?.left || '',
          mpad1L3: physicalData.loadTest.mPad1[2]?.left || '',
          mpad1L4: physicalData.loadTest.mPad1[3]?.left || '',
          mpad1L5: physicalData.loadTest.mPad1[4]?.left || '',
          mpad1L6: physicalData.loadTest.mPad1[5]?.left || '',
          mpad1L7: physicalData.loadTest.mPad1[6]?.left || '',
          mpad1L8: physicalData.loadTest.mPad1[7]?.left || '',
          mpad1R1: physicalData.loadTest.mPad1[0]?.right || '',
          mpad1R2: physicalData.loadTest.mPad1[1]?.right || '',
          mpad1R3: physicalData.loadTest.mPad1[2]?.right || '',
          mpad1R4: physicalData.loadTest.mPad1[3]?.right || '',
          mpad1R5: physicalData.loadTest.mPad1[4]?.right || '',
          mpad1R6: physicalData.loadTest.mPad1[5]?.right || '',
          mpad1R7: physicalData.loadTest.mPad1[6]?.right || '',
          mpad1R8: physicalData.loadTest.mPad1[7]?.right || '',
          mpad2L1: physicalData.loadTest.mPad2[0]?.left || '',
          mpad2L2: physicalData.loadTest.mPad2[1]?.left || '',
          mpad2L3: physicalData.loadTest.mPad2[2]?.left || '',
          mpad2L4: physicalData.loadTest.mPad2[3]?.left || '',
          mpad2L5: physicalData.loadTest.mPad2[4]?.left || '',
          mpad2L6: physicalData.loadTest.mPad2[5]?.left || '',
          mpad2L7: physicalData.loadTest.mPad2[6]?.left || '',
          mpad2L8: physicalData.loadTest.mPad2[7]?.left || '',
          mpad2R1: physicalData.loadTest.mPad2[0]?.right || '',
          mpad2R2: physicalData.loadTest.mPad2[1]?.right || '',
          mpad2R3: physicalData.loadTest.mPad2[2]?.right || '',
          mpad2R4: physicalData.loadTest.mPad2[3]?.right || '',
          mpad2R5: physicalData.loadTest.mPad2[4]?.right || '',
          mpad2R6: physicalData.loadTest.mPad2[5]?.right || '',
          mpad2R7: physicalData.loadTest.mPad2[6]?.right || '',
          mpad2R8: physicalData.loadTest.mPad2[7]?.right || '',
          mpad3L1: physicalData.loadTest.mPad3[0]?.left || '',
          mpad3L2: physicalData.loadTest.mPad3[1]?.left || '',
          mpad3L3: physicalData.loadTest.mPad3[2]?.left || '',
          mpad3L4: physicalData.loadTest.mPad3[3]?.left || '',
          mpad3L5: physicalData.loadTest.mPad3[4]?.left || '',
          mpad3L6: physicalData.loadTest.mPad3[5]?.left || '',
          mpad3L7: physicalData.loadTest.mPad3[6]?.left || '',
          mpad3L8: physicalData.loadTest.mPad3[7]?.left || '',
          mpad3R1: physicalData.loadTest.mPad3[0]?.right || '',
          mpad3R2: physicalData.loadTest.mPad3[1]?.right || '',
          mpad3R3: physicalData.loadTest.mPad3[2]?.right || '',
          mpad3R4: physicalData.loadTest.mPad3[3]?.right || '',
          mpad3R5: physicalData.loadTest.mPad3[4]?.right || '',
          mpad3R6: physicalData.loadTest.mPad3[5]?.right || '',
          mpad3R7: physicalData.loadTest.mPad3[6]?.right || '',
          mpad3R8: physicalData.loadTest.mPad3[7]?.right || '',
          mpad4L1: physicalData.loadTest.mPad4[0]?.left || '',
          mpad4L2: physicalData.loadTest.mPad4[1]?.left || '',
          mpad4L3: physicalData.loadTest.mPad4[2]?.left || '',
          mpad4L4: physicalData.loadTest.mPad4[3]?.left || '',
          mpad4L5: physicalData.loadTest.mPad4[4]?.left || '',
          mpad4L6: physicalData.loadTest.mPad4[5]?.left || '',
          mpad4L7: physicalData.loadTest.mPad4[6]?.left || '',
          mpad4L8: physicalData.loadTest.mPad4[7]?.left || '',
          mpad4R1: physicalData.loadTest.mPad4[0]?.right || '',
          mpad4R2: physicalData.loadTest.mPad4[1]?.right || '',
          mpad4R3: physicalData.loadTest.mPad4[2]?.right || '',
          mpad4R4: physicalData.loadTest.mPad4[3]?.right || '',
          mpad4R5: physicalData.loadTest.mPad4[4]?.right || '',
          mpad4R6: physicalData.loadTest.mPad4[5]?.right || '',
          mpad4R7: physicalData.loadTest.mPad4[6]?.right || '',
          mpad4R8: physicalData.loadTest.mPad4[7]?.right || '',
          loadStatus: loadStatusStrPause,
          notOkCount: loadReportPause ? (loadReportPause.primaryOutCount + loadReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const resReportPause = localRawReports['resistance'];
        const resStatusStrPause = getSectionStatus('resistance');

        const electricalPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1BeforeForward: elecData.resistance[0]?.bF || '',
          s2BeforeForward: elecData.resistance[1]?.bF || '',
          s3BeforeForward: elecData.resistance[2]?.bF || '',
          m1BeforeForward: elecData.resistance[3]?.bF || '',
          m2BeforeForward: elecData.resistance[4]?.bF || '',
          m3BeforeForward: elecData.resistance[5]?.bF || '',
          m4BeforeForward: elecData.resistance[6]?.bF || '',
          m5BeforeForward: elecData.resistance[7]?.bF || '',
          m6BeforeForward: elecData.resistance[8]?.bF || '',
          s1BeforeReverse: elecData.resistance[0]?.bR || '',
          s2BeforeReverse: elecData.resistance[1]?.bR || '',
          s3BeforeReverse: elecData.resistance[2]?.bR || '',
          m1BeforeReverse: elecData.resistance[3]?.bR || '',
          m2BeforeReverse: elecData.resistance[4]?.bR || '',
          m3BeforeReverse: elecData.resistance[5]?.bR || '',
          m4BeforeReverse: elecData.resistance[6]?.bR || '',
          m5BeforeReverse: elecData.resistance[7]?.bR || '',
          m6BeforeReverse: elecData.resistance[8]?.bR || '',
          s1AfterForward: elecData.resistance[0]?.aF || '',
          s2AfterForward: elecData.resistance[1]?.aF || '',
          s3AfterForward: elecData.resistance[2]?.aF || '',
          m1AfterForward: elecData.resistance[3]?.aF || '',
          m2AfterForward: elecData.resistance[4]?.aF || '',
          m3AfterForward: elecData.resistance[5]?.aF || '',
          m4AfterForward: elecData.resistance[6]?.aF || '',
          m5AfterForward: elecData.resistance[7]?.aF || '',
          m6AfterForward: elecData.resistance[8]?.aF || '',
          s1AfterReverse: elecData.resistance[0]?.aR || '',
          s2AfterReverse: elecData.resistance[1]?.aR || '',
          s3AfterReverse: elecData.resistance[2]?.aR || '',
          m1AfterReverse: elecData.resistance[3]?.aR || '',
          m2AfterReverse: elecData.resistance[4]?.aR || '',
          m3AfterReverse: elecData.resistance[5]?.aR || '',
          m4AfterReverse: elecData.resistance[6]?.aR || '',
          m5AfterReverse: elecData.resistance[7]?.aR || '',
          m6AfterReverse: elecData.resistance[8]?.aR || '',
          electricalStatus: resStatusStrPause,
          notOkCount: resReportPause ? (resReportPause.primaryOutCount + resReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const sgReportPause = localRawReports['sg'];
        const sgStatusStrPause = getSectionStatus('sg');

        const sgPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1AAir: elecData.sg.compoundA[0]?.air || '',
          s2AAir: elecData.sg.compoundA[1]?.air || '',
          s3AAir: elecData.sg.compoundA[2]?.air || '',
          m1AAir: elecData.sg.compoundA[3]?.air || '',
          m2AAir: elecData.sg.compoundA[4]?.air || '',
          m3AAir: elecData.sg.compoundA[5]?.air || '',
          m4AAir: elecData.sg.compoundA[6]?.air || '',
          m5AAir: elecData.sg.compoundA[7]?.air || '',
          m6AAir: elecData.sg.compoundA[8]?.air || '',
          s1AWater: elecData.sg.compoundA[0]?.water || '',
          s2AWater: elecData.sg.compoundA[1]?.water || '',
          s3AWater: elecData.sg.compoundA[2]?.water || '',
          m1AWater: elecData.sg.compoundA[3]?.water || '',
          m2AWater: elecData.sg.compoundA[4]?.water || '',
          m3AWater: elecData.sg.compoundA[5]?.water || '',
          m4AWater: elecData.sg.compoundA[6]?.water || '',
          m5AWater: elecData.sg.compoundA[7]?.water || '',
          m6AWater: elecData.sg.compoundA[8]?.water || '',
          s1BAir: elecData.sg.compoundB[0]?.air || '',
          s2BAir: elecData.sg.compoundB[1]?.air || '',
          s3BAir: elecData.sg.compoundB[2]?.air || '',
          m1BAir: elecData.sg.compoundB[3]?.air || '',
          m2BAir: elecData.sg.compoundB[4]?.air || '',
          m3BAir: elecData.sg.compoundB[5]?.air || '',
          m4BAir: elecData.sg.compoundB[6]?.air || '',
          m5BAir: elecData.sg.compoundB[7]?.air || '',
          m6BAir: elecData.sg.compoundB[8]?.air || '',
          s1BWater: elecData.sg.compoundB[0]?.water || '',
          s2BWater: elecData.sg.compoundB[1]?.water || '',
          s3BWater: elecData.sg.compoundB[2]?.water || '',
          m1BWater: elecData.sg.compoundB[3]?.water || '',
          m2BWater: elecData.sg.compoundB[4]?.water || '',
          m3BWater: elecData.sg.compoundB[5]?.water || '',
          m4BWater: elecData.sg.compoundB[6]?.water || '',
          m5BWater: elecData.sg.compoundB[7]?.water || '',
          m6BWater: elecData.sg.compoundB[8]?.water || '',
          sgStatus: sgStatusStrPause,
          notOkCount: sgReportPause ? (sgReportPause.primaryOutCount + sgReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ashReportPause = localRawReports['ash'];
        const ashStatusStrPause = getSectionStatus('ash');
        const ashPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1ACrucible: elecData.ash.compoundA[0]?.crucible || '',
          s1ASample: elecData.ash.compoundA[0]?.sample || '',
          s1AAsh: elecData.ash.compoundA[0]?.ash || '',
          s2ACrucible: elecData.ash.compoundA[1]?.crucible || '',
          s2ASample: elecData.ash.compoundA[1]?.sample || '',
          s2AAsh: elecData.ash.compoundA[1]?.ash || '',
          s3ACrucible: elecData.ash.compoundA[2]?.crucible || '',
          s3ASample: elecData.ash.compoundA[2]?.sample || '',
          s3AAsh: elecData.ash.compoundA[2]?.ash || '',
          m1ACrucible: elecData.ash.compoundA[3]?.crucible || '',
          m1ASample: elecData.ash.compoundA[3]?.sample || '',
          m1AAsh: elecData.ash.compoundA[3]?.ash || '',
          m2ACrucible: elecData.ash.compoundA[4]?.crucible || '',
          m2ASample: elecData.ash.compoundA[4]?.sample || '',
          m2AAsh: elecData.ash.compoundA[4]?.ash || '',
          m3ACrucible: elecData.ash.compoundA[5]?.crucible || '',
          m3ASample: elecData.ash.compoundA[5]?.sample || '',
          m3AAsh: elecData.ash.compoundA[5]?.ash || '',
          m4ACrucible: elecData.ash.compoundA[6]?.crucible || '',
          m4ASample: elecData.ash.compoundA[6]?.sample || '',
          m4AAsh: elecData.ash.compoundA[6]?.ash || '',
          m5ACrucible: elecData.ash.compoundA[7]?.crucible || '',
          m5ASample: elecData.ash.compoundA[7]?.sample || '',
          m5AAsh: elecData.ash.compoundA[7]?.ash || '',
          m6ACrucible: elecData.ash.compoundA[8]?.crucible || '',
          m6ASample: elecData.ash.compoundA[8]?.sample || '',
          m6AAsh: elecData.ash.compoundA[8]?.ash || '',
          s1BCrucible: elecData.ash.compoundB[0]?.crucible || '',
          s1BSample: elecData.ash.compoundB[0]?.sample || '',
          s1BAsh: elecData.ash.compoundB[0]?.ash || '',
          s2BCrucible: elecData.ash.compoundB[1]?.crucible || '',
          s2BSample: elecData.ash.compoundB[1]?.sample || '',
          s2BAsh: elecData.ash.compoundB[1]?.ash || '',
          s3BCrucible: elecData.ash.compoundB[2]?.crucible || '',
          s3BSample: elecData.ash.compoundB[2]?.sample || '',
          s3BAsh: elecData.ash.compoundB[2]?.ash || '',
          m1BCrucible: elecData.ash.compoundB[3]?.crucible || '',
          m1BSample: elecData.ash.compoundB[3]?.sample || '',
          m1BAsh: elecData.ash.compoundB[3]?.ash || '',
          m2BCrucible: elecData.ash.compoundB[4]?.crucible || '',
          m2BSample: elecData.ash.compoundB[4]?.sample || '',
          m2BAsh: elecData.ash.compoundB[4]?.ash || '',
          m3BCrucible: elecData.ash.compoundB[5]?.crucible || '',
          m3BSample: elecData.ash.compoundB[5]?.sample || '',
          m3BAsh: elecData.ash.compoundB[5]?.ash || '',
          m4BCrucible: elecData.ash.compoundB[6]?.crucible || '',
          m4BSample: elecData.ash.compoundB[6]?.sample || '',
          m4BAsh: elecData.ash.compoundB[6]?.ash || '',
          m5BCrucible: elecData.ash.compoundB[7]?.crucible || '',
          m5BSample: elecData.ash.compoundB[7]?.sample || '',
          m5BAsh: elecData.ash.compoundB[7]?.ash || '',
          m6BCrucible: elecData.ash.compoundB[8]?.crucible || '',
          m6BSample: elecData.ash.compoundB[8]?.sample || '',
          m6BAsh: elecData.ash.compoundB[8]?.ash || '',
          ashStatus: ashStatusStrPause,
          notOkCount: ashReportPause ? (ashReportPause.primaryOutCount + ashReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const adhesionReportPause = localRawReports['adhesion'];
        const adhesionStatusStrPause = getSectionStatus('adhesion');
        const adhesionPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sample1: specData.adhesion[0] || '',
          sample2: specData.adhesion[1] || '',
          marginal1: specData.adhesion[2] || '',
          marginal2: specData.adhesion[3] || '',
          marginal3: specData.adhesion[4] || '',
          marginal4: specData.adhesion[5] || '',
          adhesionStatus: adhesionStatusStrPause,
          notOkCount: adhesionReportPause ? (adhesionReportPause.primaryOutCount + adhesionReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const secantReportPause = localRawReports['secant'];
        const secantStatusStrPause = getSectionStatus('secant');
        const secantPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1S20A: specData.secant[0]?.s20?.a || '',
          s1S20B: specData.secant[0]?.s20?.b || '',
          s1S20C: specData.secant[0]?.s20?.c || '',
          s1S20D: specData.secant[0]?.s20?.d || '',
          s1S90A: specData.secant[0]?.s90?.a || '',
          s1S90B: specData.secant[0]?.s90?.b || '',
          s1S90C: specData.secant[0]?.s90?.c || '',
          s1S90D: specData.secant[0]?.s90?.d || '',
          s2S20A: specData.secant[1]?.s20?.a || '',
          s2S20B: specData.secant[1]?.s20?.b || '',
          s2S20C: specData.secant[1]?.s20?.c || '',
          s2S20D: specData.secant[1]?.s20?.d || '',
          s2S90A: specData.secant[1]?.s90?.a || '',
          s2S90B: specData.secant[1]?.s90?.b || '',
          s2S90C: specData.secant[1]?.s90?.c || '',
          s2S90D: specData.secant[1]?.s90?.d || '',
          m1S20A: specData.secant[2]?.s20?.a || '',
          m1S20B: specData.secant[2]?.s20?.b || '',
          m1S20C: specData.secant[2]?.s20?.c || '',
          m1S20D: specData.secant[2]?.s20?.d || '',
          m1S90A: specData.secant[2]?.s90?.a || '',
          m1S90B: specData.secant[2]?.s90?.b || '',
          m1S90C: specData.secant[2]?.s90?.c || '',
          m1S90D: specData.secant[2]?.s90?.d || '',
          m2S20A: specData.secant[3]?.s20?.a || '',
          m2S20B: specData.secant[3]?.s20?.b || '',
          m2S20C: specData.secant[3]?.s20?.c || '',
          m2S20D: specData.secant[3]?.s20?.d || '',
          m2S90A: specData.secant[3]?.s90?.a || '',
          m2S90B: specData.secant[3]?.s90?.b || '',
          m2S90C: specData.secant[3]?.s90?.c || '',
          m2S90D: specData.secant[3]?.s90?.d || '',
          m3S20A: specData.secant[4]?.s20?.a || '',
          m3S20B: specData.secant[4]?.s20?.b || '',
          m3S20C: specData.secant[4]?.s20?.c || '',
          m3S20D: specData.secant[4]?.s20?.d || '',
          m3S90A: specData.secant[4]?.s90?.a || '',
          m3S90B: specData.secant[4]?.s90?.b || '',
          m3S90C: specData.secant[4]?.s90?.c || '',
          m3S90D: specData.secant[4]?.s90?.d || '',
          m4S20A: specData.secant[5]?.s20?.a || '',
          m4S20B: specData.secant[5]?.s20?.b || '',
          m4S20C: specData.secant[5]?.s20?.c || '',
          m4S20D: specData.secant[5]?.s20?.d || '',
          m4S90A: specData.secant[5]?.s90?.a || '',
          m4S90B: specData.secant[5]?.s90?.b || '',
          m4S90C: specData.secant[5]?.s90?.c || '',
          m4S90D: specData.secant[5]?.s90?.d || '',
          secantStatus: secantStatusStrPause,
          notOkCount: secantReportPause ? (secantReportPause.primaryOutCount + secantReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ncrAdhesionReportPause = localRawReports['ncrAdhesion'];
        const ncrAdhesionStatusStrPause = getSectionStatus('ncrAdhesion');
        const ncrAdhesionPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1Peel: specData.ncrgrsp?.adhesion[0]?.peel || '',
          s1Hpull: specData.ncrgrsp?.adhesion[0]?.hpull || '',
          s2Peel: specData.ncrgrsp?.adhesion[1]?.peel || '',
          s2Hpull: specData.ncrgrsp?.adhesion[1]?.hpull || '',
          m1Peel: specData.ncrgrsp?.adhesion[2]?.peel || '',
          m1Hpull: specData.ncrgrsp?.adhesion[2]?.hpull || '',
          m2Peel: specData.ncrgrsp?.adhesion[3]?.peel || '',
          m2Hpull: specData.ncrgrsp?.adhesion[3]?.hpull || '',
          m3Peel: specData.ncrgrsp?.adhesion[4]?.peel || '',
          m3Hpull: specData.ncrgrsp?.adhesion[4]?.hpull || '',
          m4Peel: specData.ncrgrsp?.adhesion[5]?.peel || '',
          m4Hpull: specData.ncrgrsp?.adhesion[5]?.hpull || '',
          ncrAdhesionStatus: ncrAdhesionStatusStrPause,
          notOkCount: ncrAdhesionReportPause ? (ncrAdhesionReportPause.primaryOutCount + ncrAdhesionReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ncrBreakingReportPause = localRawReports['ncrBreaking'];
        const ncrBreakingStatusStrPause = getSectionStatus('ncrBreaking');
        const ncrBreakingPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          sample1: specData.ncrgrsp?.breaking[0] || '',
          sample2: specData.ncrgrsp?.breaking[1] || '',
          sample3: specData.ncrgrsp?.breaking[2] || '',
          sample4: specData.ncrgrsp?.breaking[3] || '',
          sample5: specData.ncrgrsp?.breaking[4] || '',
          marginal1: specData.ncrgrsp?.breaking[5] || '',
          marginal2: specData.ncrgrsp?.breaking[6] || '',
          marginal3: specData.ncrgrsp?.breaking[7] || '',
          marginal4: specData.ncrgrsp?.breaking[8] || '',
          marginal5: specData.ncrgrsp?.breaking[9] || '',
          marginal6: specData.ncrgrsp?.breaking[10] || '',
          marginal7: specData.ncrgrsp?.breaking[11] || '',
          marginal8: specData.ncrgrsp?.breaking[12] || '',
          marginal9: specData.ncrgrsp?.breaking[13] || '',
          marginal10: specData.ncrgrsp?.breaking[14] || '',
          ncrBreakingStatus: ncrBreakingStatusStrPause,
          notOkCount: ncrBreakingReportPause ? (ncrBreakingReportPause.primaryOutCount + ncrBreakingReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ncrCordReportPause = localRawReports['ncrCord'];
        const ncrCordStatusStrPause = getSectionStatus('ncrCord');
        const ncrCordPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1Denier: specData.ncrgrsp?.nylonCord[0]?.denier || '',
          s1Epi: specData.ncrgrsp?.nylonCord[0]?.epi || '',
          s1Thickness: specData.ncrgrsp?.nylonCord[0]?.thickness || '',
          s1LoadAtBreak: specData.ncrgrsp?.nylonCord[0]?.loadAtBreak || '',
          s1Elongation: specData.ncrgrsp?.nylonCord[0]?.elongation || '',
          s1Twists: specData.ncrgrsp?.nylonCord[0]?.twists || '',
          s2Denier: specData.ncrgrsp?.nylonCord[1]?.denier || '',
          s2Epi: specData.ncrgrsp?.nylonCord[1]?.epi || '',
          s2Thickness: specData.ncrgrsp?.nylonCord[1]?.thickness || '',
          s2LoadAtBreak: specData.ncrgrsp?.nylonCord[1]?.loadAtBreak || '',
          s2Elongation: specData.ncrgrsp?.nylonCord[1]?.elongation || '',
          s2Twists: specData.ncrgrsp?.nylonCord[1]?.twists || '',
          s3Denier: specData.ncrgrsp?.nylonCord[2]?.denier || '',
          s3Epi: specData.ncrgrsp?.nylonCord[2]?.epi || '',
          s3Thickness: specData.ncrgrsp?.nylonCord[2]?.thickness || '',
          s3LoadAtBreak: specData.ncrgrsp?.nylonCord[2]?.loadAtBreak || '',
          s3Elongation: specData.ncrgrsp?.nylonCord[2]?.elongation || '',
          s3Twists: specData.ncrgrsp?.nylonCord[2]?.twists || '',
          m1Denier: specData.ncrgrsp?.nylonCord[3]?.denier || '',
          m1Epi: specData.ncrgrsp?.nylonCord[3]?.epi || '',
          m1Thickness: specData.ncrgrsp?.nylonCord[3]?.thickness || '',
          m1LoadAtBreak: specData.ncrgrsp?.nylonCord[3]?.loadAtBreak || '',
          m1Elongation: specData.ncrgrsp?.nylonCord[3]?.elongation || '',
          m1Twists: specData.ncrgrsp?.nylonCord[3]?.twists || '',
          m2Denier: specData.ncrgrsp?.nylonCord[4]?.denier || '',
          m2Epi: specData.ncrgrsp?.nylonCord[4]?.epi || '',
          m2Thickness: specData.ncrgrsp?.nylonCord[4]?.thickness || '',
          m2LoadAtBreak: specData.ncrgrsp?.nylonCord[4]?.loadAtBreak || '',
          m2Elongation: specData.ncrgrsp?.nylonCord[4]?.elongation || '',
          m2Twists: specData.ncrgrsp?.nylonCord[4]?.twists || '',
          m3Denier: specData.ncrgrsp?.nylonCord[5]?.denier || '',
          m3Epi: specData.ncrgrsp?.nylonCord[5]?.epi || '',
          m3Thickness: specData.ncrgrsp?.nylonCord[5]?.thickness || '',
          m3LoadAtBreak: specData.ncrgrsp?.nylonCord[5]?.loadAtBreak || '',
          m3Elongation: specData.ncrgrsp?.nylonCord[5]?.elongation || '',
          m3Twists: specData.ncrgrsp?.nylonCord[5]?.twists || '',
          m4Denier: specData.ncrgrsp?.nylonCord[6]?.denier || '',
          m4Epi: specData.ncrgrsp?.nylonCord[6]?.epi || '',
          m4Thickness: specData.ncrgrsp?.nylonCord[6]?.thickness || '',
          m4LoadAtBreak: specData.ncrgrsp?.nylonCord[6]?.loadAtBreak || '',
          m4Elongation: specData.ncrgrsp?.nylonCord[6]?.elongation || '',
          m4Twists: specData.ncrgrsp?.nylonCord[6]?.twists || '',
          m5Denier: specData.ncrgrsp?.nylonCord[7]?.denier || '',
          m5Epi: specData.ncrgrsp?.nylonCord[7]?.epi || '',
          m5Thickness: specData.ncrgrsp?.nylonCord[7]?.thickness || '',
          m5LoadAtBreak: specData.ncrgrsp?.nylonCord[7]?.loadAtBreak || '',
          m5Elongation: specData.ncrgrsp?.nylonCord[7]?.elongation || '',
          m5Twists: specData.ncrgrsp?.nylonCord[7]?.twists || '',
          m6Denier: specData.ncrgrsp?.nylonCord[8]?.denier || '',
          m6Epi: specData.ncrgrsp?.nylonCord[8]?.epi || '',
          m6Thickness: specData.ncrgrsp?.nylonCord[8]?.thickness || '',
          m6LoadAtBreak: specData.ncrgrsp?.nylonCord[8]?.loadAtBreak || '',
          m6Elongation: specData.ncrgrsp?.nylonCord[8]?.elongation || '',
          m6Twists: specData.ncrgrsp?.nylonCord[8]?.twists || '',
          ncrCordStatus: ncrCordStatusStrPause,
          notOkCount: ncrCordReportPause ? (ncrCordReportPause.primaryOutCount + ncrCordReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const resilienceReportPause = localRawReports['resilience'];
        const resilienceStatusStrPause = getSectionStatus('resilience');
        const resiliencePayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          s1Impact1: physicalData.resilience[0]?.i1 || '',
          s1Impact2: physicalData.resilience[0]?.i2 || '',
          s1Impact3: physicalData.resilience[0]?.i3 || '',
          s1Impact4: physicalData.resilience[0]?.i4 || '',
          s1Impact5: physicalData.resilience[0]?.i5 || '',
          s1Impact6: physicalData.resilience[0]?.i6 || '',
          s2Impact1: physicalData.resilience[1]?.i1 || '',
          s2Impact2: physicalData.resilience[1]?.i2 || '',
          s2Impact3: physicalData.resilience[1]?.i3 || '',
          s2Impact4: physicalData.resilience[1]?.i4 || '',
          s2Impact5: physicalData.resilience[1]?.i5 || '',
          s2Impact6: physicalData.resilience[1]?.i6 || '',
          s3Impact1: physicalData.resilience[2]?.i1 || '',
          s3Impact2: physicalData.resilience[2]?.i2 || '',
          s3Impact3: physicalData.resilience[2]?.i3 || '',
          s3Impact4: physicalData.resilience[2]?.i4 || '',
          s3Impact5: physicalData.resilience[2]?.i5 || '',
          s3Impact6: physicalData.resilience[2]?.i6 || '',
          resilienceStatus: resilienceStatusStrPause,
          notOkCount: resilienceReportPause ? (resilienceReportPause.primaryOutCount + resilienceReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const ozoneReportPause = localRawReports['ozone'];
        const ozoneStatusStrPause = getSectionStatus('ozone');
        const ozonePayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          initialLength: elecData.ozone[0]?.initial || '',
          stretchedLength: elecData.ozone[0]?.stretched || '',
          observation: elecData.ozone[0]?.obs || '',
          ozoneStatus: ozoneStatusStrPause,
          notOkCount: ozoneReportPause ? (ozoneReportPause.primaryOutCount + ozoneReportPause.doubleOutCount) : 0,
          remarks: remarks || ''
        };

        const tgaPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          dateOfLastTest: periodicData.tga.dateOfLastTest,
          qtyProducedSinceLastTest: periodicData.tga.qtyProduced ? parseInt(periodicData.tga.qtyProduced, 10) : null,
          s1LotNo: periodicData.tga.samples[0]?.lotNo || '',
          s1SampleNo: periodicData.tga.samples[0]?.sampleNo || '',
          s1SampleWt: periodicData.tga.samples[0]?.weight || '',
          s1TempRange: periodicData.tga.samples[0]?.tempRange || '',
          s1PolymerContent: periodicData.tga.samples[0]?.polymer || '',
          s2LotNo: periodicData.tga.samples[1]?.lotNo || '',
          s2SampleNo: periodicData.tga.samples[1]?.sampleNo || '',
          s2SampleWt: periodicData.tga.samples[1]?.weight || '',
          s2TempRange: periodicData.tga.samples[1]?.tempRange || '',
          s2PolymerContent: periodicData.tga.samples[1]?.polymer || '',
          s3LotNo: periodicData.tga.samples[2]?.lotNo || '',
          s3SampleNo: periodicData.tga.samples[2]?.sampleNo || '',
          s3SampleWt: periodicData.tga.samples[2]?.weight || '',
          s3TempRange: periodicData.tga.samples[2]?.tempRange || '',
          s3PolymerContent: periodicData.tga.samples[2]?.polymer || '',
          s4LotNo: periodicData.tga.samples[3]?.lotNo || '',
          s4SampleNo: periodicData.tga.samples[3]?.sampleNo || '',
          s4SampleWt: periodicData.tga.samples[3]?.weight || '',
          s4TempRange: periodicData.tga.samples[3]?.tempRange || '',
          s4PolymerContent: periodicData.tga.samples[3]?.polymer || '',
          s5LotNo: periodicData.tga.samples[4]?.lotNo || '',
          s5SampleNo: periodicData.tga.samples[4]?.sampleNo || '',
          s5SampleWt: periodicData.tga.samples[4]?.weight || '',
          s5TempRange: periodicData.tga.samples[4]?.tempRange || '',
          s5PolymerContent: periodicData.tga.samples[4]?.polymer || '',
          tgaStatus: getSectionStatus('tga'),
          remarks: remarks || ''
        };

        const durabilityPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          dateOfLastTest: periodicData.durability.dateOfLastTest,
          qtyProducedSinceLastTest: periodicData.durability.qtyProduced ? parseInt(periodicData.durability.qtyProduced, 10) : null,
          s1LotNo: periodicData.durability.samples[0]?.lotNo || '',
          s1InitialThickness: periodicData.durability.samples[0]?.initialThick || '',
          s1FinalThickness: periodicData.durability.samples[0]?.finalThick || '',
          s1InitialLoadComp: periodicData.durability.samples[0]?.initialLoad || '',
          s1FinalLoadComp: periodicData.durability.samples[0]?.finalLoad || '',
          s2LotNo: periodicData.durability.samples[1]?.lotNo || '',
          s2InitialThickness: periodicData.durability.samples[1]?.initialThick || '',
          s2FinalThickness: periodicData.durability.samples[1]?.finalThick || '',
          s2InitialLoadComp: periodicData.durability.samples[1]?.initialLoad || '',
          s2FinalLoadComp: periodicData.durability.samples[1]?.finalLoad || '',
          s3LotNo: periodicData.durability.samples[2]?.lotNo || '',
          s3InitialThickness: periodicData.durability.samples[2]?.initialThick || '',
          s3FinalThickness: periodicData.durability.samples[2]?.finalThick || '',
          s3InitialLoadComp: periodicData.durability.samples[2]?.initialLoad || '',
          s3FinalLoadComp: periodicData.durability.samples[2]?.finalLoad || '',
          s4LotNo: periodicData.durability.samples[3]?.lotNo || '',
          s4InitialThickness: periodicData.durability.samples[3]?.initialThick || '',
          s4FinalThickness: periodicData.durability.samples[3]?.finalThick || '',
          s4InitialLoadComp: periodicData.durability.samples[3]?.initialLoad || '',
          s4FinalLoadComp: periodicData.durability.samples[3]?.finalLoad || '',
          s5LotNo: periodicData.durability.samples[4]?.lotNo || '',
          s5InitialThickness: periodicData.durability.samples[4]?.initialThick || '',
          s5FinalThickness: periodicData.durability.samples[4]?.finalThick || '',
          s5InitialLoadComp: periodicData.durability.samples[4]?.initialLoad || '',
          s5FinalLoadComp: periodicData.durability.samples[4]?.finalLoad || '',
          durabilityStatus: getSectionStatus('durability'),
          remarks: remarks || ''
        };

        const abrasionPayloadPause = {
          callNo: currentCallId,
          lotNo: selectedLot,
          plantId: call?.plantId || 'N/A',
          vendorCode: call?.vendorCode || 'N/A',
          shift: call?.shift || 'A',
          railpadType: activeRailpadType,
          offeredQty: offeredQty,
          dateOfLastTest: periodicData.abrasion.dateOfLastTest,
          qtyProducedSinceLastTest: periodicData.abrasion.qtyProduced ? parseInt(periodicData.abrasion.qtyProduced, 10) : null,
          s1LotNo: periodicData.abrasion.samples[0]?.lotNo || '',
          s1SampleNo: periodicData.abrasion.samples[0]?.sampleNo || '',
          s1InitialMass: periodicData.abrasion.samples[0]?.initialMass || '',
          s1FinalMass: periodicData.abrasion.samples[0]?.finalMass || '',
          s1RelativeLoss: periodicData.abrasion.samples[0]?.relativeLoss || '',
          s2LotNo: periodicData.abrasion.samples[1]?.lotNo || '',
          s2SampleNo: periodicData.abrasion.samples[1]?.sampleNo || '',
          s2InitialMass: periodicData.abrasion.samples[1]?.initialMass || '',
          s2FinalMass: periodicData.abrasion.samples[1]?.finalMass || '',
          s2RelativeLoss: periodicData.abrasion.samples[1]?.relativeLoss || '',
          s3LotNo: periodicData.abrasion.samples[2]?.lotNo || '',
          s3SampleNo: periodicData.abrasion.samples[2]?.sampleNo || '',
          s3InitialMass: periodicData.abrasion.samples[2]?.initialMass || '',
          s3FinalMass: periodicData.abrasion.samples[2]?.finalMass || '',
          s3RelativeLoss: periodicData.abrasion.samples[2]?.relativeLoss || '',
          s4LotNo: periodicData.abrasion.samples[3]?.lotNo || '',
          s4SampleNo: periodicData.abrasion.samples[3]?.sampleNo || '',
          s4InitialMass: periodicData.abrasion.samples[3]?.initialMass || '',
          s4FinalMass: periodicData.abrasion.samples[3]?.finalMass || '',
          s4RelativeLoss: periodicData.abrasion.samples[3]?.relativeLoss || '',
          s5LotNo: periodicData.abrasion.samples[4]?.lotNo || '',
          s5SampleNo: periodicData.abrasion.samples[4]?.sampleNo || '',
          s5InitialMass: periodicData.abrasion.samples[4]?.initialMass || '',
          s5FinalMass: periodicData.abrasion.samples[4]?.finalMass || '',
          s5RelativeLoss: periodicData.abrasion.samples[4]?.relativeLoss || '',
          abrasionStatus: getSectionStatus('abrasion'),
          remarks: remarks || ''
        };

        console.log('Saving all submodule results in parallel during pause...');
        setSubmitMessage('Saving Inspection Data...');
        const pausePromises = [
          finalInspectionLotResultsService.save(savePayload),
          finalVisualDimensionalInspectionService.save(visualDimPayload),
          finalWeightTestService.save(weightTestPayload),
          finalHardnessTestService.save(hardnessPayloadPause),
          finalTensileStrengthService.save(tensilePayloadPause),
          finalElongationService.save(elongationPayloadPause),
          finalModulusService.save(modulusPayloadPause),
          finalCompressionSetService.save(compressionPayloadPause),
          finalTensionSetService.save(tensionPayloadPause),
          finalLoadTestService.save(loadPayloadPause),
          finalElectricalResistanceService.save(electricalPayloadPause),
          finalSpecificGravityService.save(sgPayloadPause),
          finalAshContentService.save(ashPayloadPause),
          finalAdhesionService.save(adhesionPayloadPause),
          finalSecantStiffnessService.save(secantPayloadPause),
          finalResilienceTestService.save(resiliencePayloadPause),
          finalOzoneTestService.save(ozonePayloadPause),
          finalPeriodicTgaService.save(tgaPayloadPause),
          finalPeriodicDurabilityService.save(durabilityPayloadPause),
          finalPeriodicAbrasionService.save(abrasionPayloadPause)
        ];

        if (isNCRGRSP) {
          pausePromises.push(
            finalNcrAdhesionService.save(ncrAdhesionPayloadPause),
            finalNcrBreakingLoadService.save(ncrBreakingPayloadPause),
            finalNcrNylonCordService.save(ncrCordPayloadPause)
          );
        }
 
        const otherLotsPause = lots.filter(l => l.id !== selectedLot);
        for (const oLot of otherLotsPause) {
          const oDraftKey = `railpad_draft_${currentCallId}_${oLot.id}`;
          const oDraftSaved = localStorage.getItem(oDraftKey);
          if (oDraftSaved) {
            try {
              const oDraft = JSON.parse(oDraftSaved);
              pausePromises.push(...buildOtherLotSavePromises(oLot, oDraft));
            } catch (err) {
              console.error(`Error saving other lot ${oLot.id}:`, err);
            }
          }
        }

        await Promise.all(pausePromises);
        setDbDimensionalStatus(dimensionalResult);

        // Save captured inspection photos
        if (capturedImages && capturedImages.length > 0) {
          try {
            await saveCallImages(currentCallId, {
              typeOfCall: 'RAILPAD_FINAL',
              capturedImages,
              shift: call?.shift || 'A',
              dateOfInspection: formattedDate,
              userId: userId ? String(userId) : '0'
            });
            await saveImages(`railpad_final_images_${currentCallId}`, capturedImages);
          } catch (imgErr) {
            console.error('Error saving captured images on draft/pause:', imgErr);
          }
        }

        if (actionType === 'DRAFT') {
          setIsSubmitting(false);
          setIsDirty(false);
          showNotification('All inspected lots saved to database successfully.', 'success');
          return;
        }

        // Perform workflow transition for PAUSE
        setSubmitMessage('Pausing Inspection...');
        const workflowActionData = {
          workflowTransitionId: call?.workflowTransitionId || call?.id,
          requestId: currentCallId,
          action: 'PAUSE',
          remarks: remarks || 'Inspection paused by IE',
          actionBy: userId,
          pincode: call?.pincode || '560001',
          dateOfInspection: formattedDate
        };

        console.log('Performing workflow transition for Pause:', workflowActionData);
        await performTransitionAction(workflowActionData);
        setIsSubmitting(false);

        // Clear ALL cached data for this call
        const pauseKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`railpad_draft_${currentCallId}_`)) {
            pauseKeysToRemove.push(key);
          }
        }
        pauseKeysToRemove.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem(`railpad_selected_lot_${currentCallId}`);
        localStorage.removeItem(`railpad_call_hologram_${currentCallId}`);
        localStorage.removeItem(`railpad_call_sealing_type_${currentCallId}`);

        showNotification('Inspection paused successfully. All inspected lots have been saved.', 'success');
        setIsDirty(false);
        if (onPauseComplete) {
          setTimeout(() => {
            onPauseComplete();
          }, 1000);
        }
      } catch (error) {
        console.error('Error during pause inspection:', error);
        setIsSubmitting(false);
        let userMessage = 'Unable to pause the inspection. Please try again.';
        if (error.message) {
          if (error.message.includes('Failed to fetch') || error.message.includes('Network') || error.message.includes('network')) {
            userMessage = 'Network issue detected. Please check your connection and try again.';
          } else if (error.message.includes('save') || error.message.includes('Save')) {
            userMessage = 'Some inspection data could not be saved. Please retry the operation.';
          } else if (error.message.includes('already') || error.message.includes('processed') || error.message.includes('paused')) {
            userMessage = error.message;
          }
        }
        showNotification(userMessage, 'error');
      }
    } else if (actionType === 'WITHHELD') {
      const updatedLots = lots.map(l => {
        if (l.id === selectedLot) {
          return { ...l, status: 'Under Testing' };
        }
        return l;
      });
      setLots(updatedLots);
      setIsDirty(false);
      showNotification(`Inspection for lot ${selectedLot} withheld.`, 'warning');
    }
  };

  const handleSave = () => {
    handleSaveAction('DRAFT');
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
  const getDimensionalResult = () => {
    if (visualData.dd === '' || visualData.dd === undefined) return 'PENDING';
    const c = parseInt(visualData.dd);
    if (isNaN(c)) return 'PENDING';
    if (c <= aqlConfig.ac) return 'PASS';

    // c > ac (there are rejected samples)
    if (dbDimensionalStatus === 'RE-OFFERED' || dbDimensionalStatus === 'RE-OFFER') {
      // If the dd value is the same as what was loaded from the DB, preserve RE-OFFERED display
      // (user hasn't changed the count yet — they are just viewing the saved state)
      if (dbDimensionalNotOk !== null && String(c) === String(parseInt(dbDimensionalNotOk))) {
        return 'RE-OFFERED';
      }
      // User changed dd to a new non-zero value after a re-offer → now it's FAIL
      return 'FAIL';
    }
    // First time failing (no prior re-offer) → RE-OFFERED
    return 'RE-OFFERED';
  };
  const dimensionalResult = getDimensionalResult();

  // Weight Result Logic (Double Sampling)
  const getWeightNotOk = (samples) => {
    return samples.filter(v => {
      if (v === '') return false;
      const val = parseFloat(v);
      return val > weightData.max;
    }).length;
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
        weightStatus = '2ND SAMPLING';
      }
    }
  } else {
    weightStatus = filled1 > 0 ? 'UNDER TESTING' : 'PENDING';
  }

  console.log("DEBUG WEIGHT STATUS:", {
    notOk1,
    notOk2,
    totalNotOk,
    filled1,
    n1: weightData.n1,
    ac1: weightData.ac1,
    re1: weightData.re1,
    max: weightData.max,
    calculatedStatus: weightStatus,
    showWeightSecond,
    isSecondActive: weightData.isSecondActive
  });

  const isCGRSP = Boolean(activeRailpadType && activeRailpadType.includes('CGRSP'));

  const finalDecision = (visualResult === 'PASS' && dimensionalResult === 'PASS' && (isNCRGRSP || weightStatus === 'ACCEPTED' || weightStatus === 'PENDING' || weightStatus === '2ND SAMPLING'))
    ? 'LOT PASSED'
    : (visualResult === 'PENDING' || dimensionalResult === 'PENDING') ? 'PENDING VERIFICATION'
      : (dimensionalResult === 'FAIL') ? 'LOT REJECTED (Dimensional)'
      : (visualResult !== 'PASS' && dimensionalResult !== 'PASS') ? 'LOT REJECTED (Visual & Dimensional)'
        : (dimensionalResult !== 'PASS') ? 'RE-OFFER REQUIRED (Dimensional)' : 'RE-TEST REQUIRED (Visual)';


  // New Marginal Double Sampling calculations
  const getSectionRawInfo = (key) => {
    let primaryCount = SECTION_CONFIG[key].primaryCount;
    let doubleCount = SECTION_CONFIG[key].doubleCount;
    let primaryFilled = 0;
    let primaryOutCount = 0;
    let doubleFilled = 0;
    let doubleOutCount = 0;

    switch (key) {
      case 'hardness': {
        const minA = currentHardnessSpecs.a.min;
        const maxA = currentHardnessSpecs.a.max;
        const minB = currentHardnessSpecs.b.min;
        const maxB = currentHardnessSpecs.b.max;

        const checkSampleOut = (val, min, max) => {
          if (!val || val === '') return { filled: false, out: false };
          const subValues = val.split(',').map(s => s.trim()).filter(s => s !== '');
          if (subValues.length === 0) return { filled: false, out: false };
          const out = subValues.some(sv => {
            const v = parseFloat(sv);
            return isNaN(v) || v < min || v > max;
          });
          return { filled: true, out };
        };

        // Primary
        for (let i = 0; i < 5; i++) {
          const valA = physicalData.hardness.compoundA[i];
          const resA = checkSampleOut(valA, minA, maxA);
          if (resA.filled) {
            primaryFilled++;
            if (resA.out) primaryOutCount++;
          }
          if (isCGRSP) {
            const valB = physicalData.hardness.compoundB[i];
            const resB = checkSampleOut(valB, minB, maxB);
            if (resB.filled) {
              primaryFilled++;
              if (resB.out) primaryOutCount++;
            }
          }
        }
        // Double
        for (let i = 5; i < 15; i++) {
          const valA = physicalData.hardness.compoundA[i];
          const resA = checkSampleOut(valA, minA, maxA);
          if (resA.filled) {
            doubleFilled++;
            if (resA.out) doubleOutCount++;
          }
          if (isCGRSP) {
            const valB = physicalData.hardness.compoundB[i];
            const resB = checkSampleOut(valB, minB, maxB);
            if (resB.filled) {
              doubleFilled++;
              if (resB.out) doubleOutCount++;
            }
          }
        }
        primaryCount = isCGRSP ? 10 : 5;
        doubleCount = isCGRSP ? 20 : 10;
        break;
      }

      case 'tensile': {
        const specs = currentTensileSpecs;
        const checkSample = (beforeVal, afterVal) => {
          if (beforeVal === '' || afterVal === '') return { filled: false, out: false };
          const b = parseFloat(beforeVal);
          const a = parseFloat(afterVal);
          if (isNaN(b) || isNaN(a)) return { filled: false, out: false };
          const ret = b === 0 ? 0 : (a / b) * 100;
          const out = b < specs.before || a < specs.after || ret < specs.retention;
          return { filled: true, out };
        };

        for (let i = 0; i < 5; i++) {
          const r = checkSample(physicalData.tensile.before[i], physicalData.tensile.after[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 5; i < 15; i++) {
          const r = checkSample(physicalData.tensile.before[i], physicalData.tensile.after[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'elongation': {
        const specs = currentElongationSpecs;
        const checkSample = (beforeVal, afterVal) => {
          if (beforeVal === '' || afterVal === '') return { filled: false, out: false };
          const b = parseFloat(beforeVal);
          const a = parseFloat(afterVal);
          if (isNaN(b) || isNaN(a)) return { filled: false, out: false };
          const ret = b === 0 ? 0 : (a / b) * 100;
          const out = b < specs.before || a < specs.after || ret < specs.retention;
          return { filled: true, out };
        };

        for (let i = 0; i < 5; i++) {
          const r = checkSample(physicalData.elongation.before[i], physicalData.elongation.after[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 5; i < 15; i++) {
          const r = checkSample(physicalData.elongation.before[i], physicalData.elongation.after[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'modulus': {
        const specs = currentModulusSpecs;
        const checkSample = (beforeVal, afterVal) => {
          if (beforeVal === '' || afterVal === '') return { filled: false, out: false };
          const b = parseFloat(beforeVal);
          const a = parseFloat(afterVal);
          if (isNaN(b) || isNaN(a)) return { filled: false, out: false };
          const change = b === 0 ? 0 : ((a - b) / b) * 100;
          const out = b < specs.min || b > specs.max || change > specs.changePos || change < -specs.changeNeg;
          return { filled: true, out };
        };

        for (let i = 0; i < 3; i++) {
          const r = checkSample(physicalData.modulus.before[i], physicalData.modulus.after[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 3; i < 9; i++) {
          const r = checkSample(physicalData.modulus.before[i], physicalData.modulus.after[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'compression': {
        const checkSample = (initVal, finalVal) => {
          if (initVal === '' || finalVal === '') return { filled: false, out: false };
          const init = parseFloat(initVal);
          const final = parseFloat(finalVal);
          if (isNaN(init) || isNaN(final)) return { filled: false, out: false };
          const set = init === 0 ? 0 : ((init - final) / init) * 100;
          const out = set > 30;
          return { filled: true, out };
        };

        for (let i = 0; i < 3; i++) {
          const r = checkSample(physicalData.compression.initial[i], physicalData.compression.final[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 3; i < 9; i++) {
          const r = checkSample(physicalData.compression.initial[i], physicalData.compression.final[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'tension': {
        const checkSample = (initVal, finalVal) => {
          if (initVal === '' || finalVal === '') return { filled: false, out: false };
          const init = parseFloat(initVal);
          const final = parseFloat(finalVal);
          if (isNaN(init) || isNaN(final)) return { filled: false, out: false };
          const set = init === 0 ? 0 : ((final - init) / init) * 100;
          const out = set > 25;
          return { filled: true, out };
        };

        for (let i = 0; i < 3; i++) {
          const r = checkSample(physicalData.tension.initial[i], physicalData.tension.final[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 3; i < 9; i++) {
          const r = checkSample(physicalData.tension.initial[i], physicalData.tension.final[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'load': {
        const specs = currentLoadSpecs;
        primaryCount = visibleLoadRows * 2;
        doubleCount = visibleLoadRows * 4;

        const checkPadEntries = (pad) => {
          if (!pad || !Array.isArray(pad)) return { filled: 0, out: 0 };
          let filled = 0;
          let out = 0;
          pad.slice(0, visibleLoadRows).forEach(row => {
            if (row && row.left !== '' && row.right !== '' && row.left !== null && row.right !== null && row.left !== undefined && row.right !== undefined) {
              const l = parseFloat(row.left);
              const r = parseFloat(row.right);
              if (!isNaN(l) && !isNaN(r)) {
                filled++;
                const defl = (l + r) / 2;
                if (defl < specs.min || defl > specs.max) {
                  out++;
                }
              }
            }
          });
          return { filled, out };
        };

        const pad1Res = checkPadEntries(physicalData?.loadTest?.pad1);
        const pad2Res = checkPadEntries(physicalData?.loadTest?.pad2);
        primaryFilled = pad1Res.filled + pad2Res.filled;
        primaryOutCount = pad1Res.out + pad2Res.out;

        const mPad1Res = checkPadEntries(physicalData?.loadTest?.mPad1);
        const mPad2Res = checkPadEntries(physicalData?.loadTest?.mPad2);
        const mPad3Res = checkPadEntries(physicalData?.loadTest?.mPad3);
        const mPad4Res = checkPadEntries(physicalData?.loadTest?.mPad4);
        doubleFilled = mPad1Res.filled + mPad2Res.filled + mPad3Res.filled + mPad4Res.filled;
        doubleOutCount = mPad1Res.out + mPad2Res.out + mPad3Res.out + mPad4Res.out;
        break;
      }

      case 'resistance': {
        const checkSample = (r) => {
          if (!r || r.bF === '' || r.bR === '' || r.aF === '' || r.aR === '') return { filled: false, out: false };
          const bF = parseFloat(r.bF);
          const bR = parseFloat(r.bR);
          const aF = parseFloat(r.aF);
          const aR = parseFloat(r.aR);
          if (isNaN(bF) || isNaN(bR) || isNaN(aF) || isNaN(aR)) return { filled: false, out: false };
          const out = Math.min(bF, bR) < 100 || Math.min(aF, aR) < 100;
          return { filled: true, out };
        };

        for (let i = 0; i < 3; i++) {
          const r = checkSample(elecData.resistance[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 3; i < 9; i++) {
          const r = checkSample(elecData.resistance[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'sg': {
        const specs = currentSGSpecs;
        const checkSample = (rA, rB) => {
          if (!rA || rA.air === '' || rA.water === '') return { filled: false, out: false };
          const airA = parseFloat(rA.air);
          const waterA = parseFloat(rA.water);
          if (isNaN(airA) || isNaN(waterA) || airA === waterA) return { filled: false, out: false };
          const sgA = airA / (airA - waterA);
          let out = sgA > specs.a;

          if (isCGRSP) {
            if (!rB || rB.air === '' || rB.water === '') return { filled: false, out: false };
            const airB = parseFloat(rB.air);
            const waterB = parseFloat(rB.water);
            if (isNaN(airB) || isNaN(waterB) || airB === waterB) return { filled: false, out: false };
            const sgB = airB / (airB - waterB);
            if (isNCRGRSP) {
              out = out || sgB > specs.b || Math.abs(sgA - sgB) > specs.variation;
            } else {
              out = out || sgB > specs.b;
            }
          }
          return { filled: true, out };
        };

        for (let i = 0; i < 3; i++) {
          const r = checkSample(elecData.sg.compoundA[i], isCGRSP ? elecData.sg.compoundB[i] : null);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 3; i < 9; i++) {
          const r = checkSample(elecData.sg.compoundA[i], isCGRSP ? elecData.sg.compoundB[i] : null);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'ash': {
        const specs = currentAshSpecs;
        const checkSample = (rA, rB) => {
          if (!rA || rA.crucible === '' || rA.sample === '' || rA.ash === '') return { filled: false, out: false };
          const cA = parseFloat(rA.crucible);
          const sA = parseFloat(rA.sample);
          const aA = parseFloat(rA.ash);
          if (isNaN(cA) || isNaN(sA) || isNaN(aA) || sA === cA) return { filled: false, out: false };
          const ashA = ((aA - cA) / (sA - cA)) * 100;
          let out = ashA > specs.a;

          if (isCGRSP) {
            if (!rB || rB.crucible === '' || rB.sample === '' || rB.ash === '') return { filled: false, out: false };
            const cB = parseFloat(rB.crucible);
            const sB = parseFloat(rB.sample);
            const aB = parseFloat(rB.ash);
            if (isNaN(cB) || isNaN(sB) || isNaN(aB) || sB === cB) return { filled: false, out: false };
            const ashB = ((aB - cB) / (sB - cB)) * 100;
            if (isNCRGRSP) {
              out = out || ashB > specs.b || Math.abs(ashA - ashB) > specs.variation;
            } else {
              out = out || ashB > specs.b;
            }
          }
          return { filled: true, out };
        };

        for (let i = 0; i < 3; i++) {
          const r = checkSample(elecData.ash.compoundA[i], isCGRSP ? elecData.ash.compoundB[i] : null);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 3; i < 9; i++) {
          const r = checkSample(elecData.ash.compoundA[i], isCGRSP ? elecData.ash.compoundB[i] : null);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'adhesion': {
        const checkSample = (val) => {
          if (val === '') return { filled: false, out: false };
          const v = parseFloat(val);
          if (isNaN(v)) return { filled: false, out: false };
          return { filled: true, out: v < 8 };
        };

        for (let i = 0; i < 2; i++) {
          const r = checkSample(specData.adhesion[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 2; i < 6; i++) {
          const r = checkSample(specData.adhesion[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'secant': {
        if (!specData?.secant || !Array.isArray(specData.secant)) break;
        const specs = getSecantTolerance(selectedLot);
        const checkSample = (s) => {
          if (!s || !s.s20 || !s.s90) return { filled: false, out: false };
          const isS20Complete = Object.values(s.s20).every(v => v !== '');
          const isS90Complete = Object.values(s.s90).every(v => v !== '');
          if (!isS20Complete || !isS90Complete) return { filled: false, out: false };
          const d1 = (parseFloat(s.s20.a) + parseFloat(s.s20.b) + parseFloat(s.s20.c) + parseFloat(s.s20.d)) / 4;
          const d2 = (parseFloat(s.s90.a) + parseFloat(s.s90.b) + parseFloat(s.s90.c) + parseFloat(s.s90.d)) / 4;
          const diff = d2 - d1;
          if (Math.abs(diff) <= 0.0001) return { filled: false, out: false };
          const stiffness = 70 / diff;
          const out = stiffness < specs.min || stiffness > specs.max;
          return { filled: true, out };
        };

        for (let i = 0; i < 2; i++) {
          const r = checkSample(specData.secant[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 2; i < 6; i++) {
          const r = checkSample(specData.secant[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'ncrAdhesion': {
        if (!specData.ncrgrsp || !specData.ncrgrsp.adhesion) break;
        const checkSample = (v) => {
          if (!v || v.peel === '' || v.peel === undefined || v.peel === null) return { filled: false, out: false };
          const peelVal = parseFloat(v.peel);
          if (isNaN(peelVal)) return { filled: false, out: false };
          let isOut = peelVal < 4;
          if (v.hpull !== '' && v.hpull !== undefined && v.hpull !== null) {
            const hpullVal = parseFloat(v.hpull);
            if (!isNaN(hpullVal) && hpullVal < 10) {
              isOut = true;
            }
          }
          return { filled: true, out: isOut };
        };

        for (let i = 0; i < 2; i++) {
          const r = checkSample(specData.ncrgrsp.adhesion[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 2; i < 6; i++) {
          const r = checkSample(specData.ncrgrsp.adhesion[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'ncrBreaking': {
        if (!specData.ncrgrsp || !specData.ncrgrsp.breaking) break;
        const checkSample = (val) => {
          if (val === '') return { filled: false, out: false };
          const v = parseFloat(val);
          if (isNaN(v)) return { filled: false, out: false };
          return { filled: true, out: v < 350 };
        };

        for (let i = 0; i < 5; i++) {
          const r = checkSample(specData.ncrgrsp.breaking[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 5; i < 15; i++) {
          const r = checkSample(specData.ncrgrsp.breaking[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }

      case 'ncrCord': {
        if (!specData.ncrgrsp || !specData.ncrgrsp.nylonCord) break;
        const checkSample = (v) => {
          if (!v || v.denier === '' || v.epi === '' || v.thickness === '' || v.loadAtBreak === '' || v.elongation === '' || v.twists === '') return { filled: false, out: false };
          const denierVal = parseFloat(v.denier);
          const epiVal = parseFloat(v.epi);
          const thickVal = parseFloat(v.thickness);
          const loadVal = parseFloat(v.loadAtBreak);
          const elongVal = parseFloat(v.elongation);
          const twistVal = parseFloat(v.twists);
          if (isNaN(denierVal) || isNaN(epiVal) || isNaN(thickVal) || isNaN(loadVal) || isNaN(elongVal) || isNaN(twistVal)) return { filled: false, out: false };
          const out = denierVal < 3200 || epiVal < 22 || epiVal > 26 || thickVal < 0.75 || loadVal < 16 || elongVal > 20 || twistVal < 305 || twistVal > 335;
          return { filled: true, out };
        };

        for (let i = 0; i < 3; i++) {
          const r = checkSample(specData.ncrgrsp.nylonCord[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        for (let i = 3; i < 9; i++) {
          const r = checkSample(specData.ncrgrsp.nylonCord[i]);
          if (r.filled) {
            doubleFilled++;
            if (r.out) doubleOutCount++;
          }
        }
        break;
      }
      
      case 'resilience': {
        const checkSample = (r) => {
          if (!r || r.i4 === '' || r.i5 === '' || r.i6 === '' || r.i4 === undefined || r.i5 === undefined || r.i6 === undefined) return { filled: false, out: false };
          const i4 = parseFloat(r.i4);
          const i5 = parseFloat(r.i5);
          const i6 = parseFloat(r.i6);
          if (isNaN(i4) || isNaN(i5) || isNaN(i6)) return { filled: false, out: false };
          const avg = (i4 + i5 + i6) / 3;
          return { filled: true, out: avg < 30 };
        };
        for (let i = 0; i < 3; i++) {
          const r = checkSample(physicalData.resilience[i]);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        }
        break;
      }
      
      case 'ozone': {
        const checkSample = (r) => {
          if (!r || r.initial === '' || r.stretched === '' || r.obs === '') return { filled: false, out: false };
          return { filled: true, out: r.obs === 'Cracks' };
        };
        const r = checkSample(elecData.ozone[0]);
        if (r.filled) {
          primaryFilled++;
          if (r.out) primaryOutCount++;
        }
        break;
      }
      
      case 'tga': {
        const samples = periodicData?.tga?.samples || [];
        primaryCount = samples.length;
        const checkSample = (val) => {
          if (!val || val.weight === '' || val.tempRange === '' || val.polymer === '') return { filled: false, out: false };
          const p = parseFloat(val.polymer);
          if (isNaN(p)) return { filled: false, out: false };
          return { filled: true, out: p <= 50.0 };
        };
        samples.forEach(sample => {
          const r = checkSample(sample);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        });
        break;
      }
      
      case 'durability': {
        const samples = periodicData?.durability?.samples || [];
        primaryCount = samples.length;
        const maxThicknessReduction = (activeRailpadType || '').toLowerCase().includes('10mm') ? 1.0 : 0.6;
        const checkSample = (val) => {
          if (!val || val.initialThick === '' || val.finalThick === '' || val.initialLoad === '' || val.finalLoad === '') return { filled: false, out: false };
          const it = parseFloat(val.initialThick);
          const ft = parseFloat(val.finalThick);
          const il = parseFloat(val.initialLoad);
          const fl = parseFloat(val.finalLoad);
          if (isNaN(it) || isNaN(ft) || isNaN(il) || isNaN(fl)) return { filled: false, out: false };
          
          const reduction = it - ft;
          const changeLd = il === 0 ? 0 : Math.abs(((fl - il) / il) * 100);
          
          const out = reduction > maxThicknessReduction || changeLd > 10;
          return { filled: true, out };
        };
        samples.forEach(sample => {
          const r = checkSample(sample);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        });
        break;
      }
      
      case 'abrasion': {
        const samples = periodicData?.abrasion?.samples || [];
        primaryCount = samples.length;
        const checkSample = (val) => {
          if (!val || val.initialMass === '' || val.finalMass === '' || !val.relativeLoss || val.relativeLoss === '') return { filled: false, out: false };
          const rl = parseFloat(val.relativeLoss);
          if (isNaN(rl)) return { filled: false, out: false };
          const out = rl < 180 || rl > 220;
          return { filled: true, out };
        };
        samples.forEach(sample => {
          const r = checkSample(sample);
          if (r.filled) {
            primaryFilled++;
            if (r.out) primaryOutCount++;
          }
        });
        break;
      }
    }

    return {
      primaryCount,
      doubleCount,
      primaryFilled,
      primaryOutCount,
      doubleFilled,
      doubleOutCount
    };
  };

  const activeSections = [
    'hardness', 'tensile', 'elongation', 'modulus', 'compression', 'tension', 'load',
    'resistance', 'sg', 'ash', 'adhesion', 'secant', 'resilience', 'ozone', 'tga', 'durability', 'abrasion'
  ];
  if (isNCRGRSP) {
    activeSections.push('ncrAdhesion', 'ncrBreaking', 'ncrCord');
  }

  const rawReports = {};
  const defaultSectionReport = { primaryCount: 0, doubleCount: 0, primaryFilled: 0, primaryOutCount: 0, doubleFilled: 0, doubleOutCount: 0 };
  activeSections.forEach(key => {
    try {
      rawReports[key] = getSectionRawInfo(key);
    } catch (e) {
      console.error(`Error computing section report for '${key}':`, e);
      rawReports[key] = { ...defaultSectionReport, primaryCount: SECTION_CONFIG[key]?.primaryCount || 0, doubleCount: SECTION_CONFIG[key]?.doubleCount || 0 };
    }
  });

  const outOfSpecPrimarySections = activeSections.filter(key => {
    const rep = rawReports[key];
    if (!rep) return false;
    if (key === 'load') {
      return rep.primaryFilled > 0 && rep.primaryOutCount > 0;
    }
    return rep.primaryFilled === rep.primaryCount && rep.primaryOutCount > 0;
  });

  const showMarginalTab = outOfSpecPrimarySections.length === 1;
  const marginalSectionKey = showMarginalTab ? outOfSpecPrimarySections[0] : null;

  const hasTgaQty = periodicData?.tga?.qtyProduced !== '' && periodicData?.tga?.qtyProduced !== null && periodicData?.tga?.qtyProduced !== undefined;
  const hasDurabilityQty = periodicData?.durability?.qtyProduced !== '' && periodicData?.durability?.qtyProduced !== null && periodicData?.durability?.qtyProduced !== undefined;
  const hasAbrasionQty = periodicData?.abrasion?.qtyProduced !== '' && periodicData?.abrasion?.qtyProduced !== null && periodicData?.abrasion?.qtyProduced !== undefined;

  const isTgaMandatory = hasTgaQty && parseInt(periodicData?.tga?.qtyProduced || 0, 10) >= 30000;
  const isDurabilityMandatory = hasDurabilityQty && parseInt(periodicData?.durability?.qtyProduced || 0, 10) >= 100000;
  const isAbrasionMandatory = hasAbrasionQty && parseInt(periodicData?.abrasion?.qtyProduced || 0, 10) >= 100000;

  const getSectionStatus = (key) => {
    const rep = rawReports[key];
    if (!rep) return 'PENDING';

    if (key === 'load') {
      if (rep.primaryFilled === 0) return 'PENDING';
      if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
      if (rep.primaryOutCount === 0) return 'PASS';
      if (key === marginalSectionKey) {
        if (rep.doubleFilled < rep.doubleCount) return rep.doubleFilled > 0 ? 'UNDER TESTING' : 'MARGINAL';
        return rep.doubleOutCount === 0 ? 'PASS' : 'FAIL';
      }
      return 'FAIL';
    }

    if (key === 'tga') {
      if (!hasTgaQty) return 'PENDING';
      if (!isTgaMandatory) {
        if (rep.primaryFilled === 0) return 'BYPASSED';
        if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
        return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
      }
    }
    if (key === 'durability') {
      if (!hasDurabilityQty) return 'PENDING';
      if (!isDurabilityMandatory) {
        if (rep.primaryFilled === 0) return 'BYPASSED';
        if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
        return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
      }
    }
    if (key === 'abrasion') {
      if (!hasAbrasionQty) return 'PENDING';
      if (!isAbrasionMandatory) {
        if (rep.primaryFilled === 0) return 'BYPASSED';
        if (rep.primaryFilled < rep.primaryCount) return 'UNDER TESTING';
        return rep.primaryOutCount === 0 ? 'PASS' : 'FAIL';
      }
    }

    if (rep.primaryFilled < rep.primaryCount) {
      return rep.primaryFilled > 0 ? 'UNDER TESTING' : 'PENDING';
    }

    if (rep.primaryOutCount === 0) {
      return 'PASS';
    }

    if (key === marginalSectionKey) {
      if (rep.doubleFilled < rep.doubleCount) {
        return rep.doubleFilled > 0 ? 'UNDER TESTING' : 'MARGINAL';
      } else {
        return rep.doubleOutCount === 0 ? 'PASS' : 'FAIL';
      }
    } else {
      return 'FAIL';
    }
  };

  // Helper variables for checking hardness in primary rendering
  const totalHardnessOut = rawReports['hardness'] ? rawReports['hardness'].primaryOutCount : 0;
  const hardnessStatus = getSectionStatus('hardness');
  const filledHardness = rawReports['hardness'] ? rawReports['hardness'].primaryFilled : 0;
  const totalRequired = isCGRSP ? 10 : 5;

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

  const tensileOutCount = rawReports['tensile'] ? rawReports['tensile'].primaryOutCount : 0;
  const elongationOutCount = rawReports['elongation'] ? rawReports['elongation'].primaryOutCount : 0;
  const modulusOutCount = rawReports['modulus'] ? rawReports['modulus'].primaryOutCount : 0;
  const compressionOutCount = rawReports['compression'] ? rawReports['compression'].primaryOutCount : 0;
  const tensionOutCount = rawReports['tension'] ? rawReports['tension'].primaryOutCount : 0;

  const getPadDeflection = (pad) => {
    if (!pad || !Array.isArray(pad)) return null;
    const s8 = pad[7];
    if (!s8 || s8.left === '' || s8.right === '') return null;
    return (parseFloat(s8.left) + parseFloat(s8.right)) / 2;
  };
  const pad1Defl = getPadDeflection(physicalData?.loadTest?.pad1);
  const pad2Defl = getPadDeflection(physicalData?.loadTest?.pad2);

  const physicalResults = {
    hardness: getSectionStatus('hardness'),
    tensile: getSectionStatus('tensile'),
    elongation: getSectionStatus('elongation'),
    modulus: getSectionStatus('modulus'),
    compression: getSectionStatus('compression'),
    tension: getSectionStatus('tension'),
    load: getSectionStatus('load'),
    resilience: getSectionStatus('resilience')
  };

  const physicalFailedCount = Object.values(physicalResults).filter(r => r === 'FAIL').length;
  const physicalPendingCount = Object.values(physicalResults).filter(r => r === 'PENDING' || r === 'UNDER TESTING' || r === 'MARGINAL').length;
  const physicalDecision = physicalPendingCount > 0 && physicalFailedCount === 0 ? 'PENDING VERIFICATION' : (physicalFailedCount === 0 ? 'LOT PASSED' : 'PERMANENT REJECT');

  // Tab 3 Calculations
  const resOutCount = rawReports['resistance'] ? rawReports['resistance'].primaryOutCount : 0;
  const totalSGOut = rawReports['sg'] ? rawReports['sg'].primaryOutCount : 0;
  const totalAshOut = rawReports['ash'] ? rawReports['ash'].primaryOutCount : 0;

  const elecResults = {
    resistance: getSectionStatus('resistance'),
    sg: getSectionStatus('sg'),
    ash: getSectionStatus('ash'),
    ozone: getSectionStatus('ozone')
  };
  const elecFailedCount = Object.values(elecResults).filter(r => r === 'FAIL').length;
  const elecPendingCount = Object.values(elecResults).filter(r => r === 'PENDING' || r === 'UNDER TESTING' || r === 'MARGINAL').length;
  const elecDecision = elecPendingCount > 0 && elecFailedCount === 0 ? 'PENDING VERIFICATION' : (elecFailedCount === 0 ? 'LOT PASSED' : 'PERMANENT REJECT');

  // Tab 4 Calculations: Specialized Tests
  const secantResults = (specData?.secant || []).map(s => {
    if (!s || !s.s20 || !s.s90) return { d1: 0, d2: 0, stiffness: 0, isS20Complete: false, isS90Complete: false };
    const isS20Complete = s.s20 && Object.values(s.s20).every(v => v !== '');
    const isS90Complete = s.s90 && Object.values(s.s90).every(v => v !== '');
    const d1Raw = isS20Complete ? (parseFloat(s.s20.a) + parseFloat(s.s20.b) + parseFloat(s.s20.c) + parseFloat(s.s20.d)) / 4 : 0;
    const d2Raw = isS90Complete ? (parseFloat(s.s90.a) + parseFloat(s.s90.b) + parseFloat(s.s90.c) + parseFloat(s.s90.d)) / 4 : 0;
    const d1 = isS20Complete ? Math.round(d1Raw * 100) / 100 : 0;
    const d2 = isS90Complete ? Math.round(d2Raw * 100) / 100 : 0;
    const diff = d2 - d1;
    const stiffness = (isS20Complete && isS90Complete && Math.abs(diff) > 0.0001) ? (70 / diff).toFixed(2) : 0;
    return { d1, d2, stiffness, isS20Complete, isS90Complete };
  });

  const specResults = {
    adhesion: getSectionStatus('adhesion'),
    secant: getSectionStatus('secant')
  };

  const ncrResults = {
    adhesion: getSectionStatus('ncrAdhesion'),
    breaking: getSectionStatus('ncrBreaking'),
    cord: getSectionStatus('ncrCord')
  };

  const periodicResults = {
    tga: getSectionStatus('tga'),
    durability: getSectionStatus('durability'),
    abrasion: getSectionStatus('abrasion')
  };

  const periodicFailedCount = Object.values(periodicResults).filter(r => r === 'FAIL').length;
  const periodicPendingCount = Object.values(periodicResults).filter(r => r === 'PENDING' || r === 'UNDER TESTING' || r === 'MARGINAL').length;
  const periodicDecision = periodicPendingCount > 0 && periodicFailedCount === 0 ? 'PENDING VERIFICATION' : (periodicFailedCount === 0 ? 'LOT PASSED' : 'PERMANENT REJECT');


  const specFailedCount = Object.values(specResults).filter(r => r === 'FAIL').length;
  const specPendingCount = Object.values(specResults).filter(r => r === 'PENDING' || r === 'UNDER TESTING' || r === 'MARGINAL').length;
  const specDecision = specPendingCount > 0 && specFailedCount === 0 ? 'PENDING VERIFICATION' : (specFailedCount === 0 ? 'LOT PASSED' : 'PERMANENT REJECT');

  const ncrFailedCount = Object.values(ncrResults).filter(r => r === 'FAIL').length;
  const ncrPendingCount = Object.values(ncrResults).filter(r => r === 'PENDING' || r === 'UNDER TESTING' || r === 'MARGINAL').length;
  const ncrDecision = ncrPendingCount > 0 && ncrFailedCount === 0 ? 'PENDING VERIFICATION' : (ncrFailedCount === 0 ? 'LOT PASSED' : 'PERMANENT REJECT');

  const activeLotData = lots.find(l => l.id === selectedLot) || lots[0];

  const visualStatus = visualResult;
  const dimensionalStatus = dimensionalResult;
  const physicalStatus = physicalDecision === 'LOT PASSED' ? 'PASS' : physicalDecision === 'PENDING VERIFICATION' ? 'PENDING' : physicalDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
  const elecStatus = elecDecision === 'LOT PASSED' ? 'PASS' : elecDecision === 'PENDING VERIFICATION' ? 'PENDING' : elecDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
  const specStatus = specDecision === 'LOT PASSED' ? 'PASS' : specDecision === 'PENDING VERIFICATION' ? 'PENDING' : specDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
  const ncrStatus = ncrDecision === 'LOT PASSED' ? 'PASS' : ncrDecision === 'PENDING VERIFICATION' ? 'PENDING' : ncrDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
  const periodicStatus = periodicDecision === 'LOT PASSED' ? 'PASS' : periodicDecision === 'PENDING VERIFICATION' ? 'PENDING' : periodicDecision === 'RE-TEST REQUIRED' ? 'RE-TEST' : 'FAIL';
  const isDimensionalReOffered = dimensionalStatus === 'RE-OFFERED' || dimensionalStatus === 'RE-OFFER';
  const isWeightPass = isNCRGRSP ? true : (weightStatus === 'ACCEPTED');
  const isWeightPending = isNCRGRSP ? false : (!isWeightPass && weightStatus !== 'REJECTED');
  const isWeightFailed = isNCRGRSP ? false : (weightStatus === 'REJECTED');
  const isAllCorePass = visualStatus === 'PASS' && dimensionalStatus === 'PASS' && isWeightPass;
  const isAnyCorePending = visualStatus === 'PENDING'
    || (dimensionalStatus === 'PENDING' && !isDimensionalReOffered)
    || isWeightPending
    || physicalStatus === 'PENDING' || physicalStatus === 'RE-TEST'
    || elecStatus === 'PENDING' || elecStatus === 'RE-TEST'
    || (!isNCRGRSP && (specStatus === 'PENDING' || specStatus === 'RE-TEST'))
    || (isNCRGRSP && (ncrStatus === 'PENDING' || ncrStatus === 'RE-TEST'))
    || periodicStatus === 'PENDING' || periodicStatus === 'RE-TEST';

  const isAnyCoreFailed = visualStatus === 'FAIL'
    || dimensionalStatus === 'FAIL'
    || isWeightFailed
    || physicalStatus === 'FAIL'
    || elecStatus === 'FAIL'
    || (!isNCRGRSP && specStatus === 'FAIL')
    || (isNCRGRSP && ncrStatus === 'FAIL')
    || periodicStatus === 'FAIL';

  let activeLotOverallStatus = 'PENDING';
  let acceptedQty = 0;
  let rejectedQty = 0;
  const offeredQty = activeLot?.size || 0;

  if (isAnyCoreFailed) {
    activeLotOverallStatus = 'REJECTED';
    acceptedQty = 0;
    rejectedQty = offeredQty;
  } else if (isDimensionalReOffered) {
    activeLotOverallStatus = 'RE-OFFERED';
    acceptedQty = 0;
    rejectedQty = 0;
  } else if (isAnyCorePending) {
    activeLotOverallStatus = 'PENDING';
    acceptedQty = 0;
    rejectedQty = 0;
  } else if (isAllCorePass) {
    activeLotOverallStatus = 'PASSED';
    acceptedQty = offeredQty;
    rejectedQty = 0;
  } else {
    activeLotOverallStatus = 'REJECTED';
    acceptedQty = 0;
    rejectedQty = offeredQty;
  }

  useEffect(() => {
    if (!selectedLot || loadedLot !== selectedLot) return;
    
    let currentStatus = 'Pending';
    if (activeLotOverallStatus === 'PASSED') {
      currentStatus = 'Passed';
    } else if (activeLotOverallStatus === 'RE-OFFERED') {
      currentStatus = 'RE-OFFERED';
    } else if (activeLotOverallStatus === 'REJECTED') {
      currentStatus = 'Rejected';
    } else if (activeLotOverallStatus === 'PENDING') {
      currentStatus = 'Pending';
    } else {
      currentStatus = activeLotOverallStatus || 'Pending';
    }

    setLots(prevLots => {
      const targetLot = prevLots.find(l => l.id === selectedLot);
      if (targetLot && targetLot.status !== currentStatus) {
        return prevLots.map(l => {
          if (l.id === selectedLot) {
            return { ...l, status: currentStatus };
          }
          return l;
        });
      }
      return prevLots;
    });
  }, [selectedLot, activeLotOverallStatus, loadedLot]);

  useEffect(() => {
    if (!selectedLot || !currentCallId || loadedLot !== selectedLot) return;
    localStorage.setItem(`railpad_status_${currentCallId}_${selectedLot}`, activeLotOverallStatus);
  }, [selectedLot, currentCallId, activeLotOverallStatus, loadedLot]);

  const filteredLots = lots.filter(lot => lot.id.toLowerCase().includes(searchTerm.toLowerCase()));

  const tabs = [
    { id: 'visual', label: 'Visual & Dimensional' },
    { id: 'physical', label: 'Physical & Ageing Properties' },
    { id: 'electrical', label: 'Electrical & Chemical' },
    ...(!isNCRGRSP ? [{ id: 'specialized', label: 'Dynamic & Durability Test' }] : []),
    ...(isNCRGRSP ? [{ id: 'ncrgrsp', label: 'NCRGRSP Test' }] : []),
    { id: 'periodic', label: 'Periodic Testing' },
    ...(showMarginalTab ? [{ id: 'marginal', label: 'Marginal Double-Sampling' }] : [])
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 140px)', background: '#f8fafc', gap: '16px', padding: '0 16px 16px 16px', boxSizing: 'border-box' }}>
        <FinalInspectionSkeleton />
      </div>
    );
  }

  try {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '0 16px 16px 16px', boxSizing: 'border-box', position: 'relative' }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          autoClose={true}
          autoCloseDelay={5000}
          onClose={() => setNotification(null)}
        />
      )}
      {isSubmitting && (
        <AnnexureLoader
          title={submitMessage || 'Processing...'}
          subtitle="Please wait while we save and verify the lot results..."
          fullScreen={true}
        />
      )}
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
        `}
      </style>

      {/* 2nd Sampling Auto-Hide Confirmation Modal */}
      {showWeightPopup && (
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
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>ℹ️</div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>2nd Sampling Not Required</h3>
            <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 32px 0', lineHeight: '1.5' }}>
              2nd Sampling is no longer required.<br />Do you want to hide it?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  // No (Clear & Hide)
                  setWeightData(prev => ({
                    ...prev,
                    samples2: Array(prev.n2).fill(''),
                    isSecondActive: false
                  }));
                  setShowWeightSecond(false);
                  setShowWeightPopup(false);
                  markDirty();
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#ef4444',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                No (Clear & Hide)
              </button>
              <button
                onClick={() => {
                  // Yes (Hide Only)
                  setWeightData(prev => ({
                    ...prev,
                    isSecondActive: false
                  }));
                  setShowWeightSecond(false);
                  setShowWeightPopup(false);
                  markDirty();
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#21808d',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Yes (Hide Only)
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '16px', marginBottom: '20px' }}>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden', minHeight: 0 }}>
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
                    {tabs.find(t => t.id === activeTab)?.label || ''}
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
                              value={isNCRGRSP ? getVisualDimSampleSize(lots.find(l => l.id === selectedLot)) : (visualData.visualN || 25)}
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
                                minHeight: '38px',
                                lineHeight: '1.5',
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
                              background: visualResult === 'PASS' ? '#dcfce7' : visualResult === 'PENDING' ? '#f1f5f9' : '#fee2e2',
                              color: visualResult === 'PASS' ? '#166534' : visualResult === 'PENDING' ? '#475569' : '#991b1b'
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
                              value={isNCRGRSP ? getVisualDimSampleSize(lots.find(l => l.id === selectedLot)) : (visualData.dimN || 25)}
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
                                minHeight: '38px',
                                lineHeight: '1.5',
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
                              background: dimensionalResult === 'PASS' ? '#dcfce7'
                                : (dimensionalResult === 'RE-OFFERED' || dimensionalResult === 'RE-OFFER') ? '#eff6ff'
                                : dimensionalResult === 'PENDING' ? '#f1f5f9'
                                : '#fee2e2',
                              color: dimensionalResult === 'PASS' ? '#166534'
                                : (dimensionalResult === 'RE-OFFERED' || dimensionalResult === 'RE-OFFER') ? '#1e40af'
                                : dimensionalResult === 'PENDING' ? '#475569'
                                : '#991b1b'
                            }}>
                              {dimensionalResult}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {!isNCRGRSP && (
                    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <tbody>
                          <tr style={{ background: '#f8fafc' }}>
                            <td style={{ padding: '16px', fontWeight: '800', color: '#0f172a', width: '250px' }}>
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
                                {showWeightSecond ? 'Samples (n1/n2)' : 'Samples (n1)'}
                              </div>
                              <div style={{ fontWeight: '700', color: '#334155' }}>
                                {showWeightSecond ? `${weightData.n1} / ${weightData.n2}` : weightData.n1}
                              </div>
                            </td>
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginBottom: '4px' }}>
                                {showWeightSecond ? 'Acc (Ac1/Ac2)' : 'Acc (Ac1)'}
                              </div>
                              <div style={{ fontWeight: '700', color: '#059669' }}>
                                {showWeightSecond ? `${weightData.ac1} / ${weightData.ac2}` : weightData.ac1}
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div>
                                  <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700', marginBottom: '4px' }}>
                                    {showWeightSecond ? 'Rej (Re1/Re2)' : 'Rej (Re1)'}
                                  </div>
                                  <div style={{ fontWeight: '700', color: '#b91c1c' }}>
                                    {showWeightSecond ? `${weightData.re1} / ${weightData.re2}` : weightData.re1}
                                  </div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => downloadTemplate(weightData.isSecondActive ? 'samples2' : 'samples1')}
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
                                  <input id="weight-import-1" type="file" accept=".csv" onChange={(e) => handleExcelImport(e, weightData.isSecondActive ? 'samples2' : 'samples1')} style={{ display: 'none' }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px', textAlign: 'center', width: '120px' }}>
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

                      <div style={{ padding: '20px' }}>
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
                            {showWeightSecond && (
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {!weightData.isSecondActive ? (
                              <>
                                <div style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  background: '#f8fafc',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#475569'
                                }}>
                                  Rejected (R1): <span style={{ color: notOk1 > weightData.ac1 ? '#ef4444' : '#10b981', fontWeight: '800' }}>{notOk1}</span>
                                </div>
                                <div style={{
                                  padding: '6px 12px',
                                  border: `1px solid ${notOk1 <= weightData.ac1 ? '#10b981' : notOk1 >= weightData.re1 ? '#ef4444' : '#f59e0b'}`,
                                  color: notOk1 <= weightData.ac1 ? '#10b981' : notOk1 >= weightData.re1 ? '#ef4444' : '#f59e0b',
                                  borderRadius: '8px',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  background: 'white',
                                  textTransform: 'uppercase'
                                }}>
                                  {notOk1 <= weightData.ac1 ? 'OK' : notOk1 >= weightData.re1 ? 'NOT OK' : '2nd Sampling'}
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{
                                  padding: '6px 12px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  background: '#f8fafc',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#475569'
                                }}>
                                  Total (R1 + R2): <span style={{ color: totalNotOk > weightData.ac2 ? '#ef4444' : '#10b981', fontWeight: '800' }}>{totalNotOk}</span>
                                </div>
                                <div style={{
                                  padding: '6px 12px',
                                  border: `1px solid ${totalNotOk <= weightData.ac2 ? '#10b981' : totalNotOk >= weightData.re2 ? '#ef4444' : '#f59e0b'}`,
                                  color: totalNotOk <= weightData.ac2 ? '#10b981' : totalNotOk >= weightData.re2 ? '#ef4444' : '#f59e0b',
                                  borderRadius: '8px',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  background: 'white',
                                  textTransform: 'uppercase'
                                }}>
                                  {totalNotOk <= weightData.ac2 ? 'OK' : totalNotOk >= weightData.re2 ? 'NOT OK' : 'Under Testing'}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(10, 1fr)',
                          gap: '6px',
                          background: '#f8fafc',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1px solid #f1f5f9'
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
                    </div>
                  )}

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
                        { label: 'HARDNESS', value: isCGRSP ? '60-85' : `${currentHardnessSpecs.a.min}-${currentHardnessSpecs.a.max}` },
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
                            color: (hardnessStatus === 'PASS' || hardnessStatus === 'ACCEPTED') ? '#059669' : (hardnessStatus === 'FAIL' || hardnessStatus === 'MARGINAL') ? '#f59e0b' : '#64748b',
                            fontWeight: '800',
                            textTransform: 'uppercase'
                          }}>{(hardnessStatus === 'FAIL' || hardnessStatus === 'MARGINAL') ? 'MARGINAL' : hardnessStatus}</span>
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
                          {physicalData.hardness.compoundA.slice(0, 5).map((val, idx) => {
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
                            {physicalData.hardness.compoundB.slice(0, 5).map((val, idx) => {
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
                            color: physicalResults.tensile === 'PASS' ? '#059669' : (physicalResults.tensile === 'FAIL' || physicalResults.tensile === 'MARGINAL') ? '#f59e0b' : '#64748b',
                            fontWeight: '800',
                            textTransform: 'uppercase'
                          }}>{(physicalResults.tensile === 'FAIL' || physicalResults.tensile === 'MARGINAL') ? 'MARGINAL' : physicalResults.tensile}</span>
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
                          {physicalData.tensile.before.slice(0, 5).map((val, idx) => (
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
                          {physicalData.tensile.after.slice(0, 5).map((val, idx) => (
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
                          {physicalData.tensile.before.slice(0, 5).map((b, idx) => {
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
                            color: physicalResults.elongation === 'PASS' ? '#059669' : (physicalResults.elongation === 'FAIL' || physicalResults.elongation === 'MARGINAL') ? '#f59e0b' : '#64748b',
                            fontWeight: '800',
                            textTransform: 'uppercase'
                          }}>{(physicalResults.elongation === 'FAIL' || physicalResults.elongation === 'MARGINAL') ? 'MARGINAL' : physicalResults.elongation}</span>
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
                          {physicalData.elongation.before.slice(0, 5).map((val, idx) => (
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
                          {physicalData.elongation.after.slice(0, 5).map((val, idx) => (
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
                          {physicalData.elongation.before.slice(0, 5).map((b, idx) => {
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
                            color: physicalResults.modulus === 'PASS' ? '#059669' : (physicalResults.modulus === 'FAIL' || physicalResults.modulus === 'MARGINAL') ? '#f59e0b' : '#64748b',
                            fontWeight: '800',
                            textTransform: 'uppercase'
                          }}>{(physicalResults.modulus === 'FAIL' || physicalResults.modulus === 'MARGINAL') ? 'MARGINAL' : physicalResults.modulus}</span>
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
                          {physicalData.modulus.before.slice(0, 3).map((val, idx) => (
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
                          {physicalData.modulus.after.slice(0, 3).map((val, idx) => (
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
                          {physicalData.modulus.before.slice(0, 3).map((b, idx) => {
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
                          Status: <span style={{ color: physicalResults.compression === 'PASS' ? '#059669' : (physicalResults.compression === 'FAIL' || physicalResults.compression === 'MARGINAL') ? '#f59e0b' : '#64748b', fontWeight: '800' }}>{(physicalResults.compression === 'FAIL' || physicalResults.compression === 'MARGINAL') ? 'MARGINAL' : physicalResults.compression}</span>
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
                          {physicalData.compression.initial.slice(0, 3).map((val, idx) => (
                            <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                              <input type="number" value={val} onChange={(e) => setPhysicalData(prev => ({ ...prev, compression: { ...prev.compression, initial: prev.compression.initial.map((v, i) => i === idx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                            </td>
                          ))}
                          <td></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Final Thickness (B) in mm</td>
                          {physicalData.compression.final.slice(0, 3).map((val, idx) => (
                            <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                              <input type="number" value={val} onChange={(e) => setPhysicalData(prev => ({ ...prev, compression: { ...prev.compression, final: prev.compression.final.map((v, i) => i === idx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                            </td>
                          ))}
                          <td></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Compression Set ((A-B)/A*100)</td>
                          {physicalData.compression.initial.slice(0, 3).map((a, idx) => {
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
                          Status: <span style={{ color: physicalResults.tension === 'PASS' ? '#059669' : (physicalResults.tension === 'FAIL' || physicalResults.tension === 'MARGINAL') ? '#f59e0b' : '#64748b', fontWeight: '800' }}>{(physicalResults.tension === 'FAIL' || physicalResults.tension === 'MARGINAL') ? 'MARGINAL' : physicalResults.tension}</span>
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
                          {physicalData.tension.initial.slice(0, 3).map((val, idx) => (
                            <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                              <input type="number" value={val} onChange={(e) => setPhysicalData(prev => ({ ...prev, tension: { ...prev.tension, initial: prev.tension.initial.map((v, i) => i === idx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                            </td>
                          ))}
                          <td></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Final Length (B) in mm</td>
                          {physicalData.tension.final.slice(0, 3).map((val, idx) => (
                            <td key={idx} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                              <input type="number" value={val} onChange={(e) => setPhysicalData(prev => ({ ...prev, tension: { ...prev.tension, final: prev.tension.final.map((v, i) => i === idx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                            </td>
                          ))}
                          <td></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Tension Set ((B-A)/A*100)</td>
                          {physicalData.tension.initial.slice(0, 3).map((a, idx) => {
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
                          Status: <span style={{ color: physicalResults.load === 'PASS' ? '#059669' : physicalResults.load === 'UNDER TESTING' ? '#2563eb' : (physicalResults.load === 'FAIL' || physicalResults.load === 'MARGINAL') ? '#f59e0b' : '#64748b', fontWeight: '800' }}>{(physicalResults.load === 'FAIL' || physicalResults.load === 'MARGINAL') ? 'MARGINAL' : physicalResults.load}</span>
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
                        {physicalData.loadTest.loads.slice(0, visibleLoadRows).map((load, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '800', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input 
                                  type="number" 
                                  value={load} 
                                  onChange={(e) => {
                                    const newLoads = [...physicalData.loadTest.loads];
                                    newLoads[idx] = e.target.value;
                                    setPhysicalData(prev => ({ ...prev, loadTest: { ...prev.loadTest, loads: newLoads } }));
                                  }} 
                                  style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '800' }} 
                                />
                                <button type="button" onClick={() => handleDeleteRow(idx)} title="Delete Row" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px', fontSize: '14px' }}>✕</button>
                              </div>
                            </td>
                            {['pad1', 'pad2'].map(padKey => {
                              const data = physicalData.loadTest[padKey][idx];
                              const defl = (data.left && data.right) ? ((parseFloat(data.left) + parseFloat(data.right)) / 2).toFixed(2) : '-';
                              const isOutOfSpec = defl !== '-' && (parseFloat(defl) < currentLoadSpecs.min || parseFloat(defl) > currentLoadSpecs.max);
                              return (
                                <React.Fragment key={padKey}>
                                  <td style={{ padding: '4px', border: '1px solid #f1f5f9' }}>
                                    <input type="number" value={data.left} disabled={!load || String(load).trim() === ''} onChange={(e) => setPhysicalData(prev => ({ ...prev, loadTest: { ...prev.loadTest, [padKey]: prev.loadTest[padKey].map((v, i) => i === idx ? { ...v, left: e.target.value } : v) } }))} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '700', backgroundColor: (!load || String(load).trim() === '') ? '#f8fafc' : '#fff' }} />
                                  </td>
                                  <td style={{ padding: '4px', border: '1px solid #f1f5f9' }}>
                                    <input type="number" value={data.right} disabled={!load || String(load).trim() === ''} onChange={(e) => setPhysicalData(prev => ({ ...prev, loadTest: { ...prev.loadTest, [padKey]: prev.loadTest[padKey].map((v, i) => i === idx ? { ...v, right: e.target.value } : v) } }))} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '700', backgroundColor: (!load || String(load).trim() === '') ? '#f8fafc' : '#fff' }} />
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '900', background: '#f8fafc', border: '1px solid #f1f5f9', color: isOutOfSpec ? '#ef4444' : '#21808d' }}>{defl}</td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))}
                        {visibleLoadRows < 8 && (
                          <tr>
                            <td style={{ textAlign: 'center', padding: '10px' }}>
                              <button 
                                type="button" 
                                onClick={() => setVisibleLoadRows(prev => Math.min(prev + 1, 8))}
                                style={{ padding: '5px 15px', background: '#e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', width: '100%' }}>
                                + Add Row
                              </button>
                            </td>
                            <td colSpan="6" style={{ border: 'none' }}></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Resilience by Vertical Rebound Test */}
                  <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Resilience by Vertical Rebound Test</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                          Status: <span style={{ color: physicalResults.resilience === 'PASS' ? '#059669' : physicalResults.resilience === 'FAIL' ? '#f59e0b' : '#64748b', fontWeight: '800' }}>{physicalResults.resilience || 'PENDING'}</span>
                        </div>
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fcfcfc' }}>
                          <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }}>Sample No.</th>
                          <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }}>4th Impact</th>
                          <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }}>5th Impact</th>
                          <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }}>6th Impact</th>
                          <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }}>% Resilience</th>
                          <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 1, 2].map((idx) => {
                          const data = physicalData.resilience[idx] || { i1: '', i2: '', i3: '', i4: '', i5: '', i6: '' };
                          const i4 = parseFloat(data.i4);
                          const i5 = parseFloat(data.i5);
                          const i6 = parseFloat(data.i6);
                          const avg = (!isNaN(i4) && !isNaN(i5) && !isNaN(i6)) ? ((i4 + i5 + i6) / 3).toFixed(2) : '-';
                          const pass = avg !== '-' && parseFloat(avg) >= 30;

                          return (
                            <tr key={idx}>
                              <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '800', background: '#f8fafc', border: '1px solid #f1f5f9' }}>{idx + 1}</td>
                              {['i4', 'i5', 'i6'].map((impactKey) => (
                                <td key={impactKey} style={{ padding: '4px', border: '1px solid #f1f5f9' }}>
                                  <input type="number" value={data[impactKey]} onChange={(e) => setPhysicalData(prev => {
                                    const newRes = [...prev.resilience];
                                    newRes[idx] = { ...newRes[idx], [impactKey]: e.target.value };
                                    return { ...prev, resilience: newRes };
                                  })} style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }} />
                                </td>
                              ))}
                              <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '900', background: '#f8fafc', border: '1px solid #f1f5f9' }}>{avg}{avg !== '-' && '%'}</td>
                              <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '900', border: '1px solid #f1f5f9', color: pass ? '#059669' : '#ef4444' }}>{avg !== '-' ? (pass ? 'Pass' : 'Fail') : '-'}</td>
                            </tr>
                          );
                        })}
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
                        <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: elecResults.resistance === 'PASS' ? '#dcfce7' : (elecResults.resistance === 'FAIL' || elecResults.resistance === 'MARGINAL') ? '#fef3c7' : '#fee2e2', color: elecResults.resistance === 'PASS' ? '#166534' : (elecResults.resistance === 'FAIL' || elecResults.resistance === 'MARGINAL') ? '#b45309' : '#991b1b' }}>{(elecResults.resistance === 'FAIL' || elecResults.resistance === 'MARGINAL') ? 'MARGINAL' : elecResults.resistance}</span>
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
                          {elecData.resistance.slice(0, 3).map((row, idx) => {
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
                        <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: elecResults.sg === 'PASS' ? '#dcfce7' : (elecResults.sg === 'FAIL' || elecResults.sg === 'MARGINAL') ? '#fef3c7' : '#fee2e2', color: elecResults.sg === 'PASS' ? '#166534' : (elecResults.sg === 'FAIL' || elecResults.sg === 'MARGINAL') ? '#b45309' : '#991b1b' }}>{(elecResults.sg === 'FAIL' || elecResults.sg === 'MARGINAL') ? 'MARGINAL' : elecResults.sg}</span>
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                            <th colSpan="3" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Compound A</th>
                            {isCGRSP && <th colSpan="3" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Compound B</th>}
                            {isNCRGRSP && <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Variation</th>}
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
                                    {isNCRGRSP && (
                                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: variation !== '-' && Math.abs(parseFloat(variation)) > currentSGSpecs.variation ? '#ef4444' : '#64748b', background: '#f8fafc' }}>{variation}</td>
                                    )}
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
                        <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: elecResults.ash === 'PASS' ? '#dcfce7' : (elecResults.ash === 'FAIL' || elecResults.ash === 'MARGINAL') ? '#fef3c7' : '#fee2e2', color: elecResults.ash === 'PASS' ? '#166534' : (elecResults.ash === 'FAIL' || elecResults.ash === 'MARGINAL') ? '#b45309' : '#991b1b' }}>{(elecResults.ash === 'FAIL' || elecResults.ash === 'MARGINAL') ? 'MARGINAL' : elecResults.ash}</span>
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                            <th colSpan="4" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Product A</th>
                            {isCGRSP && <th colSpan="4" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Product B</th>}
                            {isNCRGRSP && <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Variation</th>}
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
                                    {isNCRGRSP && (
                                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: variation !== '-' && Math.abs(parseFloat(variation)) > currentAshSpecs.variation ? '#ef4444' : '#64748b', background: '#f8fafc' }}>{variation}</td>
                                    )}
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Ozone Test */}
                  <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginTop: '24px' }}>
                    <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Ozone Test</h3>
                      </div>
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: elecResults.ozone === 'PASS' ? '#dcfce7' : elecResults.ozone === 'FAIL' ? '#fee2e2' : '#f1f5f9', color: elecResults.ozone === 'PASS' ? '#166534' : elecResults.ozone === 'FAIL' ? '#991b1b' : '#64748b' }}>{elecResults.ozone || 'PENDING'}</span>
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>10mm Wide Strip Initial Length (Bench Mark)</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>After 30% Stretched Length</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Observation</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Remarks / Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S1</td>
                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <input type="text" value={elecData.ozone[0]?.initial || '40mm'} readOnly style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px', background: '#f1f5f9', color: '#64748b' }} />
                            </td>
                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <input type="text" value={elecData.ozone[0]?.stretched || '52mm'} readOnly style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px', background: '#f1f5f9', color: '#64748b' }} />
                            </td>
                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <select value={elecData.ozone[0]?.obs || ''} onChange={(e) => setElecData(prev => ({ ...prev, ozone: [{ ...prev.ozone[0], obs: e.target.value }] }))} style={{ width: '100%', padding: '8px', minHeight: '38px', lineHeight: '1.5', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                                <option value="">Select...</option>
                                <option value="No Crack">No Crack</option>
                                <option value="Cracks">Cracks</option>
                              </select>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: elecData.ozone[0]?.obs === 'Cracks' ? '#ef4444' : elecData.ozone[0]?.obs === 'No Crack' ? '#059669' : '#64748b', background: '#f8fafc' }}>
                              {elecData.ozone[0]?.obs === 'No Crack' ? 'Pass' : elecData.ozone[0]?.obs === 'Cracks' ? 'Fail' : '-'}
                            </td>
                          </tr>
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
                            {specData.adhesion.slice(0, 2).map((v, i) => (
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
                        <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>FOR: {activeRailpadType} | Standard: {currentSecantSpecs.min} - {currentSecantSpecs.max} kN/mm</div>
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
                          {specData.secant.slice(0, 2).map((sample, sIdx) => {
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
                                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{res.isS20Complete ? res.d1.toFixed(2) : '-'}</td>
                                  <td rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: res.stiffness >= currentSecantSpecs.min && res.stiffness <= currentSecantSpecs.max ? '#166534' : '#ef4444', background: '#f1f5f9', fontSize: '18px' }}>
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
                                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{res.isS90Complete ? res.d2.toFixed(2) : '-'}</td>
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

              {activeTab === 'periodic' && (
                <PeriodicTestingTab
                  periodicData={periodicData}
                  setPeriodicData={setPeriodicData}
                  activeRailpadType={activeRailpadType}
                  getSectionStatus={getSectionStatus}
                  markDirty={markDirty}
                />
              )}

              {activeTab === 'ncrgrsp' && specData.ncrgrsp && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
                  {/* Adhesion Test */}
                  <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Adhesion Test</h3>
                        <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>Limit: Peel ≥ 4.0 Kgf | H-Pull ≥ 10 Kgf (Optional)</div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: ncrResults.adhesion === 'PASS' ? '#dcfce7' : ncrResults.adhesion === 'FAIL' ? '#fef3c7' : '#fee2e2', color: ncrResults.adhesion === 'PASS' ? '#166534' : ncrResults.adhesion === 'FAIL' ? '#b45309' : '#991b1b' }}>{ncrResults.adhesion === 'FAIL' ? 'MARGINAL' : ncrResults.adhesion}</span>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample No.</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Peel Adhesion (Kgf)</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>H-Pull Test (Kgf) <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>(Optional)</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {specData.ncrgrsp.adhesion && specData.ncrgrsp.adhesion.slice(0, 2).map((row, idx) => (
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
                            {specData.ncrgrsp.breaking && specData.ncrgrsp.breaking.slice(0, 5).map((v, i) => (
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
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Denier (gm/9000m) (3200 min)</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>No. of ends/inch (22-26)</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Thickness (mm) (0.75 min)</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Load at Break (kg) (16 min)</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Elongation at Break (%) (20 max)</th>
                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Twists/m (305-335)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {specData.ncrgrsp.nylonCord && specData.ncrgrsp.nylonCord.slice(0, 3).map((row, idx) => (
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

              {activeTab === 'marginal' && showMarginalTab && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
                  {/* Section Input Table */}
                  {(() => {
                    const config = SECTION_CONFIG[marginalSectionKey];
                    if (!config) return null;

                    const sampleNumbers = Array(config.doubleCount).fill(0).map((_, i) => config.startSample + i);
                    const startIdx = config.primaryCount;

                    switch (marginalSectionKey) {
                      case 'hardness': {
                        const minA = currentHardnessSpecs.a.min;
                        const maxA = currentHardnessSpecs.a.max;
                        const minB = currentHardnessSpecs.b.min;
                        const maxB = currentHardnessSpecs.b.max;
                        const rep = rawReports['hardness'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('hardness');
                        return (
                          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Status: <span style={{ color: status === 'PASS' ? '#059669' : status === 'FAIL' ? '#ef4444' : '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>{status}</span>
                                </div>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#fff' }}>
                                  <th style={{ width: '200px' }}></th>
                                  {sampleNumbers.map(n => (
                                    <th key={n} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>S{n}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    {isCGRSP ? 'Compound A' : 'Hardness Result'}
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.hardness.compoundA[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <HardnessCell
                                          value={val || ''}
                                          min={minA}
                                          max={maxA}
                                          onChange={(newVal) => {
                                            setPhysicalData(prev => ({
                                              ...prev,
                                              hardness: { ...prev.hardness, compoundA: prev.hardness.compoundA.map((v, i) => i === realIdx ? newVal : v) }
                                            }));
                                            markDirty();
                                          }}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                                {isCGRSP && (
                                  <tr>
                                    <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                      Compound B
                                    </td>
                                    {sampleNumbers.map((sn, idx) => {
                                      const realIdx = startIdx + idx;
                                      const val = physicalData.hardness.compoundB[realIdx];
                                      return (
                                        <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                          <HardnessCell
                                            value={val || ''}
                                            min={minB}
                                            max={maxB}
                                            onChange={(newVal) => {
                                              setPhysicalData(prev => ({
                                                ...prev,
                                                hardness: { ...prev.hardness, compoundB: prev.hardness.compoundB.map((v, i) => i === realIdx ? newVal : v) }
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
                        );
                      }

                      case 'tensile': {
                        const specs = currentTensileSpecs;
                        const rep = rawReports['tensile'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('tensile');
                        return (
                          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Status: <span style={{ color: status === 'PASS' ? '#059669' : status === 'FAIL' ? '#ef4444' : '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>{status}</span>
                                </div>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#fff' }}>
                                  <th style={{ width: '250px' }}></th>
                                  {sampleNumbers.map(n => (
                                    <th key={n} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>S{n}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    Before Ageing (Kg/cm²)
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.tensile.before[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input
                                          type="number"
                                          value={val || ''}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            setPhysicalData(prev => ({
                                              ...prev,
                                              tensile: { ...prev.tensile, before: prev.tensile.before.map((v, i) => i === realIdx ? newVal : v) }
                                            }));
                                            markDirty();
                                          }}
                                          style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && parseFloat(val) < specs.before) ? '#fef2f2' : 'white', color: (val !== '' && parseFloat(val) < specs.before) ? '#ef4444' : '#059669' }}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    After Ageing (Kg/cm²)
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.tensile.after[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input
                                          type="number"
                                          value={val || ''}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            setPhysicalData(prev => ({
                                              ...prev,
                                              tensile: { ...prev.tensile, after: prev.tensile.after.map((v, i) => i === realIdx ? newVal : v) }
                                            }));
                                            markDirty();
                                          }}
                                          style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && parseFloat(val) < specs.after) ? '#fef2f2' : 'white', color: (val !== '' && parseFloat(val) < specs.after) ? '#ef4444' : '#059669' }}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    % Retention After Ageing
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const b = physicalData.tensile.before[realIdx];
                                    const a = physicalData.tensile.after[realIdx];
                                    const ret = (b && a) ? ((parseFloat(a) / parseFloat(b)) * 100).toFixed(2) : '-';
                                    const isLow = ret !== '-' && parseFloat(ret) < specs.retention;
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: isLow ? '#ef4444' : '#21808d', background: '#f8fafc' }}>
                                        {ret}{ret !== '-' ? '%' : ''}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      case 'elongation': {
                        const specs = currentElongationSpecs;
                        const rep = rawReports['elongation'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('elongation');
                        return (
                          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Status: <span style={{ color: status === 'PASS' ? '#059669' : status === 'FAIL' ? '#ef4444' : '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>{status}</span>
                                </div>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#fff' }}>
                                  <th style={{ width: '250px' }}></th>
                                  {sampleNumbers.map(n => (
                                    <th key={n} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>S{n}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    Before Ageing (%)
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.elongation.before[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input
                                          type="number"
                                          value={val || ''}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            setPhysicalData(prev => ({
                                              ...prev,
                                              elongation: { ...prev.elongation, before: prev.elongation.before.map((v, i) => i === realIdx ? newVal : v) }
                                            }));
                                            markDirty();
                                          }}
                                          style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && parseFloat(val) < specs.before) ? '#fef2f2' : 'white', color: (val !== '' && parseFloat(val) < specs.before) ? '#ef4444' : '#059669' }}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    After Ageing (%)
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.elongation.after[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input
                                          type="number"
                                          value={val || ''}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            setPhysicalData(prev => ({
                                              ...prev,
                                              elongation: { ...prev.elongation, after: prev.elongation.after.map((v, i) => i === realIdx ? newVal : v) }
                                            }));
                                            markDirty();
                                          }}
                                          style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && parseFloat(val) < specs.after) ? '#fef2f2' : 'white', color: (val !== '' && parseFloat(val) < specs.after) ? '#ef4444' : '#059669' }}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    % Retention After Ageing
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const b = physicalData.elongation.before[realIdx];
                                    const a = physicalData.elongation.after[realIdx];
                                    const ret = (b && a) ? ((parseFloat(a) / parseFloat(b)) * 100).toFixed(2) : '-';
                                    const isLow = ret !== '-' && parseFloat(ret) < specs.retention;
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: isLow ? '#ef4444' : '#21808d', background: '#f8fafc' }}>
                                        {ret}{ret !== '-' ? '%' : ''}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      case 'modulus': {
                        const specs = currentModulusSpecs;
                        const rep = rawReports['modulus'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('modulus');
                        return (
                          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Status: <span style={{ color: status === 'PASS' ? '#059669' : status === 'FAIL' ? '#ef4444' : '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>{status}</span>
                                </div>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#fff' }}>
                                  <th style={{ width: '250px' }}></th>
                                  {sampleNumbers.map(n => (
                                    <th key={n} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>S{n}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    Before Ageing (Kg/cm²)
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.modulus.before[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input
                                          type="number"
                                          value={val || ''}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            setPhysicalData(prev => ({
                                              ...prev,
                                              modulus: { ...prev.modulus, before: prev.modulus.before.map((v, i) => i === realIdx ? newVal : v) }
                                            }));
                                            markDirty();
                                          }}
                                          style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: (val !== '' && (parseFloat(val) < specs.min || parseFloat(val) > specs.max)) ? '#fef2f2' : 'white', color: (val !== '' && (parseFloat(val) < specs.min || parseFloat(val) > specs.max)) ? '#ef4444' : '#059669' }}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    After Ageing (Kg/cm²)
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.modulus.after[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input
                                          type="number"
                                          value={val || ''}
                                          onChange={(e) => {
                                            const newVal = e.target.value;
                                            setPhysicalData(prev => ({
                                              ...prev,
                                              modulus: { ...prev.modulus, after: prev.modulus.after.map((v, i) => i === realIdx ? newVal : v) }
                                            }));
                                            markDirty();
                                          }}
                                          style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: 'white' }}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>
                                    % Change in Modulus
                                  </td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const b = physicalData.modulus.before[realIdx];
                                    const a = physicalData.modulus.after[realIdx];
                                    const change = (b && a) ? (((parseFloat(a) - parseFloat(b)) / parseFloat(b)) * 100).toFixed(2) : '-';
                                    const isOut = change !== '-' && (parseFloat(change) > specs.changePos || parseFloat(change) < -specs.changeNeg);
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: isOut ? '#ef4444' : '#21808d', background: '#f8fafc' }}>
                                        {change}{change !== '-' ? '%' : ''}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      case 'compression': {
                        const rep = rawReports['compression'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('compression');
                        return (
                          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Status: <span style={{ color: status === 'PASS' ? '#059669' : status === 'FAIL' ? '#ef4444' : '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>{status}</span>
                                </div>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#fff' }}>
                                  <th style={{ width: '250px' }}></th>
                                  {sampleNumbers.map(n => (
                                    <th key={n} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>S{n}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Initial Thickness (A) in mm</td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.compression.initial[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input type="number" value={val || ''} onChange={(e) => setPhysicalData(prev => ({ ...prev, compression: { ...prev.compression, initial: prev.compression.initial.map((v, i) => i === realIdx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Final Thickness (B) in mm</td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.compression.final[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input type="number" value={val || ''} onChange={(e) => setPhysicalData(prev => ({ ...prev, compression: { ...prev.compression, final: prev.compression.final.map((v, i) => i === realIdx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Compression Set ((A-B)/A*100)</td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const a = physicalData.compression.initial[realIdx];
                                    const b = physicalData.compression.final[realIdx];
                                    const set = (a && b) ? (((parseFloat(a) - parseFloat(b)) / parseFloat(a)) * 100).toFixed(2) : '-';
                                    return <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: (set !== '-' && parseFloat(set) > 30) ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{set}{set !== '-' ? '%' : ''}</td>;
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      case 'tension': {
                        const rep = rawReports['tension'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('tension');
                        return (
                          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Status: <span style={{ color: status === 'PASS' ? '#059669' : status === 'FAIL' ? '#ef4444' : '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>{status}</span>
                                </div>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#fff' }}>
                                  <th style={{ width: '250px' }}></th>
                                  {sampleNumbers.map(n => (
                                    <th key={n} style={{ padding: '12px', fontSize: '11px', color: '#64748b', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>S{n}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Initial Length (A) in mm</td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.tension.initial[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input type="number" value={val || ''} onChange={(e) => setPhysicalData(prev => ({ ...prev, tension: { ...prev.tension, initial: prev.tension.initial.map((v, i) => i === realIdx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Final Length (B) in mm</td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const val = physicalData.tension.final[realIdx];
                                    return (
                                      <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9' }}>
                                        <input type="number" value={val || ''} onChange={(e) => setPhysicalData(prev => ({ ...prev, tension: { ...prev.tension, final: prev.tension.final.map((v, i) => i === realIdx ? e.target.value : v) } }))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }} />
                                      </td>
                                    );
                                  })}
                                </tr>
                                <tr>
                                  <td style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '700', color: '#334155', background: '#fcfcfc' }}>Tension Set ((B-A)/A*100)</td>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const a = physicalData.tension.initial[realIdx];
                                    const b = physicalData.tension.final[realIdx];
                                    const set = (a && b) ? (((parseFloat(b) - parseFloat(a)) / parseFloat(a)) * 100).toFixed(2) : '-';
                                    return <td key={sn} style={{ padding: '8px', border: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: (set !== '-' && parseFloat(set) > 25) ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{set}{set !== '-' ? '%' : ''}</td>;
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      case 'load': {
                        const specs = currentLoadSpecs;
                        const status = getSectionStatus('load');
                        return (
                          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Status: <span style={{ color: status === 'PASS' ? '#059669' : status === 'FAIL' ? '#ef4444' : '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>{status}</span>
                                </div>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#fcfcfc' }}>
                                  <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }} rowSpan="2">Load (Tonnes)</th>
                                  <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }} colSpan="3">Pad 3</th>
                                  <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }} colSpan="3">Pad 4</th>
                                  <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }} colSpan="3">Pad 5</th>
                                  <th style={{ padding: '10px', fontSize: '11px', border: '1px solid #f1f5f9' }} colSpan="3">Pad 6</th>
                                </tr>
                                <tr style={{ background: '#fcfcfc' }}>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>L Gauge</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>R Gauge</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9', background: '#f0f9ff' }}>Defl (mm)</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>L Gauge</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>R Gauge</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9', background: '#f0f9ff' }}>Defl (mm)</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>L Gauge</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>R Gauge</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9', background: '#f0f9ff' }}>Defl (mm)</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>L Gauge</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9' }}>R Gauge</th>
                                  <th style={{ padding: '8px', fontSize: '10px', border: '1px solid #f1f5f9', background: '#f0f9ff' }}>Defl (mm)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {physicalData.loadTest.loads.slice(0, visibleLoadRows).map((load, idx) => (
                                  <tr key={idx}>
                                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '800', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input 
                                          type="number" 
                                          value={load} 
                                          onChange={(e) => {
                                            const newLoads = [...physicalData.loadTest.loads];
                                            newLoads[idx] = e.target.value;
                                            setPhysicalData(prev => ({ ...prev, loadTest: { ...prev.loadTest, loads: newLoads } }));
                                          }} 
                                          style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '800' }} 
                                        />
                                        <button type="button" onClick={() => handleDeleteRow(idx)} title="Delete Row" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px', fontSize: '14px' }}>✕</button>
                                      </div>
                                    </td>
                                    {['mPad1', 'mPad2', 'mPad3', 'mPad4'].map(padKey => {
                                      const data = physicalData.loadTest[padKey][idx];
                                      const defl = (data.left && data.right) ? ((parseFloat(data.left) + parseFloat(data.right)) / 2).toFixed(2) : '-';
                                      const isOutAtEnd = idx === (visibleLoadRows - 1) && defl !== '-' && (parseFloat(defl) < specs.min || parseFloat(defl) > specs.max);
                                      return (
                                        <React.Fragment key={padKey}>
                                          <td style={{ padding: '4px', border: '1px solid #f1f5f9' }}>
                                            <input type="number" value={data.left} disabled={!load || String(load).trim() === ''} onChange={(e) => setPhysicalData(prev => ({ ...prev, loadTest: { ...prev.loadTest, [padKey]: prev.loadTest[padKey].map((v, i) => i === idx ? { ...v, left: e.target.value } : v) } }))} style={{ width: '100%', padding: '6px', border: '1px solid #f1f5f9', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '700', backgroundColor: (!load || String(load).trim() === '') ? '#f8fafc' : '#fff' }} />
                                          </td>
                                          <td style={{ padding: '4px', border: '1px solid #f1f5f9' }}>
                                            <input type="number" value={data.right} disabled={!load || String(load).trim() === ''} onChange={(e) => setPhysicalData(prev => ({ ...prev, loadTest: { ...prev.loadTest, [padKey]: prev.loadTest[padKey].map((v, i) => i === idx ? { ...v, right: e.target.value } : v) } }))} style={{ width: '100%', padding: '6px', border: '1px solid #f1f5f9', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: '700', backgroundColor: (!load || String(load).trim() === '') ? '#f8fafc' : '#fff' }} />
                                          </td>
                                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '900', background: '#f8fafc', border: '1px solid #f1f5f9', color: isOutAtEnd ? '#ef4444' : '#21808d' }}>{defl}</td>
                                        </React.Fragment>
                                      );
                                    })}
                                  </tr>
                                ))}
                                {visibleLoadRows < 8 && (
                                  <tr>
                                    <td style={{ textAlign: 'center', padding: '10px' }}>
                                      <button 
                                        type="button" 
                                        onClick={() => setVisibleLoadRows(prev => Math.min(prev + 1, 8))}
                                        style={{ padding: '5px 15px', background: '#e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', width: '100%' }}>
                                        + Add Row
                                      </button>
                                    </td>
                                    <td colSpan="12" style={{ border: 'none' }}></td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      case 'resistance': {
                        const rep = rawReports['resistance'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('resistance');
                        return (
                          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h3>
                              </div>
                              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c', textTransform: 'uppercase' }}>{status}</span>
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
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const row = elecData.resistance[realIdx];
                                    const bMin = (row.bF && row.bR) ? Math.min(parseFloat(row.bF), parseFloat(row.bR)) : '-';
                                    const aMin = (row.aF && row.aR) ? Math.min(parseFloat(row.aF), parseFloat(row.aR)) : '-';
                                    return (
                                      <tr key={sn}>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{sn}</td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={row.bF || ''} onChange={(e) => setElecData(prev => ({ ...prev, resistance: prev.resistance.map((r, i) => i === realIdx ? { ...r, bF: e.target.value } : r) }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={row.bR || ''} onChange={(e) => setElecData(prev => ({ ...prev, resistance: prev.resistance.map((r, i) => i === realIdx ? { ...r, bR: e.target.value } : r) }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: bMin !== '-' && bMin < 100 ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{bMin}</td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={row.aF || ''} onChange={(e) => setElecData(prev => ({ ...prev, resistance: prev.resistance.map((r, i) => i === realIdx ? { ...r, aF: e.target.value } : r) }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={row.aR || ''} onChange={(e) => setElecData(prev => ({ ...prev, resistance: prev.resistance.map((r, i) => i === realIdx ? { ...r, aR: e.target.value } : r) }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: aMin !== '-' && aMin < 100 ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{aMin}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      case 'sg': {
                        const specs = currentSGSpecs;
                        const rep = rawReports['sg'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('sg');
                        return (
                          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h3>
                              </div>
                              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c', textTransform: 'uppercase' }}>{status}</span>
                              </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                                    <th colSpan="3" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Compound A</th>
                                    {isCGRSP && <th colSpan="3" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Compound B</th>}
                                    {isNCRGRSP && <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Variation</th>}
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
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const rA = elecData.sg.compoundA[realIdx];
                                    const rB = elecData.sg.compoundB[realIdx];
                                    const sgA = (rA.air && rA.water) ? (parseFloat(rA.air) / (parseFloat(rA.air) - parseFloat(rA.water))).toFixed(3) : '-';
                                    const sgB = (rB.air && rB.water) ? (parseFloat(rB.air) / (parseFloat(rB.air) - parseFloat(rB.water))).toFixed(3) : '-';
                                    const variation = (sgA !== '-' && sgB !== '-') ? (parseFloat(sgA) - parseFloat(sgB)).toFixed(3) : '-';

                                    return (
                                      <tr key={sn}>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{sn}</td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={rA.air || ''} onChange={(e) => setElecData(prev => ({ ...prev, sg: { ...prev.sg, compoundA: prev.sg.compoundA.map((r, i) => i === realIdx ? { ...r, air: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={rA.water || ''} onChange={(e) => setElecData(prev => ({ ...prev, sg: { ...prev.sg, compoundA: prev.sg.compoundA.map((r, i) => i === realIdx ? { ...r, water: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: sgA !== '-' && parseFloat(sgA) > specs.a ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{sgA}</td>

                                        {isCGRSP && (
                                          <>
                                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                              <input type="number" value={rB.air || ''} onChange={(e) => setElecData(prev => ({ ...prev, sg: { ...prev.sg, compoundB: prev.sg.compoundB.map((r, i) => i === realIdx ? { ...r, air: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                            </td>
                                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                              <input type="number" value={rB.water || ''} onChange={(e) => setElecData(prev => ({ ...prev, sg: { ...prev.sg, compoundB: prev.sg.compoundB.map((r, i) => i === realIdx ? { ...r, water: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: sgB !== '-' && parseFloat(sgB) > specs.b ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{sgB}</td>
                                            {isNCRGRSP && (
                                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: variation !== '-' && Math.abs(parseFloat(variation)) > specs.variation ? '#ef4444' : '#64748b', background: '#f8fafc' }}>{variation}</td>
                                            )}
                                          </>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      case 'ash': {
                        const specs = currentAshSpecs;
                        const rep = rawReports['ash'];
                        const doubleOutCount = rep ? rep.doubleOutCount : 0;
                        const status = getSectionStatus('ash');
                        return (
                          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h3>
                              </div>
                              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                  Double Sample out of Tolerance: <span style={{ color: doubleOutCount > 0 ? '#ef4444' : '#059669', fontWeight: '800' }}>{String(doubleOutCount).padStart(2, '0')}</span>
                                </div>
                                <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c', textTransform: 'uppercase' }}>{status}</span>
                              </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                                    <th colSpan="4" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Product A</th>
                                    {isCGRSP && <th colSpan="4" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Product B</th>}
                                    {isNCRGRSP && <th rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Variation</th>}
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
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const rA = elecData.ash.compoundA[realIdx];
                                    const rB = elecData.ash.compoundB[realIdx];
                                    const ashA = (rA.crucible && rA.sample && rA.ash) ? (((parseFloat(rA.ash) - parseFloat(rA.crucible)) / (parseFloat(rA.sample) - parseFloat(rA.crucible))) * 100).toFixed(2) : '-';
                                    const ashB = (rB.crucible && rB.sample && rB.ash) ? (((parseFloat(rB.ash) - parseFloat(rB.crucible)) / (parseFloat(rB.sample) - parseFloat(rB.crucible))) * 100).toFixed(2) : '-';
                                    const variation = (ashA !== '-' && ashB !== '-') ? (parseFloat(ashA) - parseFloat(ashB)).toFixed(2) : '-';

                                    return (
                                      <tr key={sn}>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{sn}</td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={rA.crucible || ''} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundA: prev.ash.compoundA.map((r, i) => i === realIdx ? { ...r, crucible: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={rA.sample || ''} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundA: prev.ash.compoundA.map((r, i) => i === realIdx ? { ...r, sample: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={rA.ash || ''} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundA: prev.ash.compoundA.map((r, i) => i === realIdx ? { ...r, ash: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: ashA !== '-' && parseFloat(ashA) > specs.a ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{ashA}%</td>

                                        {isCGRSP && (
                                          <>
                                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                              <input type="number" value={rB.crucible || ''} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundB: prev.ash.compoundB.map((r, i) => i === realIdx ? { ...r, crucible: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                            </td>
                                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                              <input type="number" value={rB.sample || ''} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundB: prev.ash.compoundB.map((r, i) => i === realIdx ? { ...r, sample: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                            </td>
                                            <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                              <input type="number" value={rB.ash || ''} onChange={(e) => setElecData(prev => ({ ...prev, ash: { ...prev.ash, compoundB: prev.ash.compoundB.map((r, i) => i === realIdx ? { ...r, ash: e.target.value } : r) } }))} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: ashB !== '-' && parseFloat(ashB) > specs.b ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{ashB}%</td>
                                            {isNCRGRSP && (
                                              <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: variation !== '-' && Math.abs(parseFloat(variation)) > specs.variation ? '#ef4444' : '#64748b', background: '#f8fafc' }}>{variation}</td>
                                            )}
                                          </>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      case 'adhesion': {
                        const status = getSectionStatus('adhesion');
                        return (
                          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h3>
                                <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>Limit: ≥8 Kgf</div>
                              </div>
                              <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c', textTransform: 'uppercase' }}>{status}</span>
                            </div>
                            <div style={{ padding: '20px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    {sampleNumbers.map(n => <th key={n} style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b', fontWeight: '700', borderBottom: '2px solid #f1f5f9' }}>Sample {n} (S{n})</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    {sampleNumbers.map((sn, idx) => {
                                      const realIdx = startIdx + idx;
                                      const v = specData.adhesion[realIdx];
                                      return (
                                        <td key={sn} style={{ padding: '12px', border: '1px solid #f1f5f9' }}>
                                          <input type="number" value={v || ''} onChange={(e) => {
                                            const val = e.target.value;
                                            const newA = [...specData.adhesion];
                                            newA[realIdx] = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
                                            setSpecData(prev => ({ ...prev, adhesion: newA }));
                                            markDirty();
                                          }} style={{ width: '100%', padding: '12px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '16px', background: v !== '' && v < 8 ? '#fef2f2' : 'transparent', color: v !== '' && v < 8 ? '#ef4444' : '#21808d' }} />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      case 'secant': {
                        const status = getSectionStatus('secant');
                        const secantDoubleResults = specData.secant.map(s => {
                          const isS20Complete = s.s20 && Object.values(s.s20).every(v => v !== '');
                          const isS90Complete = s.s90 && Object.values(s.s90).every(v => v !== '');
                          const d1Raw = isS20Complete ? (parseFloat(s.s20.a) + parseFloat(s.s20.b) + parseFloat(s.s20.c) + parseFloat(s.s20.d)) / 4 : 0;
                          const d2Raw = isS90Complete ? (parseFloat(s.s90.a) + parseFloat(s.s90.b) + parseFloat(s.s90.c) + parseFloat(s.s90.d)) / 4 : 0;
                          const d1 = isS20Complete ? Math.round(d1Raw * 100) / 100 : 0;
                          const d2 = isS90Complete ? Math.round(d2Raw * 100) / 100 : 0;
                          const diff = d2 - d1;
                          const stiffness = (isS20Complete && isS90Complete && Math.abs(diff) > 0.0001) ? (70 / diff).toFixed(2) : 0;
                          return { d1, d2, stiffness, isS20Complete, isS90Complete };
                        });
                        return (
                          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h3>
                                <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>Limit: {currentSecantSpecs.min} - {currentSecantSpecs.max} kN/mm</div>
                              </div>
                              <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c', textTransform: 'uppercase' }}>{status}</span>
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
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const sample = specData.secant[realIdx];
                                    const res = secantDoubleResults[realIdx];
                                    return (
                                      <React.Fragment key={sn}>
                                        <tr>
                                          <td rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#475569' }}>{sn}</td>
                                          <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#64748b' }}>20</td>
                                          {['a', 'b', 'c', 'd'].map(key => (
                                            <td key={key} style={{ padding: '2px', border: '1px solid #e2e8f0' }}>
                                              <input type="number" value={sample.s20[key] || ''} onChange={(e) => {
                                                const newVal = [...specData.secant];
                                                newVal[realIdx].s20[key] = e.target.value;
                                                setSpecData(prev => ({ ...prev, secant: newVal }));
                                                markDirty();
                                              }} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                            </td>
                                          ))}
                                          <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{res.isS20Complete ? res.d1.toFixed(2) : '-'}</td>
                                          <td rowSpan="2" style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: res.stiffness >= currentSecantSpecs.min && res.stiffness <= currentSecantSpecs.max ? '#166534' : '#ef4444', background: '#f1f5f9', fontSize: '18px' }}>
                                            {res.stiffness > 0 ? res.stiffness : '-'}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#64748b' }}>90</td>
                                          {['a', 'b', 'c', 'd'].map(key => (
                                            <td key={key} style={{ padding: '2px', border: '1px solid #e2e8f0' }}>
                                              <input type="number" value={sample.s90[key] || ''} onChange={(e) => {
                                                const newVal = [...specData.secant];
                                                newVal[realIdx].s90[key] = e.target.value;
                                                setSpecData(prev => ({ ...prev, secant: newVal }));
                                                markDirty();
                                              }} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                            </td>
                                          ))}
                                          <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{res.isS90Complete ? res.d2.toFixed(2) : '-'}</td>
                                        </tr>
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      case 'ncrAdhesion': {
                        const status = getSectionStatus('ncrAdhesion');
                        return (
                          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h3>
                                <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>Limit: Peel ≥ 4.0 Kgf | H-Pull ≥ 10 Kgf (Optional)</div>
                              </div>
                              <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c', textTransform: 'uppercase' }}>{status}</span>
                            </div>
                            <div style={{ padding: '20px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample No.</th>
                                    <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>Peel Adhesion (Kgf)</th>
                                    <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>H-Pull Test (Kgf) <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>(Optional)</span></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const row = specData.ncrgrsp.adhesion[realIdx];
                                    return (
                                      <tr key={sn}>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#475569' }}>S{sn}</td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={row.peel || ''} onChange={(e) => {
                                            const newVal = [...specData.ncrgrsp.adhesion];
                                            newVal[realIdx].peel = e.target.value;
                                            setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, adhesion: newVal } }));
                                            markDirty();
                                          }} style={{ width: '100%', padding: '10px', border: 'none', textAlign: 'center', fontWeight: '900', fontSize: '15px', color: row.peel !== '' && row.peel < 4 ? '#ef4444' : '#21808d' }} />
                                        </td>
                                        <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={row.hpull || ''} onChange={(e) => {
                                            const newVal = [...specData.ncrgrsp.adhesion];
                                            newVal[realIdx].hpull = e.target.value;
                                            setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, adhesion: newVal } }));
                                            markDirty();
                                          }} style={{ width: '100%', padding: '10px', border: 'none', textAlign: 'center', fontWeight: '900', fontSize: '15px', color: row.hpull !== '' && row.hpull < 10 ? '#ef4444' : '#21808d' }} />
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      case 'ncrBreaking': {
                        const status = getSectionStatus('ncrBreaking');
                        return (
                          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h3>
                                <div style={{ fontSize: '11px', color: '#21808d', fontWeight: '700', marginTop: '2px' }}>Limit: 350 Kgf Min</div>
                              </div>
                              <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c', textTransform: 'uppercase' }}>{status}</span>
                            </div>
                            <div style={{ padding: '20px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    {sampleNumbers.map(n => <th key={n} style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '12px', color: '#475569', fontWeight: '800' }}>S{n}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    {sampleNumbers.map((sn, idx) => {
                                      const realIdx = startIdx + idx;
                                      const v = specData.ncrgrsp.breaking[realIdx];
                                      return (
                                        <td key={sn} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                          <input type="number" value={v || ''} onChange={(e) => {
                                            const newVal = [...specData.ncrgrsp.breaking];
                                            newVal[realIdx] = e.target.value;
                                            setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, breaking: newVal } }));
                                            markDirty();
                                          }} style={{ width: '100%', padding: '10px', border: 'none', textAlign: 'center', fontWeight: '900', fontSize: '15px', color: v !== '' && v < 350 ? '#ef4444' : '#21808d' }} />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      case 'ncrCord': {
                        const status = getSectionStatus('ncrCord');
                        return (
                          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{config.name} (Double Sampling)</h3>
                              </div>
                              <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c', textTransform: 'uppercase' }}>{status}</span>
                            </div>
                            <div style={{ padding: '20px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Sample</th>
                                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Denier (gm/9000m) (3200 min)</th>
                                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>No. of ends/inch (22-26)</th>
                                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Thickness (mm) (0.75 min)</th>
                                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Load at Break (kg) (16 min)</th>
                                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Elongation at Break (%) (20 max)</th>
                                    <th style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>Twists/m (305-335)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sampleNumbers.map((sn, idx) => {
                                    const realIdx = startIdx + idx;
                                    const row = specData.ncrgrsp.nylonCord[realIdx];
                                    return (
                                      <tr key={sn}>
                                        <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '800', color: '#475569' }}>S{sn}</td>
                                        {Object.keys(row).map(key => (
                                          <td key={key} style={{ padding: '2px', border: '1px solid #e2e8f0' }}>
                                            <input type="number" value={row[key] || ''} onChange={(e) => {
                                              const newVal = [...specData.ncrgrsp.nylonCord];
                                              newVal[realIdx][key] = e.target.value;
                                              setSpecData(prev => ({ ...prev, ncrgrsp: { ...prev.ncrgrsp, nylonCord: newVal } }));
                                              markDirty();
                                            }} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} />
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      default:
                        return null;
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Final Inspection Results Panel */}
      {(() => {
        const uom = call?.unit || 'Nos';
        const offeredQty = activeLot?.size || 0;

        const getSubmoduleBadge = (status) => {
          const isPass = status === 'PASS' || status === 'LOT PASSED' || status === 'Passed' || status === 'ACCEPTED';
          const isFail = status === 'FAIL' || status === 'PERMANENT REJECT' || status === 'Rejected' || status === 'REJECTED';
          const isRetest = status === 'RE-TEST REQUIRED' || status === 'RE-TEST' || status === 'Under Testing' || status === 'UNDER TESTING' || status === 'MARGINAL';
          const isReoffered = status === 'RE-OFFERED' || status === 'RE-OFFER';

          let bg = '#f59e0b';
          let color = '#ffffff';
          let border = '#f59e0b';
          let label = 'PENDING';

          if (isPass) {
            bg = '#10b981';
            color = '#ffffff';
            border = '#10b981';
            label = 'PASS';
          } else if (isFail) {
            bg = '#ef4444';
            color = '#ffffff';
            border = '#ef4444';
            label = 'FAIL';
          } else if (isRetest) {
            bg = '#3b82f6';
            color = '#ffffff';
            border = '#3b82f6';
            label = 'RE-TEST';
          } else if (isReoffered) {
            bg = '#2563eb';
            color = '#ffffff';
            border = '#2563eb';
            label = 'RE-OFFERED';
          }

          return { bg, color, border, label };
        };

        const activeLotOverallBadge = getSubmoduleBadge(activeLotOverallStatus);
        const activeLotBg = activeLotOverallStatus === 'ACCEPTED' ? '#f0fdf4'
          : activeLotOverallStatus === 'REJECTED' ? '#fef2f2'
          : (activeLotOverallStatus === 'RE-OFFERED' || activeLotOverallStatus === 'RE-OFFER') ? '#eff6ff'
          : '#fffbeb';
        const activeLotBorder = activeLotOverallStatus === 'ACCEPTED' ? '#bbf7d0'
          : activeLotOverallStatus === 'REJECTED' ? '#fecaca'
          : (activeLotOverallStatus === 'RE-OFFERED' || activeLotOverallStatus === 'RE-OFFER') ? '#bfdbfe'
          : '#fde68a';

        const effectiveLots = lots.map(l => {
          let lotStatus = l.status || 'Pending';
          const cachedStatus = localStorage.getItem(`railpad_status_${currentCallId}_${l.id}`);

          if (l.id === selectedLot) {
            if (activeLotOverallStatus === 'ACCEPTED') {
              lotStatus = 'Passed';
            } else if (activeLotOverallStatus === 'RE-OFFERED') {
              lotStatus = 'RE-OFFERED';
            } else if (activeLotOverallStatus === 'REJECTED') {
              lotStatus = 'Rejected';
            } else if (activeLotOverallStatus === 'PENDING') {
              lotStatus = 'Pending';
            } else {
              lotStatus = activeLotOverallStatus || 'Pending';
            }
          } else if (cachedStatus) {
            if (cachedStatus === 'ACCEPTED') {
              lotStatus = 'Passed';
            } else if (cachedStatus === 'RE-OFFERED') {
              lotStatus = 'RE-OFFERED';
            } else if (cachedStatus === 'REJECTED') {
              lotStatus = 'Rejected';
            } else if (cachedStatus === 'PENDING') {
              lotStatus = 'Pending';
            } else {
              lotStatus = cachedStatus || 'Pending';
            }
          }
          return { ...l, status: lotStatus };
        });

        const totalLots = effectiveLots.length;
        const acceptedCount = effectiveLots.filter(l => l.status === 'Passed').length;
        const rejectedCount = effectiveLots.filter(l => l.status === 'Rejected').length;
        const partialCount = effectiveLots.filter(l => l.status === 'Under Testing' || l.status === 'RE-TEST' || l.status === 'MARGINAL').length;

        let overallStatus = 'PENDING';
        let overallStatusBg = '#fef3c7';
        let overallStatusColor = '#92400e';
        let overallStatusBorder = '#fcd34d';

        if (effectiveLots.some(l => l.status === 'Pending')) {
          overallStatus = 'PENDING';
        } else if (acceptedCount === totalLots && totalLots > 0) {
          overallStatus = 'ACCEPTED';
          overallStatusBg = '#dcfce7';
          overallStatusColor = '#166534';
          overallStatusBorder = '#86efac';
        } else if (rejectedCount === totalLots && totalLots > 0) {
          overallStatus = 'REJECTED';
          overallStatusBg = '#fee2e2';
          overallStatusColor = '#991b1b';
          overallStatusBorder = '#fca5a5';
        } else if (totalLots > 0) {
          overallStatus = 'PARTIALLY ACCEPTED';
          overallStatusBg = '#fef3c7';
          overallStatusColor = '#92400e';
          overallStatusBorder = '#fcd34d';
        }

        return (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            marginTop: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Final Inspection Results</h3>
              <span style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: overallStatusBg,
                color: overallStatusColor,
                border: `1px solid ${overallStatusBorder}`
              }}>
                Overall Status: {overallStatus} ({acceptedCount} Accepted, {partialCount} Partial, {rejectedCount} Rejected)
              </span>
            </div>

            {/* Lot Selection Tabs */}
            {effectiveLots.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '1px dashed #e2e8f0',
                flexWrap: 'wrap'
              }}>
                {effectiveLots.map(lot => {
                  const isActive = lot.id === selectedLot;
                  const lotStatus = lot.status || 'Pending';

                  let statusColor = '#92400e'; // default pending/orange
                  let statusBg = '#fef3c7';
                  let statusBorder = '#fcd34d';

                  if (lotStatus === 'Passed' || lotStatus === 'ACCEPTED' || lotStatus === 'PASS') {
                    statusColor = '#166534';
                    statusBg = '#dcfce7';
                    statusBorder = '#86efac';
                  } else if (lotStatus === 'Rejected' || lotStatus === 'REJECTED' || lotStatus === 'FAIL') {
                    statusColor = '#991b1b';
                    statusBg = '#fee2e2';
                    statusBorder = '#fca5a5';
                  } else if (lotStatus === 'Under Testing' || lotStatus === 'RE-TEST' || lotStatus === 'MARGINAL') {
                    statusColor = '#1e40af';
                    statusBg = '#eff6ff';
                    statusBorder = '#bfdbfe';
                  } else if (lotStatus === 'RE-OFFERED' || lotStatus === 'RE-OFFER') {
                    statusColor = '#1e40af';
                    statusBg = '#eff6ff';
                    statusBorder = '#bfdbfe';
                  }

                  return (
                    <button
                      key={lot.id}
                      onClick={() => handleLotClick(lot.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontSize: '14.5px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        border: isActive ? '2.5px solid #21808d' : '1px solid #cbd5e1',
                        background: isActive ? '#f0fdfa' : '#fff',
                        color: isActive ? '#21808d' : '#475569',
                        boxShadow: isActive ? '0 4px 10px rgba(33, 128, 141, 0.18)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
                        outline: 'none',
                        transform: isActive ? 'translateY(-1px)' : 'none'
                      }}
                    >
                      <span style={{ letterSpacing: '0.5px' }}>{lot.id}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Lot Summary Box */}
            <div style={{
              background: activeLotBg,
              border: `1px solid ${activeLotBorder}`,
              borderRadius: '12px',
              padding: '16px'
            }}>
              {/* Submodule Status Badges / Tab Selection */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                {(() => {
                  const visualDimStatus = (visualStatus === 'FAIL' || dimensionalStatus === 'FAIL') ? 'FAIL'
                    : (visualStatus === 'RE-OFFERED' || dimensionalStatus === 'RE-OFFERED' || visualStatus === 'RE-OFFER' || dimensionalStatus === 'RE-OFFER') ? 'RE-OFFERED'
                      : (visualStatus === 'PENDING' || dimensionalStatus === 'PENDING') ? 'PENDING'
                        : 'PASS';
                  return [
                    { key: 'visualDim', label: 'Visual & Dimensional', status: visualDimStatus },
                    { key: 'physical', label: 'Physical & Ageing Properties', status: physicalStatus },
                    { key: 'electrical', label: 'Electrical & Chemical', status: elecStatus },
                    ...(!isNCRGRSP ? [{ key: 'specialized', label: 'Dynamic & Durability Test', status: specStatus }] : []),
                    { key: 'periodic', label: 'Periodic Testing', status: periodicStatus },
                    ...(isNCRGRSP ? [{ key: 'ncrgrsp', label: 'NCRGRSP', status: ncrStatus }] : [])
                  ].map(({ key, label, status }) => {
                    const badge = getSubmoduleBadge(status);
                    const isActive = key === activeSubmoduleTab;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveSubmoduleTab(key)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: isActive ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: `1px solid ${badge.border}`,
                          background: badge.bg,
                          color: badge.color,
                          boxShadow: isActive ? '0 0 0 2px #ffffff, 0 0 0 4.5px #21808d, 0 4px 8px rgba(0, 0, 0, 0.12)' : 'none',
                          outline: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transform: isActive ? 'scale(1.02)' : 'none',
                          zIndex: isActive ? 10 : 1
                        }}
                      >
                        {label}
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: badge.color,
                          display: 'inline-block'
                        }} />
                      </button>
                    );
                  });
                })()}

                <span style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  background: activeLotOverallBadge.bg,
                  color: activeLotOverallBadge.color,
                  border: `1px solid ${activeLotOverallBadge.border}`,
                  marginLeft: 'auto'
                }}>
                  Lot Status: {activeLotOverallStatus}
                </span>
              </div>

              {/* Submodule Section Details Table */}
              <div style={{
                background: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '12px 16px',
                marginTop: '12px',
                marginBottom: '20px',
                marginLeft: 'auto',
                marginRight: 'auto',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                maxWidth: '800px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Section Name</th>
                      <th style={{ textAlign: 'center', padding: '8px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '150px' }}>Sample Size</th>
                      <th style={{ textAlign: 'center', padding: '8px 16px', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '130px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let rows = [];
                      if (activeSubmoduleTab === 'visualDim') {
                        rows = [
                          { name: "Visual Inspection", size: visualData.visualN || 25, status: visualResult },
                          { name: "Dimensional Inspection", size: visualData.dimN || 25, status: dimensionalResult },
                          ...(!isNCRGRSP ? [{
                            name: "Weight Test",
                            size: (weightData.isSecondActive || showWeightSecond) ? `${weightData.n1} + ${weightData.n2}` : weightData.n1,
                            status: weightStatus === 'ACCEPTED' ? 'PASS' : weightStatus === 'REJECTED' ? 'FAIL' : weightStatus
                          }] : [])
                        ];
                      } else if (activeSubmoduleTab === 'physical') {
                        const keys = ['hardness', 'tensile', 'elongation', 'modulus', 'compression', 'tension', 'load', 'resilience'];
                        rows = keys.map(k => {
                          const rep = rawReports[k];
                          const name = SECTION_CONFIG[k]?.name || k;
                          const size = (rep && (rep.doubleFilled > 0 || k === marginalSectionKey)) ? `${rep.primaryCount} + ${rep.doubleCount}` : (rep ? rep.primaryCount : 0);
                          return { name, size, status: getSectionStatus(k) };
                        });
                      } else if (activeSubmoduleTab === 'electrical') {
                        const keys = ['resistance', 'sg', 'ash', 'ozone'];
                        rows = keys.map(k => {
                          const rep = rawReports[k];
                          const name = SECTION_CONFIG[k]?.name || k;
                          const size = (rep && (rep.doubleFilled > 0 || k === marginalSectionKey)) ? `${rep.primaryCount} + ${rep.doubleCount}` : (rep ? rep.primaryCount : 0);
                          return { name, size, status: getSectionStatus(k) };
                        });
                      } else if (activeSubmoduleTab === 'specialized') {
                        const keys = ['adhesion', 'secant'];
                        rows = keys.map(k => {
                          const rep = rawReports[k];
                          const name = SECTION_CONFIG[k]?.name || k;
                          const size = (rep && (rep.doubleFilled > 0 || k === marginalSectionKey)) ? `${rep.primaryCount} + ${rep.doubleCount}` : (rep ? rep.primaryCount : 0);
                          return { name, size, status: getSectionStatus(k) };
                        });
                      } else if (activeSubmoduleTab === 'ncrgrsp') {
                        const keys = ['ncrAdhesion', 'ncrBreaking', 'ncrCord'];
                        rows = keys.map(k => {
                          const rep = rawReports[k];
                          const name = SECTION_CONFIG[k]?.name || k;
                          const size = (rep && (rep.doubleFilled > 0 || k === marginalSectionKey)) ? `${rep.primaryCount} + ${rep.doubleCount}` : (rep ? rep.primaryCount : 0);
                          return { name, size, status: getSectionStatus(k) };
                        });
                      } else if (activeSubmoduleTab === 'periodic') {
                        const keys = ['tga', 'durability', 'abrasion'];
                        rows = keys.map(k => {
                          const rep = rawReports[k];
                          const name = SECTION_CONFIG[k]?.name || k;
                          const size = (rep && (rep.doubleFilled > 0 || k === marginalSectionKey)) ? `${rep.primaryCount} + ${rep.doubleCount}` : (rep ? rep.primaryCount : 0);
                          return { name, size, status: getSectionStatus(k) };
                        });
                      }

                      return rows.map((row, idx) => {
                        const badge = getSubmoduleBadge(row.status);
                        return (
                          <tr key={idx} style={{ borderBottom: idx < rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <td style={{ padding: '7px 16px', fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>
                              {row.name}
                            </td>
                            <td style={{ padding: '7px 16px', fontSize: '13.5px', fontWeight: '800', color: '#475569', textAlign: 'center' }}>
                              {row.size}
                            </td>
                            <td style={{ padding: '7px 16px', textAlign: 'center' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: '800',
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'inline-block'
                              }}>
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Lot Details Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
                alignItems: 'end'
              }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Lot ID</span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{selectedLot}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Offered Qty ({isNCRGRSP ? 'Sets' : uom})
                  </span>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                    {isNCRGRSP && ncrSetsOffered !== '' ? ncrSetsOffered : offeredQty}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '10.5px', color: '#0369a1', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Accepted Qty ({isNCRGRSP ? 'Sets' : uom})
                  </span>
                  <strong style={{ fontSize: '13.5px', color: '#0369a1' }}>
                    {isNCRGRSP && ncrSetsAccepted !== '' ? ncrSetsAccepted : acceptedQty}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '10.5px', color: '#dc2626', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Rejected Qty ({isNCRGRSP ? 'Sets' : uom})
                  </span>
                  <strong style={{ fontSize: '13.5px', color: '#dc2626' }}>
                    {isNCRGRSP && ncrSetsRejected !== '' ? ncrSetsRejected : rejectedQty}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Remarks (Required)</span>
                  <input
                    type="text"
                    placeholder="Enter remarks..."
                    value={remarks}
                    onChange={(e) => { setRemarks(e.target.value); markDirty(); }}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      boxSizing: 'border-box',
                      height: '32px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sealing & Hologram Details Section (Common for all lots) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              marginTop: '16px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                    {isNCRGRSP ? 'Common Details (NCRGRSP Sets & Sealing/Hologram)' : 'Sealing & Hologram Details'}
                  </h4>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Common for all lots
                  </span>
                </div>
              </div>

              {/* NCRGRSP Sets Summary Section (Common for all lots) */}
              {isNCRGRSP && (
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #cbd5e1',
                  marginBottom: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '4px', height: '16px', background: '#0284c7', borderRadius: '2px' }} />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      NCRGRSP Sets Quantity Summary
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: '700',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      marginLeft: 'auto'
                    }}>
                      NCRGRSP SETS
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    alignItems: 'start'
                  }}>
                    {/* 1. Sets Offered */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        SETS OFFERED (AUTO FROM VENDOR ENTRY)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          value={ncrSetsOffered}
                          readOnly
                          placeholder="Auto from vendor entry..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '13.5px',
                            fontWeight: '700',
                            color: '#0f172a',
                            background: '#f1f5f9',
                            boxSizing: 'border-box',
                            cursor: 'not-allowed'
                          }}
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                          Sets
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                        Section 6 of IC (Qty Now Offered)
                      </span>
                    </div>

                    {/* 2. Sets Accepted */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                        SETS ACCEPTED (MANUAL ENTRY) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          value={ncrSetsAccepted}
                          onChange={(e) => handleNcrSetsAcceptedChange(e.target.value)}
                          placeholder="Enter accepted sets..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #86efac',
                            fontSize: '13.5px',
                            fontWeight: '700',
                            color: '#166534',
                            background: '#f0fdf4',
                            boxSizing: 'border-box'
                          }}
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: '700', color: '#166534' }}>
                          Sets
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#166534', marginTop: '2px', display: 'block' }}>
                        Section 7 of IC (Qty Now Passed)
                      </span>
                    </div>

                    {/* 3. Sets Rejected */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
                        SETS REJECTED (OFFERED - ACCEPTED)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          value={ncrSetsRejected}
                          readOnly
                          placeholder="Auto-calculated (0)"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #fecaca',
                            fontSize: '13.5px',
                            fontWeight: '700',
                            color: '#dc2626',
                            background: '#fef2f2',
                            boxSizing: 'border-box',
                            cursor: 'not-allowed'
                          }}
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>
                          Sets
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        Section 8 of IC (Qty Now Rejected)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sealing Type Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '12px 16px',
                background: '#fffbeb',
                borderRadius: '10px',
                border: '1px solid #fde68a'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ARE YOU SEALING WITH:
                </span>

                <div style={{
                  display: 'flex',
                  background: '#fef3c7',
                  padding: '4px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24'
                }}>
                  <button
                    onClick={() => {
                      setSealingType(prev => prev === 'RITES_HOLOGRAM' ? '' : 'RITES_HOLOGRAM');
                      markDirty();
                    }}
                    style={{
                      padding: '6px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      border: 'none',
                      background: sealingType === 'RITES_HOLOGRAM' ? '#fff' : 'transparent',
                      color: '#b45309',
                      boxShadow: sealingType === 'RITES_HOLOGRAM' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      border: '2px solid #b45309',
                      background: sealingType === 'RITES_HOLOGRAM' ? '#b45309' : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}>
                      {sealingType === 'RITES_HOLOGRAM' && '✓'}
                    </span>
                    RITES Hologram
                  </button>
                </div>
              </div>

              {/* Hologram Details */}
              {sealingType === 'RITES_HOLOGRAM' && (
                <div style={{
                  background: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                  marginTop: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '18px', background: '#166534', borderRadius: '3px' }}></div>
                      <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#166534' }}>Hologram Entries</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setHologramEntries(prev => [...prev, { id: Date.now(), type: 'range', from: '', to: '' }]);
                          markDirty();
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          background: '#0284c7',
                          color: 'white',
                          borderRadius: '4px',
                          border: 'none',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        + Add Range
                      </button>
                      <button
                        onClick={() => {
                          setHologramEntries(prev => [...prev, { id: Date.now(), type: 'single', value: '' }]);
                          markDirty();
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          background: '#0284c7',
                          color: 'white',
                          borderRadius: '4px',
                          border: 'none',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        + Add Single
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {hologramEntries.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '14px', border: '2px dashed #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '12.5px', fontStyle: 'italic' }}>
                        No holograms added. Click "+ Add Range" or "+ Add Single" above to add hologram numbers for this call.
                      </div>
                    )}
                    {hologramEntries.map((holo, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        background: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <span style={{ fontSize: '12px', color: '#166534', minWidth: '60px', fontWeight: '700' }}>
                          {holo.type === 'range' ? 'RANGE' : 'SINGLE'}
                        </span>
                        {holo.type === 'range' ? (
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>FROM</span>
                              <input
                                placeholder="Start No."
                                value={holo.from || ''}
                                onChange={(e) => {
                                  setHologramEntries(prev => {
                                    const current = [...prev];
                                    current[idx] = { ...current[idx], from: e.target.value };
                                    return current;
                                  });
                                  markDirty();
                                }}
                                style={{ width: '110px', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                              />
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>to</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>TO</span>
                              <input
                                placeholder="End No."
                                value={holo.to || ''}
                                onChange={(e) => {
                                  setHologramEntries(prev => {
                                    const current = [...prev];
                                    current[idx] = { ...current[idx], to: e.target.value };
                                    return current;
                                  });
                                  markDirty();
                                }}
                                style={{ width: '110px', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>HOLOGRAM NUMBER</span>
                            <input
                              placeholder="Enter number..."
                              value={holo.value || ''}
                              onChange={(e) => {
                                setHologramEntries(prev => {
                                  const current = [...prev];
                                  current[idx] = { ...current[idx], value: e.target.value };
                                  return current;
                                });
                                markDirty();
                              }}
                              style={{ width: '230px', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setHologramEntries(prev => prev.filter((_, i) => i !== idx));
                            markDirty();
                          }}
                          style={{
                            background: '#fee2e2',
                            border: '1px solid #fca5a5',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            marginLeft: 'auto',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Inspection Photo Capture Section (Same as ERC) */}
              <ImageCaptureComponent
                images={capturedImages}
                onImagesChange={(imgs) => {
                  setCapturedImages(imgs);
                  if (currentCallId) {
                    saveImages(`railpad_final_images_${currentCallId}`, imgs);
                  }
                  markDirty();
                }}
                minImages={5}
                maxImages={10}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => handleSaveAction('DRAFT')}
                disabled={isSubmitting}
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  background: '#fff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSaveAction('PAUSE')}
                disabled={isSubmitting}
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  background: '#fff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                Pause Inspection
              </button>
              <button
                onClick={() => handleSaveAction('WITHHELD')}
                disabled={isSubmitting}
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  background: '#fff',
                  color: '#d97706',
                  border: '1px solid #fcd34d',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                Withheld Inspection
              </button>
              {(() => {
                const isAnyLotAccepted = effectiveLots.some(l => l.status === 'Passed' || l.status === 'ACCEPTED' || l.status === 'PASS') || activeLotOverallStatus === 'ACCEPTED';
                const isHologramRequired = isAnyLotAccepted && sealingType === 'RITES_HOLOGRAM' && hologramEntries.length === 0;
                const hasPendingLotsInMultiLot = totalLots > 1 && effectiveLots.some(l => l.status === 'Pending');
                const isSingleLotPending = totalLots === 1 && (activeLotOverallStatus === 'PENDING' || !activeLotOverallStatus);

                const isFinishDisabled = isSubmitting || !remarks || isHologramRequired || hasPendingLotsInMultiLot || isSingleLotPending;

                let finishTitle = '';
                if (isSubmitting) finishTitle = 'Submitting inspection...';
                else if (!remarks) finishTitle = 'Please enter remarks to finish inspection';
                else if (isHologramRequired) finishTitle = 'Please add hologram entries for accepted lots';
                else if (hasPendingLotsInMultiLot) finishTitle = 'Please complete all lots before finishing inspection';
                else if (isSingleLotPending) finishTitle = 'Please complete inspection tests for the lot';

                return (
                  <button
                    onClick={() => handleSaveAction('FINISH')}
                    disabled={isFinishDisabled}
                    title={finishTitle}
                    style={{
                      padding: '8px 20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      borderRadius: '8px',
                      cursor: isFinishDisabled ? 'not-allowed' : 'pointer',
                      background: '#21808d',
                      color: '#fff',
                      border: 'none',
                      opacity: isFinishDisabled ? 0.6 : 1
                    }}
                  >
                    Finish Inspection
                  </button>
                );
              })()}
            </div>
          </div>
        );
      })()}
      </div>
    );
  } catch (error) {
    console.error("CRITICAL RENDER ERROR:", error);
    return (
      <div style={{ padding: '20px', color: 'red', background: '#fee2e2', borderRadius: '12px', border: '1px solid #fca5a5', marginTop: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#991b1b' }}>Render Error in FinalInspectionDashboard</h2>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '13px', fontFamily: 'monospace', color: '#7f1d1d' }}>{error.stack || error.toString()}</pre>
      </div>
    );
  }
};

export default FinalInspectionDashboard;
