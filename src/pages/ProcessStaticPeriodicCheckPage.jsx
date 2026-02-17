import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ProcessLineToggle from '../components/ProcessLineToggle';
import ProcessSubmoduleNav from '../components/ProcessSubmoduleNav';
import {
  getStaticCheckByPoLine,
  saveStaticPeriodicCheck
} from '../services/processMaterialService';
import {
  saveToLocalStorage,
  loadFromLocalStorage
} from '../services/processLocalStorageService';

const ProcessStaticPeriodicCheckPage = ({ call, onBack, selectedLines = [], onNavigateSubmodule, productionLines = [], allCallOptions = [], mapping = null }) => {
  const [activeLine, setActiveLine] = useState((selectedLines && selectedLines[0]) || 'Line-1');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

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

  const defaultLineState = {
    shearingPress: true,
    forgingPress: true,
    reheatingFurnace: true,
    quenchingTime: true,
    forgingDie: true,
    oilTankCounter: 45000,
    cleaningDone: false,
  };
  const [perLineState, setPerLineState] = useState({});

  const current = perLineState[activeLine] || defaultLineState;

  // Track previous line for saving data before switching
  const prevLineRef = useRef(activeLine);
  const prevPoNoRef = useRef(poNo);

  // Flags to prevent saving during initial load
  const isInitialLoadComplete = useRef(false);
  const hasDataBeenModified = useRef(false);

  // Save current data to localStorage (only if modified)
  const saveToLocal = useCallback(() => {
    if (!inspectionCallNo || !poNo || !perLineState[activeLine]) return;
    if (!isInitialLoadComplete.current || !hasDataBeenModified.current) return;
    saveToLocalStorage('staticCheck', inspectionCallNo, poNo, activeLine, perLineState[activeLine]);
  }, [inspectionCallNo, poNo, activeLine, perLineState]);

  // Load data from localStorage
  const loadFromLocal = useCallback(() => {
    if (!inspectionCallNo || !poNo) return false;
    const stored = loadFromLocalStorage('staticCheck', inspectionCallNo, poNo, activeLine);
    if (stored) {
      setPerLineState(prev => ({ ...prev, [activeLine]: stored }));
      return true;
    }
    return false;
  }, [inspectionCallNo, poNo, activeLine]);

  // Save to localStorage when line changes
  useEffect(() => {
    if (prevLineRef.current !== activeLine || prevPoNoRef.current !== poNo) {
      // Save previous line's data if modified
      if (prevPoNoRef.current && prevLineRef.current && perLineState[prevLineRef.current] && hasDataBeenModified.current) {
        saveToLocalStorage('staticCheck', inspectionCallNo, prevPoNoRef.current, prevLineRef.current, perLineState[prevLineRef.current]);
      }
      prevLineRef.current = activeLine;
      prevPoNoRef.current = poNo;
      // Reset flags for new line
      isInitialLoadComplete.current = false;
      hasDataBeenModified.current = false;
    }
  }, [activeLine, poNo, inspectionCallNo, perLineState]);

  // Save on unmount
  useEffect(() => {
    return () => saveToLocal();
  }, [saveToLocal]);

  // Listen for global saveDraft event (triggered by Finish Inspection)
  useEffect(() => {
    const handler = () => {
      // Force save current per-line state to localStorage (bypass modified flag)
      const data = perLineState[activeLine];
      if (!inspectionCallNo || !poNo || !data) return;
      saveToLocalStorage('staticCheck', inspectionCallNo, poNo, activeLine, data);
    };
    window.addEventListener('process:saveDraft', handler);
    return () => window.removeEventListener('process:saveDraft', handler);
  }, [inspectionCallNo, poNo, activeLine, perLineState]);

  /**
   * Fetch static periodic check data - first from localStorage, then backend
   */
  const fetchStaticCheckData = useCallback(async () => {
    if (!inspectionCallNo || !poNo) return;

    // Try localStorage first
    if (loadFromLocal()) {
      console.log('Static check data loaded from localStorage');
      // Mark initial load complete after a short delay
      setTimeout(() => { isInitialLoadComplete.current = true; }, 100);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getStaticCheckByPoLine(inspectionCallNo, poNo, activeLine);
      if (response?.responseData) {
        const data = response.responseData;
        setPerLineState(prev => ({
          ...prev,
          [activeLine]: {
            shearingPress: data.shearingPressCapacityOk ?? true,
            forgingPress: data.forgingPressCapacityOk ?? true,
            reheatingFurnace: data.reheatingFurnaceInductionType ?? true,
            quenchingTime: data.quenchingWithin20Seconds ?? true,
            forgingDie: data.forgingDieCheck ?? true,
            oilTankCounter: data.oilTankCounterValue ?? 45000,
            cleaningDone: false
          }
        }));
      }
    } catch (err) {
      console.log('Using default static check data:', err.message);
    } finally {
      setIsLoading(false);
      // Mark initial load complete after a short delay
      setTimeout(() => { isInitialLoadComplete.current = true; }, 100);
    }
  }, [inspectionCallNo, poNo, activeLine, loadFromLocal]);

  useEffect(() => {
    fetchStaticCheckData();
  }, [fetchStaticCheckData]);

  // Wrapper to mark data as modified when user changes data
  const updateLine = (patch) => {
    hasDataBeenModified.current = true;
    setPerLineState((prev) => ({
      ...prev,
      [activeLine]: { ...(prev[activeLine] || defaultLineState), ...patch },
    }));
  };

  const allChecksPassed =
    current.shearingPress && current.forgingPress && current.reheatingFurnace && current.quenchingTime && current.forgingDie;
  const isCounterLocked = current.oilTankCounter >= 90000;
  const isQuenchingLocked = current.oilTankCounter >= 90000;

  const handleCleaningDone = (checked) => {
    if (checked && window.confirm('Are you sure the oil tank cleaning is complete? This will reset the counter to 0.')) {
      updateLine({ cleaningDone: true, oilTankCounter: 0 });
    } else {
      updateLine({ cleaningDone: false });
    }
  };

  /**
   * Save static periodic check data to backend
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
        shearingPressCapacityOk: current.shearingPress,
        forgingPressCapacityOk: current.forgingPress,
        reheatingFurnaceInductionType: current.reheatingFurnace,
        quenchingWithin20Seconds: current.quenchingTime,
        forgingDieCheck: current.forgingDie,
        oilTankCounterValue: current.oilTankCounter,
        allChecksPassed
      };

      await saveStaticPeriodicCheck(payload);
      alert('Static periodic check saved successfully!');
      onBack();
    } catch (err) {
      setError(err.message);
      alert('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Submodule Navigation - Above everything */}
      <ProcessSubmoduleNav
        currentSubmodule="process-static-periodic-check"
        onNavigate={onNavigateSubmodule}
      />

      {/* Line selector bar */}
      {selectedLines.length > 0 && (
        <ProcessLineToggle
          selectedLines={selectedLines}
          activeLine={activeLine}
          onChange={setActiveLine}
          mapping={mapping}
        />
      )}

      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
          <div>
            <h1 className="page-title">Static Periodic Check {poNo && <span style={{ color: '#0d9488', fontSize: 'var(--font-size-lg)' }}>- PO: {poNo}</span>}</h1>
            <p className="page-subtitle">Process Material Inspection - Required field - All checks must be completed</p>
          </div>
          <button className="btn btn-outline" onClick={onBack}>
            ← Back to Process Dashboard
          </button>
        </div>

        {isLoading && (
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-16)' }}>
            Loading static check data...
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-16)' }}>
            {error}
          </div>
        )}

        {/* Equipment Verification Checks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Periodic Equipment Checks</h3>
            <p className="card-subtitle">Manual Check box Verification - To be done for each line</p>
          </div>
          <div className="checkbox-group" style={{ gridTemplateColumns: '1fr' }}>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="shearingPress"
                checked={current.shearingPress}
                onChange={(e) => updateLine({ shearingPress: e.target.checked })}
              />
              <label htmlFor="shearingPress" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is Shearing Press Capacity &gt;= 100MT? (Yes/No)</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="forgingPress"
                checked={current.forgingPress}
                onChange={(e) => updateLine({ forgingPress: e.target.checked })}
              />
              <label htmlFor="forgingPress" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is Forging Press Capacity &gt;= 150MT? (Yes/No)</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="reheatingFurnace"
                checked={current.reheatingFurnace}
                onChange={(e) => updateLine({ reheatingFurnace: e.target.checked })}
              />
              <label htmlFor="reheatingFurnace" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is type of Reheating Furnace Induction Type? (Yes/No)</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="quenchingTime"
                checked={current.quenchingTime}
                onChange={(e) => updateLine({ quenchingTime: e.target.checked })}
              />
              <label htmlFor="quenchingTime" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is Quenching Done within 20 seconds after completion of Forging? (Yes/No)</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="forgingDie"
                checked={current.forgingDie}
                onChange={(e) => updateLine({ forgingDie: e.target.checked })}
              />
              <label htmlFor="forgingDie" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is Forging Die in Good Condition? (Yes/No)</label>
            </div>
          </div>
          {allChecksPassed && (
            <div className="alert alert-success" style={{ marginTop: 'var(--space-24)' }}>
              ✓ All static periodic checks passed
            </div>
          )}
        </div>

        {/* Oil Tank Counter Sub Module */}
        <div className="card" style={{ marginTop: 'var(--space-24)' }}>
          <div className="card-header">
            <h3 className="card-title">🛢️ Oil Tank Counter Sub-Module</h3>
            <p className="card-subtitle">No. of ERC quenched since last Cleaning of Oil Tank (Auto Counter - Required)</p>
          </div>

          <div style={{ padding: 'var(--space-24)', background: 'var(--color-bg-2)', borderRadius: 'var(--radius-base)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>Auto-Running Counter</div>
            <div style={{
              fontSize: 'var(--font-size-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--space-16)',
              color: current.oilTankCounter >= 90000 ? 'var(--color-error)' : current.oilTankCounter >= 80000 ? 'var(--color-warning)' : 'var(--color-success)'
            }}>
              {current.oilTankCounter.toLocaleString()} ERCs
            </div>

            {/* Alert at 90k */}
            {current.oilTankCounter >= 90000 && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-16)' }}>
                🔒 <strong>ALERT:</strong> Counter crossed 90,000! Quenching section entry is <strong>LOCKED</strong>. Oil tank cleaning must be completed and counter reset to continue.
              </div>
            )}

            {current.oilTankCounter >= 80000 && current.oilTankCounter < 90000 && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-16)' }}>
                ⚠ <strong>WARNING:</strong> Counter approaching 90,000 - Oil tank cleaning recommended soon
              </div>
            )}

            {/* Cleaning Checkbox */}
            <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-20)', background: 'var(--color-surface)', borderRadius: 'var(--radius-base)', border: '2px solid #e2e8f0' }}>
              <div className="checkbox-item" style={{ justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  id="cleaningDone"
                  checked={current.cleaningDone}
                  onChange={(e) => handleCleaningDone(e.target.checked)}
                  disabled={current.oilTankCounter === 0}
                />
                <label htmlFor="cleaningDone" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)' }}>
                  Cleaning done in current shift?
                </label>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-12)' }}>
                If cleaning is done in current shift, then:<br />
                i. Reset the counter<br />
                ii. Start adding the ERC quenched after the reset time
              </p>
            </div>
          </div>

          {/* Quenching Entry Lock Warning */}
          {isQuenchingLocked && (
            <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-16)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-base)', border: '1px solid var(--color-error)' }}>
              <h4 style={{ color: 'var(--color-error)', marginBottom: 'var(--space-12)' }}>🔒 Quenching Entry Section - LOCKED</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)' }}>
                This section is disabled until oil tank cleaning is completed and counter is reset.
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'var(--space-24)', display: 'flex', gap: 'var(--space-16)', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onBack}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isCounterLocked || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>


      </div>
    </div>

  );
};

export default ProcessStaticPeriodicCheckPage;

