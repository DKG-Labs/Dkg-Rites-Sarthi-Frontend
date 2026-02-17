/**
 * Inspection Session Control
 * 
 * Provides a global flag to coordinate session end across all components.
 * When an inspection is finished/completed/withheld, this flag blocks all
 * autosave and unmount persistence to prevent cache recreation.
 * 
 * This is a singleton pattern - the flag is shared across all components.
 */

// Global session state
let sessionEnded = false;

/**
 * Mark the current inspection session as ended.
 * This blocks all future saves to localStorage/sessionStorage.
 * 
 * Called by:
 * - Finish Inspection handler
 * - Shift Complete handler
 * - Withhold handler
 * - Logout handler (if applicable)
 */
export const markSessionAsEnded = () => {
    sessionEnded = true;
    console.log('🛑 Inspection session marked as ended - blocking all saves');
};

/**
 * Check if the current inspection session has ended.
 * 
 * Used by:
 * - Submodule autosave handlers
 * - Unmount save handlers
 * - Any persistence logic that should respect session end
 * 
 * @returns {boolean} true if session has ended, false otherwise
 */
export const isSessionEnded = () => {
    return sessionEnded;
};

/**
 * Reset the session control flag.
 * 
 * Called when:
 * - Starting a new inspection (dashboard mount)
 * - Navigating to a new inspection call
 * - After cleanup is complete and user returns to landing page
 */
export const resetSessionControl = () => {
    sessionEnded = false;
    console.log('✅ Session control reset - saves enabled');
};

/**
 * Get current session state (for debugging)
 */
export const getSessionState = () => {
    return {
        sessionEnded,
        timestamp: new Date().toISOString()
    };
};
