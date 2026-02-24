import { useState, useEffect, useMemo } from 'react';
import { formatPoNoWithSerial } from '../utils/helpers';
import { useInspection } from '../context/InspectionContext';
import FinalSubmoduleNav from '../components/FinalSubmoduleNav';
import "./FinalReportsPage.css";

export default function FinalReportsPage({ onBack, onNavigateSubmodule }) {
  const { getFpCachedData, selectedCall } = useInspection();

  // Get the call number - use selectedCall or fallback to sessionStorage
  const callNo = selectedCall?.call_no || sessionStorage.getItem('selectedCallNo');

  // Get cached dashboard data with fallback to sessionStorage
  const cachedData = getFpCachedData(callNo);
  let lotsFromVendor = cachedData?.dashboardData?.finalLotDetails || [];

  // Fallback: Check sessionStorage directly if context cache is empty
  if (lotsFromVendor.length === 0 && callNo) {
    try {
      const storedCache = sessionStorage.getItem('fpDashboardDataCache');
      if (storedCache) {
        const cacheData = JSON.parse(storedCache);
        lotsFromVendor = cacheData[callNo]?.finalLotDetails || [];
      }
    } catch (e) {
      console.error('Error reading from sessionStorage:', e);
    }
  }

  // State for final decision
  const [finalDecision, setFinalDecision] = useState(() => {
    const persistedData = localStorage.getItem(`finalDecisionData_${callNo}`);
    if (persistedData) {
      try {
        return JSON.parse(persistedData);
      } catch (e) {
        console.error('Error parsing persisted final decision:', e);
      }
    }
    return {
      lotStatus: 'Accepted',
      qtyAccepted: lotsFromVendor.reduce((sum, lot) => sum + (lot.lotSize || lot.offeredQty || 0), 0),
      qtyRejected: 0,
      remarks: ''
    };
  });

  // Persist final decision whenever it changes
  useEffect(() => {
    if (callNo) {
      localStorage.setItem(`finalDecisionData_${callNo}`, JSON.stringify(finalDecision));
    }
  }, [finalDecision, callNo]);

  const reportSummary = [
    {
      module: "Calibration & Documents",
      accepted: "N/A",
      rejected: "N/A",
      status: "OK",
      keyResults: "All instruments calibrated",
      remarks: "Valid certificates"
    },
    {
      module: "Visual & Dimensional",
      accepted: 50,
      rejected: 0,
      status: "OK",
      keyResults: "Within tolerance",
      remarks: "-"
    },
    {
      module: "Hardness Test",
      accepted: 5,
      rejected: 0,
      status: "OK",
      keyResults: "40–44 HRC",
      remarks: "-"
    },
    {
      module: "Depth of Decarb",
      accepted: 3,
      rejected: 0,
      status: "OK",
      keyResults: "Within spec",
      remarks: "-"
    },
    {
      module: "Microstructure",
      accepted: 3,
      rejected: 0,
      status: "OK",
      keyResults: "Pearlitic",
      remarks: "-"
    },
    {
      module: "Inclusion Rating",
      accepted: 3,
      rejected: 0,
      status: "OK",
      keyResults: "Class 1.5 Max",
      remarks: "-"
    },
    {
      module: "Toe Load",
      accepted: 5,
      rejected: 0,
      status: "OK",
      keyResults: "850–1100 KgF",
      remarks: "-"
    },
    {
      module: "Deflection",
      accepted: 5,
      rejected: 0,
      status: "OK",
      keyResults: "50mm @ 4250N",
      remarks: "-"
    },
    {
      module: "Weight Measurement",
      accepted: 5,
      rejected: 0,
      status: "OK",
      keyResults: "≥ 904g / 1068g",
      remarks: "-"
    }
  ];

  // Get formatted PO number
  const formattedPoNo = useMemo(() => {
    const poData = cachedData?.dashboardData?.poData || {};
    return formatPoNoWithSerial(poData.poNo, poData.poSerialNo);
  }, [cachedData]);

  return (
    <div className="rep-container">

      {/* HEADER */}
      <div className="rep-header">
        <div>
          <h1 className="rep-title">Inspection Report {formattedPoNo && <span style={{ color: '#0d9488', fontSize: 'var(--font-size-lg)' }}>- PO: {formattedPoNo}</span>}</h1>
          <p className="rep-subtitle">Consolidated Summary of All Modules - Call: {callNo}</p>
        </div>
        <div className="rep-header-actions">
          <button className="rep-btn-outline" onClick={onBack}>← Back</button>
        </div>
      </div>

      {/* KEY INFO STRIP */}
      <div className="rep-info-strip" style={{ flexWrap: 'wrap' }}>
        <div className="info-item">
          <label>Lot No:</label>
          <span>{lotsFromVendor[0]?.lotNo || 'LOT-FP-001'}</span>
        </div>
        <div className="info-item">
          <label>Heat No:</label>
          <span>{lotsFromVendor[0]?.heatNo || 'HT-9988'}</span>
        </div>
        <div className="info-item">
          <label>Lot Size:</label>
          <span>{lotsFromVendor.reduce((sum, l) => sum + (l.lotSize || l.offeredQty || 0), 0) || '1000'}</span>
        </div>
        <div className="info-item">
          <label>Sample Size:</label>
          <span>{lotsFromVendor[0]?.sampleSize || '50'}</span>
        </div>
        <div className="info-item" style={{ minWidth: '200px' }}>
          <label>Contractor:</label>
          <span>{cachedData?.dashboardData?.poData?.vendorName || '-'}</span>
        </div>
        <div className="info-item" style={{ minWidth: '200px' }}>
          <label>Manufacturer:</label>
          <span>{cachedData?.dashboardData?.poData?.vendorName || '-'}</span>
        </div>
      </div>

      {/* Submodule Navigation */}
      <FinalSubmoduleNav
        currentSubmodule="final-reports"
        onNavigate={onNavigateSubmodule}
      />

      {/* SUMMARY TABLE */}
      <div className="rep-card">
        <div className="rep-card-header">
          <h3>📘 Test Summary (Auto-Compiled)</h3>
          <p>Detailed performance status of individual modules</p>
        </div>

        <div className="rep-table-wrapper">
          <table className="rep-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Accepted</th>
                <th>Rejected</th>
                <th>Status</th>
                <th>Key Results</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {reportSummary.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.module}</strong></td>
                  <td>{row.accepted}</td>
                  <td>{row.rejected}</td>
                  <td>
                    <span className={`rep-status-badge ${row.status === 'OK' ? 'status-ok' : 'status-not-ok'}`}>
                      {row.status === 'OK' ? 'OK' : 'NOT OK'}
                    </span>
                  </td>
                  <td>{row.keyResults}</td>
                  <td>{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rep-success-banner">
          ✓ All individual module results are OK. Lot is eligible for final acceptance.
        </div>
      </div>

      {/* FINAL DECISION */}
      <div className="rep-card">
        <div className="rep-card-header">
          <h3>Final Decision</h3>
        </div>

        <div className="rep-grid">
          <div className="rep-field">
            <label>Lot Status</label>
            <select
              value={finalDecision.lotStatus}
              onChange={(e) => setFinalDecision({ ...finalDecision, lotStatus: e.target.value })}
            >
              <option>Accepted</option>
              <option>Rejected</option>
              <option>Conditionally Accepted</option>
            </select>
          </div>

          <div className="rep-field">
            <label>Qty Accepted</label>
            <input
              type="number"
              value={finalDecision.qtyAccepted}
              onChange={(e) => setFinalDecision({ ...finalDecision, qtyAccepted: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="rep-field">
            <label>Qty Rejected</label>
            <input
              type="number"
              value={finalDecision.qtyRejected}
              onChange={(e) => setFinalDecision({ ...finalDecision, qtyRejected: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="rep-field full">
          <label>Final Remarks</label>
          <textarea
            rows="3"
            placeholder="Enter final remarks..."
            value={finalDecision.remarks}
            onChange={(e) => setFinalDecision({ ...finalDecision, remarks: e.target.value })}
          ></textarea>
        </div>

        <div className="rep-actions">
          <button className="rep-btn-outline">Export PDF</button>
          <button className="rep-btn-outline">Print</button>
          <button className="rep-btn-outline" onClick={onBack}>Cancel</button>
          <button className="rep-btn-primary">Generate IC</button>
        </div>
      </div>

    </div>
  );
}
