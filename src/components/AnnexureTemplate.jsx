import React from 'react';
import AnnexureHeader from './annexures/AnnexureHeader';
import './AnnexureTemplate.css';

/**
 * Reusable Annexure Template Component
 * 
 * Props:
 * - headerData: Object containing header information (logo, title, docInfo)
 * - title: Main title of the annexure
 * - subtitle: Subtitle (e.g., "Test Result- Chemical Analysis")
 * - annexureNumber: Annexure identifier (e.g., "Annexure-I")
 * - annexureCode: Code like "IRST-31 - 2025"
 * - tableHeaders: Array of header objects with rotated text support
 * - tableData: Array of row data objects
 * - footerData: Object containing signature and stamp information
 */

const AnnexureTemplate = ({
  headerData = {},
  title = '',
  subtitle = '',
  annexureNumber = '',
  annexureCode = '',
  tableHeaders = [],
  tableData = [],
  footerData = {},
  customStyles = {},
  selectedCall = null
}) => {
  return (
    <div className="annexure-template" style={customStyles.container}>
      {/* HEADER SECTION */}
      <AnnexureHeader
        selectedCall={selectedCall}
        docNo={headerData.docNo}
        issueNo={headerData.issueNo}
        pageNo={headerData.pageNo}
        effectiveDate={headerData.effectiveDate}
        preparedBy={headerData.preparedBy}
        checkedBy={headerData.checkedBy}
        approvedBy={headerData.approvedBy}
        title={title || headerData.title}
        subtitle={subtitle || headerData.subtitle}
        annexureNumber={annexureNumber || headerData.annexureNumber}
        annexureCode={annexureCode || headerData.annexureCode}
        productName={headerData.productName}
        callNo={headerData.callNo}
        vendorName={headerData.vendorName}
      />

      {/* TITLE SECTION */}
      <div className="annexure-title-section">
        <h2 className="annexure-stage-title">{title || headerData.title}</h2>
      </div>

      {/* SUBTITLE AND ANNEXURE INFO */}
      <div className="annexure-subtitle-section">
        <div className="annexure-subtitle">{subtitle || headerData.subtitle}</div>
        <div className="annexure-number-section">
          <div className="annexure-number">{annexureNumber || headerData.annexureNumber}</div>
          <div className="annexure-code">{annexureCode || headerData.annexureCode}</div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table">
          {/* Custom table content - can be passed as children or use default structure */}
          {tableHeaders.length > 0 && (
            <>
              <thead>
                <tr>
                  {tableHeaders.map((header, index) => (
                    <th
                      key={index}
                      className={`annexure-th ${header.rotated ? 'rotated-header' : ''} ${header.className || ''}`}
                      style={header.style}
                      rowSpan={header.rowSpan}
                      colSpan={header.colSpan}
                    >
                      {header.rotated ? (
                        <div className="rotated-text">{header.label}</div>
                      ) : (
                        header.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.cells.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`annexure-td ${cell.isData ? 'data-cell' : ''} ${cell.className || ''}`}
                        style={cell.style}
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                      >
                        {cell.value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>

      {/* FOOTER SECTION */}
      <div className="annexure-footer">
        {/* <div className="annexure-stamp-section">
          {footerData.stampText && (
            <div className="annexure-stamp-placeholder">
              {footerData.stampText}
            </div>
          )}
        </div> */}
        <div className="annexure-signature-section">
          <div className="annexure-signature-label">Name & signature of IE</div>
          {/* <div className="annexure-signature-name">{footerData.ieName || ''}</div>
          <div className="annexure-signature-designation">{footerData.ieDesignation || ''}</div>
          <div className="annexure-signature-location">{footerData.ieLocation || ''}</div> */}
        </div>
      </div>
    </div>
  );
};

export default AnnexureTemplate;

