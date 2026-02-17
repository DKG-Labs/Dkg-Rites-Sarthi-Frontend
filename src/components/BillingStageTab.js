import React, { useState, useMemo } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import { createStageValidationHandler } from '../utils/stageValidation';
import { BILLING_STATUS } from '../services/billingService';
import './BillingStageTab.css';

const BillingStageTab = ({
  calls,
  onRaiseBill,
  onUpdateStatus,
  onApprovePayment
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectionError, setSelectionError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter calls that are in billing stage (IC issued but payment not done)
  const billingCalls = useMemo(() => {
    return calls.filter(c =>
      c.ic_issued === true &&
      c.billing_status &&
      c.billing_status !== BILLING_STATUS.PAYMENT_DONE
    );
  }, [calls]);

  // Apply filters
  const filteredCalls = useMemo(() => {
    let result = [...billingCalls];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(call => call.billing_status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(call =>
        call.call_no?.toLowerCase().includes(term) ||
        call.po_no?.toLowerCase().includes(term) ||
        call.vendor_name?.toLowerCase().includes(term) ||
        call.bill_no?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [billingCalls, statusFilter, searchTerm]);

  // Handler to validate selection
  const handleSelectionChange = createStageValidationHandler(
    filteredCalls,
    selectedRows,
    setSelectedRows,
    setSelectionError
  );

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const columns = [
    { key: 'call_no', label: 'Call No.' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'product_type', label: 'Product Type', render: (val) => getProductTypeDisplayName(val) },
    { key: 'ic_date', label: 'IC Date', render: (val) => formatDate(val) },
    { key: 'bill_no', label: 'Bill No.', render: (val) => val || '-' },
    { key: 'bill_amount', label: 'Bill Amount', render: (val) => formatCurrency(val) },
    { key: 'billing_status', label: 'Billing Status', render: (val) => <StatusBadge status={val} /> },
  ];

  // Get status counts for summary
  const statusCounts = useMemo(() => {
    return {
      total: billingCalls.length,
      billingPending: billingCalls.filter(c => c.billing_status === BILLING_STATUS.BILLING_PENDING).length,
      billRaised: billingCalls.filter(c => c.billing_status === BILLING_STATUS.BILL_RAISED).length,
      paymentPending: billingCalls.filter(c => c.billing_status === BILLING_STATUS.PAYMENT_PENDING).length,
      underSuspense: billingCalls.filter(c => c.billing_status === BILLING_STATUS.UNDER_SUSPENSE).length,
    };
  }, [billingCalls]);

  // Actions based on selected row's status
  const getRowActions = (row) => {
    if (!selectedRows.includes(row.id)) return null;

    const actions = [];

    if (row.billing_status === BILLING_STATUS.BILLING_PENDING) {
      actions.push(
        <button key="raise" className="btn btn-sm btn-primary" onClick={() => onRaiseBill?.(row)}>
          RAISE BILL
        </button>
      );
    }

    if (row.billing_status === BILLING_STATUS.BILL_RAISED) {
      actions.push(
        <button key="pending" className="btn btn-sm btn-secondary" onClick={() => onUpdateStatus?.(row, BILLING_STATUS.PAYMENT_PENDING)}>
          MARK PAYMENT PENDING
        </button>
      );
    }

    if (row.billing_status === BILLING_STATUS.PAYMENT_PENDING) {
      actions.push(
        <button key="approve" className="btn btn-sm btn-success" onClick={() => onApprovePayment?.(row)}>
          APPROVE PAYMENT
        </button>
      );
    }

    if (row.billing_status === BILLING_STATUS.UNDER_SUSPENSE) {
      actions.push(
        <button key="map" className="btn btn-sm btn-primary" onClick={() => onRaiseBill?.(row)}>
          RAISE & MAP BILL
        </button>
      );
    }

    return actions.length > 0 ? (
      <div className="billing-actions">{actions}</div>
    ) : null;
  };

  return (
    <div className="billing-stage-tab">
      {/* Summary Cards */}
      <div className="billing-summary">
        <div className={`summary-card summary-total ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
          <span className="summary-count">{statusCounts.total}</span>
          <span className="summary-label">Total</span>
        </div>
        <div className={`summary-card summary-pending ${statusFilter === BILLING_STATUS.BILLING_PENDING ? 'active' : ''}`} onClick={() => setStatusFilter(BILLING_STATUS.BILLING_PENDING)}>
          <span className="summary-count">{statusCounts.billingPending}</span>
          <span className="summary-label">Billing Pending</span>
        </div>
        <div className={`summary-card summary-raised ${statusFilter === BILLING_STATUS.BILL_RAISED ? 'active' : ''}`} onClick={() => setStatusFilter(BILLING_STATUS.BILL_RAISED)}>
          <span className="summary-count">{statusCounts.billRaised}</span>
          <span className="summary-label">Bill Raised</span>
        </div>
        <div className={`summary-card summary-payment ${statusFilter === BILLING_STATUS.PAYMENT_PENDING ? 'active' : ''}`} onClick={() => setStatusFilter(BILLING_STATUS.PAYMENT_PENDING)}>
          <span className="summary-count">{statusCounts.paymentPending}</span>
          <span className="summary-label">Payment Pending</span>
        </div>
        <div className={`summary-card summary-suspense ${statusFilter === BILLING_STATUS.UNDER_SUSPENSE ? 'active' : ''}`} onClick={() => setStatusFilter(BILLING_STATUS.UNDER_SUSPENSE)}>
          <span className="summary-count">{statusCounts.underSuspense}</span>
          <span className="summary-label">Under Suspense</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="billing-filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by Call No., PO No., Vendor, Bill No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {statusFilter !== 'all' && (
          <button className="btn btn-sm btn-outline" onClick={() => setStatusFilter('all')}>
            Clear Filter
          </button>
        )}
      </div>

      {/* Error Notification */}
      {selectionError && (
        <Notification
          message={selectionError}
          type="error"
          autoClose={true}
          autoCloseDelay={5000}
          onClose={() => setSelectionError('')}
        />
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCalls}
        selectable={true}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        emptyMessage="No calls in billing stage"
        rowActions={getRowActions}
        initialPageSize={10}
        hidePageSize={true}
      />
    </div>
  );
};

export default BillingStageTab;

