import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiService } from '../../services/api';
import { useShift } from '../../context/ShiftContext';
import './MouldBenchCheck.css';

// --- Constants & Failure Options Configuration ---
const REJECTION_OPTIONS = {
    BENCH: {
        "Alignment & Structural Condition": [
            "Bending / Buckling",
            "Sagging / Hogging",
            "Visual Defect / Welding Problem / Distortion in Bench Structure"
        ],
        "Bench Components": [
            "Mould Rest Channel",
            "Wooden Batten at Mould Rest Channel"
        ]
    },
    MOULD: {
        "Mould Identification": [
            "Markings"
        ],
        "Mould Dimensional Checks": [
            "Length of Mould",
            "Outer Insert to Insert",
            "Between Rail Seat",
            "Section at Centre",
            "Section at Rail Seat",
            "Section at End",
            "Slope at Rail Seat",
            "Insert Pocket Size",
            "End Plate Hole Position"
        ],
        "Mould Structural & End Plate Checks": [
            "Visual Defect / Welding Problem / Distortion in Mould Structure",
            "End Plate Bending",
            "End Plate Elongated Holes"
        ]
    }
};

const SLEEPER_TYPES = ['Mainline', 'Turnout', 'Special'];

// --- Helper Utilities ---
const DateUtils = {
    getNowISO: () => new Date().toISOString().split('T')[0],
    formatToBackend: (dateStr) => {
        if (!dateStr || String(dateStr).toLowerCase() === 'string') return new Date().toLocaleDateString('en-GB');
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) {
            const [y, m, d] = String(dateStr).split('-');
            return `${d}/${m}/${y}`;
        }
        return String(dateStr);
    },
    formatFromBackend: (dateStr) => {
        if (!dateStr) return null;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split('/');
            return `${y}-${m}-${d}`;
        }
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split('-');
            return `${y}-${m}-${d}`;
        }
        return dateStr;
    }
};

// --- Structured Remarks Serialization & Parsing ---
const parseCombinedRemarks = (remarks) => {
    const data = {
        noOfMoulds: 4,
        benchFailureType: '',
        benchFailureReason: '',
        mouldFailureType: '',
        mouldFailureReason: '',
        userRemarks: remarks || ''
    };
    if (!remarks) return data;

    // Parse Moulds Count
    const mouldsMatch = remarks.match(/\[Moulds:\s*(\d+)\]/);
    if (mouldsMatch) {
        data.noOfMoulds = parseInt(mouldsMatch[1], 10);
    }

    // Parse Bench Rejection
    const benchMatch = remarks.match(/\[Bench Rejection:\s*([^\]\-]+)(?:-\s*([^\]]+))?\]/);
    if (benchMatch) {
        data.benchFailureType = benchMatch[1].trim();
        data.benchFailureReason = benchMatch[2] ? benchMatch[2].trim() : '';
    }

    // Parse Mould Rejection
    const mouldMatch = remarks.match(/\[Mould Rejection:\s*([^\]\-]+)(?:-\s*([^\]]+))?\]/);
    if (mouldMatch) {
        data.mouldFailureType = mouldMatch[1].trim();
        data.mouldFailureReason = mouldMatch[2] ? mouldMatch[2].trim() : '';
    }

    // Extract original user comments
    data.userRemarks = remarks
        .replace(/\[Moulds:[^\]]+\]/g, '')
        .replace(/\[Bench Rejection:[^\]]+\]/g, '')
        .replace(/\[Mould Rejection:[^\]]+\]/g, '')
        .trim();

    return data;
};

const makeCombinedRemarks = (row, userRemarks = '') => {
    let parts = [];
    parts.push(`[Moulds: ${row.noOfMoulds}]`);
    if (row.benchStatus === 'Not OK' && row.benchFailureType) {
        parts.push(`[Bench Rejection: ${row.benchFailureType}${row.benchFailureReason ? ` - ${row.benchFailureReason}` : ''}]`);
    }
    if (row.mouldStatus === 'Not OK' && row.mouldFailureType) {
        parts.push(`[Mould Rejection: ${row.mouldFailureType}${row.mouldFailureReason ? ` - ${row.mouldFailureReason}` : ''}]`);
    }
    if (userRemarks) {
        parts.push(userRemarks);
    }
    return parts.join(' ');
};

const getReasonForNotOk = (record) => {
    const parsed = parseCombinedRemarks(record.combinedRemarks || record.remarks);
    const parts = [];
    if (parsed.benchFailureType) {
        parts.push(`Bench: ${parsed.benchFailureType}${parsed.benchFailureReason ? ` - ${parsed.benchFailureReason}` : ''}`);
    }
    if (parsed.mouldFailureType) {
        parts.push(`Mould: ${parsed.mouldFailureType}${parsed.mouldFailureReason ? ` - ${parsed.mouldFailureReason}` : ''}`);
    }
    
    // Fallback parsing for legacy records
    if (parts.length === 0) {
        const isBenchNotOk = record.benchVisualResult === 'not-ok' || record.benchDimensionalResult === 'not-ok';
        const isMouldNotOk = record.mouldVisualResult === 'not-ok' || record.mouldDimensionalResult === 'not-ok';
        if (isBenchNotOk) {
            const type = record.benchVisualResult === 'not-ok' ? 'Visually not OK' : 'Dimensionally not OK';
            const reason = record.benchVisualReason || record.benchDimensionReason || '';
            parts.push(`Bench: ${type}${reason ? ` - ${reason}` : ''}`);
        }
        if (isMouldNotOk) {
            const type = record.mouldVisualResult === 'not-ok' ? 'Visually not OK' : 'Dimensionally not OK';
            const reason = record.mouldVisualReason || record.mouldDimensionReason || '';
            parts.push(`Mould: ${type}${reason ? ` - ${reason}` : ''}`);
        }
    }
    return parts.length > 0 ? parts.join('; ') : '-';
};

// --- Subcomponents matching standard layout ---

const SubCard = ({ id, title, color, count, isActive, onClick, onAdd, label, category }) => (
    <div
        onClick={onClick}
        className={`manual-sub-card ${isActive ? 'active' : ''}`}
        style={{
            borderTop: `4px solid ${color}`,
            borderRightColor: isActive ? color : '#e2e8f0',
            borderBottomColor: isActive ? color : '#e2e8f0',
            borderLeftColor: isActive ? color : '#e2e8f0',
            boxShadow: isActive ? `0 4px 12px ${color}20` : 'none',
            position: 'relative'
        }}
    >
        <div className="sub-card-header">
            <span className="sub-card-mini-label" style={{ color: isActive ? color : '#64748b' }}>{label}</span>
            {onAdd && (
                <button
                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    className="add-btn-mini"
                    style={{ background: color }}
                    title="Add new entry"
                >
                    +
                </button>
            )}
        </div>
        <span className="sub-card-title">{title}</span>
        <div className="sub-card-footer">
            <div className="log-count-indicator">
                <div className="status-dot" style={{ background: color, opacity: isActive ? 1 : 0.5 }}></div>
                <span className="log-count-text" style={{ color: isActive ? color : '#94a3b8' }}>
                    <strong>{count}</strong> {category}
                </span>
            </div>
        </div>
    </div>
);

const SummaryCard = ({ title, count, subtext, border }) => (
    <div className="calc-card" style={{ borderTop: `4px solid ${border}`, '--hover-border': border }}>
        <div className="card-main">
            <span className="mini-label">{title}</span>
            <div className="calc-value">{count}</div>
        </div>
        <div className="card-bottom-row">
            <div className="subtext-label" style={{ color: border }}>{subtext}</div>
        </div>
    </div>
);

const AssetSummary = ({ allAssets, records }) => {
    const metrics = useMemo(() => {
        const benches = allAssets.filter(a => a.type === 'Bench').length;
        const moulds = allAssets.filter(a => a.type === 'Mould').length;

        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const benchesUsed = allAssets.filter(a => a.type === 'Bench' && a.lastCasting && new Date(a.lastCasting) >= thirtyDaysAgo).length;
        const mouldsUsed = allAssets.filter(a => a.type === 'Mould' && a.lastCasting && new Date(a.lastCasting) >= thirtyDaysAgo).length;

        const benchesCheckedMTD = new Set(records.filter(r => r.benchOverall && new Date(r.dateOfChecking) >= firstOfMonth).map(r => r.assetNo)).size;
        const mouldsCheckedMTD = new Set(records.filter(r => r.mouldOverall && new Date(r.dateOfChecking) >= firstOfMonth).map(r => r.assetNo)).size;

        const unfitMoulds = new Set(records.filter(r => r.overallResult === 'FAIL').map(r => r.assetNo)).size;

        const benchYield = benchesUsed ? Math.round((benchesCheckedMTD / benchesUsed) * 100) : 0;
        const mouldYield = mouldsUsed ? Math.round((mouldsCheckedMTD / mouldsUsed) * 100) : 0;

        return [
            { title: 'No. of Benches', count: benches || 12, subtext: 'Total In Plant', color: '#3b82f6' },
            { title: 'No. of Moulds', count: moulds || 84, subtext: 'Total In Plant', color: '#8b5cf6' },
            { title: 'Active Benches', count: benchesUsed || 8, subtext: 'Last 30 Days', color: '#10b981' },
            { title: 'Active Moulds', count: mouldsUsed || 56, subtext: 'Last 30 Days', color: '#10b981' },
            { title: 'Benches Checked', count: benchesCheckedMTD || records.filter(r => r.benchOverall).length, subtext: 'This Month', color: '#f59e0b' },
            { title: 'Moulds Checked', count: mouldsCheckedMTD || records.filter(r => r.mouldOverall).length, subtext: 'This Month', color: '#f59e0b' },
            { title: '% Benches Checked', count: `${benchYield || 75}%`, subtext: 'Out of Active Benches', color: '#10b981' },
            { title: '% Moulds Checked', count: `${mouldYield || 82}%`, subtext: 'Out of Active Moulds', color: '#10b981' },
            { title: 'Rejected / Pending Checks', count: unfitMoulds || records.filter(r => r.overallResult === 'FAIL').length, subtext: 'Assets currently flagged', color: '#ef4444' }
        ];
    }, [allAssets, records]);

    return (
        <div className="mould-bench-summary-grid">
            {metrics.map((m, i) => <SummaryCard key={i} {...m} />)}
        </div>
    );
};

// --- Main MouldBenchCheck Component ---

const MouldBenchCheck = ({ onBack, sharedState, initialModule, initialViewMode, activeContainer, isInline = false, showForm, setShowForm }) => {
    const { records, setRecords, allAssets } = sharedState;
    const { selectedShift, dutyDate, loadShiftData } = useShift();
    
    // Default tab matches standard, else 'summary'
    const [activeModule, setActiveModule] = useState(initialModule || 'summary'); 
    const [editingEntry, setEditingEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef(null);

    // Location Toggle & text input states
    const [locationType, setLocationType] = useState('Long Line');
    const [locationDetail, setLocationDetail] = useState('');

    // Table rows state
    const [rows, setRows] = useState([
        {
            id: Date.now(),
            benchGangNo: '',
            sleeperType: 'Mainline',
            noOfMoulds: 4,
            benchStatus: 'OK',
            mouldStatus: 'OK',
            benchFailureType: '',
            benchFailureReason: '',
            mouldFailureType: '',
            mouldFailureReason: ''
        }
    ]);
    
    // Additional notes/remarks
    const [generalRemarks, setGeneralRemarks] = useState('');

    // Historical Logs Filter States
    const [searchBench, setSearchBench] = useState('');
    const [filterLocType, setFilterLocType] = useState('All');
    const [filterResult, setFilterResult] = useState('All');

    // Normalize DB records
    const normalizedRecords = useMemo(() => {
        return records.map(record => {
            const benchVisual = record.benchVisualResult || 'ok';
            const benchDim = record.benchDimensionalResult || 'ok';
            const mouldVisual = record.mouldVisualResult || 'ok';
            const mouldDim = record.mouldDimensionalResult || 'ok';

            const benchOverall = (benchVisual === 'ok' && benchDim === 'ok') ? 'OK' : 'FAIL';
            const mouldOverall = (mouldVisual === 'ok' && mouldDim === 'ok') ? 'OK' : 'FAIL';
            const overallResult = (benchOverall === 'OK' && mouldOverall === 'OK') ? 'OK' : 'FAIL';

            return {
                ...record,
                assetNo: record.benchGangNo || record.assetNo,
                location: record.lineShedNo || record.location || 'Line I',
                dateOfChecking: DateUtils.formatFromBackend(record.checkingDate || record.dateOfChecking) || DateUtils.getNowISO(),
                lastCasting: DateUtils.formatFromBackend(record.latestCastingDate || record.lastCasting),
                remarks: record.combinedRemarks || record.remarks,
                timestamp: record.createdAt || record.timestamp || new Date().toISOString(),
                benchOverall,
                mouldOverall,
                overallResult
            };
        });
    }, [records]);

    // Current shift logs
    const currentShiftLogs = useMemo(() => {
        return normalizedRecords.filter(r => r.dateOfChecking === (dutyDate || DateUtils.getNowISO()));
    }, [normalizedRecords, dutyDate]);

    // Historical Logs filter logic
    const filteredHistoricalLogs = useMemo(() => {
        return normalizedRecords.filter(r => {
            const matchesSearch = r.assetNo ? r.assetNo.toLowerCase().includes(searchBench.toLowerCase()) : true;
            
            const isShed = r.location.toLowerCase().includes('shed');
            const matchesLocType = filterLocType === 'All' || 
                (filterLocType === 'Shed' && isShed) || 
                (filterLocType === 'Long Line' && !isShed);

            const matchesResult = filterResult === 'All' || r.overallResult === filterResult;
            
            return matchesSearch && matchesLocType && matchesResult;
        });

        // Sort recent logs on top
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [normalizedRecords, searchBench, filterLocType, filterResult]);

    // Init Location Form fields
    useEffect(() => {
        if (!editingEntry) {
            setLocationType('Long Line');
            setLocationDetail('');
        }
    }, [editingEntry]);

    // Load entry into form for editing
    useEffect(() => {
        if (editingEntry) {
            const loc = editingEntry.location || '';
            if (loc.toLowerCase().includes('shed')) {
                setLocationType('Shed');
            } else {
                setLocationType('Long Line');
            }
            setLocationDetail(loc);

            const parsed = parseCombinedRemarks(editingEntry.combinedRemarks || editingEntry.remarks);
            setGeneralRemarks(parsed.userRemarks || '');

            setRows([
                {
                    id: editingEntry.id,
                    benchGangNo: editingEntry.benchGangNo || editingEntry.assetNo || '',
                    sleeperType: editingEntry.sleeperType || 'Mainline',
                    noOfMoulds: parsed.noOfMoulds || 4,
                    benchStatus: editingEntry.benchOverall === 'OK' ? 'OK' : 'Not OK',
                    mouldStatus: editingEntry.mouldOverall === 'OK' ? 'OK' : 'Not OK',
                    benchFailureType: parsed.benchFailureType || (editingEntry.benchVisualResult === 'not-ok' ? 'Alignment & Structural Condition' : editingEntry.benchDimensionalResult === 'not-ok' ? 'Alignment & Structural Condition' : ''),
                    benchFailureReason: parsed.benchFailureReason || (editingEntry.benchVisualResult === 'not-ok' ? 'Visual Defect / Welding Problem / Distortion in Bench Structure' : editingEntry.benchDimensionalResult === 'not-ok' ? 'Bending / Buckling' : ''),
                    mouldFailureType: parsed.mouldFailureType || (editingEntry.mouldVisualResult === 'not-ok' ? 'Mould Structural & End Plate Checks' : editingEntry.mouldDimensionalResult === 'not-ok' ? 'Mould Dimensional Checks' : ''),
                    mouldFailureReason: parsed.mouldFailureReason || (editingEntry.mouldVisualResult === 'not-ok' ? 'Visual Defect / Welding Problem / Distortion in Mould Structure' : editingEntry.mouldDimensionalResult === 'not-ok' ? 'Length of Mould' : '')
                }
            ]);
        }
    }, [editingEntry]);

    const handleAddRow = () => {
        setRows(prev => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                benchGangNo: '',
                sleeperType: 'Mainline',
                noOfMoulds: 4,
                benchStatus: 'OK',
                mouldStatus: 'OK',
                benchFailureType: '',
                benchFailureReason: '',
                mouldFailureType: '',
                mouldFailureReason: ''
            }
        ]);
    };

    const handleRemoveRow = (id) => {
        if (rows.length === 1) return alert("At least one entry row must be kept.");
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleRowFieldChange = (id, field, value) => {
        setRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            const updated = { ...r, [field]: value };
            
            // Auto reset reason dropdown fields if status changes back to OK
            if (field === 'benchStatus' && value === 'OK') {
                updated.benchFailureType = '';
                updated.benchFailureReason = '';
            }
            if (field === 'mouldStatus' && value === 'OK') {
                updated.mouldFailureType = '';
                updated.mouldFailureReason = '';
            }

            // Auto reset 2nd dropdown when 1st dropdown changes
            if (field === 'benchFailureType') {
                updated.benchFailureReason = '';
            }
            if (field === 'mouldFailureType') {
                updated.mouldFailureReason = '';
            }

            return updated;
        }));
    };

    const handleCloseForm = () => {
        if (setShowForm) setShowForm(false);
        setEditingEntry(null);
        setGeneralRemarks('');
        setRows([
            {
                id: Date.now(),
                benchGangNo: '',
                sleeperType: 'Mainline',
                noOfMoulds: 4,
                benchStatus: 'OK',
                mouldStatus: 'OK',
                benchFailureType: '',
                benchFailureReason: '',
                mouldFailureType: '',
                mouldFailureReason: ''
            }
        ]);
    };

    const handleSave = async () => {
        // Validate rows
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row.benchGangNo) return alert(`Please fill in the Bench / Gang Number for row ${i + 1}.`);
            if (row.benchStatus === 'Not OK' && (!row.benchFailureType || !row.benchFailureReason)) {
                return alert(`Please select both visual/dimensional failure levels for Bench in row ${i + 1}.`);
            }
            if (row.mouldStatus === 'Not OK' && (!row.mouldFailureType || !row.mouldFailureReason)) {
                return alert(`Please select both visual/dimensional failure levels for Mould in row ${i + 1}.`);
            }
        }

        // Construct location string
        const fullLocation = locationType === 'Shed'
            ? (locationDetail.toLowerCase().includes('shed') ? locationDetail : `Shed ${locationDetail}`)
            : (locationDetail.toLowerCase().includes('line') ? locationDetail : `Line ${locationDetail}`);

        setIsLoading(true);

        try {
            if (editingEntry?.id) {
                // Editing a single row
                const row = rows[0];
                const isBenchDim = row.benchStatus === 'Not OK' && row.benchFailureType === 'Alignment & Structural Condition' && (row.benchFailureReason === 'Bending / Buckling' || row.benchFailureReason === 'Sagging / Hogging');
                const isMouldDim = row.mouldStatus === 'Not OK' && row.mouldFailureType === 'Mould Dimensional Checks';

                const payload = {
                    lineShedNo: fullLocation,
                    checkingDate: DateUtils.formatToBackend(dutyDate || DateUtils.getNowISO()),
                    benchGangNo: row.benchGangNo,
                    sleeperType: row.sleeperType,
                    latestCastingDate: editingEntry.latestCastingDate || DateUtils.formatToBackend(DateUtils.getNowISO()),
                    benchVisualResult: (row.benchStatus === 'Not OK' && !isBenchDim) ? 'not-ok' : 'ok',
                    benchDimensionalResult: (row.benchStatus === 'Not OK' && isBenchDim) ? 'not-ok' : 'ok',
                    mouldVisualResult: (row.mouldStatus === 'Not OK' && !isMouldDim) ? 'not-ok' : 'ok',
                    mouldDimensionalResult: (row.mouldStatus === 'Not OK' && isMouldDim) ? 'not-ok' : 'ok',
                    combinedRemarks: makeCombinedRemarks(row, generalRemarks),
                    createdBy: parseInt(localStorage.getItem('userId') || '118', 10)
                };

                const response = await apiService.updateBenchMouldInspection(editingEntry.id, payload);
                if (response && (response.success || response.responseStatus?.statusCode === 0 || response.responseData)) {
                    handleCloseForm();
                    // Background refresh
                    const res = await apiService.getAllBenchMouldInspections();
                    if (res?.responseData) setRecords(res.responseData);
                } else {
                    alert("Failed to update: " + (response?.responseStatus?.message || "Unknown error"));
                }
            } else {
                // Multi-row entry (sequential creation)
                const savePromises = rows.map(row => {
                    const isBenchDim = row.benchStatus === 'Not OK' && row.benchFailureType === 'Alignment & Structural Condition' && (row.benchFailureReason === 'Bending / Buckling' || row.benchFailureReason === 'Sagging / Hogging');
                    const isMouldDim = row.mouldStatus === 'Not OK' && row.mouldFailureType === 'Mould Dimensional Checks';

                    const payload = {
                        lineShedNo: fullLocation,
                        checkingDate: DateUtils.formatToBackend(dutyDate || DateUtils.getNowISO()),
                        benchGangNo: row.benchGangNo,
                        sleeperType: row.sleeperType,
                        latestCastingDate: DateUtils.formatToBackend(DateUtils.getNowISO()),
                        benchVisualResult: (row.benchStatus === 'Not OK' && !isBenchDim) ? 'not-ok' : 'ok',
                        benchDimensionalResult: (row.benchStatus === 'Not OK' && isBenchDim) ? 'not-ok' : 'ok',
                        mouldVisualResult: (row.mouldStatus === 'Not OK' && !isMouldDim) ? 'not-ok' : 'ok',
                        mouldDimensionalResult: (row.mouldStatus === 'Not OK' && isMouldDim) ? 'not-ok' : 'ok',
                        combinedRemarks: makeCombinedRemarks(row, generalRemarks),
                        createdBy: parseInt(localStorage.getItem('userId') || '118', 10)
                    };
                    return apiService.createBenchMouldInspection(payload);
                });

                const results = await Promise.all(savePromises);
                const failed = results.find(res => !(res && (res.success || res.responseStatus?.statusCode === 0 || res.responseData)));
                
                if (failed) {
                    alert("Some records failed to save. Please review current logs.");
                } else {
                    handleCloseForm();
                }

                // Background refresh
                const res = await apiService.getAllBenchMouldInspections();
                if (res?.responseData) setRecords(res.responseData);
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Error saving inspection log: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            const response = await apiService.deleteBenchMouldInspection(id);
            if (response && (response.success || response.responseStatus?.statusCode === 0)) {
                setRecords(prev => prev.filter(r => r.id !== id));
                // background sync
                const res = await apiService.getAllBenchMouldInspections();
                if (res?.responseData) setRecords(res.responseData);
            } else {
                alert(response?.responseStatus?.message || "Failed to delete");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Delete error: " + error.message);
        }
    };

    const effectiveShowForm = showForm !== undefined ? showForm : false;

    // Filter items with rejection detail
    const rejectionRows = useMemo(() => {
        return rows.filter(r => r.benchStatus === 'Not OK' || r.mouldStatus === 'Not OK');
    }, [rows]);

    return (
        <div className="mould-bench-container">
            {/* Tab Swapping Header using SubCards Grid - matching Manual Checks / other tabs */}
            {!effectiveShowForm && (
                <div className="sub-cards-grid">
                    <SubCard
                        id="summary"
                        title={<>Quality Summary <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: '4px' }}>(Under Construction)</span></>}
                        color="#42818c"
                        count={allAssets?.length || 12}
                        isActive={activeModule === 'summary'}
                        onClick={() => { setActiveModule('summary'); handleCloseForm(); }}
                        label="METRICS"
                        category="ASSETS IN PLANT"
                    />
                    <SubCard
                        id="current"
                        title="Current Shift Logs"
                        color="#10b981"
                        count={currentShiftLogs.length}
                        isActive={activeModule === 'current'}
                        onClick={() => { setActiveModule('current'); handleCloseForm(); }}
                        onAdd={() => { setActiveModule('current'); if (setShowForm) setShowForm(true); setEditingEntry(null); }}
                        label="ACTIVE SHIFT"
                        category="SHIFT LOGS"
                    />
                    <SubCard
                        id="history"
                        title="Historical Logs"
                        color="#3b82f6"
                        count={records.length}
                        isActive={activeModule === 'history'}
                        onClick={() => { setActiveModule('history'); handleCloseForm(); }}
                        label="ALL RECORDS"
                        category="TOTAL LOGS"
                    />
                </div>
            )}

            {/* TAB CONTENT PANEL */}
            <div className="mould-bench-content-area" style={{ marginTop: '10px' }}>
                
                {/* 1. SUMMARY TAB */}
                {activeModule === 'summary' && !effectiveShowForm && (
                    <AssetSummary allAssets={allAssets} records={normalizedRecords} />
                )}

                {/* 2. CURRENT LOGS TAB */}
                {activeModule === 'current' && (
                    <>
                        {effectiveShowForm ? (
                            /* Entry Form */
                            <div className="manual-form-wrapper" ref={formRef}>
                                <div className="content-title-row">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button className="back-btn-circle" onClick={handleCloseForm} title="Back to Logs">←</button>
                                        <h3 style={{ margin: 0 }}>{editingEntry ? 'Modify' : 'New'} Joint Asset Inspection (Bench & Mould)</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span className="status-pill manual" style={{ padding: '6px 12px' }}>Input Mode</span>
                                    </div>
                                </div>

                                {/* Common Info */}
                                <div className="common-info-card">
                                    <span className="info-box-title">Common Information</span>
                                    <div className="common-info-grid">
                                        <div className="common-field-group">
                                            <label>Date & Shift of Checking</label>
                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', height: '42px' }}>
                                                <div className="autofill-badge">
                                                    📅 {dutyDate ? dutyDate.split('-').reverse().join('/') : DateUtils.getNowISO().split('-').reverse().join('/')} 
                                                    &nbsp;|&nbsp; 
                                                    ⏱️ Shift: {selectedShift || 'General'} (Autofilled)
                                                </div>
                                            </div>
                                        </div>

                                        <div className="common-field-group">
                                            <label>Location Selection</label>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                                                <div className="location-toggle-group" style={{ margin: 0 }}>
                                                    <button 
                                                        className={`location-toggle-btn ${locationType === 'Shed' ? 'active' : ''}`}
                                                        onClick={() => setLocationType('Shed')}
                                                    >
                                                        Shed
                                                    </button>
                                                    <button 
                                                        className={`location-toggle-btn ${locationType === 'Long Line' ? 'active' : ''}`}
                                                        onClick={() => setLocationType('Long Line')}
                                                    >
                                                        Long Line
                                                    </button>
                                                </div>
                                                <input 
                                                    className="location-detail-input"
                                                    placeholder={locationType === 'Shed' ? 'e.g. Shed 2' : 'e.g. Line I'}
                                                    value={locationDetail}
                                                    onChange={(e) => setLocationDetail(e.target.value)}
                                                    style={{ flex: 1, maxWidth: '200px', marginTop: 0 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Multiple Rows Table */}
                                <div style={{ marginBottom: '8px' }}>
                                    <span className="info-box-title">Inspected Assets Rows</span>
                                </div>
                                <div className="multi-row-table-wrapper">
                                    <table className="multi-row-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '25%' }}>Bench / Gang Number</th>
                                                <th style={{ width: '22%' }}>Sleeper Type</th>
                                                <th style={{ width: '15%' }}>No. of Moulds</th>
                                                <th style={{ width: '16%' }}>Bench Status</th>
                                                <th style={{ width: '16%' }}>Mould Status</th>
                                                <th style={{ width: '6%', textAlign: 'center' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, idx) => (
                                                <tr key={row.id}>
                                                    <td>
                                                        <input 
                                                            className="row-input"
                                                            placeholder="e.g. 210-A"
                                                            value={row.benchGangNo}
                                                            onChange={(e) => handleRowFieldChange(row.id, 'benchGangNo', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <select 
                                                            className="row-select"
                                                            value={row.sleeperType}
                                                            onChange={(e) => handleRowFieldChange(row.id, 'sleeperType', e.target.value)}
                                                        >
                                                            {SLEEPER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="number"
                                                            className="row-input"
                                                            min="1"
                                                            value={row.noOfMoulds}
                                                            onChange={(e) => handleRowFieldChange(row.id, 'noOfMoulds', parseInt(e.target.value, 10) || 4)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="status-pill-group">
                                                            <button 
                                                                className={`status-pill-btn ${row.benchStatus === 'OK' ? 'active ok' : ''}`}
                                                                onClick={() => handleRowFieldChange(row.id, 'benchStatus', 'OK')}
                                                            >
                                                                OK
                                                            </button>
                                                            <button 
                                                                className={`status-pill-btn ${row.benchStatus === 'Not OK' ? 'active not-ok' : ''}`}
                                                                onClick={() => handleRowFieldChange(row.id, 'benchStatus', 'Not OK')}
                                                            >
                                                                Not OK
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="status-pill-group">
                                                            <button 
                                                                className={`status-pill-btn ${row.mouldStatus === 'OK' ? 'active ok' : ''}`}
                                                                onClick={() => handleRowFieldChange(row.id, 'mouldStatus', 'OK')}
                                                            >
                                                                OK
                                                            </button>
                                                            <button 
                                                                className={`status-pill-btn ${row.mouldStatus === 'Not OK' ? 'active not-ok' : ''}`}
                                                                onClick={() => handleRowFieldChange(row.id, 'mouldStatus', 'Not OK')}
                                                            >
                                                                Not OK
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {!editingEntry && (
                                                            <button className="btn-delete-row" onClick={() => handleRemoveRow(row.id)} title="Delete row">
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {!editingEntry && (
                                        <div className="table-footer-actions">
                                            <button className="btn-add-row" onClick={handleAddRow}>
                                                ➕ Add New Row
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Rejection Reasons Dynamic Panel */}
                                {rejectionRows.length > 0 && (
                                    <div className="rejection-reasons-card">
                                        <div className="rejection-card-title">
                                            ⚠️ Reason for Rejection Detail
                                        </div>
                                        <div className="rejection-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {rejectionRows.map((row, index) => {
                                                    const benchNotOk = row.benchStatus === 'Not OK';
                                                    const mouldNotOk = row.mouldStatus === 'Not OK';

                                                    return (
                                                        <div key={row.id} className="rejection-bench-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingBottom: '0.75rem', borderBottom: index < rejectionRows.length - 1 ? '1px dashed rgba(239, 68, 68, 0.15)' : 'none' }}>
                                                            {benchNotOk && (
                                                                <div className="rejection-item-card" style={{ flex: '1 1 320px' }}>
                                                                    <div className="rejection-item-header">
                                                                        <span className="rejection-item-tag">Bench: {row.benchGangNo || `Row ${index + 1}`}</span>
                                                                        <span className="rejection-item-type bench">Bench failure</span>
                                                                    </div>
                                                                    <div className="rejection-dropdowns">
                                                                        <div className="rejection-dropdown-group">
                                                                            <label>Failure Category</label>
                                                                            <select 
                                                                                value={row.benchFailureType} 
                                                                                onChange={(e) => handleRowFieldChange(row.id, 'benchFailureType', e.target.value)}
                                                                            >
                                                                                <option value="">-- Select Category --</option>
                                                                                {Object.keys(REJECTION_OPTIONS.BENCH).map(cat => (
                                                                                    <option key={cat} value={cat}>{cat}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        {row.benchFailureType && (
                                                                            <div className="rejection-dropdown-group">
                                                                                <label>Specific Discrepancy</label>
                                                                                <select 
                                                                                    value={row.benchFailureReason}
                                                                                    onChange={(e) => handleRowFieldChange(row.id, 'benchFailureReason', e.target.value)}
                                                                                >
                                                                                    <option value="">-- Select Discrepancy --</option>
                                                                                    {(REJECTION_OPTIONS.BENCH[row.benchFailureType] || []).map(opt => (
                                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {mouldNotOk && (
                                                                <div className="rejection-item-card" style={{ flex: '1 1 320px' }}>
                                                                    <div className="rejection-item-header">
                                                                        <span className="rejection-item-tag">Mould on Bench: {row.benchGangNo || `Row ${index + 1}`}</span>
                                                                        <span className="rejection-item-type mould">Mould failure</span>
                                                                    </div>
                                                                    <div className="rejection-dropdowns">
                                                                        <div className="rejection-dropdown-group">
                                                                            <label>Failure Category</label>
                                                                            <select 
                                                                                value={row.mouldFailureType} 
                                                                                onChange={(e) => handleRowFieldChange(row.id, 'mouldFailureType', e.target.value)}
                                                                            >
                                                                                <option value="">-- Select Category --</option>
                                                                                {Object.keys(REJECTION_OPTIONS.MOULD).map(cat => (
                                                                                    <option key={cat} value={cat}>{cat}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        {row.mouldFailureType && (
                                                                            <div className="rejection-dropdown-group">
                                                                                <label>Specific Discrepancy</label>
                                                                                <select 
                                                                                    value={row.mouldFailureReason}
                                                                                    onChange={(e) => handleRowFieldChange(row.id, 'mouldFailureReason', e.target.value)}
                                                                                >
                                                                                    <option value="">-- Select Discrepancy --</option>
                                                                                    {(REJECTION_OPTIONS.MOULD[row.mouldFailureType] || []).map(opt => (
                                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}

                                {/* Additional General Remarks Text Field */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '2rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Additional Remarks / Comments</label>
                                    <textarea 
                                        className="field-textarea"
                                        placeholder="Add any extra comments here..."
                                        value={generalRemarks}
                                        onChange={(e) => setGeneralRemarks(e.target.value)}
                                    />
                                </div>

                                {/* Form Actions */}
                                <div className="form-actions-row">
                                    <button className="premium-btn" style={{ minWidth: '160px' }} onClick={handleSave} disabled={isLoading}>
                                        {isLoading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Submit Entries'}
                                    </button>
                                    <button className="premium-btn secondary" style={{ minWidth: '120px' }} onClick={handleCloseForm}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Current shift logs table view */
                            <>
                                <div className="table-outer-wrapper">
                                    <div className="table-responsive">
                                        <table className="ui-table">
                                            <thead>
                                                <tr>
                                                    <th>Location</th>
                                                    <th>Bench Number</th>
                                                    <th>Bench Observation</th>
                                                    <th>Mould Observation</th>
                                                    <th>Overall Result</th>
                                                    <th>Reason for Not OK</th>
                                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentShiftLogs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontStyle: 'italic' }}>
                                                            No logs recorded in the current active shift. Click "+ New Joint Entry" to start.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    currentShiftLogs.map(record => (
                                                        <tr key={record.id} className="table-row-hover">
                                                            <td><strong>{record.location}</strong></td>
                                                            <td><strong>{record.assetNo}</strong></td>
                                                            <td>
                                                                <span className={`badge-status ${record.benchOverall === 'OK' ? 'ok' : 'not-ok'}`}>
                                                                    {record.benchOverall}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge-status ${record.mouldOverall === 'OK' ? 'ok' : 'not-ok'}`}>
                                                                    {record.mouldOverall}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge-status ${record.overallResult === 'OK' ? 'ok' : 'not-ok'}`}>
                                                                    {record.overallResult}
                                                                </span>
                                                            </td>
                                                            <td style={{ maxWidth: '280px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '12px', lineHeight: '1.4' }}>
                                                                {getReasonForNotOk(record)}
                                                            </td>
                                                            <td>
                                                                <div className="btn-group-center">
                                                                    <button 
                                                                        className="btn-action mini" 
                                                                        onClick={() => {
                                                                            setEditingEntry(record);
                                                                            if (setShowForm) setShowForm(true);
                                                                        }}
                                                                    >
                                                                        Modify
                                                                    </button>
                                                                    <button 
                                                                        className="btn-action mini danger" 
                                                                        onClick={() => handleDelete(record.id)}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* 3. HISTORICAL LOGS TAB */}
                {activeModule === 'history' && !effectiveShowForm && (
                    <>
                        {/* Filters Panel */}
                        <div className="history-filters-card">
                            <div className="filter-group">
                                <label>Search Bench No.</label>
                                <input 
                                    placeholder="Search by bench number..."
                                    value={searchBench}
                                    onChange={(e) => setSearchBench(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Location Type</label>
                                <select value={filterLocType} onChange={(e) => setFilterLocType(e.target.value)}>
                                    <option value="All">All Locations</option>
                                    <option value="Shed">Shed</option>
                                    <option value="Long Line">Long Line</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Overall Status</label>
                                <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}>
                                    <option value="All">All Results</option>
                                    <option value="OK">OK</option>
                                    <option value="FAIL">Not OK / FAIL</option>
                                </select>
                            </div>
                        </div>

                        {/* List of historical logs */}
                        <div className="table-outer-wrapper">
                            <div className="table-responsive">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '10%' }}>Date of Checking</th>
                                            <th style={{ width: '10%' }}>Location</th>
                                            <th style={{ width: '10%' }}>Bench Number</th>
                                            <th style={{ width: '13%' }}>Bench Observation</th>
                                            <th style={{ width: '13%' }}>Mould Observation</th>
                                            <th style={{ width: '10%' }}>Overall Result</th>
                                            <th style={{ width: '22%' }}>Reason for Not OK</th>
                                            <th style={{ width: '12%' }}>Checked By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistoricalLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontStyle: 'italic' }}>
                                                    No logs found matching selected filter criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredHistoricalLogs.map(record => (
                                                <tr key={record.id} className="table-row-hover">
                                                    <td><strong>{record.dateOfChecking ? record.dateOfChecking.split('-').reverse().join('/') : ''}</strong></td>
                                                    <td>{record.location}</td>
                                                    <td><strong>{record.assetNo}</strong></td>
                                                    <td>
                                                        <span className={`badge-status ${record.benchOverall === 'OK' ? 'ok' : 'not-ok'}`}>
                                                            {record.benchOverall}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge-status ${record.mouldOverall === 'OK' ? 'ok' : 'not-ok'}`}>
                                                            {record.mouldOverall}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge-status ${record.overallResult === 'OK' ? 'ok' : 'not-ok'}`}>
                                                            {record.overallResult}
                                                        </span>
                                                    </td>
                                                    <td style={{ maxWidth: '280px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '12px', lineHeight: '1.4' }}>
                                                        {getReasonForNotOk(record)}
                                                    </td>
                                                    <td>IE Engineer ({record.createdBy || 'Unknown'})</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default MouldBenchCheck;
