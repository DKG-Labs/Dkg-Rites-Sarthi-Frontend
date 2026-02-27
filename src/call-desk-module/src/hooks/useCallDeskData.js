

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CALL_STATUS } from '../utils/constants';
import { getStoredUser, getAuthHeaders } from '../../../services/authService';
import { API_BASE_URL } from '../../../services/apiConfig';

const BASE_URL = API_BASE_URL;


export const useCallDeskData = () => {
  const [pendingCalls, setPendingCalls] = useState([]);
  const [verifiedCalls, setVerifiedCalls] = useState([]);
  const [disposedCalls, setDisposedCalls] = useState([]);
  const [dashboardKPIs, setDashboardKPIs] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [rioOffices, setRioOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //  API: Fetch Pending Verification Calls
  const fetchPendingVerificationCalls = useCallback(async () => {
    const user = getStoredUser();

    console.log('🔍 Call Desk - Logged in user:', user);
    console.log('🔍 Call Desk - User RIO:', user?.rio);

    const response = await axios.get(
      `${BASE_URL}/allPendingWorkflowTransition`,
      {
        params: {
          roleName: 'RIO Help Desk',
        },
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (response.data?.responseStatus?.statusCode !== 0) {
      throw new Error('Failed to fetch pending verification calls');
    }

    const allCalls = response.data.responseData || [];
    console.log('🔍 Call Desk - Total calls from API:', allCalls.length);
    console.log('🔍 Call Desk - All calls:', allCalls);

    //  Filter by RIO - match logged-in user's RIO with call's RIO
    //  Exclude calls where RIO is null or empty
    const filteredCalls = allCalls.filter(item => {
      // Skip calls with null or empty RIO
      if (!item.rio || item.rio === null || item.rio === '') {
        console.log(`🔍 Skipping call ${item.requestId}: RIO is null/empty`);
        return false;
      }

      const itemRio = String(item.rio).trim();
      const userRio = String(user?.rio || '').trim();
      const matches = itemRio === userRio;

      console.log(`🔍 Comparing: Call ${item.requestId} - Item RIO="${itemRio}" vs User RIO="${userRio}" => ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);

      return matches;
    });

    console.log('🔍 Call Desk - Filtered calls for user RIO:', filteredCalls.length);

    return filteredCalls.map(item => {
      // Map backend status to internal CALL_STATUS
      let internalStatus = CALL_STATUS.PENDING_VERIFICATION;
      const backendStatus = item.status ? item.status.toString() : '';

      if (backendStatus === 'Created') {
        internalStatus = CALL_STATUS.FRESH_SUBMISSION;
      } else if (backendStatus === 'ReSubmitted') {
        internalStatus = CALL_STATUS.RESUBMISSION;
      } else if (backendStatus === 'RETURNED' || backendStatus === 'RETURN_TO_VENDOR' || backendStatus.includes('RETURNED')) {
        internalStatus = CALL_STATUS.RETURNED;
      }

      return {
        id: item.workflowTransitionId,
        callNumber: item.requestId,
        vendor: { name: item.vendorName || '-' },
        submissionDateTime: item.createdDate,
        poNumber: item.poNo,
        product: item.productType,
        productStage: item.productType,
        desiredInspectionDate: item.desiredInspectionDate,
        placeOfInspection: '-',
        status: internalStatus, // Use mapped internal status
        rio: item.rio,
        // Include additional fields for details view if available
        submissionCount: item.workflowSequence || 1,
        returnReason: internalStatus === CALL_STATUS.RETURNED ? item.remarks : null
      };
    });
  }, []);

  // Fetch data from backend API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Pending Verification Calls
      const pending = await fetchPendingVerificationCalls();

      // Sort pending calls by submissionDateTime DESC (newest first)
      const sortedPending = [...pending].sort((a, b) => {
        const dateA = new Date(a.submissionDateTime);
        const dateB = new Date(b.submissionDateTime);
        return dateB - dateA;
      });

      setPendingCalls(sortedPending);

      // KPIs (derived from API data)
      // Calculate real KPIs from data
      const freshCount = pending.filter(c => c.status === CALL_STATUS.FRESH_SUBMISSION).length;
      const resubCount = pending.filter(c => c.status === CALL_STATUS.RESUBMISSION).length;
      const returnedCount = pending.filter(c => c.status === CALL_STATUS.RETURNED).length;

      // Verified Calls (placeholder for future API)
      const verified = [];

      // Extract verified counts from local verified data (currently empty)
      const vRegCount = verified.filter(c => c.status === CALL_STATUS.VERIFIED_REGISTERED).length;
      const iePendCount = verified.filter(c => c.status === CALL_STATUS.IE_ASSIGNMENT_PENDING).length;
      const assignedCount = verified.filter(c => c.status === CALL_STATUS.ASSIGNED_TO_IE).length;
      const scheduledCount = verified.filter(c => c.status === CALL_STATUS.SCHEDULED).length;
      const inspectionCount = verified.filter(c => c.status === CALL_STATUS.UNDER_INSPECTION).length;
      const labCount = verified.filter(c => c.status === CALL_STATUS.UNDER_LAB_TESTING).length;
      const icPendCount = verified.filter(c => c.status === CALL_STATUS.IC_PENDING).length;
      const billingCount = verified.filter(c => c.status === CALL_STATUS.BILLING_PENDING).length;
      const paymentCount = verified.filter(c => c.status === CALL_STATUS.PAYMENT_PENDING).length;

      setDashboardKPIs({
        pendingVerification: {
          total: pending.length,
          fresh: freshCount,
          resubmissions: resubCount,
          returned: returnedCount,
        },
        verifiedOpen: {
          total: verified.length,
          verifiedRegistered: vRegCount,
          ieAssignmentPending: iePendCount,
          assignedToIE: assignedCount,
          scheduled: scheduledCount,
          underInspection: inspectionCount,
          underLabTesting: labCount,
          icPending: icPendCount,
          billingPending: billingCount,
          paymentPending: paymentCount,
        },
        disposed: {
          total: 0,
        },
      });

      setVerifiedCalls(verified);
      setDisposedCalls([]);   // later via API
      setVendors([]);         // later via API
      setRioOffices([]);      // later via API

    } catch (err) {
      setError(err.message || 'Failed to fetch Call Desk data');
    } finally {
      setLoading(false);
    }
  }, [fetchPendingVerificationCalls]);


  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get call by ID
  const getCallById = (callId) => {
    const allCalls = [...pendingCalls, ...verifiedCalls, ...disposedCalls];
    return allCalls.find(call => call.id === callId || call.callNumber === callId);
  };

  // Get call history
  const getCallHistory = () => {
    return [];
  };

  // Get calls by status
  const getCallsByStatus = (status) => {
    const allCalls = [...pendingCalls, ...verifiedCalls, ...disposedCalls];
    return allCalls.filter(call => call.status === status);
  };

  // Get calls by RIO
  const getCallsByRIO = (rio) => {
    const allCalls = [...pendingCalls, ...verifiedCalls, ...disposedCalls];
    return allCalls.filter(call => call.rio === rio);
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
    pendingCalls,
    verifiedCalls,
    disposedCalls,
    dashboardKPIs,
    vendors,
    rioOffices,

    // State
    loading,
    error,

    // Functions
    getCallById,
    getCallHistory,
    getCallsByStatus,
    getCallsByRIO,
    getVendorById,
    refreshData
  };
};

export default useCallDeskData;

