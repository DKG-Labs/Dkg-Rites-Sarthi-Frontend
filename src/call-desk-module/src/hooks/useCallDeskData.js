

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CALL_STATUS } from '../utils/constants';
import { getStoredUser, getAuthHeaders } from '../../../services/authService';
import { API_BASE_URL } from '../../../services/apiConfig';

const BASE_URL = API_BASE_URL;


export const useCallDeskData = (activeTab = 'pending') => {
  const [pendingCalls, setPendingCalls] = useState([]);
  const [verifiedCalls, setVerifiedCalls] = useState([]);
  const [disposedCalls] = useState([]);
  const [dashboardKPIs, setDashboardKPIs] = useState(null);
  const [vendors] = useState([]);
  const [rioOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track what has been loaded to avoid redundant fetches
  const [dataLoaded, setDataLoaded] = useState({
    pending: false,
    verified: false,
    disposed: false,
    kpis: false
  });

  // API: Fetch Pending Verification Calls
  const fetchPendingVerificationCalls = useCallback(async () => {
    const user = getStoredUser();

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

    // Filter by RIO - match logged-in user's RIO with call's RIO
    const filteredCalls = allCalls.filter(item => {
      if (!item.rio || item.rio === null || item.rio === '') return false;
      const itemRio = String(item.rio).trim();
      const userRio = String(user?.rio || '').trim();
      return itemRio === userRio;
    });

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

      const poParts = (item.poNo || "").split(" / ");
      const actualPoNo = poParts[1] || "-";
      const actualSerialNo = poParts[1] && poParts[2] ? `${poParts[1]} / ${poParts[2]}` : (poParts[2] || "-");

      return {
        id: item.workflowTransitionId,
        callNumber: item.requestId,
        vendor: { name: item.vendorName || '-' },
        submissionDateTime: item.createdDate,
        poNumber: actualPoNo,
        poSerialNo: actualSerialNo,
        rlyPoSr: item.poNo || '-',
        product: item.productType,
        productStage: item.productType,
        desiredInspectionDate: item.desiredInspectionDate,
        placeOfInspection: item.placeOfInspection || '-',
        dpDate: item.dpDate,
        extDpDate: item.extDpDate,
        dpDates: `${item.dpDate || '-'} / ${item.extDpDate || '-'}`,
        status: internalStatus,
        rio: item.rio,
        submissionCount: item.workflowSequence || 1,
        returnReason: internalStatus === CALL_STATUS.RETURN_TO_VENDOR ? item.remarks : null
      };
    });
  }, []);

  // API: Fetch Dashboard KPIs
  const fetchDashboardKPIs = useCallback(async () => {
    const user = getStoredUser();
    const response = await axios.get(
      `${BASE_URL}/dashboardKPIs`,
      {
        params: {
          rio: user?.rio || '',
        },
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (response.data?.responseStatus?.statusCode !== 0) {
      throw new Error('Failed to fetch dashboard KPIs');
    }

    return response.data.responseData;
  }, []);

  // API: Fetch Verified & Open Calls
  const fetchVerifiedCalls = useCallback(async () => {
    const user = getStoredUser();
    const response = await axios.get(
      `${BASE_URL}/allVerifiedWorkflowTransitions`,
      {
        params: {
          rio: user?.rio || '',
        },
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (response.data?.responseStatus?.statusCode !== 0) {
      throw new Error('Failed to fetch verified calls');
    }

    const data = response.data.responseData || [];
    
    return data.map(item => {
      // Map backend status to internal CALL_STATUS
      let internalStatus = item.status;
      const backendStatus = item.status ? item.status.toString().toUpperCase() : '';

      if (backendStatus.includes('VERIFIED') || backendStatus.includes('REGISTERED')) {
        internalStatus = 'verified_registered';
      } else if (backendStatus.includes('SCHEDULE')) {
        internalStatus = 'scheduled';
      } else if (backendStatus.includes('INITIATE') || backendStatus.includes('PROGRESS')) {
        internalStatus = 'under_inspection';
      } else if (backendStatus.includes('COMPLETE') || backendStatus.includes('CONFIRM')) {
        internalStatus = 'ic_pending';
      } else if (backendStatus.includes('LAB')) {
        internalStatus = 'under_lab_testing';
      } else if (backendStatus.includes('BILLING')) {
        internalStatus = 'billing_pending';
      } else if (backendStatus.includes('PAYMENT') || backendStatus.includes('BLOCKED')) {
        internalStatus = 'payment_pending';
      }

      const poParts = (item.poNo || "").split(" / ");
      const actualPoNo = poParts[1] || "-";

      return {
        id: item.workflowTransitionId,
        callNumber: item.requestId,
        vendor: { name: item.vendorName || '-' },
        submissionDateTime: item.createdDate,
        poNumber: actualPoNo,
        product: item.productType,
        productStage: item.productType,
        desiredInspectionDate: item.desiredInspectionDate,
        placeOfInspection: item.placeOfInspection || '-',
        status: internalStatus,
        assignedIE: item.assignedToUserName || item.ieName || '-',
        rio: item.rio
      };
    });
  }, []);

  // Fetch data from backend API
  const fetchData = useCallback(async (tabId = null) => {
    try {
      setLoading(true);
      setError(null);

      const targetTab = tabId || activeTab;
      
      // Always fetch KPIs on mount or total refresh
      const fetchActions = [fetchDashboardKPIs()];
      
      // Selectively fetch main data
      if (targetTab === 'pending') {
        fetchActions.push(fetchPendingVerificationCalls());
      } else if (targetTab === 'verified') {
        fetchActions.push(fetchVerifiedCalls());
      } else {
        // Fetch all if not specified
        fetchActions.push(fetchPendingVerificationCalls());
        fetchActions.push(fetchVerifiedCalls());
      }

      const results = await Promise.all(fetchActions);
      const kpis = results[0];
      
      setDashboardKPIs(kpis);
      
      if (targetTab === 'pending') {
        setPendingCalls(results[1]);
        setDataLoaded(prev => ({ ...prev, pending: true, kpis: true }));
      } else if (targetTab === 'verified') {
        setVerifiedCalls(results[1]);
        setDataLoaded(prev => ({ ...prev, verified: true, kpis: true }));
      } else {
        setPendingCalls(results[1]);
        setVerifiedCalls(results[2]);
        setDataLoaded({ pending: true, verified: true, kpis: true, disposed: false });
      }

    } catch (err) {
      setError(err.message || 'Failed to fetch Call Desk data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchPendingVerificationCalls, fetchDashboardKPIs, fetchVerifiedCalls]);


  // Effect for initial load and tab switching
  useEffect(() => {
    // Determine what needs to be fetched
    const needsKpi = !dataLoaded.kpis;
    const needsPending = activeTab === 'pending' && !dataLoaded.pending;
    const needsVerified = activeTab === 'verified' && !dataLoaded.verified;

    if (needsKpi || needsPending || needsVerified) {
      fetchData(activeTab);
    }
  }, [activeTab, fetchData, dataLoaded]);

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
  const refreshData = (tabId = null) => {
    fetchData(tabId);
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

