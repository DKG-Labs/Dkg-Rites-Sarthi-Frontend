import React from 'react';
import AnnexureLayout from './AnnexureLayout';
import './ProcessInspectionAnnexure.css';

/**
 * ProcessInspectionAnnexure - Process Inspection Register (F/ERC-01)
 * Displays hourly production checks over 3 shifts (A, B, C)
 */
const ProcessInspectionAnnexure = ({ data = {}, selectedCall }) => {
  
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

  // Standard 14 Activities from reference images - with sub-rows for multiple checks
  const activities = [
    { id: 1, text: "Checking of Length of cut bars, random", detail: "(3 bars/Hr.)", subRows: 3 },
    { id: 2, text: "Turning Length, random", detail: "(3 bars/Hr.)", subRows: 3 },
    { id: 3, text: "Turning Dia., random", detail: "(3 bars/Hr.)", subRows: 3 },
    { id: 4, text: "MPI Test, random", detail: "(3 bars/Hr.)", subRows: 3 },
    { id: 5, text: "Forging Temp.", detail: "NOT APPLICABLE", isNotApplicable: true },
    { id: 6, text: "Checking of Die (100%)", detail: "At the start of shift. (if Production per shift is more than 4000 ERCs, additional check in the middle of the shift)", hasDetailRow: true },
    { id: 7, text: "Quenching Temperature and Duration, random", detail: "(Temp. to be checked every hour. Duration to be checked at the start of the shift)", hasDetailRow: true },
    { id: 8, text: "Quenching Hardness", detail: "2 ERCs/Hr, random", subRows: 2 },
    { id: 9, text: "Tempering Temperature and Duration, random", detail: "(Temp. to be checked every hour. Duration to be checked at the start of the shift)", hasDetailRow: true },
    { id: 10, text: "Dimension Check (2 ERCs/Hr.), random", detail: "", subRows: 2 },
    { id: 11, text: "Hardness of finished ERC", detail: "2 ERCs/Hr, random", subRows: 2 },
    { id: 12, text: "Toe load of finished ERC", detail: "2 ERCs/Hr, random", subRows: 2 },
    { id: 13, text: "Confirmation of yellow and green paint on the end face of ERC Mk-III & V, respectively (Cl. No. 6.1)", detail: "" },
    { id: 14, text: "Documentation (100%)", detail: "Specific details/results of all the checks should be recorded" },
  ];

  // Shift Definitions
  const shifts = [
    { id: 'A', title: <>"A" Shift<br />(06:00-14:00)</>, hours: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00'], endpoints: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'] },
    { id: 'B', title: <>"B" Shift<br />(14:00-22:00)</>, hours: ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'], endpoints: ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'] },
    { id: 'C', title: <>"C" Shift<br />(22:00-06:00)</>, hours: ['22:00', '23:00', '24:00', '01:00', '02:00', '03:00', '04:00', '05:00'], endpoints: ['23:00', '24:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'] },
  ];

  return (
    <div className="process-inspection-annexure">
      {shifts.map((shift, shiftIdx) => (
        <AnnexureLayout key={shift.id} className="itp-page">
          <ProcessHeader />

          <div className="pi-info-container">
            <table className="pi-info-main-table">
              <tbody>
                <tr className="pi-row-1">
                  <td className="pi-r1-c1">Date</td>
                  <td className="pi-r1-c2">{data.date || ''}</td>
                  <td className="pi-r1-c3"><b>{shift.title}</b></td>
                  <td className="pi-r1-c4">Lot No.</td>
                  <td className="pi-r1-c5">{data.lotNo || ''}</td>
                </tr>
                <tr className="pi-row-2">
                  <td className="pi-r2-c1" colSpan={2}>PO No. & Date</td>
                  <td className="pi-r2-c2">{data.poNo || ''}</td>
                  <td className="pi-r2-c3">Nos. of ERC produced during the shift</td>
                  <td className="pi-r2-c4">{data.qtyProduced || ''}</td>
                </tr>
                <tr className="pi-row-3">
                  <td className="pi-r2-c1" colSpan={2}>Case No. (IBS)</td>
                  <td className="pi-r2-c2">{data.caseNo || ''}</td>
                  <td className="pi-r2-c3">Name of Inspecting Engineer</td>
                  <td className="pi-r2-c4">{data.engineerName || ''}</td>
                </tr>
              </tbody>
            </table>
            <table className="pi-info-row-table pi-r4">
              <tbody>
                <tr>
                  <td className="pi-r4-c1">Raw material (Stage) IC No.</td>
                  <td className="pi-r4-c2">{data.icNo || ''}</td>
                  <td className="pi-r4-c3">& date:</td>
                  <td className="pi-r4-c4">{data.icDate || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <table className="pi-register-table">
            <thead>
              <tr className="pi-header-row">
                <th className="pi-sr-col" rowSpan="2">Sr.<br />No.</th>
                <th className="pi-activity-col">Time</th>
                {shift.hours.map((h, i) => (
                  <th key={h} className="pi-time-col">
                    {h}<br />-<br />{shift.endpoints[i]}
                  </th>
                ))}
                <th className="pi-remarks-col" rowSpan="2">Remarks Accepted <u>OR</u> Not-accepted</th>
              </tr>
              <tr className="pi-header-row">
                <th className="pi-activity-col">Activities</th>
                {shift.hours.map((_, i) => <th key={i}></th>)}
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => {
                const dataSubRows = activity.subRows || 1;
                const hasDetailRow = activity.hasDetailRow || false;
                const totalRowSpan = dataSubRows + (hasDetailRow ? 1 : 0);

                return (
                  <React.Fragment key={activity.id}>
                    {/* Primary Row / First Data Sub-Row */}
                    <tr className="pi-data-row">
                      <td rowSpan={totalRowSpan}>{activity.id}.</td>
                      <td className="pi-activity-col" rowSpan={hasDetailRow ? 1 : totalRowSpan}>
                        <div className="pi-activity-text">{activity.text}</div>
                        {!hasDetailRow && activity.detail && <span className="pi-activity-detail">{activity.detail}</span>}
                      </td>
                      
                      {activity.isNotApplicable ? (
                        <td colSpan={shift.hours.length} style={{ fontWeight: 'bold' }}>NOT APPLICABLE</td>
                      ) : activity.id === 14 ? (
                        <td colSpan={shift.hours.length} style={{ fontWeight: 'bold', textAlign: 'left', paddingLeft: '8px' }}>
                          Specific details/results of all the checks should be recorded
                        </td>
                      ) : (
                        <>
                          {shift.hours.map((_, i) => <td key={i}></td>)}
                        </>
                      )}
                      
                      {activity.id !== 5 && (
                        <td className="pi-remarks-col" rowSpan={totalRowSpan}></td>
                      )}
                    </tr>

                    {/* Additional Data Sub-Rows (for multi-check like 3 bars/hr) */}
                    {dataSubRows > 1 && Array.from({ length: dataSubRows - 1 }).map((_, subIdx) => (
                      <tr key={`${activity.id}-data-sub-${subIdx}`} className="pi-data-row sub-row">
                        {shift.hours.map((_, i) => <td key={i}></td>)}
                      </tr>
                    ))}

                    {/* Horizontal Detail Row (for long notes like shifts 6, 7, 9) */}
                    {hasDetailRow && (
                      <tr className="pi-data-row detail-row">
                        <td colSpan={1 + shift.hours.length} className="pi-horizontal-detail">
                          {activity.detail}
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
