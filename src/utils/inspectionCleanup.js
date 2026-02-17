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
 * This function:
 * 1. Blocks all future saves (via session control flag)
 * 2. Clears sessionStorage
 * 3. Clears localStorage for all production lines
 * 4. Clears dashboard drafts
 * 
 * @param {string} inspectionCallNo - Main inspection call number
 * @param {Array} productionLines - Array of production line objects with icNumber, poNumber
 * @param {Array} manufacturingLines - Array of line names ['Line-1', 'Line-2', ...]
 */
export const performInspectionCleanup = (inspectionCallNo, productionLines, manufacturingLines) => {
    console.log('🧹 Starting inspection cleanup...', {
        inspectionCallNo,
        productionLinesCount: productionLines?.length || 0,
        manufacturingLinesCount: manufacturingLines?.length || 0
    });

    // Step 1: Block all future saves FIRST (critical - must happen before any cleanup)
    markSessionAsEnded();

    // Step 2: Clear session storage
    try {
        sessionStorage.removeItem('processProductionLinesData');
        sessionStorage.removeItem('processSelectedLineTab');
        sessionStorage.removeItem('processFinalInspectionRemarks');
        sessionStorage.removeItem('additionalInitiatedCalls');
        sessionStorage.removeItem('processSelectedLotByLine');
        sessionStorage.removeItem('processCallInitiationDataCache');
        console.log('✅ Cleared sessionStorage (including call initiation cache)');
    } catch (error) {
        console.error('❌ Error clearing sessionStorage:', error);
    }

    // Step 3: Clear localStorage for all lines
    if (manufacturingLines && productionLines) {
        manufacturingLines.forEach(line => {
            productionLines.forEach((prodLine) => {
                const poNo = prodLine.po_no || prodLine.poNumber || '';
                const callNo = prodLine.icNumber || inspectionCallNo;

                if (poNo && callNo) {
                    try {
                        clearAllProcessData(callNo, poNo, line);
                        console.log(`✅ Cleared data for ${line}, Call: ${callNo}, PO: ${poNo}`);
                    } catch (error) {
                        console.error(`❌ Error clearing data for ${line}:`, error);
                    }
                }
            });
        });
    }

    // Step 4: Clear dashboard drafts for all call numbers
    try {
        if (inspectionCallNo) {
            localStorage.removeItem(`${DASHBOARD_DRAFT_KEY}${inspectionCallNo}`);
            console.log(`✅ Cleared dashboard draft for call: ${inspectionCallNo}`);
        }

        // Also clear drafts for any IC numbers in production lines
        if (productionLines) {
            productionLines.forEach(prodLine => {
                if (prodLine.icNumber && prodLine.icNumber !== inspectionCallNo) {
                    localStorage.removeItem(`${DASHBOARD_DRAFT_KEY}${prodLine.icNumber}`);
                    console.log(`✅ Cleared dashboard draft for IC: ${prodLine.icNumber}`);
                }
            });
        }
    } catch (error) {
        console.error('❌ Error clearing dashboard drafts:', error);
    }

    console.log('✅ Inspection cleanup complete');
};

/**
 * Clear specific line data (used when removing a single line)
 * 
 * @param {string} callNo - Call number for the line
 * @param {string} poNo - PO number for the line
 * @param {string} lineNo - Line identifier (e.g., 'Line-1')
 */
export const clearLineData = (callNo, poNo, lineNo) => {
    if (!callNo || !poNo || !lineNo) {
        console.warn('Cannot clear line data - missing parameters:', { callNo, poNo, lineNo });
        return;
    }

    try {
        clearAllProcessData(callNo, poNo, lineNo);
        console.log(`✅ Cleared data for ${lineNo}, Call: ${callNo}, PO: ${poNo}`);
    } catch (error) {
        console.error(`❌ Error clearing line data for ${lineNo}:`, error);
    }
};
