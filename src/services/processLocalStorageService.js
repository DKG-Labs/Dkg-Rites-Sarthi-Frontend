/**
 * Local Storage Service for Process Material Inspection
 * Persists submodule data to localStorage to prevent data loss when switching lines/submodules
 */

const STORAGE_PREFIX = 'process_inspection_';

/**
 * Generate storage key for a specific submodule and line
 * Optional lotNo parameter for lot-specific data (e.g., lineFinalResult per lot)
 */
const getStorageKey = (submodule, inspectionCallNo, poNo, lineNo, lotNo = null) => {
  if (lotNo) {
    return `${STORAGE_PREFIX}${submodule}_${inspectionCallNo}_${poNo}_${lineNo}_${lotNo}`;
  }
  return `${STORAGE_PREFIX}${submodule}_${inspectionCallNo}_${poNo}_${lineNo}`;
};

/**
 * Save data to localStorage (persists across page refresh)
 * Optional lotNo parameter for lot-specific data
 */
export const saveToLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, data, lotNo = null) => {
  try {
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, lotNo);
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
export const loadFromLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, lotNo = null) => {
  try {
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, lotNo);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

/**
 * Clear data from localStorage for a specific submodule
 * Optional lotNo parameter for lot-specific data
 */
export const clearFromLocalStorage = (submodule, inspectionCallNo, poNo, lineNo, lotNo = null) => {
  try {
    const key = getStorageKey(submodule, inspectionCallNo, poNo, lineNo, lotNo);
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
      sharpEdges: ['sharpEdges1', 'sharpEdges2', 'sharpEdges3'],
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

    // Transform array fields to numbered fields
    Object.entries(mapping).forEach(([arrayField, numberedFields]) => {
      if (row[arrayField] && Array.isArray(row[arrayField])) {
        numberedFields.forEach((numberedField, index) => {
          const value = row[arrayField][index];
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
        // Remove the original array field
        delete transformedRow[arrayField];
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
export const getAllProcessData = (inspectionCallNo, poNo, lineNo) => {
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
    const data = loadFromLocalStorage(storageKey, inspectionCallNo, poNo, lineNo);
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
 */
export const clearAllProcessData = (inspectionCallNo, poNo, lineNo) => {
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

  submodules.forEach(submodule => {
    clearFromLocalStorage(submodule, inspectionCallNo, poNo, lineNo);
  });

  // CRITICAL: lot-specific lineFinalResult keys are NOT cleared by the above loop 
  // because clearFromLocalStorage expects a lotNo to match the exact key.
  // We need to scan localStorage for ANY keys matching the pattern for THIS call, PO, and line.
  try {
    const pattern = `${STORAGE_PREFIX}lineFinalResult_${inspectionCallNo}_${poNo}_${lineNo}`;
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(pattern)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Clarifying stale lot-specific key: ${key}`);
    });
  } catch (error) {
    console.error('Error clearing lot-specific process data:', error);
  }
};

/**
 * Save all 8-hour grid data for a line
 */
export const saveGridDataForLine = (inspectionCallNo, poNo, lineNo, gridData) => {
  const { shearing, turning, mpi, forging, quenching, tempering, finalCheck, testingFinishing } = gridData;

  if (shearing) saveToLocalStorage('shearing', inspectionCallNo, poNo, lineNo, shearing);
  if (turning) saveToLocalStorage('turning', inspectionCallNo, poNo, lineNo, turning);
  if (mpi) saveToLocalStorage('mpi', inspectionCallNo, poNo, lineNo, mpi);
  if (forging) saveToLocalStorage('forging', inspectionCallNo, poNo, lineNo, forging);
  if (quenching) saveToLocalStorage('quenching', inspectionCallNo, poNo, lineNo, quenching);
  if (tempering) saveToLocalStorage('tempering', inspectionCallNo, poNo, lineNo, tempering);
  if (finalCheck) saveToLocalStorage('finalCheck', inspectionCallNo, poNo, lineNo, finalCheck);
  if (testingFinishing) saveToLocalStorage('testingFinishing', inspectionCallNo, poNo, lineNo, testingFinishing);
};

/**
 * Load all 8-hour grid data for a line
 */
export const loadGridDataForLine = (inspectionCallNo, poNo, lineNo) => {
  return {
    shearing: loadFromLocalStorage('shearing', inspectionCallNo, poNo, lineNo),
    turning: loadFromLocalStorage('turning', inspectionCallNo, poNo, lineNo),
    mpi: loadFromLocalStorage('mpi', inspectionCallNo, poNo, lineNo),
    forging: loadFromLocalStorage('forging', inspectionCallNo, poNo, lineNo),
    quenching: loadFromLocalStorage('quenching', inspectionCallNo, poNo, lineNo),
    tempering: loadFromLocalStorage('tempering', inspectionCallNo, poNo, lineNo),
    finalCheck: loadFromLocalStorage('finalCheck', inspectionCallNo, poNo, lineNo),
    testingFinishing: loadFromLocalStorage('testingFinishing', inspectionCallNo, poNo, lineNo)
  };
};

