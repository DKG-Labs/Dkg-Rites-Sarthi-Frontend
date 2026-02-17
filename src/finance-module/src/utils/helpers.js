/**
 * Finance Module Helper Functions
 * Utility functions for the Finance Dashboard Module
 */

import { PAYMENT_STATUS_CONFIG, BILL_STATUS_CONFIG, SLA_DEFINITIONS } from './constants';

/**
 * Format date to DD-MM-YYYY HH:MM format
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

/**
 * Format date to DD-MM-YYYY format
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Format amount to Indian currency format
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Calculate days difference between two dates
 */
export const calculateDaysDifference = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if SLA is breached
 */
export const isSLABreached = (submissionDate, slaType) => {
  const slaDays = SLA_DEFINITIONS[slaType];
  if (!slaDays) return false;
  
  const daysPassed = calculateDaysDifference(submissionDate);
  return daysPassed > slaDays;
};

/**
 * Get SLA status with color coding
 */
export const getSLAStatus = (submissionDate, slaType) => {
  const slaDays = SLA_DEFINITIONS[slaType];
  if (!slaDays) return { status: 'N/A', color: '#6b7280' };
  
  const daysPassed = calculateDaysDifference(submissionDate);
  const daysRemaining = slaDays - daysPassed;
  
  if (daysRemaining < 0) {
    return {
      status: `Overdue by ${Math.abs(daysRemaining)} day(s)`,
      color: '#ef4444',
      breached: true
    };
  } else if (daysRemaining === 0) {
    return {
      status: 'Due Today',
      color: '#f59e0b',
      breached: false
    };
  } else if (daysRemaining === 1) {
    return {
      status: '1 day remaining',
      color: '#f97316',
      breached: false
    };
  } else {
    return {
      status: `${daysRemaining} days remaining`,
      color: '#22c55e',
      breached: false
    };
  }
};

/**
 * Get payment status badge configuration
 */
export const getPaymentStatusBadge = (status) => {
  return PAYMENT_STATUS_CONFIG[status] || {
    label: status,
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.25)'
  };
};

/**
 * Get bill status badge configuration
 */
export const getBillStatusBadge = (status) => {
  return BILL_STATUS_CONFIG[status] || {
    label: status,
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.25)'
  };
};

/**
 * Generate unique bill number
 */
export const generateBillNumber = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BILL-${year}${month}-${random}`;
};

/**
 * Calculate total amount from line items
 */
export const calculateTotalAmount = (lineItems = []) => {
  return lineItems.reduce((total, item) => total + (item.amount || 0), 0);
};

/**
 * Validate payment data
 */
export const validatePaymentData = (paymentData) => {
  const errors = {};
  
  if (!paymentData.amount || paymentData.amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  if (!paymentData.paymentDate) {
    errors.paymentDate = 'Payment date is required';
  }
  
  if (!paymentData.paymentReference) {
    errors.paymentReference = 'Payment reference is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${formatDate(new Date())}.csv`;
  link.click();
};

