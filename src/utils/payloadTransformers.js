/**
 * Transforms frontend 8-hour grid data arrays into backend-compatible DTO structures.
 * 
 * Frontend: Arrays (e.g., lengthCutBar: ["10", "11", "12"])
 * Backend: Flattened fields (e.g., lengthCutBar1: 10, lengthCutBar2: 11, lengthCutBar3: 12)
 */

const parseNumber = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
};


const parseString = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    return String(val);
}


const calculateGenericRejected = (list, rejectedKeys) => {
    if (!list) return 0;
    return list.reduce((acc, row) => {
        let rowRejected = 0;
        if (row.rejectedQty) {
            rowRejected = parseNumber(row.rejectedQty) || 0;
        } else if (rejectedKeys && rejectedKeys.length > 0) {
            rowRejected = rejectedKeys.reduce((sum, key) => sum + (parseNumber(row[key]) || 0), 0);
        }
        return acc + rowRejected;
    }, 0);
};

const calculateGenericAccepted = (list) => {
    if (!list) return 0;
    return list.reduce((acc, row) => acc + (parseNumber(row.acceptedQty) || 0), 0);
};


export const transformLineDataForBackend = (frontendLineData, manualQuantities = {}, metaData = {}) => {
    if (!frontendLineData) return null;

    const shearingData = frontendLineData.shearingData?.map(transformShearingRow) || [];
    const turningData = frontendLineData.turningData?.map(transformTurningRow) || [];
    const mpiData = frontendLineData.mpiData?.map(transformMpiRow) || [];
    const forgingData = frontendLineData.forgingData?.map(transformForgingRow) || [];
    const quenchingData = frontendLineData.quenchingData?.map(transformQuenchingRow) || [];
    const finalCheckData = frontendLineData.finalCheckData?.map(transformFinalCheckRow) || [];

    // Calculate total tempering hardness rejected from Final Check to pass to Tempering
    const totalTemperingHardnessRejected = finalCheckData.reduce((acc, fcRow) =>
        acc + (parseNumber(fcRow.temperingHardnessRejected) || 0), 0);

    const temperingData = frontendLineData.temperingData?.map(row =>
        transformTemperingRow(row, totalTemperingHardnessRejected)
    ) || [];

    const testingFinishingData = frontendLineData.testingFinishingData?.map(transformTestingFinishingRow) || [];

    // Calculate Final Result Summary for Payload
    const shearingRejected = calculateGenericRejected(shearingData, ['lengthCutBarRejected', 'improperDiaRejected', 'sharpEdgesRejected', 'crackedEdgesRejected']);

    // Calculate granular Turning rejections
    const parallelLengthRejected = calculateGenericRejected(turningData, ['parallelLengthRejected']);
    const fullTurningLengthRejected = calculateGenericRejected(turningData, ['fullTurningLengthRejected']);
    const turningDiaRejected = calculateGenericRejected(turningData, ['turningDiaRejected']);
    const turningRejected = parallelLengthRejected + fullTurningLengthRejected + turningDiaRejected;
    const mpiRejected = calculateGenericRejected(mpiData, ['mpiRejected']);
    const forgingRejected = calculateGenericRejected(forgingData, ['forgingTempRejected', 'forgingStabilisationRejectionRejected', 'improperForgingRejected', 'forgingDefectRejected', 'embossingDefectRejected']);
    const quenchingRejected = calculateGenericRejected(quenchingData, ['quenchingTemperatureRejected', 'quenchingDurationRejected', 'quenchingHardnessRejected', 'boxGaugeRejected', 'flatBearingAreaRejected', 'fallingGaugeRejected']);
    const temperingTotalRejected = temperingData.reduce((acc, row) => acc + (parseNumber(row.totalTemperingRejection) || 0), 0);
    const finalCheckRejected = calculateGenericRejected(finalCheckData, ['boxGaugeRejected', 'flatBearingAreaRejected', 'fallingGaugeRejected', 'surfaceDefectRejected', 'embossingDefectRejected', 'markingRejected', 'temperingHardnessRejected']);
    const testingFinishingRejected = calculateGenericRejected(testingFinishingData, ['toeLoadRejected', 'weightRejected', 'paintIdentificationRejected', 'ercCoatingRejected']);
    const testingFinishingAccepted = calculateGenericAccepted(testingFinishingData);

    const totalRejected = shearingRejected + turningRejected + mpiRejected + forgingRejected +
        quenchingRejected + temperingTotalRejected +
        (finalCheckRejected - totalTemperingHardnessRejected) +
        testingFinishingRejected;

    const lineFinalResult = {
        // Map metadata for IC/Lot resolution
        lotNumber: metaData.lotNumbers || '',
        heatNumber: metaData.heatNumbers || '',
        offeredQty: metaData.totalOfferedQty || 0,
        shift: metaData.shift || '',
        // Map consolidated manual manufactured quantities
        shearingManufactured: manualQuantities.shearing || 0,
        shearingAccepted: Math.max(0, (manualQuantities.shearing || 0) - shearingRejected),
        shearingRejected,
        turningManufactured: manualQuantities.turning || 0,
        turningAccepted: Math.max(0, (manualQuantities.turning || 0) - turningRejected),
        turningRejected,
        parallelLengthRejected,
        fullTurningLengthRejected,
        turningDiaRejected,
        mpiManufactured: manualQuantities.mpiTesting || 0,
        mpiAccepted: Math.max(0, (manualQuantities.mpiTesting || 0) - mpiRejected),
        mpiRejected,
        forgingManufactured: manualQuantities.forging || 0,
        forgingAccepted: Math.max(0, (manualQuantities.forging || 0) - forgingRejected),
        forgingRejected,
        quenchingManufactured: manualQuantities.quenching || 0,
        quenchingAccepted: Math.max(0, (manualQuantities.quenching || 0) - quenchingRejected),
        quenchingRejected,
        temperingManufactured: manualQuantities.tempering || 0,
        temperingAccepted: Math.max(0, (manualQuantities.tempering || 0) - temperingTotalRejected),
        temperingRejected: temperingTotalRejected,
        finalCheckRejected,
        testingFinishingManufactured: manualQuantities.testingFinishing || 0,
        testingFinishingAccepted,
        testingFinishingRejected,
        totalManufactured: manualQuantities.shearing || 0,
        totalAccepted: Math.max(0, (manualQuantities.shearing || 0) - totalRejected),
        totalRejected
    };

    return {
        ...frontendLineData,
        // Map metadata for IC/Lot resolution
        lotNo: metaData.lotNumbers || '',
        heatNo: metaData.heatNumbers || '',
        totalOfferedQty: metaData.totalOfferedQty || 0,
        shearingData,
        turningData,
        mpiData,
        forgingData,
        quenchingData,
        temperingData,
        finalCheckData,
        testingFinishingData,
        lineFinalResult
    };
};

const transformShearingRow = (row) => ({
    hourIndex: row.hour,
    shift: row.shift,
    hourLabel: row.hourLabel,
    noProduction: row.noProduction,
    lotNo: row.lotNo,
    // Arrays to flattened fields
    lengthCutBar1: parseNumber(row.lengthCutBar?.[0]),
    lengthCutBar2: parseNumber(row.lengthCutBar?.[1]),
    lengthCutBar3: parseNumber(row.lengthCutBar?.[2]),
    // New fields - mapped as strings to preserve "OK" / "NOT OK"
    improperDia1: parseString(row.qualityDia?.[0]),
    improperDia2: parseString(row.qualityDia?.[1]),
    improperDia3: parseString(row.qualityDia?.[2]),
    sharpEdges1: parseString(row.sharpEdges?.[0]),
    sharpEdges2: parseString(row.sharpEdges?.[1]),
    sharpEdges3: parseString(row.sharpEdges?.[2]),
    crackedEdges1: parseString(row.crackedEdges?.[0]),
    crackedEdges2: parseString(row.crackedEdges?.[1]),
    crackedEdges3: parseString(row.crackedEdges?.[2]),
    // RejectedQty array mapped to specific rejection counts
    lengthCutBarRejected: parseNumber(row.rejectedQty?.[0]),
    improperDiaRejected: parseNumber(row.rejectedQty?.[1]),
    sharpEdgesRejected: parseNumber(row.rejectedQty?.[2]),
    crackedEdgesRejected: parseNumber(row.rejectedQty?.[3]),
    remarks: row.remarks,
    createdBy: row.createdBy
});

const transformTurningRow = (row) => ({
    hourIndex: row.hourIndex || row.hour,
    shift: row.shift,
    hourLabel: row.hourLabel,
    noProduction: row.noProduction,
    lotNo: row.lotNo,
    straightLength1: parseNumber(row.parallelLength?.[0]),
    straightLength2: parseNumber(row.parallelLength?.[1]),
    straightLength3: parseNumber(row.parallelLength?.[2]),
    taperLength1: parseNumber(row.fullTurningLength?.[0]),
    taperLength2: parseNumber(row.fullTurningLength?.[1]),
    taperLength3: parseNumber(row.fullTurningLength?.[2]),
    dia1: parseNumber(row.turningDia?.[0]),
    dia2: parseNumber(row.turningDia?.[1]),
    dia3: parseNumber(row.turningDia?.[2]),
    parallelLengthRejected: parseNumber(row.rejectedQty?.[0]),
    fullTurningLengthRejected: parseNumber(row.rejectedQty?.[1]),
    turningDiaRejected: parseNumber(row.rejectedQty?.[2]),
    acceptedQty: parseNumber(row.acceptedQty),
    remarks: row.remarks,
    createdBy: row.createdBy
});

const transformMpiRow = (row) => ({
    hourIndex: row.hour,
    shift: row.shift,
    hourLabel: row.hourLabel,
    noProduction: row.noProduction,
    lotNo: row.lotNo,
    testResult1: parseString(row.testResults?.[0]),
    testResult2: parseString(row.testResults?.[1]),
    testResult3: parseString(row.testResults?.[2]),
    mpiRejected: parseNumber(row.rejectedQty), // Single value in UI
    remarks: row.remarks,
    createdBy: row.createdBy
});
// Correction on MPI: Payload showed "rejectedQty": "" (string). Frontend likely has single input.
// DTO has mpiRejected.

const transformForgingRow = (row) => ({
    hourIndex: row.hour,
    shift: row.shift,
    hourLabel: row.hourLabel,
    noProduction: row.noProduction,
    lotNo: row.lotNo,

    // Forging Temp - 2 samples (mapping from forgingTemperature array)
    forgingTemp1: parseNumber(row.forgingTemperature?.[0]),
    forgingTemp2: parseNumber(row.forgingTemperature?.[1]),
    forgingTempRejected: parseNumber(row.forgingTemperatureRejected),

    // Forging Stabilisation - 2 samples + rejected
    forgingStabilisationRejection1: parseString(row.forgingStabilisation?.[0]),
    forgingStabilisationRejection2: parseString(row.forgingStabilisation?.[1]),
    forgingStabilisationRejectionRejected: parseNumber(row.forgingStabilisationRejected),

    // Improper Forging - 2 samples + rejected
    improperForging1: parseString(row.improperForging?.[0]),
    improperForging2: parseString(row.improperForging?.[1]),
    improperForgingRejected: parseNumber(row.improperForgingRejected),

    // Forging Defect (Marks / Notches) - 2 samples + rejected
    forgingDefect1: parseString(row.forgingDefect?.[0]),
    forgingDefect2: parseString(row.forgingDefect?.[1]),
    forgingDefectRejected: parseNumber(row.forgingDefectRejected),

    // Embossing Defect - 2 samples + rejected
    embossingDefect1: parseString(row.embossingDefect?.[0]),
    embossingDefect2: parseString(row.embossingDefect?.[1]),
    embossingDefectRejected: parseNumber(row.embossingDefectRejected),

    remarks: row.remarks,
    createdBy: row.createdBy
});

const transformQuenchingRow = (row) => {
    const quenchingTemperatureRejected = parseNumber(row.quenchingTemperatureRejected);
    const quenchingDurationRejected = parseNumber(row.quenchingDurationRejected);
    const quenchingHardnessRejected = parseNumber(row.quenchingHardnessRejected);
    const boxGaugeRejected = parseNumber(row.boxGaugeRejected);
    const flatBearingAreaRejected = parseNumber(row.flatBearingAreaRejected);
    const fallingGaugeRejected = parseNumber(row.fallingGaugeRejected);

    const calculatedRejectedQty = (quenchingTemperatureRejected || 0) +
        (quenchingDurationRejected || 0) +
        (quenchingHardnessRejected || 0) +
        (boxGaugeRejected || 0) +
        (flatBearingAreaRejected || 0) +
        (fallingGaugeRejected || 0);

    return {
        hourIndex: row.hour,
        shift: row.shift,
        hourLabel: row.hourLabel,
        noProduction: row.noProduction,
        lotNo: row.lotNo,

        // Quenching Temp - 2 samples
        quenchingTemperature1: parseNumber(row.quenchingTemperature?.[0]),
        quenchingTemperature2: parseNumber(row.quenchingTemperature?.[1]),

        // Quenching Duration - 2 samples
        quenchingDuration1: parseNumber(row.quenchingDuration?.[0]),
        quenchingDuration2: parseNumber(row.quenchingDuration?.[1]),

        // Quenching Hardness - 2 samples
        quenchingHardness1: parseNumber(row.quenchingHardness?.[0]),
        quenchingHardness2: parseNumber(row.quenchingHardness?.[1]),

        // Gauge Results - 2 samples each
        boxGauge1: parseString(row.boxGauge?.[0]),
        boxGauge2: parseString(row.boxGauge?.[1]),

        flatBearingArea1: parseString(row.flatBearingArea?.[0]),
        flatBearingArea2: parseString(row.flatBearingArea?.[1]),

        fallingGauge1: parseString(row.fallingGauge?.[0]),
        fallingGauge2: parseString(row.fallingGauge?.[1]),

        // Rejection counts
        quenchingTemperatureRejected,
        quenchingDurationRejected,
        quenchingHardnessRejected,
        boxGaugeRejected,
        flatBearingAreaRejected,
        fallingGaugeRejected,

        rejectedQty: parseNumber(row.rejectedQty) ?? (calculatedRejectedQty > 0 ? calculatedRejectedQty : null),
        remarks: row.remarks,
        createdBy: row.createdBy
    };
};

const transformTemperingRow = (row, temperingHardnessTotal = 0) => {
    const temperingTemperatureRejected = parseNumber(row.temperingTemperatureRejected);
    const temperingDurationRejected = parseNumber(row.temperingDurationRejected);

    const calculatedRejectedQty = (temperingTemperatureRejected || 0) + (temperingDurationRejected || 0);
    const totalTemperingRejection = calculatedRejectedQty + (temperingHardnessTotal || 0);

    return {
        hourIndex: row.hour,
        shift: row.shift,
        hourLabel: row.hourLabel,
        noProduction: row.noProduction,
        lotNo: row.lotNo,

        // Tempering Temp - 2 samples
        temperingTemperature1: parseNumber(row.temperingTemperature?.[0]),
        temperingTemperature2: parseNumber(row.temperingTemperature?.[1]),

        // Tempering Duration - 2 samples
        temperingDuration1: parseNumber(row.temperingDuration?.[0]),
        temperingDuration2: parseNumber(row.temperingDuration?.[1]),

        temperingTemperatureRejected,
        temperingDurationRejected,
        totalTemperingRejection,

        acceptedQty: parseNumber(row.acceptedQty),
        rejectedQty: parseNumber(row.rejectedQty) ?? (calculatedRejectedQty > 0 ? calculatedRejectedQty : null),
        remarks: row.remarks,
        createdBy: row.createdBy
    };
};

const transformFinalCheckRow = (row) => ({
    hourIndex: row.hour,
    shift: row.shift,
    hourLabel: row.hourLabel,
    noProduction: row.noProduction,
    lotNo: row.lotNo,

    // Box Gauge - 2 readings
    boxGauge1: parseString(row.boxGauge?.[0]),
    boxGauge2: parseString(row.boxGauge?.[1]),

    // Flat Bearing Area - 2 readings
    flatBearingArea1: parseString(row.flatBearingArea?.[0]),
    flatBearingArea2: parseString(row.flatBearingArea?.[1]),

    // Falling Gauge - 2 readings
    fallingGauge1: parseString(row.fallingGauge?.[0]),
    fallingGauge2: parseString(row.fallingGauge?.[1]),

    // Surface Defect - 2 readings
    surfaceDefect1: parseString(row.surfaceDefect?.[0]),
    surfaceDefect2: parseString(row.surfaceDefect?.[1]),

    // Embossing Defect - 2 readings
    embossingDefect1: parseString(row.embossingDefect?.[0]),
    embossingDefect2: parseString(row.embossingDefect?.[1]),

    // Marking - 2 readings
    marking1: parseString(row.marking?.[0]),
    marking2: parseString(row.marking?.[1]),

    // Tempering Hardness - 2 readings
    temperingHardness1: parseString(row.temperingHardness?.[0]),
    temperingHardness2: parseString(row.temperingHardness?.[1]),

    boxGaugeRejected: parseNumber(row.boxGaugeRejected),
    flatBearingAreaRejected: parseNumber(row.flatBearingAreaRejected),
    fallingGaugeRejected: parseNumber(row.fallingGaugeRejected),
    surfaceDefectRejected: parseNumber(row.surfaceDefectRejected),
    embossingDefectRejected: parseNumber(row.embossingDefectRejected),
    markingRejected: parseNumber(row.markingRejected),
    temperingHardnessRejected: parseNumber(row.temperingHardnessRejected),

    remarks: row.remarks,
    createdBy: row.createdBy
});

const transformTestingFinishingRow = (row) => ({
    hourIndex: row.hour,
    shift: row.shift,
    hourLabel: row.hourLabel,
    noProduction: row.noProduction,
    lotNo: row.lotNo,
    toeLoad1: parseNumber(row.toeLoad?.[0]),
    toeLoad2: parseNumber(row.toeLoad?.[1]),
    weight1: parseNumber(row.weight?.[0]),
    weight2: parseNumber(row.weight?.[1]),
    paintIdentification1: parseString(row.paintIdentification?.[0]),
    paintIdentification2: parseString(row.paintIdentification?.[1]),
    ercCoating1: parseString(row.ercCoating?.[0]),
    ercCoating2: parseString(row.ercCoating?.[1]),

    toeLoadRejected: parseNumber(row.toeLoadRejected),
    weightRejected: parseNumber(row.weightRejected),
    paintIdentificationRejected: parseNumber(row.paintIdentificationRejected),
    ercCoatingRejected: parseNumber(row.ercCoatingRejected),

    acceptedQty: parseNumber(row.acceptedQty),
    rejectedQty: parseNumber(row.rejectedQty),
    remarks: row.remarks,
    createdBy: row.createdBy
});
