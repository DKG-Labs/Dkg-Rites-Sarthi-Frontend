/**
 * Workflow API Service
 * Handles API calls related to workflow transitions and completed calls
 */

import { API_BASE_URL } from './apiConfig';
/**
 * Get auth headers with JWT token
 * The authService stores the token as 'authToken' in localStorage
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Fetch completed calls for a specific user (for IC issuance)
 * @param {number} userId - The user ID (createdBy)
 * @returns {Promise<Array>} Array of completed calls
 */
// In-memory promise cache to dedupe concurrent requests per user
const _completedCallsPromiseCache = {};

export const fetchCompletedCallsForIC = async (userId, forceRefresh = false) => {
  try {
    const url = `${API_BASE_URL}/callCompleteddata?createdBy=${userId}`;
    console.log('🔍 Fetching completed calls for user:', userId);
    console.log('📡 API URL:', url);

    const headers = getAuthHeaders();
    console.log('📋 Request headers:', headers);

    // If a request for this user is already in flight and no forceRefresh requested,
    // return the existing promise to avoid duplicate network requests.
    if (!forceRefresh && _completedCallsPromiseCache[userId]) {
      console.log('🔁 Reusing in-flight completed-calls request for user:', userId);
      return _completedCallsPromiseCache[userId];
    }

    const requestPromise = (async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(errorText || `Failed to fetch completed calls: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Raw API response:', data);

      // Extract responseData array
      const completedCalls = data.responseData || [];
      console.log(`📊 Found ${completedCalls.length} completed calls`);

      if (completedCalls.length > 0) {
        console.log('📋 Sample call data:', completedCalls[0]);
      }

      // Transform the data to match frontend format
      const transformedCalls = completedCalls.map(call => ({
        id: call.workflowTransitionId,
        call_no: call.requestId,
        // Generate IC Number using nomenclature: RIO_Short/RequestId/IE_Short
        icNo: generateICNumber(call.rio, call.requestId),
        po_no: call.poNo,
        vendor_name: call.vendorName,
        product_type: call.productType,
        requested_date: call.createdDate,
        stage: call.stage,
        // Map INSPECTION_COMPLETE_CONFIRM to IC_PENDING for display
        status: call.status === 'INSPECTION_COMPLETE_CONFIRM' ? 'IC_PENDING' : call.status,
        displayStatus: 'IC Pending', // User-friendly display status
        originalStatus: call.status, // Keep original status for reference
        action: call.action,
        remarks: call.remarks,
        jobStatus: call.jobStatus,
        currentRole: call.currentRoleName,
        nextRole: call.nextRoleName,
        assignedToUser: call.assignedToUser,
        createdBy: call.createdBy,
        modifiedBy: call.modifiedBy,
        workflowId: call.workflowId,
        transitionId: call.transitionId,
        workflowSequence: call.workflowSequence,
        rio: call.rio // Keep RIO for reference
      }));

      console.log('✅ Transformed calls:', transformedCalls);
      return transformedCalls;
    })();

    // Store promise in cache and ensure removal on settled (so forceRefresh can work later)
    _completedCallsPromiseCache[userId] = requestPromise;
    requestPromise.finally(() => {
      delete _completedCallsPromiseCache[userId];
    });

    return requestPromise;
  } catch (error) {
    console.error('❌ Error fetching completed calls:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Get current user ID from localStorage
 * The authentication system stores userId directly in localStorage after login
 * @returns {string|null} User ID or null if not found
 */
export const getCurrentUserId = () => {
  try {
    console.log('🔍 Checking localStorage for user ID...');

    // The authService stores userId directly in localStorage
    const userId = localStorage.getItem('userId');

    if (userId) {
      console.log('✅ Found user ID from localStorage:', userId);
      return userId;
    }

    console.warn('⚠️ User ID not found in localStorage. User may not be logged in.');
    console.log('Available localStorage keys:', Object.keys(localStorage));
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
  }
  return null;
};

/**
 * Generate IC (Inspection Certificate) number based on nomenclature
 * Format: {RIO_Short_Name}/{Inspection_Call_Number}/{IE_Short_Name}
 * Example: N/RM-IC-1767618858167/UD
 *
 * @param {string} rio - RIO value from API response (e.g., "NRIO", "ERIO")
 * @param {string} requestId - Inspection call number (e.g., "RM-IC-1767618858167")
 * @returns {string} Generated IC number
 */
export const generateICNumber = (rio, requestId) => {
  try {
    // Extract RIO short name (first letter)
    // NRIO -> N, ERIO -> E
    const rioShortName = rio ? rio.charAt(0).toUpperCase() : '';

    // Get IE short name from localStorage
    const ieShortName = localStorage.getItem('shortName') || '';

    // Generate IC number: RIO_Short/RequestId/IE_Short
    const icNumber = `${rioShortName}/${requestId}/${ieShortName}`;

    console.log('📋 Generated IC Number:', icNumber);
    console.log('  - RIO:', rio, '→', rioShortName);
    console.log('  - Request ID:', requestId);
    console.log('  - IE Short Name:', ieShortName);

    return icNumber;
  } catch (error) {
    console.error('❌ Error generating IC number:', error);
    return requestId; // Fallback to request ID
  }
};

