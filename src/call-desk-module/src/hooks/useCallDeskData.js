

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getStoredUser, getAuthHeaders } from '../../../services/authService';
const BASE_URL =
  'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend';


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
const fetchPendingVerificationCalls = async () => {
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

  return filteredCalls.map(item => ({
    id: item.workflowTransitionId,
    callNumber: item.requestId,
    vendor: { name: item.vendorName || '-' },
    submissionDateTime: item.createdDate,
    poNumber: item.poNo, // Fixed: API returns 'poNo', not 'poNumber'
    product: item.productType, // Added: for filtering
    productStage: item.productType,
    desiredInspectionDate: item.desiredInspectionDate,
    placeOfInspection: '-',
    status: item.status,
    rio: item.rio,
  }));
};

  // Fetch data from backend API
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    // Pending Verification Calls
    const pending = await fetchPendingVerificationCalls();

    setPendingCalls(pending);

    // KPIs (derived from API data)
    setDashboardKPIs({
      pendingVerification: {
        total: pending.length,
        fresh: pending.length,
        resubmissions: 0,
        returned: 0,
      },
      verifiedOpen: {
        total: 0,
      },
      disposed: {
        total: 0,
      },
    });

    setVerifiedCalls([]);   // later via API
    setDisposedCalls([]);   // later via API
    setVendors([]);         // later via API
    setRioOffices([]);      // later via API

  } catch (err) {
    setError(err.message || 'Failed to fetch Call Desk data');
  } finally {
    setLoading(false);
  }
}, []);


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

