/**
 * Service for Billing Stage API calls
 * TODO: Uncomment API calls for production with backend
 */

import { API_ENDPOINTS } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.BILLING;

// Billing status constants
export const BILLING_STATUS = {
    BILLING_PENDING: 'Billing Pending',
    BILL_RAISED: 'Bill Raised',
    PAYMENT_PENDING: 'Payment Pending',
    UNDER_SUSPENSE: 'Under Suspense',
    PAYMENT_DONE: 'Payment Done'
};

/**
 * Get all calls in billing stage (IC issued, not yet payment done)
 * @returns {Promise<Array>} - List of calls in billing stage
 */
export const getBillingCalls = async () => {
    const response = await fetch(`${API_BASE_URL}/calls`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch billing calls');
    const data = await response.json();
    return data.responseData || [];
};

/**
 * Raise a bill for a call
 * @param {Object} billData - { callNo, billNo, billDate, billAmount, createdBy }
 */
export const raiseBill = async (billData) => {
    const response = await fetch(`${API_BASE_URL}/raise-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.responseStatus?.message || 'Failed to raise bill');
    }
    return await response.json();
};

/**
 * Update billing status for a call
 * @param {Object} statusData - { callNo, billing_status, updatedBy }
 */
export const updateBillingStatus = async (statusData) => {
    const response = await fetch(`${API_BASE_URL}/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.responseStatus?.message || 'Failed to update billing status');
    }
    return await response.json();
};

/**
 * Mark payment as done and approve (moves to Completed)
 * @param {Object} paymentData - { callNo, paymentDate, paymentRef, approvedBy }
 */
export const approvePayment = async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/approve-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.responseStatus?.message || 'Failed to approve payment');
    }
    return await response.json();
};

/**
 * Get billing details for a specific call
 * @param {string} callNo - Call number
 */
export const getBillingByCallNo = async (callNo) => {
    const response = await fetch(`${API_BASE_URL}/${callNo}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.responseData;
};

