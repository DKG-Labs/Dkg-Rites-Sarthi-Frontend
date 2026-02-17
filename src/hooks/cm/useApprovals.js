/**
 * useApprovals Hook
 * Custom hook for managing approval requests
 */

import { useState, useEffect, useCallback } from 'react';
import { MOCK_APPROVALS } from '../../utils/cm/mockData';

export const useApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvalRequests, setApprovalRequests] = useState(MOCK_APPROVALS);
  const [selectedApproval, setSelectedApproval] = useState(null);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        setApprovalRequests(MOCK_APPROVALS);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, []);

  const getPendingApprovals = useCallback(() => {
    return approvalRequests.filter(req => req.status === 'pending');
  }, [approvalRequests]);

  const getApprovalsByType = useCallback((type) => {
    return approvalRequests.filter(req => req.type === type);
  }, [approvalRequests]);

  const approveRequest = useCallback(async (approvalId, remarks) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setApprovalRequests(prev =>
        prev.map(req =>
          req.id === approvalId
            ? { ...req, status: 'approved', approvedDate: new Date().toISOString(), remarks }
            : req
        )
      );
      return { success: true, message: 'Request approved successfully' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectRequest = useCallback(async (approvalId, remarks) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setApprovalRequests(prev =>
        prev.map(req =>
          req.id === approvalId
            ? { ...req, status: 'rejected', rejectedDate: new Date().toISOString(), remarks }
            : req
        )
      );
      return { success: true, message: 'Request rejected successfully' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const forwardRequest = useCallback(async (approvalId, remarks) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setApprovalRequests(prev =>
        prev.map(req =>
          req.id === approvalId
            ? { ...req, status: 'forwarded', forwardedDate: new Date().toISOString(), remarks }
            : req
        )
      );
      return { success: true, message: 'Request forwarded successfully' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    approvalRequests,
    selectedApproval,
    setSelectedApproval,
    getPendingApprovals,
    getApprovalsByType,
    approveRequest,
    rejectRequest,
    forwardRequest
  };
};

export default useApprovals;

