/**
 * Payment History Modal Component
 * Displays comprehensive audit trail for billing records
 */

import React from 'react';
import { formatDateTime, formatCurrency } from '../utils/helpers';

const PaymentHistoryModal = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  // Get payment history from record
  const history = record.paymentHistory || [];

  // Action type configuration for display
  const actionConfig = {
    ADVANCE_PAYMENT_RECEIVED: {
      icon: '💰',
      label: 'Advance Payment Received',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    IC_ISSUED: {
      icon: '📋',
      label: 'Inspection Certificate Issued',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    CALL_REJECTED: {
      icon: '❌',
      label: 'Call Rejected',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    BILL_GENERATED: {
      icon: '📄',
      label: 'Bill Generated',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    PAYMENT_RECORDED: {
      icon: '💳',
      label: 'Payment Recorded',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    BILL_CLEARED: {
      icon: '✅',
      label: 'Bill Cleared',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)'
    },
    STATUS_CHANGED: {
      icon: '🔄',
      label: 'Status Changed',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3 className="modal-title">📋 Payment History</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Record Summary */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Call Number:</strong>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#1f2937' }}>{record.callNumber}</p>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Vendor:</strong>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#1f2937' }}>{record.vendor?.name}</p>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Total Amount:</strong>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#dc2626' }}>{formatCurrency(record.totalAmount)}</p>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>PO Number:</strong>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#1f2937' }}>{record.poNumber}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative' }}>
            <h4 style={{ marginBottom: '16px', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
              Transaction Timeline
            </h4>

            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                <p>No payment history available</p>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '32px' }}>
                {/* Timeline line */}
                <div style={{
                  position: 'absolute',
                  left: '11px',
                  top: '8px',
                  bottom: '8px',
                  width: '2px',
                  backgroundColor: '#e5e7eb'
                }} />

                {/* Timeline items */}
                {history.map((item, index) => {
                  const config = actionConfig[item.action] || actionConfig.STATUS_CHANGED;
                  return (
                    <div key={index} style={{ position: 'relative', marginBottom: '24px' }}>
                      {/* Timeline dot */}
                      <div style={{
                        position: 'absolute',
                        left: '-32px',
                        top: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        border: '3px solid white',
                        boxShadow: '0 0 0 1px #e5e7eb'
                      }}>
                        {config.icon}
                      </div>

                      {/* Timeline content */}
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: config.bgColor,
                        borderRadius: '8px',
                        border: `1px solid ${config.color}33`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <strong style={{ color: config.color, fontSize: '15px' }}>{config.label}</strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                              {formatDateTime(item.timestamp)}
                            </p>
                          </div>
                          {item.amount && (
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: '#1f2937', fontSize: '16px' }}>
                                {formatCurrency(item.amount)}
                              </strong>
                            </div>
                          )}
                        </div>

                        {item.description && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#374151' }}>
                            {item.description}
                          </p>
                        )}

                        {item.performedBy && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                            By: {item.performedBy}
                          </p>
                        )}

                        {item.billNumber && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                            Bill Number: <strong>{item.billNumber}</strong>
                          </p>
                        )}

                        {item.paymentReference && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                            Payment Reference: <strong>{item.paymentReference}</strong>
                          </p>
                        )}

                        {item.status && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                            Status: <span style={{
                              padding: '2px 8px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {item.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryModal;


