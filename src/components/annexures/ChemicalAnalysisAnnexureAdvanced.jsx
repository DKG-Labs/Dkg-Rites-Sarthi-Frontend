import React from 'react';
import '../AnnexureTemplate.css';
import './ChemicalAnalysisAnnexure.css';
import AnnexureHeader from './AnnexureHeader';

/**
 * Chemical Analysis Annexure - Exact replica of the image
 * With complex multi-row headers
 */

const ChemicalAnalysisAnnexureAdvanced = ({ data = [] }) => {

  // Sample data rows
  const sampleRows = data.length > 0 ? data : [
    { sNo: 1, date: '', source: '', certNo: '', heatNo: '', coilCode: '', quantity: '', sampleNo: '',
      c: '', mn: '', si: '', s: '', p: '', grainSize: '', inclusion: '', hardness: '',
      decarb: '', freedom: '', accepted: '', sign: '' },
    { sNo: 2, date: '', source: '', certNo: '', heatNo: '', coilCode: '', quantity: '', sampleNo: '',
      c: '', mn: '', si: '', s: '', p: '', grainSize: '', inclusion: '', hardness: '',
      decarb: '', freedom: '', accepted: '', sign: '',
      note: 'Stage 2C attached' },
    { sNo: 3, date: '', source: '', certNo: '', heatNo: '', coilCode: '', quantity: '', sampleNo: '',
      c: '', mn: '', si: '', s: '', p: '', grainSize: '', inclusion: '', hardness: '',
      decarb: '', freedom: '', accepted: '', sign: '' },
    { sNo: 4, date: '', source: '', certNo: '', heatNo: '', coilCode: '', quantity: '', sampleNo: '',
      c: '', mn: '', si: '', s: '', p: '', grainSize: '', inclusion: '', hardness: '',
      decarb: '', freedom: '', accepted: '', sign: '' }
  ];

  return (
    <div className="annexure-template chemical-analysis-annexure">
      {/* HEADER SECTION */}
      <AnnexureHeader
        pageNo="9 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Stage Inspection for Raw material"
        subtitle="Test Result- Chemical Analysis"
        annexureNumber="Annexure-I"
        annexureCode="IRST-31-2025"
      />

      {/* COMPLEX TABLE */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table chemical-table">
          <thead>
            {/* Row 1: Main headers */}
            <tr>
              <th rowSpan="3" className="annexure-th">S. No.</th>
              <th rowSpan="3" className="annexure-th">Date</th>
              <th rowSpan="3" className="annexure-th">Source of Raw material name & trademark</th>
              <th rowSpan="3" className="annexure-th">Certificate No.</th>
              <th rowSpan="3" className="annexure-th">Cast / Heat No.</th>
              <th rowSpan="3" className="annexure-th">Coil or code (bar Nos)</th>
              <th rowSpan="3" className="annexure-th">Quantity</th>
              <th rowSpan="3" className="annexure-th">Sample no.</th>
              <th colSpan="5" rowSpan="1" className="annexure-th">Chemical Analysis report</th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Grain Size No (or finer)</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Inclusion Rating (thin) 2.0 max</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Hardness BRINELL/HV</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Depth of Decarb (d) 0.00 or 0.5 mm</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Freedom from Defects</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Accepted or Not Accepted</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Sign of Lab Supervisor</div></th>
            </tr>
            {/* Row 2: Chemical elements with Ladle analysis */}
            <tr>
              <th rowSpan="1" className="annexure-th">%C</th>
              <th rowSpan="1" className="annexure-th">%Mn</th>
              <th rowSpan="1" className="annexure-th">%Si</th>
              <th rowSpan="1" className="annexure-th">%S</th>
              <th rowSpan="1" className="annexure-th">%P</th>
            </tr>
            {/* Row 3: Ladle analysis and Permissible range */}
            <tr>
              <th className="annexure-th sub-header">Ladle analysis<br/>0.50-0.60<br/><br/>Permissible range over ladle analysis<br/>±0.03</th>
              <th className="annexure-th sub-header">0.80-1.00<br/><br/><br/>±0.04</th>
              <th className="annexure-th sub-header">1.50-2.00<br/><br/><br/>±0.05</th>
              <th className="annexure-th sub-header">0.03 max.<br/><br/><br/>±0.005</th>
              <th className="annexure-th sub-header">0.03 max.<br/><br/><br/>±0.005</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, index) => (
              <tr key={index}>
                <td className="annexure-td">{row.sNo}</td>
                <td className="annexure-td data-cell">{row.date}</td>
                <td className="annexure-td data-cell">{row.source}</td>
                <td className="annexure-td data-cell">{row.certNo}</td>
                <td className="annexure-td data-cell">{row.heatNo}</td>
                <td className="annexure-td data-cell">{row.coilCode}</td>
                <td className="annexure-td data-cell">{row.quantity}</td>
                <td className="annexure-td data-cell">{row.sampleNo}</td>
                <td className="annexure-td data-cell">{row.c}</td>
                <td className="annexure-td data-cell">{row.mn}</td>
                <td className="annexure-td data-cell">{row.si}</td>
                <td className="annexure-td data-cell">{row.s}</td>
                <td className="annexure-td data-cell">{row.p}</td>
                <td className="annexure-td data-cell">{row.grainSize}</td>
                <td className="annexure-td data-cell">{row.inclusion}</td>
                <td className="annexure-td data-cell">{row.hardness}</td>
                <td className="annexure-td data-cell">{row.decarb}</td>
                <td className="annexure-td data-cell">{row.freedom}</td>
                <td className="annexure-td data-cell">{row.accepted}</td>
                <td className="annexure-td data-cell">{row.sign}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="annexure-footer">
        {/* <div className="annexure-stamp-section">
          <div className="annexure-stamp-placeholder">STAMP</div>
        </div> */}
        <div className="annexure-signature-section">
          <div className="annexure-signature-label">Name & signature of IE</div>
          {/* <div className="annexure-signature-name">Dharm Singh Fartyal</div>
          <div className="annexure-signature-designation">Sr. Manager (Mech.)</div>
          <div className="annexure-signature-location">RITES Ltd. / W.R. MUMBAI - 21</div> */}
        </div>
      </div>
    </div>
  );
};

export default ChemicalAnalysisAnnexureAdvanced;

