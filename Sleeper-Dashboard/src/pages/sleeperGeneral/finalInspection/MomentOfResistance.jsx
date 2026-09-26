import React, { useState, useEffect, useMemo, useCallback } from 'react';
import EnhancedDataTable from '../../../components/common/EnhancedDataTable';
import { useShift } from '../../../context/ShiftContext';
import { apiService } from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { formatToIST } from '../../../utils/helpers';

const DESIRED_VALUES = {
    centreTop: 450,
    centreBottom: 550,
    railSeat: 650
};

const isGrade = (val) => /^M\s*[-]?\s*\d+/i.test(String(val || '').trim());

const normalizeDwg = (dwg) => String(dwg || '').replace(/[\s-_:()]/g, '').trim().toLowerCase();

const normDate = (d) => {
    if (!d || d === 'N/A') return '';
    const s = String(d).trim().split('T')[0];
    if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
            const [d1, m1, y1] = parts;
            return `${y1}-${m1.padStart(2, '0')}-${d1.padStart(2, '0')}`;
        }
    }
    return s;
};

const normKey = (s) => String(s || '').replace(/[\s-_]/g, '').trim().toLowerCase();

const extractDrawingNo = (item, batchMatch) => {
    const candidates = [
        item?.drawingNo,
        item?.sleeperType,
        batchMatch?.drawingNo,
        batchMatch?.sleeperType,
    ];

    for (const cand of candidates) {
        if (cand && typeof cand === 'string' && cand.trim() && cand !== 'N/A' && !isGrade(cand)) {
            return cand.trim();
        }
    }

    const checkNested = (target) => {
        if (!target) return null;
        if (Array.isArray(target.chambers)) {
            for (const ch of target.chambers) {
                if (Array.isArray(ch.benchGroups)) {
                    for (const bg of ch.benchGroups) {
                        if (bg.sleeperType && !isGrade(bg.sleeperType)) {
                            return bg.sleeperType.trim();
                        }
                    }
                }
            }
        }
        if (Array.isArray(target.gangs)) {
            for (const g of target.gangs) {
                if (g.sleeperType && !isGrade(g.sleeperType)) {
                    return g.sleeperType.trim();
                }
            }
        }
        return null;
    };

    const nestedFromItem = checkNested(item);
    if (nestedFromItem) return nestedFromItem;

    const nestedFromMatch = checkNested(batchMatch);
    if (nestedFromMatch) return nestedFromMatch;

    if (item?.originalData) {
        const nestedFromOrig = checkNested(item.originalData);
        if (nestedFromOrig) return nestedFromOrig;
    }

    return (item?.drawingNo && !isGrade(item.drawingNo) ? item.drawingNo.trim() : '') || 
           (batchMatch?.drawingNo && !isGrade(batchMatch.drawingNo) ? batchMatch.drawingNo.trim() : '') || 
           (item?.sleeperType && !isGrade(item.sleeperType) ? item.sleeperType.trim() : '') || 
           (batchMatch?.sleeperType && !isGrade(batchMatch.sleeperType) ? batchMatch.sleeperType.trim() : '') || '';
};

const extractCastDate = (item, batchMatch, declaredMatch) => {
    // 1. Direct casting date on the item itself (if valid)
    if (item?.castingDate && item.castingDate !== 'N/A') return item.castingDate;
    if (item?.dateOfCasting && item.dateOfCasting !== 'N/A') return item.dateOfCasting;

    // 2. Remarks on item
    if (item?.remarks) {
        const m = String(item.remarks).match(/\[Cast:\s*([^\]]+)\]/i);
        if (m && m[1]) return m[1].trim();
    }

    // 3. Direct casting date on declaredMatch
    if (declaredMatch?.castingDate && declaredMatch.castingDate !== 'N/A') return declaredMatch.castingDate;
    if (declaredMatch?.dateOfCasting && declaredMatch.dateOfCasting !== 'N/A') return declaredMatch.dateOfCasting;

    // 4. Remarks on declaredMatch
    if (declaredMatch?.remarks) {
        const m = String(declaredMatch.remarks).match(/\[Cast:\s*([^\]]+)\]/i);
        if (m && m[1]) return m[1].trim();
    }

    // 5. BatchMatch from production declarations
    if (batchMatch?.castingDate && batchMatch.castingDate !== 'N/A') return batchMatch.castingDate;
    if (batchMatch?.dateOfCasting && batchMatch.dateOfCasting !== 'N/A') return batchMatch.dateOfCasting;
    if (batchMatch?.date && batchMatch.date !== 'N/A') return batchMatch.date;

    return '';
};

const extractDeclId = (item, batchMatch, declaredMatch) => {
    if (item?.productionDeclarationId && String(item.productionDeclarationId) !== 'null' && String(item.productionDeclarationId) !== 'undefined') {
        return String(item.productionDeclarationId);
    }
    if (item?.declarationId && String(item.declarationId) !== 'null' && String(item.declarationId) !== 'undefined') {
        return String(item.declarationId);
    }
    if (item?.remarks) {
        const m = String(item.remarks).match(/\[DeclId:\s*([^\]]+)\]/i);
        if (m && m[1]) return m[1].trim();
    }
    if (declaredMatch?.productionDeclarationId && String(declaredMatch.productionDeclarationId) !== 'null') {
        return String(declaredMatch.productionDeclarationId);
    }
    if (declaredMatch?.remarks) {
        const m = String(declaredMatch.remarks).match(/\[DeclId:\s*([^\]]+)\]/i);
        if (m && m[1]) return m[1].trim();
    }
    if (batchMatch?.id) return String(batchMatch.id);
    return null;
};

const MomentOfResistance = () => {
    const { vendorCode, dutyUnit, selectedShift, dutyDate, userId } = useShift();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('declaration');
    const [batches, setBatches] = useState([]);
    const [declaredRecords, setDeclaredRecords] = useState([]);
    const [historicalTests, setHistoricalTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDeclareModal, setShowDeclareModal] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedDeclRows, setSelectedDeclRows] = useState([]);
    const [selectedTestingRows, setSelectedTestingRows] = useState([]);

    const getCommonParams = useCallback(() => {
        const dateObj = new Date(dutyDate || new Date());
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();
        const formattedDate = `${d}/${m}/${y}`;

        return {
            plantId: dutyUnit || localStorage.getItem('dutyUnit'),
            vendorCode: vendorCode || localStorage.getItem('vendorCode'),
            shift: selectedShift || localStorage.getItem('selectedShift'),
            createdBy: userId || localStorage.getItem('userId'),
            date: formattedDate
        };
    }, [dutyDate, dutyUnit, vendorCode, selectedShift, userId]);

    const fetchMRData = useCallback(async () => {
        setLoading(true);
        try {
            const params = getCommonParams();

            // 1. Fetch all data in parallel
            const [vResponse, allProdResponse, waterTestsResponse, mrResponse, testResponse] = await Promise.all([
                apiService.getAllVerifedWaterBatchs(params).catch(() => []),
                apiService.getAllProductionDeclarations().catch(() => []),
                apiService.getAllWaterCubeTests().catch(() => []),
                apiService.getAllMRRecords().catch(() => []),
                apiService.getAllMRTests().catch(() => [])
            ]);

            const vData = vResponse?.responseData || vResponse || [];
            const allProdData = allProdResponse?.responseData || allProdResponse || [];
            const waterTests = waterTestsResponse?.responseData || waterTestsResponse || [];
            const mrData = mrResponse?.responseData || mrResponse || [];
            const testData = testResponse?.responseData || testResponse || [];
            
            const isSamePlant = (itemPlant, targetPlant) => {
                if (!targetPlant || !itemPlant) return true;
                return String(itemPlant).replace(':', '').trim() === String(targetPlant).replace(':', '').trim();
            };

            const completedWaterProdDeclIds = new Set(
                (Array.isArray(waterTests) ? waterTests : [])
                    .filter(t => isSamePlant(t.plantId, params.plantId))
                    .map(t => String(t.productionDeclarationId || t.waterCubeSampleDeclaration?.productionDeclarationId))
                    .filter(id => id && id !== 'null' && id !== 'undefined')
            );

            // Build exhaustive production declaration index by ID and by batchNumber
            const allBatches = [...(Array.isArray(allProdData) ? allProdData : []), ...(Array.isArray(vData) ? vData : [])];
            const declById = new Map();
            const declByBatchNo = new Map();
            const declSleeperMap = new Map();

            allBatches.forEach(v => {
                if (v && v.id) {
                    const idStr = String(v.id);
                    declById.set(idStr, v);

                    const bNo = String(v.batchNumber || '').trim();
                    if (bNo) {
                        if (!declByBatchNo.has(bNo)) declByBatchNo.set(bNo, []);
                        const arr = declByBatchNo.get(bNo);
                        if (!arr.some(d => String(d.id) === idStr)) {
                            arr.push(v);
                        }
                    }

                    // Build sleeper set for this declaration
                    const sleeperSet = new Set();
                    if (v.chambers && Array.isArray(v.chambers)) {
                        v.chambers.forEach(c => c.benchGroups?.forEach(bg => {
                            (bg.sleeperList || bg.sleepers || []).forEach(s => {
                                const sNo = typeof s === 'string' ? s : (s.sleeperNo || s.id);
                                if (sNo) sleeperSet.add(String(sNo).trim().toUpperCase());
                            });
                        }));
                    }
                    if (v.gangs && Array.isArray(v.gangs)) {
                        v.gangs.forEach(g => {
                            (g.gangGroups || []).forEach(gg => {
                                (gg.sleeperList || gg.sleepers || []).forEach(s => {
                                    const sNo = typeof s === 'string' ? s : (s.sleeperNo || s.id);
                                    if (sNo) sleeperSet.add(String(sNo).trim().toUpperCase());
                                });
                            });
                            (g.sleeperList || g.sleepers || []).forEach(s => {
                                const sNo = typeof s === 'string' ? s : (s.sleeperNo || s.id);
                                if (sNo) sleeperSet.add(String(sNo).trim().toUpperCase());
                            });
                        });
                    }
                    declSleeperMap.set(idStr, sleeperSet);
                }
            });

            const findDeclaration = (record, declaredMatch) => {
                if (!record && !declaredMatch) return null;

                // 1. Direct ID check
                const pId = record?.productionDeclarationId || declaredMatch?.productionDeclarationId;
                if (pId && declById.has(String(pId))) {
                    return declById.get(String(pId));
                }

                // 2. Remarks [DeclId: X] check
                const remarks = `${record?.remarks || ''} ${declaredMatch?.remarks || ''}`;
                const m = remarks.match(/\[DeclId:\s*([^\]]+)\]/i);
                if (m && m[1] && declById.has(String(m[1]).trim())) {
                    return declById.get(String(m[1]).trim());
                }

                const bNo = String(record?.batchNumber || declaredMatch?.batchNumber || '').trim();
                if (!bNo) return null;

                const candidates = declByBatchNo.get(bNo) || [];
                if (candidates.length === 0) return null;
                if (candidates.length === 1) return candidates[0];

                // 3. Match candidate by sleeper number
                const rawSleepers = String(record?.sleeperNo || declaredMatch?.sleeperNo || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                if (rawSleepers.length > 0) {
                    for (const cand of candidates) {
                        const sSet = declSleeperMap.get(String(cand.id));
                        if (sSet && rawSleepers.some(s => sSet.has(s))) {
                            return cand;
                        }
                    }
                }

                // 4. Match candidate by plant and casting date
                const targetCast = normDate(extractCastDate(record) || extractCastDate(declaredMatch));
                const targetPlant = String(record?.plantId || declaredMatch?.plantId || '').replace(':', '').trim();
                const filtered = candidates.filter(cand => {
                    const cCast = normDate(cand.castingDate || cand.dateOfCasting || cand.date);
                    const cPlant = String(cand.plantId || '').replace(':', '').trim();
                    const plantOk = !targetPlant || !cPlant || targetPlant === cPlant;
                    const castOk = !targetCast || !cCast || targetCast === cCast;
                    return plantOk && castOk;
                });

                if (filtered.length > 0) return filtered[0];
                return candidates[0];
            };

            const getDeclId = (record, declaredMatch) => {
                const decl = findDeclaration(record, declaredMatch);
                if (decl && decl.id) return String(decl.id);
                const direct = record?.productionDeclarationId || declaredMatch?.productionDeclarationId;
                if (direct && String(direct) !== 'null' && String(direct) !== 'undefined') return String(direct);
                return null;
            };

            const makeItemKey = (bNo, dwg, castDate) => {
                const b = String(bNo || '').trim().toLowerCase();
                const d = normalizeDwg(dwg);
                const dt = normDate(castDate);
                return `${b}__${d}${dt ? `__${dt}` : ''}`;
            };

            // Track completed tests (Pass or Fail) by declaration ID and fallback keys
            const completedDeclIds = new Set();
            const passedItemKeys = new Set();
            const failedItemKeys = new Set();
            testData
                .filter(t => isSamePlant(t.plantId, params.plantId))
                .forEach(t => {
                    const declaredMatch = mrData.find(d => d.id === t.monmentOfResistanceId);
                    const declId = getDeclId(t, declaredMatch);
                    if (declId) {
                        completedDeclIds.add(String(declId));
                    }
                    const itemKey = makeItemKey(t.batchNumber, extractDrawingNo(t, declaredMatch), extractCastDate(t, null, declaredMatch));
                    if (String(t.testResult).toLowerCase() === 'pass') {
                        passedItemKeys.add(itemKey);
                    } else if (String(t.testResult).toLowerCase() === 'fail') {
                        failedItemKeys.add(itemKey);
                    }
                });
            const completedItemKeys = new Set([...passedItemKeys, ...failedItemKeys]);

            // Track declared records in MR for THIS plant (Pending Test) by declaration ID and fallback keys
            const declaredDeclIds = new Set();
            const declaredItemKeys = new Set();
            mrData
                .filter(d => isSamePlant(d.plantId, params.plantId) && (!d.testResult || d.testResult === 'Pending' || d.status !== 'COMPLETED'))
                .forEach(d => {
                    const declId = getDeclId(d);
                    if (declId) {
                        declaredDeclIds.add(String(declId));
                    } else {
                        declaredItemKeys.add(makeItemKey(d.batchNumber, extractDrawingNo(d), extractCastDate(d)));
                    }
                });

            // Map Verified Batches (Pending Declaration for this plant)
            const seenDeclarationIds = new Set();
            const mappedVerified = vData
                .filter(item => isSamePlant(item.plantId, params.plantId))
                .filter(item => {
                    const bNo = String(item.batchNumber || '').trim();
                    if (!bNo) return false;

                    const pId = item.id ? String(item.id) : '';
                    if (pId) {
                        if (completedDeclIds.has(pId) || declaredDeclIds.has(pId) || seenDeclarationIds.has(pId)) {
                            return false;
                        }
                        seenDeclarationIds.add(pId);
                        return true;
                    }

                    const itemKey = makeItemKey(bNo, extractDrawingNo(item), extractCastDate(item));
                    if (declaredItemKeys.has(itemKey) || completedItemKeys.has(itemKey) || seenDeclarationIds.has(itemKey)) {
                        return false;
                    }
                    seenDeclarationIds.add(itemKey);
                    return true;
                })
                .map(item => {
                    const actualSleeperType = extractDrawingNo(item);
                    const actualCastingDate = extractCastDate(item) || 'N/A';
                    const samplesToTest = item.mrSamplesRequired || (item.condition2 ? 2 : 1);
                    const isWaterDone = Boolean(item.waterCubeTestStatus) || (item.id && completedWaterProdDeclIds.has(String(item.id)));
                    return {
                        id: item.id,
                        productionDeclarationId: item.id,
                        batchNo: item.batchNumber,
                        sleeperCategory: item.sleeperCategory,
                        sleeperType: actualSleeperType,
                        castingDate: actualCastingDate,
                        waterCubeStatus: isWaterDone ? 'Completed' : 'Not Completed',
                        mrSamplesNeeded: samplesToTest, 
                        mrTestType: 'Fresh',
                        status: 'Pending Declaration',
                        originalData: item
                    };
                });

            // Map Declared Records (Pending Results) - Support Multi-Batch / MRGroup grouping
            const pendingDeclaredItems = mrData
                .filter(item => isSamePlant(item.plantId, params.plantId))
                .filter(item => {
                    const decl = findDeclaration(item);
                    const pId = decl ? String(decl.id) : (item.productionDeclarationId ? String(item.productionDeclarationId) : null);
                    if (pId && completedDeclIds.has(pId)) return false;

                    const hasCompletedTest = testData.some(t => t.monmentOfResistanceId === item.id);
                    if (hasCompletedTest) return false;

                    const itemKey = makeItemKey(item.batchNumber, extractDrawingNo(item, decl), extractCastDate(item, decl));
                    if (!pId && completedItemKeys.has(itemKey)) return false;

                    return (!item.testResult || item.testResult === 'Pending' || item.status !== 'COMPLETED');
                });

            // Group pending declared items by MRGroup if they were declared together
            const groupMap = new Map();
            const singleDeclaredItems = [];

            pendingDeclaredItems.forEach(item => {
                const m = String(item.remarks || '').match(/\[MRGroup:\s*([^\]]+)\]/i);
                if (m && m[1]) {
                    const gId = m[1].trim();
                    if (!groupMap.has(gId)) {
                        groupMap.set(gId, []);
                    }
                    groupMap.get(gId).push(item);
                } else {
                    singleDeclaredItems.push(item);
                }
            });

            const groupedDeclaredList = [];
            groupMap.forEach((items, gId) => {
                const decls = items.map(findDeclaration);
                const bNos = items.map(i => String(i.batchNumber || '').trim()).filter(Boolean);
                const firstDecl = decls.find(Boolean) || items[0];

                const allSamples = items.flatMap(item => {
                    const bList = String(item.benchNumber || '').split(',').map(s => s.trim());
                    const sList = String(item.sleeperNo || '').split(',').map(s => s.trim());
                    return (sList.length > 0 && sList[0] !== '')
                        ? sList.map((no, idx) => ({ bench: bList[idx] || bList[0] || '', no: no, batch: item.batchNumber }))
                        : [{ bench: item.benchNumber || '', no: item.sleeperNo || '', batch: item.batchNumber }];
                });

                // Extract all unique sleeper types / drawing numbers across all batches in this group
                const allSleeperTypes = Array.from(new Set(
                    items.map((item, idx) => {
                        const dwg = extractDrawingNo(item, decls[idx]) || item.sleeperType;
                        return (dwg && !isGrade(dwg) && dwg !== 'N/A' && dwg !== '-') ? dwg.trim() : null;
                    }).filter(Boolean)
                ));
                const combinedSleeperType = allSleeperTypes.length > 0 ? allSleeperTypes.join(', ') : (extractDrawingNo(items[0], firstDecl) || items[0].sleeperType || '-');

                // Extract all unique casting dates across all batches in this group
                const allCastingDates = Array.from(new Set(
                    items.map((item, idx) => {
                        const cDate = extractCastDate(item, decls[idx]) || item.castingDate;
                        return (cDate && cDate !== 'N/A') ? cDate.trim() : null;
                    }).filter(Boolean)
                ));
                const combinedCastingDate = allCastingDates.length > 0 ? allCastingDates.join(', ') : (extractCastDate(items[0], firstDecl) || 'N/A');

                groupedDeclaredList.push({
                    id: items[0].id,
                    groupId: gId,
                    isGrouped: true,
                    groupRecords: items,
                    batchNo: bNos.join(', '),
                    batchNumber: bNos.join(', '),
                    batchNumbers: bNos,
                    sleeperCategory: items[0].sleeperCategory || firstDecl?.sleeperCategory,
                    sleeperType: combinedSleeperType,
                    declaredSamples: allSamples,
                    benchNumber: items.map(i => i.benchNumber).filter(Boolean).join(', '),
                    sleeperNo: items.map(i => i.sleeperNo).filter(Boolean).join(', '),
                    castingDate: combinedCastingDate,
                    status: 'Testing Pending',
                    mrTestType: items[0].mrTestType || 'Fresh',
                    isTestRecord: false,
                    originalData: firstDecl || items[0]
                });
            });

            const singleDeclaredList = singleDeclaredItems.map(item => {
                const decl = findDeclaration(item);
                const pId = decl ? String(decl.id) : (item.productionDeclarationId ? String(item.productionDeclarationId) : null);
                const bList = String(item.benchNumber || '').split(',').map(s => s.trim());
                const sList = String(item.sleeperNo || '').split(',').map(s => s.trim());
                const samples = (sList.length > 0 && sList[0] !== '') 
                    ? sList.map((no, idx) => ({
                        bench: bList[idx] || bList[0] || '',
                        no: no
                      }))
                    : [{ bench: item.benchNumber || '', no: item.sleeperNo || '' }];

                const actualCastingDate = extractCastDate(item, decl) || 'N/A';
                const actualSleeperType = extractDrawingNo(item, decl);

                return {
                    ...item,
                    productionDeclarationId: pId,
                    batchNo: item.batchNumber,
                    sleeperCategory: item.sleeperCategory || decl?.sleeperCategory,
                    sleeperType: actualSleeperType,
                    declaredSamples: samples,
                    castingDate: actualCastingDate, 
                    status: 'Testing Pending',
                    mrTestType: item.mrTestType || 'Fresh',
                    isTestRecord: false,
                    originalData: decl || item
                };
            });

            const mappedDeclared = [...groupedDeclaredList, ...singleDeclaredList];

            // Map Completed Tests (Historical) - Always shows individual entries for each batch
            const mappedHistorical = testData
                .filter(item => isSamePlant(item.plantId, params.plantId))
                .map(item => {
                    const declaredMatch = mrData.find(d => d.id === item.monmentOfResistanceId);
                    const decl = findDeclaration(item, declaredMatch);
                    const pId = decl ? String(decl.id) : (item.productionDeclarationId || declaredMatch?.productionDeclarationId);
                    const bench = item.benchNumber || declaredMatch?.benchNumber || 'N/A';
                    const sleeper = item.sleeperNo || declaredMatch?.sleeperNo || 'N/A';
                    const actualCastingDate = extractCastDate(item, decl, declaredMatch) || 'N/A';
                    const actualSleeperType = extractDrawingNo(item, decl || declaredMatch);

                    return {
                        ...item,
                        productionDeclarationId: pId,
                        batchNo: item.batchNumber,
                        sleeperCategory: item.sleeperCategory || decl?.sleeperCategory,
                        sleeperType: actualSleeperType,
                        benchNumber: bench,
                        sleeperNo: sleeper,
                        declaredSamples: item.declaredSamples || [{ bench: bench, no: sleeper }],
                        castingDate: actualCastingDate,
                        dateOfTesting: item.dateOfTesting || (item.createdDate ? item.createdDate.split('T')[0] : 'N/A'),
                        status: item.testResult || 'Pass',
                        isTestRecord: true,
                        originalData: decl || item
                    };
                });
            
            // Map Retest Batches (Items with Retest status that need re-declaration of 2 samples)
            const retestBatches = [...testData, ...mrData]
                .filter(item => isSamePlant(item.plantId, params.plantId))
                .filter(item => String(item.testResult || '').toLowerCase() === 'retest')
                .filter(item => {
                    const decl = findDeclaration(item);
                    const declId = decl ? String(decl.id) : (item.productionDeclarationId ? String(item.productionDeclarationId) : null);
                    if (declId && (completedDeclIds.has(declId) || declaredDeclIds.has(declId))) return false;
                    const castDate = extractCastDate(item, decl);
                    const itemKey = makeItemKey(item.batchNumber, extractDrawingNo(item, decl), castDate);
                    return !declaredItemKeys.has(itemKey) && !passedItemKeys.has(itemKey);
                })
                .map(item => {
                    const decl = findDeclaration(item);
                    const pId = decl ? String(decl.id) : (item.productionDeclarationId ? String(item.productionDeclarationId) : null);
                    const actualCastingDate = extractCastDate(item, decl) || 'N/A';
                    const actualSleeperType = extractDrawingNo(item, decl);

                    return {
                        id: pId || item.monmentOfResistanceId || item.id,
                        productionDeclarationId: pId,
                        batchNo: item.batchNumber,
                        sleeperCategory: item.sleeperCategory || decl?.sleeperCategory || 'Plain',
                        sleeperType: actualSleeperType,
                        castingDate: actualCastingDate,
                        waterCubeStatus: 'Completed',
                        mrSamplesNeeded: 2,
                        mrTestType: 'Retest',
                        status: 'Pending Declaration',
                        originalData: decl || item,
                        isRetest: true
                    };
                });

            // Deduplicate retest batches by (batchNo + sleeperType + castingDate)
            const uniqueRetestMap = new Map();
            retestBatches.forEach(b => {
                const key = makeItemKey(b.batchNo, b.sleeperType, b.castingDate);
                if (!uniqueRetestMap.has(key)) {
                    uniqueRetestMap.set(key, b);
                }
            });
            const uniqueRetestBatches = Array.from(uniqueRetestMap.values());

            setBatches([...uniqueRetestBatches, ...mappedVerified]);
            setDeclaredRecords(mappedDeclared);
            setHistoricalTests(mappedHistorical);
        } catch (error) {
            console.error("Failed to fetch MR data:", error);
            toast.error("Error fetching MR data.");
        } finally {
            setLoading(false);
        }
    }, [getCommonParams, toast]);

    useEffect(() => {
        fetchMRData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filtered lists for tabs
    const declarationList = useMemo(() => batches.filter(b => b.status === 'Pending Declaration' && b.waterCubeStatus !== 'Rejected'), [batches]);
    const testingList = useMemo(() => declaredRecords, [declaredRecords]);
    const historicalList = useMemo(() => historicalTests, [historicalTests]);

    const handleDeclareSamples = async (target, samplesData) => {
        setLoading(true);
        try {
            const currentUserId = parseInt(userId || localStorage.getItem('userId'), 10) || 0;
            const params = getCommonParams();
            const targetBatches = Array.isArray(target) ? target : [target];
            const isMultiple = targetBatches.length > 1;
            const groupId = isMultiple ? `MRG-${Date.now()}` : null;
            const allBatchNumbers = targetBatches.map(b => String(b.batchNo || b.batchNumber));

            for (const batch of targetBatches) {
                const batchKey = String(batch.id || batch.batchNo || batch.batchNumber);
                const samples = Array.isArray(samplesData) ? samplesData : (samplesData[batchKey] || samplesData['default'] || [{ bench: '', no: '' }]);
                const declId = batch.productionDeclarationId || extractDeclId(batch) || batch.id;
                const declTag = declId ? `[DeclId: ${declId}] ` : '';
                const castTag = batch.castingDate ? `[Cast: ${batch.castingDate}] ` : '';
                const groupTag = groupId ? `[MRGroup: ${groupId}] [GroupBatches: ${allBatchNumbers.join(',')}] ` : '';

                if (batch.id && batch.status === 'Testing Pending') {
                    // UPDATE if existing record
                    const baseRemarks = batch.remarks && batch.remarks.includes('[DeclId:') 
                        ? batch.remarks 
                        : `${groupTag}${declTag}${castTag}${batch.remarks || 'Declaration Updated'}`;
                    const payload = {
                        batchNumber: String(batch.batchNumber || batch.batchNo),
                        sleeperType: batch.sleeperType,
                        castingDate: batch.castingDate,
                        benchNumber: Array.from(new Set(samples.map(s => s.bench).filter(Boolean))).join(', '),
                        sleeperNo: samples.map(s => s.no).filter(Boolean).join(', '),
                        testResult: batch.testResult || 'Pending',
                        remarks: baseRemarks,
                        vendorCode: params.vendorCode,
                        plantId: params.plantId,
                        shift: params.shift,
                        createdBy: batch.createdBy || currentUserId,
                        updatedBy: currentUserId
                    };
                    await apiService.updateMRRecord(batch.id, payload);
                } else {
                    // CREATE entry with samples
                    const benchNos = Array.from(new Set(samples.map(s => s.bench).filter(Boolean))).join(', ');
                    const sleeperNos = samples.map(s => s.no).filter(Boolean).join(', ');
                    const payload = {
                        batchNumber: String(batch.batchNo || batch.batchNumber),
                        sleeperType: batch.sleeperType,
                        castingDate: batch.castingDate,
                        benchNumber: benchNos,
                        sleeperNo: sleeperNos,
                        testResult: 'Pending',
                        mrTestType: batch.mrTestType || 'Fresh',
                        remarks: `${groupTag}${declTag}${castTag}Declared for MR ${batch.mrTestType || 'Fresh'} Testing (${samples.length} Sleeper${samples.length > 1 ? 's' : ''})`,
                        vendorCode: params.vendorCode,
                        plantId: params.plantId,
                        shift: params.shift,
                        createdBy: currentUserId,
                        updatedBy: currentUserId
                    };

                    await apiService.createMRRecord(payload);
                }
            }

            toast.success(isMultiple ? `Samples declared successfully for ${targetBatches.length} batches!` : "Samples declared successfully!");
            setSelectedDeclRows([]);
            setActiveTab('testing');
            await fetchMRData();
            setShowDeclareModal(false);
        } catch (error) {
            console.error("Failed to declare MR samples:", error);
            toast.error("Failed to save declaration.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTestResults = async (record, results) => {
        setLoading(true);
        try {
            const currentUserId = parseInt(userId || localStorage.getItem('userId'), 10) || 0;
            const params = getCommonParams();
            const testResultStatus = results.result; // 'Pass', 'Retest', 'Fail'

            const groupItems = record.groupRecords || (Array.isArray(record) ? record : [record]);

            for (const item of groupItems) {
                const declId = item.productionDeclarationId || extractDeclId(item);
                const declTag = declId ? `[DeclId: ${declId}] ` : '';
                const actualCastDate = (item.castingDate && item.castingDate !== 'N/A')
                    ? item.castingDate
                    : (item.originalData?.castingDate || item.originalData?.dateOfCasting || '');
                const castTag = actualCastDate ? `[Cast: ${actualCastDate}] ` : '';

                const payload = {
                    batchNumber: String(item.batchNumber || item.batchNo),
                    sleeperType: item.sleeperType || record.sleeperType,
                    benchNumber: String(item.benchNumber || item.declaredSamples?.[0]?.bench || results.results?.[0]?.bench || ''),
                    sleeperNo: String(item.sleeperNo || item.declaredSamples?.map(s => s.no).join(', ') || results.results?.[0]?.no || ''),
                    castingDate: actualCastDate || params.date,
                    dateOfTesting: results.dateOfTesting || item.dateOfTesting || params.date || new Date().toISOString().split('T')[0],
                    remarks: `${declTag}${castTag}MR Test ${testResultStatus}`,
                    testResult: testResultStatus,
                    vendorCode: params.vendorCode,
                    plantId: params.plantId,
                    shift: params.shift,
                    createdBy: item.createdBy || currentUserId,
                    updatedBy: currentUserId,
                    monmentOfResistanceId: item.monmentOfResistanceId || item.id,
                    details: results.results.map(r => ({
                        dataType: r.isScada ? 'SCADA' : 'MANUAL',
                        ct: parseFloat(r.ct) || 0,
                        cb: parseFloat(r.cb) || 0,
                        rs1: parseFloat(r.rs1) || 0,
                        rs2: parseFloat(r.rs2) || 0
                    }))
                };

                if (item.isTestRecord) {
                    await apiService.updateMRTest(item.id, payload);
                } else {
                    await apiService.createMRTest(payload);
                }

                if (testResultStatus === 'Retest' && item.id) {
                    try {
                        await apiService.updateMRRecord(item.id, {
                            ...item,
                            testResult: 'Retest',
                            mrTestType: 'Retest',
                            mrSamplesNeeded: 2,
                            remarks: 'Retest Required (2 Sleepers needed)'
                        });
                    } catch (e) {
                        console.warn("MR record retest update notice:", e);
                    }
                }
            }

            const batchNames = groupItems.map(b => b.batchNumber || b.batchNo).join(', ');
            if (testResultStatus === 'Pass') {
                toast.success(`MR Test Passed for batch(es): ${batchNames}! Entry shifted to completed testing.`);
                setActiveTab('historical');
            } else if (testResultStatus === 'Fail') {
                toast.error(`MR Test Failed for batch(es): ${batchNames}! Sleepers rejected.`);
                setActiveTab('historical');
            } else if (testResultStatus === 'Retest') {
                toast.warning(`MR Test set to Retest for batch(es): ${batchNames}. Moved back for Retest.`);
                setActiveTab('declaration');
            }

            setSelectedTestingRows([]);
            await fetchMRData();
            setShowTestModal(false);
        } catch (error) {
            console.error("Failed to save MR test results:", error);
            toast.error("Failed to save test results.");
        } finally {
            setLoading(false);
        }
    };

    const columnsDeclaration = [
        { key: 'batchNo', label: 'BATCH NUMBER' },
        { 
            key: 'sleeperType', 
            label: 'DWG. NO.',
            render: (val, row) => (val && !isGrade(val)) ? val : (extractDrawingNo(row) || val || '-')
        },
        { key: 'castingDate', label: 'DATE OF CASTING' },
        {
            key: 'waterCubeStatus',
            label: 'WATER CUBE TESTING',
            render: (val) => (
                <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                    background: val === 'Completed' ? '#ecfdf5' : '#fff7ed',
                    color: val === 'Completed' ? '#059669' : '#c2410c'
                }}>
                    {val}
                </span>
            )
        },
        { key: 'mrSamplesNeeded', label: 'SAMPLES TO TEST' },
        { key: 'mrTestType', label: 'MR TEST TYPE' },
        {
            key: 'actions',
            label: 'ACTIONS',
            render: (_, row) => (
                <button
                    className="btn-verify"
                    disabled={row.waterCubeStatus !== 'Completed'}
                    onClick={() => { setSelectedBatch(row); setShowDeclareModal(true); }}
                    style={{ opacity: row.waterCubeStatus === 'Completed' ? 1 : 0.5 }}
                >
                    Declare Samples
                </button>
            )
        }
    ];

    const handleDeleteLog = async (target, isTest) => {
        if (!window.confirm(`Are you sure you want to delete this ${isTest ? 'test result' : 'sample declaration'}?`)) return;
        setLoading(true);
        try {
            if (isTest) {
                await apiService.deleteMRTest(target.id || target);
                toast.success("Test record deleted. Sample is now pending result again.");
                setActiveTab('testing');
            } else {
                if (target.isGrouped && target.groupRecords) {
                    await Promise.all(target.groupRecords.map(r => apiService.deleteMRRecord(r.id)));
                } else {
                    await apiService.deleteMRRecord(target.id || target);
                }
                toast.success("Declaration deleted. Batch is now pending declaration.");
                setActiveTab('declaration');
            }
            await fetchMRData();
            setShowViewModal(false);
        } catch (error) {
            console.error("Failed to delete MR record:", error);
            toast.error("Failed to delete record.");
        } finally {
            setLoading(false);
        }
    };

    const [showViewModal, setShowViewModal] = useState(false);

    const columnsTesting = [
        { 
            key: 'batchNo', 
            label: 'BATCH NUMBER',
            render: (val, row) => {
                const bList = String(val || '').split(',').map(s => s.trim()).filter(Boolean);
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            {bList.join(', ')}
                        </span>
                        {row.isGrouped && (
                            <span style={{ fontSize: '9px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                Grouped ({row.groupRecords?.length || bList.length})
                            </span>
                        )}
                    </div>
                );
            }
        },
        { 
            key: 'sleeperType', 
            label: 'DWG. NO.',
            render: (val, row) => {
                if (row.isGrouped && row.groupRecords) {
                    const types = Array.from(new Set(
                        row.groupRecords.map(r => (r.sleeperType && !isGrade(r.sleeperType) && r.sleeperType !== 'N/A' && r.sleeperType !== '-') ? r.sleeperType.trim() : (extractDrawingNo(r) || r.sleeperType))
                            .filter(t => t && t !== '-' && t !== 'N/A' && !isGrade(t))
                    ));
                    if (types.length > 0) return types.join(', ');
                }
                return (val && !isGrade(val)) ? val : (extractDrawingNo(row) || val || '-');
            }
        },
        {
            key: 'declaredSamples',
            label: 'SLEEPER NUMBER',
            render: (val, row) => {
                if (Array.isArray(val) && val.length > 0) {
                    return val.map(s => s.no).filter(Boolean).join(', ');
                }
                return row.sleeperNo || '-';
            }
        },
        { 
            key: 'castingDate', 
            label: 'DATE OF CASTING',
            render: (val, row) => {
                if (row.isGrouped && row.groupRecords) {
                    const dates = Array.from(new Set(
                        row.groupRecords.map(r => extractCastDate(r) || r.castingDate).filter(d => d && d !== 'N/A')
                    ));
                    if (dates.length > 0) return dates.join(', ');
                }
                return val || '-';
            }
        },
        {
            key: 'actions',
            label: 'ACTIONS',
            render: (_, row) => (
                <button 
                    className="btn-verify" 
                    style={{ fontSize: '10px', padding: '6px 14px' }} 
                    onClick={() => { setSelectedBatch(row); setShowViewModal(true); }}
                >
                    View Details
                </button>
            )
        }
    ];

    const columnsHistorical = [
        { key: 'batchNo', label: 'BATCH NUMBER' },
        { 
            key: 'sleeperType', 
            label: 'DWG. NO.',
            render: (val, row) => (val && !isGrade(val)) ? val : (extractDrawingNo(row) || val || '-')
        },
        { key: 'sleeperNo', label: 'SLEEPER NO.' },
        { key: 'castingDate', label: 'DATE OF CASTING' },
        { key: 'dateOfTesting', label: 'DATE OF TESTING' },
        {
            key: 'testResult',
            label: 'TEST RESULT',
            render: (val, row) => {
                const res = val || row.status || 'Pass';
                return (
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        background: res === 'Pass' ? '#ecfdf5' : (res === 'Retest' ? '#fff7ed' : '#fee2e2'),
                        color: res === 'Pass' ? '#059669' : (res === 'Retest' ? '#c2410c' : '#b91c1c')
                    }}>
                        {res}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            label: 'ACTIONS',
            render: (_, row) => (
                <button 
                    className="btn-verify" 
                    style={{ fontSize: '10px', padding: '6px 14px' }} 
                    onClick={() => { setSelectedBatch(row); setShowViewModal(true); }}
                >
                    View Details
                </button>
            )
        }
    ];

    return (
        <div className="mr-module cement-forms-scope">
            <header style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#13343b', margin: 0 }}>Moment of Resistance (Final Inspection)</h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Structural integrity testing for concrete sleepers</p>
            </header>

            <div className="nav-tabs" style={{
                marginBottom: '32px',
                display: 'flex',
                gap: '8px',
                background: '#f1f5f9',
                padding: '6px',
                borderRadius: '14px',
                width: 'fit-content',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0'
            }}>
                {[
                    { id: 'declaration', label: 'Sample Declaration' },
                    { id: 'testing', label: 'Enter Test Results' },
                    { id: 'historical', label: 'Historical Records' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                        style={{
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: activeTab === tab.id ? '800' : '600',
                            background: activeTab === tab.id ? '#fff' : 'transparent',
                            color: activeTab === tab.id ? '#13343b' : '#64748b',
                            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transform: activeTab === tab.id ? 'scale(1.02)' : 'scale(1)',
                        }}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'declaration' && (
                    <div className="section-card">
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h4 style={{ margin: 0, color: '#475569' }}>Pending MR Sample Declaration</h4>
                                {selectedDeclRows.length > 0 && (
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f766e', background: '#ccfbf1', padding: '4px 10px', borderRadius: '20px' }}>
                                        {selectedDeclRows.length} batch{selectedDeclRows.length > 1 ? 'es' : ''} selected
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {selectedDeclRows.length > 0 && (
                                    <button
                                        className="btn-verify"
                                        style={{ background: '#0f766e', padding: '8px 18px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}
                                        onClick={() => {
                                            setSelectedBatch(selectedDeclRows);
                                            setShowDeclareModal(true);
                                        }}
                                    >
                                        Declare Selected Batches ({selectedDeclRows.length})
                                    </button>
                                )}
                                <button 
                                    className="toggle-btn mini" 
                                    onClick={fetchMRData}
                                    disabled={loading}
                                >
                                    {loading ? 'Refreshing...' : '↻ Refresh Data'}
                                </button>
                            </div>
                        </div>
                        <EnhancedDataTable 
                            columns={columnsDeclaration} 
                            data={declarationList} 
                            loading={loading}
                            selectable={true}
                            onSelectionChange={setSelectedDeclRows}
                        />
                    </div>
                )}
                {activeTab === 'testing' && (
                    <div className="section-card">
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h4 style={{ margin: 0, color: '#475569' }}>Samples Declared (Pending Testing)</h4>
                                {selectedTestingRows.length > 0 && (
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f766e', background: '#ccfbf1', padding: '4px 10px', borderRadius: '20px' }}>
                                        {selectedTestingRows.length} selected
                                    </span>
                                )}
                            </div>
                            {selectedTestingRows.length > 1 && (
                                <button
                                    className="btn-verify"
                                    style={{ background: '#0f766e', padding: '8px 18px', fontSize: '12px', fontWeight: '700', borderRadius: '8px' }}
                                    onClick={() => {
                                        const combinedBatch = {
                                            isGrouped: true,
                                            groupRecords: selectedTestingRows.flatMap(r => r.groupRecords || [r]),
                                            batchNo: selectedTestingRows.map(r => r.batchNo || r.batchNumber).join(', '),
                                            batchNumber: selectedTestingRows.map(r => r.batchNo || r.batchNumber).join(', '),
                                            sleeperType: selectedTestingRows[0].sleeperType,
                                            castingDate: selectedTestingRows[0].castingDate,
                                            declaredSamples: selectedTestingRows.flatMap(r => r.declaredSamples || [{ bench: r.benchNumber, no: r.sleeperNo }]),
                                            benchNumber: selectedTestingRows.map(r => r.benchNumber).filter(Boolean).join(', '),
                                            sleeperNo: selectedTestingRows.map(r => r.sleeperNo).filter(Boolean).join(', ')
                                        };
                                        setSelectedBatch(combinedBatch);
                                        setShowTestModal(true);
                                    }}
                                >
                                    Enter Test Details for Selected ({selectedTestingRows.length})
                                </button>
                            )}
                        </div>
                        <EnhancedDataTable 
                            columns={columnsTesting} 
                            data={testingList}
                            selectable={true}
                            onSelectionChange={setSelectedTestingRows}
                        />
                    </div>
                )}
                {activeTab === 'historical' && (
                    <div className="section-card">
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#475569' }}>Recent Testing Results</h4>
                            <button 
                                className="toggle-btn mini" 
                                onClick={fetchMRData}
                                disabled={loading}
                            >
                                {loading ? 'Refreshing...' : '↻ Refresh Data'}
                            </button>
                        </div>
                        <EnhancedDataTable columns={columnsHistorical} data={historicalList} selectable={true} />
                    </div>
                )}
            </div>

            {showViewModal && (
                <MRDetailsModal
                    batch={selectedBatch}
                    onClose={() => setShowViewModal(false)}
                    onModify={() => {
                        setShowViewModal(false);
                        if (selectedBatch.isTestRecord) {
                            setShowTestModal(true);
                        } else {
                            setShowDeclareModal(true);
                        }
                    }}
                    onDelete={() => handleDeleteLog(selectedBatch, selectedBatch.isTestRecord)}
                    onEnterTest={() => {
                        setShowViewModal(false);
                        setShowTestModal(true);
                    }}
                />
            )}

            {showDeclareModal && (
                <DeclareSampleModal
                    batch={selectedBatch}
                    onClose={() => setShowDeclareModal(false)}
                    onSave={handleDeclareSamples}
                    isEdit={!Array.isArray(selectedBatch) && selectedBatch?.status === 'Testing Pending'}
                />
            )}

            {showTestModal && (
                <TestDetailsModal
                    batch={selectedBatch}
                    onClose={() => setShowTestModal(false)}
                    onSave={handleSaveTestResults}
                />
            )}
        </div>
    );
};

const DeclareSampleModal = ({ batch, onClose, onSave, isEdit }) => {
    const isMultiBatch = Array.isArray(batch);
    const targetBatches = useMemo(() => isMultiBatch ? batch : [batch], [isMultiBatch, batch]);

    // Track samples per batch key: { [batchKey]: [{ bench: '', no: '' }] }
    const [batchSamples, setBatchSamples] = useState(() => {
        const initial = {};
        targetBatches.forEach(b => {
            const key = String(b.id || b.batchNo || b.batchNumber);
            if (isEdit && b.declaredSamples) {
                initial[key] = b.declaredSamples;
            } else {
                initial[key] = Array.from({ length: b.mrSamplesNeeded || 1 }, () => ({ bench: '', no: '' }));
            }
        });
        return initial;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [availableSleepersMap, setAvailableSleepersMap] = useState({});
    const [loadingSleepersMap, setLoadingSleepersMap] = useState({});
    const [searchTermMap, setSearchTermMap] = useState({});
    const [activeDropdownKey, setActiveDropdownKey] = useState(null); // `${batchKey}_${sampleIdx}`

    // Fetch sleepers for each target batch
    useEffect(() => {
        targetBatches.forEach(async (b) => {
            const batchKey = String(b.id || b.batchNo || b.batchNumber);
            const batchNo = b.batchNo || b.batchNumber;
            if (!batchNo) return;

            setLoadingSleepersMap(prev => ({ ...prev, [batchKey]: true }));
            try {
                let list = [];
                const extractFromData = (data) => {
                    const result = [];
                    if (!data) return result;
                    if (data?.chambers && Array.isArray(data.chambers)) {
                        data.chambers.forEach(chamber => {
                            chamber.benchGroups?.forEach(group => {
                                const sList = group.sleeperList || group.sleepers || [];
                                sList.forEach(item => {
                                    const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                                    if (!s) return;
                                    result.push({
                                        bench: String(group.benchNo || ''),
                                        no: String(s),
                                        label: String(s)
                                    });
                                });
                            });
                        });
                    }
                    if (data?.gangs && Array.isArray(data.gangs)) {
                        data.gangs.forEach(gang => {
                            gang.gangGroups?.forEach(group => {
                                const sList = group.sleeperList || group.sleepers || [];
                                sList.forEach(item => {
                                    const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                                    if (!s) return;
                                    result.push({
                                        bench: String(group.gangNo || group.benchNo || ''),
                                        no: String(s),
                                        label: String(s)
                                    });
                                });
                            });
                            const sList = gang.sleeperList || gang.sleepers || [];
                            sList.forEach(item => {
                                const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                                if (!s) return;
                                result.push({
                                    bench: String(gang.gangNo || gang.gangFrom || ''),
                                    no: String(s),
                                    label: String(s)
                                });
                            });
                        });
                    }
                    return result;
                };

                list = extractFromData(b?.originalData) || [];
                if (list.length === 0 && b?.batchMatch) {
                    list = extractFromData(b.batchMatch) || [];
                }
                if (list.length === 0 && (b?.chambers || b?.gangs)) {
                    list = extractFromData(b) || [];
                }

                const declId = b?.productionDeclarationId || b?.declarationId || b?.id;
                if (list.length === 0 && declId) {
                    try {
                        const response = await (apiService.getProductionDeclarationById || apiService.getProductionDeclarationRecordById)(declId);
                        const data = response?.responseData || response;
                        list = extractFromData(data) || [];
                    } catch (e) {
                        console.warn("Fetch by declId failed:", e);
                    }
                }

                const resolvedDwg = (b?.sleeperType && !isGrade(b.sleeperType)) ? b.sleeperType : (extractDrawingNo(b) || b?.sleeperType || null);
                if (list.length === 0) {
                    try {
                        const sleepersRes = await apiService.getAllProductionSleepers(batchNo, null, resolvedDwg !== '-' ? resolvedDwg : null);
                        const sleepersList = sleepersRes?.responseData || sleepersRes || [];
                        if (Array.isArray(sleepersList) && sleepersList.length > 0) {
                            sleepersList.forEach(item => {
                                const s = typeof item === 'string' ? item : (item.sleeperNo || item.id);
                                if (!s) return;
                                const match = String(s).match(/^(\d+)/);
                                const benchNo = match ? match[1] : '1';
                                list.push({
                                    bench: benchNo,
                                    no: String(s),
                                    label: String(s)
                                });
                            });
                        }
                    } catch (e) {
                        console.warn("getAllProductionSleepers failed:", e);
                    }
                }

                const seenSleepers = new Set();
                const uniqueList = [];
                list.forEach(item => {
                    const key = `${item.bench}_${item.no}`;
                    if (!seenSleepers.has(key)) {
                        seenSleepers.add(key);
                        uniqueList.push(item);
                    }
                });

                setAvailableSleepersMap(prev => ({ ...prev, [batchKey]: uniqueList }));
            } catch (error) {
                console.error("Error fetching sleepers:", error);
            } finally {
                setLoadingSleepersMap(prev => ({ ...prev, [batchKey]: false }));
            }
        });
    }, [targetBatches]);

    const handleUpdateSleeper = (batchKey, sampleIdx, sleeperObj) => {
        setBatchSamples(prev => {
            const currentList = [...(prev[batchKey] || [{ bench: '', no: '' }])];
            currentList[sampleIdx] = { bench: sleeperObj.bench, no: sleeperObj.no };
            return { ...prev, [batchKey]: currentList };
        });
        setActiveDropdownKey(null);
    };

    const isAllSleepersSelected = () => {
        for (const b of targetBatches) {
            const key = String(b.id || b.batchNo || b.batchNumber);
            const samples = batchSamples[key] || [];
            if (samples.length === 0 || samples.some(s => !s.bench || !s.no)) {
                return false;
            }
        }
        return true;
    };

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: targetBatches.length > 1 ? '750px' : '600px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">
                        {targetBatches.length > 1 ? `Declare Sleeper Samples for MR Testing (${targetBatches.length} Batches)` : 'Declare Sleeper Sample for MR Testing'}
                    </span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                    {/* Multi-Batch Overview Card */}
                    {targetBatches.length > 1 ? (
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f766e', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Selected Batches ({targetBatches.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {targetBatches.map((b, idx) => (
                                    <span key={idx} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                                        Batch: {b.batchNo || b.batchNumber} ({b.sleeperType || 'RT-8746'})
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <div className="form-grid">
                                <div className="input-group"><label>Batch</label><input readOnly value={targetBatches[0]?.batchNo || targetBatches[0]?.batchNumber} className="readOnly" /></div>
                                <div className="input-group"><label>Dwg. no.</label><input readOnly value={targetBatches[0]?.sleeperType || extractDrawingNo(targetBatches[0]) || '-'} className="readOnly" /></div>
                            </div>
                        </div>
                    )}

                    {/* Sleeper selection for each batch */}
                    {targetBatches.map((b, bIdx) => {
                        const batchKey = String(b.id || b.batchNo || b.batchNumber);
                        const samples = batchSamples[batchKey] || [{ bench: '', no: '' }];
                        const availableSleepers = availableSleepersMap[batchKey] || [];
                        const isLoadingSleepers = loadingSleepersMap[batchKey] || false;
                        const resolvedDwg = (b?.sleeperType && !isGrade(b.sleeperType)) ? b.sleeperType : (extractDrawingNo(b) || b?.sleeperType || '-');

                        return (
                            <div key={bIdx} style={{ 
                                marginBottom: '20px', background: '#fff', padding: '16px', borderRadius: '12px', 
                                border: '1.5px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' 
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '13px', color: '#13343b', fontWeight: '800' }}>
                                        Batch {b.batchNo || b.batchNumber} <span style={{ fontWeight: '500', color: '#64748b' }}>({resolvedDwg})</span>
                                    </h4>
                                    <span style={{ fontSize: '11px', color: '#0f766e', fontWeight: '700', background: '#f0fdfa', padding: '2px 8px', borderRadius: '4px' }}>
                                        {b.mrSamplesNeeded || 1} sample needed
                                    </span>
                                </div>

                                {samples.map((s, idx) => {
                                    const dropdownKey = `${batchKey}_${idx}`;
                                    const currentSearch = searchTermMap[dropdownKey] || '';
                                    return (
                                        <div key={idx} style={{ marginTop: '8px' }}>
                                            <div className="input-group" style={{ position: 'relative' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                                                    Select Sleeper {samples.length > 1 ? `#${idx + 1}` : ''} <span className="required">*</span>
                                                </label>
                                                <div className="searchable-dropdown-wrapper">
                                                    <input 
                                                        type="text" 
                                                        placeholder={isLoadingSleepers ? "Loading sleepers..." : "Type to search sleeper (e.g. 176A)..."}
                                                        value={activeDropdownKey === dropdownKey ? currentSearch : (s.no || '')}
                                                        onFocus={() => {
                                                            setActiveDropdownKey(dropdownKey);
                                                            setSearchTermMap(prev => ({ ...prev, [dropdownKey]: '' }));
                                                        }}
                                                        onChange={(e) => setSearchTermMap(prev => ({ ...prev, [dropdownKey]: e.target.value }))}
                                                        style={{ 
                                                            paddingRight: '36px',
                                                            borderColor: activeDropdownKey === dropdownKey ? '#42818c' : '#cbd5e1'
                                                        }}
                                                    />
                                                    <div style={{ 
                                                        position: 'absolute', 
                                                        right: '12px', 
                                                        top: '50%', 
                                                        transform: 'translateY(15%)',
                                                        color: '#64748b',
                                                        pointerEvents: 'none'
                                                    }}>
                                                        {isLoadingSleepers ? (
                                                            <div className="spinner-mini"></div>
                                                        ) : (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M6 9l6 6 6-6"/>
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {activeDropdownKey === dropdownKey && (
                                                        <div className="dropdown-options-list" style={{
                                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                                            background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px',
                                                            marginTop: '4px', maxHeight: '180px', overflowY: 'auto',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                        }}>
                                                            {availableSleepers.length === 0 ? (
                                                                <div style={{ padding: '12px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                                                                    {isLoadingSleepers ? 'Fetching sleepers...' : 'No sleepers found for this batch'}
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {availableSleepers
                                                                        .filter(item => item.label.toLowerCase().includes(currentSearch.toLowerCase()))
                                                                        .slice(0, 50)
                                                                        .map((item, sIdx) => (
                                                                            <div 
                                                                                key={sIdx} 
                                                                                style={{ 
                                                                                    padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                                                                                    fontSize: '13px', color: '#334155'
                                                                                }}
                                                                                onMouseDown={() => handleUpdateSleeper(batchKey, idx, item)}
                                                                                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                                                                onMouseLeave={(e) => e.target.style.background = 'white'}
                                                                            >
                                                                                {item.label}
                                                                            </div>
                                                                        ))
                                                                    }
                                                                    {availableSleepers.filter(item => item.label.toLowerCase().includes(currentSearch.toLowerCase())).length === 0 && (
                                                                        <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                                                                            No matches found
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button 
                            className="btn-verify" 
                            style={{ 
                                flex: 1, 
                                opacity: isSaving || !isAllSleepersSelected() ? 0.7 : 1, 
                                cursor: (isSaving || !isAllSleepersSelected()) ? 'not-allowed' : 'pointer',
                                background: '#0f766e',
                                padding: '12px'
                            }} 
                            disabled={isSaving || !isAllSleepersSelected()}
                            onClick={() => {
                                if (!isAllSleepersSelected()) {
                                    alert("Please select a sleeper sample for each batch.");
                                    return;
                                }
                                setIsSaving(true);
                                onSave(targetBatches, batchSamples);
                            }}
                        >
                            {isSaving ? 'Saving Declarations...' : `Save Declaration (${targetBatches.length} Batch${targetBatches.length > 1 ? 'es' : ''})`}
                        </button>
                        <button className="btn-save" style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none' }} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .dropdown-options-list::-webkit-scrollbar { width: 6px; }
                .dropdown-options-list::-webkit-scrollbar-track { background: #f1f5f9; }
                .dropdown-options-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .spinner-mini {
                    width: 14px;
                    height: 14px;
                    border: 2px solid #e2e8f0;
                    border-top: 2px solid #42818c;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const TestDetailsModal = ({ batch, onClose, onSave }) => {
    const [selectedTestResult, setSelectedTestResult] = useState('Pass');
    const [testingDate, setTestingDate] = useState(() => {
        return normDate(batch?.dateOfTesting || batch?.testingDate) || new Date().toISOString().split('T')[0];
    });
    
    // Prepare single unified test result field for the form
    const [manualResults, setManualResults] = useState(() => {
        if (batch.details && batch.details.length > 0) {
            return [{
                ...batch.details[0],
                bench: batch.benchNumber || batch.details[0].bench || '',
                no: batch.sleeperNo || batch.details[0].no || '',
                ct: batch.details[0].ct || '',
                cb: batch.details[0].cb || '',
                rs1: batch.details[0].rs1 || batch.details[0].rs || '',
                rs2: batch.details[0].rs2 || batch.details[0].rs || '',
                isScada: batch.details[0].dataType === 'SCADA'
            }];
        }
        return [{
            bench: batch.benchNumber || batch.declaredSamples?.[0]?.bench || '',
            no: batch.sleeperNo || batch.declaredSamples?.map(s => s.no).filter(Boolean).join(', ') || '',
            ct: '',
            cb: '',
            rs1: '',
            rs2: '',
            date: new Date().toISOString().split('T')[0]
        }];
    });

    const [isSaving, setIsSaving] = useState(false);
    const [witnessed, setWitnessed] = useState(manualResults.map(r => !!r.isScada));

    const displayBatch = useMemo(() => {
        const raw = batch?.batchNo || batch?.batchNumber || '';
        return String(raw).split(',').map(s => s.trim()).filter(Boolean).join(', ');
    }, [batch]);

    const displaySleeperNo = useMemo(() => {
        if (batch?.declaredSamples && batch.declaredSamples.length > 0) {
            const list = Array.from(new Set(batch.declaredSamples.map(s => s.no).filter(Boolean)));
            if (list.length > 0) return list.join(', ');
        }
        if (batch?.sleeperNo) {
            return String(batch.sleeperNo).split(',').map(s => s.trim()).filter(Boolean).join(', ');
        }
        return 'Declared Sample';
    }, [batch]);

    const resolvedDwg = useMemo(() => {
        if (batch?.isGrouped && batch?.groupRecords) {
            const types = Array.from(new Set(
                batch.groupRecords.map(r => (r.sleeperType && !isGrade(r.sleeperType) && r.sleeperType !== 'N/A' && r.sleeperType !== '-') ? r.sleeperType.trim() : (extractDrawingNo(r) || r.sleeperType))
                    .filter(t => t && t !== '-' && t !== 'N/A' && !isGrade(t))
            ));
            if (types.length > 0) return types.join(', ');
        }
        return (batch?.sleeperType && !isGrade(batch?.sleeperType)) ? batch.sleeperType : (extractDrawingNo(batch) || batch?.sleeperType || '-');
    }, [batch]);

    const displayCastingDate = useMemo(() => {
        if (batch?.isGrouped && batch?.groupRecords) {
            const dates = Array.from(new Set(
                batch.groupRecords.map(r => extractCastDate(r) || r.castingDate).filter(d => d && d !== 'N/A')
            ));
            if (dates.length > 0) return dates.join(', ');
        }
        return batch?.castingDate || 'N/A';
    }, [batch]);

    const mockScadaData = useMemo(() => {
        return manualResults.map(() => ({
            ct: Math.floor(460 + Math.random() * 20),
            cb: Math.floor(560 + Math.random() * 20),
            rs1: Math.floor(690 + Math.random() * 20),
            rs2: Math.floor(690 + Math.random() * 20)
        }));
    }, [manualResults]);

    const handleWitness = (idx) => {
        const updatedManual = [...manualResults];
        updatedManual[idx] = { 
            ...updatedManual[idx], 
            ct: mockScadaData[idx].ct, 
            cb: mockScadaData[idx].cb, 
            rs1: mockScadaData[idx].rs1, 
            rs2: mockScadaData[idx].rs2,
            isScada: true 
        };
        setManualResults(updatedManual);

        const updatedWitnessed = [...witnessed];
        updatedWitnessed[idx] = true;
        setWitnessed(updatedWitnessed);
    };

    const handleUpdateManual = (idx, field, val) => {
        if (witnessed[idx]) return;
        const updated = [...manualResults];
        updated[idx][field] = val;
        setManualResults(updated);
    };

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Enter MR Test Details - Batch {displayBatch}</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {/* Section 1: Sample Details */}
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Batch</label>
                                <input readOnly value={displayBatch} className="readOnly" style={{ fontWeight: '700', color: '#0f766e' }} />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Dwg. no.</label>
                                <input readOnly value={resolvedDwg} className="readOnly" />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Casting Date</label>
                                <input readOnly value={displayCastingDate} className="readOnly" />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Date of Testing <span style={{ color: '#ef4444' }}>*</span></label>
                                <input 
                                    type="date" 
                                    value={testingDate} 
                                    onChange={(e) => setTestingDate(e.target.value)} 
                                    style={{ height: '38px', borderRadius: '6px', border: '1.5px solid #cbd5e1', padding: '0 8px', background: '#fff', fontWeight: '600' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2 & 3: SCADA & Manual Entry (Single Test Form for all batches) */}
                    {manualResults.map((res, idx) => (
                        <div key={idx} style={{ marginBottom: '24px', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, color: '#42818c', fontSize: '14px', fontWeight: '800' }}>
                                    Test for Sleeper Sample: {displaySleeperNo}
                                </h4>
                                <button className="btn-verify" style={{ fontSize: '11px', padding: '6px 14px' }} onClick={() => handleWitness(idx)}>
                                    Witness through SCADA
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                                {/* SCADA View */}
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>MR SCADA DATA</span>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
                                        <div><div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>CT</div><div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{mockScadaData[idx]?.ct}</div></div>
                                        <div><div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>CB</div><div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{mockScadaData[idx]?.cb}</div></div>
                                        <div><div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>RS1</div><div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{mockScadaData[idx]?.rs1}</div></div>
                                        <div><div style={{ fontSize: '9px', color: '#64748b', fontWeight: '600' }}>RS2</div><div style={{ fontWeight: '800', color: '#1e293b', fontSize: '13px' }}>{mockScadaData[idx]?.rs2}</div></div>
                                    </div>
                                </div>

                                {/* Manual Form */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>CT (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.ct} onChange={(e) => handleUpdateManual(idx, 'ct', e.target.value)} placeholder="e.g. 469" />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>CB (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.cb} onChange={(e) => handleUpdateManual(idx, 'cb', e.target.value)} placeholder="e.g. 560" />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>RS1 (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.rs1} onChange={(e) => handleUpdateManual(idx, 'rs1', e.target.value)} placeholder="e.g. 695" />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>RS2 (KN)</label>
                                        <input type="number" readOnly={witnessed[idx]} value={res.rs2} onChange={(e) => handleUpdateManual(idx, 'rs2', e.target.value)} placeholder="e.g. 695" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Test Result Selection Dropdown */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <div className="input-group">
                            <label style={{ fontSize: '11px', fontWeight: '800', color: '#13343b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                                Select MR Test Result <span className="required" style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                value={selectedTestResult}
                                onChange={(e) => setSelectedTestResult(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    minHeight: '46px',
                                    padding: '0 14px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #cbd5e1',
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    lineHeight: '46px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    background: selectedTestResult === 'Pass' ? '#f0fdf4' : (selectedTestResult === 'Retest' ? '#fff7ed' : '#fef2f2'),
                                    color: selectedTestResult === 'Pass' ? '#166534' : (selectedTestResult === 'Retest' ? '#c2410c' : '#991b1b'),
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="Pass" style={{ color: '#166534', background: '#ffffff', fontWeight: '700' }}>Pass</option>
                                <option value="Retest" style={{ color: '#c2410c', background: '#ffffff', fontWeight: '700' }}>Retest</option>
                                <option value="Fail" style={{ color: '#991b1b', background: '#ffffff', fontWeight: '700' }}>Fail</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button 
                            className="btn-verify" 
                            style={{ 
                                flex: 1,
                                opacity: isSaving ? 0.7 : 1,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                background: selectedTestResult === 'Pass' ? '#42818c' : (selectedTestResult === 'Retest' ? '#f59e0b' : '#ef4444')
                            }} 
                            disabled={isSaving}
                            onClick={() => {
                                setIsSaving(true);
                                onSave(batch, { results: manualResults, result: selectedTestResult, dateOfTesting: testingDate });
                            }}
                        >
                            {isSaving ? 'Processing...' : `Confirm results: ${selectedTestResult}`}
                        </button>
                        <button className="btn-save" style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none' }} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MRDetailsModal = ({ batch, onClose, onModify, onEnterTest, onDelete }) => {
    if (!batch) return null;

    const createdTime = batch.createdDate ? new Date(batch.createdDate) : new Date();
    const diffMs = Date.now() - createdTime.getTime();
    const hoursPassed = diffMs / (1000 * 60 * 60);
    const canModifyOrDelete = hoursPassed <= 8;

    const displayBatch = String(batch.batchNo || batch.batchNumber || '').split(',').map(s => s.trim()).filter(Boolean).join(', ');

    const resolvedDwg = (() => {
        if (batch.isGrouped && batch.groupRecords) {
            const types = Array.from(new Set(
                batch.groupRecords.map(r => (r.sleeperType && !isGrade(r.sleeperType) && r.sleeperType !== 'N/A' && r.sleeperType !== '-') ? r.sleeperType.trim() : (extractDrawingNo(r) || r.sleeperType))
                    .filter(t => t && t !== '-' && t !== 'N/A' && !isGrade(t))
            ));
            if (types.length > 0) return types.join(', ');
        }
        return (batch.sleeperType && !isGrade(batch.sleeperType)) ? batch.sleeperType : (extractDrawingNo(batch) || batch.sleeperType || '-');
    })();

    const displayCastingDate = (() => {
        if (batch.isGrouped && batch.groupRecords) {
            const dates = Array.from(new Set(
                batch.groupRecords.map(r => extractCastDate(r) || r.castingDate).filter(d => d && d !== 'N/A')
            ));
            if (dates.length > 0) return dates.join(', ');
        }
        return batch.castingDate || 'N/A';
    })();

    const testDateDisplay = batch.dateOfTesting ? batch.dateOfTesting : (batch.createdDate ? new Date(batch.createdDate).toLocaleDateString('en-GB') : '-');

    const details = [
        { label: 'Batch No', value: displayBatch },
        { label: 'Dwg. no.', value: resolvedDwg },
        { label: 'Casting Date', value: displayCastingDate },
        ...(batch.isTestRecord || batch.dateOfTesting ? [{ label: 'Date of Testing', value: testDateDisplay }] : []),
        { label: 'Sleeper Info', value: batch.isTestRecord ? batch.sleeperNo : batch.declaredSamples?.map(s => s.no).join(', ') },
        { label: 'Log Created', value: `${createdTime.toLocaleDateString('en-GB')} ${createdTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }
    ];

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">MR Test Details</span>
                    <button className="form-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="form-modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                        {details.map((detail, idx) => (
                            <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>{detail.label}</div>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{detail.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {!batch.isTestRecord ? (
                            <button 
                                className="btn-verify" 
                                style={{ flex: '1 1 120px', borderRadius: '25px', padding: '10px' }} 
                                onClick={onEnterTest}
                            >
                                Enter Test Details
                            </button>
                        ) : null}
                        
                        <button
                            className="btn-save"
                            style={{ 
                                flex: '1 1 80px', 
                                background: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                color: '#475569', 
                                borderRadius: '25px',
                                opacity: canModifyOrDelete ? 1 : 0.6,
                                padding: '10px',
                                cursor: canModifyOrDelete ? 'pointer' : 'not-allowed',
                                fontWeight: '700'
                            }}
                            disabled={!canModifyOrDelete}
                            onClick={onModify}
                        >
                            Modify
                        </button>
                        
                        <button
                            className="btn-save"
                            style={{ 
                                flex: '1 1 80px', 
                                background: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                color: '#475569', 
                                borderRadius: '25px',
                                opacity: canModifyOrDelete ? 1 : 0.6,
                                padding: '10px',
                                cursor: canModifyOrDelete ? 'pointer' : 'not-allowed',
                                fontWeight: '700'
                            }}
                            disabled={!canModifyOrDelete}
                            onClick={onDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MomentOfResistance;
