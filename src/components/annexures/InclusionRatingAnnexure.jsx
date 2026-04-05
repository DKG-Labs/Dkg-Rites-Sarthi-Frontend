import React from 'react';
import '../AnnexureTemplate.css';
import './InclusionRatingAnnexure.css';
import AnnexureHeader from './AnnexureHeader';

/**
 * Final Inspection Report - Inclusion Rating, Depth of Decarb Annexure
 * Annexure-VII for inclusion rating and depth of decarb inspection
 */

const InclusionRatingAnnexure = ({ data = [] }) => {

  // Sample data rows - empty for now, will be populated dynamically in future
  // Each main row has 8 sub-rows for inclusion rating measurements
  const sampleRows = data.length > 0 ? data : [
    {
      sNo: '',
      castHeatNo: '',
      colourCode: '',
      lotNo: '',
      quantityInNos: '',
      sampleSize: '',
      sampleNos: '',
      inclusionRating: [
        { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
        { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
        { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
        { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
        { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
        { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
        { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
        { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } }
      ],
      depthOfDecarb: '',
      microstructure: '',
      freePearlite: '',
      remarks: '',
      acceptedRejected: '',
      signOfSupervisor: ''
    }
  ];

  return (
    <div className="annexure-template inclusion-rating-annexure">
      {/* HEADER SECTION */}
      <AnnexureHeader
        pageNo="13 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Test Result: Inclusion Rating, Depth of Decarb"
        annexureNumber="Annexure-VII"
        annexureCode="IRST-31-2025"
      />

      {/* INCLUSION RATING TABLE */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table inclusion-rating-table">
          <thead>
            {/* Row 1: Main headers */}
            <tr>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">S.No.</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Cast / Heat No.</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Colour Code</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Lot No.</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Quantity (in nos.)</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Sample Size</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Sample (Nos.)</div></th>
              <th colSpan="8" className="annexure-th">Inclusion Rating (thin)(thick)<br/>2.0 max</th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Depth of Decarb (d100 OR 0.25 mm max)</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Micro-structure (fully pearlitic martensitic structure</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Free/non Pearlite area</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Remarks / Accepted - Rejected</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Sign of Supervisor</div></th>
            </tr>
            {/* Row 2: A, B, C, D headers */}
            <tr>
              <th colSpan="2" className="annexure-th sub-header">A</th>
              <th colSpan="2" className="annexure-th sub-header">B</th>
              <th colSpan="2" className="annexure-th sub-header">C</th>
              <th colSpan="2" className="annexure-th sub-header">D</th>
            </tr>
            {/* Row 3: Thin/Thick headers */}
            <tr>
              <th className="annexure-th sub-header-small">Thin</th>
              <th className="annexure-th sub-header-small">Thick</th>
              <th className="annexure-th sub-header-small">Thin</th>
              <th className="annexure-th sub-header-small">Thick</th>
              <th className="annexure-th sub-header-small">Thin</th>
              <th className="annexure-th sub-header-small">Thick</th>
              <th className="annexure-th sub-header-small">Thin</th>
              <th className="annexure-th sub-header-small">Thick</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.inclusionRating.map((rating, subIndex) => (
                  <tr key={`${rowIndex}-${subIndex}`}>
                    {subIndex === 0 && (
                      <>
                        <td rowSpan="8" className="annexure-td">{row.sNo}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.castHeatNo}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.colourCode}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.lotNo}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.quantityInNos}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.sampleSize}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.sampleNos}</td>
                      </>
                    )}
                    <td className="annexure-td data-cell">{rating.a.thin}</td>
                    <td className="annexure-td data-cell">{rating.a.thick}</td>
                    <td className="annexure-td data-cell">{rating.b.thin}</td>
                    <td className="annexure-td data-cell">{rating.b.thick}</td>
                    <td className="annexure-td data-cell">{rating.c.thin}</td>
                    <td className="annexure-td data-cell">{rating.c.thick}</td>
                    <td className="annexure-td data-cell">{rating.d.thin}</td>
                    <td className="annexure-td data-cell">{rating.d.thick}</td>
                    {subIndex === 0 && (
                      <>
                        <td rowSpan="8" className="annexure-td data-cell">{row.depthOfDecarb}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.microstructure}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.freePearlite}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.remarks}</td>
                        <td rowSpan="8" className="annexure-td data-cell">{row.signOfSupervisor}</td>
                      </>
                    )}
                  </tr>
                ))}
              </React.Fragment>
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

export default InclusionRatingAnnexure;

