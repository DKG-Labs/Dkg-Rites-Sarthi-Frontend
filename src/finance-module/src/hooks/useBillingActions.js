/**
 * useBillingActions Hook
 * Hook for billing generation and payment recording actions
 */

import { useState } from 'react';
import { BILL_STATUS } from '../utils/constants';
import { generateBillNumber } from '../utils/helpers';

/**
 * Custom hook for billing actions
 */
export const useBillingActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate bill for inspection call
   *
   * Billing Flow Logic:
   * - ADVANCE_SUSPENSE: Bill generated → BILL_CLEARED (advance payment already received)
   * - IC_ISSUED_BILLING_PENDING: Bill generated → BILL_GENERATED (standard flow)
   * - REJECTED_BILLING_PENDING: Bill generated → BILL_GENERATED (standard flow)
   */
  const generateBill = async (inspectionCall, billData) => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const billNumber = generateBillNumber();
      const gstAmount = billData.billAmount * 0.18; // 18% GST
      const totalAmount = billData.billAmount + gstAmount;

      // Determine target status based on current billing status
      // ADVANCE_SUSPENSE calls go directly to BILL_CLEARED (advance payment already received)
      // Other statuses go to BILL_GENERATED (standard billing flow)
      const targetStatus = inspectionCall.billStatus === BILL_STATUS.ADVANCE_SUSPENSE
        ? BILL_STATUS.BILL_CLEARED
        : BILL_STATUS.BILL_GENERATED;

      const statusMessage = targetStatus === BILL_STATUS.BILL_CLEARED
        ? 'Bill generated and cleared (advance payment already received)'
        : 'Bill generated successfully';

      // In production, this would call the backend API
      // const response = await fetch('/api/finance/generate-bill', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...billData,
      //     billNumber,
      //     currentStatus: inspectionCall.billStatus,
      //     targetStatus
      //   })
      // });

      console.log('Bill generated:', {
        billNumber,
        callNumber: inspectionCall.callNumber,
        billAmount: billData.billAmount,
        gstAmount,
        totalAmount,
        currentStatus: inspectionCall.billStatus,
        targetStatus,
        statusMessage,
        generatedBy: 'Finance - Suresh Menon',
        generatedAt: new Date().toISOString()
      });

      // Create history entry for bill generation
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: 'BILL_GENERATED',
        description: targetStatus === BILL_STATUS.BILL_CLEARED
          ? 'Bill generated and automatically cleared (advance payment already received)'
          : 'Bill generated and sent to vendor',
        amount: totalAmount,
        billNumber,
        performedBy: 'Finance - Suresh Menon',
        status: targetStatus
      };

      setLoading(false);
      return {
        success: true,
        message: statusMessage,
        data: {
          billNumber,
          callNumber: inspectionCall.callNumber,
          vendor: inspectionCall.vendor,
          poNumber: inspectionCall.poNumber,
          billDate: new Date().toISOString(),
          billAmount: billData.billAmount,
          gstAmount,
          totalAmount,
          billStatus: targetStatus,
          previousStatus: inspectionCall.billStatus,
          generatedBy: 'Finance - Suresh Menon',
          generatedAt: new Date().toISOString(),
          paymentHistory: [...(inspectionCall.paymentHistory || []), historyEntry]
        }
      };
    } catch (err) {
      setError(err.message || 'Failed to generate bill');
      setLoading(false);
      return {
        success: false,
        message: err.message || 'Failed to generate bill'
      };
    }
  };

  /**
   * Record payment for a bill
   */
  const recordPayment = async (bill, paymentData) => {
    try {
      setLoading(true);
      setError(null);

      if (!paymentData.paymentReference || !paymentData.paymentDate) {
        throw new Error('Payment reference and date are required');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // In production, this would call the backend API
      // const response = await fetch('/api/finance/record-payment', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ billId: bill.id, ...paymentData })
      // });

      console.log('Payment recorded:', {
        billNumber: bill.billNumber,
        paymentReference: paymentData.paymentReference,
        paymentDate: paymentData.paymentDate,
        paymentMode: paymentData.paymentMode,
        recordedBy: 'Finance - Suresh Menon',
        recordedAt: new Date().toISOString()
      });

      // Create history entry for payment recording
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_RECORDED',
        description: `Payment received from vendor via ${paymentData.paymentMode}`,
        amount: bill.totalAmount,
        paymentReference: paymentData.paymentReference,
        performedBy: 'Finance - Suresh Menon',
        status: BILL_STATUS.PAYMENT_RECORDED
      };

      setLoading(false);
      return {
        success: true,
        message: 'Payment recorded successfully',
        data: {
          ...bill,
          billStatus: BILL_STATUS.PAYMENT_RECORDED,
          paymentDate: paymentData.paymentDate,
          paymentReference: paymentData.paymentReference,
          paymentMode: paymentData.paymentMode,
          recordedBy: 'Finance - Suresh Menon',
          recordedAt: new Date().toISOString(),
          paymentHistory: [...(bill.paymentHistory || []), historyEntry]
        }
      };
    } catch (err) {
      setError(err.message || 'Failed to record payment');
      setLoading(false);
      return {
        success: false,
        message: err.message || 'Failed to record payment'
      };
    }
  };

  /**
   * Mark bill as cleared
   */
  const clearBill = async (bill) => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));

      // In production, this would call the backend API
      // const response = await fetch('/api/finance/clear-bill', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ billId: bill.id })
      // });

      console.log('Bill cleared:', {
        billNumber: bill.billNumber,
        clearedBy: 'Finance - Suresh Menon',
        clearedAt: new Date().toISOString()
      });

      // Create history entry for bill clearing
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: 'BILL_CLEARED',
        description: 'Bill cleared and transaction completed',
        performedBy: 'Finance - Suresh Menon',
        status: BILL_STATUS.BILL_CLEARED
      };

      setLoading(false);
      return {
        success: true,
        message: 'Bill cleared successfully',
        data: {
          ...bill,
          billStatus: BILL_STATUS.BILL_CLEARED,
          clearedBy: 'Finance - Suresh Menon',
          clearedAt: new Date().toISOString(),
          paymentHistory: [...(bill.paymentHistory || []), historyEntry]
        }
      };
    } catch (err) {
      setError(err.message || 'Failed to clear bill');
      setLoading(false);
      return {
        success: false,
        message: err.message || 'Failed to clear bill'
      };
    }
  };

  return {
    generateBill,
    recordPayment,
    clearBill,
    loading,
    error
  };
};

export default useBillingActions;

