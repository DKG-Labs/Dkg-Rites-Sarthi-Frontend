/**
 * Workflow Service
 * Handles workflow transition API calls
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Request caching with TTL
 * - Timeout handling for slow Azure API
 * - Uses vendor name directly from workflow API (no additional PO API calls)
 */

import { getAuthToken, getStoredUser } from './authService';
import { cleanVendorName } from './poDataService';
import { processVendorName } from '../utils/vendorMapper';
import { API_BASE_URL } from './apiConfig';

/**
 * Get auth headers with JWT token
 */
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// In-memory cache for workflow transitions
const workflowCache = new Map();
const WORKFLOW_CACHE_TTL = 2 * 60 * 1000; // 2 minutes (shorter than PO cache)

// Request deduplication - prevent duplicate API calls (React StrictMode causes double renders)
const pendingRequests = new Map();

/**
 * Clear workflow cache (useful after scheduling or status changes)
 */
export const clearWorkflowCache = () => {
  workflowCache.clear();
};

/**
 * Fetch with timeout to prevent indefinite waiting
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 30 seconds)
 * @returns {Promise<Response>} Fetch response
 */
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

/**
 * Fetch all pending workflow transitions for a given role
 * Uses caching to reduce repeated API calls
 *
 * @param {string} roleName - Role name (e.g., 'IE')
 * @param {boolean} forceRefresh - Force refresh from API (skip cache)
 * @returns {Promise<Array>} List of pending workflow transitions
 */
export const fetchPendingWorkflowTransitions = async (roleName, forceRefresh = false) => {
  const cacheKey = `workflow_${roleName}`;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = workflowCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < WORKFLOW_CACHE_TTL) {
      return cached.data;
    }
  }

  // Deduplication: If a request is already in progress, return the same promise
  // This prevents React StrictMode from making duplicate API calls
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/allPendingWorkflowTransition?roleName=${encodeURIComponent(roleName)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        },
        30000 // 30 second timeout
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.responseStatus?.message || 'Failed to fetch pending transitions');
      }

      // Check for successful status (statusCode === 0 means success)
      if (data.responseStatus?.statusCode !== 0) {
        throw new Error(data.responseStatus?.message || 'Failed to fetch pending transitions');
      }

      const transitions = data.responseData || [];

      // Store in cache
      workflowCache.set(cacheKey, {
        data: transitions,
        timestamp: Date.now()
      });

      return transitions;
    } catch (error) {
      console.error('Error fetching pending workflow transitions:', error);
      throw error;
    } finally {
      // Remove from pending requests after completion (success or failure)
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store the promise in pending requests
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
};

/**
 * Fetch pending workflow transitions filtered by current user
 * Filters results where assignedToUser matches logged-in user's userId (for Raw Material)
 * OR where userId is in processIes/finalIes arrays (for Process/Final)
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Uses caching to prevent duplicate API calls
 * - Uses vendor name directly from workflow API (no additional PO API calls)
 * - Timeout handling for Azure API
 *
 * @param {boolean} forceRefresh - Force refresh from API (skip cache)
 * @returns {Promise<Array>} Filtered list of pending workflow transitions
 */
export const fetchUserPendingCalls = async (forceRefresh = false) => {
  try {
    const user = getStoredUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const roleName = user.roleName;
    const userId = parseInt(user.userId, 10);

    const allTransitions = await fetchPendingWorkflowTransitions(roleName, forceRefresh);

    // Filter transitions based on product type:
    // - Raw Material: assignedToUser matches logged-in userId
    // - Process: userId is in processIes array
    // - Final: userId is in finalIes array
    const userTransitions = allTransitions.filter((transition) => {
      const productType = transition.productType;

      if (productType === 'Raw Material') {
        return transition.assignedToUser === userId;
      } else if (productType === 'Process') {
        return Array.isArray(transition.processIes) && transition.processIes.includes(userId);
      } else if (productType === 'Final') {
        return Array.isArray(transition.finalIes) && transition.finalIes.includes(userId);
      }

      // Default: fallback to assignedToUser for unknown product types
      return transition.assignedToUser === userId;
    });

    // Transform API response - use vendor name directly from workflow API
    const transformedCalls = userTransitions.map((transition) => {
      // Process vendor name - handle vendor codes (e.g., ":13104") and regular names
      let vendorName = transition.vendorName;

      if (vendorName && typeof vendorName === 'string' && vendorName.trim() !== '') {
        // First, check if it's a vendor code and convert it
        vendorName = processVendorName(vendorName);
        // Then clean the vendor name (remove extra spaces, etc.)
        vendorName = cleanVendorName(vendorName);
      } else {
        // Explicit fallback when vendor name is null/empty per requirement
        vendorName = 'SHIVAM HIGHRISE PVT. LTD';
      }

      return {
        id: transition.workflowTransitionId,
        call_no: transition.requestId,
        workflowId: transition.workflowId,
        transitionId: transition.transitionId,
        status: transition.status, // Use actual workflow status from API
        action: transition.action,
        remarks: transition.remarks,
        currentRole: transition.currentRole,
        nextRole: transition.nextRole,
        createdBy: transition.createdBy,
        createdDate: transition.createdDate,
        workflowSequence: transition.workflowSequence,
        assignedToUser: transition.assignedToUser,
        // Map API fields to table fields
        po_no: transition.poNo || '-',
        vendor_name: vendorName,
        product_type: transition.productType || '-',
        call_date: transition.createdDate ? transition.createdDate.split('T')[0] : null,
        desired_inspection_date: transition.desiredInspectionDate || null,
        // Keep processIes and finalIes for reference
        processIes: transition.processIes,
        finalIes: transition.finalIes,
      };
    });

    return transformedCalls;
  } catch (error) {
    console.error('Error fetching user pending calls:', error);
    throw error;
  }
};

/**
 * Perform workflow transition action (e.g., INITIATE_INSPECTION)
 * Azure API: POST /performTransitionAction
 * @param {Object} actionData - { workflowTransitionId, requestId, action, remarks, actionBy, pincode }
 * @returns {Promise<Object>} Workflow transition result
 */
export const performTransitionAction = async (actionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/performTransitionAction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(actionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.responseStatus?.message || 'Failed to perform transition action');
    }

    const data = await response.json();
    return data.responseData;
  } catch (error) {
    console.error('Error performing transition action:', error);
    throw error;
  }
};

// Local API (commented out)
// export const performTransitionActionLocal = async (actionData) => {
//   try {
//     const response = await fetch('http://localhost:8081/sarthi-backend/performTransitionAction', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(actionData),
//     });
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.responseStatus?.message || 'Failed to perform transition action');
//     }
//     const data = await response.json();
//     return data.responseData;
//   } catch (error) {
//     console.error('Error performing transition action:', error);
//     throw error;
//   }
// };

/**
 * Fetch the latest workflow transition for a specific requestId
 * Azure API: GET /workflowTransitionHistory?requestId={requestId}
 * @param {string} requestId - The request ID (call number)
 * @returns {Promise<Object|null>} Latest workflow transition or null
 */
export const fetchLatestWorkflowTransition = async (requestId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/workflowTransitionHistory?requestId=${encodeURIComponent(requestId)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.responseStatus?.message || 'Failed to fetch workflow transition history');
    }

    const data = await response.json();

    // Check for successful status (statusCode === 0 means success)
    if (data.responseStatus?.statusCode !== 0) {
      throw new Error(data.responseStatus?.message || 'Failed to fetch workflow transition history');
    }

    const transitions = data.responseData || [];

    if (transitions.length === 0) {
      console.warn(`⚠️ No workflow transitions found for ${requestId}`);
      return null;
    }

    // Get the latest transition (highest workflowTransitionId)
    const latestTransition = transitions.reduce((latest, current) => {
      return (current.workflowTransitionId > latest.workflowTransitionId) ? current : latest;
    }, transitions[0]);

    return latestTransition;
  } catch (error) {
    console.error(`Error fetching latest workflow transition for ${requestId}:`, error);
    throw error;
  }
};
