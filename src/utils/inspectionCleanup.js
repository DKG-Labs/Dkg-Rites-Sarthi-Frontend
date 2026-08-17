/**
 * Inspection Cleanup Utility
 * 
 * Centralized cleanup logic for Process Inspection Dashboard.
 * Ensures consistent cleanup across all finish scenarios:
 * - Finish Inspection
 * - Shift Complete
 * - Withhold
 * - Logout (if applicable)
 * 
 * This utility coordinates with inspectionSessionControl to block
 * persistence before clearing data, preventing cache recreation.
 */

import { clearAllProcessData } from '../services/processLocalStorageService';
import { markSessionAsEnded } from './inspectionSessionControl';

const DASHBOARD_DRAFT_KEY = 'process_dashboard_draft_';

/**
 * Perform comprehensive cleanup for inspection session end.
 * 
 * @param {string} inspectionCallNo - Main inspection call number
 * @param {Array} productionLines - Array of production line objects
 * @param {Array} manufacturingLines - Array of line names ['Line-1', ...]
 * @param {string} shift - Specific shift to clear
 * @param {boolean} clearAllShifts - If true, clears data for ALL shifts of this call
 */
export const performInspectionCleanup = (inspectionCallNo, productionLines, manufacturingLines, shift = '', clearAllShifts = false) => {
    console.log(`🧹 [Cleanup] Starting cleanup (shift: ${shift || 'any'}, allShifts: ${clearAllShifts})`);

    // Step 1: Block all future saves
    markSessionAsEnded();

    const normCallNo = inspectionCallNo ? String(inspectionCallNo).replace(/[-_/]/g, '').toLowerCase() : '';
    const allCallNumbers = new Set();
    if (inspectionCallNo) allCallNumbers.add(inspectionCallNo);
    if (productionLines && Array.isArray(productionLines)) {
        productionLines.forEach(p => {
            if (p?.icNumber) allCallNumbers.add(p.icNumber);
            if (p?.call_no) allCallNumbers.add(p.call_no);
        });
    }

    // Step 2: Clear session storage
    try {
        const sessionKeys = [
            'processProductionLinesData',
            'processSelectedLineTab',
            'processFinalInspectionRemarks',
            'additionalInitiatedCalls',
            'processSelectedLotByLine',
            'processCallInitiationDataCache',
            'processManufacturedQtyByLine',
            'process_shift_completed'
        ];

        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (!key) continue;

            const isProcessKey = sessionKeys.some(base => key === base || key.startsWith(`${base}_`));
            if (isProcessKey) {
                if (clearAllShifts) {
                    sessionKeysToRemove.push(key);
                } else {
                    const normKey = key.toLowerCase();
                    const matchesCall = !normCallNo || normKey.replace(/[-_/]/g, '').includes(normCallNo);
                    const matchesShift = !shift || normKey.includes(`_${shift.toLowerCase()}`);
                    if (matchesCall || matchesShift || sessionKeys.includes(key)) {
                        sessionKeysToRemove.push(key);
                    }
                }
            }
        }
        sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
        console.log(`✅ [Cleanup] Cleared ${sessionKeysToRemove.length} sessionStorage keys`);
    } catch (error) {
        console.error('❌ [Cleanup] Error clearing sessionStorage:', error);
    }

    // Step 2b: Clear process dashboard state keys from localStorage
    try {
        const sessionKeys = [
            'processProductionLinesData',
            'processSelectedLineTab',
            'processFinalInspectionRemarks',
            'additionalInitiatedCalls',
            'processSelectedLotByLine',
            'processCallInitiationDataCache',
            'processManufacturedQtyByLine',
            'process_shift_completed'
        ];

        const localKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            const isProcessKey = sessionKeys.some(base => key === base || key.startsWith(`${base}_`) || key.includes(base));
            if (isProcessKey) {
                if (clearAllShifts) {
                    localKeysToRemove.push(key);
                } else {
                    const normKey = key.toLowerCase();
                    const matchesCall = !normCallNo || normKey.replace(/[-_/]/g, '').includes(normCallNo);
                    const matchesShift = !shift || normKey.includes(`_${shift.toLowerCase()}`);
                    if (matchesCall || matchesShift) {
                        localKeysToRemove.push(key);
                    }
                }
            }
        }
        localKeysToRemove.forEach(k => localStorage.removeItem(k));
        console.log(`✅ [Cleanup] Cleared ${localKeysToRemove.length} localStorage dashboard state keys`);
    } catch (error) {
        console.error('❌ [Cleanup] Error clearing localStorage dashboard state:', error);
    }

    // Step 3: Clear localStorage for all lines
    if (manufacturingLines && productionLines) {
        manufacturingLines.forEach(line => {
            productionLines.forEach((prodLine) => {
                const poNo = prodLine?.po_no || prodLine?.poNumber || '';
                const callNo = prodLine?.icNumber || prodLine?.call_no || inspectionCallNo;

                if (callNo) {
                    try {
                        clearAllProcessData(callNo, poNo, line, shift, clearAllShifts);
                    } catch (error) {
                        console.error(`❌ [Cleanup] Error clearing data for ${line}:`, error);
                    }
                }
            });
        });
    }

    // Fallback: Also clear directly for main inspection call
    if (inspectionCallNo) {
        ['Line-1', 'Line-2', 'Line-3', 'Line-4', 'Line-5'].forEach(line => {
            try {
                clearAllProcessData(inspectionCallNo, '', line, shift, clearAllShifts);
            } catch (e) {}
        });
    }

    // Step 4: Clear dashboard drafts (all matching variants including shift suffixes)
    try {
        const draftKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(DASHBOARD_DRAFT_KEY)) continue;

            const normKey = key.toLowerCase().replace(/[-_/]/g, '');
            const matchesAnyCall = Array.from(allCallNumbers).some(c => normKey.includes(String(c).toLowerCase().replace(/[-_/]/g, '')));

            if (matchesAnyCall || !inspectionCallNo) {
                if (clearAllShifts || !shift || key.toLowerCase().includes(`_${shift.toLowerCase()}`) || !key.includes('_')) {
                    draftKeysToRemove.push(key);
                }
            }
        }
        draftKeysToRemove.forEach(k => {
            localStorage.removeItem(k);
            console.log(`🧹 [Cleanup] Removed draft key: ${k}`);
        });

        // Remove draft images from IndexedDB
        import('../utils/imageStorage').then(({ removeImages }) => {
            draftKeysToRemove.forEach(k => removeImages(k).catch(() => {}));
            if (clearAllShifts) {
                removeImages('capturedImages').catch(() => {});
            }
        }).catch(() => {});
    } catch (error) {
        console.error('❌ [Cleanup] Error clearing dashboard drafts:', error);
    }

    console.log('✅ [Cleanup] Process complete');
};

/**
 * Clear specific line data
 */
export const clearLineData = (callNo, poNo, lineNo, shift = '', clearAllShifts = false) => {
    if (!callNo || !poNo || !lineNo) return;

    try {
        clearAllProcessData(callNo, poNo, lineNo, shift, clearAllShifts);
        console.log(`✅ [Cleanup] Cleared line ${lineNo} (shift: ${shift}, all: ${clearAllShifts})`);
    } catch (error) {
        console.error(`❌ [Cleanup] Error clearing line data for ${lineNo}:`, error);
    }
};
