/**
 * Call Details Modal Component
 * Displays comprehensive call information in three sections:
 * 1. PO Details
 * 2. Inspection Call Details
 * 3. Sub PO Details
 *
 * Updated: 2025-01-01 - Added verification action buttons
 */

import React from 'react';
import { formatDateTime, formatDate } from '../utils/helpers';

const CallDetailsModal = ({
  isOpen,
  onClose,
  call,
  onVerifyAccept
}) => {
  if (!isOpen || !call) return null;

  // Handle action button clicks
  const handleVerifyAccept = () => {
    if (onVerifyAccept) {
      onVerifyAccept(call);
    }
  };

  // Helper to display value or fallback
  const displayValue = (value, fallback = '-') => {
    return value || fallback;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Call Details - {call.callNumber}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* Section 1: PO Details */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="section-icon">📄</span>
              PO Details
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>PO Number</label>
                <span>{displayValue(call.poNumber)}</span>
              </div>
              <div className="detail-item">
                <label>PO Date</label>
                <span>{displayValue(call.poDate ? formatDate(call.poDate) : null)}</span>
              </div>
              <div className="detail-item">
                <label>PO Quantity</label>
                <span>{displayValue(call.poQuantity)}</span>
              </div>
              <div className="detail-item">
                <label>Vendor Name</label>
                <span>{displayValue(call.vendor?.name)}</span>
              </div>
              <div className="detail-item">
                <label>MA Number</label>
                <span>{displayValue(call.maNumber)}</span>
              </div>
              <div className="detail-item">
                <label>MA Date</label>
                <span>{displayValue(call.maDate ? formatDate(call.maDate) : null)}</span>
              </div>
              <div className="detail-item">
                <label>Purchasing Authority</label>
                <span>{displayValue(call.purchasingAuthority)}</span>
              </div>
              <div className="detail-item">
                <label>Bill Paying Officer</label>
                <span>{displayValue(call.billPayingOfficer)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Inspection Call Details */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="section-icon">🔍</span>
              Inspection Call Details
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>PO + Serial Number</label>
                <span>{displayValue(call.poSerialNumber)}</span>
              </div>
              <div className="detail-item">
                <label>Call Date</label>
                <span>{displayValue(call.submissionDateTime ? formatDateTime(call.submissionDateTime) : null)}</span>
              </div>
              <div className="detail-item">
                <label>Desired Date of Inspection</label>
                <span>{displayValue(call.desiredInspectionDate ? formatDate(call.desiredInspectionDate) : null)}</span>
              </div>
              <div className="detail-item">
                <label>Item Description</label>
                <span>{displayValue(call.itemDescription)}</span>
              </div>
              <div className="detail-item">
                <label>Original Delivery Date</label>
                <span>{displayValue(call.originalDeliveryDate ? formatDate(call.originalDeliveryDate) : null)}</span>
              </div>
              <div className="detail-item">
                <label>Extended Delivery Date</label>
                <span>{displayValue(call.extendedDeliveryDate ? formatDate(call.extendedDeliveryDate) : null)}</span>
              </div>
              <div className="detail-item">
                <label>Original DP Start</label>
                <span>{displayValue(call.originalDPStart ? formatDate(call.originalDPStart) : null)}</span>
              </div>
              <div className="detail-item">
                <label>Call Quantity</label>
                <span>{displayValue(call.quantity)}</span>
              </div>
              <div className="detail-item full-width">
                <label>Place of Inspection</label>
                <span>{displayValue(call.placeOfInspection)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Sub PO Details */}
          <div className="details-section">
            <h3 className="section-title">
              <span className="section-icon">📋</span>
              Sub PO Details
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <label>Sub PO Number</label>
                <span>{displayValue(call.subPoNumber)}</span>
              </div>
              <div className="detail-item">
                <label>Sub PO Date</label>
                <span>{displayValue(call.subPoDate ? formatDate(call.subPoDate) : null)}</span>
              </div>
              <div className="detail-item">
                <label>TC Number</label>
                <span>{displayValue(call.tcNumber)}</span>
              </div>
              <div className="detail-item">
                <label>TC Date</label>
                <span>{displayValue(call.tcDate ? formatDate(call.tcDate) : null)}</span>
              </div>
              <div className="detail-item">
                <label>Manufacturer of Material</label>
                <span>{displayValue(call.manufacturerOfMaterial)}</span>
              </div>
              <div className="detail-item">
                <label>Sub PO Quantity</label>
                <span>{displayValue(call.subPoQuantity)}</span>
              </div>
              <div className="detail-item">
                <label>Invoice Number</label>
                <span>{displayValue(call.invoiceNumber)}</span>
              </div>
              <div className="detail-item">
                <label>Invoice Date</label>
                <span>{displayValue(call.invoiceDate ? formatDate(call.invoiceDate) : null)}</span>
              </div>
              <div className="detail-item full-width">
                <label>Place of Inspection</label>
                <span>{displayValue(call.subPoPlaceOfInspection || call.placeOfInspection)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-success"
            onClick={handleVerifyAccept}
            title="Verify and Accept Call"
          >
            ✅ Verify & Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallDetailsModal;

