/**
 * Pending Billing Tab Component
 * Section 2: Inspection Calls Pending Billing
 */

import React, { useState } from 'react';
import DataTable from '../../../components/DataTable';
import { formatDateTime, formatCurrency, getBillStatusBadge, getSLAStatus } from '../utils/helpers';
import { BILL_STATUS } from '../utils/constants';
import PaymentHistoryModal from './PaymentHistoryModal';

const PendingBillingTab = ({ billingRecords = [], kpis = {}, onGenerateBill }) => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showGenerateBillModal, setShowGenerateBillModal] = useState(false);
  const [showBillingDetailsModal, setShowBillingDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [billAmount, setBillAmount] = useState('');

  // KPI Tiles
  const kpiTiles = [
    {
      label: 'Total Pending Billing',
      value: kpis.count || 0,
      icon: '📄',
      color: '#f59e0b'
    },
    {
      label: 'Total Amount',
      value: formatCurrency(kpis.amount || 0),
      icon: '💰',
      color: '#3b82f6'
    },
    {
      label: 'Under Suspense',
      value: kpis.underSuspense || 0,
      icon: '⚠️',
      color: '#dc2626'
    }
  ];

  // Table columns
  const columns = [
    {
      key: 'callNumber',
      label: 'Call Number',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'vendor',
      label: 'Vendor Name',
      sortable: true,
      render: (value) => value?.name || '-'
    },
    {
      key: 'poNumber',
      label: 'PO Number',
      sortable: true
    },
    {
      key: 'productType',
      label: 'Product Type',
      sortable: true
    },
    {
      key: 'icNumber',
      label: 'IC Number',
      sortable: true
    },
    {
      key: 'icIssuedDate',
      label: 'IC Issued Date',
      sortable: true,
      render: (value) => formatDateTime(value)
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (value) => formatCurrency(value)
    },
    {
      key: 'billStatus',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const badge = getBillStatusBadge(value);
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: badge.bgColor,
              color: badge.color,
              border: `1px solid ${badge.borderColor}`
            }}
          >
            {badge.label}
          </span>
        );
      }
    },
    {
      key: 'sla',
      label: 'SLA Status',
      render: (_, row) => {
        // Show "Suspended" for ADVANCE_SUSPENSE status
        if (row.billStatus === BILL_STATUS.ADVANCE_SUSPENSE) {
          return <span style={{ color: '#dc2626', fontWeight: '500' }}>Suspended</span>;
        }
        const slaStatus = getSLAStatus(row.icIssuedDate, 'BILL_GENERATION');
        return (
          <span style={{ color: slaStatus.color, fontWeight: '500' }}>
            {slaStatus.status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="action-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* View History button - shown for all statuses */}
          <button
            className="btn btn-sm btn-info"
            onClick={() => handleViewHistoryClick(row)}
            title="View Payment History"
            style={{ backgroundColor: '#6366f1', color: 'white', border: '1px solid #4f46e5' }}
          >
            📋 View History
          </button>

          {/* View Billing Details button - shown for all statuses */}
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => handleViewBillingDetailsClick(row)}
            title="View Billing Details"
          >
            👁️ View Details
          </button>

          {/* Generate Bill button - shown for all three statuses */}
          {/* IC_ISSUED & REJECTED → Pending Payment section */}
          {/* ADVANCE_SUSPENSE → Bills Cleared section (advance payment already received) */}
          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleGenerateBillClick(row)}
            title={row.billStatus === BILL_STATUS.ADVANCE_SUSPENSE
              ? "Generate Bill (will be auto-cleared)"
              : "Generate Bill (moves to Pending Payment)"}
          >
            📄 Generate Bill
          </button>
        </div>
      )
    }
  ];

  const handleViewHistoryClick = (record) => {
    setSelectedRecord(record);
    setShowHistoryModal(true);
  };

  const handleViewBillingDetailsClick = (record) => {
    setSelectedRecord(record);
    setShowBillingDetailsModal(true);
  };

  const handleGenerateBillClick = (record) => {
    setSelectedRecord(record);
    setBillAmount(record.totalAmount?.toString() || '');
    setShowGenerateBillModal(true);
  };

  const handleGenerateBillSubmit = () => {
    if (selectedRecord && billAmount && parseFloat(billAmount) > 0) {
      onGenerateBill(selectedRecord, {
        billAmount: parseFloat(billAmount)
      });
      setShowGenerateBillModal(false);
      setSelectedRecord(null);
      setBillAmount('');
    } else {
      alert('Please enter a valid bill amount');
    }
  };

  return (
    <div className="tab-content">
      {/* KPI Tiles */}
      <div className="kpi-grid">
        {kpiTiles.map((kpi, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className="stat-content">
              <div className="stat-label">{kpi.label}</div>
              <div className="stat-value" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Message */}
      <div className="info-message" style={{ marginBottom: '16px' }}>
        <span className="info-icon">ℹ️</span>
        <span>
          <strong>IC Issued - Billing Pending:</strong> IC issued, ready for bill generation (moves to Pending Payment).
          <strong style={{ marginLeft: '12px' }}>Rejected - Billing Pending:</strong> Rejected calls requiring billing for rejection charges (moves to Pending Payment).
          <strong style={{ marginLeft: '12px' }}>Advance - Suspense:</strong> Advance payment received, generate bill to auto-clear (moves directly to Bills Cleared).
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={billingRecords}
        emptyMessage="No pending billing records found"
      />

      {/* View Billing Details Modal */}
      {showBillingDetailsModal && (
        <div className="modal-overlay" onClick={() => setShowBillingDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Billing Details</h3>
              <button className="modal-close" onClick={() => setShowBillingDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h4 style={{ marginBottom: '12px', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>Call Information</h4>
                <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <strong>Call Number:</strong>
                    <p>{selectedRecord?.callNumber}</p>
                  </div>
                  <div>
                    <strong>IC Number:</strong>
                    <p>{selectedRecord?.icNumber}</p>
                  </div>
                  <div>
                    <strong>PO Number:</strong>
                    <p>{selectedRecord?.poNumber}</p>
                  </div>
                  <div>
                    <strong>Product Type:</strong>
                    <p>{selectedRecord?.productType}</p>
                  </div>
                  <div>
                    <strong>Inspection Stage:</strong>
                    <p>{selectedRecord?.stage}</p>
                  </div>
                  <div>
                    <strong>IC Issued Date:</strong>
                    <p>{formatDateTime(selectedRecord?.icIssuedDate)}</p>
                  </div>
                </div>

                <h4 style={{ marginBottom: '12px', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>Vendor Information</h4>
                <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <strong>Vendor Name:</strong>
                    <p>{selectedRecord?.vendor?.name}</p>
                  </div>
                  <div>
                    <strong>Vendor ID:</strong>
                    <p>{selectedRecord?.vendor?.id}</p>
                  </div>
                </div>

                <h4 style={{ marginBottom: '12px', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>Billing Amounts</h4>
                <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <strong>Inspection Amount:</strong>
                    <p style={{ color: '#059669', fontWeight: '600' }}>{formatCurrency(selectedRecord?.inspectionAmount)}</p>
                  </div>
                  <div>
                    <strong>Testing Amount:</strong>
                    <p style={{ color: '#059669', fontWeight: '600' }}>{formatCurrency(selectedRecord?.testingAmount)}</p>
                  </div>
                  <div>
                    <strong>Total Amount:</strong>
                    <p style={{ color: '#dc2626', fontWeight: '700', fontSize: '18px' }}>{formatCurrency(selectedRecord?.totalAmount)}</p>
                  </div>
                </div>

                <h4 style={{ marginBottom: '12px', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>Status Information</h4>
                <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <strong>Bill Status:</strong>
                    <p>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getBillStatusBadge(selectedRecord?.billStatus).bgColor,
                          color: getBillStatusBadge(selectedRecord?.billStatus).color,
                          border: `1px solid ${getBillStatusBadge(selectedRecord?.billStatus).borderColor}`,
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {getBillStatusBadge(selectedRecord?.billStatus).label}
                      </span>
                    </p>
                  </div>
                  <div>
                    <strong>Assigned To:</strong>
                    <p>{selectedRecord?.assignedTo}</p>
                  </div>
                  <div>
                    <strong>SLA Status:</strong>
                    <p>
                      {selectedRecord?.billStatus === BILL_STATUS.ADVANCE_SUSPENSE ? (
                        <span style={{ color: '#dc2626', fontWeight: '500' }}>Suspended</span>
                      ) : (
                        <span style={{ color: getSLAStatus(selectedRecord?.icIssuedDate, 'BILL_GENERATION').color, fontWeight: '500' }}>
                          {getSLAStatus(selectedRecord?.icIssuedDate, 'BILL_GENERATION').status}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {selectedRecord?.billStatus === BILL_STATUS.ADVANCE_SUSPENSE && selectedRecord?.suspenseReason && (
                  <>
                    <h4 style={{ marginBottom: '12px', color: '#dc2626', fontSize: '16px', fontWeight: '600' }}>Suspense Information</h4>
                    <div className="alert alert-warning" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', padding: '12px', borderRadius: '6px' }}>
                      <p><strong>Suspense Reason:</strong></p>
                      <p>{selectedRecord?.suspenseReason}</p>
                      {selectedRecord?.suspenseDate && (
                        <p style={{ marginTop: '8px' }}><strong>Suspense Date:</strong> {formatDateTime(selectedRecord?.suspenseDate)}</p>
                      )}
                    </div>
                  </>
                )}

                {selectedRecord?.remarks && (
                  <>
                    <h4 style={{ marginBottom: '12px', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>Remarks</h4>
                    <div className="alert alert-info" style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6', padding: '12px', borderRadius: '6px' }}>
                      <p>{selectedRecord?.remarks}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBillingDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      {showGenerateBillModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateBillModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Bill</h3>
              <button className="modal-close" onClick={() => setShowGenerateBillModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Show special notice for ADVANCE_SUSPENSE status */}
              {selectedRecord?.billStatus === BILL_STATUS.ADVANCE_SUSPENSE && (
                <div className="alert alert-success" style={{ marginBottom: '16px', backgroundColor: '#dcfce7', border: '1px solid #22c55e', padding: '12px', borderRadius: '6px' }}>
                  <p style={{ margin: 0, color: '#166534', fontWeight: '600' }}>
                    ✅ <strong>Advance Payment Received</strong>
                  </p>
                  <p style={{ margin: '8px 0 0 0', color: '#166534', fontSize: '14px' }}>
                    This bill will be automatically cleared after generation since advance payment has already been received.
                  </p>
                </div>
              )}

              <p><strong>Call Number:</strong> {selectedRecord?.callNumber}</p>
              <p><strong>IC Number:</strong> {selectedRecord?.icNumber}</p>
              <p><strong>Vendor:</strong> {selectedRecord?.vendor?.name}</p>
              <p><strong>PO Number:</strong> {selectedRecord?.poNumber}</p>
              <p><strong>Status:</strong> {' '}
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getBillStatusBadge(selectedRecord?.billStatus).bgColor,
                    color: getBillStatusBadge(selectedRecord?.billStatus).color,
                    border: `1px solid ${getBillStatusBadge(selectedRecord?.billStatus).borderColor}`,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {getBillStatusBadge(selectedRecord?.billStatus).label}
                </span>
              </p>

              <div className="details-grid" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div>
                  <strong>Inspection Amount:</strong>
                  <p>{formatCurrency(selectedRecord?.inspectionAmount)}</p>
                </div>
                <div>
                  <strong>Testing Amount:</strong>
                  <p>{formatCurrency(selectedRecord?.testingAmount)}</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Bill Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="Enter bill amount"
                  min="0"
                  step="0.01"
                  required
                />
                <small className="form-text">GST (18%) will be calculated automatically</small>
              </div>

              {billAmount && parseFloat(billAmount) > 0 && (
                <div className="alert alert-info" style={{ marginTop: '12px' }}>
                  <p><strong>Bill Amount:</strong> {formatCurrency(parseFloat(billAmount))}</p>
                  <p><strong>GST (18%):</strong> {formatCurrency(parseFloat(billAmount) * 0.18)}</p>
                  <p><strong>Total Amount:</strong> {formatCurrency(parseFloat(billAmount) * 1.18)}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGenerateBillModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerateBillSubmit}>
                {selectedRecord?.billStatus === BILL_STATUS.ADVANCE_SUSPENSE
                  ? 'Generate & Clear Bill'
                  : 'Generate Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      <PaymentHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        record={selectedRecord}
      />
    </div>
  );
};

export default PendingBillingTab;

