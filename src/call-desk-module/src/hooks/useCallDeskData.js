

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { CALL_STATUS } from '../utils/constants';
import { getStoredUser, getAuthHeaders } from '../../../services/authService';
import { API_BASE_URL } from '../../../services/apiConfig';

const BASE_URL = API_BASE_URL;

const normalizeRio = (rioStr) => {
  if (!rioStr) return '';
  const r = String(rioStr).trim().toUpperCase();
  if (r === 'ER' || r === 'ERIO' || r.includes('EAST') || r.includes('KOLKATA')) return 'ER';
  if (r === 'WR' || r === 'WRIO' || r.includes('WEST') || r.includes('MUMBAI')) return 'WR';
  if (r === 'NR' || r === 'NRIO' || r.includes('NORTH') || r.includes('DELHI')) return 'NR';
  if (r === 'SR' || r === 'SRIO' || r.includes('SOUTH') || r.includes('CHENNAI')) return 'SR';
  if (r === 'CR' || r === 'CRIO' || r.includes('CENT') || r.includes('BHILAI')) return 'CR';
  return r.replace('RIO', '').replace('REGION', '').trim();
};

const isRioMatching = (userRio, itemRio) => {
  if (!userRio) return true; // Super admin
  if (!itemRio) return false;
  const u = normalizeRio(userRio);
  const i = normalizeRio(itemRio);
  return u === i;
};

const parsePoInfo = (item) => {
  let rlyShortName = item.rlyShortName && item.rlyShortName !== '-' ? item.rlyShortName : '-';
  let actualPoNo = item.poNo && item.poNo !== '-' ? item.poNo : '-';
  let actualSerialNo = item.poSr && item.poSr !== '-' ? item.poSr : '-';

  if ((rlyShortName === '-' || actualSerialNo === '-' || actualPoNo === '-') && item.rlyPoSrNo && item.rlyPoSrNo.includes('/')) {
    const parts = item.rlyPoSrNo.split('/').map(p => p.trim());
    if (parts.length >= 3) {
      if (rlyShortName === '-') rlyShortName = parts[0];
      if (actualPoNo === '-') actualPoNo = parts[1];
      if (actualSerialNo === '-') actualSerialNo = parts[2];
    } else if (parts.length === 2) {
      if (/[a-zA-Z]/.test(parts[0])) {
        if (rlyShortName === '-') rlyShortName = parts[0];
        if (actualPoNo === '-') actualPoNo = parts[1];
      } else {
        if (actualPoNo === '-') actualPoNo = parts[0];
        if (actualSerialNo === '-') actualSerialNo = parts[1];
      }
    }
  }

  if (actualPoNo === '-' && item.poNo) {
    const poParts = (item.poNo || "").split("/").map(p => p.trim());
    if (poParts.length > 0 && poParts[0]) {
      const hasLetters = /[a-zA-Z]/.test(poParts[0]);
      if (hasLetters) {
        if (rlyShortName === '-') rlyShortName = poParts[0];
        if (actualPoNo === '-') actualPoNo = poParts[1] || "-";
        if (actualSerialNo === '-') actualSerialNo = poParts[2] || "-";
      } else {
        if (actualPoNo === '-') actualPoNo = poParts[0];
        if (actualSerialNo === '-') actualSerialNo = poParts[1] || "-";
      }
    }
  }

  return { rlyShortName, actualPoNo, actualSerialNo };
};

const getStageOfInspection = (item, callType) => {
  const reqId = String(item.requestId || item.callNumber || item.callNo || '').trim().toUpperCase();

  // 1. Direct callType string from backend
  if (item.callType) {
    const ct = String(item.callType).trim().toUpperCase();
    if (ct.includes('PROCESS')) return 'Process';
    if (ct.includes('FINAL')) return 'Final';
    if (ct.includes('RAW') || ct.includes('RM')) return 'Raw Material';
  }

  // 2. Direct stage/stageOfInspection from backend
  if (item.stageOfInspection && item.stageOfInspection !== '-' && item.stageOfInspection !== 'Railpad') {
    return item.stageOfInspection;
  }
  if (item.stage && item.stage !== '-') {
    return item.stage;
  }

  // 3. Prefix matching:
  // Railpad: RPP = Process, RPF / RFF = Final
  if (reqId.startsWith('RPP')) return 'Process';
  if (reqId.startsWith('RPF') || reqId.startsWith('RFF')) return 'Final';

  // Sleeper / ERC prefixes
  if (reqId.startsWith('EP') || reqId.startsWith('PRC') || reqId.startsWith('PROC') || reqId.startsWith('P-')) return 'Process';
  if (reqId.startsWith('EF') || reqId.startsWith('FIN') || reqId.startsWith('F-')) return 'Final';
  if (reqId.startsWith('ER') || reqId.startsWith('RMC') || reqId.startsWith('RM-') || reqId.startsWith('RM/')) return 'Raw Material';

  // 4. Check productStage or productType if already descriptive
  if (item.productStage && !['Final', 'Sleeper', 'Rail Pad', 'ERC', '-'].includes(item.productStage)) {
    return item.productStage;
  }
  if (item.productType) {
    const pt = String(item.productType).trim();
    if (pt.toUpperCase() === 'PROCESS') return 'Process';
    if (pt.toUpperCase() === 'FINAL') return 'Final';
    if (pt.toUpperCase() === 'RAW MATERIAL') return 'Raw Material';
  }

  // 5. Product defaults
  if (callType === 'RAILPAD') {
    return reqId.startsWith('RPP') ? 'Process' : 'Final';
  }
  if (callType === 'SLEEPER') {
    return reqId.startsWith('RMC') ? 'Raw Material' : 'Final';
  }

  return 'Final';
};

export const useCallDeskData = (activeTab = 'pending', callType = 'ERC') => {
  const [pendingCalls, setPendingCalls] = useState([]);
  const [verifiedCalls, setVerifiedCalls] = useState([]);
  const [disposedCalls, setDisposedCalls] = useState([]);
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
      : callType === 'RAILPAD'
      ? `${BASE_URL}/api/railpad-workflow/allPendingWorkflowTransition`
      : `${BASE_URL}/allPendingWorkflowTransition`;

    const response = await axios.get(
      endpoint,
      {
        params: {
          roleName: 'RIO Help Desk',
          ...(user?.rio ? { rio: user.rio } : {})
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

    // Filter strictly by logged-in user's RIO
    const filteredCalls = allCalls.filter(item => isRioMatching(user?.rio, item.rio));

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

      const { rlyShortName, actualPoNo, actualSerialNo } = parsePoInfo(item);

      return {
        id: item.workflowTransitionId,
        callNumber: item.requestId,
        vendor: { name: item.vendorName || item.vendorCode || '-' },
        submissionDateTime: item.createdDate,
        poNumber: actualPoNo,
        poSerialNo: actualSerialNo,
        rlyShortName: rlyShortName,
        rlyPoSr: item.rlyPoSrNo || item.poNo || '-',
        rawPoNo: item.rawPoNo || (actualPoNo !== '-' ? actualPoNo : ''),
        product: item.productType || (callType === 'SLEEPER' ? 'Sleeper' : callType === 'RAILPAD' ? 'Rail Pad' : '-'),
        productStage: getStageOfInspection(item, callType),
        desiredInspectionDate: item.desiredInspectionDate || item.createdDate,
        placeOfInspection: item.placeOfInspection || item.poiCode || '-',
        dpDate: item.dpDate,
        extDpDate: item.extDpDate,
        dpDates: `${item.dpDate || '-'} / ${item.extDpDate || '-'}`,
        status: internalStatus,
        originalStatus: item.status,
        assignedIE: item.assignedToUserName || item.ieName || (item.assignedToUserEmployeeCode ? `${item.assignedToUserName || 'IE'} (${item.assignedToUserEmployeeCode})` : '-'),
        assignedIeName: item.assignedToUserName || item.ieName || null,
        ieName: item.ieName || item.assignedToUserName || null,
        assignedToUserName: item.assignedToUserName || item.ieName || null,
        assignedToUser: item.assignedToUser,
        assignedToUserEmployeeCode: item.assignedToUserEmployeeCode,
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
      ? `${BASE_URL}/api/sleeper-workflow/pendingVerifiedCalls`
      : callType === 'RAILPAD'
      ? `${BASE_URL}/api/railpad-workflow/pendingVerifiedCalls`
      : `${BASE_URL}/allVerifiedWorkflowTransitions`;

    const response = await axios.get(
      endpoint,
      {
        params: {
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
    
    // Filter out completed, withdrawn, withheld, and cancelled calls
    const openCalls = data.filter(item => {
      const status = [item.status, item.action, item.jobStatus].filter(Boolean).join(' ').toUpperCase();
      const isDisposed = status.includes('DSC_SIGN_IC') || 
                         status.includes('INSPECTION_COMPLETE_CONFIRM') ||
                         status.includes('WITHDRAW') || 
                         status.includes('WITHHELD') || 
                         status.includes('CANCEL');
                
      if (isDisposed) return false;

      // Filter strictly by logged-in user's RIO
      return isRioMatching(user?.rio, item.rio);
    });
    
    return openCalls.map(item => {
      // Map backend status to internal CALL_STATUS
      let internalStatus = item.status;
      const backendStatus = [
        item.status || '', 
        item.action || '', 
        item.jobStatus || ''
      ].join(' ').toUpperCase();

      if (backendStatus.includes('SCHEDULE')) {
        internalStatus = 'scheduled';
      } else if (backendStatus.includes('INITIATE') || backendStatus.includes('PROGRESS')) {
        internalStatus = 'under_inspection';
      } else if (backendStatus.includes('VERIFIED') || backendStatus.includes('REGISTERED')) {
        internalStatus = 'verified_registered';
      } else if (backendStatus.includes('COMPLETE') || backendStatus.includes('CONFIRM')) {
        internalStatus = 'ic_pending';
      } else if (backendStatus.includes('LAB')) {
        internalStatus = 'under_lab_testing';
      } else if (backendStatus.includes('BILLING')) {
        internalStatus = 'billing_pending';
      } else if (backendStatus.includes('PAYMENT') || backendStatus.includes('BLOCKED')) {
        internalStatus = 'payment_pending';
      }

      const { rlyShortName, actualPoNo, actualSerialNo } = parsePoInfo(item);

      return {
        id: item.workflowTransitionId,
        callNumber: item.requestId,
        vendor: { name: item.vendorName || item.vendorCode || '-' },
        submissionDateTime: item.createdDate,
        poNumber: actualPoNo,
        poSerialNo: actualSerialNo,
        rlyShortName: rlyShortName,
        rlyPoSr: item.rlyPoSrNo || item.poNo || '-',
        rawPoNo: item.rawPoNo || (actualPoNo !== '-' ? actualPoNo : ''),
        product: item.productType || (callType === 'SLEEPER' ? 'Sleeper' : callType === 'RAILPAD' ? 'Rail Pad' : '-'),
        productStage: getStageOfInspection(item, callType),
        desiredInspectionDate: item.desiredInspectionDate || item.createdDate,
        dpDate: item.dpDate,
        extDpDate: item.extDpDate,
        dpDates: `${item.dpDate || '-'} / ${item.extDpDate || '-'}`,
        placeOfInspection: item.placeOfInspection || item.poiCode || '-',
        status: internalStatus,
        originalStatus: item.status,
        assignedIE: item.assignedToUserName || item.ieName || '-',
        assignedToUser: item.assignedToUser,
        assignedToUserEmployeeCode: item.assignedToUserEmployeeCode,
        plantId: item.plantId,
        rio: item.rio
      };
    });
  }, [callType]);

  // API: Fetch Disposed Calls
  const fetchDisposedCalls = useCallback(async () => {
    const user = getStoredUser();
    
    const endpoint = callType === 'SLEEPER'
      ? `${BASE_URL}/api/sleeper-workflow/allFInalCallCompletedCalls`
      : callType === 'RAILPAD'
      ? `${BASE_URL}/api/railpad-workflow/allFInalCallCompletedCalls`
      : `${BASE_URL}/allDisposedWorkflowTransitions`;

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
      throw new Error('Failed to fetch disposed calls');
    }

    const data = response.data.responseData || [];
    
    const filteredData = data.filter(item => isRioMatching(user?.rio, item.rio));

    return filteredData.map(item => {
      let internalStatus = item.status;
      const backendStatus = item.status ? item.status.toString().toUpperCase() : '';

      if (backendStatus.includes('GENERATE_IC')) {
        internalStatus = 'ic_pending';
      } else if (backendStatus.includes('DSC_SIGN_IC')) {
        internalStatus = 'ic_issued';
      } else if (backendStatus.includes('INSPECTION_COMPLETE_CONFIRM')) {
        internalStatus = 'inspection_completed';
      } else if (backendStatus.includes('COMPLETE') || backendStatus.includes('CONFIRM') || backendStatus.includes('IC')) {
        internalStatus = 'completed';
      } else if (backendStatus.includes('VERIFIED') || backendStatus.includes('REGISTERED')) {
        internalStatus = 'verified_registered';
      } else if (backendStatus.includes('SCHEDULE')) {
        internalStatus = 'scheduled';
      } else if (backendStatus.includes('INITIATE') || backendStatus.includes('PROGRESS')) {
        internalStatus = 'under_inspection';
      } else if (backendStatus.includes('LAB')) {
        internalStatus = 'under_lab_testing';
      } else if (backendStatus.includes('BILLING')) {
        internalStatus = 'billing_pending';
      } else if (backendStatus.includes('PAYMENT') || backendStatus.includes('BLOCKED')) {
        internalStatus = 'payment_pending';
      } else if (backendStatus.includes('WITHDRAW') || backendStatus.includes('WITHHELD')) {
        internalStatus = 'withdrawn';
      } else if (backendStatus.includes('CANCEL')) {
        internalStatus = 'cancelled_chargeable';
      }

      const { rlyShortName, actualPoNo, actualSerialNo } = parsePoInfo(item);

      return {
        id: item.workflowTransitionId,
        callNumber: item.requestId,
        vendor: { name: item.vendorName || item.vendorCode || '-' },
        submissionDateTime: item.createdDate,
        poNumber: actualPoNo,
        poSerialNo: actualSerialNo,
        rlyShortName: rlyShortName,
        rlyPoSr: item.rlyPoSrNo || item.poNo || '-',
        rawPoNo: item.rawPoNo || (actualPoNo !== '-' ? actualPoNo : ''),
        vendorCode: item.vendorCode || '',
        product: item.productType || (callType === 'SLEEPER' ? 'Sleeper' : callType === 'RAILPAD' ? 'Rail Pad' : '-'),
        productStage: getStageOfInspection(item, callType),
        desiredInspectionDate: item.desiredInspectionDate || item.createdDate,
        dpDate: item.dpDate,
        extDpDate: item.extDpDate,
        dpDates: `${item.dpDate || '-'} / ${item.extDpDate || '-'}`,
        placeOfInspection: item.placeOfInspection || item.poiCode || '-',
        status: internalStatus,
        originalStatus: item.status,
        assignedIE: item.assignedToUserName || item.ieName || '-',
        rio: item.rio,
        disposalReason: item.remarks || '-'
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
      } else if (targetTab === 'disposed') {
        fetchActions.push(fetchDisposedCalls());
      } else {
        fetchActions.push(fetchPendingVerificationCalls());
        fetchActions.push(fetchVerifiedCalls());
        fetchActions.push(fetchDisposedCalls());
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
      } else if (targetTab === 'disposed') {
        const disposedResult = results[1];
        if (disposedResult.status === 'fulfilled') {
          setDisposedCalls(disposedResult.value);
        } else {
          setError(disposedResult.reason?.message || 'Failed to fetch disposed calls');
        }
        newLoadedFlags.disposed = true;
      } else {
        // Multi-fetch case (all tabs)
        const pendingResult = results[1];
        const verifiedResult = results[2];
        const disposedResult = results[3];

        if (pendingResult?.status === 'fulfilled') {
          setPendingCalls(pendingResult.value);
        }
        if (verifiedResult?.status === 'fulfilled') {
          setVerifiedCalls(verifiedResult.value);
        }
        if (disposedResult?.status === 'fulfilled') {
          setDisposedCalls(disposedResult.value);
        }
        
        newLoadedFlags.pending = true;
        newLoadedFlags.verified = true;
        newLoadedFlags.disposed = true;

        // Only set error if all failed in this case
        if (pendingResult?.status === 'rejected' && verifiedResult?.status === 'rejected' && disposedResult?.status === 'rejected') {
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
  }, [activeTab, fetchPendingVerificationCalls, fetchDashboardKPIs, fetchVerifiedCalls, fetchDisposedCalls]);


  // Effect for initial load and tab switching
  useEffect(() => {
    // Determine what needs to be fetched
    const needsKpi = !dataLoaded.kpis;
    const needsPending = activeTab === 'pending' && !dataLoaded.pending;
    const needsVerified = activeTab === 'verified' && !dataLoaded.verified;
    const needsDisposed = activeTab === 'disposed' && !dataLoaded.disposed;

    if (needsKpi || needsPending || needsVerified || needsDisposed) {
      fetchData(activeTab);
    }
  }, [activeTab, fetchData, dataLoaded]);

  // Reset loaded state and clear call arrays when callType changes to force re-fetch
  useEffect(() => {
    setPendingCalls([]);
    setVerifiedCalls([]);
    setDisposedCalls([]);
    setDashboardKPIs(null);
    setDataLoaded({
      pending: false,
      verified: false,
      disposed: false,
      kpis: false
    });
  }, [callType]);

  // Compute dynamic KPIs for RAILPAD / SLEEPER or when API KPIs are not available
  const computedKPIs = useMemo(() => {
    if (callType === 'RAILPAD' || callType === 'SLEEPER' || !dashboardKPIs) {
      const freshCount = pendingCalls.filter(c => 
        c.status === CALL_STATUS.FRESH_SUBMISSION || 
        c.originalStatus === 'Created' || 
        c.originalStatus === 'CREATED' ||
        c.submissionCount === 1
      ).length;
      const resubCount = pendingCalls.filter(c => 
        c.status === CALL_STATUS.RESUBMISSION || 
        c.originalStatus === 'ReSubmitted' || 
        c.originalStatus === 'RESUBMITTED' ||
        (c.submissionCount && c.submissionCount > 1)
      ).length;
      const retCount = pendingCalls.filter(c => 
        c.status === CALL_STATUS.RETURNED || 
        c.status === CALL_STATUS.RETURN_TO_VENDOR || 
        (c.originalStatus && c.originalStatus.toString().includes('RETURN'))
      ).length;

      return {
        pendingVerification: {
          total: pendingCalls.length,
          fresh: freshCount,
          resubmissions: resubCount,
          returned: retCount
        },
        verifiedOpen: {
          total: verifiedCalls.length
        },
        disposed: {
          total: disposedCalls.length
        }
      };
    }
    return dashboardKPIs;
  }, [callType, dashboardKPIs, pendingCalls, verifiedCalls, disposedCalls]);

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
    dashboardKPIs: computedKPIs,
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


