/**
 * Local Storage Service for Process Material Inspection
 * Persists submodule data to localStorage to prevent data loss when switching lines/submodules
 */

import { isSessionEnded } from '../utils/inspectionSessionControl';

const STORAGE_PREFIX = 'process_inspection_';

const getCurrentUserId = () => {
  return localStorage.getItem('userId') || localStorage.getItem('loginId') || '';
};

/**
 * Generate storage key for a specific submodule, line, date, shift, and user
 * Optional lotNo parameter for lot-specific data (e.g., lineFinalResult per lot)
 */
const getStorageKey = (submodule, inspectionCallNo, poNo, lineNo, shift = '', lotNo = null, date = '', userId = '') => {
  const effectiveUserId = userId || getCurrentUserId();
  const userPrefix = effectiveUserId ? `${STORAGE_PREFIX}${effectiveUserId}_` : STORAGE_PREFIX;
  const effectiveDate = date || sessionStorage.getItem('inspectionDate') || '';
  const dateSuffix = effectiveDate ? `_${effectiveDate}` : '';
  const shiftSuffix = shift ? `_${shift}` : '';
  const cleanLotNo = lotNo ? String(lotNo).trim() : null;
  if (cleanLotNo) {
    return `${userPrefix}${submodule}_${inspectionCallNo}_${poNo}_${lineNo}${dateSuffix}${shiftSuffix}_${cleanLotNo}`;
  }
  return `${userPrefix}${submodule}_${inspectionCallNo}_${poNo}_${lineNo}${dateSuffix}${shiftSuffix}`;
};

/**
 * Save data to localStorage (persists across page refresh)
 * Optional lotNo parameter for lot-specific data
 */
export const saveToLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, data, shift = '', lotNo = null, date = '', userId = '') => {
  if (isSessionEnded()) {
    console.log(`🛑 [LocalStorage] Save blocked for ${submodule} - session has ended`);
    return false;
  }
  try {
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, shift, lotNo, date, userId);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Load data from localStorage (strictly scoped to user)
 * Optional lotNo parameter for lot-specific data
 */
export const loadFromLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, shift = '', lotNo = null, date = '', userId = '') => {
  try {
    const effectiveUserId = userId || getCurrentUserId();
    // 1. Try user-scoped key with date
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, shift, lotNo, date, effectiveUserId);
    let stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);

    // 2. Try user-scoped key without date
    if (effectiveUserId) {
      const userLegacyKey = `${STORAGE_PREFIX}${effectiveUserId}_${submodule}_${inspectionCallNo}_${poNo}_${lineNo}${shift ? `_${shift}` : ''}${lotNo ? `_${lotNo}` : ''}`;
      stored = localStorage.getItem(userLegacyKey);
      if (stored) return JSON.parse(stored);
    }

    // 3. Robust scan: find any matching key for this user, submodule, call, line, shift, and lot
    const normCall = inspectionCallNo ? String(inspectionCallNo).replace(/[-_/]/g, '').toLowerCase() : '';
    const normLine = lineNo ? String(lineNo).replace(/[-_]/g, '').toLowerCase() : '';
    const normShift = shift ? String(shift).toLowerCase() : '';
    const normLot = lotNo ? String(lotNo).trim().toLowerCase() : '';

    if (normCall && normLine) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const normK = k.toLowerCase();

        // Must belong to this user if userId is present
        if (effectiveUserId && !normK.includes(`_${String(effectiveUserId).toLowerCase()}_`)) continue;
        if (!normK.includes(`_${String(submodule).toLowerCase()}_`)) continue;
        if (!normK.replace(/[-_/]/g, '').includes(normCall)) continue;
        if (!normK.replace(/[-_/]/g, '').includes(normLine)) continue;
        if (normShift && !normK.includes(`_${normShift}`) && !normK.includes(`_${normShift}_`)) continue;
        if (normLot && !normK.includes(`_${normLot}`)) continue;

        const val = localStorage.getItem(k);
        if (val) {
          try {
            return JSON.parse(val);
          } catch (e) {}
        }
      }
    }

    // 4. Fallback: Legacy unscoped key
    const legacyKey = `${STORAGE_PREFIX}${submodule}_${inspectionCallNo}_${poNo}_${lineNo}${shift ? `_${shift}` : ''}${lotNo ? `_${lotNo}` : ''}`;
    stored = localStorage.getItem(legacyKey);
    if (stored) return JSON.parse(stored);

    return null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

/**
 * Clear data from localStorage for a specific submodule
 * Optional lotNo parameter for lot-specific data
 */
export const clearFromLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, shift = '', lotNo = null, date = '', userId = '') => {
  try {
    const effectiveUserId = userId || getCurrentUserId();
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, shift, lotNo, date, effectiveUserId);
    localStorage.removeItem(key);
    if (effectiveUserId) {
      const userLegacyKey = `${STORAGE_PREFIX}${effectiveUserId}_${submodule}_${inspectionCallNo}_${poNo}_${lineNo}${shift ? `_${shift}` : ''}${lotNo ? `_${lotNo}` : ''}`;
      localStorage.removeItem(userLegacyKey);
    }
    const legacyKey = `${STORAGE_PREFIX}${submodule}_${inspectionCallNo}_${poNo}_${lineNo}${shift ? `_${shift}` : ''}${lotNo ? `_${lotNo}` : ''}`;
    localStorage.removeItem(legacyKey);
    return true;
  } catch (error) {
    console.error('Error clearing from localStorage:', error);
    return false;
  }
};

/**
 * Transform frontend array-based data to backend numbered field format
 * Frontend uses: lengthCutBar: ['1', '2', '3']
 * Backend expects: lengthCutBar1: 1, lengthCutBar2: 2, lengthCutBar3: 3
 */
const transformToBackendFormat = (data, submodule) => {
  if (!data || !Array.isArray(data)) return data;

  // Define field mappings for each submodule
  const fieldMappings = {
    shearing: {
      lengthCutBar: ['lengthCutBar1', 'lengthCutBar2', 'lengthCutBar3'],
      qualityDia: ['improperDia1', 'improperDia2', 'improperDia3'],
      sharpEdges: ['sharpEdges1', 'sharpEdges2', 'sharpEdges3'],
      crackedEdges: ['crackedEdges1', 'crackedEdges2', 'crackedEdges3'],
      rejectedQty: ['rejectedQty1', 'rejectedQty2', 'rejectedQty3', 'rejectedQty4']
    },
    turning: {
      parallelLength: ['straightLength1', 'straightLength2', 'straightLength3'],
      fullTurningLength: ['taperLength1', 'taperLength2', 'taperLength3'],
      turningDia: ['dia1', 'dia2', 'dia3'],
      rejectedQty: ['rejectedQty1', 'rejectedQty2', 'rejectedQty3']
    },
    mpi: {
      testResults: ['testResult1', 'testResult2', 'testResult3'],
      rejectedQty: ['rejectedQty1', 'rejectedQty2']
    },
    forging: {
      forgingTemperature: ['forgingTemp1', 'forgingTemp2'],
      forgingStabilisation: ['forgingStabilisationRejection1', 'forgingStabilisationRejection2'],
      improperForging: ['improperForging1', 'improperForging2'],
      forgingDefect: ['forgingDefect1', 'forgingDefect2'],
      embossingDefect: ['embossingDefect1', 'embossingDefect2']
    },
    quenching: {
      quenchingTemperature: ['quenchingTemperature1', 'quenchingTemperature2'],
      quenchingDuration: ['quenchingDuration1', 'quenchingDuration2'],
      quenchingHardness: ['quenchingHardness1', 'quenchingHardness2'],
      boxGauge: ['boxGauge1', 'boxGauge2'],
      flatBearingArea: ['flatBearingArea1', 'flatBearingArea2'],
      fallingGauge: ['fallingGauge1', 'fallingGauge2']
    },
    tempering: {
      temperingTemperature: ['temperingTemperature1', 'temperingTemperature2'],
      temperingDuration: ['temperingDuration1', 'temperingDuration2'],
      totalTemperingRejection: 'totalTemperingRejection'
    },
    finalCheck: {
      boxGauge: ['boxGauge1', 'boxGauge2'],
      flatBearingArea: ['flatBearingArea1', 'flatBearingArea2'],
      fallingGauge: ['fallingGauge1', 'fallingGauge2'],
      surfaceDefect: ['surfaceDefect1', 'surfaceDefect2'],
      embossingDefect: ['embossingDefect1', 'embossingDefect2'],
      marking: ['marking1', 'marking2'],
      temperingHardness: ['temperingHardness1', 'temperingHardness2']
    },
    testingFinishing: {
      toeLoad: ['toeLoad1', 'toeLoad2'],
      weight: ['weight1', 'weight2'],
      paintIdentification: ['paintIdentification1', 'paintIdentification2'],
      ercCoating: ['ercCoating1', 'ercCoating2']
    }
  };

  const mapping = fieldMappings[submodule] || {};

  return data.map((row) => {
    const transformedRow = { ...row };

    // Transform array or single fields to numbered fields
    Object.entries(mapping).forEach(([dataField, numberedFields]) => {
      if (row[dataField] !== undefined && row[dataField] !== null) {
        const values = Array.isArray(row[dataField]) ? row[dataField] : [row[dataField]];
        const fields = Array.isArray(numberedFields) ? numberedFields : [numberedFields];

        fields.forEach((numberedField, index) => {
          const value = values[index];
          // Convert value appropriately
          if (value !== '' && value !== null && value !== undefined) {
            // Check if it's a boolean (for sharpEdges)
            if (typeof value === 'boolean') {
              transformedRow[numberedField] = value;
            } else if (!isNaN(value) && value !== '') {
              transformedRow[numberedField] = parseFloat(value);
            } else {
              transformedRow[numberedField] = value;
            }
          } else {
            transformedRow[numberedField] = null;
          }
        });
        // Remove the original field if it was renamed/transformed
        if (dataField !== numberedFields) {
          delete transformedRow[dataField];
        }
      }
    });

    // Remove the 'hour' field as backend doesn't expect it
    delete transformedRow.hour;

    return transformedRow;
  });
};

/**
 * Get all process inspection data from localStorage for a given call/PO
 * Maps storage keys to backend DTO field names
 * Transforms frontend array-based data to backend numbered field format
 */
export const getAllProcessData = (inspectionCallNo, poNo, lineNo, shift = '', date = '') => {
  const submoduleMapping = {
    'calibration': 'calibrationDocuments',
    'staticCheck': 'staticPeriodicChecks',
    'oilTank': 'oilTankCounter',
    'shearing': 'shearingData',
    'turning': 'turningData',
    'mpi': 'mpiData',
    'forging': 'forgingData',
    'quenching': 'quenchingData',
    'tempering': 'temperingData',
    'finalCheck': 'finalCheckData',
    'testingFinishing': 'testingFinishingData',
    'lineFinalResult': 'lineFinalResult'
  };

  // Submodules that need array-to-numbered-field transformation
  const gridSubmodules = ['shearing', 'turning', 'mpi', 'forging', 'quenching', 'tempering', 'finalCheck', 'testingFinishing'];

  const allData = {};
  Object.entries(submoduleMapping).forEach(([storageKey, dtoKey]) => {
    const data = loadFromLocalStorage(storageKey, inspectionCallNo, poNo, lineNo, shift, null, date);
    if (data) {
      // `staticCheck` is saved as a single object per line in the UI; backend expects a list
      if (storageKey === 'staticCheck') {
        // Ensure staticPeriodicChecks is always an array
        allData[dtoKey] = Array.isArray(data) ? data : [data];

        // Also extract oil tank counter info from staticCheck when present
        // Backend expects a separate `oilTankCounter` object on the line DTO
        const staticObj = Array.isArray(data) ? data[0] : data;
        if (staticObj && (staticObj.oilTankCounter !== undefined || staticObj.cleaningDone !== undefined)) {
          allData['oilTankCounter'] = {
            inspectionCallNo,
            poNo,
            lineNo,
            oilTankCounter: staticObj.oilTankCounter ?? null,
            cleaningDone: staticObj.cleaningDone ?? null
          };
        }
        return;
      }

      // Transform grid data to backend format
      if (gridSubmodules.includes(storageKey)) {
        allData[dtoKey] = transformToBackendFormat(data, storageKey);
      } else {
        allData[dtoKey] = data;
      }
    }
  });

  return allData;
};

/**
 * Clear all process inspection data from localStorage for a given call/PO/line
 * @param {string} inspectionCallNo
 * @param {string} poNo
 * @param {string} lineNo
 * @param {string} shift - Specific shift to clear
 * @param {boolean} clearAllShifts - If true, clears data for ALL shifts of this call/PO/line
 * @param {string} date - Optional specific date to clear
 */
export const clearAllProcessData = (inspectionCallNo, poNo, lineNo, shift = '', clearAllShifts = false, date = '') => {
  const submodules = [
    'calibration',
    'staticCheck',
    'oilTank',
    'shearing',
    'turning',
    'mpi',
    'forging',
    'quenching',
    'tempering',
    'finalCheck',
    'testingFinishing',
    'lineFinalResult'
  ];

  try {
    const cleanLineNum = lineNo ? String(lineNo).replace(/Line/i, '').replace(/[-_]/g, '').trim() : '';
    const normCallNo = inspectionCallNo ? String(inspectionCallNo).replace(/[-_/]/g, '').toLowerCase() : '';
    const normPoNo = poNo ? String(poNo).replace(/[-_/]/g, '').toLowerCase() : '';
    const shiftPattern = shift ? `_${shift.toLowerCase()}` : '';

    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;

      const normKey = key.toLowerCase();

      // Check if it belongs to any process submodule (scoped by user or legacy)
      const isSubmoduleKey = submodules.some(sub => key.includes(`_${sub}_`) || key.startsWith(`${STORAGE_PREFIX}${sub}_`));
      if (!isSubmoduleKey) continue;

      // Check call or po match
      const matchesCall = !normCallNo || normKey.replace(/[-_/]/g, '').includes(normCallNo);
      const matchesPo = !normPoNo || normKey.replace(/[-_/]/g, '').includes(normPoNo);

      // Check line match
      const matchesLine = !cleanLineNum ||
                          normKey.includes(`line-${cleanLineNum}`) ||
                          normKey.includes(`line_${cleanLineNum}`) ||
                          normKey.includes(`line${cleanLineNum}`) ||
                          normKey.endsWith(`_${cleanLineNum}`);

      if ((matchesCall || matchesPo) && matchesLine) {
        if (clearAllShifts) {
          keysToRemove.push(key);
        } else {
          // If clearing a specific shift, match keys with that shift or keys without a different shift indicator
          const hasDifferentShift = ['_a', '_b', '_c'].some(s => s !== shiftPattern && normKey.includes(s));
          if (!shiftPattern || normKey.includes(shiftPattern) || !hasDifferentShift) {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 [Cleanup] Removed localStorage key: ${key}`);
    });
  } catch (error) {
    console.error('❌ [Cleanup] Error during process localStorage clear:', error);
  }
};

/**
 * Save all 8-hour grid data for a line
 */
export const saveGridDataForLine = (inspectionCallNo, poNo, lineNo, shift, gridData, date = '') => {
  const { shearing, turning, mpi, forging, quenching, tempering, finalCheck, testingFinishing } = gridData;

  if (shearing) saveToLocalStorage('shearing', inspectionCallNo, poNo, lineNo, shearing, shift, null, date);
  if (turning) saveToLocalStorage('turning', inspectionCallNo, poNo, lineNo, turning, shift, null, date);
  if (mpi) saveToLocalStorage('mpi', inspectionCallNo, poNo, lineNo, mpi, shift, null, date);
  if (forging) saveToLocalStorage('forging', inspectionCallNo, poNo, lineNo, forging, shift, null, date);
  if (quenching) saveToLocalStorage('quenching', inspectionCallNo, poNo, lineNo, quenching, shift, null, date);
  if (tempering) saveToLocalStorage('tempering', inspectionCallNo, poNo, lineNo, tempering, shift, null, date);
  if (finalCheck) saveToLocalStorage('finalCheck', inspectionCallNo, poNo, lineNo, finalCheck, shift, null, date);
  if (testingFinishing) saveToLocalStorage('testingFinishing', inspectionCallNo, poNo, lineNo, testingFinishing, shift, null, date);
};

/**
 * Load all 8-hour grid data for a line
 */
export const loadGridDataForLine = (inspectionCallNo, poNo, lineNo, shift, date = '') => {
  return {
    shearing: loadFromLocalStorage('shearing', inspectionCallNo, poNo, lineNo, shift, null, date),
    turning: loadFromLocalStorage('turning', inspectionCallNo, poNo, lineNo, shift, null, date),
    mpi: loadFromLocalStorage('mpi', inspectionCallNo, poNo, lineNo, shift, null, date),
    forging: loadFromLocalStorage('forging', inspectionCallNo, poNo, lineNo, shift, null, date),
    quenching: loadFromLocalStorage('quenching', inspectionCallNo, poNo, lineNo, shift, null, date),
    tempering: loadFromLocalStorage('tempering', inspectionCallNo, poNo, lineNo, shift, null, date),
    finalCheck: loadFromLocalStorage('finalCheck', inspectionCallNo, poNo, lineNo, shift, null, date),
    testingFinishing: loadFromLocalStorage('testingFinishing', inspectionCallNo, poNo, lineNo, shift, null, date)
  };
};

