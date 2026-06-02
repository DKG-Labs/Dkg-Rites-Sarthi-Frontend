import React, { useState, useMemo } from 'react';
import CalibrationSubModule from '../components/CalibrationSubModule';
import ProcessLineToggle from '../components/ProcessLineToggle';
import ProcessSubmoduleNav from '../components/ProcessSubmoduleNav';
import { formatPoNoWithSerial } from '../utils/helpers';

const ProcessCalibrationDocumentsPage = ({ call, onBack, selectedLines = [], onNavigateSubmodule, lineData, productionLines: propProductionLines = [], allCallOptions = [], mapping = null, vendorCode = '', vendorName = '' }) => {
  // Get available lines from props or lineData (stabilized)
  const stableProductionLines = useMemo(() => {
    return (propProductionLines && propProductionLines.length > 0) ? propProductionLines : (lineData?.productionLines || []);
  }, [propProductionLines, lineData]);

  const availableLines = stableProductionLines.length > 0
    ? stableProductionLines.map((_, idx) => `Line-${idx + 1}`)
    : (selectedLines.length > 0 ? selectedLines : ['Line-1']);

  // State for active line (switchable)
  const [activeLine, setActiveLine] = useState(lineData?.selectedLine || availableLines[0] || 'Line-1');

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

  // Get formatted PO number for active line
  const formattedActivePoNo = useMemo(() => {
    const poNo = currentProductionLine?.poNumber || currentCallData?.po_no || call?.po_no || '';
    const poSerialNo = currentProductionLine?.poSerialNo || currentCallData?.po_serial_no || currentCallData?.poSerialNo || call?.po_serial_no || call?.poSerialNo || '';
    return formatPoNoWithSerial(poNo, poSerialNo);
  }, [currentProductionLine, currentCallData, call]);

  const inspectionCallNo = currentCallData?.call_no || call?.call_no || '';
  const poNo = formattedActivePoNo;

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

      {/* 4. Live Calibration Data */}
      <CalibrationSubModule
        vendorCode={vendorCode}
        vendorName={vendorName || currentCallData?.vendor_name || call?.vendor_name || currentCallData?.company_name || call?.company_name || ''}
        inspectionCallNo={inspectionCallNo}
        poNo={poNo}
      />
    </div>
  );
};

export default ProcessCalibrationDocumentsPage;
