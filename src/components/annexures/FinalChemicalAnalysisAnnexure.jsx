import React from 'react';
import '../AnnexureTemplate.css';
import './FinalChemicalAnalysisAnnexure.css';
import AnnexureHeader from './AnnexureHeader';

/**
 * Final Inspection Report - Chemical Analysis Annexure
 * Annexure-VI for final chemical analysis inspection
 */

const FinalChemicalAnalysisAnnexure = ({ data = [] }) => {

  // Sample data rows - empty for now, will be populated dynamically in future
  const sampleRows = data.length > 0 ? data : [
    { sNo: 1, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' },
    { sNo: 2, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' },
    { sNo: 3, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' }
  ];

  return (
    <div className="annexure-template final-chemical-analysis-annexure">
      {/* HEADER SECTION */}
      <AnnexureHeader
        pageNo="12 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Test Result- Chemical Analysis"
        annexureNumber="Annexure-VI"
        annexureCode="IRST-31-2025"
      />

      {/* CHEMICAL ANALYSIS TABLE */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table final-chemical-table">
          <thead>
            {/* Row 1: Main headers with rotated text */}
            <tr>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">S. No.</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Cast / Heat No.</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Colour Code</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Lot No.</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Quantity (in Ea. nos)</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Sample size</div></th>
              <th colSpan="5" className="annexure-th">Parameter<br/>Ladle analysis<br/>Permissible<br/>range over<br/>ladle sample<br/>analysis</th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Remark</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Accepted or Rejected</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Sign of Lab. Supervisor</div></th>
            </tr>
            {/* Row 2: Chemical parameters */}
            <tr>
              <th className="annexure-th sub-header">% C<br/><br/>0.5 to 0.6<br/><br/>± 0.03</th>
              <th className="annexure-th sub-header">% Mn<br/><br/>0.8 to 1.0<br/><br/>± 0.04</th>
              <th className="annexure-th sub-header">% Si<br/><br/>1.5 to 2.00<br/><br/>± 0.05</th>
              <th className="annexure-th sub-header">% S<br/><br/>0.03 max<br/><br/>± 0.005</th>
              <th className="annexure-th sub-header">% P<br/><br/>0.03 max<br/><br/>± 0.005</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, index) => (
              <tr key={index}>
                <td className="annexure-td">{row.sNo}</td>
                <td className="annexure-td data-cell">{row.castHeatNo}</td>
                <td className="annexure-td data-cell">{row.colourCode}</td>
                <td className="annexure-td data-cell">{row.lotNo}</td>
                <td className="annexure-td data-cell">{row.quantityEa}</td>
                <td className="annexure-td data-cell">{row.sampleSize}</td>
                <td className="annexure-td data-cell">{row.c}</td>
                <td className="annexure-td data-cell">{row.mn}</td>
                <td className="annexure-td data-cell">{row.si}</td>
                <td className="annexure-td data-cell">{row.s}</td>
                <td className="annexure-td data-cell">{row.p}</td>
                <td className="annexure-td data-cell">{row.remark}</td>
                <td className="annexure-td data-cell">{row.acceptedOrRejected}</td>
                <td className="annexure-td data-cell">{row.signOfSupervisor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER SECTION */}
      <div className="annexure-footer">
        <div className="annexure-signature-section">
          <div className="annexure-signature-right">
            <div className="annexure-signature-label">Name & signature of IE</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalChemicalAnalysisAnnexure;

