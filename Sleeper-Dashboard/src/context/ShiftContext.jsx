import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService, onApiWrite, clearApiCache } from '../services/api';
import { useToast } from '../context/ToastContext';
import { mapWireTensionRecords, mapCompactionRecords, mapSteamCuringRecords, mapBatchWeighmentData } from '../utils/shiftMappingUtils';
import { getISTDate, formatToIST } from '../utils/helpers';

const ShiftContext = createContext();

export const useShift = () => {
    const context = useContext(ShiftContext);
    if (!context) {
        throw new Error('useShift must be used within a ShiftProvider');
    }
    return context;
};

export const ShiftProvider = ({ children }) => {
    const [dutyStarted, setDutyStarted] = useState(() => localStorage.getItem('dutyStarted') === 'true');
    const [selectedShift, setSelectedShift] = useState(() => localStorage.getItem('selectedShift') || ''); // 'A', 'B', 'C', 'General'
    const [dutyDate, setDutyDate] = useState(() => localStorage.getItem('dutyDate') || formatToIST(null, 'iso_date'));
    const [dutyUnit, setDutyUnit] = useState(() => localStorage.getItem('dutyUnit') || '');
    const [dutyLocation, setDutyLocation] = useState(() => localStorage.getItem('dutyLocation') || '');
    const [vendorCode, setVendorCode] = useState(() => localStorage.getItem('vendorCode') || '');
    const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || '');
    const [vendorId, setVendorId] = useState(() => localStorage.getItem('vendorId') || '');
    const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');

    const [containers, setContainers] = useState([{ id: 1, type: 'Line', name: 'Line I' }]);
    const [activeContainerId, setActiveContainerId] = useState(() => parseInt(localStorage.getItem('activeContainerId')) || 1);

    const [isActiveDuty, setIsActiveDuty] = useState(false);

    useEffect(() => {
        if (!dutyStarted || !dutyDate || !selectedShift) {
            setIsActiveDuty(false);
            return;
        }

        const checkStatus = () => {
            const now = new Date();
            const currentHour = now.getHours();
            
            // Format today's and yesterday's date in YYYY-MM-DD
            const currentDateStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const yesterday = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let allowed = [];

            // Shift A: 05:00 to 17:00 + 1 hr grace = 05:00 to 18:00
            if (currentHour >= 5 && currentHour < 18) {
                allowed.push({ date: currentDateStr, shift: 'A' });
            }
            // Shift B: 13:00 to 23:55
            if (currentHour >= 13 && currentHour < 24) {
                allowed.push({ date: currentDateStr, shift: 'B' });
            }
            // Shift C: 22:00 to 09:00 + 1 hr grace = 22:00 to 10:00
            if (currentHour >= 22) {
                allowed.push({ date: currentDateStr, shift: 'C' });
            }
            if (currentHour < 10) {
                // After midnight, the C shift that is currently active started yesterday
                allowed.push({ date: yesterdayStr, shift: 'C' });
            }
            // General Shift: 08:00 to 20:00 + 1 hr grace = 08:00 to 21:00
            if (currentHour >= 8 && currentHour < 21) {
                allowed.push({ date: currentDateStr, shift: 'General' });
            }

            // Normalize dutyDate (login date) to YYYY-MM-DD
            let loginDateStr = dutyDate;
            if (loginDateStr.includes('/')) {
                const parts = loginDateStr.split('/');
                if (parts.length === 3) {
                    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                    loginDateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }

            const active = allowed.some(a => a.date === loginDateStr && a.shift === selectedShift);
            setIsActiveDuty(active);
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Re-evaluate every minute
        return () => clearInterval(interval);
    }, [dutyStarted, dutyDate, selectedShift]);

    const endDuty = () => {
        setDutyStarted(false);
        setSelectedShift('');
        setDutyDate(new Date().toISOString().split('T')[0]);
        setDutyUnit('');
        setDutyLocation('');
        setVendorCode('');
        setCompanyName('');
        setVendorId('');
        setUserId('');
        setActiveContainerId(1);
        setContainers([{ id: 1, type: 'Line', name: 'Line I' }]);

        // Reset all logs as requested
        setManualCheckEntries({
            mouldPrep: [],
            htsWire: [],
            demoulding: []
        });
        setAllBatchDeclarations({ 1: [] });
        setAllTensionRecords({ 1: [] });
        setAllCompactionRecords({ 1: [] });
        setAllWitnessedRecords({ 1: [] });
        setAllSessionConfigs({ 1: { sandType: 'River Sand', sensorStatus: 'working' } });
        setSteamRecords([]);
        
        localStorage.removeItem('dutyStarted');
        localStorage.removeItem('selectedShift');
        localStorage.removeItem('dutyDate');
        localStorage.removeItem('dutyUnit');
        localStorage.removeItem('dutyLocation');
        localStorage.removeItem('activeContainerId');
        localStorage.removeItem('vendorCode');
        localStorage.removeItem('companyName');
        localStorage.removeItem('vendorId');
        localStorage.removeItem('userId');

        // A new duty must start from fresh server data
        loadedAtRef.current = {};
        inflightRef.current = {};
        clearApiCache();
    };

    // Persist basic shift state
    useEffect(() => {
        localStorage.setItem('dutyStarted', dutyStarted);
        localStorage.setItem('selectedShift', selectedShift);
        localStorage.setItem('dutyDate', dutyDate);
        localStorage.setItem('dutyUnit', dutyUnit);
        localStorage.setItem('dutyLocation', dutyLocation);
        localStorage.setItem('vendorCode', vendorCode);
        localStorage.setItem('companyName', companyName);
        localStorage.setItem('vendorId', vendorId);
        localStorage.setItem('userId', userId);
        localStorage.setItem('activeContainerId', activeContainerId);
    }, [dutyStarted, selectedShift, dutyDate, dutyUnit, dutyLocation, activeContainerId, vendorCode, companyName, vendorId, userId]);

    // Silent mapping fetch for header info (if missing)
    useEffect(() => {
        if (!companyName && dutyStarted) {
            const fetchHeaderMapping = async () => {
                const currentUserId = userId || localStorage.getItem('userId');
                if (!currentUserId) return;
                try {
                    const res = await apiService.getCompanyUnitsByUser(currentUserId);
                    const responseData = res?.responseData || [];
                    
                    if (Array.isArray(responseData) && responseData.length > 0) {
                        const currentUnit = dutyUnit || localStorage.getItem('dutyUnit');
                        let targetComp = responseData[0]; // Default to first

                        if (currentUnit) {
                            const found = responseData.find(c => c.unitNames?.includes(currentUnit));
                            if (found) targetComp = found;
                        }

                        if (targetComp.companyName) setCompanyName(targetComp.companyName.trim());
                        if (targetComp.vendorCode) setVendorCode(targetComp.vendorCode);
                        if (targetComp.vendorId) setVendorId(targetComp.vendorId);
                    } else if (responseData && !Array.isArray(responseData)) {
                        // Legacy object format
                        if (responseData.companyName) setCompanyName(responseData.companyName.trim());
                        if (responseData.vendorCode) setVendorCode(responseData.vendorCode);
                        if (responseData.vendorId) setVendorId(responseData.vendorId);
                    }
                } catch (err) {
                    console.error("Header mapping fetch error:", err);
                }
            };
            fetchHeaderMapping();
        }
    }, [companyName, dutyStarted]);

    // Shared state for all features
    const [allWitnessedRecords, setAllWitnessedRecords] = useState({ 1: [] });
    const [allTensionRecords, setAllTensionRecords] = useState({ 1: [] });
    const [allBatchDeclarations, setAllBatchDeclarations] = useState({ 1: [] });
    const [allSessionConfigs, setAllSessionConfigs] = useState({ 1: { sandType: 'River Sand', sensorStatus: 'working' } });
    const [sharedBatchNo, setSharedBatchNo] = useState('');
    const [sharedBenchNo, setSharedBenchNo] = useState('');
    const [allCompactionRecords, setAllCompactionRecords] = useState({ 1: [] });
    const [htsData, setHtsData] = useState([]);
    const [plantVerificationData, setPlantVerificationData] = useState({
        profiles: [
            { id: 'PP-001', plantName: 'Sleeper Plant – Unit 1', location: 'Bhilai, Chhattisgarh', vendorCode: 'VND-2201', plantType: 'Stress Bench – Twin', sheds: 3, lines: null, status: 'Pending', rejectionRemarks: '' },
            { id: 'PP-002', plantName: 'Sleeper Plant – Unit 2', location: 'Raipur, Chhattisgarh', vendorCode: 'VND-2202', plantType: 'Long Line', sheds: null, lines: 5, status: 'Verified', rejectionRemarks: '' },
            { id: 'PP-003', plantName: 'Sleeper Plant – Unit 3', location: 'Durg, Chhattisgarh', vendorCode: 'VND-2203', plantType: 'Stress Bench – Single', sheds: 2, lines: null, status: 'Rejected', rejectionRemarks: 'Invalid vendor code format provided.' },
        ],
        benches: [],
        rawMaterials: [
            { id: 'RM-001', materialType: 'Cement', supplierName: 'Ultra Tech Cements Ltd', sourceLocation: 'Bhilai', approvalRef: 'RDSO/2023/CE-441', validUpto: '2026-05-01', status: 'Pending', rejectionRemarks: '' },
            { id: 'RM-002', materialType: 'HTS Wire', supplierName: 'Usha Martin Ltd', sourceLocation: 'Ranchi', approvalRef: 'RDSO/2022/HW-209', validUpto: '2026-03-25', status: 'Verified', rejectionRemarks: '' },
            { id: 'RM-003', materialType: 'SGCI Insert', supplierName: 'Sharp Iron Works', sourceLocation: 'Faridabad', approvalRef: 'RITES/2024/SI-088', validUpto: '2026-03-12', status: 'Pending', rejectionRemarks: '' },
            { id: 'RM-004', materialType: 'Aggregates', supplierName: 'National Quarry Depot', sourceLocation: 'Durg', approvalRef: 'RDSO/2021/AG-310', validUpto: '2026-02-25', status: 'Rejected', rejectionRemarks: 'RDSO approval validity has expired.' },
        ],
        mixDesigns: [
            { id: 'MD-001', designId: 'MXD-M60-R1', grade: 'M60', authority: 'RDSO', cement: 450, ca1: 780, ca2: 410, fa: 675, water: 135, ac: 0.60, wc: 0.30, status: 'Pending', rejectionRemarks: '' },
            { id: 'MD-002', designId: 'MXD-M55-R2', grade: 'M55', authority: 'RITES', cement: 420, ca1: 760, ca2: 390, fa: 660, water: 130, ac: 0.62, wc: 0.31, status: 'Verified', rejectionRemarks: '' },
        ]
    });

    const [manualCheckEntries, setManualCheckEntries] = useState({
        mouldPrep: [],
        htsWire: [],
        demoulding: []
    });
    const [moistureRecords, setMoistureRecords] = useState([]);
    const [steamRecords, setSteamRecords] = useState([]);
    const [testedRecords, setTestedRecords] = useState([]);

    const [benchMouldCheckRecords, setBenchMouldCheckRecords] = useState([]);
    const [allBenchesMoulds, setAllBenchesMoulds] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [newContainer, setNewContainer] = useState({ type: 'Line', name: '' });
    const containerValues = [
        { id: 1, label: 'Line', prefix: 'Line ' },
        { id: 2, label: 'Shed', prefix: 'Shed ' }
    ];

    const handleAddContainer = () => {
        if (!newContainer.name.trim()) return;
        const newId = containers.length > 0 ? Math.max(...containers.map(c => c.id)) + 1 : 1;
        const container = { id: newId, ...newContainer };
        setContainers([...containers, container]);
        setNewContainer({ type: 'Line', name: '' });
    };

    const handleDeleteContainer = (id) => {
        if (containers.length <= 1) {
            alert("At least one line or shed must remain.");
            return;
        }
        setContainers(containers.filter(c => c.id !== id));
        if (activeContainerId === id) {
            setActiveContainerId(containers.find(c => c.id !== id).id);
        }
    };

    const activeContainer = containers.find(c => c.id === activeContainerId);

    // Granular fetch functions for better performance and targeted updates
    const rawFetchMoisture = useCallback(async () => {
        const res = await apiService.getAllMoistureAnalysis();
        if (res?.responseData) setMoistureRecords(res.responseData);
    }, []);

    const rawFetchManualChecks = useCallback(async () => {
        const currentUserId = userId || localStorage.getItem('userId');
        const currentVendorCode = vendorCode || localStorage.getItem('vendorCode');
        const currentShift = selectedShift || localStorage.getItem('selectedShift');
        const currentPlantId = dutyUnit || localStorage.getItem('dutyUnit');
        const currentDutyDate = dutyDate || localStorage.getItem('dutyDate') || formatToIST(null, 'iso_date');
        const currentLocation = dutyLocation || localStorage.getItem('dutyLocation') || '';

        const formattedDate = formatToIST(currentDutyDate, 'date');

        const params = {
            plantId: currentPlantId || ":41647/01",
            vendorCode: currentVendorCode || ":41647",
            shift: currentShift || "A",
            createdBy: currentUserId || "134",
            date: formattedDate,
            location: currentLocation
        };

        try {
            const [mouldPrep, htsWire, demoulding] = await Promise.all([
                apiService.getMouldPreparationTodayRecord(params),
                apiService.getHtsWireTodayRecord(params),
                apiService.getDemouldingTodayRecord(params)
            ]);
            
            const htsListData = htsWire?.responseData || [];
            setHtsData(htsListData);
            setManualCheckEntries({
                mouldPrep: mouldPrep?.responseData || [],
                htsWire: htsListData,
                demoulding: demoulding?.responseData || []
            });
        } catch (error) {
            console.error("Error fetching manual checks:", error);
        }
    }, [userId, vendorCode, selectedShift, dutyUnit, dutyDate, dutyLocation]);

    const rawFetchWireTension = useCallback(async () => {
        const currentUserId = userId || localStorage.getItem('userId');
        const currentVendorCode = vendorCode || localStorage.getItem('vendorCode');
        const currentShift = selectedShift || localStorage.getItem('selectedShift');
        const currentPlantId = dutyUnit || localStorage.getItem('dutyUnit');
        const currentDutyDate = dutyDate || localStorage.getItem('dutyDate') || formatToIST(null, 'iso_date');

        // Force format to dd/MM/yyyy 
        const [y, m, d] = currentDutyDate.split('-');
        const formattedDate = `${d}/${m}/${y}`;

        const params = {
            plantId: currentPlantId || ":41647/01",
            vendorCode: currentVendorCode || ":41647",
            shift: currentShift || "A",
            createdBy: currentUserId || "134",
            date: formattedDate,
            location: dutyLocation || "Line I"
        };

        try {
            const res = await apiService.getWireTensioningTodayRecord(params);
            if (res?.responseData) {
                const flattenedRecords = mapWireTensionRecords(res.responseData);
                
                setAllTensionRecords(prev => {
                    const nextState = { ...prev };
                    // Clear existing arrays for a fresh fetch to prevent duplicate appending
                    containers.forEach(c => {
                        nextState[c.id] = [];
                    });
                    
                    flattenedRecords.forEach(record => {
                        const loc = (record.location || "").trim();
                        const matchedContainer = containers.find(c => c.name.trim() === loc);
                        const containerId = matchedContainer ? matchedContainer.id : 1;
                        if (!nextState[containerId]) {
                            nextState[containerId] = [];
                        }
                        nextState[containerId].push(record);
                    });
                    return nextState;
                });
            }
        } catch (error) {
            console.error("Error fetching wire tension:", error);
        }
    }, [userId, vendorCode, selectedShift, dutyUnit, dutyDate, activeContainerId, containers]);

    const rawFetchCompaction = useCallback(async () => {
        const currentUserId = userId || localStorage.getItem('userId');
        const currentVendorCode = vendorCode || localStorage.getItem('vendorCode');
        const currentShift = selectedShift || localStorage.getItem('selectedShift');
        const currentPlantId = dutyUnit || localStorage.getItem('dutyUnit');
        const currentDutyDate = dutyDate || localStorage.getItem('dutyDate') || formatToIST(null, 'iso_date');

        // Format required by API: dd/MM/yyyy
        const [y, m, d] = currentDutyDate.split('-');
        const formattedDate = `${d}/${m}/${y}`;

        const params = {
            plantId: currentPlantId || ":41647/waidiyaram",
            vendorCode: currentVendorCode || ":41647",
            shift: currentShift || "A",
            createdBy: currentUserId || "134",
            date: formattedDate
        };

        console.log("Calling getCompactionTodayRecord with params:", params);

        try {
            const res = await apiService.getCompactionTodayRecord(params);
            if (res?.responseData) {
                const flattenedRecords = mapCompactionRecords(res.responseData);
                setAllCompactionRecords(prev => ({ ...prev, [activeContainerId]: flattenedRecords }));
            }
        } catch (error) {
            console.error("Error fetching compaction:", error);
        }
    }, [userId, vendorCode, selectedShift, dutyUnit, dutyDate, activeContainerId]);

    const rawFetchBatchWeighment = useCallback(async () => {
        const currentUserId = userId || localStorage.getItem('userId');
        const currentVendorCode = vendorCode || localStorage.getItem('vendorCode');
        const currentShift = selectedShift || localStorage.getItem('selectedShift');
        const currentPlantId = dutyUnit || localStorage.getItem('dutyUnit');
        const currentDutyDate = dutyDate || localStorage.getItem('dutyDate') || formatToIST(null, 'iso_date');

        // Force format to dd/MM/yyyy as strictly requested by backend for this module
        const [y, m, d] = currentDutyDate.split('-');
        const formattedDate = `${d}/${m}/${y}`;

        const params = {
            plantId: currentPlantId || ":41647/waidiyaram",
            vendorCode: currentVendorCode || ":41647",
            shift: currentShift || "A",
            createdBy: currentUserId || "134",
            date: formattedDate
        };

        try {
            const res = await apiService.getBatchWeighmentTodayRecord(params);
            
            if (res?.responseData) {
                const { declarations, configs, witnessed } = mapBatchWeighmentData(res.responseData, containers);
                setAllWitnessedRecords(witnessed);
                setAllBatchDeclarations(declarations);
                setAllSessionConfigs(prev => ({ ...prev, ...configs }));
            }
        } catch (error) {
            console.error("Error fetching batch weighment:", error);
        }
    }, [userId, vendorCode, selectedShift, dutyUnit, dutyDate, containers]);

    const rawFetchSteamCuring = useCallback(async () => {
        const currentUserId = userId || localStorage.getItem('userId');
        const currentVendorCode = vendorCode || localStorage.getItem('vendorCode');
        const currentShift = selectedShift || localStorage.getItem('selectedShift');
        const currentPlantId = dutyUnit || localStorage.getItem('dutyUnit');
        const currentDutyDate = dutyDate || localStorage.getItem('dutyDate') || formatToIST(null, 'iso_date');

        // Date format: dd/MM/yyyy
        const [y, m, d] = currentDutyDate.split('-');
        const formattedDate = `${d}/${m}/${y}`;

        const params = {
            plantId: currentPlantId || ":41647/waidiyaram",
            vendorCode: currentVendorCode || ":41647",
            shift: currentShift || "A",
            createdBy: currentUserId || "134",
            date: formattedDate
        };

        try {
            const res = await apiService.getSteamCuringTodayRecord(params);
            if (res?.responseData) {
                setSteamRecords(mapSteamCuringRecords(res.responseData));
            }
        } catch (error) {
            console.error("Error fetching steam curing records:", error);
        }
    }, [userId, vendorCode, selectedShift, dutyUnit, dutyDate]);

    const rawFetchBenchMoulds = useCallback(async () => {
        const [benchMould, stressBenches] = await Promise.all([
            apiService.getAllBenchMouldInspections(),
            apiService.getAllStressBenches()
        ]);
        if (benchMould?.responseData) setBenchMouldCheckRecords(benchMould.responseData);
        if (stressBenches?.responseData) {
            const masterList = stressBenches.responseData.map(b => ({
                id: b.id,
                type: 'Bench',
                name: b.entryType === 'Single' ? `Bench ${b.benchNo}` : `Range ${b.benchFrom}-${b.benchTo}`,
                assetNo: b.entryType === 'Single' ? b.benchNo : `${b.benchFrom}-${b.benchTo}`,
                lastCasting: b.latestCastingDate || '2025-01-31',
                lastChecking: b.lastCheckingDate || '2026-01-30',
                sleeperType: b.sleeperCategory
            }));
            setAllBenchesMoulds(masterList);
            setPlantVerificationData(prev => ({
                ...prev,
                benches: stressBenches.responseData.map(b => ({
                    ...b, moduleId: 2, requestId: b.id, status: b.status || 'Pending'
                }))
            }));
        }
    }, []);

    // ---------- Freshness-aware loading (stale-while-revalidate) ----------
    // A module is fetched only if it was never loaded for the current duty/line, is older than
    // MODULE_FRESH_MS, or any save (POST/PUT/DELETE) happened since it was loaded. Data already on
    // screen stays visible while a refresh runs. Every save marks all modules stale, so the refetch
    // each screen already does after saving always goes to the server.
    const MODULE_FRESH_MS = 30000;
    const loadedAtRef = useRef({});   // key -> time the successful fetch started
    const inflightRef = useRef({});   // key -> { promise, started }
    const lastWriteAtRef = useRef(0);

    useEffect(() => onApiWrite(() => { lastWriteAtRef.current = Date.now(); }), []);

    // Duty parameters every module query depends on; a change gives a new cache key
    const dutyKey = [userId, vendorCode, selectedShift, dutyUnit, dutyDate, dutyLocation].join('|');
    const containersKey = containers.map(c => c.id + ':' + c.name).join(',');

    const runModule = useCallback((key, fetcher, force) => {
        const t = loadedAtRef.current[key];
        const fresh = !!t && t > lastWriteAtRef.current && Date.now() - t < MODULE_FRESH_MS;
        if (!force && fresh) return Promise.resolve();
        const running = inflightRef.current[key];
        // Re-use a request already in flight unless a save happened after it started
        if (running && running.started > lastWriteAtRef.current) return running.promise;
        const started = Date.now();
        const promise = (async () => {
            await fetcher();
            loadedAtRef.current[key] = started;
        })().finally(() => {
            if (inflightRef.current[key] && inflightRef.current[key].started === started) delete inflightRef.current[key];
        });
        inflightRef.current[key] = { promise, started };
        return promise;
    }, []);

    // Line-dependent modules include the line/containers in the key, so switching line loads that line's data
    const moduleKeys = {
        moisture: 'moisture|' + dutyUnit,
        manualChecks: 'manual|' + dutyKey,
        wireTension: 'wire|' + dutyKey + '|' + containersKey,
        compaction: 'compaction|' + dutyKey + '|' + activeContainerId,
        batchWeighment: 'batch|' + dutyKey + '|' + containersKey,
        steamCuring: 'steam|' + dutyKey,
        benchMoulds: 'benchMoulds'
    };
    const rawFetchers = {
        moisture: rawFetchMoisture,
        manualChecks: rawFetchManualChecks,
        wireTension: rawFetchWireTension,
        compaction: rawFetchCompaction,
        batchWeighment: rawFetchBatchWeighment,
        steamCuring: rawFetchSteamCuring,
        benchMoulds: rawFetchBenchMoulds
    };
    const moduleKeysRef = useRef(moduleKeys);
    moduleKeysRef.current = moduleKeys;
    const rawFetchersRef = useRef(rawFetchers);
    rawFetchersRef.current = rawFetchers;

    // Cached list URLs behind a module; dropped on a forced refresh so it really hits the server
    const LIST_CACHE_PREFIXES = {
        moisture: ['/MoistureAnalysis'],
        benchMoulds: ['/bench-mould-inspection', '/stress-bench']
    };

    const loadModule = useCallback((name, opts) => {
        const force = !!(opts && opts.force === true);
        if (force && LIST_CACHE_PREFIXES[name]) clearApiCache(LIST_CACHE_PREFIXES[name]);
        return runModule(moduleKeysRef.current[name], () => rawFetchersRef.current[name](), force);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runModule]);

    // Public fetchers keep their old names and behaviour; they only skip the call while data is fresh.
    // Identity changes with the inputs that change the query (as before), so effects depending on them still re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchMoisture = useCallback((opts) => loadModule('moisture', opts), [loadModule, moduleKeys.moisture]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchManualChecks = useCallback((opts) => loadModule('manualChecks', opts), [loadModule, moduleKeys.manualChecks]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchWireTension = useCallback((opts) => loadModule('wireTension', opts), [loadModule, moduleKeys.wireTension]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchCompaction = useCallback((opts) => loadModule('compaction', opts), [loadModule, moduleKeys.compaction]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchBatchWeighment = useCallback((opts) => loadModule('batchWeighment', opts), [loadModule, moduleKeys.batchWeighment]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchSteamCuring = useCallback((opts) => loadModule('steamCuring', opts), [loadModule, moduleKeys.steamCuring]);
    const fetchBenchMoulds = useCallback((opts) => loadModule('benchMoulds', opts), [loadModule]);

    // Load a set of modules. Shows the "Updating" indicator only for a first load or a forced refresh;
    // otherwise data on screen stays and is refreshed quietly.
    const ensureModulesLoaded = useCallback(async (names, opts) => {
        const unique = Array.from(new Set(names || []));
        if (!unique.length) return;
        const force = !!(opts && opts.force === true);
        const firstLoad = unique.some(n => !loadedAtRef.current[moduleKeysRef.current[n]]);
        const showLoader = firstLoad || force;
        if (showLoader) setIsLoading(true);
        try {
            await Promise.allSettled(unique.map(n => loadModule(n, opts)));
        } finally {
            if (showLoader) setIsLoading(false);
        }
    }, [loadModule]);

    // All modules; freshness-aware like the single fetchers
    const loadShiftData = useCallback((opts) => ensureModulesLoaded(
        ['moisture', 'manualChecks', 'wireTension', 'compaction', 'batchWeighment', 'steamCuring', 'benchMoulds'],
        (opts && opts.force === true) ? { force: true } : undefined
    ), [ensureModulesLoaded]);


    const value = {
        dutyStarted,
        setDutyStarted,
        selectedShift,
        setSelectedShift,
        dutyDate,
        setDutyDate,
        dutyUnit,
        setDutyUnit,
        dutyLocation,
        setDutyLocation,
        vendorCode,
        setVendorCode,
        companyName,
        setCompanyName,
        vendorId,
        setVendorId,
        userId,
        setUserId,
        containers,
        setContainers,
        activeContainerId,
        setActiveContainerId,
        activeContainer,
        allWitnessedRecords,
        setAllWitnessedRecords,
        allTensionRecords,
        setAllTensionRecords,
        allBatchDeclarations,
        setAllBatchDeclarations,
        allSessionConfigs,
        setAllSessionConfigs,
        allCompactionRecords,
        setAllCompactionRecords,
        htsData,
        setHtsData,
        manualCheckEntries,
        setManualCheckEntries,
        moistureRecords,
        setMoistureRecords,
        steamRecords,
        setSteamRecords,
        testedRecords,
        setTestedRecords,
        benchMouldCheckRecords,
        setBenchMouldCheckRecords,
        allBenchesMoulds,
        setAllBenchesMoulds,
        newContainer,
        setNewContainer,
        containerValues,
        handleAddContainer,
        handleDeleteContainer,
        sharedBatchNo,
        setSharedBatchNo,
        sharedBenchNo,
        setSharedBenchNo,
        plantVerificationData,
        setPlantVerificationData,
        loadShiftData,
        ensureModulesLoaded,
        fetchMoisture,
        fetchManualChecks,
        fetchWireTension,
        fetchCompaction,
        fetchBatchWeighment,
        fetchSteamCuring,
        fetchBenchMoulds,
        isLoading,
        endDuty,
        isActiveDuty
    };



    return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};
