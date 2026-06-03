import React, { useState, useEffect } from 'react';
import RawMaterialForm from './components/RawMaterialForm';
import { rawMaterialWeighmentService } from './services/rawMaterialWeighmentService';
import { mixingKneaderMillService } from './services/mixingKneaderMillService';
import { hydraulicPressService } from './services/hydraulicPressService';
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
import AttendingCallsDashboard from './components/AttendingCallsDashboard';
import InspectionInitiationPage from './pages/InspectionInitiationPage';
import PlantDeclarationDashboard from './components/PlantDeclaration/PlantDeclarationDashboard';

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
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem('railpad_ie_active_item') || 'PortalHome';
  });
  const [selectedModule, setSelectedModule] = useState(() => {
    return localStorage.getItem('railpad_ie_selected_module') || 'batch-prep';
  });
  const [activeCard, setActiveCard] = useState(() => {
    return localStorage.getItem('railpad_ie_active_card') || 'raw-material';
  });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editIndex, setEditIndex] = useState(-1);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isShiftActive, setIsShiftActive] = useState(() => {
    return localStorage.getItem('railpad_ie_shift_active') === 'true';
  });
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
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCallForInitiation, setSelectedCallForInitiation] = useState(() => {
    const saved = localStorage.getItem('railpad_ie_selected_call');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'info'
  });

  const loggedInUser = getStoredUser();

  const [currentShift, setCurrentShift] = useState(() => {
    const saved = localStorage.getItem('railpad_ie_current_shift');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    return {
      user: loggedInUser ? `Process IE - ${loggedInUser.userName}` : 'Process IE - Railpad-IE',
      shift: 'A',
      date: new Date().toLocaleDateString()
    };
  });

  const [autoOpenPlantDeclaration, setAutoOpenPlantDeclaration] = useState(false);

  // Persist shift state
  useEffect(() => {
    localStorage.setItem('railpad_ie_shift_active', isShiftActive);
    localStorage.setItem('railpad_ie_current_shift', JSON.stringify(currentShift));
  }, [isShiftActive, currentShift]);

  // Persist navigation state
  useEffect(() => {
    localStorage.setItem('railpad_ie_active_item', activeItem);
    localStorage.setItem('railpad_ie_selected_module', selectedModule);
    localStorage.setItem('railpad_ie_active_card', activeCard);
    
    if (selectedCallForInitiation) {
      localStorage.setItem('railpad_ie_selected_call', JSON.stringify(selectedCallForInitiation));
    } else {
      localStorage.removeItem('railpad_ie_selected_call');
    }
  }, [activeItem, selectedModule, activeCard, selectedCallForInitiation]);

  if (!isAuthenticated()) {
    window.location.href = '/';
    return null;
  }

  useEffect(() => {
    const fetchRawMaterialWeighments = async () => {
      if (isShiftActive && currentShift && currentShift.unit && currentShift.shift && currentShift.date) {
        setIsLoading(true);
        try {
          const data = await rawMaterialWeighmentService.getByShiftAndDate(
            currentShift.unit,
            currentShift.shift,
            currentShift.date
          );
          const mappedData = data.map(item => ({
            id: item.id,
            railPadType: item.railPadType,
            batchNo: item.batchNo,
            totalWeight: item.totalWeight,
            acceptedMaterials: item.acceptedMaterials,
            contract: item.contractSpecification,
            materials: item.materials || [],
            rubberPercentage: item.rubberPercentage,
            status: item.status,
            timestamp: item.timestamp
          }));
          setEntries(prev => ({
            ...prev,
            'raw-material': mappedData
          }));
        } catch (error) {
          console.error('Error fetching raw material weighments:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const fetchMixingRecords = async () => {
      if (isShiftActive && currentShift && currentShift.unit && currentShift.shift && currentShift.date) {
        setIsLoading(true);
        try {
          const data = await mixingKneaderMillService.getByShiftAndDate(
            currentShift.unit,
            currentShift.shift,
            currentShift.date
          );
          const mappedData = data.map(item => ({
            id: item.id,
            railPadType: item.railPadType,
            batchNo: item.batchNo,
            mixingTime: item.mixingTime,
            mixingTemp: item.mixingTemp,
            waterCirculation: item.waterCirculation,
            dustCollector: item.dustCollector,
            status: item.status,
            timestamp: item.timestamp
          }));
          setEntries(prev => ({
            ...prev,
            'mixing': mappedData
          }));
        } catch (error) {
          console.error('Error fetching mixing records:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const fetchHydraulicPressRecords = async () => {
      if (isShiftActive && currentShift && currentShift.unit && currentShift.shift && currentShift.date) {
        setIsLoading(true);
        try {
          const data = await hydraulicPressService.getByShiftAndDate(
            currentShift.unit,
            currentShift.shift,
            currentShift.date
          );
          const mappedData = data.map(item => ({
            id: item.id,
            railPadType: item.railPadType,
            batchNo: item.batchNo,
            timeOfCheck: item.timeOfCheck,
            curingTime: item.curingTime,
            curingTemp: item.curingTemp,
            curingPressure: item.curingPressure,
            status: item.status,
            timestamp: item.timestamp
          }));
          setEntries(prev => ({
            ...prev,
            'hydraulic-press': mappedData
          }));
        } catch (error) {
          console.error('Error fetching hydraulic press records:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (activeCard === 'raw-material') {
      fetchRawMaterialWeighments();
    } else if (activeCard === 'mixing') {
      fetchMixingRecords();
    } else if (activeCard === 'hydraulic-press') {
      fetchHydraulicPressRecords();
    }
  }, [isShiftActive, currentShift, activeCard]);

  const handleAddEntry = async (newData) => {
    const currentActiveCard = activeCard;
    if (currentActiveCard === 'raw-material') {
      try {
        const payload = {
          plantId: currentShift.unit,
          vendorCode: currentShift.company,
          shift: currentShift.shift,
          castingDate: currentShift.date,
          railPadType: newData.railPadType,
          batchNo: String(newData.batchNo),
          totalWeight: parseFloat(newData.totalWeight),
          acceptedMaterials: newData.acceptedMaterials,
          contractSpecification: newData.contract,
          rubberPercentage: parseFloat(newData.rubberPercentage),
          status: newData.status,
          timestamp: newData.timestamp,
          materials: newData.materials.map(m => ({
            name: m.name,
            weight: parseFloat(m.weight)
          }))
        };

        if (editIndex > -1) {
          const entryId = entries['raw-material'][editIndex].id;
          const updated = await rawMaterialWeighmentService.update(entryId, payload);
          const newEntries = [...entries['raw-material']];
          newEntries[editIndex] = {
            id: updated.id,
            railPadType: updated.railPadType,
            batchNo: updated.batchNo,
            totalWeight: updated.totalWeight,
            acceptedMaterials: updated.acceptedMaterials,
            contract: updated.contractSpecification,
            materials: updated.materials || [],
            rubberPercentage: updated.rubberPercentage,
            status: updated.status,
            timestamp: updated.timestamp
          };
          setEntries(prev => ({ ...prev, 'raw-material': newEntries }));
        } else {
          const created = await rawMaterialWeighmentService.create(payload);
          const mappedCreated = {
            id: created.id,
            railPadType: created.railPadType,
            batchNo: created.batchNo,
            totalWeight: created.totalWeight,
            acceptedMaterials: created.acceptedMaterials,
            contract: created.contractSpecification,
            materials: created.materials || [],
            rubberPercentage: created.rubberPercentage,
            status: created.status,
            timestamp: created.timestamp
          };
          setEntries(prev => ({
            ...prev,
            'raw-material': [mappedCreated, ...prev['raw-material']]
          }));
        }
        closeForm();
      } catch (error) {
        console.error('Error saving raw material weighment:', error);
        alert('Error saving raw material weighment: ' + error.message);
      }
    } else if (currentActiveCard === 'mixing') {
      try {
        const payload = {
          plantId: currentShift.unit,
          vendorCode: currentShift.company,
          shift: currentShift.shift,
          castingDate: currentShift.date,
          railPadType: newData.railPadType,
          batchNo: String(newData.batchNo),
          mixingTime: parseFloat(newData.mixingTime),
          mixingTemp: parseFloat(newData.mixingTemp),
          waterCirculation: newData.waterCirculation,
          dustCollector: newData.dustCollector,
          status: newData.status,
          timestamp: newData.timestamp
        };

        if (editIndex > -1) {
          const entryId = entries['mixing'][editIndex].id;
          const updated = await mixingKneaderMillService.update(entryId, payload);
          const newEntries = [...entries['mixing']];
          newEntries[editIndex] = {
            id: updated.id,
            railPadType: updated.railPadType,
            batchNo: updated.batchNo,
            mixingTime: updated.mixingTime,
            mixingTemp: updated.mixingTemp,
            waterCirculation: updated.waterCirculation,
            dustCollector: updated.dustCollector,
            status: updated.status,
            timestamp: updated.timestamp
          };
          setEntries(prev => ({ ...prev, 'mixing': newEntries }));
        } else {
          const created = await mixingKneaderMillService.create(payload);
          const mappedCreated = {
            id: created.id,
            railPadType: created.railPadType,
            batchNo: created.batchNo,
            mixingTime: created.mixingTime,
            mixingTemp: created.mixingTemp,
            waterCirculation: created.waterCirculation,
            dustCollector: created.dustCollector,
            status: created.status,
            timestamp: created.timestamp
          };
          setEntries(prev => ({
            ...prev,
            'mixing': [mappedCreated, ...prev['mixing']]
          }));
        }
        closeForm();
      } catch (error) {
        console.error('Error saving mixing record:', error);
        alert('Error saving mixing record: ' + error.message);
      }
    } else if (currentActiveCard === 'hydraulic-press') {
      try {
        const payload = {
          plantId: currentShift.unit,
          vendorCode: currentShift.company,
          shift: currentShift.shift,
          castingDate: currentShift.date,
          railPadType: newData.railPadType,
          batchNo: String(newData.batchNo),
          timeOfCheck: newData.timeOfCheck,
          curingTime: parseFloat(newData.curingTime),
          curingTemp: parseFloat(newData.curingTemp),
          curingPressure: parseFloat(newData.curingPressure),
          status: newData.status,
          timestamp: newData.timestamp
        };

        if (editIndex > -1) {
          const entryId = entries['hydraulic-press'][editIndex].id;
          const updated = await hydraulicPressService.update(entryId, payload);
          const newEntries = [...entries['hydraulic-press']];
          newEntries[editIndex] = {
            id: updated.id,
            railPadType: updated.railPadType,
            batchNo: updated.batchNo,
            timeOfCheck: updated.timeOfCheck,
            curingTime: updated.curingTime,
            curingTemp: updated.curingTemp,
            curingPressure: updated.curingPressure,
            status: updated.status,
            timestamp: updated.timestamp
          };
          setEntries(prev => ({ ...prev, 'hydraulic-press': newEntries }));
        } else {
          const created = await hydraulicPressService.create(payload);
          const mappedCreated = {
            id: created.id,
            railPadType: created.railPadType,
            batchNo: created.batchNo,
            timeOfCheck: created.timeOfCheck,
            curingTime: created.curingTime,
            curingTemp: created.curingTemp,
            curingPressure: created.curingPressure,
            status: created.status,
            timestamp: created.timestamp
          };
          setEntries(prev => ({
            ...prev,
            'hydraulic-press': [mappedCreated, ...prev['hydraulic-press']]
          }));
        }
        closeForm();
      } catch (error) {
        console.error('Error saving hydraulic press record:', error);
        alert('Error saving hydraulic press record: ' + error.message);
      }
    } else {
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
    }
  };

  const handleEdit = (item, index) => {
    if (!isShiftActive) return;
    setEditItem(item);
    setEditIndex(index);
    setIsViewOnly(false);
    setShowForm(true);
  };

  const handleView = (item, index) => {
    setEditItem(item);
    setEditIndex(index);
    setIsViewOnly(true);
    setShowForm(true);
  };

  const handleDelete = (item, index) => {
    if (!isShiftActive) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Entry',
      message: 'Are you sure you want to delete this entry? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        const currentActiveCard = activeCard;
        if (currentActiveCard === 'raw-material') {
          try {
            await rawMaterialWeighmentService.delete(item.id);
            const newEntries = entries['raw-material'].filter((_, idx) => idx !== index);
            setEntries(prev => ({ ...prev, 'raw-material': newEntries }));
          } catch (error) {
            console.error('Error deleting raw material weighment:', error);
            alert('Error deleting record: ' + error.message);
          }
        } else if (currentActiveCard === 'mixing') {
          try {
            if (item.id) {
              await mixingKneaderMillService.delete(item.id);
            }
            const newEntries = entries['mixing'].filter((_, idx) => idx !== index);
            setEntries(prev => ({ ...prev, 'mixing': newEntries }));
          } catch (error) {
            console.error('Error deleting mixing record:', error);
            alert('Error deleting record: ' + error.message);
          }
        } else if (currentActiveCard === 'hydraulic-press') {
          try {
            if (item.id) {
              await hydraulicPressService.delete(item.id);
            }
            const newEntries = entries['hydraulic-press'].filter((_, idx) => idx !== index);
            setEntries(prev => ({ ...prev, 'hydraulic-press': newEntries }));
          } catch (error) {
            console.error('Error deleting hydraulic press record:', error);
            alert('Error deleting record: ' + error.message);
          }
        } else {
          const newEntries = entries[currentActiveCard].filter((_, idx) => idx !== index);
          setEntries(prev => ({ ...prev, [currentActiveCard]: newEntries }));
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    setEditIndex(-1);
    setIsViewOnly(false);
  };

  const handleCompleteShift = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Complete Shift',
      message: 'Are you sure you want to complete your shift duty? This will lock all entries for this shift permanently.',
      type: 'warning',
      onConfirm: () => {
        setIsShiftActive(false);
        localStorage.removeItem('railpad_ie_shift_active');
        localStorage.removeItem('railpad_ie_current_shift');
        localStorage.removeItem('railpad_ie_active_item');
        localStorage.removeItem('railpad_ie_selected_module');
        localStorage.removeItem('railpad_ie_active_card');
        localStorage.removeItem('railpad_ie_selected_call');
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
        localStorage.removeItem('railpad_ie_shift_active');
        localStorage.removeItem('railpad_ie_current_shift');
        localStorage.removeItem('railpad_ie_active_item');
        localStorage.removeItem('railpad_ie_selected_module');
        localStorage.removeItem('railpad_ie_active_card');
        window.location.href = '/';
      }
    });
  };

  const activeDoc = [...SUB_CARDS, ...PRE_SHIFT_SUB_CARDS, ...MOULDING_INSPECTION_SUB_CARDS, ...VERIFICATION_SUB_CARDS].find(c => c.id === activeCard);

  return (
    <MainLayout
      activeItem={activeItem}
      onItemClick={(item) => {
        if (item === 'PLANT_DECLARATION') {
          setActiveItem('PortalHome');
          setAutoOpenPlantDeclaration(true);
        } else {
          setActiveItem(item);
          setAutoOpenPlantDeclaration(false);
        }
      }}
      onLogout={handleLogout}
      user={loggedInUser}
      isShiftActive={isShiftActive}
    >
      {activeItem === 'PortalHome' ? (
        <PortalHome
          user={loggedInUser}
          isShiftActive={isShiftActive}
          defaultShowPlantDeclaration={autoOpenPlantDeclaration}
          onClosePlantDeclaration={() => setAutoOpenPlantDeclaration(false)}
          onModuleSelect={(moduleId, shiftData) => {
            if (moduleId === 'IE') {
              setIsShiftActive(true);
              if (shiftData) {
                setCurrentShift({
                  ...shiftData,
                  user: loggedInUser ? `${loggedInUser.userName}` : 'Railpad-IE'
                });
              }
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
        <div className="dashboard-container" style={{ 
          padding: '40px', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          minHeight: '100vh', 
          width: '100%',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}>
          {/* Main Header Section */}
          <header style={{ 
            marginBottom: '40px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
                  animation: 'pulse 2s infinite'
                }} />
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  Final Inspection
                  {selectedCallForInitiation?.requestId && (
                    <span style={{ 
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#3b82f6',
                      background: '#eff6ff',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid #dbeafe',
                      letterSpacing: '0.05em',
                      boxShadow: '0 1px 2px rgba(59, 130, 246, 0.05)'
                    }}>
                      {selectedCallForInitiation.requestId}
                    </span>
                  )}
                </h1>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '24px',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', filter: 'grayscale(0.5)' }}>📋</span>
                  <span>Verification Mode</span>
                </div>
                
                <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', fontWeight: '800', letterSpacing: '0.1em' }}>Shift</span>
                  <span style={{ 
                    padding: '2px 10px', 
                    background: '#f1f5f9', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    fontWeight: '800', 
                    color: '#334155',
                    border: '1px solid #e2e8f0'
                  }}>
                    {currentShift?.shift || 'N/A'}
                  </span>
                </div>

                <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', fontWeight: '800', letterSpacing: '0.1em' }}>Location</span>
                  <span style={{ 
                    color: '#1e293b',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}>
                    {currentShift?.unit || selectedCallForInitiation?.plantId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveItem('ATTENDING_CALLS')}
              style={{
                padding: '12px 24px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.background = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              <span style={{ fontSize: '16px' }}>←</span>
              BACK TO DASHBOARD
            </button>
          </header>

          {/* Enriched Data Floating Card */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '28px 32px',
            marginBottom: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle background decoration */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              bottom: 0, 
              width: '4px', 
              background: 'linear-gradient(to bottom, #3b82f6, #6366f1)' 
            }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RLY PO SR NO</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                {selectedCallForInitiation?.rlyPoSrNo || 'N/A'}
              </span>
            </div>
            
            <div style={{ width: '1px', height: '40px', background: '#f1f5f9', margin: '0 32px' }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VENDOR NAME</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                {selectedCallForInitiation?.vendorName || 'N/A'}
              </span>
            </div>

            <div style={{ width: '1px', height: '40px', background: '#f1f5f9', margin: '0 32px' }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RAILPADTYPE</span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#3b82f6',
                background: '#eff6ff',
                padding: '4px 12px',
                borderRadius: '8px',
                width: 'fit-content'
              }}>
                {selectedCallForInitiation?.railPadType || 'N/A'}
              </span>
            </div>

            <div style={{ width: '1px', height: '40px', background: '#f1f5f9', margin: '0 32px' }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PLANT ID</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                {selectedCallForInitiation?.plantId || 'N/A'}
              </span>
            </div>
          </div>

          {/* Main Work Area Container */}
          <div style={{
            marginTop: '16px',
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <FinalInspectionDashboard 
              user={loggedInUser} 
              isShiftActive={isShiftActive} 
              call={selectedCallForInitiation} 
              onUpdateCall={(updatedData) => {
                setSelectedCallForInitiation(prev => ({
                  ...prev,
                  ...updatedData
                }));
              }}
            />
          </div>
        </div>
      ) : activeItem === 'ATTENDING_CALLS' ? (
        <AttendingCallsDashboard 
          onStart={(call) => {
            setSelectedCallForInitiation(call);
            setActiveItem('INSPECTION_INITIATION');
          }} 
          onResume={(call, shiftData) => {
            setSelectedCallForInitiation(call);
            setIsShiftActive(true);
            if (shiftData) {
              setCurrentShift({
                ...shiftData,
                user: loggedInUser ? `${loggedInUser.userName}` : 'Railpad-IE'
              });
            }
            setActiveItem('FINAL_INSPECTION');
          }}
        />
      ) : activeItem === 'INSPECTION_INITIATION' ? (
        <InspectionInitiationPage 
          call={selectedCallForInitiation}
          onUpdateCall={(updatedData) => {
            setSelectedCallForInitiation(prev => ({
              ...prev,
              ...updatedData
            }));
          }}
          onProceed={(shiftData) => {
            setIsShiftActive(true);
            if (shiftData) {
              setCurrentShift({
                ...shiftData,
                user: loggedInUser ? `${loggedInUser.userName}` : 'Railpad-IE'
              });
            }
            setActiveItem('FINAL_INSPECTION');
          }}
          onBack={() => setActiveItem('ATTENDING_CALLS')}
        />
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

          {/* Shift Details Bar */}
          {isShiftActive && currentShift && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '32px',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#f0f9ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Shift</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Shift {currentShift.shift}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{currentShift.company}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#fff7ed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Casting Date</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{currentShift.date}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#f0fdf4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}>
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Production Unit</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{currentShift.unit}</div>
                </div>
              </div>
            </div>
          )}

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
                      style={{ maxWidth: '350px' }}
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
                      onView={handleView}
                      onDelete={handleDelete}
                      isLoading={isLoading}
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
                      style={{ maxWidth: '350px' }}
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
                      onView={handleView}
                      onDelete={handleDelete}
                      isLoading={isLoading}
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
                      style={{ maxWidth: '350px' }}
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
                      onView={handleView}
                      onDelete={handleDelete}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </>
            ) : selectedModule === 'raw-material-verification' ? (
              <div className="fade-in">
                <div className="verification-module-header" style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                    Incoming Raw Material Verification
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '15px' }}>
                    Select a material to review and verify vendor inventory submissions
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  gap: '12px',
                  padding: '6px 4px 16px 4px',
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: '32px'
                }}>
                  {VERIFICATION_SUB_CARDS.map(card => {
                    const isSelected = activeCard === card.id;
                    return (
                      <div
                        key={card.id}
                        className="verification-card"
                        onClick={() => setActiveCard(isSelected ? 'verification-dashboard' : card.id)}
                        style={{
                          background: isSelected ? '#eff6ff' : 'white',
                          borderRadius: '12px',
                          padding: isSelected ? '11px 13px' : '12px 14px',
                          border: isSelected ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                          position: 'relative',
                          overflow: 'hidden',
                          flex: '1 0 150px',
                          minWidth: '150px',
                          maxWidth: '185px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '82px',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = isSelected ? '0 6px 12px -1px rgba(59, 130, 246, 0.25)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)';
                          e.currentTarget.style.borderColor = isSelected ? '#3b82f6' : '#e2e8f0';
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          background: card.pending > 0 ? '#ef4444' : '#10b981'
                        }} />

                        <div style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          paddingLeft: '4px'
                        }}>
                          {card.title}
                        </div>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          paddingLeft: '4px',
                          marginTop: '6px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.02em' }}>Balance</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>{card.balance}</span>
                          </div>

                          <div style={{
                            background: card.pending > 0 ? '#fef2f2' : '#f0fdf4',
                            color: card.pending > 0 ? '#dc2626' : '#15803d',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: '9px',
                            fontWeight: '800',
                            border: `1px solid ${card.pending > 0 ? '#fecaca' : '#bbf7d0'}`,
                            lineHeight: '1',
                            textAlign: 'center'
                          }}>
                            {card.pending > 0 ? `${card.pending} Pnd` : 'OK'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeCard !== 'verification-dashboard' && VERIFICATION_SUB_CARDS.some(c => c.id === activeCard) ? (
                  <div className="fade-in" style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    overflow: 'hidden'
                  }}>
                    {/* Section Header */}
                    <div style={{
                      padding: '20px 24px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                        </div>
                        <div>
                          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                            {VERIFICATION_SUB_CARDS.find(c => c.id === activeCard)?.title}
                          </h3>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '500' }}>
                            Review vendor submissions and verify incoming material
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveCard('verification-dashboard')}
                        style={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#64748b',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#94a3b8';
                          e.currentTarget.style.color = '#334155';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#64748b';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Reset
                      </button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px 24px' }}>
                      <RawMaterialVerificationList
                        key={activeCard}
                        materialId={activeCard}
                        loggedInUser={loggedInUser}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    color: '#64748b',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1',
                    marginTop: '8px'
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '12px' }}>👆</div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>No Material Selected</h3>
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>Please select one of the material cards above to view and verify its pending entries.</p>
                  </div>
                )}
              </div>
            ) : selectedModule === 'production-verification' ? (
              <div className="fade-in">
                <ProductionVerificationDashboard
                  activeCard={activeCard}
                  setActiveCard={setActiveCard}
                  currentShift={currentShift}
                  user={loggedInUser}
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
              isViewOnly={isViewOnly}
            />
          )}
          {activeCard === 'mixing' && (
            <MixingForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              plantId={currentShift?.unit || selectedCallForInitiation?.plantId || "1"}
              isViewOnly={isViewOnly}
            />
          )}
          {activeCard === 'sheeting' && (
            <SheetingForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              isViewOnly={isViewOnly}
            />
          )}
          {activeCard === 'rheometer' && (
            <RheometerForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              isViewOnly={isViewOnly}
            />
          )}
          {activeCard === 'mould-verification' && (
            <PreShiftVerificationForm
              type={activeCard}
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              currentShift={currentShift}
              isViewOnly={isViewOnly}
            />
          )}
          {activeCard === 'hydraulic-press' && (
            <HydraulicPressForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              currentShift={currentShift}
              isViewOnly={isViewOnly}
            />
          )}
          {activeCard === 'visual-inspection' && (
            <VisualInspectionForm
              onSubmit={handleAddEntry}
              onCancel={closeForm}
              editData={editItem}
              currentShift={currentShift}
              isViewOnly={isViewOnly}
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
