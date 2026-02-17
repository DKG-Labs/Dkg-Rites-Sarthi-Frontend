import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ProcessLineToggle from '../components/ProcessLineToggle';
import ProcessSubmoduleNav from '../components/ProcessSubmoduleNav';
import {
  getOilTankByPoLine,
  saveOilTankCounter,
  markOilTankCleaningDone
} from '../services/processMaterialService';
import {
  saveToLocalStorage,
  loadFromLocalStorage
} from '../services/processLocalStorageService';

const ProcessOilTankCounterPage = ({ call, onBack, selectedLines = [], onNavigateSubmodule, productionLines = [], allCallOptions = [], mapping = null }) => {
  const [activeLine, setActiveLine] = useState((selectedLines && selectedLines[0]) || 'Line-1');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get line index for active line
  const activeLineIndex = useMemo(() => {
    return parseInt(activeLine.replace('Line-', '')) - 1;
  }, [activeLine]);

  // Get current production line data (has icNumber, poNumber structure from dashboard)
  const currentProductionLine = useMemo(() => {
    return productionLines[activeLineIndex] || null;
  }, [activeLineIndex, productionLines]);

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

  const defaultLineState = { oilTankCounter: 45000, cleaningDone: false };
  const [perLineState, setPerLineState] = useState({});

  const current = perLineState[activeLine] || defaultLineState;

  // Track previous line for saving data before switching
  const prevLineRef = useRef(activeLine);
  const prevPoNoRef = useRef(poNo);

  // Save current data to localStorage
  const saveToLocal = useCallback(() => {
    if (!inspectionCallNo || !poNo || !perLineState[activeLine]) return;
    saveToLocalStorage('oilTank', inspectionCallNo, poNo, activeLine, perLineState[activeLine]);
  }, [inspectionCallNo, poNo, activeLine, perLineState]);

  // Load data from localStorage
  const loadFromLocal = useCallback(() => {
    if (!inspectionCallNo || !poNo) return false;
    const stored = loadFromLocalStorage('oilTank', inspectionCallNo, poNo, activeLine);
    if (stored) {
      setPerLineState(prev => ({ ...prev, [activeLine]: stored }));
      return true;
    }
    return false;
  }, [inspectionCallNo, poNo, activeLine]);

  // Save to localStorage when line changes
  useEffect(() => {
    if (prevLineRef.current !== activeLine || prevPoNoRef.current !== poNo) {
      if (prevPoNoRef.current && prevLineRef.current && perLineState[prevLineRef.current]) {
        saveToLocalStorage('oilTank', inspectionCallNo, prevPoNoRef.current, prevLineRef.current, perLineState[prevLineRef.current]);
      }
      prevLineRef.current = activeLine;
      prevPoNoRef.current = poNo;
    }
  }, [activeLine, poNo, inspectionCallNo, perLineState]);

  // Save on unmount
  useEffect(() => {
    return () => saveToLocal();
  }, [saveToLocal]);

  /**
   * Fetch oil tank counter data - first from localStorage, then backend
   */
  const fetchOilTankData = useCallback(async () => {
    if (!inspectionCallNo || !poNo) return;

    // Try localStorage first
    if (loadFromLocal()) {
      console.log('Oil tank data loaded from localStorage');
      return;
    }

    setIsLoading(true);
    try {
      const response = await getOilTankByPoLine(inspectionCallNo, poNo, activeLine);
      if (response?.responseData) {
        const data = response.responseData;
        setPerLineState(prev => ({
          ...prev,
          [activeLine]: {
            oilTankCounter: data.counterValue ?? 45000,
            cleaningDone: data.cleaningDoneInCurrentShift ?? false
          }
        }));
      }
    } catch (err) {
      console.log('Using default oil tank data:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [inspectionCallNo, poNo, activeLine, loadFromLocal]);

  useEffect(() => {
    fetchOilTankData();
  }, [fetchOilTankData]);

  const updateLine = (patch) => {
    setPerLineState(prev => ({
      ...prev,
      [activeLine]: { ...(prev[activeLine] || defaultLineState), ...patch }
    }));
  };

  const handleCleaningDone = async (checked) => {
    if (checked && window.confirm('Are you sure the oil tank cleaning is complete? This will reset the counter to 0.')) {
      try {
        await markOilTankCleaningDone(inspectionCallNo, poNo, activeLine);
        updateLine({ cleaningDone: true, oilTankCounter: 0 });
      } catch (err) {
        updateLine({ cleaningDone: true, oilTankCounter: 0 });
      }
    } else {
      updateLine({ cleaningDone: false });
    }
  };

  /**
   * Save oil tank counter data to backend
   */
  const handleSave = async () => {
    if (!inspectionCallNo || !poNo) {
      alert('Missing call or PO information');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        inspectionCallNo,
        poNo,
        lineNo: activeLine,
        counterValue: current.oilTankCounter,
        cleaningDoneInCurrentShift: current.cleaningDone,
        counterStatus: current.oilTankCounter >= 99000 ? 'LOCKED' : current.oilTankCounter >= 90000 ? 'WARNING' : 'NORMAL'
      };

      await saveOilTankCounter(payload);
      alert('Oil tank counter data saved successfully!');
      onBack();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Submodule Navigation - Above everything */}
      <ProcessSubmoduleNav
        currentSubmodule="process-oil-tank-counter"
        onNavigate={onNavigateSubmodule}
      />

      {/* Line selector bar */}
      {selectedLines.length > 0 && (
        <ProcessLineToggle selectedLines={selectedLines} activeLine={activeLine} onChange={setActiveLine} mapping={mapping} />
      )}

      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
          <div>
            <h1 className="page-title">Oil Tank Counter {poNo && <span style={{ color: '#0d9488', fontSize: 'var(--font-size-lg)' }}>- PO: {poNo}</span>}</h1>
            <p className="page-subtitle">Process Material Inspection - No. of ERC quenched since last Cleaning of Oil Tank</p>
          </div>
          <button className="btn btn-outline" onClick={onBack}>
            ← Back to Process Dashboard
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Oil Tank Counter Sub-Module</h3>
            <p className="card-subtitle">Monitor quenching count and oil tank status</p>
          </div>
          <div style={{ padding: 'var(--space-24)', background: 'var(--color-bg-2)', borderRadius: 'var(--radius-base)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>Auto-Running Counter</div>
            <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-16)', color: current.oilTankCounter >= 99000 ? 'var(--color-error)' : current.oilTankCounter >= 90000 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {current.oilTankCounter.toLocaleString()} ERCs
            </div>
            {current.oilTankCounter >= 90000 && current.oilTankCounter < 99000 && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-16)' }}>
                ⚠ ALERT: Counter reached 90,000 - Oil tank cleaning recommended soon
              </div>
            )}
            {current.oilTankCounter >= 99000 && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-16)' }}>
                🔒 LOCKED: Counter at 99,000 - Quenching entry section is DISABLED. Oil tank cleaning must be completed and counter reset to continue.
              </div>
            )}
            <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-20)', background: 'var(--color-surface)', borderRadius: 'var(--radius-base)' }}>
              <div className="checkbox-item" style={{ justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  id="cleaningDone"
                  checked={current.cleaningDone}
                  onChange={(e) => handleCleaningDone(e.target.checked)}
                  disabled={current.oilTankCounter === 0}
                />
                <label htmlFor="cleaningDone" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)' }}>Cleaning done in current shift?</label>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-12)' }}>When checked: Counter resets to 0 and starts counting from 0</p>
            </div>
          </div>
          {current.oilTankCounter >= 99000 && (
            <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-16)', background: 'rgba(var(--color-error-rgb), 0.1)', borderRadius: 'var(--radius-base)' }}>
              <h4 style={{ color: 'var(--color-error)', marginBottom: 'var(--space-12)' }}>Quenching Entry Section - LOCKED</h4>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>This section is disabled until oil tank cleaning is completed and counter is reset.</p>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-16)' }}>
            Loading oil tank data...
          </div>
        )}

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
    </div>

  );
};

export default ProcessOilTankCounterPage;

