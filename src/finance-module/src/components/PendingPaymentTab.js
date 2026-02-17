/**
 * Pending Payment Tab Component
 * Section 3: Pending Payment - Bills Generated Awaiting Payment
 */

import React, { useState } from 'react';
import DataTable from '../../../components/DataTable';
import { formatDateTime, formatCurrency, getBillStatusBadge } from '../utils/helpers';
import { BILL_STATUS } from '../utils/constants';
import PaymentHistoryModal from './PaymentHistoryModal';

const PendingPaymentTab = ({ bills = [], kpis = {}, onRecordPayment, onClearBill }) => {
  const [selectedBill, setSelectedBill] = useState(null);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentDate: '',
    paymentReference: '',
    paymentMode: 'NEFT'
  });

  // KPI Tiles
  const kpiTiles = [
    {
      label: 'Total Pending Payment',
      value: kpis.count || 0,
      icon: '📋',
      color: '#3b82f6'
    },
    {
      label: 'Total Amount',
      value: formatCurrency(kpis.amount || 0),
      icon: '💰',
      color: '#f59e0b'
    },
    {
      label: 'Payment Pending',
      value: kpis.paymentPending || 0,
      icon: '⏳',
      color: '#f97316'
    }
  ];

  // Table columns
  const columns = [
    {
      key: 'billNumber',
      label: 'Bill Number',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'callNumber',
      label: 'Call Number',
      sortable: true
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
      key: 'billDate',
      label: 'Bill Date',
      sortable: true,
      render: (value) => formatDateTime(value)
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
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
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="action-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* View History button - shown for all bills */}
          <button
            className="btn btn-sm btn-info"
            onClick={() => handleViewHistoryClick(row)}
            title="View Payment History"
            style={{ backgroundColor: '#6366f1', color: 'white', border: '1px solid #4f46e5' }}
          >
            📋 View History
          </button>

          {row.billStatus === BILL_STATUS.PAYMENT_PENDING && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleRecordPaymentClick(row)}
              title="Record Payment"
            >
              💳 Record Payment
            </button>
          )}
          {row.billStatus === BILL_STATUS.PAYMENT_RECORDED && (
            <button
              className="btn btn-sm btn-success"
              onClick={() => onClearBill(row)}
              title="Mark as Cleared"
            >
              ✅ Mark Cleared
            </button>
          )}
        </div>
      )
    }
  ];

  const handleViewHistoryClick = (bill) => {
    setSelectedBill(bill);
    setShowHistoryModal(true);
  };

  const handleRecordPaymentClick = (bill) => {
    setSelectedBill(bill);
    setPaymentData({
      paymentDate: new Date().toISOString().split('T')[0],
      paymentReference: '',
      paymentMode: 'NEFT'
    });
    setShowRecordPaymentModal(true);
  };

  const handleRecordPaymentSubmit = () => {
    if (selectedBill && paymentData.paymentReference && paymentData.paymentDate) {
      onRecordPayment(selectedBill, paymentData);
      setShowRecordPaymentModal(false);
      setSelectedBill(null);
      setPaymentData({ paymentDate: '', paymentReference: '', paymentMode: 'NEFT' });
    } else {
      alert('Please fill all required fields');
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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={bills}
        emptyMessage="No pending payments found"
      />

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowRecordPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Payment</h3>
              <button className="modal-close" onClick={() => setShowRecordPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Bill Number:</strong> {selectedBill?.billNumber}</p>
              <p><strong>Vendor:</strong> {selectedBill?.vendor?.name}</p>
              <p><strong>Total Amount:</strong> {formatCurrency(selectedBill?.totalAmount)}</p>

              <div className="form-group">
                <label className="form-label required">Payment Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Payment Reference (UTR/Transaction ID)</label>
                <input
                  type="text"
                  className="form-control"
                  value={paymentData.paymentReference}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                  placeholder="Enter UTR or transaction reference"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Payment Mode</label>
                <select
                  className="form-control"
                  value={paymentData.paymentMode}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                >
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="IMPS">IMPS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="DD">Demand Draft</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRecordPaymentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRecordPaymentSubmit}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      <PaymentHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        record={selectedBill}
      />
    </div>
  );
};

export default PendingPaymentTab;

