/**
 * Sarthi Application Version Configuration
 * Reads CRA environment variables injected during build time.
 */
export const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';
export const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || null;
export const GIT_COMMIT = process.env.REACT_APP_GIT_COMMIT || 'dev';
