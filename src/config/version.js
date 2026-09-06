/**
 * Sarthi Application Version Configuration
 * Manages active build version and acknowledged client version across updates.
 */

export const getActiveAppVersion = () => {
  try {
    const acknowledged = localStorage.getItem('sarthi_acknowledged_version');
    if (acknowledged && acknowledged !== 'undefined' && acknowledged !== 'null') {
      return acknowledged;
    }
  } catch (e) {
    // Ignore localStorage access issues in restricted modes
  }
  return process.env.REACT_APP_VERSION || '1.0.0';
};

export const setAcknowledgedVersion = (version) => {
  try {
    if (version) {
      localStorage.setItem('sarthi_acknowledged_version', String(version).trim());
    }
  } catch (e) {
    // Ignore localStorage access issues
  }
};

export const APP_VERSION = getActiveAppVersion();
export const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || null;
export const GIT_COMMIT = process.env.REACT_APP_GIT_COMMIT || 'dev';
