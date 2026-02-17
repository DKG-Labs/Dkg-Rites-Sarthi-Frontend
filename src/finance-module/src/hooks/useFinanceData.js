/**
 * useFinanceData Hook
 * Main data hook for Finance Module
 */

import { useState, useEffect } from 'react';
import {
  MOCK_PENDING_PAYMENTS,
  MOCK_PENDING_BILLING,
  MOCK_BILLS_GENERATED,
  MOCK_BILLS_CLEARED,
  MOCK_AUDIT_TRAIL,
  MOCK_DASHBOARD_KPIS,
  MOCK_VENDORS
} from '../utils/mockData';
// import { PAYMENT_STATUS, BILL_STATUS } from '../utils/constants'; // Not used yet - will be used for status filtering

/**
 * Custom hook for Finance data management
 */
export const useFinanceData = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingBilling, setPendingBilling] = useState([]);
  const [billsGenerated, setBillsGenerated] = useState([]);
  const [billsCleared, setBillsCleared] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [dashboardKPIs, setDashboardKPIs] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate API call to fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Set mock data
      setPendingPayments(MOCK_PENDING_PAYMENTS);
      setPendingBilling(MOCK_PENDING_BILLING);
      setBillsGenerated(MOCK_BILLS_GENERATED);
      setBillsCleared(MOCK_BILLS_CLEARED);
      setAuditTrail(MOCK_AUDIT_TRAIL);
      setDashboardKPIs(MOCK_DASHBOARD_KPIS);
      setVendors(MOCK_VENDORS);

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Get payment by ID
  const getPaymentById = (paymentId) => {
    return pendingPayments.find(payment => payment.id === paymentId);
  };

  // Get billing record by ID
  const getBillingById = (billingId) => {
    return pendingBilling.find(billing => billing.id === billingId);
  };

  // Get bill by ID
  const getBillById = (billId) => {
    const allBills = [...billsGenerated, ...billsCleared];
    return allBills.find(bill => bill.id === billId || bill.billNumber === billId);
  };

  // Get payments by status
  const getPaymentsByStatus = (status) => {
    return pendingPayments.filter(payment => payment.paymentStatus === status);
  };

  // Get bills by status
  const getBillsByStatus = (status) => {
    const allBills = [...billsGenerated, ...billsCleared];
    return allBills.filter(bill => bill.billStatus === status);
  };

  // Get audit trail by call number
  const getAuditTrailByCallNumber = (callNumber) => {
    return auditTrail.filter(entry => entry.callNumber === callNumber);
  };

  // Get vendor by ID
  const getVendorById = (vendorId) => {
    return vendors.find(vendor => vendor.id === vendorId);
  };

  // Refresh data
  const refreshData = () => {
    fetchData();
  };

  return {
    // Data
    pendingPayments,
    pendingBilling,
    billsGenerated,
    billsCleared,
    auditTrail,
    dashboardKPIs,
    vendors,
    
    // State
    loading,
    error,
    
    // Functions
    getPaymentById,
    getBillingById,
    getBillById,
    getPaymentsByStatus,
    getBillsByStatus,
    getAuditTrailByCallNumber,
    getVendorById,
    refreshData
  };
};

export default useFinanceData;

