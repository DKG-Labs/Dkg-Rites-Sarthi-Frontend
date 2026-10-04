import { useState, useEffect, useMemo, useRef } from 'react';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { API_ENDPOINTS, getAuthHeaders, handleResponse } from '../services/apiConfig';
import { formatDate } from '../utils/helpers';

/* ── Inject keyframes once ──────────────────────── */
if (!document.getElementById('pds-keyframes')) {
    const s = document.createElement('style');
    s.id = 'pds-keyframes';
    s.textContent = `
    @keyframes pds-spin { to { transform: rotate(360deg); } }
    @keyframes pds-fade-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pds-fade-in { from { opacity:0; } to { opacity:1; } }
    @keyframes pds-scale-in { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    @keyframes pds-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
    .pds-tile:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.14) !important; }
    .pds-tile { transition: transform 0.2s, box-shadow 0.2s; }
    .pds-tr:hover td { background: #f0f9ff !important; }
    .pds-custom-select-option:hover { background: #f0fdf4 !important; color: #059669 !important; }
    .pds-custom-select-option { transition: all 0.2s ease; }
    .complex-table th, .complex-table td { border: 1px solid #000 !important; }
  `;
    document.head.appendChild(s);
}

const sortAccessors = {
    date: (s) => s.basicDetails?.date || '',
    createdAt: (s) => s.basicDetails?.createdAt || s.basicDetails?.date || '',
    shift: (s) => s.basicDetails?.shift || '',
    line: (s) => s.basicDetails?.lineNo || '',
    engineer: (s) => s.basicDetails?.engineer || '',
    poSrNo: (s) => s.basicDetails?.poSrNo || '',
    lotNo: (s) => s.basicDetails?.lotNumber || '',
    acceptedQty: (s) => Number(s.basicDetails?.totalAcceptedQty ?? 0),
    rejectedQty: (s) => Number(s.basicDetails?.totalRejectionQty ?? 0),
    shearingProd: (s) => Number(s.processQty?.shearingProductionQty ?? 0),
    shearingRej: (s) => Number(s.processQty?.shearingRejectionQty ?? 0),
    turningProd: (s) => Number(s.processQty?.turningProductionQty ?? 0),
    turningRej: (s) => Number(s.processQty?.turningRejectionQty ?? 0),
    mpiProd: (s) => Number(s.processQty?.mpiProductionQty ?? 0),
    mpiRej: (s) => Number(s.processQty?.mpiRejectionQty ?? 0),
    forgingProd: (s) => Number(s.processQty?.forgingProductionQty ?? 0),
    forgingRej: (s) => Number(s.processQty?.forgingRejectionQty ?? 0),
    quenchingProd: (s) => Number(s.processQty?.quenchingProductionQty ?? 0),
    quenchingRej: (s) => Number(s.processQty?.quenchingRejectionQty ?? 0),
    temperingProd: (s) => Number(s.processQty?.temperingProductionQty ?? 0),
    temperingRej: (s) => Number(s.processQty?.temperingRejectionQty ?? 0),
    shearingCutLen: (s) => Number(s.shearingDefects?.lengthOfCutBar ?? 0),
    shearingOvality: (s) => Number(s.shearingDefects?.ovalityImproperDiaAtEnd ?? 0),
    shearingSharpEdges: (s) => Number(s.shearingDefects?.sharpEdges ?? 0),
    shearingCracks: (s) => Number(s.shearingDefects?.crackedEdges ?? 0),
    turningParaLen: (s) => Number(s.turningDefects?.parallelLength ?? 0),
    turningFullTurn: (s) => Number(s.turningDefects?.fullTurningLength ?? 0),
    turningTurnDia: (s) => Number(s.turningDefects?.turningDia ?? 0),
    mpiMpiRej: (s) => Number(s.processQty?.mpiRejectionQty ?? 0),
    forgingForgeTemp: (s) => Number(s.forgingDefects?.forgingTemperature ?? 0),
    forgingStabilise: (s) => Number(s.forgingDefects?.forgingStabilisationRejection ?? 0),
    forgingImproper: (s) => Number(s.forgingDefects?.improperForging ?? 0),
    forgingDefect: (s) => Number(s.forgingDefects?.forgingMarksNotches ?? 0),
    quenchingHardness: (s) => Number(s.quenchingDefects?.quenchingHardness ?? 0),
    temperingTemp: (s) => Number(s.temperingDefects?.temperingTemp ?? 0),
    temperingDur: (s) => Number(s.temperingDefects?.temperingDuration ?? 0),
    boxGauge: (s) => Number(s.dimensionalDefects?.boxGauge ?? 0),
    bearingArea: (s) => Number(s.dimensionalDefects?.flatBearingArea ?? 0),
    fallingGauge: (s) => Number(s.dimensionalDefects?.fallingGauge ?? 0),
    surface: (s) => Number(s.visualDefects?.surfaceDefect ?? 0),
    embossing: (s) => Number(s.visualDefects?.embossingDefect ?? 0),
    marking: (s) => Number(s.visualDefects?.marking ?? 0),
    tempHard: (s) => Number(s.testingDefects?.temperingHardness ?? 0),
    toeLoad: (s) => Number(s.testingDefects?.toeLoad ?? 0),
    weight: (s) => Number(s.testingDefects?.weight ?? 0),
    paintId: (s) => Number(s.finishingDefects?.paintIdentification ?? 0),
    coating: (s) => Number(s.finishingDefects?.ercCoating ?? 0)
};

const PRODUCTION_STAGES = [
    { key: 'shearing', label: 'Shearing', prodField: 'shearingManufactured', rejField: 'shearingRejected', rejKey: 'shearing', icon: '✂️', activeTab: 'shearing', defaultField: 'lengthCutBarRejected' },
    { key: 'turning', label: 'Turning', prodField: 'turningManufactured', rejField: 'turningRejected', rejKey: 'turning', icon: '⚙️', activeTab: 'turning', defaultField: 'parallelLengthRejected' },
    { key: 'mpi', label: 'MPI', prodField: 'mpiManufactured', rejField: 'mpiRejected', rejKey: 'mpi', icon: '🧲', activeTab: 'mpi', defaultField: 'mpiRejected' },
    { key: 'forging', label: 'Forging', prodField: 'forgingManufactured', rejField: 'forgingRejected', rejKey: 'forging', icon: '🔨', activeTab: 'forging', defaultField: 'improperForgingRejected' },
    { key: 'quenching', label: 'Quenching', prodField: 'quenchingManufactured', rejField: 'quenchingRejected', rejKey: 'quenching', icon: '🌊', activeTab: 'quenching', defaultField: 'quenchingHardnessRejected' },
    { key: 'tempering', label: 'Tempering', prodField: 'temperingManufactured', rejField: 'temperingRejected', rejKey: 'temperingStage', icon: '🔥', activeTab: 'temperingBase', defaultField: 'temperingTemperatureRejected', isRollup: true }
];

const SECTION_TABS = [
    { id: 'shearing', label: 'Shearing', badgeKey: 'shearing', stageKey: 'shearing' },
    { id: 'turning', label: 'Turning', badgeKey: 'turning', stageKey: 'turning' },
    { id: 'mpi', label: 'MPI', badgeKey: 'mpi', stageKey: 'mpi' },
    { id: 'forging', label: 'Forging', badgeKey: 'forging', stageKey: 'forging' },
    { id: 'quenching', label: 'Quenching', badgeKey: 'quenching', stageKey: 'quenching' },
    { id: 'temperingBase', label: 'Tempering (Base)', badgeKey: 'temperingBase', stageKey: 'tempering' },
    { id: 'finalCheck', label: 'Final Check (Dims & Visual)', badgeKey: 'finalCheck', stageKey: 'tempering' },
    { id: 'testingFinishing', label: 'Testing & Finishing', badgeKey: 'testingFinishing', stageKey: 'tempering' }
];

const SECTION_DEFECT_FIELDS = {
    shearing: [
        { key: 'lengthCutBarRejected', label: 'Cut Bar Length' },
        { key: 'improperDiaRejected', label: 'Ovality / Dia at End' },
        { key: 'sharpEdgesRejected', label: 'Sharp Edges' },
        { key: 'crackedEdgesRejected', label: 'Cracked Edges' }
    ],
    turning: [
        { key: 'parallelLengthRejected', label: 'Parallel Length' },
        { key: 'fullTurningLengthRejected', label: 'Full Turning Length' },
        { key: 'turningDiaRejected', label: 'Turning Dia' }
    ],
    mpi: [
        { key: 'mpiRejected', label: 'MPI Defect (Surface Cracks / Seams / Laps)' }
    ],
    forging: [
        { key: 'forgingTempRejected', label: 'Forging Temp' },
        { key: 'forgingStabilisationRejectionRejected', label: 'Stabilisation' },
        { key: 'improperForgingRejected', label: 'Improper Forging' },
        { key: 'forgingDefectRejected', label: 'Marks / Notches' },
        { key: 'forgingEmbossingRejected', label: 'Forging Embossing' }
    ],
    quenching: [
        { key: 'quenchingTemperatureRejected', label: 'Quench Temp' },
        { key: 'quenchingDurationRejected', label: 'Quench Duration' },
        { key: 'quenchingHardnessRejected', label: 'Quench Hardness' },
        { key: 'quenchingBoxGaugeRejected', label: 'Box Gauge' },
        { key: 'quenchingFlatBearingAreaRejected', label: 'Bearing Area' },
        { key: 'quenchingFallingGaugeRejected', label: 'Falling Gauge' }
    ],
    temperingBase: [
        { key: 'temperingTemperatureRejected', label: 'Tempering Temp' },
        { key: 'temperingDurationRejected', label: 'Tempering Duration' }
    ],
    finalCheck: [
        { key: 'surfaceDefectRejected', label: 'Visual: Surface Defect' },
        { key: 'embossingDefectRejected', label: 'Visual: Embossing' },
        { key: 'markingRejected', label: 'Visual: Marking' },
        { key: 'finalBoxGaugeRejected', label: 'Dims: Box Gauge' },
        { key: 'finalFlatBearingAreaRejected', label: 'Dims: Bearing Area' },
        { key: 'finalFallingGaugeRejected', label: 'Dims: Falling Gauge' },
        { key: 'temperingHardnessRejected', label: 'Hardness: Tempering' }
    ],
    testingFinishing: [
        { key: 'toeLoadRejected', label: 'Testing: Toe Load' },
        { key: 'weightRejected', label: 'Testing: Weight' },
        { key: 'paintIdentificationRejected', label: 'Finishing: Paint ID' },
        { key: 'ercCoatingRejected', label: 'Finishing: ERC Coating' }
    ]
};

export default function ProcessDefectSummaryPage() {
    const [callNoInput, setCallNoInput] = useState('');
    const [submittedCallNo, setSubmittedCallNo] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [icNumbers, setIcNumbers] = useState([]);
    const [fetchingIcNumbers, setFetchingIcNumbers] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchIc, setSearchIc] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Edit modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [hourlyLoading, setHourlyLoading] = useState(false);
    const [hourlyDetails, setHourlyDetails] = useState(null);
    const [activeSectionTab, setActiveSectionTab] = useState('shearing');
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');
    const defectGridRef = useRef(null);
    const modalBodyRef = useRef(null);

    const jumpToHour = (hIdx) => {
        const el = document.getElementById(`hour-row-${hIdx}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            el.style.transition = 'all 0.3s ease';
            el.style.backgroundColor = '#fef08a';
            el.style.outline = '2px solid #ef4444';
            setTimeout(() => {
                el.style.backgroundColor = '';
                el.style.outline = '';
            }, 1800);
        }
    };

    const handleSelectStageCard = (stage) => {
        setActiveSectionTab(stage.activeTab);
    };

    // Delete modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [shiftToDelete, setShiftToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Fetch IC numbers list for the logged-in user
    const fetchIcNumbersList = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        setFetchingIcNumbers(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.REPORTS}/process/ic-numbers/${userId}`, { headers: getAuthHeaders() });
            const json = await handleResponse(res);
            setIcNumbers(Array.isArray(json) ? json : []);
        } catch (e) {
            console.error('Failed to fetch IC numbers:', e);
        } finally {
            setFetchingIcNumbers(false);
        }
    };

    // Load IC numbers on mount
    useEffect(() => {
        fetchIcNumbersList();
    }, []);

    const fetchData = async (callNo) => {
        if (!callNo) return;
        const trimmed = callNo.trim();
        setLoading(true); setError(''); setData([]); setCurrentPage(1);
        try {
            const res = await fetch(`${API_ENDPOINTS.REPORTS}/4thLevelReportICData/${trimmed}`, { headers: getAuthHeaders() });
            const json = await handleResponse(res);
            // API wraps payload: { responseStatus: {...}, responseData: [...] }
            const rows = json?.responseData ?? json;
            setData(Array.isArray(rows) ? rows : []);
            setSubmittedCallNo(trimmed);
        } catch (e) {
            setError(e?.message || 'Failed to fetch. Please check the Call No.');
        } finally { setLoading(false); }
    };

    const handleSelectOption = (val) => {
        setCallNoInput(val);
        setDropdownOpen(false);
        if (val) fetchData(val);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = () => setDropdownOpen(false);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Also clear search when dropdown closes
    useEffect(() => {
        if (!dropdownOpen) setSearchIc('');
    }, [dropdownOpen]);


    const handleClear = () => { setCallNoInput(''); setSubmittedCallNo(''); setData([]); setError(''); setCurrentPage(1); };

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // Helper to determine if a shift record has any actual production, rejection, or defect data
    const hasShiftData = (shift) => {
        if (!shift) return false;

        // 1. Accepted or Rejected Qty
        const accepted = Number(shift.basicDetails?.totalAcceptedQty || 0);
        const rejected = Number(shift.basicDetails?.totalRejectionQty || 0);
        if (accepted > 0 || rejected > 0) return true;

        // 2. Process Stage Quantities (Prod or Rej)
        const pq = shift.processQty || {};
        const stageValues = [
            pq.shearingProductionQty, pq.shearingRejectionQty,
            pq.turningProductionQty, pq.turningRejectionQty,
            pq.mpiProductionQty, pq.mpiRejectionQty,
            pq.forgingProductionQty, pq.forgingRejectionQty,
            pq.quenchingProductionQty, pq.quenchingRejectionQty,
            pq.temperingProductionQty, pq.temperingRejectionQty,
        ];
        if (stageValues.some(v => Number(v || 0) > 0)) return true;

        // 3. Any Defect Groups
        const defectGroups = [
            shift.shearingDefects,
            shift.turningDefects,
            shift.forgingDefects,
            shift.quenchingDefects,
            shift.temperingDefects,
            shift.dimensionalDefects,
            shift.visualDefects,
            shift.testingDefects,
            shift.finishingDefects,
        ];
        for (const group of defectGroups) {
            if (group && typeof group === 'object') {
                for (const val of Object.values(group)) {
                    if (Number(val || 0) > 0) return true;
                }
            }
        }

        return false;
    };

    const activeData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.filter(hasShiftData);
    }, [data]);

    const sortedData = useMemo(() => {
        if (!activeData || activeData.length === 0 || !sortConfig.key) return activeData;
        const accessor = sortAccessors[sortConfig.key];
        if (!accessor) return activeData;

        return [...activeData].sort((a, b) => {
            let valA = accessor(a);
            let valB = accessor(b);

            if (typeof valA === 'string' && typeof valB === 'string') {
                const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                return sortConfig.direction === 'asc' ? cmp : -cmp;
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [activeData, sortConfig]);

    const totalItems = sortedData.length;
    const totalPages = pageSize === 'all' ? 1 : (Math.ceil(totalItems / pageSize) || 1);
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = pageSize === 'all' ? 0 : (safeCurrentPage - 1) * pageSize;
    const endIndex = pageSize === 'all' ? totalItems : Math.min(startIndex + pageSize, totalItems);
    const paginatedData = useMemo(() => {
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, startIndex, endIndex]);

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safeCurrentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (safeCurrentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
    };

    // Helper to check if a date value corresponds to today
    const isSameDateAsToday = (val) => {
        if (!val) return false;
        const now = new Date();
        const todayYear = now.getFullYear();
        const todayMonth = now.getMonth() + 1;
        const todayDay = now.getDate();

        const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yestYear = yest.getFullYear();
        const yestMonth = yest.getMonth() + 1;
        const yestDay = yest.getDate();

        if (Array.isArray(val) && val.length >= 3) {
            const yr = Number(val[0]);
            const mo = Number(val[1]);
            const dy = Number(val[2]);
            return (yr === todayYear && mo === todayMonth && dy === todayDay) ||
                   (yr === yestYear && mo === yestMonth && dy === yestDay);
        }

        if (typeof val === 'string') {
            const trimmed = val.trim();
            const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (ymdMatch) {
                const y = parseInt(ymdMatch[1], 10);
                const m = parseInt(ymdMatch[2], 10);
                const d = parseInt(ymdMatch[3], 10);
                return (y === todayYear && m === todayMonth && d === todayDay) ||
                       (y === yestYear && m === yestMonth && d === yestDay);
            }
            const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
            if (dmyMatch) {
                const d = parseInt(dmyMatch[1], 10);
                const m = parseInt(dmyMatch[2], 10);
                const y = parseInt(dmyMatch[3], 10);
                return (y === todayYear && m === todayMonth && d === todayDay) ||
                       (y === yestYear && m === yestMonth && d === yestDay);
            }
        }

        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            const yr = d.getFullYear();
            const mo = d.getMonth() + 1;
            const dy = d.getDate();
            return (yr === todayYear && mo === todayMonth && dy === todayDay) ||
                   (yr === yestYear && mo === yestMonth && dy === yestDay);
        }
        return false;
    };

    // Helper to check if record was created today or yesterday (e.g. 30 and 29)
    const isCreatedToday = (record) => {
        if (!record) return false;
        const raw = record?.basicDetails?.createdAt || record?.createdAt;
        if (raw) return isSameDateAsToday(raw);
        const alt = record?.basicDetails?.date || record?.date || record?.dateOfInspection;
        if (alt) return isSameDateAsToday(alt);
        return false;
    };

    // Helper to check if record was created/inspected by the currently logged-in user
    const isUserShift = (record) => {
        if (!record) return false;

        const currentUserId = String(localStorage.getItem('userId') || '').trim().toLowerCase();
        const currentEmpCode = String(localStorage.getItem('employeeCode') || '').trim().toLowerCase();
        const currentUserName = String(localStorage.getItem('userName') || '').trim().toLowerCase();
        const currentLoginId = String(localStorage.getItem('loginId') || '').trim().toLowerCase();

        const createdBy = String(record?.basicDetails?.createdBy || record?.createdBy || '').trim().toLowerCase();
        const engineer = String(record?.basicDetails?.engineer || record?.engineer || '').trim().toLowerCase();

        // 1. Direct createdBy check against current user identifiers
        if (createdBy) {
            if (currentUserId && createdBy === currentUserId) return true;
            if (currentEmpCode && createdBy === currentEmpCode) return true;
            if (currentLoginId && createdBy === currentLoginId) return true;
            if (currentUserName && createdBy === currentUserName) return true;
        }

        // 2. Engineer display string check (e.g. "ASHOK HALDER (104553)")
        if (engineer) {
            if (currentEmpCode && (engineer.includes(`(${currentEmpCode})`) || engineer.includes(currentEmpCode))) {
                return true;
            }
            if (currentUserId && (engineer.includes(`(${currentUserId})`) || engineer.includes(currentUserId))) {
                return true;
            }
            if (currentUserName && engineer.includes(currentUserName)) {
                return true;
            }
            if (currentLoginId && engineer.includes(currentLoginId)) {
                return true;
            }
        }

        return false;
    };

    // Open Edit Modal and load hourly details
    const handleOpenEditModal = async (shiftRow) => {
        if (!isUserShift(shiftRow)) {
            alert("You cannot edit another user's shift records. You can only edit your own shifts.");
            return;
        }
        if (!isCreatedToday(shiftRow)) {
            alert('Edit functionality is disabled. Records created before yesterday cannot be edited.');
            return;
        }
        let finalResultId = shiftRow.basicDetails?.id || shiftRow.id;

        if (!finalResultId) {
            // Attempt auto-lookup by callNo, shift, lotNumber, lineNo
            try {
                const callNo = submittedCallNo || shiftRow.basicDetails?.callNo || '';
                const shift = shiftRow.basicDetails?.shift || '';
                const lotNo = shiftRow.basicDetails?.lotNumber || '';
                const lineNo = shiftRow.basicDetails?.lineNo || '';
                const lookupRes = await fetch(
                    `${API_ENDPOINTS.REPORTS}/process-defect-summary/lookup?callNo=${encodeURIComponent(callNo)}&shift=${encodeURIComponent(shift)}&lotNo=${encodeURIComponent(lotNo)}&lineNo=${encodeURIComponent(lineNo)}`,
                    { headers: getAuthHeaders() }
                );
                const lookupJson = await handleResponse(lookupRes);
                const lookedUpId = lookupJson?.responseData ?? lookupJson;
                if (lookedUpId) {
                    finalResultId = lookedUpId;
                    if (!shiftRow.basicDetails) shiftRow.basicDetails = {};
                    shiftRow.basicDetails.id = lookedUpId;
                    shiftRow.id = lookedUpId;
                }
            } catch (err) {
                console.warn('Lookup failed:', err);
            }
        }

        if (!finalResultId) {
            alert('Record ID was not found in the current cached view. Refreshing data for call ' + (submittedCallNo || '') + '...');
            if (submittedCallNo) {
                fetchData(submittedCallNo);
            }
            return;
        }

        setEditModalOpen(true);
        setHourlyLoading(true);
        setSaveError('');
        setSaveSuccess('');
        setActiveSectionTab('shearing');
        try {
            const res = await fetch(`${API_ENDPOINTS.REPORTS}/process-defect-summary/${finalResultId}/hourly`, {
                headers: getAuthHeaders()
            });
            const json = await handleResponse(res);
            const d = json?.responseData ?? json;
            if (!d.lineNo) d.lineNo = shiftRow.basicDetails?.lineNo || 'Line-1';
            if (!d.shift) d.shift = shiftRow.basicDetails?.shift || 'A';
            if (!d.lotNumber) d.lotNumber = shiftRow.basicDetails?.lotNumber || '';
            if (!d.dateOfInspection) d.dateOfInspection = shiftRow.basicDetails?.date || '';
            if (d.dateOfInspection && d.dateOfInspection.includes('T')) {
                d.dateOfInspection = d.dateOfInspection.split('T')[0];
            }
            // Engineer name in brackets (e.g. RAMASETTY RUDRA SATYANARAYANA (104486))
            const eng = shiftRow.basicDetails?.engineer || d.engineer || d.createdBy || '';
            d.engineer = eng;
            if (!d.createdBy) d.createdBy = shiftRow.basicDetails?.createdBy || '';

            // Shift and Stage production quantities
            if (d.totalAccepted == null) d.totalAccepted = shiftRow.basicDetails?.totalAcceptedQty ?? 0;
            if (d.totalManufactured == null) d.totalManufactured = (shiftRow.basicDetails?.totalAcceptedQty ?? 0) + (shiftRow.basicDetails?.totalRejectionQty ?? 0);
            if (!d.callNo) d.callNo = shiftRow.basicDetails?.callNo || submittedCallNo || '';

            if (d.shearingManufactured == null) d.shearingManufactured = shiftRow.processQty?.shearingProductionQty ?? 0;
            if (d.turningManufactured == null) d.turningManufactured = shiftRow.processQty?.turningProductionQty ?? 0;
            if (d.mpiManufactured == null) d.mpiManufactured = shiftRow.processQty?.mpiProductionQty ?? 0;
            if (d.forgingManufactured == null) d.forgingManufactured = shiftRow.processQty?.forgingProductionQty ?? 0;
            if (d.quenchingManufactured == null) d.quenchingManufactured = shiftRow.processQty?.quenchingProductionQty ?? 0;
            if (d.temperingManufactured == null) d.temperingManufactured = shiftRow.processQty?.temperingProductionQty ?? 0;

            // Rejection quantities fallback from shiftRow only if null/undefined
            if (d.shearingRejected == null) d.shearingRejected = shiftRow.processQty?.shearingRejectionQty ?? shiftRow.rejections?.shearing ?? 0;
            if (d.turningRejected == null) d.turningRejected = shiftRow.processQty?.turningRejectionQty ?? shiftRow.rejections?.turning ?? 0;
            if (d.mpiRejected == null) d.mpiRejected = shiftRow.processQty?.mpiRejectionQty ?? shiftRow.rejections?.mpi ?? 0;
            if (d.forgingRejected == null) d.forgingRejected = shiftRow.processQty?.forgingRejectionQty ?? shiftRow.rejections?.forging ?? 0;
            if (d.quenchingRejected == null) d.quenchingRejected = shiftRow.processQty?.quenchingRejectionQty ?? shiftRow.rejections?.quenching ?? 0;
            if (d.temperingRejected == null) d.temperingRejected = shiftRow.processQty?.temperingRejectionQty ?? shiftRow.rejections?.tempering ?? 0;

            // Fallback: Ensure 8 rows always exist
            if (!d.hourlyRows || d.hourlyRows.length === 0) {
                const defaultLabels = ['06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00'];
                d.hourlyRows = Array.from({ length: 8 }, (_, i) => ({
                    hourIndex: i,
                    hourLabel: defaultLabels[i] || `Hour ${i + 1}`
                }));
            }

            setHourlyDetails(d);
        } catch (err) {
            setSaveError(err?.message || 'Failed to fetch hourly breakdown');
        } finally {
            setHourlyLoading(false);
        }
    };

    // Open Delete Confirmation Modal
    const handleOpenDeleteModal = async (shiftRow) => {
        if (!isUserShift(shiftRow)) {
            alert("You cannot delete another user's shift records. You can only delete your own shifts.");
            return;
        }
        if (!isCreatedToday(shiftRow)) {
            alert('Delete functionality is disabled. Records created before yesterday cannot be deleted.');
            return;
        }
        let finalResultId = shiftRow.basicDetails?.id || shiftRow.id;
        if (!finalResultId) {
            try {
                const callNo = submittedCallNo || shiftRow.basicDetails?.callNo || '';
                const shift = shiftRow.basicDetails?.shift || '';
                const lotNo = shiftRow.basicDetails?.lotNumber || '';
                const lineNo = shiftRow.basicDetails?.lineNo || '';
                const lookupRes = await fetch(
                    `${API_ENDPOINTS.REPORTS}/process-defect-summary/lookup?callNo=${encodeURIComponent(callNo)}&shift=${encodeURIComponent(shift)}&lotNo=${encodeURIComponent(lotNo)}&lineNo=${encodeURIComponent(lineNo)}`,
                    { headers: getAuthHeaders() }
                );
                const lookupJson = await handleResponse(lookupRes);
                const lookedUpId = lookupJson?.responseData ?? lookupJson;
                if (lookedUpId) {
                    finalResultId = lookedUpId;
                    if (!shiftRow.basicDetails) shiftRow.basicDetails = {};
                    shiftRow.basicDetails.id = lookedUpId;
                    shiftRow.id = lookedUpId;
                }
            } catch (err) {
                console.warn('Lookup failed:', err);
            }
        }
        setShiftToDelete(shiftRow);
        setDeleteError('');
        setDeleteModalOpen(true);
    };

    // Confirm Delete
    const handleConfirmDelete = async () => {
        if (!shiftToDelete) return;
        if (!isUserShift(shiftToDelete)) {
            setDeleteError("You cannot delete another user's shift records.");
            return;
        }
        if (!isCreatedToday(shiftToDelete)) {
            setDeleteError('Delete functionality is disabled. Records created before yesterday cannot be deleted.');
            return;
        }
        const finalResultId = shiftToDelete.basicDetails?.id || shiftToDelete.id;
        if (!finalResultId) return;
        const userId = localStorage.getItem('userId') || '';
        setDeleteLoading(true);
        setDeleteError('');
        try {
            const res = await fetch(`${API_ENDPOINTS.REPORTS}/process-defect-summary/${finalResultId}?userId=${encodeURIComponent(userId)}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            await handleResponse(res);
            setDeleteModalOpen(false);
            setShiftToDelete(null);
            if (submittedCallNo) {
                fetchData(submittedCallNo);
            }
        } catch (err) {
            setDeleteError(err?.message || 'Failed to delete record');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Helper to calculate total shift rejections from any rows array
    const computeTotalShiftRejFromRows = (rows) => {
        if (!rows || !Array.isArray(rows)) return 0;
        return rows.reduce((acc, r) => {
            const sh = (Number(r.lengthCutBarRejected) || 0) + (Number(r.improperDiaRejected) || 0) + (Number(r.sharpEdgesRejected) || 0) + (Number(r.crackedEdgesRejected) || 0);
            const tu = (Number(r.parallelLengthRejected) || 0) + (Number(r.fullTurningLengthRejected) || 0) + (Number(r.turningDiaRejected) || 0);
            const mp = (Number(r.mpiRejected) || 0);
            const fo = (Number(r.forgingTempRejected) || 0) + (Number(r.forgingStabilisationRejectionRejected) || 0) + (Number(r.improperForgingRejected) || 0) + (Number(r.forgingDefectRejected) || 0) + (Number(r.forgingEmbossingRejected) || 0);
            const qu = (Number(r.quenchingTemperatureRejected) || 0) + (Number(r.quenchingDurationRejected) || 0) + (Number(r.quenchingHardnessRejected) || 0) + (Number(r.quenchingBoxGaugeRejected) || 0) + (Number(r.quenchingFlatBearingAreaRejected) || 0) + (Number(r.quenchingFallingGaugeRejected) || 0);
            const tm = (Number(r.temperingTemperatureRejected) || 0) + (Number(r.temperingDurationRejected) || 0) +
                       (Number(r.surfaceDefectRejected) || 0) + (Number(r.embossingDefectRejected) || 0) + (Number(r.markingRejected) || 0) +
                       (Number(r.finalBoxGaugeRejected) || 0) + (Number(r.finalFlatBearingAreaRejected) || 0) + (Number(r.finalFallingGaugeRejected) || 0) +
                       (Number(r.temperingHardnessRejected) || 0) +
                       (Number(r.toeLoadRejected) || 0) + (Number(r.weightRejected) || 0) + (Number(r.paintIdentificationRejected) || 0) + (Number(r.ercCoatingRejected) || 0);
            return acc + sh + tu + mp + fo + qu + tm;
        }, 0);
    };

    // Helper to update hourly row in hourlyDetails
    const handleHourlyFieldChange = (hourIndex, field, value) => {
        if (!hourlyDetails || !hourlyDetails.hourlyRows) return;
        const numVal = value === '' ? 0 : parseInt(value, 10);
        const safeVal = isNaN(numVal) ? 0 : Math.max(0, numVal);

        setHourlyDetails(prev => {
            const updatedRows = prev.hourlyRows.map((r, idx) => {
                if (idx === hourIndex) {
                    return { ...r, [field]: safeVal };
                }
                return r;
            });
            const newTotalRej = computeTotalShiftRejFromRows(updatedRows);
            const mfg = Number(prev.totalManufactured) || 0;
            const newAccepted = Math.max(0, mfg - newTotalRej);
            return {
                ...prev,
                hourlyRows: updatedRows,
                totalAccepted: newAccepted
            };
        });
    };

    // Helper to allow direct modification of Stage Rejection on the stage cards
    const handleStageRejectionChange = (stageKey, value) => {
        if (!hourlyDetails || !hourlyDetails.hourlyRows) return;
        const numVal = value === '' ? 0 : parseInt(value, 10);
        const safeVal = isNaN(numVal) ? 0 : Math.max(0, numVal);

        const stageConfig = PRODUCTION_STAGES.find(s => s.key === stageKey);
        if (!stageConfig) return;

        const currentTotal = sectionTotals[stageConfig.rejKey] ?? 0;
        const diff = safeVal - currentTotal;
        if (diff === 0) return;

        setHourlyDetails(prev => {
            if (!prev.hourlyRows || prev.hourlyRows.length === 0) return prev;

            let newRows = prev.hourlyRows.map(r => ({ ...r }));

            if (safeVal === 0) {
                // Clear all defect fields for this stage across all 8 hours
                let stageTabIds = [stageConfig.activeTab];
                if (stageKey === 'tempering') {
                    stageTabIds = ['temperingBase', 'finalCheck', 'testingFinishing'];
                }
                stageTabIds.forEach(tabId => {
                    const cols = SECTION_DEFECT_FIELDS[tabId] || [];
                    newRows.forEach(r => {
                        cols.forEach(c => {
                            r[c.key] = 0;
                        });
                    });
                });
            } else if (currentTotal === 0) {
                // If currently 0, allocate safeVal to hour 0 of defaultField
                const field = stageConfig.defaultField;
                if (newRows[0]) {
                    newRows[0][field] = safeVal;
                }
            } else {
                // Adjust difference into defaultField of the first row that has defects, or row 0
                const field = stageConfig.defaultField;
                let targetIdx = 0;
                for (let i = 0; i < newRows.length; i++) {
                    if ((newRows[i][field] || 0) > 0) {
                        targetIdx = i;
                        break;
                    }
                }
                const currentFieldVal = newRows[targetIdx][field] || 0;
                if (diff < 0) {
                    let toDeduct = Math.abs(diff);
                    for (let i = newRows.length - 1; i >= 0 && toDeduct > 0; i--) {
                        let stageTabIds = [stageConfig.activeTab];
                        if (stageKey === 'tempering') {
                            stageTabIds = ['temperingBase', 'finalCheck', 'testingFinishing'];
                        }
                        for (let tId of stageTabIds) {
                            const cols = SECTION_DEFECT_FIELDS[tId] || [];
                            for (let c of cols) {
                                if (toDeduct <= 0) break;
                                const curVal = newRows[i][c.key] || 0;
                                if (curVal > 0) {
                                    const deductAmount = Math.min(curVal, toDeduct);
                                    newRows[i][c.key] = curVal - deductAmount;
                                    toDeduct -= deductAmount;
                                }
                            }
                        }
                    }
                } else {
                    newRows[targetIdx][field] = currentFieldVal + diff;
                }
            }

            const newTotalRej = computeTotalShiftRejFromRows(newRows);
            const mfg = Number(prev.totalManufactured) || 0;
            const newAccepted = Math.max(0, mfg - newTotalRej);

            return {
                ...prev,
                [stageConfig.rejField]: safeVal,
                hourlyRows: newRows,
                totalAccepted: newAccepted
            };
        });
    };

    // Helper to allow updating Accepted Qty, which automatically updates rejections
    const handleAcceptedQtyChange = (val) => {
        if (!hourlyDetails || !hourlyDetails.hourlyRows) return;
        const numVal = val === '' ? 0 : parseInt(val, 10);
        const safeAccepted = isNaN(numVal) ? 0 : Math.max(0, numVal);

        const currentMfg = Number(hourlyDetails.totalManufactured) || 0;
        const targetRej = Math.max(0, currentMfg - safeAccepted);
        const currentRej = sectionTotals.totalShiftRej || 0;
        const diff = targetRej - currentRej;

        if (diff === 0) {
            setHourlyDetails(prev => ({ ...prev, totalAccepted: safeAccepted }));
            return;
        }

        // Apply difference to the currently active stage (or shearing by default)
        let targetStageKey = activeSectionTab;
        if (['temperingBase', 'finalCheck', 'testingFinishing'].includes(activeSectionTab)) {
            targetStageKey = 'tempering';
        }
        const stageConfig = PRODUCTION_STAGES.find(s => s.key === targetStageKey) || PRODUCTION_STAGES[0];
        const currentStageRej = sectionTotals[stageConfig.rejKey] ?? 0;
        const newStageRej = Math.max(0, currentStageRej + diff);

        handleStageRejectionChange(stageConfig.key, newStageRej);
        setHourlyDetails(prev => ({ ...prev, totalAccepted: safeAccepted }));
    };

    // Calculate section totals and overall totals live from hourlyRows
    const sectionTotals = useMemo(() => {
        if (!hourlyDetails || !hourlyDetails.hourlyRows) {
            return {
                shearing: 0, turning: 0, mpi: 0, forging: 0, quenching: 0,
                temperingBase: 0, visualCheck: 0, dimsCheck: 0, hardnessCheck: 0,
                finalCheck: 0, testingFinishing: 0, temperingStage: 0, totalShiftRej: 0
            };
        }
        const rows = hourlyDetails.hourlyRows;
        const shearing = rows.reduce((acc, r) => acc + (r.lengthCutBarRejected || 0) + (r.improperDiaRejected || 0) + (r.sharpEdgesRejected || 0) + (r.crackedEdgesRejected || 0), 0);
        const turning = rows.reduce((acc, r) => acc + (r.parallelLengthRejected || 0) + (r.fullTurningLengthRejected || 0) + (r.turningDiaRejected || 0), 0);
        const mpi = rows.reduce((acc, r) => acc + (r.mpiRejected || 0), 0);
        const forging = rows.reduce((acc, r) => acc + (r.forgingTempRejected || 0) + (r.forgingStabilisationRejectionRejected || 0) + (r.improperForgingRejected || 0) + (r.forgingDefectRejected || 0) + (r.forgingEmbossingRejected || 0), 0);
        const quenching = rows.reduce((acc, r) => acc + (r.quenchingTemperatureRejected || 0) + (r.quenchingDurationRejected || 0) + (r.quenchingHardnessRejected || 0) + (r.quenchingBoxGaugeRejected || 0) + (r.quenchingFlatBearingAreaRejected || 0) + (r.quenchingFallingGaugeRejected || 0), 0);
        const temperingBase = rows.reduce((acc, r) => acc + (r.temperingTemperatureRejected || 0) + (r.temperingDurationRejected || 0), 0);
        const visualCheck = rows.reduce((acc, r) => acc + (r.surfaceDefectRejected || 0) + (r.embossingDefectRejected || 0) + (r.markingRejected || 0), 0);
        const dimsCheck = rows.reduce((acc, r) => acc + (r.finalBoxGaugeRejected || 0) + (r.finalFlatBearingAreaRejected || 0) + (r.finalFallingGaugeRejected || 0), 0);
        const hardnessCheck = rows.reduce((acc, r) => acc + (r.temperingHardnessRejected || 0), 0);
        const finalCheck = visualCheck + dimsCheck + hardnessCheck;
        const testingFinishing = rows.reduce((acc, r) => acc + (r.toeLoadRejected || 0) + (r.weightRejected || 0) + (r.paintIdentificationRejected || 0) + (r.ercCoatingRejected || 0), 0);

        // Tempering Stage Rejection Rollup (Base + Final Check + Testing/Finishing)
        const temperingStage = temperingBase + finalCheck + testingFinishing;
        const totalShiftRej = shearing + turning + mpi + forging + quenching + temperingStage;

        return {
            shearing, turning, mpi, forging, quenching,
            temperingBase, visualCheck, dimsCheck, hardnessCheck,
            finalCheck, testingFinishing, temperingStage, totalShiftRej
        };
    }, [hourlyDetails]);

    // Save Defect Summary
    const handleSaveDefectSummary = async () => {
        if (!hourlyDetails) return;
        if (!isUserShift(hourlyDetails)) {
            setSaveError("You cannot edit another user's shift records.");
            return;
        }
        if (!isCreatedToday(hourlyDetails)) {
            setSaveError('Edit functionality is disabled. Records created before yesterday cannot be edited.');
            return;
        }
        setSaveLoading(true);
        setSaveError('');
        setSaveSuccess('');
        const userId = localStorage.getItem('userId') || '';
        const payload = {
            finalResultId: hourlyDetails.finalResultId,
            updatedBy: userId,
            lineNo: hourlyDetails.lineNo,
            shift: hourlyDetails.shift,
            dateOfInspection: hourlyDetails.dateOfInspection,
            createdBy: hourlyDetails.createdBy,
            engineer: hourlyDetails.engineer || hourlyDetails.createdBy || '',
            totalManufactured: Number(hourlyDetails.totalManufactured || 0),
            totalAccepted: Number(hourlyDetails.totalAccepted || 0),
            totalRejected: sectionTotals.totalShiftRej,
            shearingManufactured: Number(hourlyDetails.shearingManufactured || 0),
            shearingRejected: sectionTotals.shearing,
            turningManufactured: Number(hourlyDetails.turningManufactured || 0),
            turningRejected: sectionTotals.turning,
            mpiManufactured: Number(hourlyDetails.mpiManufactured || 0),
            mpiRejected: sectionTotals.mpi,
            forgingManufactured: Number(hourlyDetails.forgingManufactured || 0),
            forgingRejected: sectionTotals.forging,
            quenchingManufactured: Number(hourlyDetails.quenchingManufactured || 0),
            quenchingRejected: sectionTotals.quenching,
            temperingManufactured: Number(hourlyDetails.temperingManufactured || 0),
            temperingRejected: sectionTotals.temperingStage,
            hourlyRows: hourlyDetails.hourlyRows
        };

        try {
            const res = await fetch(`${API_ENDPOINTS.REPORTS}/process-defect-summary/${hourlyDetails.finalResultId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            await handleResponse(res);
            setSaveSuccess('Defect summary and process quantities updated successfully!');
            setTimeout(() => {
                setEditModalOpen(false);
                if (submittedCallNo) fetchData(submittedCallNo);
            }, 800);
        } catch (err) {
            setSaveError(err?.message || 'Failed to update record');
        } finally {
            setSaveLoading(false);
        }
    };

    const renderSortIcon = (key) => {
        const isSorted = sortConfig.key === key;
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginLeft: 4,
                opacity: isSorted ? 1 : 0.35,
                color: isSorted ? '#0284c7' : 'inherit',
                fontSize: '10px'
            }}>
                {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
            </span>
        );
    };

    const exportColumns = [
        { label: 'Date', getValue: (s) => s.basicDetails?.date ? formatDate(s.basicDetails.date) : '—' },
        { label: 'Shift', getValue: (s) => s.basicDetails?.shift || '—' },
        { label: 'Line', getValue: (s) => s.basicDetails?.lineNo || '—' },
        { label: 'Engineer', getValue: (s) => s.basicDetails?.engineer || '—' },
        { label: 'Sl.', getValue: (s, idx) => idx + 1 },
        { label: 'PO_Sr. No.', getValue: (s) => s.basicDetails?.poSrNo || '—' },
        { label: 'Lot No.', getValue: (s) => s.basicDetails?.lotNumber || '—' },
        { label: 'Accepted Qty', getValue: (s) => s.basicDetails?.totalAcceptedQty ?? 0 },
        { label: 'Rejected Qty', getValue: (s) => s.basicDetails?.totalRejectionQty ?? 0 },
        { label: 'Shearing Prod', getValue: (s) => s.processQty?.shearingProductionQty ?? 0 },
        { label: 'Shearing Rej', getValue: (s) => s.processQty?.shearingRejectionQty ?? 0 },
        { label: 'Turning Prod', getValue: (s) => s.processQty?.turningProductionQty ?? 0 },
        { label: 'Turning Rej', getValue: (s) => s.processQty?.turningRejectionQty ?? 0 },
        { label: 'MPI Prod', getValue: (s) => s.processQty?.mpiProductionQty ?? 0 },
        { label: 'MPI Rej', getValue: (s) => s.processQty?.mpiRejectionQty ?? 0 },
        { label: 'Forging Prod', getValue: (s) => s.processQty?.forgingProductionQty ?? 0 },
        { label: 'Forging Rej', getValue: (s) => s.processQty?.forgingRejectionQty ?? 0 },
        { label: 'Quenching Prod', getValue: (s) => s.processQty?.quenchingProductionQty ?? 0 },
        { label: 'Quenching Rej', getValue: (s) => s.processQty?.quenchingRejectionQty ?? 0 },
        { label: 'Tempering Prod', getValue: (s) => s.processQty?.temperingProductionQty ?? 0 },
        { label: 'Tempering Rej', getValue: (s) => s.processQty?.temperingRejectionQty ?? 0 },
        { label: 'Shearing Cut Len', getValue: (s) => s.shearingDefects?.lengthOfCutBar ?? 0 },
        { label: 'Shearing Ovality', getValue: (s) => s.shearingDefects?.ovalityImproperDiaAtEnd ?? 0 },
        { label: 'Shearing Sharp Edges', getValue: (s) => s.shearingDefects?.sharpEdges ?? 0 },
        { label: 'Shearing Cracks', getValue: (s) => s.shearingDefects?.crackedEdges ?? 0 },
        { label: 'Turning Para Len', getValue: (s) => s.turningDefects?.parallelLength ?? 0 },
        { label: 'Turning Full Turn', getValue: (s) => s.turningDefects?.fullTurningLength ?? 0 },
        { label: 'Turning Turn Dia', getValue: (s) => s.turningDefects?.turningDia ?? 0 },
        { label: 'MPI MPI Rej', getValue: (s) => s.processQty?.mpiRejectionQty ?? 0 },
        { label: 'Forging Forge Temp', getValue: (s) => s.forgingDefects?.forgingTemperature ?? 0 },
        { label: 'Forging Stabilise', getValue: (s) => s.forgingDefects?.forgingStabilisationRejection ?? 0 },
        { label: 'Forging Improper', getValue: (s) => s.forgingDefects?.improperForging ?? 0 },
        { label: 'Forging Defect', getValue: (s) => s.forgingDefects?.forgingMarksNotches ?? 0 },
        { label: 'Quenching Hardness', getValue: (s) => s.quenchingDefects?.quenchingHardness ?? 0 },
        { label: 'Tempering Temp.', getValue: (s) => s.temperingDefects?.temperingTemp ?? 0 },
        { label: 'Tempering Dur.', getValue: (s) => s.temperingDefects?.temperingDuration ?? 0 },
        { label: 'Dimensional Box Gauge', getValue: (s) => s.dimensionalDefects?.boxGauge ?? 0 },
        { label: 'Dimensional Bearing Area', getValue: (s) => s.dimensionalDefects?.flatBearingArea ?? 0 },
        { label: 'Dimensional Falling', getValue: (s) => s.dimensionalDefects?.fallingGauge ?? 0 },
        { label: 'Visual Surface', getValue: (s) => s.visualDefects?.surfaceDefect ?? 0 },
        { label: 'Visual Embossing', getValue: (s) => s.visualDefects?.embossingDefect ?? 0 },
        { label: 'Visual Marking', getValue: (s) => s.visualDefects?.marking ?? 0 },
        { label: 'Testing Temp Hard', getValue: (s) => s.testingDefects?.temperingHardness ?? 0 },
        { label: 'Testing Toe Load', getValue: (s) => s.testingDefects?.toeLoad ?? 0 },
        { label: 'Testing Weight', getValue: (s) => s.testingDefects?.weight ?? 0 },
        { label: 'Finishing Paint ID', getValue: (s) => s.finishingDefects?.paintIdentification ?? 0 },
        { label: 'Finishing Coating', getValue: (s) => s.finishingDefects?.ercCoating ?? 0 }
    ];

    const downloadExcel = async () => {
        if (!sortedData || sortedData.length === 0) return;
        const displayTitle = `Process Defect Summary - Call No: ${submittedCallNo || ''}`;
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');

        const titleRow = worksheet.addRow([displayTitle]);
        titleRow.font = { bold: true, size: 14 };
        if (exportColumns.length > 1) {
            worksheet.mergeCells(1, 1, 1, exportColumns.length);
        }
        
        worksheet.addRow([]);
        
        const headerRow = worksheet.addRow(exportColumns.map(col => col.label));
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });

        sortedData.forEach((shift, idx) => {
            const rowData = exportColumns.map(col => {
                const val = col.getValue(shift, idx);
                return (val === null || val === undefined) ? '' : val;
            });
            worksheet.addRow(rowData);
        });

        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                let columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) maxLength = columnLength;
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Process_Defect_Summary_${submittedCallNo}.xlsx`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalAccepted = activeData.reduce((s, r) => s + (r.basicDetails?.totalAcceptedQty ?? 0), 0);
    const totalRejected = activeData.reduce((s, r) => s + (r.basicDetails?.totalRejectionQty ?? 0), 0);
    const totalProduced = totalAccepted + totalRejected;
    const rejPct = totalProduced > 0 ? ((totalRejected / totalProduced) * 100).toFixed(1) : '0.0';

    /* ── KPI config ── */
    // eslint-disable-next-line no-unused-vars
    const kpis = [
        { label: 'Shifts Recorded', value: sortedData.length, icon: '📅', gradient: 'linear-gradient(135deg,#1e40af,#3b82f6)', accent: '#dbeafe' },
        { label: 'Total Produced', value: totalProduced.toLocaleString(), icon: '🏭', gradient: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', accent: '#ede9fe' },
        { label: 'Total Accepted', value: totalAccepted.toLocaleString(), icon: '✅', gradient: 'linear-gradient(135deg,#065f46,#10b981)', accent: '#d1fae5' },
        { label: 'Total Rejected', value: totalRejected.toLocaleString(), icon: '❌', gradient: totalRejected > 0 ? 'linear-gradient(135deg,#991b1b,#ef4444)' : 'linear-gradient(135deg,#065f46,#10b981)', accent: totalRejected > 0 ? '#fee2e2' : '#d1fae5' },
        { label: 'Rejection %', value: `${rejPct}%`, icon: '📉', gradient: parseFloat(rejPct) > 5 ? 'linear-gradient(135deg,#92400e,#f59e0b)' : 'linear-gradient(135deg,#065f46,#10b981)', accent: parseFloat(rejPct) > 5 ? '#fef3c7' : '#d1fae5' },
    ];
    /* ── Report-style table headers: no colour, white bg, dark text ── */
    const thC = {
        background: '#f9fafb', color: '#111827', fontWeight: 700,
        fontSize: '11px', padding: '7px 10px', textAlign: 'center',
        border: '1px solid #000', textTransform: 'uppercase',
        letterSpacing: '0.04em', whiteSpace: 'nowrap',
    };
    const TH = {
        base: { ...thC },
        accepted: { ...thC, color: '#065f46', background: '#f0fdf4' },
        rejected: { ...thC, color: '#991b1b', background: '#fff5f5' },
        proc: { ...thC, background: '#f3f4f6' },
        procSub: { ...thC, background: '#fff', fontWeight: 600, fontSize: '10px', padding: '5px 8px', textTransform: 'none', letterSpacing: '0.02em' },
        rej: { ...thC, background: '#f3f4f6' },
        rejSub: { ...thC, background: '#fff', fontWeight: 600, fontSize: '10px', padding: '5px 8px', textTransform: 'none', letterSpacing: '0.02em' },
        tempering: { ...thC, background: '#f5f3ff', color: '#5b21b6' },
        leaf: { ...thC, background: '#fff', fontWeight: 500, fontSize: '10px', padding: '5px 8px', textTransform: 'none', letterSpacing: '0.01em', color: '#374151' },
    };

    const getTh = (baseStyle) => ({
        ...baseStyle,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 0.15s ease'
    });


    return (
        <div style={{ animation: 'pds-fade-up .35s ease' }}>

            {/* ═══════════════════════════════════════════════════
          HERO BANNER
      ═══════════════════════════════════════════════════ */}
            <div style={{
                background: 'linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)',
                borderRadius: '14px',
                padding: '0',
                marginBottom: '20px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(20,83,45,0.30)',
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -60, left: 180, width: 220, height: 220, borderRadius: '50%', background: 'rgba(99,179,237,0.07)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 10, left: 260, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        {/* Icon box */}
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26, flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        }}>📊</div>
                        <div>
                            <div style={{ color: 'rgba(147,210,255,0.85)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                                Railway Board &nbsp;·&nbsp; Process Inspection
                            </div>
                            <div style={{ color: '#fff', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                                Process Defect Summary
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: 4 }}>
                                Shift-wise defect breakdown by call number
                            </div>
                        </div>
                    </div>

                    {/* Active call badge */}
                    {submittedCallNo && (
                        <div style={{
                            padding: '10px 20px',
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 30,
                            display: 'flex', alignItems: 'center', gap: 8,
                            animation: 'pds-fade-up .3s ease',
                        }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pds-pulse-dot 2s infinite' }} />
                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{submittedCallNo}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
          SEARCH CARD
      ═══════════════════════════════════════════════════ */}
            <div style={{
                background: '#fff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: 20,
                overflow: 'visible', // Allow dropdown overflow
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                transition: 'all 0.4s ease',
            }}>
                {/* Card top stripe */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, #064e3b, #10b981, #064e3b)' }} />

                <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>

                        {/* Compact Custom Dropdown */}
                        <div
                            style={{ position: 'relative', flex: '1 1 280px', maxWidth: 450 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                onClick={() => !fetchingIcNumbers && setDropdownOpen(!dropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: dropdownOpen ? '#fff' : '#f8fafc',
                                    border: dropdownOpen ? '2px solid #059669' : '2px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '0 14px',
                                    height: '46px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: dropdownOpen ? '0 8px 20px -6px rgba(5, 150, 105, 0.15)' : 'none',
                                    cursor: fetchingIcNumbers ? 'wait' : 'pointer',
                                    userSelect: 'none',
                                }}
                            >
                                <div style={{
                                    width: 30, height: 30, borderRadius: '8px',
                                    background: dropdownOpen ? '#ecfdf5' : '#f1f5f9',
                                    color: dropdownOpen ? '#059669' : '#64748b',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginRight: 10, transition: 'all 0.3s ease', flexShrink: 0
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </div>

                                <div style={{
                                    flex: 1,
                                    fontSize: '14px',
                                    color: callNoInput ? '#0f172a' : '#94a3b8',
                                    fontWeight: callNoInput ? 700 : 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {fetchingIcNumbers ? 'Loading call records...' : (callNoInput || 'Select Call Number')}
                                </div>

                                <div style={{
                                    color: dropdownOpen ? '#059669' : '#94a3b8',
                                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    marginLeft: 8,
                                    display: 'flex',
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: 0,
                                        right: 0,
                                        background: '#fff',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 12px 30px -8px rgba(0,0,0,0.15)',
                                        zIndex: 1000,
                                        maxHeight: '260px',
                                        overflowY: 'auto',
                                        padding: '6px',
                                        animation: 'pds-scale-in 0.2s ease-out forwards',
                                    }}>
                                    <div style={{ padding: '4px 6px', marginBottom: '4px' }}>
                                        <input
                                            type="text"
                                            placeholder="Search Call No..."
                                            value={searchIc}
                                            onChange={(e) => setSearchIc(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '13px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    {icNumbers.filter(ic => ic.toLowerCase().includes(searchIc.toLowerCase())).length === 0 ? (
                                        <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                            No call numbers found
                                        </div>
                                    ) : (
                                        icNumbers.filter(ic => ic.toLowerCase().includes(searchIc.toLowerCase())).map(ic => (
                                            <div
                                                key={ic}
                                                className="pds-custom-select-option"
                                                onClick={() => handleSelectOption(ic)}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: callNoInput === ic ? '#059669' : '#334155',
                                                    background: callNoInput === ic ? '#f0fdf4' : 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <span>{ic}</span>

                                                {callNoInput === ic && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Loading / Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {loading && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '6px 12px', background: '#ecfdf5', borderRadius: '30px',
                                    border: '1px solid #d1fae5', animation: 'pds-fade-in .3s ease'
                                }}>
                                    <span style={{
                                        display: 'inline-block', width: 12, height: 12,
                                        border: '2px solid #059669', borderTopColor: 'transparent',
                                        borderRadius: '50%', animation: 'pds-spin 0.6s linear infinite'
                                    }} />
                                    <span style={{ color: '#065f46', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em' }}>
                                        FETCHING
                                    </span>
                                </div>
                            )}

                            {!loading && submittedCallNo && (
                                <div style={{
                                    padding: '6px 12px', background: '#f8fafc', borderRadius: '30px',
                                    border: '1px solid #e2e8f0', color: '#059669', fontSize: '11px',
                                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                    LOADED
                                </div>
                            )}

                            {(submittedCallNo || error) && (
                                <button
                                    onClick={handleClear}
                                    style={{
                                        border: 'none', background: 'transparent', color: '#94a3b8',
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            marginTop: 12, padding: '8px 16px', background: '#fff1f2', border: '1px solid #fecdd3',
                            borderRadius: '10px', color: '#9f1239', fontSize: '12px', display: 'flex',
                            alignItems: 'center', gap: 10, animation: 'pds-fade-up .3s ease'
                        }}>
                            <span style={{ fontWeight: 800 }}>!</span> {error}
                        </div>
                    )}
                </div>
            </div>


            {/* ═══════════════════════════════════════════════════
          KPI TILES — temporarily hidden, code preserved
          {!loading && submittedCallNo && data.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 20, animation: 'pds-fade-up .35s ease' }}>
                  {kpis.map((k, i) => (
                      <div key={k.label} className="pds-tile" style={{
                          borderRadius: 12, overflow: 'hidden',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
                          cursor: 'default',
                          animation: `pds-fade-up .35s ease ${i * 0.06}s both`,
                      }}>
                          <div style={{ background: k.gradient, padding: '16px 18px 12px' }}>
                              <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
                              <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{k.value}</div>
                          </div>
                          <div style={{ background: '#fff', padding: '8px 18px 12px', borderTop: 'none' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      ═══════════════════════════════════════════════════ */}

            {/* ═══════════════════════════════════════════════════
          TABLE CARD
      ═══════════════════════════════════════════════════ */}
            <div style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                animation: 'pds-fade-up .4s ease .1s both',
            }}>
                {/* Toolbar */}
                <div style={{
                    padding: '13px 20px',
                    borderBottom: '1px solid #000',
                    background: 'linear-gradient(to right, #f8fafc, #fff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#0369a1,#7c3aed)', boxShadow: '0 0 6px rgba(3,105,161,.4)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Shift-wise Defect Breakdown
                        </span>
                    </div>
                    {sortedData.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: '3px 12px', background: '#eff6ff', borderRadius: 20, fontSize: '11px', fontWeight: 700, color: '#1d4ed8' }}>
                                {sortedData.length} shift{sortedData.length !== 1 ? 's' : ''}
                            </div>
                            <button
                                onClick={downloadExcel}
                                style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                                onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                </svg>
                                Export Excel
                            </button>
                        </div>
                    )}
                </div>

                {/* Spinner */}
                {loading && (
                    <div style={{ padding: '72px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0369a1', animation: 'pds-spin 0.8s linear infinite', marginBottom: 16 }} />
                        <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Fetching defect data…</div>
                    </div>
                )}

                {!loading && (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table complex-table" style={{ minWidth: 1200, fontSize: '12px', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '-1px' }}>
                            <thead>
                                {/* ── Row 1: top-level groups ── */}
                                <tr>
                                    <th rowSpan={3} style={getTh(TH.base)} onClick={() => handleSort('date')}>Date {renderSortIcon('date')}</th>
                                    <th rowSpan={3} style={getTh(TH.base)} onClick={() => handleSort('shift')}>Shift {renderSortIcon('shift')}</th>
                                    <th rowSpan={3} style={getTh(TH.base)} onClick={() => handleSort('line')}>Line {renderSortIcon('line')}</th>
                                    <th rowSpan={3} style={getTh(TH.base)} onClick={() => handleSort('engineer')}>Engineer {renderSortIcon('engineer')}</th>
                                    <th rowSpan={3} style={TH.base}>Sl.</th>
                                    <th rowSpan={3} style={{ ...getTh(TH.base), whiteSpace: 'nowrap' }} onClick={() => handleSort('poSrNo')}>PO_Sr. No. {renderSortIcon('poSrNo')}</th>
                                    <th rowSpan={3} style={getTh(TH.base)} onClick={() => handleSort('lotNo')}>Lot No. {renderSortIcon('lotNo')}</th>
                                    <th rowSpan={3} style={getTh(TH.accepted)} onClick={() => handleSort('acceptedQty')}>Accepted Qty {renderSortIcon('acceptedQty')}</th>
                                    <th rowSpan={3} style={getTh(TH.rejected)} onClick={() => handleSort('rejectedQty')}>Rejected Qty {renderSortIcon('rejectedQty')}</th>
                                    {/* Process Production */}
                                    <th colSpan={2} style={TH.proc}>Shearing</th>
                                    <th colSpan={2} style={TH.proc}>Turning</th>
                                    <th colSpan={2} style={TH.proc}>MPI</th>
                                    <th colSpan={2} style={TH.proc}>Forging</th>
                                    <th colSpan={2} style={TH.proc}>Quenching</th>
                                    <th colSpan={2} style={TH.proc}>Tempering</th>
                                    {/* Rejection Classification */}
                                    <th colSpan={26} style={TH.rej}>Rejection Classification</th>
                                    <th rowSpan={3} style={{ ...TH.base, minWidth: 120, textAlign: 'center' }}>Action</th>
                                </tr>
                                {/* ── Row 2: sub-group labels ── */}
                                <tr>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('shearingProd')}>Prod {renderSortIcon('shearingProd')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('shearingRej')}>Rej {renderSortIcon('shearingRej')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('turningProd')}>Prod {renderSortIcon('turningProd')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('turningRej')}>Rej {renderSortIcon('turningRej')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('mpiProd')}>Prod {renderSortIcon('mpiProd')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('mpiRej')}>Rej {renderSortIcon('mpiRej')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('forgingProd')}>Prod {renderSortIcon('forgingProd')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('forgingRej')}>Rej {renderSortIcon('forgingRej')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('quenchingProd')}>Prod {renderSortIcon('quenchingProd')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('quenchingRej')}>Rej {renderSortIcon('quenchingRej')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('temperingProd')}>Prod {renderSortIcon('temperingProd')}</th>
                                    <th rowSpan={2} style={getTh(TH.procSub)} onClick={() => handleSort('temperingRej')}>Rej {renderSortIcon('temperingRej')}</th>
                                    <th colSpan={4} style={TH.rejSub}>Shearing Defects</th>
                                    <th colSpan={3} style={TH.rejSub}>Turning Defects</th>
                                    <th style={TH.rejSub}>MPI</th>
                                    <th colSpan={4} style={TH.rejSub}>Forging Defects</th>
                                    <th style={TH.rejSub}>Quenching</th>
                                    <th colSpan={2} style={TH.tempering}>Tempering Defects</th>
                                    <th colSpan={3} style={TH.rejSub}>Dimensional</th>
                                    <th colSpan={3} style={TH.rejSub}>Visual</th>
                                    <th colSpan={3} style={TH.rejSub}>Testing</th>
                                    <th colSpan={2} style={TH.rejSub}>Finishing</th>
                                </tr>
                                {/* ── Row 3: leaf column names ── */}
                                <tr>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('shearingCutLen')}>Cut Len {renderSortIcon('shearingCutLen')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('shearingOvality')}>Ovality {renderSortIcon('shearingOvality')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('shearingSharpEdges')}>Sharp Edges {renderSortIcon('shearingSharpEdges')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('shearingCracks')}>Cracks {renderSortIcon('shearingCracks')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('turningParaLen')}>Para Len {renderSortIcon('turningParaLen')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('turningFullTurn')}>Full Turn {renderSortIcon('turningFullTurn')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('turningTurnDia')}>Turn Dia {renderSortIcon('turningTurnDia')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('mpiMpiRej')}>MPI Rej {renderSortIcon('mpiMpiRej')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('forgingForgeTemp')}>Forge Temp {renderSortIcon('forgingForgeTemp')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('forgingStabilise')}>Stabilise {renderSortIcon('forgingStabilise')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('forgingImproper')}>Improper {renderSortIcon('forgingImproper')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('forgingDefect')}>Defect {renderSortIcon('forgingDefect')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('quenchingHardness')}>Hardness {renderSortIcon('quenchingHardness')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('temperingTemp')}>Temp. {renderSortIcon('temperingTemp')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('temperingDur')}>Dur. {renderSortIcon('temperingDur')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('boxGauge')}>Box Gauge {renderSortIcon('boxGauge')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('bearingArea')}>Bearing Area {renderSortIcon('bearingArea')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('fallingGauge')}>Falling {renderSortIcon('fallingGauge')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('surface')}>Surface {renderSortIcon('surface')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('embossing')}>Embossing {renderSortIcon('embossing')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('marking')}>Marking {renderSortIcon('marking')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('tempHard')}>Temp Hard {renderSortIcon('tempHard')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('toeLoad')}>Toe Load {renderSortIcon('toeLoad')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('weight')}>Weight {renderSortIcon('weight')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('paintId')}>Paint ID {renderSortIcon('paintId')}</th>
                                    <th style={getTh(TH.leaf)} onClick={() => handleSort('coating')}>Coating {renderSortIcon('coating')}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sortedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={46} style={{ padding: '72px 20px', textAlign: 'center', background: '#fafbfc' }}>
                                            <div style={{
                                                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                                                padding: '32px 48px',
                                                background: '#fff',
                                                borderRadius: 16,
                                                border: '1px dashed #cbd5e1',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                            }}>
                                                <div style={{ fontSize: 48, lineHeight: 1 }}>{submittedCallNo ? '📭' : '🔎'}</div>
                                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                                                    {submittedCallNo ? 'No data found' : 'Ready to search'}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8', maxWidth: 260, textAlign: 'center', lineHeight: 1.5 }}>
                                                    {submittedCallNo
                                                        ? `No defect records found for call ${submittedCallNo}. Please verify the call number.`
                                                        : 'Select a Process call number from the dropdown above to load shift-wise defect data.'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((shift, idx) => {
                                        const even = idx % 2 === 0;
                                        const rejQty = shift.basicDetails?.totalRejectionQty ?? 0;
                                        const globalSl = startIndex + idx + 1;
                                        const isOwnShift = isUserShift(shift);
                                        const isRecent = isCreatedToday(shift);
                                        const canModify = isOwnShift && isRecent;

                                        const editTitle = !isOwnShift
                                            ? "Editing is disabled for another user's shift. You can only edit your own shifts."
                                            : (!isRecent
                                                ? "Editing is disabled for records created before yesterday"
                                                : "Edit Shift Defect Breakdown");

                                        const deleteTitle = !isOwnShift
                                            ? "Deletion is disabled for another user's shift. You can only delete your own shifts."
                                            : (!isRecent
                                                ? "Deletion is disabled for records created before yesterday"
                                                : "Delete Shift Record");
                                        return (
                                            <tr key={idx} className={`pds-tr ${even ? 'row-odd' : 'row-even'}`}>
                                                <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{shift.basicDetails?.date ? formatDate(shift.basicDetails.date) : '—'}</td>
                                                <td>
                                                    <span style={{ display: 'inline-block', padding: '2px 10px', background: '#1e293b', color: '#fff', borderRadius: 12, fontSize: '11px', fontWeight: 700 }}>
                                                        {shift.basicDetails?.shift || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600, color: '#0f172a' }}>{shift.basicDetails?.lineNo || '—'}</td>
                                                <td style={{ fontWeight: 600, color: '#0369a1', whiteSpace: 'nowrap' }}>{shift.basicDetails?.engineer || '—'}</td>
                                                <td style={{ color: '#94a3b8', fontSize: '11px' }}>{globalSl}</td>
                                                <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{shift.basicDetails?.poSrNo || '—'}</td>
                                                <td>{shift.basicDetails?.lotNumber || '—'}</td>
                                                <td>
                                                    <span style={{ color: '#15803d', fontWeight: 700 }}>{shift.basicDetails?.totalAcceptedQty ?? 0}</span>
                                                </td>
                                                <td>
                                                    {rejQty > 0
                                                        ? <span style={{ display: 'inline-block', padding: '2px 8px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontWeight: 700, fontSize: '12px' }}>{rejQty}</span>
                                                        : <span style={{ color: '#94a3b8' }}>0</span>
                                                    }
                                                </td>
                                                <td>{shift.processQty?.shearingProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.shearingRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.turningProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.turningRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.mpiProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.mpiRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.forgingProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.forgingRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.quenchingProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.quenchingRejectionQty ?? 0}</td>
                                                <td>{shift.processQty?.temperingProductionQty ?? 0}</td>
                                                <td>{shift.processQty?.temperingRejectionQty ?? 0}</td>
                                                <td>{shift.shearingDefects?.lengthOfCutBar ?? 0}</td>
                                                <td>{shift.shearingDefects?.ovalityImproperDiaAtEnd ?? 0}</td>
                                                <td>{shift.shearingDefects?.sharpEdges ?? 0}</td>
                                                <td>{shift.shearingDefects?.crackedEdges ?? 0}</td>
                                                <td>{shift.turningDefects?.parallelLength ?? 0}</td>
                                                <td>{shift.turningDefects?.fullTurningLength ?? 0}</td>
                                                <td>{shift.turningDefects?.turningDia ?? 0}</td>
                                                <td>{shift.processQty?.mpiRejectionQty ?? 0}</td>
                                                <td>{shift.forgingDefects?.forgingTemperature ?? 0}</td>
                                                <td>{shift.forgingDefects?.forgingStabilisationRejection ?? 0}</td>
                                                <td>{shift.forgingDefects?.improperForging ?? 0}</td>
                                                <td>{shift.forgingDefects?.forgingMarksNotches ?? 0}</td>
                                                <td>{shift.quenchingDefects?.quenchingHardness ?? 0}</td>
                                                <td>{shift.temperingDefects?.temperingTemp ?? 0}</td>
                                                <td>{shift.temperingDefects?.temperingDuration ?? 0}</td>

                                                <td>{shift.dimensionalDefects?.boxGauge ?? 0}</td>
                                                <td>{shift.dimensionalDefects?.flatBearingArea ?? 0}</td>
                                                <td>{shift.dimensionalDefects?.fallingGauge ?? 0}</td>
                                                <td>{shift.visualDefects?.surfaceDefect ?? 0}</td>
                                                <td>{shift.visualDefects?.embossingDefect ?? 0}</td>
                                                <td>{shift.visualDefects?.marking ?? 0}</td>
                                                <td>{shift.testingDefects?.temperingHardness ?? 0}</td>
                                                <td>{shift.testingDefects?.toeLoad ?? 0}</td>
                                                <td>{shift.testingDefects?.weight ?? 0}</td>
                                                <td>{shift.finishingDefects?.paintIdentification ?? 0}</td>
                                                <td>{shift.finishingDefects?.ercCoating ?? 0}</td>
                                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => canModify && handleOpenEditModal(shift)}
                                                            disabled={!canModify}
                                                            title={editTitle}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 4,
                                                                padding: '4px 8px',
                                                                borderRadius: 6,
                                                                border: canModify ? '1px solid #0284c7' : '1px solid #cbd5e1',
                                                                background: canModify ? '#f0f9ff' : '#f1f5f9',
                                                                color: canModify ? '#0284c7' : '#94a3b8',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                cursor: canModify ? 'pointer' : 'not-allowed',
                                                                opacity: canModify ? 1 : 0.55,
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                            onMouseEnter={e => {
                                                                if (canModify) {
                                                                    e.currentTarget.style.background = '#0284c7';
                                                                    e.currentTarget.style.color = '#fff';
                                                                }
                                                            }}
                                                            onMouseLeave={e => {
                                                                if (canModify) {
                                                                    e.currentTarget.style.background = '#f0f9ff';
                                                                    e.currentTarget.style.color = '#0284c7';
                                                                }
                                                            }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M12 20h9"/>
                                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                                            </svg>
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => canModify && handleOpenDeleteModal(shift)}
                                                            disabled={!canModify}
                                                            title={deleteTitle}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 4,
                                                                padding: '4px 8px',
                                                                borderRadius: 6,
                                                                border: canModify ? '1px solid #f87171' : '1px solid #cbd5e1',
                                                                background: canModify ? '#fef2f2' : '#f1f5f9',
                                                                color: canModify ? '#dc2626' : '#94a3b8',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                cursor: canModify ? 'pointer' : 'not-allowed',
                                                                opacity: canModify ? 1 : 0.55,
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                            onMouseEnter={e => {
                                                                if (canModify) {
                                                                    e.currentTarget.style.background = '#dc2626';
                                                                    e.currentTarget.style.color = '#fff';
                                                                }
                                                            }}
                                                            onMouseLeave={e => {
                                                                if (canModify) {
                                                                    e.currentTarget.style.background = '#fef2f2';
                                                                    e.currentTarget.style.color = '#dc2626';
                                                                }
                                                            }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <polyline points="3 6 5 6 21 6"/>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination Footer ── */}
                {!loading && totalItems > 0 && (
                    <div style={{
                        padding: '12px 20px',
                        borderTop: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        {/* Left: summary & rows per page */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                Showing <strong style={{ color: '#0f172a' }}>{totalItems === 0 ? 0 : startIndex + 1}</strong> to <strong style={{ color: '#0f172a' }}>{endIndex}</strong> of <strong style={{ color: '#0f172a' }}>{totalItems}</strong> entries
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                        setPageSize(val);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        background: '#fff',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value="all">All</option>
                                </select>
                            </div>
                        </div>

                        {/* Right: navigation buttons */}
                        {pageSize !== 'all' && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={safeCurrentPage === 1}
                                    title="First Page"
                                    style={{
                                        padding: '5px 9px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: safeCurrentPage === 1 ? '#f1f5f9' : '#fff',
                                        color: safeCurrentPage === 1 ? '#94a3b8' : '#334155',
                                        cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                    }}
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={safeCurrentPage === 1}
                                    title="Previous Page"
                                    style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: safeCurrentPage === 1 ? '#f1f5f9' : '#fff',
                                        color: safeCurrentPage === 1 ? '#94a3b8' : '#334155',
                                        cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                    }}
                                >
                                    ‹
                                </button>

                                {getPageNumbers().map((pg, i) => {
                                    if (pg === '...') {
                                        return (
                                            <span key={`ellipsis-${i}`} style={{ padding: '0 6px', color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>
                                                …
                                            </span>
                                        );
                                    }
                                    const isActive = pg === safeCurrentPage;
                                    return (
                                        <button
                                            key={pg}
                                            onClick={() => setCurrentPage(pg)}
                                            style={{
                                                minWidth: '32px',
                                                height: '30px',
                                                padding: '0 6px',
                                                borderRadius: '6px',
                                                border: isActive ? '1px solid #0284c7' : '1px solid #e2e8f0',
                                                background: isActive ? '#0284c7' : '#fff',
                                                color: isActive ? '#fff' : '#334155',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: isActive ? 700 : 500,
                                                boxShadow: isActive ? '0 1px 3px rgba(2,132,199,0.3)' : 'none'
                                            }}
                                        >
                                            {pg}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={safeCurrentPage === totalPages}
                                    title="Next Page"
                                    style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: safeCurrentPage === totalPages ? '#f1f5f9' : '#fff',
                                        color: safeCurrentPage === totalPages ? '#94a3b8' : '#334155',
                                        cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                    }}
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={safeCurrentPage === totalPages}
                                    title="Last Page"
                                    style={{
                                        padding: '5px 9px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: safeCurrentPage === totalPages ? '#f1f5f9' : '#fff',
                                        color: safeCurrentPage === totalPages ? '#94a3b8' : '#334155',
                                        cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                    }}
                                >
                                    »
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════
                EDIT DEFECT BREAKDOWN MODAL
                Only displayed when editModalOpen === true
            ═══════════════════════════════════════════════════ */}
            {editModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    animation: 'pds-fade-in 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '1280px',
                        maxHeight: '94vh',
                        height: '92vh',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #cbd5e1',
                        overflow: 'hidden',
                        animation: 'pds-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* Modal Header (Compact) */}
                        <div style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #052e16 0%, #15803d 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 20h9"/>
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                                        Edit Shift Defect Breakdown — All 8 Shift Hours
                                    </h3>
                                    <div style={{ fontSize: '11px', opacity: 0.88, marginTop: 1, display: 'flex', gap: 10 }}>
                                        <span>Call: <strong>{hourlyDetails?.callNo || submittedCallNo || '—'}</strong></span>
                                        <span>•</span>
                                        <span>Lot: <strong>{hourlyDetails?.lotNumber || '—'}</strong></span>
                                        <span>•</span>
                                        <span>Shift ID: <strong>#{hourlyDetails?.finalResultId || '—'}</strong></span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    borderRadius: '6px',
                                    width: 28,
                                    height: 28,
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    lineHeight: 1
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div
                            ref={modalBodyRef}
                            style={{
                                padding: '8px 14px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                flex: '1 1 auto',
                                minHeight: 0,
                                position: 'relative',
                                background: '#f8fafc',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#059669 #f1f5f9'
                            }}
                        >
                            {/* Alert Messages */}
                            {saveError && (
                                <div style={{
                                    padding: '6px 12px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecdd3',
                                    borderRadius: '6px',
                                    color: '#991b1b',
                                    fontSize: '11px',
                                    fontWeight: 600
                                }}>
                                    ⚠️ {saveError}
                                </div>
                            )}
                            {saveSuccess && (
                                <div style={{
                                    padding: '6px 12px',
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '6px',
                                    color: '#166534',
                                    fontSize: '11px',
                                    fontWeight: 600
                                }}>
                                    ✓ {saveSuccess}
                                </div>
                            )}

                            {hourlyLoading && (
                                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        border: '3px solid #e2e8f0',
                                        borderTopColor: '#059669',
                                        animation: 'pds-spin 0.8s linear infinite',
                                        marginBottom: 8
                                    }} />
                                    <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Loading 8-hour shift defect records…</div>
                                </div>
                            )}

                            {!hourlyLoading && hourlyDetails && (
                                <>
                                    {/* ── Compact Shift Metadata & Production Summary Bar ── */}
                                    <div style={{
                                        background: '#ffffff',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        border: '1px solid #cbd5e1',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 5,
                                        flexShrink: 0
                                    }}>
                                        {/* Row 1: Shift Inputs */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: 12,
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>Line:</span>
                                                <select
                                                    value={hourlyDetails.lineNo || 'Line-1'}
                                                    onChange={e => setHourlyDetails(p => ({ ...p, lineNo: e.target.value }))}
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#0f172a',
                                                        background: '#f8fafc'
                                                    }}
                                                >
                                                    <option value="Line-1">Line-1</option>
                                                    <option value="Line-2">Line-2</option>
                                                    <option value="Line-3">Line-3</option>
                                                    <option value="Line-4">Line-4</option>
                                                    <option value="Line-5">Line-5</option>
                                                </select>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>Shift:</span>
                                                <select
                                                    value={hourlyDetails.shift || 'A'}
                                                    onChange={e => setHourlyDetails(p => ({ ...p, shift: e.target.value }))}
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#0f172a',
                                                        background: '#f8fafc'
                                                    }}
                                                >
                                                    <option value="A">Shift A</option>
                                                    <option value="B">Shift B</option>
                                                    <option value="C">Shift C</option>
                                                    <option value="G">Gen Shift</option>
                                                </select>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>Date:</span>
                                                <input
                                                    type="date"
                                                    value={hourlyDetails.dateOfInspection ? hourlyDetails.dateOfInspection.split('T')[0] : ''}
                                                    onChange={e => setHourlyDetails(p => ({ ...p, dateOfInspection: e.target.value }))}
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#0f172a',
                                                        background: '#f8fafc'
                                                    }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>Engineer:</span>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={hourlyDetails.engineer || hourlyDetails.createdBy || '—'}
                                                    title="Engineer name is read-only"
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #e2e8f0',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#475569',
                                                        background: '#f1f5f9',
                                                        cursor: 'not-allowed'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Shift Totals Inline */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: 8,
                                            paddingTop: 4,
                                            borderTop: '1px dashed #e2e8f0',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0f9ff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>Shift Mfg:</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={hourlyDetails.totalManufactured ?? 0}
                                                        onWheel={e => e.currentTarget.blur()}
                                                        onChange={e => {
                                                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                            const curRej = sectionTotals.totalShiftRej || 0;
                                                            setHourlyDetails(p => ({
                                                                ...p,
                                                                totalManufactured: val,
                                                                shearingManufactured: val,
                                                                totalAccepted: Math.max(0, val - curRej)
                                                            }));
                                                        }}
                                                        style={{
                                                            width: '56px',
                                                            padding: '1px 3px',
                                                            borderRadius: '3px',
                                                            border: '1px solid #7dd3fc',
                                                            fontSize: '11px',
                                                            fontWeight: 800,
                                                            color: '#0284c7',
                                                            textAlign: 'center'
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const autoMfg = (Number(hourlyDetails.totalAccepted || 0) + sectionTotals.totalShiftRej);
                                                            setHourlyDetails(p => ({
                                                                ...p,
                                                                totalManufactured: autoMfg,
                                                                shearingManufactured: autoMfg
                                                            }));
                                                        }}
                                                        title="Auto-sum"
                                                        style={{
                                                            padding: '1px 4px',
                                                            background: '#e0f2fe',
                                                            border: '1px solid #7dd3fc',
                                                            borderRadius: '3px',
                                                            fontSize: '8px',
                                                            fontWeight: 800,
                                                            color: '#0369a1',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ⚡
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', padding: '3px 8px', borderRadius: '4px', border: '1px solid #fecdd3' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Shift Rej:</span>
                                                <strong style={{ fontSize: '12px', fontWeight: 900, color: '#dc2626' }}>
                                                    {sectionTotals.totalShiftRej} pcs
                                                </strong>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Accepted:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={hourlyDetails.totalAccepted ?? 0}
                                                    onWheel={e => e.currentTarget.blur()}
                                                    onChange={e => handleAcceptedQtyChange(e.target.value)}
                                                    style={{
                                                        width: '56px',
                                                        padding: '1px 3px',
                                                        borderRadius: '3px',
                                                        border: '1px solid #86efac',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        color: '#15803d',
                                                        textAlign: 'center'
                                                    }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Yield:</span>
                                                <strong style={{ fontSize: '11px', fontWeight: 900, color: '#334155' }}>
                                                    {(() => {
                                                        const mfg = Number(hourlyDetails.totalManufactured) || (Number(hourlyDetails.totalAccepted || 0) + sectionTotals.totalShiftRej);
                                                        const acc = Number(hourlyDetails.totalAccepted || 0);
                                                        return mfg > 0 ? ((acc / mfg) * 100).toFixed(1) : '0.0';
                                                    })()}%
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Section Selector Deck: 6 Manufacturing Stages (Compact) ── */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(6, 1fr)',
                                        gap: 6,
                                        flexShrink: 0
                                    }}>
                                        {PRODUCTION_STAGES.map(stage => {
                                            const rejCount = sectionTotals[stage.rejKey] ?? 0;
                                            const mfgVal = hourlyDetails[stage.prodField] ?? 0;
                                            const isCurrentActive = stage.key === 'tempering'
                                                ? ['temperingBase', 'finalCheck', 'testingFinishing'].includes(activeSectionTab)
                                                : activeSectionTab === stage.key;

                                            return (
                                                <div
                                                    key={stage.key}
                                                    onClick={() => handleSelectStageCard(stage)}
                                                    style={{
                                                        borderRadius: '6px',
                                                        border: isCurrentActive ? '2px solid #059669' : '1px solid #cbd5e1',
                                                        background: isCurrentActive ? '#ecfdf5' : '#ffffff',
                                                        padding: '4px 6px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                        boxShadow: isCurrentActive ? '0 1px 4px rgba(5, 150, 105, 0.15)' : 'none'
                                                    }}
                                                >
                                                    {/* Stage Header */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
                                                            <span style={{ fontSize: '11px' }}>{stage.icon}</span>
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: isCurrentActive ? '#065f46' : '#1e293b', whiteSpace: 'nowrap' }}>
                                                                {stage.label}
                                                            </span>
                                                        </div>
                                                        <span style={{
                                                            fontSize: '8px',
                                                            fontWeight: 800,
                                                            padding: '0px 4px',
                                                            borderRadius: '4px',
                                                            background: rejCount > 0 ? '#fee2e2' : '#f1f5f9',
                                                            color: rejCount > 0 ? '#dc2626' : '#64748b'
                                                        }}>
                                                            {rejCount}
                                                        </span>
                                                    </div>

                                                    {/* Compact inputs */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                                                        <div>
                                                            <span style={{ display: 'block', fontSize: '7px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Prod</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={mfgVal}
                                                                onWheel={e => e.currentTarget.blur()}
                                                                onClick={e => e.stopPropagation()}
                                                                onChange={e => {
                                                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                                    setHourlyDetails(p => {
                                                                        if (stage.key === 'shearing') {
                                                                            const currentRej = sectionTotals.totalShiftRej || 0;
                                                                            const newAccepted = Math.max(0, val - currentRej);
                                                                            return {
                                                                                ...p,
                                                                                [stage.prodField]: val,
                                                                                totalManufactured: val,
                                                                                totalAccepted: newAccepted
                                                                            };
                                                                        }
                                                                        return { ...p, [stage.prodField]: val };
                                                                    });
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '1px 3px',
                                                                    borderRadius: '3px',
                                                                    border: '1px solid #cbd5e1',
                                                                    fontSize: '10px',
                                                                    fontWeight: 700,
                                                                    color: '#0284c7',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <span style={{ display: 'block', fontSize: '7px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Rej</span>
                                                            <div
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '1px 3px',
                                                                    borderRadius: '3px',
                                                                    border: rejCount > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                                                                    background: rejCount > 0 ? '#fef2f2' : '#f8fafc',
                                                                    fontSize: '10px',
                                                                    fontWeight: 800,
                                                                    color: rejCount > 0 ? '#dc2626' : '#64748b',
                                                                    textAlign: 'center',
                                                                    height: '21px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    boxSizing: 'border-box',
                                                                    userSelect: 'none',
                                                                    cursor: 'default'
                                                                }}
                                                                title={`Rejections calculated from hourly defect table (${rejCount} pcs)`}
                                                            >
                                                                {rejCount}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ── Sub-navigation for Tempering Stage (Compact) ── */}
                                    {['temperingBase', 'finalCheck', 'testingFinishing'].includes(activeSectionTab) && (
                                        <div style={{
                                            background: '#f5f3ff',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            border: '1px solid #ddd6fe',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: 4,
                                            flexShrink: 0
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10px', fontWeight: 800, color: '#5b21b6' }}>
                                                <span>🔥</span> Tempering Sub-Sections (Total: {sectionTotals.temperingStage}):
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveSectionTab('temperingBase')}
                                                    style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        border: activeSectionTab === 'temperingBase' ? '1.5px solid #7c3aed' : '1px solid #c4b5fd',
                                                        background: activeSectionTab === 'temperingBase' ? '#7c3aed' : '#ffffff',
                                                        color: activeSectionTab === 'temperingBase' ? '#ffffff' : '#5b21b6',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Base ({sectionTotals.temperingBase})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveSectionTab('finalCheck')}
                                                    style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        border: activeSectionTab === 'finalCheck' ? '1.5px solid #7c3aed' : '1px solid #c4b5fd',
                                                        background: activeSectionTab === 'finalCheck' ? '#7c3aed' : '#ffffff',
                                                        color: activeSectionTab === 'finalCheck' ? '#ffffff' : '#5b21b6',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Final Check ({sectionTotals.finalCheck})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveSectionTab('testingFinishing')}
                                                    style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        border: activeSectionTab === 'testingFinishing' ? '1.5px solid #7c3aed' : '1px solid #c4b5fd',
                                                        background: activeSectionTab === 'testingFinishing' ? '#7c3aed' : '#ffffff',
                                                        color: activeSectionTab === 'testingFinishing' ? '#ffffff' : '#5b21b6',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Testing ({sectionTotals.testingFinishing})
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── 8-Hour Defect Grid (Hour 1 to Hour 8) ── */}
                                    <div
                                        ref={defectGridRef}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '8px',
                                            border: '2px solid #059669',
                                            overflow: 'hidden',
                                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.1)',
                                            scrollMarginTop: '6px'
                                        }}
                                    >
                                        {/* Card Header & Controls Bar */}
                                        <div style={{
                                            padding: '6px 12px',
                                            background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
                                            borderBottom: '1.5px solid #a7f3d0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: 6
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '15px' }}>
                                                    {PRODUCTION_STAGES.find(s => s.activeTab === activeSectionTab || (s.key === 'tempering' && ['temperingBase', 'finalCheck', 'testingFinishing'].includes(activeSectionTab)))?.icon}
                                                </span>
                                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#064e3b', textTransform: 'uppercase' }}>
                                                    {activeSectionTab === 'mpi' ? '🧲 MPI' : `${SECTION_TABS.find(t => t.id === activeSectionTab)?.label || 'Section'}`} — 8 Shift Hours
                                                </span>
                                                <span style={{
                                                    padding: '1px 6px',
                                                    borderRadius: '8px',
                                                    background: (sectionTotals[activeSectionTab] ?? 0) > 0 ? '#fee2e2' : '#f1f5f9',
                                                    color: (sectionTotals[activeSectionTab] ?? 0) > 0 ? '#dc2626' : '#64748b',
                                                    fontSize: '10px',
                                                    fontWeight: 900
                                                }}>
                                                    Rejections: {sectionTotals[activeSectionTab] ?? 0}
                                                </span>

                                                {/* Detected Defects inline tag */}
                                                {(() => {
                                                    const activeCols = SECTION_DEFECT_FIELDS[activeSectionTab] || [];
                                                    const activeRows = hourlyDetails.hourlyRows || [];
                                                    const defectFindings = [];
                                                    activeRows.forEach((r, hIdx) => {
                                                        activeCols.forEach(col => {
                                                            const cnt = Number(r[col.key]) || 0;
                                                            if (cnt > 0) {
                                                                defectFindings.push({
                                                                    hour: hIdx + 1,
                                                                    time: r.hourLabel,
                                                                    defect: col.label,
                                                                    count: cnt
                                                                });
                                                            }
                                                        });
                                                    });

                                                    if (defectFindings.length > 0) {
                                                        return (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                                                {defectFindings.map((f, i) => (
                                                                    <span
                                                                        key={i}
                                                                        onClick={() => jumpToHour(f.hour - 1)}
                                                                        title={`Click to highlight Hour ${f.hour}`}
                                                                        style={{
                                                                            background: '#fff1f2',
                                                                            padding: '1px 5px',
                                                                            borderRadius: '3px',
                                                                            border: '1px solid #fecdd3',
                                                                            fontSize: '9px',
                                                                            color: '#991b1b',
                                                                            fontWeight: 700,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        H{f.hour}: <strong>{f.count}</strong> in {f.defect} ↗
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>

                                            {/* Right Controls: Shift Indicator Badge */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    color: '#065f46',
                                                    background: '#ecfdf5',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #a7f3d0'
                                                }}>
                                                    🕒 Hours 1 to 8 (Direct View)
                                                </div>
                                            </div>
                                        </div>

                                        {/* All 8-Hour Table Container (Fully Expanded, Horizontally Scrollable) */}
                                        <div style={{ overflowX: 'auto', position: 'relative' }}>
                                            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'separate', borderSpacing: 0, fontSize: '11px' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{
                                                            position: 'sticky',
                                                            top: 0,
                                                            zIndex: 10,
                                                            background: '#f1f5f9',
                                                            borderBottom: '2px solid #94a3b8',
                                                            padding: '6px 10px',
                                                            textAlign: 'left',
                                                            fontWeight: 900,
                                                            color: '#0f172a',
                                                            width: 155,
                                                            minWidth: 155
                                                        }}>
                                                            Shift Hour & Interval
                                                        </th>
                                                        {SECTION_DEFECT_FIELDS[activeSectionTab]?.map(col => (
                                                            <th key={col.key} style={{
                                                                position: 'sticky',
                                                                top: 0,
                                                                zIndex: 10,
                                                                background: '#f1f5f9',
                                                                borderBottom: '2px solid #94a3b8',
                                                                padding: '6px 8px',
                                                                textAlign: 'center',
                                                                fontWeight: 900,
                                                                color: '#0f172a',
                                                                fontSize: '11px',
                                                                minWidth: 105
                                                            }}>
                                                                {col.label}
                                                            </th>
                                                        ))}
                                                        <th style={{
                                                            position: 'sticky',
                                                            top: 0,
                                                            zIndex: 10,
                                                            background: '#fee2e2',
                                                            borderBottom: '2px solid #f87171',
                                                            padding: '6px 10px',
                                                            textAlign: 'center',
                                                            fontWeight: 900,
                                                            color: '#991b1b',
                                                            width: 80,
                                                            minWidth: 80
                                                        }}>
                                                            Hour Total
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {hourlyDetails.hourlyRows?.map((row, hIdx) => {
                                                        const activeCols = SECTION_DEFECT_FIELDS[activeSectionTab] || [];
                                                        const rowSum = activeCols.reduce((acc, c) => acc + (Number(row[c.key]) || 0), 0);
                                                        return (
                                                            <tr
                                                                key={hIdx}
                                                                id={`hour-row-${hIdx}`}
                                                                style={{
                                                                    background: rowSum > 0 ? '#fff5f5' : (hIdx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                                                                    transition: 'background 0.2s ease, outline 0.2s ease'
                                                                }}
                                                            >
                                                                <td style={{ padding: '3px 10px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                        <span style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            width: 24,
                                                                            height: 20,
                                                                            borderRadius: '4px',
                                                                            background: rowSum > 0 ? '#fee2e2' : '#e2e8f0',
                                                                            color: rowSum > 0 ? '#dc2626' : '#475569',
                                                                            fontSize: '9px',
                                                                            fontWeight: 800
                                                                        }}>
                                                                            H{hIdx + 1}
                                                                        </span>
                                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>
                                                                            Hour {hIdx + 1}
                                                                        </span>
                                                                        <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>
                                                                            ({row.hourLabel || ''})
                                                                        </span>
                                                                        {rowSum > 0 && (
                                                                            <span style={{
                                                                                fontSize: '8px',
                                                                                fontWeight: 800,
                                                                                color: '#b91c1c',
                                                                                background: '#fee2e2',
                                                                                padding: '0px 4px',
                                                                                borderRadius: '3px'
                                                                            }}>
                                                                                ⚠️{rowSum}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                {activeCols.map(col => {
                                                                    const val = row[col.key] ?? 0;
                                                                    return (
                                                                        <td key={col.key} style={{ padding: '2px 6px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={val}
                                                                                onWheel={e => e.currentTarget.blur()}
                                                                                onChange={e => handleHourlyFieldChange(hIdx, col.key, e.target.value)}
                                                                                style={{
                                                                                    width: '60px',
                                                                                    height: '24px',
                                                                                    padding: '1px 4px',
                                                                                    borderRadius: '4px',
                                                                                    border: val > 0 ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                                                                                    background: val > 0 ? '#fef2f2' : '#ffffff',
                                                                                    color: val > 0 ? '#dc2626' : '#0f172a',
                                                                                    fontWeight: val > 0 ? 800 : 600,
                                                                                    textAlign: 'center',
                                                                                    fontSize: '11px',
                                                                                    boxSizing: 'border-box'
                                                                                }}
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td style={{
                                                                    padding: '2px 8px',
                                                                    textAlign: 'center',
                                                                    fontWeight: 900,
                                                                    color: rowSum > 0 ? '#dc2626' : '#94a3b8',
                                                                    background: rowSum > 0 ? '#fee2e2' : '#f8fafc',
                                                                    fontSize: '11px',
                                                                    borderBottom: '1px solid #e2e8f0'
                                                                }}>
                                                                    {rowSum}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td style={{
                                                            background: '#f1f5f9',
                                                            borderTop: '2px solid #94a3b8',
                                                            padding: '6px 10px',
                                                            color: '#0f172a',
                                                            fontWeight: 900,
                                                            fontSize: '11px'
                                                        }}>
                                                            Shift Total (8 Hours):
                                                        </td>
                                                        {SECTION_DEFECT_FIELDS[activeSectionTab]?.map(col => {
                                                            const colSum = (hourlyDetails.hourlyRows || []).reduce((acc, r) => acc + (Number(r[col.key]) || 0), 0);
                                                            return (
                                                                <td key={col.key} style={{
                                                                    background: '#f1f5f9',
                                                                    borderTop: '2px solid #94a3b8',
                                                                    padding: '6px 8px',
                                                                    textAlign: 'center',
                                                                    color: colSum > 0 ? '#dc2626' : '#475569',
                                                                    fontWeight: 900,
                                                                    fontSize: '11px'
                                                                }}>
                                                                    {colSum}
                                                                </td>
                                                            );
                                                        })}
                                                        <td style={{
                                                            background: '#fee2e2',
                                                            borderTop: '2px solid #f87171',
                                                            padding: '6px 10px',
                                                            textAlign: 'center',
                                                            color: '#dc2626',
                                                            fontSize: '12px',
                                                            fontWeight: 900
                                                        }}>
                                                            {SECTION_DEFECT_FIELDS[activeSectionTab]?.reduce((acc, col) => {
                                                                return acc + (hourlyDetails.hourlyRows || []).reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
                                                            }, 0)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '10px 18px',
                            background: '#ffffff',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                        }}>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Total Shift Defects: <strong style={{ color: '#dc2626', fontSize: '15px' }}>{sectionTotals.totalShiftRej}</strong> across all sections
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    disabled={saveLoading}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#f1f5f9',
                                        color: '#334155',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveDefectSummary}
                                    disabled={saveLoading || !hourlyDetails || !isCreatedToday(hourlyDetails) || !isUserShift(hourlyDetails)}
                                    title={!isUserShift(hourlyDetails) ? "You cannot edit another user's shift records." : (!isCreatedToday(hourlyDetails) ? 'Editing is disabled. Records created before yesterday cannot be edited.' : 'Save changes')}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: (!isCreatedToday(hourlyDetails) || !isUserShift(hourlyDetails) || saveLoading) ? '#94a3b8' : '#059669',
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: (!isCreatedToday(hourlyDetails) || !isUserShift(hourlyDetails) || saveLoading) ? 'not-allowed' : 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        boxShadow: (!isCreatedToday(hourlyDetails) || !isUserShift(hourlyDetails) || saveLoading) ? 'none' : '0 2px 6px rgba(5, 150, 105, 0.25)'
                                    }}
                                >
                                    {saveLoading && (
                                        <div style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: '50%',
                                            border: '2px solid #ffffff',
                                            borderTopColor: 'transparent',
                                            animation: 'pds-spin 0.8s linear infinite'
                                        }} />
                                    )}
                                    {saveLoading ? 'Saving & Syncing...' : 'Save & Sync Process IE Qty'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
                DELETE CONFIRMATION MODAL
                Only displayed when deleteModalOpen === true
            ═══════════════════════════════════════════════════ */}
            {deleteModalOpen && shiftToDelete && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    animation: 'pds-fade-in 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '520px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #fee2e2',
                        overflow: 'hidden',
                        animation: 'pds-scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            background: '#fff1f2',
                            borderBottom: '1px solid #fecdd3',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14
                        }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: '12px',
                                background: '#fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#e11d48',
                                flexShrink: 0
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#9f1239' }}>
                                    Confirm Shift Deletion
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#be123c' }}>
                                    This action cannot be undone. Please acknowledge below.
                                </p>
                            </div>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '10px',
                                padding: '14px 16px',
                                border: '1px solid #e2e8f0',
                                marginBottom: 16,
                                fontSize: '13px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '10px 16px'
                            }}>
                                <div><span style={{ color: '#64748b' }}>Call No:</span> <strong>{shiftToDelete.basicDetails?.callNo || submittedCallNo || '—'}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Shift:</span> <strong style={{ color: '#0369a1' }}>{shiftToDelete.basicDetails?.shift || '—'}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Line:</span> <strong>{shiftToDelete.basicDetails?.lineNo || '—'}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Date:</span> <strong>{shiftToDelete.basicDetails?.date ? formatDate(shiftToDelete.basicDetails.date) : '—'}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Accepted Qty:</span> <strong style={{ color: '#16a34a' }}>{shiftToDelete.basicDetails?.totalAcceptedQty ?? 0}</strong></div>
                                <div><span style={{ color: '#64748b' }}>Rejected Qty:</span> <strong style={{ color: '#dc2626' }}>{shiftToDelete.basicDetails?.totalRejectionQty ?? 0}</strong></div>
                            </div>

                            <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
                                Are you sure you want to remove this shift? This will:
                                <ul style={{ margin: '6px 0 0', paddingLeft: 20, color: '#64748b' }}>
                                    <li>Permanently remove this shift inspection record from the report</li>
                                    <li>Remove all hourly production and defect logs recorded for this shift</li>
                                    <li>Automatically adjust the total inspected and accepted quantities for this call</li>
                                </ul>
                            </div>

                            {deleteError && (
                                <div style={{
                                    padding: '10px 14px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecdd3',
                                    borderRadius: '8px',
                                    color: '#991b1b',
                                    fontSize: '13px',
                                    marginBottom: 16
                                }}>
                                    ⚠️ {deleteError}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => { setDeleteModalOpen(false); setShiftToDelete(null); }}
                                    disabled={deleteLoading}
                                    style={{
                                        padding: '9px 18px',
                                        background: '#f1f5f9',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: '#334155',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={deleteLoading}
                                    style={{
                                        padding: '9px 20px',
                                        background: '#dc2626',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: '#ffffff',
                                        cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)'
                                    }}
                                >
                                    {deleteLoading && (
                                        <div style={{
                                            width: 14,
                                            height: 14,
                                            border: '2px solid #fff',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%',
                                            animation: 'pds-spin 0.8s linear infinite'
                                        }} />
                                    )}
                                    {deleteLoading ? 'Deleting...' : 'Confirm & Delete Shift'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
