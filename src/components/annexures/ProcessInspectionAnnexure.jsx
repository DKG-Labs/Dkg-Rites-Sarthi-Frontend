import React from 'react';
import AnnexureLayout from './AnnexureLayout';
import './ProcessInspectionAnnexure.css';

/**
 * ProcessInspectionAnnexure - Process Inspection Register (F/ERC-01)
 * Displays hourly production checks dynamically from backend data.
 */
const ProcessInspectionAnnexure = ({ data = [], selectedCall }) => {
  
  // Custom Header matching the reference image perfectly
  const ProcessHeader = () => (
    <table className="pi-header-custom-table">
      <tbody>
        <tr>
          <td className="pi-h-col-1">
            <div className="pi-h-logo-box">
              <img src="/login-assets/riteslogo.png" alt="RITES" className="pi-h-logo" />
              <div className="pi-h-company-info">
                <div className="pi-h-hindi">राइट्स लिमिटेड</div>
                <div className="pi-h-hindi-sub">(गुणवत्ता आश्वासन विभाग)</div>
                <div className="pi-h-english">RITES LTD (QA DIVISION)</div>
              </div>
            </div>
          </td>
          <td className="pi-h-col-2">
            <div className="pi-h-title-hindi">िनरीक्षण एवं जाँच योजना <b>INSPECTION & TEST PLAN</b></div>
            <div className="pi-h-sub-title"><b>ELASTIC RAIL CLIP</b></div>
            <div className="pi-h-reg-title"><b><u>PROCESS INSPECTION REGISTER</u></b></div>
            <div className="pi-h-ref-text">
              <b><u>(Ref.: RB letter No. 2024/RS(G)/779/12 (E3482675) dated. 06.01.25 & RB letter No.<br />2024/RS(G)/779/12 (E3482675) dated 27.01.25 )</u></b>
            </div>
          </td>
          <td className="pi-h-col-3">
            <div className="pi-h-format-box">
              <div className="pi-h-format-label">Format No.</div>
              <div className="pi-h-format-value">F/ERC-01</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  // Helper to split reading string (e.g. "R1, R2, R3") into individual values
  const getReadingValue = (readingStr, index) => {
    if (!readingStr || readingStr === '-') return '-';
    const values = readingStr.split(',').map(v => v.trim());
    return values[index] || '-';
  };

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="no-data-alert">No inspection data available for the selected shift.</div>;
  }

  return (
    <div className="process-inspection-annexure">
      {data.map((entry, entryIdx) => (
        <AnnexureLayout key={entryIdx} className="itp-page portrait">
          <ProcessHeader />

          <div className="pi-info-container">
            <table className="pi-info-main-table">
              <tbody>
                <tr className="pi-row-1">
                  <td className="pi-r1-c1">Date</td>
                  <td className="pi-r1-c2">{entry.date || ''}</td>
                  <td className="pi-r1-c3"><b>Shift: {entry.shift}</b></td>
                  <td className="pi-r1-c4">Lot No.</td>
                  <td className="pi-r1-c5">{entry.lotNo || ''}</td>
                </tr>
                <tr className="pi-row-2">
                  <td className="pi-r2-c1" colSpan={2}>PO No. & Date</td>
                  <td className="pi-r2-c2">{entry.poNoAndDate || ''}</td>
                  <td className="pi-r2-c3">Nos. of ERC produced during the shift</td>
                  <td className="pi-r2-c4">{entry.ercProducedDuringShift || ''}</td>
                </tr>
                <tr className="pi-row-3">
                  <td className="pi-r2-c1" colSpan={2}>Case No. (IBS)</td>
                  <td className="pi-r2-c2">{entry.caseNoIbs || ''}</td>
                  <td className="pi-r2-c3">Name of Inspecting Engineer</td>
                  <td className="pi-r2-c4">{entry.inspectingEngineerName || ''}</td>
                </tr>
              </tbody>
            </table>
            <table className="pi-info-row-table pi-r4">
              <tbody>
                <tr>
                  <td className="pi-r4-c1">Raw material (Stage) IC No. & date</td>
                  <td className="pi-r4-c2">{entry.rawMaterialIcNoAndDate || ''}</td>
                  <td className="pi-r4-c3">ERC Type</td>
                  <td className="pi-r4-c4">{entry.ercType || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <table className="pi-register-table">
            <thead>
              <tr className="pi-header-row">
                <th className="pi-sr-col" rowSpan="2">Sr.<br />No.</th>
                <th className="pi-activity-col">Time</th>
                {entry.hourLabels.map((h, i) => (
                  <th key={i} className="pi-time-col">
                    {h}
                  </th>
                ))}
                <th className="pi-remarks-col" rowSpan="2">Remarks Accepted <u>OR</u> Not-accepted</th>
              </tr>
              <tr className="pi-header-row">
                <th className="pi-activity-col">Activities</th>
                {entry.hourLabels.map((_, i) => <th key={i}></th>)}
              </tr>
            </thead>
            <tbody>
              {entry.rows.map((row, rowIdx) => {
                let subRowsCount = 1;
                if (row.activity.includes("(3 bars/Hr.)")) subRowsCount = 3;
                else if (row.activity.includes("(2 ERCs/Hr.)")) subRowsCount = 2;
                
                const totalRowSpan = subRowsCount;

                return (
                  <React.Fragment key={rowIdx}>
                    {/* Primary Row / First Data Sub-Row */}
                    <tr className="pi-data-row">
                      <td rowSpan={totalRowSpan}>{row.srNo}.</td>
                      <td className="pi-activity-col" rowSpan={totalRowSpan}>
                        <div className="pi-activity-text">{row.activity}</div>
                      </td>
                      
                      {row.activity.includes("(N/A)") ? (
                        <td colSpan={entry.hourLabels.length} style={{ textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px' }}>
                          NOT APPLICABLE
                        </td>
                      ) : (
                        <>
                          {entry.hourLabels.map((_, hIdx) => (
                            <td key={hIdx}>{getReadingValue(row.hourlyData[hIdx], 0)}</td>
                          ))}
                        </>
                      )}
                      
                      {row.remarks !== 'N/A' && (
                        <td className="pi-remarks-col" rowSpan={totalRowSpan}>
                          <span className={row.remarks === 'Not-accepted' ? 'text-rejected' : 'text-accepted'}>
                            {row.remarks}
                          </span>
                        </td>
                      )}
                    </tr>

                    {/* Additional Data Sub-Rows */}
                    {subRowsCount > 1 && Array.from({ length: subRowsCount - 1 }).map((_, subIdx) => (
                      <tr key={`sub-${subIdx}`} className="pi-data-row sub-row">
                        {entry.hourLabels.map((_, hIdx) => (
                          <td key={hIdx}>{getReadingValue(row.hourlyData[hIdx], subIdx + 1)}</td>
                        ))}
                      </tr>
                    ))}

                    {/* Special Row 14: Documentation */}
                    {row.srNo === 14 && (
                       <tr className="pi-data-row detail-row">
                        <td colSpan={1 + entry.hourLabels.length} className="pi-horizontal-detail">
                           Specific details/results of all the checks should be recorded
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <div className="pi-note-section">
            (NOTE: &nbsp;&nbsp; In case of any discrepancy observed, the same shall be immediately informed to Quality in-charge/Shift in-charge verbally and also to be communicated the same through E-mail)
          </div>

          <div className="pi-signature-block">
            <u>(Signature of RITES Engineer)</u>
          </div>
        </AnnexureLayout>
      ))}
    </div>
  );
};

export default ProcessInspectionAnnexure;
