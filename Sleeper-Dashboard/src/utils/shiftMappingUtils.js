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
        const { batchNo, sleeperType, entryDate, shift, location, vendorCode, plantId, time } = batchRecord;
        const formattedTime = (time && typeof time === 'object') 
            ? `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}` 
            : (time || '');

        (batchRecord.manualRecords || []).forEach(m => {
            flattenedRecords.push({
                ...m,
                batchNo,
                parentId: batchRecord.id,
                date: entryDate,
                time: m.time || formattedTime,
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
                time: s.time || formattedTime,
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
        const { batchNo, chamber, grade, entryDate, id, location, shift, vendorCode, plantId, createdBy } = batchRecord;

        // Summary Header removed as per user request to avoid extra batch entry in logs

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
                createdBy,
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

        // Session Header removed as per user request to avoid extra batch entry in logs

        (session.scadaRecords || []).forEach(s => {
            const matchedBatch = (session.batchDetails || []).find(b => String(b.batchNo) === String(s.batchNo));
            const ca1Set = matchedBatch?.ca1Set ?? matchedBatch?.ca1Ref;
            const ca2Set = matchedBatch?.ca2Set ?? matchedBatch?.ca2Ref;
            const faSet = matchedBatch?.faSet ?? matchedBatch?.faRef;
            const cementSet = matchedBatch?.cementSet ?? matchedBatch?.cementRef;
            const waterSet = matchedBatch?.waterSet ?? matchedBatch?.waterRef;
            const admixtureSet = matchedBatch?.admixtureSet ?? matchedBatch?.admixtureRef;

            const totalAct = s.total ?? ((parseFloat(s.ca1Actual) || 0) + (parseFloat(s.ca2Actual) || 0) + (parseFloat(s.faActual) || 0) + (parseFloat(s.cementActual) || 0) + (parseFloat(s.waterActual) || 0) + (parseFloat(s.admixtureActual) || 0));

            witnessed.push({
                ...s,
                id: s.id,
                parentId: session.id,
                location: session.lineNo,
                concreteGrade: session.concreteGrade,
                source: 'Scada',
                type: 'weight-batching',
                ca1Set: s.ca1Set ?? ca1Set,
                ca2Set: s.ca2Set ?? ca2Set,
                faSet: s.faSet ?? faSet,
                cementSet: s.cementSet ?? cementSet,
                waterSet: s.waterSet ?? waterSet,
                admixtureSet: s.admixtureSet ?? admixtureSet,
                ca1: s.ca1Actual,
                ca2: s.ca2Actual,
                fa: s.faActual,
                cement: s.cementActual,
                water: s.waterActual,
                admixture: s.admixtureActual,
                total: totalAct,
                sandType: session.sandType,
                sensorStatus: session.moistureSensorStatus
            });
        });

        (session.manualRecords || []).forEach(m => {
            const matchedBatch = (session.batchDetails || []).find(b => String(b.batchNo) === String(m.batchNo));
            const ca1Set = matchedBatch?.ca1Set ?? matchedBatch?.ca1Ref;
            const ca2Set = matchedBatch?.ca2Set ?? matchedBatch?.ca2Ref;
            const faSet = matchedBatch?.faSet ?? matchedBatch?.faRef;
            const cementSet = matchedBatch?.cementSet ?? matchedBatch?.cementRef;
            const waterSet = matchedBatch?.waterSet ?? matchedBatch?.waterRef;
            const admixtureSet = matchedBatch?.admixtureSet ?? matchedBatch?.admixtureRef;

            const totalAct = m.total ?? ((parseFloat(m.ca1Actual) || 0) + (parseFloat(m.ca2Actual) || 0) + (parseFloat(m.faActual) || 0) + (parseFloat(m.cementActual) || 0) + (parseFloat(m.waterActual) || 0) + (parseFloat(m.admixtureActual) || 0));

            witnessed.push({
                ...m,
                id: m.id,
                parentId: session.id,
                location: session.lineNo,
                concreteGrade: session.concreteGrade,
                source: 'Manual',
                type: 'weight-batching',
                ca1Set: m.ca1Set ?? ca1Set,
                ca2Set: m.ca2Set ?? ca2Set,
                faSet: m.faSet ?? faSet,
                cementSet: m.cementSet ?? cementSet,
                waterSet: m.waterSet ?? waterSet,
                admixtureSet: m.admixtureSet ?? admixtureSet,
                ca1: m.ca1Actual,
                ca2: m.ca2Actual,
                fa: m.faActual,
                cement: m.cementActual,
                water: m.waterActual,
                admixture: m.admixtureActual,
                total: totalAct,
                sandType: session.sandType,
                sensorStatus: session.moistureSensorStatus
            });
        });
        allWitnessed[containerId] = [...(allWitnessed[containerId] || []), ...witnessed];
    });

    return { declarations: allDeclarations, configs: allConfigs, witnessed: allWitnessed };
};
