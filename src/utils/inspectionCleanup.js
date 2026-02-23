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

    // Step 2: Clear session storage
    try {
        const sessionKeys = [
            'processProductionLinesData',
            'processSelectedLineTab',
            'processFinalInspectionRemarks',
            'additionalInitiatedCalls',
            'processSelectedLotByLine',
            'processCallInitiationDataCache',
            'processManufacturedQtyByLine'
        ];

        sessionKeys.forEach(baseKey => {
            if (clearAllShifts) {
                // Clear all shift variants for the call from sessionStorage
                const pattern = `${baseKey}_${inspectionCallNo}`;
                const keysToRemove = [];
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && (key === baseKey || key.startsWith(pattern))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => sessionStorage.removeItem(k));
            } else {
                // Clear specific shift variant
                sessionStorage.removeItem(baseKey);
                sessionStorage.removeItem(`${baseKey}_${inspectionCallNo}_${shift}`);
            }
        });

        console.log('✅ [Cleanup] Cleared sessionStorage variants');
    } catch (error) {
        console.error('❌ [Cleanup] Error clearing sessionStorage:', error);
    }

    // Step 3: Clear localStorage for all lines
    if (manufacturingLines && productionLines) {
        manufacturingLines.forEach(line => {
            productionLines.forEach((prodLine) => {
                const poNo = prodLine.po_no || prodLine.poNumber || '';
                const callNo = prodLine.icNumber || inspectionCallNo;

                if (poNo && callNo) {
                    try {
                        clearAllProcessData(callNo, poNo, line, shift, clearAllShifts);
                    } catch (error) {
                        console.error(`❌ [Cleanup] Error clearing data for ${line}:`, error);
                    }
                }
            });
        });
    }

    // Step 4: Clear dashboard drafts
    try {
        if (inspectionCallNo) {
            localStorage.removeItem(`${DASHBOARD_DRAFT_KEY}${inspectionCallNo}`);
        }

        if (productionLines) {
            productionLines.forEach(prodLine => {
                if (prodLine.icNumber && prodLine.icNumber !== inspectionCallNo) {
                    localStorage.removeItem(`${DASHBOARD_DRAFT_KEY}${prodLine.icNumber}`);
                }
            });
        }
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
