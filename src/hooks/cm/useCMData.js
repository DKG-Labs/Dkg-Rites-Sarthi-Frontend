/**
 * useCMData Hook
 * Custom hook for managing CM dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import {
  MOCK_INSPECTION_CALLS,
  MOCK_DASHBOARD_KPIS,
  MOCK_IES,
  MOCK_IE_PERFORMANCE,
  MOCK_APPROVALS
} from '../../utils/cm/mockData';

export const useCMData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardKPIs, setDashboardKPIs] = useState(MOCK_DASHBOARD_KPIS);
  const [inspectionCalls, setInspectionCalls] = useState(MOCK_INSPECTION_CALLS);
  const [ies, setIes] = useState(MOCK_IES);
  const [iePerformance, setIePerformance] = useState(MOCK_IE_PERFORMANCE);
  const [approvals, setApprovals] = useState(MOCK_APPROVALS || []);

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setDashboardKPIs(MOCK_DASHBOARD_KPIS);
        setInspectionCalls(MOCK_INSPECTION_CALLS);
        setIes(MOCK_IES);
        setIePerformance(MOCK_IE_PERFORMANCE);
        setApprovals(MOCK_APPROVALS || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get calls by status
  const getCallsByStatus = useCallback((status) => {
    return inspectionCalls.filter(call => call.status === status);
  }, [inspectionCalls]);

  // Get calls by IE
  const getCallsByIE = useCallback((ieId) => {
    return inspectionCalls.filter(call => call.ie.id === ieId);
  }, [inspectionCalls]);

  // Get SLA breached calls
  const getSLABreachedCalls = useCallback(() => {
    return inspectionCalls.filter(call => call.slaBreached);
  }, [inspectionCalls]);

  // Update call status
  const updateCallStatus = useCallback((callId, newStatus) => {
    setInspectionCalls(prev => 
      prev.map(call => 
        call.id === callId ? { ...call, status: newStatus } : call
      )
    );
  }, []);

  // Reassign call
  const reassignCall = useCallback((callId, newIeId) => {
    const newIE = ies.find(ie => ie.id === newIeId);
    if (!newIE) return;
    setInspectionCalls(prev => 
      prev.map(call => 
        call.id === callId ? { ...call, ie: newIE } : call
      )
    );
  }, [ies]);

  return {
    loading,
    error,
    dashboardKPIs,
    inspectionCalls,
    ies,
    inspectionEngineers: ies, // Alias for consistency
    iePerformance,
    approvals,
    refreshData,
    getCallsByStatus,
    getCallsByIE,
    getSLABreachedCalls,
    updateCallStatus,
    reassignCall
  };
};

export default useCMData;

