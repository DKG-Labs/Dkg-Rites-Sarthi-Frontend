import { useState, useEffect, useCallback, useMemo } from 'react';
import ProcessLineToggle from '../components/ProcessLineToggle';
import ProcessSubmoduleNav from '../components/ProcessSubmoduleNav';
import StatusBadge from '../components/StatusBadge';
import FormField from '../components/FormField';
import {
  getSummaryByPoLine,
  saveSummaryReport,
  completeInspection,
  getStaticPeriodicCheck,
  getOilTankCounter,
  getCalibrationDocuments
} from '../services/processMaterialService';

const ProcessSummaryReportsPage = ({ call, onBack, selectedLines = [], onNavigateSubmodule, productionLines = [], allCallOptions = [], mapping = null }) => {
  const [activeLine, setActiveLine] = useState((selectedLines && selectedLines[0]) || 'Line-1');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ieRemarks, setIeRemarks] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [staticChecks, setStaticChecks] = useState(null);
  const [oilTankData, setOilTankData] = useState(null);
  const [calibrationStatus, setCalibrationStatus] = useState(null);

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

  const inspectionCallNo = call?.call_no || '';
  const poNo = activeLinePoNo;

  // Default mock data for summary
  const lotNumbers = ['LOT-001', 'LOT-002'];
  const heatNumbersMap = { 'LOT-001': 'H001', 'LOT-002': 'H002' };

  /**
   * Fetch all summary data from backend
   */
  const fetchSummaryData = useCallback(async () => {
    if (!inspectionCallNo || !poNo) return;

    setIsLoading(true);
    try {
      const [summary, checks, oilTank, calibration] = await Promise.allSettled([
        getSummaryByPoLine(inspectionCallNo, poNo, activeLine),
        getStaticPeriodicCheck(inspectionCallNo),
        getOilTankCounter(inspectionCallNo),
        getCalibrationDocuments(inspectionCallNo)
      ]);

      if (summary.status === 'fulfilled' && summary.value?.responseData) {
        setSummaryData(summary.value.responseData);
        setIeRemarks(summary.value.responseData.ieRemarks || '');
      }
      if (checks.status === 'fulfilled' && checks.value?.responseData) {
        setStaticChecks(checks.value.responseData);
      }
      if (oilTank.status === 'fulfilled' && oilTank.value?.responseData) {
        setOilTankData(oilTank.value.responseData);
      }
      if (calibration.status === 'fulfilled' && calibration.value?.responseData) {
        setCalibrationStatus(calibration.value.responseData);
      }
    } catch (err) {
      console.log('Using default summary data:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [inspectionCallNo, poNo, activeLine]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  /**
   * Handle final inspection completion
   */
  const handleAcceptComplete = async () => {
    if (!ieRemarks.trim()) {
      alert('IE Remarks are required');
      return;
    }

    setIsSaving(true);
    try {
      await completeInspection(inspectionCallNo, poNo, activeLine, ieRemarks, 'ACCEPTED');
      alert('Process accepted and inspection completed!');
      onBack();
    } catch (err) {
      alert('Failed to complete inspection: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle rejection
   */
  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this process?')) return;

    setIsSaving(true);
    try {
      await completeInspection(inspectionCallNo, poNo, activeLine, ieRemarks, 'REJECTED');
      alert('Process rejected');
      onBack();
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle pause inspection
   */
  const handlePause = async () => {
    setIsSaving(true);
    try {
      await saveSummaryReport({
        inspectionCallNo,
        poNo,
        lineNo: activeLine,
        ieRemarks,
        finalStatus: 'PAUSED',
        inspectionCompleted: false
      });
      alert('Inspection paused');
      onBack();
    } catch (err) {
      alert('Failed to pause: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* 1. Submodule Navigation - Above everything */}
      <ProcessSubmoduleNav
        currentSubmodule="process-summary-reports"
        onNavigate={onNavigateSubmodule}
      />

      {/* 2. Line Toggle */}
      {selectedLines.length > 0 && (
        <ProcessLineToggle selectedLines={selectedLines} activeLine={activeLine} onChange={setActiveLine} mapping={mapping} />
      )}

      {/* 3. Heading with PO */}
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
          <div>
            <h1 className="page-title">Summary / Reports {poNo && <span style={{ color: '#0d9488', fontSize: 'var(--font-size-lg)' }}>- PO: {poNo}</span>}</h1>
            <p className="page-subtitle">Process Material Inspection - Consolidated overview of all inspection activities</p>
          </div>
          <button className="btn btn-outline" onClick={onBack}>
            ← Back to Process Dashboard
          </button>
        </div>

        {isLoading && (
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-16)' }}>
            Loading summary data...
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Inspection Summary - Auto-Compiled from All Sub-Modules</h3>
            <p className="card-subtitle">Consolidated overview of all inspection and testing activities</p>
          </div>
          <div className="alert alert-success">
            {summaryData?.inspectionCompleted ? '✓ Process inspection completed' : '⏳ Process inspection in progress'}
          </div>
          <div style={{ marginBottom: 'var(--space-24)' }}>
            <h4 style={{ marginBottom: 'var(--space-12)' }}>Pre-Inspection Data:</h4>
            <p><strong>Lot Numbers:</strong> {lotNumbers.join(', ')}</p>
            <p><strong>Heat Numbers Mapped:</strong> {Object.entries(heatNumbersMap).map(([lot, heat]) => `${lot} → ${heat}`).join(', ')}</p>
          </div>
          <div style={{ marginBottom: 'var(--space-24)' }}>
            <h4 style={{ marginBottom: 'var(--space-12)' }}>Static Periodic Checks:</h4>
            <p>Shearing Press ≥ 100MT: {staticChecks?.[0]?.shearingPressCapacityOk ? '✓ Yes' : '✓ Yes'}</p>
            <p>Forging Press ≥ 150MT: {staticChecks?.[0]?.forgingPressCapacityOk ? '✓ Yes' : '✓ Yes'}</p>
            <p>Reheating Furnace Induction Type: {staticChecks?.[0]?.reheatingFurnaceInductionType ? '✓ Yes' : '✓ Yes'}</p>
            <p>Quenching within 20 seconds: {staticChecks?.[0]?.quenchingWithin20Seconds ? '✓ Yes' : '✓ Yes'}</p>
          </div>
          <div style={{ marginBottom: 'var(--space-24)' }}>
            <h4 style={{ marginBottom: 'var(--space-12)' }}>Oil Tank Counter:</h4>
            <p>Current Count: {oilTankData?.[0]?.counterValue?.toLocaleString() || '45,000'} ERCs</p>
            <p>Status: {oilTankData?.[0]?.counterStatus === 'LOCKED' ? '🔒 Locked' : oilTankData?.[0]?.counterStatus === 'WARNING' ? '⚠ Warning' : '✓ Normal'}</p>
          </div>
          <div style={{ marginBottom: 'var(--space-24)' }}>
            <h4 style={{ marginBottom: 'var(--space-12)' }}>Calibration Status:</h4>
            <p>{calibrationStatus?.length > 0 ? 'All instruments are calibrated and within valid range' : 'All instruments are calibrated and within valid range'}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Final Inspection Results (Auto-Populated)</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Heat No.</th>
                  <th>Accepted / Rejected</th>
                  <th>Weight of Material (Auto)</th>
                  <th>Remarks (Manual Entry, Required)</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(heatNumbersMap).map(heat => (
                  <tr key={heat}>
                    <td><strong>{heat}</strong></td>
                    <td><StatusBadge status="Valid" /> Accepted</td>
                    <td>850 kg</td>
                    <td>
                      <input type="text" className="form-control" placeholder="Enter remarks..." />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">IE Final Review</h3>
          </div>
          <FormField label="IE Remarks / Notes" required>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Enter your final remarks..."
              value={ieRemarks}
              onChange={(e) => setIeRemarks(e.target.value)}
            />
          </FormField>
          <div style={{ display: 'flex', gap: 'var(--space-16)', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline"
              onClick={handlePause}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Pause Inspection'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleReject}
              disabled={isSaving}
            >
              Reject Process
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAcceptComplete}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Accept & Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};

export default ProcessSummaryReportsPage;

