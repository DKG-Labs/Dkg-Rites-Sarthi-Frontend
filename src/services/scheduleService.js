/**
 * Service for Inspection Schedule API calls
 */

import { getAuthToken } from './authService';
import { API_ENDPOINTS } from './apiConfig';

const API_BASE_URL = API_ENDPOINTS.SCHEDULE;

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

/**
 * Schedule an inspection call
 * @param {Object} scheduleData - { callNo, scheduleDate, reason, createdBy }
 */
export const scheduleInspection = async (scheduleData) => {
    const response = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.responseStatus?.message || 'Failed to schedule inspection');
    }

    const data = await response.json();
    return data.responseData;
};

/**
 * Reschedule an existing inspection call
 * @param {Object} scheduleData - { callNo, scheduleDate, reason, updatedBy }
 */
export const rescheduleInspection = async (scheduleData) => {
    const response = await fetch(`${API_BASE_URL}/reschedule`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.responseStatus?.message || 'Failed to reschedule inspection');
    }

    const data = await response.json();
    return data.responseData;
};

/**
 * Get schedule status for a call
 * @param {string} callNo - Call number
 */
export const getScheduleByCallNo = async (callNo) => {
    const response = await fetch(`${API_BASE_URL}/${callNo}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.responseData;
};

/**
 * Check if a call is scheduled
 * @param {string} callNo - Call number
 */
export const isCallScheduled = async (callNo) => {
    const response = await fetch(`${API_BASE_URL}/check/${callNo}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        return false;
    }

    const data = await response.json();
    return data.responseData === true;
};

/**
 * Get all schedules
 */
export const getAllSchedules = async () => {
    const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch schedules');
    }

    const data = await response.json();
    return data.responseData || [];
};

/**
 * Maximum calls allowed to be scheduled per day
 */
export const MAX_CALLS_PER_DAY = 5;

/**
 * Count how many calls are scheduled for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<number>} - Count of calls scheduled for the date
 */
export const getScheduleCountByDate = async (date) => {
    const response = await fetch(`${API_BASE_URL}/count-by-date?date=${date}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        return 0;
    }

    const data = await response.json();
    return data.responseData || 0;
};

/**
 * Validate if more calls can be scheduled for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} additionalCalls - Number of additional calls to schedule (default 1)
 * @returns {Promise<{canSchedule: boolean, currentCount: number, remaining: number, maxLimit: number}>}
 */
export const validateScheduleLimit = async (date, additionalCalls = 1) => {
    const currentCount = await getScheduleCountByDate(date);
    const remaining = MAX_CALLS_PER_DAY - currentCount;
    const canSchedule = remaining >= additionalCalls;

    return {
        canSchedule,
        currentCount,
        remaining,
        maxLimit: MAX_CALLS_PER_DAY
    };
};

