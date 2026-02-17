/**
 * Finance Module Constants
 * Centralized constants for the Finance Dashboard Module
 */

// Payment Status Constants
export const PAYMENT_STATUS = {
  PAYMENT_SUBMITTED: 'payment_submitted',
  PENDING_FINANCE_APPROVAL: 'pending_finance_approval',
  APPROVED: 'approved',
  RETURNED: 'returned',
  RESUBMITTED: 'resubmitted',
  PAYMENT_PROCESSED: 'payment_processed'
};

// Bill Status Constants
export const BILL_STATUS = {
  // Pending Billing Statuses
  IC_ISSUED_BILLING_PENDING: 'ic_issued_billing_pending',
  REJECTED_BILLING_PENDING: 'rejected_billing_pending',
  ADVANCE_SUSPENSE: 'advance_suspense',

  // Bill Generated and Payment Statuses
  BILL_GENERATED: 'bill_generated',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_RECORDED: 'payment_recorded',
  BILL_CLEARED: 'bill_cleared'
};

// Payment Types - Only three types supported
export const PAYMENT_TYPES = {
  ADVANCE_PAYMENT: 'advance_payment',
  CALL_CANCELLATION_CHARGES: 'call_cancellation_charges',
  CALL_REJECTION_CHARGES: 'call_rejection_charges'
};

// Product Types
export const PRODUCT_TYPES = {
  ERC: 'ERC',
  SLEEPER: 'Sleeper',
  GRSP: 'GRSP'
};

// Inspection Stages
export const INSPECTION_STAGES = {
  RAW_MATERIAL: 'RM',
  PROCESS: 'Process',
  FINAL: 'Final'
};

// Payment Status Display Configuration
export const PAYMENT_STATUS_CONFIG = {
  [PAYMENT_STATUS.PAYMENT_SUBMITTED]: {
    label: 'Payment Submitted',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.25)'
  },
  [PAYMENT_STATUS.PENDING_FINANCE_APPROVAL]: {
    label: 'Pending Finance Approval',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.25)'
  },
  [PAYMENT_STATUS.APPROVED]: {
    label: 'Approved',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.25)'
  },
  [PAYMENT_STATUS.RETURNED]: {
    label: 'Returned',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.25)'
  },
  [PAYMENT_STATUS.RESUBMITTED]: {
    label: 'Resubmitted',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.25)'
  },
  [PAYMENT_STATUS.PAYMENT_PROCESSED]: {
    label: 'Payment Processed',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.25)'
  }
};

// Bill Status Display Configuration
export const BILL_STATUS_CONFIG = {
  // Pending Billing Statuses
  [BILL_STATUS.IC_ISSUED_BILLING_PENDING]: {
    label: 'IC Issued - Billing Pending',
    description: 'IC issued, ready for bill generation (moves to Pending Payment section)',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.25)'
  },
  [BILL_STATUS.REJECTED_BILLING_PENDING]: {
    label: 'Rejected - Billing Pending',
    description: 'Rejected calls requiring billing for rejection charges (moves to Pending Payment section)',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.25)'
  },
  [BILL_STATUS.ADVANCE_SUSPENSE]: {
    label: 'Advance - Suspense',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: 'rgba(220, 38, 38, 0.25)'
  },

  // Bill Generated and Payment Statuses
  [BILL_STATUS.BILL_GENERATED]: {
    label: 'Bill Generated',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.25)'
  },
  [BILL_STATUS.PAYMENT_PENDING]: {
    label: 'Payment Pending',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.25)'
  },
  [BILL_STATUS.PAYMENT_RECORDED]: {
    label: 'Payment Recorded',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.25)'
  },
  [BILL_STATUS.BILL_CLEARED]: {
    label: 'Bill Cleared',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.25)'
  }
};

// SLA Definitions (in days)
export const SLA_DEFINITIONS = {
  PAYMENT_APPROVAL: 3,
  BILL_GENERATION: 2,
  PAYMENT_PROCESSING: 7
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Local Storage Keys
export const STORAGE_KEYS = {
  FINANCE_FILTERS: 'finance_module_filters',
  FINANCE_PREFERENCES: 'finance_module_preferences'
};

// Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv'
};

