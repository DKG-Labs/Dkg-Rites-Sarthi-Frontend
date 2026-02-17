/**
 * Line Mapping Utilities
 * 
 * Provides mapping between internal line IDs (for persistence) and display labels (for UI).
 * Maintains backward compatibility with existing storage while supporting custom line numbers.
 */

/**
 * Generate display label for a production line
 * @param {number} lineNumber - User-selected line number (1-5)
 * @param {string} callNo - Inspection call number
 * @returns {string} Display label (e.g., "Line-3 (EP-01270001)")
 */
export const getLineDisplayLabel = (lineNumber, callNo) => {
    if (!lineNumber || !callNo) return '';
    return `Line-${lineNumber} (${callNo})`;
};

/**
 * Get internal line ID for persistence
 * @param {number} index - Array index of production line
 * @returns {string} Internal line ID (e.g., "Line-1")
 */
export const getInternalLineId = (index) => {
    return `Line-${index + 1}`;
};

/**
 * Build line mapping for all production lines
 * @param {Array} productionLines - Array of production line objects
 * @returns {Object} Mapping of internal IDs to display info
 * 
 * Example output:
 * {
 *   'Line-1': {
 *     displayNumber: 3,
 *     callNo: 'EP-01270001',
 *     displayLabel: 'Line-3 (EP-01270001)',
 *     index: 0
 *   },
 *   'Line-2': {
 *     displayNumber: 3,
 *     callNo: 'EP-01270002',
 *     displayLabel: 'Line-3 (EP-01270002)',
 *     index: 1
 *   }
 * }
 */
export const buildLineMapping = (productionLines) => {
    const mapping = {};

    productionLines.forEach((line, index) => {
        if (!line) return; // Skip undefined/null lines

        const internalId = getInternalLineId(index);
        const displayNumber = line?.lineNumber || (index + 1); // Backward compatibility
        const callNo = line?.icNumber || '';

        mapping[internalId] = {
            displayNumber,
            callNo,
            displayLabel: getLineDisplayLabel(displayNumber, callNo),
            index
        };
    });

    return mapping;
};

/**
 * Validate line number uniqueness per call
 * @param {Array} productionLines - Array of production line objects
 * @param {number} lineIndex - Index of line being validated
 * @param {number} selectedNumber - Line number being selected
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateLineNumber = (productionLines, lineIndex, selectedNumber) => {
    const currentLine = productionLines[lineIndex];
    const currentCallNo = currentLine?.icNumber;

    if (!currentCallNo) {
        return {
            isValid: false,
            error: 'Please select a call number first'
        };
    }

    // Check for duplicates in same call
    const isDuplicate = productionLines.some((line, idx) =>
        line && typeof line === 'object' && // Safely handle null/undefined lines in array
        idx !== lineIndex &&
        line.icNumber === currentCallNo &&
        line.lineNumber === selectedNumber
    );

    if (isDuplicate) {
        return {
            isValid: false,
            error: `Line ${selectedNumber} already used for ${currentCallNo}`
        };
    }

    return { isValid: true, error: null };
};
