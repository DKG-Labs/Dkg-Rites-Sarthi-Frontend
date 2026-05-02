import { API_BASE_URL } from './apiConfig';
import { getAuthHeaders } from './authService';

/**
 * Feedback Service
 * Handles API calls for the generic feedback system
 */

export const submitFeedback = async (feedbackData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/feedback/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(feedbackData),
        });
        if (!response.ok) throw new Error('Failed to submit feedback');
        return await response.json();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
    }
};

export const replyToFeedback = async (feedbackId, replyData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/feedback/${feedbackId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(replyData),
        });
        if (!response.ok) throw new Error('Failed to post reply');
        return await response.json();
    } catch (error) {
        console.error('Error posting reply:', error);
        throw error;
    }
};

export const getUserFeedback = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/feedback/user/${userId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch user feedback');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user feedback:', error);
        throw error;
    }
};

export const getAllFeedback = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/feedback/all`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch all feedback');
        return await response.json();
    } catch (error) {
        console.error('Error fetching all feedback:', error);
        throw error;
    }
};
