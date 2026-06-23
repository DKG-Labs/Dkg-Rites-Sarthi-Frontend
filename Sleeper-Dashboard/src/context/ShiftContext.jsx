import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
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
    const fetchMoisture = useCallback(async () => {
        const res = await apiService.getAllMoistureAnalysis();
        if (res?.responseData) setMoistureRecords(res.responseData);
    }, []);

    const fetchManualChecks = useCallback(async () => {
        const currentUserId = userId || localStorage.getItem('userId');
        const currentVendorCode = vendorCode || localStorage.getItem('vendorCode');
        const currentShift = selectedShift || localStorage.getItem('selectedShift');
        const currentPlantId = dutyUnit || localStorage.getItem('dutyUnit');
        const currentDutyDate = dutyDate || localStorage.getItem('dutyDate') || formatToIST(null, 'iso_date');

        const formattedDate = formatToIST(currentDutyDate, 'date');

        const params = {
            plantId: currentPlantId || ":41647/01",
            vendorCode: currentVendorCode || ":41647",
            shift: currentShift || "A",
            createdBy: currentUserId || "134",
            date: formattedDate
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
    }, [userId, vendorCode, selectedShift, dutyUnit, dutyDate]);

    const fetchWireTension = useCallback(async () => {
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

    const fetchCompaction = useCallback(async () => {
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

    const fetchBatchWeighment = useCallback(async () => {
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

    const fetchSteamCuring = useCallback(async () => {
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

    const fetchBenchMoulds = useCallback(async () => {
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

    const loadShiftData = useCallback(async () => {
        setIsLoading(true);
        try {
            await Promise.allSettled([
                fetchMoisture(),
                fetchManualChecks(),
                fetchWireTension(),
                fetchCompaction(),
                fetchBatchWeighment(),
                fetchSteamCuring(),
                fetchBenchMoulds()
            ]);
        } catch (error) {
            console.error("Error loading shift data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchMoisture, fetchManualChecks, fetchWireTension, fetchCompaction, fetchBatchWeighment, fetchSteamCuring, fetchBenchMoulds]);


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
        fetchMoisture,
        fetchManualChecks,
        fetchWireTension,
        fetchCompaction,
        fetchBatchWeighment,
        fetchSteamCuring,
        fetchBenchMoulds,
        isLoading,
        endDuty
    };



    return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};
