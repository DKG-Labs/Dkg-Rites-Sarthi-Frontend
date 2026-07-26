/**
 * Local Storage Service for Process Material Inspection
 * Persists submodule data to localStorage to prevent data loss when switching lines/submodules
 */

const STORAGE_PREFIX = 'process_inspection_';

/**
 * Generate storage key for a specific submodule, line and shift
 * Optional lotNo parameter for lot-specific data (e.g., lineFinalResult per lot)
 */
const getStorageKey = (submodule, inspectionCallNo, poNo, lineNo, shift = '', lotNo = null) => {
  const shiftSuffix = shift ? `_${shift}` : '';
  if (lotNo) {
    return `${STORAGE_PREFIX}${submodule}_${inspectionCallNo}_${poNo}_${lineNo}${shiftSuffix}_${lotNo}`;
  }
  return `${STORAGE_PREFIX}${submodule}_${inspectionCallNo}_${poNo}_${lineNo}${shiftSuffix}`;
};

/**
 * Save data to localStorage (persists across page refresh)
 * Optional lotNo parameter for lot-specific data
 */
export const saveToLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, data, shift = '', lotNo = null) => {
  try {
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, shift, lotNo);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Load data from localStorage
 * Optional lotNo parameter for lot-specific data
 */
export const loadFromLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, shift = '', lotNo = null) => {
  try {
    // 1. Try exact storage key match with passed shift
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, shift, lotNo);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }

    // 2. Fallback search: Search across ALL shifts for matching call and line
    if (lineNo || inspectionCallNo) {
      const cleanLineNum = lineNo ? String(lineNo).replace(/Line/i, '').replace(/[-_]/g, '').trim() : '';
      const normCallNo = inspectionCallNo ? String(inspectionCallNo).replace(/[-_]/g, '').toLowerCase() : '';
      const lotSuffix = lotNo ? `_${lotNo}` : '';

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;

        const isSubmoduleKey = k.includes(`_${submodule}_`) || k.includes(`_${submodule}Data_`) || k.startsWith(`${STORAGE_PREFIX}${submodule}`);
        if (!isSubmoduleKey) continue;

        if (normCallNo) {
          const normKey = k.replace(/[-_]/g, '').toLowerCase();
          if (!normKey.includes(normCallNo)) continue;
        }

        if (cleanLineNum) {
          const normKeyForLine = k.toLowerCase();
          const matchesLine = normKeyForLine.includes(`line-${cleanLineNum}`) ||
                              normKeyForLine.includes(`line_${cleanLineNum}`) ||
                              normKeyForLine.includes(`line${cleanLineNum}`);
          if (!matchesLine) continue;
        }

        const matchesLot = lotNo ? k.toLowerCase().endsWith(lotSuffix.toLowerCase()) : true;

        if (matchesLot) {
          const fallbackStored = localStorage.getItem(k);
          if (fallbackStored) {
            console.log(`🔍 [localStorage Fallback] Found shift-agnostic key: ${k}`);
            return JSON.parse(fallbackStored);
          }
        }
      }
    }

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
export const clearFromLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, shift = '', lotNo = null) => {
  try {
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, shift, lotNo);
    localStorage.removeItem(key);
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
export const getAllProcessData = (inspectionCallNo, poNo, lineNo, shift = '') => {
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
    let data = loadFromLocalStorage(storageKey, inspectionCallNo, poNo, lineNo, shift);
    if (!data && gridSubmodules.includes(storageKey)) {
      const alternativeLines = ['Line-1', 'Line-2', 'Line-3', 'Line-4', 'Line-5'].filter(l => l !== lineNo);
      for (const altLine of alternativeLines) {
        const altData = loadFromLocalStorage(storageKey, inspectionCallNo, poNo, altLine, shift);
        if (altData && Array.isArray(altData) && altData.length > 0) {
          data = altData;
          break;
        }
      }
    }
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
 */
export const clearAllProcessData = (inspectionCallNo, poNo, lineNo, shift = '', clearAllShifts = false) => {
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

  if (clearAllShifts) {
    // Comprehensive scan to remove ALL shift variants for this call/PO/line
    const patterns = submodules.map(sub => `${STORAGE_PREFIX}${sub}_${inspectionCallNo}_${poNo}_${lineNo}`);
    const keysToRemove = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && patterns.some(pattern => key.startsWith(pattern))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 [Cleanup] Removed all-shift key: ${key}`);
      });
    } catch (error) {
      console.error('❌ [Cleanup] Error during comprehensive localStorage clear:', error);
    }
  } else {
    // Standard cleanup for a specific shift
    submodules.forEach(submodule => {
      clearFromLocalStorage(submodule, inspectionCallNo, poNo, lineNo, shift);
    });

    // Handle lot-specific keys for the specific shift
    try {
      const shiftSuffix = shift ? `_${shift}` : '';
      const pattern = `${STORAGE_PREFIX}lineFinalResult_${inspectionCallNo}_${poNo}_${lineNo}${shiftSuffix}`;
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(pattern)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 [Cleanup] Removed shift-specific lot key: ${key}`);
      });
    } catch (error) {
      console.error('❌ [Cleanup] Error clearing shift-specific process data:', error);
    }
  }
};

/**
 * Save all 8-hour grid data for a line
 */
export const saveGridDataForLine = (inspectionCallNo, poNo, lineNo, shift, gridData) => {
  const { shearing, turning, mpi, forging, quenching, tempering, finalCheck, testingFinishing } = gridData;

  if (shearing) saveToLocalStorage('shearing', inspectionCallNo, poNo, lineNo, shearing, shift);
  if (turning) saveToLocalStorage('turning', inspectionCallNo, poNo, lineNo, turning, shift);
  if (mpi) saveToLocalStorage('mpi', inspectionCallNo, poNo, lineNo, mpi, shift);
  if (forging) saveToLocalStorage('forging', inspectionCallNo, poNo, lineNo, forging, shift);
  if (quenching) saveToLocalStorage('quenching', inspectionCallNo, poNo, lineNo, quenching, shift);
  if (tempering) saveToLocalStorage('tempering', inspectionCallNo, poNo, lineNo, tempering, shift);
  if (finalCheck) saveToLocalStorage('finalCheck', inspectionCallNo, poNo, lineNo, finalCheck, shift);
  if (testingFinishing) saveToLocalStorage('testingFinishing', inspectionCallNo, poNo, lineNo, testingFinishing, shift);
};

/**
 * Load all 8-hour grid data for a line
 */
export const loadGridDataForLine = (inspectionCallNo, poNo, lineNo, shift) => {
  let result = {
    shearing: loadFromLocalStorage('shearing', inspectionCallNo, poNo, lineNo, shift),
    turning: loadFromLocalStorage('turning', inspectionCallNo, poNo, lineNo, shift),
    mpi: loadFromLocalStorage('mpi', inspectionCallNo, poNo, lineNo, shift),
    forging: loadFromLocalStorage('forging', inspectionCallNo, poNo, lineNo, shift),
    quenching: loadFromLocalStorage('quenching', inspectionCallNo, poNo, lineNo, shift),
    tempering: loadFromLocalStorage('tempering', inspectionCallNo, poNo, lineNo, shift),
    finalCheck: loadFromLocalStorage('finalCheck', inspectionCallNo, poNo, lineNo, shift),
    testingFinishing: loadFromLocalStorage('testingFinishing', inspectionCallNo, poNo, lineNo, shift)
  };

  const hasData = Object.values(result).some(subData => Array.isArray(subData) && subData.length > 0);

  if (!hasData) {
    const alternativeLines = ['Line-1', 'Line-2', 'Line-3', 'Line-4', 'Line-5'].filter(l => l !== lineNo);
    for (const altLine of alternativeLines) {
      const altResult = {
        shearing: loadFromLocalStorage('shearing', inspectionCallNo, poNo, altLine, shift),
        turning: loadFromLocalStorage('turning', inspectionCallNo, poNo, altLine, shift),
        mpi: loadFromLocalStorage('mpi', inspectionCallNo, poNo, altLine, shift),
        forging: loadFromLocalStorage('forging', inspectionCallNo, poNo, altLine, shift),
        quenching: loadFromLocalStorage('quenching', inspectionCallNo, poNo, altLine, shift),
        tempering: loadFromLocalStorage('tempering', inspectionCallNo, poNo, altLine, shift),
        finalCheck: loadFromLocalStorage('finalCheck', inspectionCallNo, poNo, altLine, shift),
        testingFinishing: loadFromLocalStorage('testingFinishing', inspectionCallNo, poNo, altLine, shift)
      };
      const altHasData = Object.values(altResult).some(subData => Array.isArray(subData) && subData.length > 0);
      if (altHasData) {
        console.log(`📋 [loadGridDataForLine] Recovered grid data from alternative line key ${altLine} for requested ${lineNo}`);
        return altResult;
      }
    }
  }

  return result;
};

