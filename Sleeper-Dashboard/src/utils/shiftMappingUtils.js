/**
 * Utility functions to map and flatten backend responses for the ShiftContext state.
 */

export const mapWireTensionRecords = (responseData) => {
    if (!responseData) return [];
    const flattenedRecords = [];
    responseData.forEach(batchRecord => {
        const { batchNo, sleeperType, wiresPerSleeper, targetLoadKn, date, entryDate, plantId, vendorCode, shift } = batchRecord;

        (batchRecord.manualRecords || []).forEach(m => {
            flattenedRecords.push({
                ...m,
                batchNo,
                parentId: batchRecord.id,
                date: date || entryDate,
                entryDate,
                plantId,
                vendorCode,
                shift,
                modulus: m.modulus || m.youngsModulus,
                source: 'Manual',
                sleeperType,
                wiresPerSleeper,
                targetLoadKn
            });
        });

        (batchRecord.scadaRecords || []).forEach(s => {
            flattenedRecords.push({
                ...s,
                batchNo,
                parentId: batchRecord.id,
                date: date || entryDate,
                entryDate,
                plantId,
                vendorCode,
                shift,
                time: s.time || s.plcTime,
                modulus: s.modulus || s.youngsModulus,
                source: 'Scada',
                sleeperType,
                wiresPerSleeper,
                targetLoadKn
            });
        });
    });
    return flattenedRecords;
};

export const mapCompactionRecords = (responseData) => {
    if (!responseData) return [];
    const flattenedRecords = [];
    responseData.forEach(batchRecord => {
        const { batchNo, sleeperType, entryDate, shift, location, vendorCode, plantId } = batchRecord;

        (batchRecord.manualRecords || []).forEach(m => {
            flattenedRecords.push({
                ...m,
                batchNo,
                parentId: batchRecord.id,
                date: entryDate,
                shift,
                location,
                vendorCode,
                plantId,
                source: 'Manual',
                sleeperType
            });
        });

        (batchRecord.scadaRecords || []).forEach(s => {
            flattenedRecords.push({
                ...s,
                batchNo,
                parentId: batchRecord.id,
                date: entryDate,
                shift,
                location,
                vendorCode,
                plantId,
                source: 'Scada',
                sleeperType
            });
        });
    });
    return flattenedRecords;
};

export const mapSteamCuringRecords = (responseData) => {
    if (!responseData || !Array.isArray(responseData)) return [];
    const flattenedRecords = [];
    responseData.forEach(batchRecord => {
        const { batchNo, chamber, grade, entryDate, id, location, shift, vendorCode, plantId } = batchRecord;

        // Add a Summary/Header record for the batch
        flattenedRecords.push({
            id: `batch-${id}`,
            parentId: id,
            batchNo,
            chamberNo: chamber,
            date: entryDate,
            source: 'Batch',
            grade,
            location,
            shift,
            vendorCode,
            plantId,
            minConstTemp: '—',
            maxConstTemp: '—',
            status: 'REGISTERED',
            isHeader: true
        });

        (batchRecord.manualRecords || []).forEach(m => {
            flattenedRecords.push({
                ...m,
                id: `${id}-m-${m.id || Math.random()}`,
                manualId: m.id,
                parentId: id,
                batchNo,
                chamberNo: m.chamber || chamber,
                date: entryDate,
                source: 'Manual',
                grade,
                location,
                shift,
                vendorCode,
                plantId,
                minConstTemp: m.minTemp ?? '—',
                maxConstTemp: m.maxTemp ?? '—',
                status: (m.minTemp >= 55 && m.maxTemp <= 60) ? 'OK' : 'NOT OK'
            });
        });

        (batchRecord.scadaRecords || []).forEach(s => {
            const minT = s.constTempMin ?? s.minTemp;
            const maxT = s.constTempMax ?? s.maxTemp;
            const hasTemp = minT !== undefined && minT !== null;
            flattenedRecords.push({
                ...s,
                id: `${id}-s-${s.id || Math.random()}`,
                parentId: id,
                batchNo,
                chamberNo: s.chamberNo || chamber,
                date: entryDate,
                source: 'Scada',
                grade,
                location,
                shift,
                vendorCode,
                plantId,
                minConstTemp: hasTemp ? minT : '—',
                maxConstTemp: hasTemp ? maxT : '—',
                status: hasTemp ? ((minT >= 55 && maxT <= 60) ? 'OK' : 'NOT OK') : 'N/A'
            });
        });
    });
    return flattenedRecords;
};

export const mapBatchWeighmentData = (responseData, containers) => {
    if (!responseData) return { declarations: {}, configs: {}, witnessed: {} };
    
    const allDeclarations = {};
    const allConfigs = {};
    const allWitnessed = {};

    responseData.forEach(session => {
        const matchedContainer = containers.find(c => c.name === session.lineNo);
        const containerId = matchedContainer ? matchedContainer.id : 1;

        const newDeclarations = (session.batchDetails || []).map(d => ({
            id: d.id,
            parentId: session.id,
            batchNo: d.batchNo,
            date: session.entryDate,
            location: session.lineNo,
            concreteGrade: session.concreteGrade,
            proportionMatch: d.proportionStatus,
            setValues: {
                ca1: d.ca1Set, ca2: d.ca2Set, fa: d.faSet,
                cement: d.cementSet, water: d.waterSet, admixture: d.admixtureSet
            },
            adjustedWeights: {
                ca1: d.ca1Ref, ca2: d.ca2Ref, fa: d.faRef,
                cement: d.cementRef, water: d.waterRef, admixture: d.admixtureRef
            }
        }));
        allDeclarations[containerId] = [...(allDeclarations[containerId] || []), ...newDeclarations];

        allConfigs[containerId] = {
            sandType: session.sandType,
            sensorStatus: (session.moistureSensorStatus || 'working').toLowerCase()
        };

        const witnessed = [];

        // 1. Create a "Session Header" record to ensure the session itself is logged
        witnessed.push({
            id: `session-${session.id}`,
            parentId: session.id,
            batchNo: session.remarks?.includes('Batch #') ? session.remarks.split('#')[1].split(' ')[0] : 'N/A',
            date: session.entryDate,
            time: session.time || 'N/A',
            location: session.lineNo,
            source: session.entryMode === 'MIXED' ? 'Mixed' : 'Session',
            remarks: session.remarks,
            sandType: session.sandType,
            sensorStatus: session.moistureSensorStatus,
            verifiedBy: session.verifiedBy,
            isHeader: true, // Special flag for UI
            ca1: '-', ca2: '-', fa: '-', cement: '-', water: '-', admixture: '-', total: 0
        });

        (session.scadaRecords || []).forEach(s => {
            witnessed.push({
                ...s,
                id: s.id,
                parentId: session.id,
                location: session.lineNo,
                concreteGrade: session.concreteGrade,
                source: 'Scada',
                type: 'weight-batching',
                ca1: s.ca1Actual,
                ca2: s.ca2Actual,
                fa: s.faActual,
                cement: s.cementActual,
                water: s.waterActual,
                admixture: s.admixtureActual,
                sandType: session.sandType,
                sensorStatus: session.moistureSensorStatus
            });
        });
        (session.manualRecords || []).forEach(m => {
            witnessed.push({
                ...m,
                id: m.id,
                parentId: session.id,
                location: session.lineNo,
                concreteGrade: session.concreteGrade,
                source: 'Manual',
                type: 'weight-batching',
                ca1: m.ca1Actual,
                ca2: m.ca2Actual,
                fa: m.faActual,
                cement: m.cementActual,
                water: m.waterActual,
                admixture: m.admixtureActual,
                sandType: session.sandType,
                sensorStatus: session.moistureSensorStatus
            });
        });
        allWitnessed[containerId] = [...(allWitnessed[containerId] || []), ...witnessed];
    });

    return { declarations: allDeclarations, configs: allConfigs, witnessed: allWitnessed };
};
