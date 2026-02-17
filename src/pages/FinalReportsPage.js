import React from "react";
import "./FinalReportsPage.css";

export default function FinalReportsPage({ onBack }) {
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

  return (
    <div className="rep-container">

      {/* HEADER */}
      <div className="rep-header">
        <div>
          <h1 className="rep-title">Inspection Report</h1>
          <p className="rep-subtitle">Consolidated Summary of All Modules</p>
        </div>
        <button className="rep-btn-outline" onClick={onBack}>← Back</button>
      </div>

      {/* SUMMARY TABLE */}
      <div className="rep-card">
        <div className="rep-card-header">
          <h3>📘 Test Summary (Auto-Compiled)</h3>
          <p>Fetched from all test modules</p>
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
                    <span className={`rep-status rep-${row.status.toLowerCase()}`}>
                      {row.status}
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
          ✓ All tests completed — Lot is eligible for acceptance.
        </div>
      </div>

      {/* IC SECTION */}
      <div className="rep-card">
        <div className="rep-card-header">
          <h3>📄 Inspection Certificate (IC) Details</h3>
        </div>

        <div className="rep-grid">
          <div className="rep-field">
            <label>IC Number</label>
            <input disabled value="IC-FP-2025-001" />
          </div>
          <div className="rep-field">
            <label>Lot Number</label>
            <input disabled value="LOT-FP-001" />
          </div>
          <div className="rep-field">
            <label>PO Number</label>
            <input disabled value="PO-2025-1001" />
          </div>
          <div className="rep-field">
            <label>Date</label>
            <input disabled value={new Date().toLocaleDateString()} />
          </div>
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
            <select>
              <option>Accepted</option>
              <option>Rejected</option>
              <option>Conditionally Accepted</option>
            </select>
          </div>

          <div className="rep-field">
            <label>Qty Accepted</label>
            <input type="number" defaultValue="1000" />
          </div>

          <div className="rep-field">
            <label>Qty Rejected</label>
            <input type="number" defaultValue="0" />
          </div>
        </div>

        <div className="rep-field full">
          <label>Final Remarks</label>
          <textarea rows="3" placeholder="Enter final remarks..."></textarea>
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
