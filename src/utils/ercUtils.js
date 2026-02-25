/**
 * ERC Utility Functions
 * Standardizes product types and models across inspection modules
 */

/**
 * Helper to normalize ERC Type string from backend
 * Handles variations like: "MK III", "mk-iii", "mark 3", "mk 3", "erc mk iii", "mk-v", etc.
 * @param {string} typeStr - The raw product type string from backend
 * @returns {string} Normalized code: 'MK-III', 'MK-V', or 'ERC-J'
 */
export const normalizeErcType = (typeStr) => {
    if (!typeStr) return 'MK-III'; // Default fallback

    const lower = typeStr.toLowerCase().trim();

    // MK-V variations
    if (
        lower.includes('mk-v') ||
        lower.includes('mk v') ||
        lower.includes('mark v') ||
        lower.includes('mark 5') ||
        lower.includes('mk 5') ||
        lower === '6025' // Special case if code is used
    ) {
        return 'MK-V';
    }

    // ERC-J variations
    if (
        lower.includes('erc-j') ||
        lower.includes('erc j') ||
        lower.includes('j-type') ||
        lower.includes('j type') ||
        lower.includes('jtype')
    ) {
        return 'ERC-J';
    }

    // MK-III variations (default for others)
    // Check for MK-III explicitly last or treat as default
    if (
        lower.includes('mk-iii') ||
        lower.includes('mk iii') ||
        lower.includes('mark iii') ||
        lower.includes('mark 3') ||
        lower.includes('mk 3') ||
        lower === '3701' // Special case if code is used
    ) {
        return 'MK-III';
    }

    return 'MK-III'; // Default safe fallback
};
