/**
 * useCallActions Hook
 * Hook for Call Desk actions (verify, return, re-route)
 */

import { useState } from 'react';

import axios from 'axios';
import { getStoredUser, getAuthHeaders } from '../../../services/authService';
const BASE_URL =
  'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend';


/**
 * Custom hook for Call Desk actions
 */
export const useCallActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  /**
 * Verify and accept a call (REAL API)
 */
const verifyAndAccept = async (workflowTransitionId,selectedCall, remarks) => {
  try {
    setLoading(true);
    setError(null);

    const user = getStoredUser();

    //  API payload
    const payload = {
      workflowTransitionId: workflowTransitionId,
      requestId: selectedCall.callNumber,
      action: 'VERIFY',
      remarks: remarks || null,
      actionBy: Number(user.userId),
      pincode: null,
    };

  
    const response = await axios.post(
      'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/performTransitionAction',
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
  flaggedFields = []
) => {
  try {
    setLoading(true);
    setError(null);

    if (!remarks || !remarks.trim()) {
      throw new Error('Remarks are mandatory for returning a call');
    }

    const user = getStoredUser();

    //  API payload
    const payload = {
      workflowTransitionId: workflowTransitionId,
      requestId: selectedCall.callNumber,
      action: 'RETURN_TO_VENDOR', 
      remarks: remarks,
      actionBy: Number(user.userId),
      pincode: null,
    };

    const response = await axios.post(
      `${BASE_URL}/performTransitionAction`,
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
  remarks
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

    const payload = {
      workflowTransitionId,
      requestId: selectedCall.callNumber,
      action: 'FIX_ROUTING',
      remarks,
      actionBy: Number(user.userId),
      pincode: null,
      rioRouteChange: targetRIO,
    };

    const response = await axios.post(
      `${BASE_URL}/performTransitionAction`,
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
const viewCallHistory = async (requestId) => {
  const response = await axios.get(
    `${BASE_URL}/workflowTransitionHistory`,
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


  return {
    // State
    loading,
    error,
    
    // Actions
    verifyAndAccept,
    returnForRectification,
    rerouteToRIO,
    viewCallDetails,
    viewCallHistory
  };
};

export default useCallActions;

