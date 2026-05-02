

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CALL_STATUS } from '../utils/constants';
import { getStoredUser, getAuthHeaders } from '../../../services/authService';
import { API_BASE_URL } from '../../../services/apiConfig';

const BASE_URL = API_BASE_URL;


export const useCallDeskData = (activeTab = 'pending', callType = 'ERC') => {
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
    
    const endpoint = callType === 'SLEEPER'
      ? `${BASE_URL}/api/sleeper-workflow/allPendingWorkflowTransition`
      : `${BASE_URL}/allPendingWorkflowTransition`;

    const response = await axios.get(
      endpoint,
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

      if (backendStatus === 'Created' || backendStatus === 'CREATED') {
        internalStatus = CALL_STATUS.FRESH_SUBMISSION;
      } else if (backendStatus === 'ReSubmitted' || backendStatus === 'RESUBMITTED') {
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
        vendor: { name: item.vendorName || item.vendorCode || '-' },
        submissionDateTime: item.createdDate,
        poNumber: actualPoNo,
        poSerialNo: actualSerialNo,
        rlyPoSr: item.poNo || '-',
        product: item.productType || (callType === 'SLEEPER' ? 'Sleeper' : '-'),
        productStage: item.productType || (callType === 'SLEEPER' ? 'Final' : '-'),
        desiredInspectionDate: item.desiredInspectionDate || item.createdDate,
        placeOfInspection: item.placeOfInspection || item.poiCode || '-',
        dpDate: item.dpDate,
        extDpDate: item.extDpDate,
        dpDates: `${item.dpDate || '-'} / ${item.extDpDate || '-'}`,
        status: internalStatus,
        rio: item.rio,
        submissionCount: item.workflowSequence || 1,
        returnReason: internalStatus === CALL_STATUS.RETURN_TO_VENDOR ? item.remarks : null
      };
    });
  }, [callType]);

  // API: Fetch Dashboard KPIs
  const fetchDashboardKPIs = useCallback(async () => {
    if (callType === 'SLEEPER') {
      // Sleeper might not have KPIs endpoint yet, return mock or null
      return null;
    }
    
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
  }, [callType]);

  // API: Fetch Verified & Open Calls
  const fetchVerifiedCalls = useCallback(async () => {
    const user = getStoredUser();
    
    const endpoint = callType === 'SLEEPER'
      ? `${BASE_URL}/api/sleeper-workflow/allCompletedCalls`
      : `${BASE_URL}/allVerifiedWorkflowTransitions`;

    const response = await axios.get(
      endpoint,
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

      if (backendStatus.includes('VERIFIED') || backendStatus.includes('REGISTERED') || backendStatus.includes('COMPLETED')) {
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
        vendor: { name: item.vendorName || item.vendorCode || '-' },
        submissionDateTime: item.createdDate,
        poNumber: actualPoNo,
        product: item.productType || (callType === 'SLEEPER' ? 'Sleeper' : '-'),
        productStage: item.productType || (callType === 'SLEEPER' ? 'Final' : '-'),
        desiredInspectionDate: item.desiredInspectionDate || item.createdDate,
        placeOfInspection: item.placeOfInspection || item.poiCode || '-',
        status: internalStatus,
        assignedIE: item.assignedToUserName || item.ieName || '-',
        rio: item.rio
      };
    });
  }, [callType]);

  // Fetch data from backend API
  const fetchData = useCallback(async (tabId = null) => {
    try {
      setLoading(true);
      setError(null);

      const targetTab = tabId || activeTab;
      
      // Define fetch actions
      const fetchActions = [fetchDashboardKPIs()];
      
      if (targetTab === 'pending') {
        fetchActions.push(fetchPendingVerificationCalls());
      } else if (targetTab === 'verified') {
        fetchActions.push(fetchVerifiedCalls());
      } else {
        fetchActions.push(fetchPendingVerificationCalls());
        fetchActions.push(fetchVerifiedCalls());
      }

      // Use allSettled to handle partial failures
      const results = await Promise.allSettled(fetchActions);
      
      // Track only the flags we are updating in this fetch
      const newLoadedFlags = {};

      // 1. Handle KPIs (First action)
      const kpisResult = results[0];
      if (kpisResult.status === 'fulfilled') {
        setDashboardKPIs(kpisResult.value);
      } else {
        console.error('KPI Fetch Error:', kpisResult.reason);
      }
      newLoadedFlags.kpis = true;
      
      // 2. Handle Tab-specific data
      if (targetTab === 'pending') {
        const pendingResult = results[1];
        if (pendingResult.status === 'fulfilled') {
          setPendingCalls(pendingResult.value);
        } else {
          setError(pendingResult.reason?.message || 'Failed to fetch pending calls');
        }
        newLoadedFlags.pending = true;
      } else if (targetTab === 'verified') {
        const verifiedResult = results[1];
        if (verifiedResult.status === 'fulfilled') {
          setVerifiedCalls(verifiedResult.value);
        } else {
          setError(verifiedResult.reason?.message || 'Failed to fetch verified calls');
        }
        newLoadedFlags.verified = true;
      } else {
        // Multi-fetch case (all tabs)
        const pendingResult = results[1];
        const verifiedResult = results[2];

        if (pendingResult?.status === 'fulfilled') {
          setPendingCalls(pendingResult.value);
        }
        if (verifiedResult?.status === 'fulfilled') {
          setVerifiedCalls(verifiedResult.value);
        }
        
        newLoadedFlags.pending = true;
        newLoadedFlags.verified = true;

        // Only set error if BOTH failed in this case
        if (pendingResult?.status === 'rejected' && verifiedResult?.status === 'rejected') {
          setError('Failed to fetch dashboard data');
        }
      }

      // Use functional update to avoid 'dataLoaded' dependency
      setDataLoaded(prev => ({ ...prev, ...newLoadedFlags }));

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

  // Reset loaded state when callType changes to force re-fetch
  useEffect(() => {
    setDataLoaded({
      pending: false,
      verified: false,
      disposed: false,
      kpis: false
    });
  }, [callType]);

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


