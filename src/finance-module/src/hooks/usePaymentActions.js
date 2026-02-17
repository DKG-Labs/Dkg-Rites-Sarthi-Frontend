/**
 * usePaymentActions Hook
 * Hook for payment approval/return actions
 */

import { useState } from 'react';
import { PAYMENT_STATUS } from '../utils/constants';

/**
 * Custom hook for payment actions
 */
export const usePaymentActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Approve payment
   */
  const approvePayment = async (payment, remarks = '') => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // In production, this would call the backend API
      // const response = await fetch('/api/finance/approve-payment', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ paymentId: payment.id, remarks })
      // });

      console.log('Payment approved:', {
        paymentId: payment.id,
        callNumber: payment.callNumber,
        amount: payment.amount,
        remarks,
        approvedBy: 'Finance - Suresh Menon',
        approvedAt: new Date().toISOString()
      });

      setLoading(false);
      return {
        success: true,
        message: 'Payment approved successfully',
        data: {
          ...payment,
          paymentStatus: PAYMENT_STATUS.APPROVED,
          approvedBy: 'Finance - Suresh Menon',
          approvedAt: new Date().toISOString(),
          approvalRemarks: remarks
        }
      };
    } catch (err) {
      setError(err.message || 'Failed to approve payment');
      setLoading(false);
      return {
        success: false,
        message: err.message || 'Failed to approve payment'
      };
    }
  };

  /**
   * Return payment for rectification
   */
  const returnPayment = async (payment, returnReason) => {
    try {
      setLoading(true);
      setError(null);

      if (!returnReason || returnReason.trim() === '') {
        throw new Error('Return reason is mandatory');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // In production, this would call the backend API
      // const response = await fetch('/api/finance/return-payment', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ paymentId: payment.id, returnReason })
      // });

      console.log('Payment returned:', {
        paymentId: payment.id,
        callNumber: payment.callNumber,
        amount: payment.amount,
        returnReason,
        returnedBy: 'Finance - Suresh Menon',
        returnedAt: new Date().toISOString()
      });

      setLoading(false);
      return {
        success: true,
        message: 'Payment returned for rectification',
        data: {
          ...payment,
          paymentStatus: PAYMENT_STATUS.RETURNED,
          returnedBy: 'Finance - Suresh Menon',
          returnedAt: new Date().toISOString(),
          returnReason
        }
      };
    } catch (err) {
      setError(err.message || 'Failed to return payment');
      setLoading(false);
      return {
        success: false,
        message: err.message || 'Failed to return payment'
      };
    }
  };

  /**
   * View payment details
   */
  const viewPaymentDetails = (payment) => {
    return {
      ...payment,
      formattedAmount: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(payment.amount)
    };
  };

  return {
    approvePayment,
    returnPayment,
    viewPaymentDetails,
    loading,
    error
  };
};

export default usePaymentActions;

