/**
 * CM Module Constants
 * Centralized constants for the Controlling Manager Module
 */

// Call Status Constants
export const CALL_STATUS = {
  ASSIGNED: 'assigned',
  SCHEDULED: 'scheduled',
  UNDER_INSPECTION: 'under_inspection',
  IC_PENDING: 'ic_pending',
  BILLING_PENDING: 'billing_pending',
  PAYMENT_PENDING: 'payment_pending',
  DISPOSED: 'disposed'
};

// Call Status Display Configuration
export const CALL_STATUS_CONFIG = {
  [CALL_STATUS.ASSIGNED]: {
    label: 'Assigned',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.25)'
  },
  [CALL_STATUS.SCHEDULED]: {
    label: 'Scheduled',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.25)'
  },
  [CALL_STATUS.UNDER_INSPECTION]: {
    label: 'Under Inspection',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.25)'
  },
  [CALL_STATUS.IC_PENDING]: {
    label: 'IC Pending',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.25)'
  },
  [CALL_STATUS.BILLING_PENDING]: {
    label: 'Billing Pending',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.25)'
  },
  [CALL_STATUS.PAYMENT_PENDING]: {
    label: 'Payment Pending',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.25)'
  },
  [CALL_STATUS.DISPOSED]: {
    label: 'Disposed',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.25)'
  }
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

// Approval Trigger Type Constants
export const APPROVAL_TYPE = {
  QUANTITY_ENHANCEMENT: 'quantity_enhancement',
  RESCHEDULING: 'rescheduling',
  DISCREPANCY: 'discrepancy',
  WITHHOLDING: 'withholding'
};

// Approval Trigger Display Configuration
export const APPROVAL_TYPES = {
  quantity_enhancement: {
    label: 'Quantity Enhancement',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.25)'
  },
  rescheduling: {
    label: 'Rescheduling',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.25)'
  },
  discrepancy: {
    label: 'Discrepancy',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.25)'
  },
  withholding: {
    label: 'Withholding',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.25)'
  }
};

// Alert Types
export const ALERT_TYPES = {
  SLA_BREACH: 'sla_breach',
  IC_PENDING: 'ic_pending',
  OVERLOADED_IE: 'overloaded_ie',
  REPEATED_RECTIFICATION: 'repeated_rectification',
  HIGH_REJECTION: 'high_rejection'
};

// Alert Priority Levels
export const ALERT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Workload Thresholds
export const WORKLOAD_THRESHOLDS = {
  LOW: 70,
  MEDIUM: 90,
  HIGH: 100
};

// SLA Limits (in days)
export const SLA_LIMITS = {
  INSPECTION_COMPLETION: 7,
  IC_ISSUANCE: 3,
  BILLING: 5
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

