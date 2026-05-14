/**
 * useCallActions Hook
 * Hook for Call Desk actions (verify, return, re-route)
 */

import { useState, useCallback } from 'react';

import axios from 'axios';
import { getStoredUser, getAuthHeaders } from '../../../services/authService';
import { API_BASE_URL } from '../../../services/apiConfig';

const BASE_URL = API_BASE_URL;


/**
 * Custom hook for Call Desk actions
 */
export const useCallActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  /**
 * Verify and accept a call (REAL API)
 */
  const verifyAndAccept = async (workflowTransitionId, selectedCall, remarks, newIeId, callType = 'ERC') => {
    try {
      setLoading(true);
      setError(null);

      const user = getStoredUser();

      //  API payload
      let payload;
      let endpoint;

      if (callType === 'SLEEPER') {
        payload = {
          workflowTransitionId: Number(workflowTransitionId),
          requestId: selectedCall.callNumber,
          action: 'VERIFY',
          remarks: remarks || null,
          actionBy: Number(user.userId)
        };
        endpoint = `${API_BASE_URL}/api/sleeper-workflow/performTransitionAction`;
      } else if (callType === 'RAILPAD') {
        payload = {
          workflowTransitionId: Number(workflowTransitionId),
          requestId: selectedCall.callNumber,
          action: 'VERIFY',
          remarks: remarks || null,
          actionBy: Number(user.userId)
        };
        endpoint = `${API_BASE_URL}/api/railpad-workflow/performTransitionAction`;
      } else {
        payload = {
          workflowTransitionId: workflowTransitionId,
          requestId: selectedCall.callNumber,
          action: 'VERIFY',
          remarks: remarks || null,
          actionBy: Number(user.userId),
          pincode: null,
          assignUserId: newIeId ? Number(newIeId) : null
        };
        endpoint = `${API_BASE_URL}/performTransitionAction`;
      }


      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        }
      );


      if (response.data?.responseStatus?.statusCode !== 0) {
        throw new Error(
          response.data?.responseStatus?.message || 'Verify failed'
        );
      }


      return {
        success: true,
        message: 'Call verified successfully',
      };

    } catch (err) {
      setError(err.message || 'Failed to verify call');
      return {
        success: false,
        message: err.message || 'Failed to verify call',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Return call for rectification
   *//**
* Return call to vendor (REAL API)
*/
  const returnForRectification = async (
    workflowTransitionId,
    selectedCall,
    remarks,
    flaggedFields = [],
    callType = 'ERC'
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!remarks || !remarks.trim()) {
        throw new Error('Remarks are mandatory for returning a call');
      }

      const user = getStoredUser();

      //  API payload
      let payload;
      let endpoint;

      if (callType === 'SLEEPER') {
        payload = {
          workflowTransitionId: Number(workflowTransitionId),
          requestId: selectedCall.callNumber,
          action: 'RETURN_TO_VENDOR',
          remarks: remarks,
          actionBy: Number(user.userId)
        };
        endpoint = `${API_BASE_URL}/api/sleeper-workflow/performTransitionAction`;
      } else if (callType === 'RAILPAD') {
        payload = {
          workflowTransitionId: Number(workflowTransitionId),
          requestId: selectedCall.callNumber,
          action: 'RETURN_TO_VENDOR',
          remarks: remarks,
          actionBy: Number(user.userId)
        };
        endpoint = `${API_BASE_URL}/api/railpad-workflow/performTransitionAction`;
      } else {
        payload = {
          workflowTransitionId: workflowTransitionId,
          requestId: selectedCall.callNumber,
          action: 'RETURN_TO_VENDOR',
          remarks: remarks,
          actionBy: Number(user.userId),
          pincode: null,
        };
        endpoint = `${BASE_URL}/performTransitionAction`;
      }

      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        }
      );

      if (response.data?.responseStatus?.statusCode !== 0) {
        throw new Error(
          response.data?.responseStatus?.message || 'Return failed'
        );
      }

      return {
        success: true,
        message: 'Call returned to vendor successfully',
      };

    } catch (err) {
      setError(err.message || 'Failed to return call');
      return {
        success: false,
        message: err.message || 'Failed to return call',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Re-route call to another RIO
   *//**
* Re-route call to another RIO (REAL API)
*/

  const rerouteToRIO = async (
    workflowTransitionId,
    selectedCall,
    targetRIO,
    remarks,
    callType = 'ERC'
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!targetRIO) {
        throw new Error('Target RIO is required');
      }
      if (!remarks || !remarks.trim()) {
        throw new Error('Remarks are mandatory for re-routing');
      }

      const user = getStoredUser();

      let payload;
      let endpoint;

      if (callType === 'SLEEPER') {
        payload = {
          workflowTransitionId: Number(workflowTransitionId),
          requestId: selectedCall.callNumber,
          action: 'FIX_ROUTING',
          remarks,
          actionBy: Number(user.userId),
          rioRouteChange: targetRIO,
        };
        endpoint = `${API_BASE_URL}/api/sleeper-workflow/performTransitionAction`;
      } else if (callType === 'RAILPAD') {
        payload = {
          workflowTransitionId: Number(workflowTransitionId),
          requestId: selectedCall.callNumber,
          action: 'FIX_ROUTING',
          remarks,
          actionBy: Number(user.userId),
          rioRouteChange: targetRIO,
        };
        endpoint = `${API_BASE_URL}/api/railpad-workflow/performTransitionAction`;
      } else {
        payload = {
          workflowTransitionId,
          requestId: selectedCall.callNumber,
          action: 'FIX_ROUTING',
          remarks,
          actionBy: Number(user.userId),
          pincode: null,
          rioRouteChange: targetRIO,
        };
        endpoint = `${BASE_URL}/performTransitionAction`;
      }

      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        }
      );

      if (response.data?.responseStatus?.statusCode !== 0) {
        throw new Error(response.data?.responseStatus?.message);
      }

      return { success: true };

    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };




  /**
   * View call details
   */
  const viewCallDetails = (callId) => {
    // This would typically fetch detailed call information
    console.log('Viewing call details:', callId);
    return {
      success: true,
      callId
    };
  };

  /**
   * View call history
   */
  /**
  * Fetch workflow transition history (REAL API)
  */
  const viewCallHistory = async (requestId, callType = 'ERC') => {
    const endpoint = callType === 'SLEEPER'
      ? `${BASE_URL}/api/sleeper-workflow/WorkflowTransitionHistory`
      : callType === 'RAILPAD'
      ? `${BASE_URL}/api/railpad-workflow/WorkflowTransitionHistory`
      : `${BASE_URL}/workflowTransitionHistory`;

    const response = await axios.get(
      endpoint,
      {
        params: { requestId },
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (response.data?.responseStatus?.statusCode !== 0) {
      throw new Error('Failed to fetch call history');
    }

    // Map backend response to UI table format
    return response.data.responseData.map(item => ({
      action: item.action || '-',
      status: item.status || '-',
      createdBy: item.createdBy || '-',
      updatedBy: item.modifiedBy || '-',
      createdDate: item.createdDate,
    }));
  };


  /**
   * Fetch all IEs (REAL API)
   */
  const fetchAllIEs = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/auth/api/users/by-role`,
        {
          params: { roleName: 'IE' },
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (response.data?.responseStatus?.statusCode !== 0) {
        throw new Error('Failed to fetch IEs');
      }

      return response.data.responseData.map(user => ({
        id: user.userId,
        name: user.fullName || user.userName,
        employeeCode: user.employeeCode,
        shortName: user.shortName,
        roleName: user.roleName
      }));
    } catch (err) {
      console.error('Error fetching IEs:', err);
      return [];
    }
  }, []);

  return {
    // State
    loading,
    error,

    // Actions
    verifyAndAccept,
    returnForRectification,
    rerouteToRIO,
    viewCallDetails,
    viewCallHistory,
    fetchAllIEs
  };
};

export default useCallActions;


