/**
 * Approve Payment Modal Component
 * Displays comprehensive payment details for finance approval
 */

import React from 'react';
import { formatDateTime, formatCurrency, getPaymentStatusBadge, getSLAStatus } from '../utils/helpers';

const ApprovePaymentModal = ({ 
  payment, 
  remarks, 
  setRemarks, 
  onApprove, 
  onClose 
}) => {
  if (!payment) return null;

  const handleApprove = () => {
    onApprove(payment, remarks);
  };

  const slaStatus = getSLAStatus(payment.submissionDate, 'PAYMENT_APPROVAL');
  const statusBadge = getPaymentStatusBadge(payment.paymentStatus);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">Approve Payment</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Payment Details Section */}
          <div className="payment-details-section">
            <h4 className="section-title">Payment Details</h4>
            
            <div className="details-grid">
              {/* Row 1 */}
              <div className="detail-item">
                <label className="detail-label">Call Number</label>
                <div className="detail-value">{payment.callNumber}</div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">PO Number</label>
                <div className="detail-value">{payment.poNumber}</div>
              </div>

              {/* Row 2 */}
              <div className="detail-item">
                <label className="detail-label">Vendor Name</label>
                <div className="detail-value">{payment.vendor?.name}</div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">Vendor ID</label>
                <div className="detail-value">{payment.vendor?.id}</div>
              </div>

              {/* Row 3 */}
              <div className="detail-item">
                <label className="detail-label">Payment Type</label>
                <div className="detail-value payment-type">
                  {payment.paymentType?.replace(/_/g, ' ').toUpperCase()}
                </div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">Payment Amount</label>
                <div className="detail-value amount-highlight">
                  {formatCurrency(payment.amount)}
                </div>
              </div>

              {/* Row 4 */}
              <div className="detail-item">
                <label className="detail-label">Product Type</label>
                <div className="detail-value">{payment.productType}</div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">Inspection Stage</label>
                <div className="detail-value">{payment.stage}</div>
              </div>

              {/* Row 5 */}
              <div className="detail-item">
                <label className="detail-label">Submission Date</label>
                <div className="detail-value">{formatDateTime(payment.submissionDate)}</div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">Submitted By</label>
                <div className="detail-value">{payment.submittedBy}</div>
              </div>

              {/* Row 6 */}
              <div className="detail-item">
                <label className="detail-label">Payment Status</label>
                <div className="detail-value">
                  <span 
                    className="status-badge"
                    style={{
                      backgroundColor: statusBadge.bgColor,
                      color: statusBadge.color,
                      border: `1px solid ${statusBadge.borderColor}`,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    {statusBadge.label}
                  </span>
                </div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">SLA Status</label>
                <div className="detail-value">
                  <span style={{ color: slaStatus.color, fontWeight: '500' }}>
                    {slaStatus.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Remarks/Description */}
            {payment.remarks && (
              <div className="detail-item full-width" style={{ marginTop: '16px' }}>
                <label className="detail-label">Remarks/Description</label>
                <div className="detail-value remarks-box">
                  {payment.remarks}
                </div>
              </div>
            )}

            {/* Previous Return Information (if applicable) */}
            {payment.returnReason && (
              <div className="detail-item full-width" style={{ marginTop: '16px' }}>
                <label className="detail-label" style={{ color: '#ef4444' }}>Previous Return Reason</label>
                <div className="detail-value return-reason-box">
                  {payment.returnReason}
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                  Returned by: {payment.returnedBy} on {formatDateTime(payment.returnedDate)}
                </div>
              </div>
            )}

            {/* Original Submission Date (for resubmitted payments) */}
            {payment.originalSubmissionDate && (
              <div className="detail-item full-width" style={{ marginTop: '16px' }}>
                <label className="detail-label">Original Submission Date</label>
                <div className="detail-value">
                  {formatDateTime(payment.originalSubmissionDate)}
                  <span style={{ marginLeft: '12px', fontSize: '13px', color: '#6b7280' }}>
                    (Resubmitted on {formatDateTime(payment.submissionDate)})
                  </span>
                </div>
              </div>
            )}

            {/* Attached Documents */}
            {payment.documents && payment.documents.length > 0 && (
              <div className="detail-item full-width" style={{ marginTop: '16px' }}>
                <label className="detail-label">Attached Documents</label>
                <div className="documents-list">
                  {payment.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <span className="document-icon">📄</span>
                      <span className="document-name">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Approval Remarks Section */}
          <div className="approval-remarks-section" style={{ marginTop: '24px' }}>
            <h4 className="section-title">Approval Remarks</h4>
            <div className="form-group">
              <label className="form-label">Remarks (Optional)</label>
              <textarea
                className="form-control"
                rows="4"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any approval comments or remarks..."
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={handleApprove}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ✅ Approve Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovePaymentModal;

