import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import CalibrationModule from '../components/CalibrationModule';
import ProcessLineToggle from '../components/ProcessLineToggle';
import ProcessSubmoduleNav from '../components/ProcessSubmoduleNav';
// API calls disabled for mock mode - Process Material uses localStorage only
// import {
//   getCalibrationByPoLine,
//   saveCalibrationDocumentsBatch
// } from '../services/processMaterialService';
import {
  saveToLocalStorage,
  loadFromLocalStorage
} from '../services/processLocalStorageService';

const ProcessCalibrationDocumentsPage = ({ call, onBack, selectedLines = [], onNavigateSubmodule, lineData, productionLines: propProductionLines = [], allCallOptions = [], mapping = null }) => {
  // Get available lines from props or lineData (stabilized)
  const stableProductionLines = useMemo(() => {
    return (propProductionLines && propProductionLines.length > 0) ? propProductionLines : (lineData?.productionLines || []);
  }, [propProductionLines, lineData]);

  const availableLines = stableProductionLines.length > 0
    ? stableProductionLines.map((_, idx) => `Line-${idx + 1}`)
    : (selectedLines.length > 0 ? selectedLines : ['Line-1']);

  // State for active line (switchable)
  const [activeLine, setActiveLine] = useState(lineData?.selectedLine || availableLines[0] || 'Line-1');
  const [calibrationData, setCalibrationData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Get line index for active line
  const activeLineIndex = useMemo(() => {
    return parseInt(activeLine.replace('Line-', '')) - 1;
  }, [activeLine]);

  // Get current production line data (has icNumber, poNumber structure from dashboard)
  const currentProductionLine = useMemo(() => {
    return stableProductionLines[activeLineIndex] || null;
  }, [activeLineIndex, stableProductionLines]);

  // Get the call data from allCallOptions based on the icNumber selected in production line
  const currentCallData = useMemo(() => {
    if (currentProductionLine?.icNumber) {
      return allCallOptions.find(c => c.call_no === currentProductionLine.icNumber) || null;
    }
    return null;
  }, [currentProductionLine, allCallOptions]);

  // Get PO number for active line
  const activeLinePoNo = useMemo(() => {
    if (currentProductionLine?.poNumber) {
      return currentProductionLine.poNumber;
    }
    if (currentCallData?.po_no) {
      return currentCallData.po_no;
    }
    return call?.po_no || '';
  }, [currentProductionLine, currentCallData, call]);

  const inspectionCallNo = currentCallData?.call_no || call?.call_no || '';
  const poNo = activeLinePoNo;

  // Track previous line for saving data before switching
  const prevLineRef = useRef(activeLine);
  const prevPoNoRef = useRef(poNo);

  // Flags to prevent saving during initial load
  const isInitialLoadComplete = useRef(false);
  const hasDataBeenModified = useRef(false);

  // Save current data to localStorage (only if modified)
  const saveToLocal = useCallback(() => {
    if (!inspectionCallNo || !poNo || calibrationData.length === 0) return;
    if (!isInitialLoadComplete.current || !hasDataBeenModified.current) return;
    saveToLocalStorage('calibration', inspectionCallNo, poNo, activeLine, calibrationData);
  }, [inspectionCallNo, poNo, activeLine, calibrationData]);

  // Load data from localStorage
  const loadFromLocal = useCallback(() => {
    if (!inspectionCallNo || !poNo) return false;
    const stored = loadFromLocalStorage('calibration', inspectionCallNo, poNo, activeLine);
    if (stored && stored.length > 0) {
      setCalibrationData(stored);
      return true;
    }
    return false;
  }, [inspectionCallNo, poNo, activeLine]);

  // Save to localStorage when line changes
  useEffect(() => {
    if (prevLineRef.current !== activeLine || prevPoNoRef.current !== poNo) {
      // Save previous line's data if modified
      if (prevPoNoRef.current && prevLineRef.current && calibrationData.length > 0 && hasDataBeenModified.current) {
        saveToLocalStorage('calibration', inspectionCallNo, prevPoNoRef.current, prevLineRef.current, calibrationData);
      }
      prevLineRef.current = activeLine;
      prevPoNoRef.current = poNo;
      // Reset flags for new line
      isInitialLoadComplete.current = false;
      hasDataBeenModified.current = false;
    }
  }, [activeLine, poNo, inspectionCallNo, calibrationData]);

  // Listen for global saveDraft event (triggered by Finish Inspection)
  useEffect(() => {
    const handler = () => {
      // Force save current data to localStorage (bypass modified flag)
      if (!inspectionCallNo || !poNo || calibrationData.length === 0) return;
      saveToLocalStorage('calibration', inspectionCallNo, poNo, activeLine, calibrationData);
    };
    window.addEventListener('process:saveDraft', handler);
    return () => window.removeEventListener('process:saveDraft', handler);
  }, [inspectionCallNo, poNo, activeLine, calibrationData]);

  // Save on unmount
  useEffect(() => {
    return () => saveToLocal();
  }, [saveToLocal]);

  /**
   * Fetch calibration data - first from localStorage, then backend
   */
  const fetchCalibrationData = useCallback(async () => {
    if (!inspectionCallNo || !poNo) return;

    // Try localStorage first
    if (loadFromLocal()) {
      console.log('Calibration data loaded from localStorage');
      // Mark initial load complete after a short delay
      setTimeout(() => { isInitialLoadComplete.current = true; }, 100);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('🏭 Process Calibration: Using localStorage only (no API call)');
      // API call disabled for mock mode - data loaded from localStorage only
      // const response = await getCalibrationByPoLine(inspectionCallNo, poNo, activeLine);
      // if (response?.responseData) {
      //   setCalibrationData(response.responseData);
      // }

      // Use empty calibration data - will be populated by user
      setCalibrationData([]);
    } catch (err) {
      console.log('Using default calibration data:', err.message);
      setCalibrationData([]);
    } finally {
      setIsLoading(false);
      // Mark initial load complete after a short delay
      setTimeout(() => { isInitialLoadComplete.current = true; }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionCallNo, poNo, loadFromLocal]);

  useEffect(() => {
    fetchCalibrationData();
  }, [fetchCalibrationData]);

  /**
   * Save calibration data to backend
   */
  const handleSave = async () => {
    if (!inspectionCallNo || !poNo) {
      alert('Missing call or PO information');
      return;
    }

    setIsSaving(true);
    try {
      // API call disabled for mock mode - data saved to localStorage only
      console.log('🏭 Process Calibration: Data saved to localStorage (no API call)');

      // const payload = calibrationData.map(item => ({
      //   ...item,
      //   inspectionCallNo,
      //   poNo,
      //   lineNo: activeLine
      // }));
      // await saveCalibrationDocumentsBatch(payload);

      alert('✅ Calibration data saved to localStorage (Mock Mode)');
      onBack();
    } catch (err) {
      setError(err.message);
      alert('Failed to save calibration data: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
        <p>Loading calibration data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Submodule Navigation - Above everything */}
      <ProcessSubmoduleNav
        currentSubmodule="process-calibration-documents"
        onNavigate={onNavigateSubmodule}
      />

      {/* 2. Line Toggle */}
      {availableLines.length > 0 && (
        <ProcessLineToggle
          selectedLines={availableLines}
          activeLine={activeLine}
          onChange={setActiveLine}
          mapping={mapping}
        />
      )}

      {/* 3. Heading with PO */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
        <div>
          <h1 className="page-title">Calibration & Documents {poNo && <span style={{ color: '#0d9488', fontSize: 'var(--font-size-lg)' }}>- PO: {poNo}</span>}</h1>
          <p className="page-subtitle">Process Material Inspection - Verify instrument calibration</p>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          ← Back to Process Dashboard
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-16)' }}>
          {error}
        </div>
      )}

      <CalibrationModule instruments={calibrationData.length > 0 ? calibrationData : undefined} />

      <div style={{ marginTop: 'var(--space-24)', display: 'flex', gap: 'var(--space-16)', justifyContent: 'flex-end' }}>
        <button className="btn btn-outline" onClick={onBack}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
};

export default ProcessCalibrationDocumentsPage;

