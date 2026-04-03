import React from 'react';
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
  customStyles = {}
}) => {
  return (
    <div className="annexure-template" style={customStyles.container}>
      {/* HEADER SECTION */}
      <div className="annexure-header">
        {/* Logo Section */}
        <div className="annexure-header-logo">
          <div className="annexure-logo-placeholder">
            {headerData.logoText || 'RITES'}
          </div>
          <div className="annexure-company-name">
            {headerData.companyName || 'RITES LTD'}
          </div>
          <div className="annexure-division">
            {headerData.division || '(QA DIVISION)'}
          </div>
        </div>

        {/* Title Section */}
        <div className="annexure-header-title">
          <div className="annexure-main-title">
            {headerData.mainTitle || 'INSPECTION & TEST PLAN'}
          </div>
          <div className="annexure-product-name">
            {headerData.productName || 'ELASTIC RAIL CLIP MK-III/MK-V'}
          </div>
        </div>

        {/* Document Info Section */}
        <div className="annexure-header-info">
          <div className="annexure-info-row">
            <span className="annexure-info-label">DOC. NO:</span>
            <span className="annexure-info-value">{headerData.docNo || 'QA/WR/MECH'}</span>
          </div>
          <div className="annexure-info-row">
            <span className="annexure-info-label">ISSUE NO:</span>
            <span className="annexure-info-value">{headerData.issueNo || ''}</span>
          </div>
          <div className="annexure-info-row">
            <span className="annexure-info-label">PAGE NO:</span>
            <span className="annexure-info-value">{headerData.pageNo || '9 of 18'}</span>
          </div>
          <div className="annexure-info-row">
            <span className="annexure-info-label">EFFECTIVE DATE:</span>
            <span className="annexure-info-value">{headerData.effectiveDate || ''}</span>
          </div>
          <div className="annexure-info-row">
            <span className="annexure-info-label">PREPARED BY:</span>
            <span className="annexure-info-value">{headerData.preparedBy || 'KEM'}</span>
          </div>
          <div className="annexure-info-row">
            <span className="annexure-info-label">CHECKED BY:</span>
            <span className="annexure-info-value">{headerData.checkedBy || 'CSR'}</span>
          </div>
          <div className="annexure-info-row">
            <span className="annexure-info-label">APPROVED BY:</span>
            <span className="annexure-info-value">{headerData.approvedBy || 'GM(I)/WR'}</span>
          </div>
        </div>
      </div>

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

