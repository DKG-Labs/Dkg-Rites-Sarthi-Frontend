import React from 'react';
import '../AnnexureTemplate.css';
import './DimensionAnnexure.css';
import AnnexureHeader from './AnnexureHeader';

/**
 * Dimension Annexure - Test Result Dimension
 * Annexure-II for dimensional inspection
 */

const DimensionAnnexure = ({ data = [] }) => {

  // Sample data rows - one main row with 5 sub-rows for samples
  const sampleRows = data.length > 0 ? data : [
    {
      sNo: 2,
      date: '',
      source: '',
      certNo: '',
      heatNo: '',
      coilCode: '',
      quantity: '',
      samples: [
        { sampleNo: 1, dia6: '', dia7: '', dia8: '', dia9: '', dia10: '', dia11: '', dia12: '', dia13: '', dia14: '', dia15: '', dia16: '', dia17: '', dia18: '', dia19: '', dia20: '' },
        { sampleNo: 2, dia6: '', dia7: '', dia8: '', dia9: '', dia10: '', dia11: '', dia12: '', dia13: '', dia14: '', dia15: '', dia16: '', dia17: '', dia18: '', dia19: '', dia20: '' },
        { sampleNo: 3, dia6: '', dia7: '', dia8: '', dia9: '', dia10: '', dia11: '', dia12: '', dia13: '', dia14: '', dia15: '', dia16: '', dia17: '', dia18: '', dia19: '', dia20: '' },
        { sampleNo: 4, dia6: '', dia7: '', dia8: '', dia9: '', dia10: '', dia11: '', dia12: '', dia13: '', dia14: '', dia15: '', dia16: '', dia17: '', dia18: '', dia19: '', dia20: '' },
        { sampleNo: 5, dia6: '', dia7: '', dia8: '', dia9: '', dia10: '', dia11: '', dia12: '', dia13: '', dia14: '', dia15: '', dia16: '', dia17: '', dia18: '', dia19: '', dia20: '' }
      ],
      accepted: '',
      sign: ''
    }
  ];

  return (
    <div className="annexure-template dimension-annexure">
      {/* HEADER SECTION */}
      <AnnexureHeader
        pageNo="10 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Stage Inspection for Raw material"
        subtitle="Test Result- Dimension"
        annexureNumber="Annexure-II"
        annexureCode="IRST-31-2025"
        note="Note: Tolerance as per specified in the Specification."
      />

      {/* DIMENSION TABLE */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table dimension-table">
          <thead>
            {/* Header Row */}
            <tr>
              <th rowSpan="2" className="annexure-th">S. No.</th>
              <th rowSpan="2" className="annexure-th">Date</th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Source of Raw material name & trademark</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Certificate No.</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Cast / Heat No.</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Colour code</div></th>
              <th rowSpan="2" className="annexure-th">Quantity</th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Sample no.</div></th>
              <th className="annexure-th">Dia (mm)</th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Sample no.</div></th>
              <th className="annexure-th">Dia (mm)</th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Sample no.</div></th>
              <th className="annexure-th">Dia (mm)</th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Sample no.</div></th>
              <th className="annexure-th">Dia (mm)</th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Accepted or Not Accepted</div></th>
              <th rowSpan="2" className="annexure-th rotated-header"><div className="rotated-text">Sign of Lab. Supervisor</div></th>
            </tr>
            {/* Second header row with numbered columns */}
            <tr>
              <th className="annexure-th sub-header">6</th>
              <th className="annexure-th sub-header">11</th>
              <th className="annexure-th sub-header">16</th>
              <th className="annexure-th sub-header">7</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.samples.map((sample, sampleIndex) => (
                  <tr key={`${rowIndex}-${sampleIndex}`}>
                    {sampleIndex === 0 && (
                      <>
                        <td rowSpan="5" className="annexure-td">{row.sNo}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.date}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.source}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.certNo}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.heatNo}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.coilCode}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.quantity}</td>
                      </>
                    )}
                    <td className="annexure-td">{sample.sampleNo}</td>
                    <td className="annexure-td data-cell">{sample.dia6}</td>
                    <td className="annexure-td">{sample.sampleNo + 5}</td>
                    <td className="annexure-td data-cell">{sample.dia11}</td>
                    <td className="annexure-td">{sample.sampleNo + 10}</td>
                    <td className="annexure-td data-cell">{sample.dia16}</td>
                    <td className="annexure-td">{sample.sampleNo + 15}</td>
                    <td className="annexure-td data-cell">{sample.dia7}</td>
                    {sampleIndex === 0 && (
                      <>
                        <td rowSpan="5" className="annexure-td data-cell">{row.accepted}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.sign}</td>
                      </>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* NOTE SECTION */}
      <div className="dimension-note">
        Note: Tolerance as per specified in the Specification.
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

export default DimensionAnnexure;

