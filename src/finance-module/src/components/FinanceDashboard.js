/**
 * Finance Dashboard Component
 * Main dashboard component with 5 tabs
 */

import { useState } from 'react';
import Tabs from '../../../components/Tabs';
import VendorPaymentsTab from './VendorPaymentsTab';
import PendingBillingTab from './PendingBillingTab';
import PendingPaymentTab from './PendingPaymentTab';
import BillsClearedTab from './BillsClearedTab';
import HistoricalRecordsTab from './HistoricalRecordsTab';
import useFinanceData from '../hooks/useFinanceData';
import usePaymentActions from '../hooks/usePaymentActions';
import useBillingActions from '../hooks/useBillingActions';
import '../styles/FinanceDashboard.css';

/**
 * Finance Dashboard - Main Component
 */
const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('vendor-payments');

  // Hooks
  const {
    pendingPayments,
    pendingBilling,
    billsGenerated,
    billsCleared,
    auditTrail,
    dashboardKPIs,
    // vendors, // Not used yet - will be used for vendor filtering in future
    loading,
    error,
    refreshData
  } = useFinanceData();

  const {
    approvePayment,
    returnPayment,
    // loading: paymentActionLoading // Not used yet - will be used for loading states
  } = usePaymentActions();

  const {
    generateBill,
    recordPayment,
    clearBill,
    // loading: billingActionLoading // Not used yet - will be used for loading states
  } = useBillingActions();

  // Tab configuration
  const tabs = [
    {
      id: 'vendor-payments',
      label: 'Payment Updates by Vendor',
      count: dashboardKPIs?.pendingFinanceApproval?.count || 0
    },
    {
      id: 'pending-billing',
      label: 'Pending Billing',
      count: dashboardKPIs?.pendingBilling?.count || 0
    },
    {
      id: 'bills-generated',
      label: 'Pending Payments',
      count: dashboardKPIs?.billsGenerated?.count || 0
    },
    {
      id: 'bills-cleared',
      label: 'Bills Cleared',
      count: dashboardKPIs?.billsCleared?.count || 0
    },
    {
      id: 'historical-records',
      label: 'Historical Records',
      count: auditTrail?.length || 0
    }
  ];

  // Action handlers
  const handleApprovePayment = async (payment, remarks) => {
    const result = await approvePayment(payment, remarks);
    if (result.success) {
      refreshData();
      alert('Payment approved successfully');
    } else {
      alert(result.message);
    }
  };

  const handleReturnPayment = async (payment, returnReason) => {
    const result = await returnPayment(payment, returnReason);
    if (result.success) {
      refreshData();
      alert('Payment returned for rectification');
    } else {
      alert(result.message);
    }
  };

  const handleGenerateBill = async (inspectionCall, billData) => {
    const result = await generateBill(inspectionCall, billData);
    if (result.success) {
      refreshData();
      alert(`Bill ${result.data.billNumber} generated successfully`);
    } else {
      alert(result.message);
    }
  };

  const handleRecordPayment = async (bill, paymentData) => {
    const result = await recordPayment(bill, paymentData);
    if (result.success) {
      refreshData();
      alert('Payment recorded successfully');
    } else {
      alert(result.message);
    }
  };

  const handleClearBill = async (bill) => {
    const result = await clearBill(bill);
    if (result.success) {
      refreshData();
      alert('Bill cleared successfully');
    } else {
      alert(result.message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Finance Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <p>Error: {error}</p>
          <button className="btn btn-primary" onClick={refreshData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-item">Finance Dashboard</span>
      </div>

      {/* Page Title */}
      <h1 className="page-title">Finance Dashboard</h1>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'vendor-payments' && (
        <VendorPaymentsTab
          payments={pendingPayments}
          kpis={dashboardKPIs?.pendingFinanceApproval || {}}
          onApprove={handleApprovePayment}
          onReturn={handleReturnPayment}
        />
      )}

      {activeTab === 'pending-billing' && (
        <PendingBillingTab
          billingRecords={pendingBilling}
          kpis={dashboardKPIs?.pendingBilling || {}}
          onGenerateBill={handleGenerateBill}
        />
      )}

      {activeTab === 'bills-generated' && (
        <PendingPaymentTab
          bills={billsGenerated}
          kpis={dashboardKPIs?.billsGenerated || {}}
          onRecordPayment={handleRecordPayment}
          onClearBill={handleClearBill}
        />
      )}

      {activeTab === 'bills-cleared' && (
        <BillsClearedTab
          bills={billsCleared}
          kpis={dashboardKPIs?.billsCleared || {}}
        />
      )}

      {activeTab === 'historical-records' && (
        <HistoricalRecordsTab
          auditTrail={auditTrail}
          kpis={dashboardKPIs?.totalRevenue || {}}
        />
      )}
    </div>
  );
};

export default FinanceDashboard;

