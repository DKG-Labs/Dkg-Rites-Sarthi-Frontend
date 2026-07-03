/* eslint-disable */
/**
 * Utility functions for handling image URLs in LAN environment
 */

/**
 * Get the appropriate base URL based on current environment
 * @returns {string} Base URL for API calls
 */
export const getBaseUrl = () => {
  return window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "http://10.145.222.6:8080";
};

/**
 * Convert a local file path to a server image URL
 * @param {string} imagePath - Local file path or existing URL
 * @returns {string} Server image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '';
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Convert local path to server URL
  const baseUrl = getBaseUrl();
  return `${baseUrl}/dashboard/images?path=${encodeURIComponent(imagePath)}`;
};

/**
 * Check if a file path is a supported image format
 * @param {string} path - File path
 * @returns {boolean} True if supported image format
 */
export const isSupportedImageFormat = (path) => {
  if (!path) return false;

  const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const extension = path.toLowerCase().split('.').pop();
  return supportedFormats.includes(`.${extension}`);
};

/**
 * Get filename from a path
 * @param {string} path - File path
 * @returns {string} Filename
 */
export const getFileName = (path) => {
  if (!path) return '';
  return path.split('/').pop() || path.split('\\').pop() || path;
};


