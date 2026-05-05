import React, { useState, useEffect } from 'react';
import EnhancedDataTable from '../../../components/common/EnhancedDataTable';
import { apiService } from '../../../services/api';
import { useShift } from '../../../context/ShiftContext';

// Mock data to simulate API responses for ET module
const mockBatches = [
    { batchNo: 'B-101', shedLine: 'Shed 1', castingDate: '2026-04-20', totalCasted: 100, etCount: 1, etPercent: 1.0 },
    { batchNo: 'B-102', shedLine: 'Line 2', castingDate: '2026-04-21', totalCasted: 120, etCount: 0, etPercent: 0.0 }
];

const mockLogs = [
    { id: 1, batchNo: 'B-101', shedLine: 'Shed 1', castingDate: '2026-04-20', logDate: '2026-04-21T10:00:00', sleepers: ['12A'], remark: 'Minor surface crack' }
];

const EpoxyTreatedSleepers = ({ onBack, initialShowForm = false }) => {
    const { vendorId, dutyUnit } = useShift();
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'logs'
    const [showForm, setShowForm] = useState(initialShowForm);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showLogModal, setShowLogModal] = useState(false);
    
    const [logs, setLogs] = useState([]);
    const [batches, setBatches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'summary') {
                const res = await apiService.getETBatchSummary();
                setBatches(res?.responseData || []);
            } else {
                const res = await apiService.getAllETLogs();
                setLogs(res?.responseData || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const summaryColumns = [
        { key: 'batchNumber', label: 'Batch Number' },
        { key: 'location', label: 'Shed No. / Line No.' },
        { key: 'dateOfCasting', label: 'Date of Casting' },
        { key: 'totalSleepers', label: 'Total Sleepers Casted' },
        { key: 'etSleepers', label: 'No. of ET Sleepers' },
        { key: 'etPercentage', label: '% of ET Sleepers', render: (val) => val != null ? `${val}%` : '0%' }
    ];

    const logsColumns = [
        { key: 'batchNumber', label: 'Batch Number' },
        { key: 'location', label: 'Shed No. / Line No.' },
        { key: 'dateOfCasting', label: 'Date of Casting' },
        { key: 'createdDate', label: 'Date & Time of Log', render: (val) => val ? new Date(val).toLocaleString('en-GB') : 'N/A' },
        { key: 'sleepers', label: 'Sleepers Marked ET', render: (val) => Array.isArray(val) ? val.map(s => s.sleeperNo).join(', ') : '' },
        {
            key: 'actions', label: 'Actions', render: (_, row) => (
                <button
                    className="btn-verify"
                    style={{ fontSize: '10px', padding: '6px 14px' }}
                    onClick={() => { setSelectedLog(row); setShowLogModal(true); }}
                >
                    View Details
                </button>
            )
        }
    ];

    const handleSave = async (formData) => {
        try {
            const currentUserId = localStorage.getItem('userId');
            
            // Format date for API (DD/MM/YYYY)
            let formattedCastingDate = formData.dateOfCasting;
            if (formattedCastingDate && formattedCastingDate.includes('-')) {
                const [y, m, d] = formattedCastingDate.split('-');
                formattedCastingDate = `${d}/${m}/${y}`;
            }

            const payload = {
                ...formData,
                dateOfCasting: formattedCastingDate,
                vendorCode: vendorId || localStorage.getItem('vendorId'),
                plantId: dutyUnit || localStorage.getItem('dutyUnit'),
                shift: localStorage.getItem('shift') || 'A',
                createdBy: currentUserId,
                updatedBy: currentUserId
            };

            if (formData.id) {
                await apiService.updateETRecord(formData.id, payload);
            } else {
                await apiService.createETRecord(payload);
            }
            setShowForm(false);
            fetchData();
        } catch (e) {
            alert(e.message || "Failed to save record");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        try {
            await apiService.deleteETRecord(id);
            setShowLogModal(false);
            fetchData();
        } catch (e) {
            alert(e.message || "Failed to delete record");
        }
    };

    return (
        <div className="et-module cement-forms-scope">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div className="nav-tabs" style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
                    <button className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'summary' ? '800' : '600', background: activeTab === 'summary' ? '#fff' : 'transparent' }}>
                        Batch Wise ET Status
                    </button>
                    <button className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'logs' ? '800' : '600', background: activeTab === 'logs' ? '#fff' : 'transparent' }}>
                        ET Logs
                    </button>
                </div>
                {activeTab === 'logs' && (
                    <button className="btn-verify" onClick={() => { setSelectedLog(null); setShowForm(true); }}>+ Add New Entry</button>
                )}
            </div>

            <div className="tab-content fade-in">
                {activeTab === 'summary' && (
                    <div className="section-card">
                        <EnhancedDataTable columns={summaryColumns} data={batches} selectable={false} loading={isLoading} />
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="section-card">
                        <EnhancedDataTable columns={logsColumns} data={logs} selectable={false} loading={isLoading} />
                    </div>
                )}
            </div>

            {showForm && (
                <ETDeclarationForm 
                    initialData={selectedLog}
                    allLogs={logs}
                    onClose={() => setShowForm(false)} 
                    onSave={handleSave} 
                />
            )}

            {showLogModal && selectedLog && (
                <ETLogModal 
                    log={selectedLog} 
                    onClose={() => setShowLogModal(false)} 
                    onDelete={handleDelete}
                    onEdit={() => {
                        setShowLogModal(false);
                        setShowForm(true);
                    }}
                />
            )}
        </div>
    );
};

const ETDeclarationForm = ({ initialData, allLogs, onClose, onSave }) => {
    const { vendorId, dutyUnit } = useShift();
    const [formData, setFormData] = useState(initialData ? {
        ...initialData,
        sleepers: initialData.sleepers?.map(s => s.sleeperNo) || [],
        isConfirmed: initialData.isConfirmed || false
    } : {
        location: '',
        dateOfCasting: new Date().toISOString().split('T')[0],
        batchNumber: '',
        batchId: '',
        sleepers: [],
        sleeperType: '',
        remark: '',
        isConfirmed: false
    });
    const [locations, setLocations] = useState({});
    const [batchesList, setBatchesList] = useState([]);
    const [availableSleepers, setAvailableSleepers] = useState([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [isLoadingSleepers, setIsLoadingSleepers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            const vId = vendorId || localStorage.getItem('vendorId');
            const pId = dutyUnit || localStorage.getItem('dutyUnit');
            
            // Fetch Locations
            if (vId && pId) {
                try {
                    const locRes = await apiService.getPlantSheds(vId, pId);
                    const data = locRes?.responseData || locRes || {};
                    setLocations(data);
                } catch (e) {
                    console.error("Error fetching locations:", e);
                }
            }
        };
        fetchInitialData();
    }, [vendorId, dutyUnit]);

    // Fetch Batches whenever location or castingDate changes
    useEffect(() => {
        const fetchBatches = async () => {
            const vId = vendorId || localStorage.getItem('vendorId');
            const pId = dutyUnit || localStorage.getItem('dutyUnit');
            const { location, dateOfCasting } = formData;

            if (!vId || !pId || !location || !dateOfCasting) {
                setBatchesList([]);
                return;
            }

            setIsLoadingBatches(true);
            try {
                // Convert YYYY-MM-DD to DD/MM/YYYY for API if needed
                let formattedDate = dateOfCasting;
                if (dateOfCasting && dateOfCasting.includes('-')) {
                    const [y, m, d] = dateOfCasting.split('-');
                    formattedDate = `${d}/${m}/${y}`;
                }

                const res = await apiService.getProductionBatchesWithId(vId, formattedDate, pId, location);
                setBatchesList(res?.responseData || []);
            } catch (e) {
                console.error("Error fetching batches:", e);
                setBatchesList([]);
            } finally {
                setIsLoadingBatches(false);
            }
        };
        fetchBatches();
    }, [formData.location, formData.dateOfCasting]);

    // Fetch sleepers when batchId changes
    useEffect(() => {
        const fetchSleepers = async () => {
            if (!formData.batchId) {
                setAvailableSleepers([]);
                return;
            }
            setIsLoadingSleepers(true);
            const alreadyETSleepers = new Set();
            if (allLogs) {
                allLogs.forEach(log => {
                    // Check if log is for the same batch but is not the one we are currently editing
                    const isSameBatch = String(log.batchId) === String(formData.batchId) || 
                                      String(log.batchNumber) === String(formData.batchNumber);
                    if (isSameBatch && log.id !== initialData?.id) {
                        (log.sleepers || []).forEach(s => alreadyETSleepers.add(s.sleeperNo));
                    }
                });
            }

            try {
                const res = await apiService.getEtBatchSleepers(formData.batchId);
                const data = res?.responseData || res; // Check both formats
                
                if (data) {
                    // Show all sleepers whose status is not REJECTED 
                    // AND not already marked as ET in other logs
                    const validSleepers = (data.sleepers || [])
                        .filter(s => {
                            const status = s.status?.toUpperCase();
                            const sNo = s.sleeperNo || s.no;
                            return status !== 'REJECTED' && !alreadyETSleepers.has(sNo);
                        })
                        .map(s => ({ 
                            id: s.sleeperId || s.id || 0, 
                            no: s.sleeperNo || s.no 
                        }));
                    
                    setAvailableSleepers(validSleepers);
                    
                    // Auto-fill other fields if they are empty
                    setFormData(prev => ({
                        ...prev,
                        batchNumber: data.batchNumber || data.batchNo || prev.batchNumber,
                        sleeperType: data.sleeperType || prev.sleeperType
                    }));
                }
            } catch (e) {
                console.error("Error fetching sleepers for batch:", e);
                setAvailableSleepers([]);
            } finally {
                setIsLoadingSleepers(false);
            }
        };
        fetchSleepers();
    }, [formData.batchId]);

    const handleSubmit = async () => {
        if (!formData.location || !formData.batchNumber || formData.sleepers.length === 0 || !formData.remark || !formData.isConfirmed) {
            alert("Please complete all mandatory fields and acknowledge the confirmation.");
            return;
        }
        setIsSaving(true);
        // Map sleepers back to API format: [{ sleeperId: 0, sleeperNo: 'string' }]
        const mappedSleepers = formData.sleepers.map(sNo => {
            const found = availableSleepers.find(as => as.no === sNo);
            return {
                sleeperId: found ? found.id : 0,
                sleeperNo: sNo
            };
        });
        
        await onSave({ ...formData, sleepers: mappedSleepers });
        setIsSaving(false);
    };

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">{initialData ? 'Edit' : 'Declare'} Epoxy Treated Sleeper</span>
                    <button className="form-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="form-modal-body">
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label>Shed No. / Line No.</label>
                            <select value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                                <option value="">Select Location</option>
                                {Object.entries(locations).map(([plantType, sheds]) => (
                                    <optgroup key={plantType} label={plantType}>
                                        {Array.isArray(sheds) && sheds.map(shed => (
                                            <option key={`${plantType} - ${shed}`} value={shed}>{shed}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Date of Casting</label>
                            <input type="date" value={formData.dateOfCasting} onChange={e => setFormData({ ...formData, dateOfCasting: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Select Batch</label>
                            <select 
                                value={formData.batchId} 
                                onChange={e => {
                                    const bId = e.target.value;
                                    const selected = batchesList.find(b => String(b.id || b.batchId) === String(bId));
                                    setFormData({ 
                                        ...formData, 
                                        batchId: bId, 
                                        batchNumber: selected?.batchNumber || selected?.batchNo || '' 
                                    });
                                }}
                            >
                                <option value="">-- Choose Batch --</option>
                                {batchesList.map(b => (
                                    <option key={b.id || b.batchId} value={b.id || b.batchId}>
                                        {b.batchNumber || b.batchNo} ({b.castingDate || b.dateOfCasting})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Sleeper Type</label>
                            <input type="text" value={formData.sleeperType} onChange={e => setFormData({ ...formData, sleeperType: e.target.value })} placeholder="e.g. RT-8746" />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Sleeper Number(s)</label>
                            <MultiSleeperDropdown 
                                availableSleepers={availableSleepers} 
                                selectedSleepers={formData.sleepers}
                                onSelect={(vals) => setFormData({ ...formData, sleepers: vals })}
                                isLoading={isLoadingSleepers}
                                hasBatch={!!formData.batchId}
                            />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Remark <span className="required">*</span></label>
                            <textarea value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} rows="3" placeholder="Enter notes..." />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <input type="checkbox" checked={formData.isConfirmed} onChange={e => setFormData({ ...formData, isConfirmed: e.target.checked })} style={{ transform: 'scale(1.3)', margin: '0 4px', cursor: 'pointer', accentColor: '#13343b' }} />
                                <span style={{ fontWeight: '700', color: '#13343b', fontSize: '13px' }}>I confirm the sleeper has been physically painted/marked for ET identification.</span>
                            </label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button className="btn-verify" style={{ flex: 1, opacity: isSaving ? 0.7 : 1 }} disabled={isSaving} onClick={handleSubmit}>
                            {isSaving ? 'Saving...' : 'Save Declaration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ETLogModal = ({ log, onClose, onDelete, onEdit }) => {
    const currentUserId = localStorage.getItem('userId');
    const createdBy = log.createdBy;
    const createdDate = log.createdDate || log.logDate;
    
    // validate based on the created by for 8 hours.
    const isOwner = String(currentUserId) === String(createdBy);
    const logTime = createdDate ? new Date(createdDate).getTime() : Date.now();
    const hoursElapsed = (Date.now() - logTime) / (1000 * 60 * 60);
    const isWithin8Hours = hoursElapsed <= 8;
    
    const canModify = isOwner && isWithin8Hours;

    return (
        <div className="form-modal-overlay" onClick={onClose}>
            <div className="form-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="form-modal-header">
                    <span className="form-modal-header-title">Log Details</span>
                    <button className="form-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="form-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>BATCH NUMBER</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{log.batchNumber}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>LOCATION</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{log.location}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>SLEEPERS ET</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{log.sleepers?.map(s => s.sleeperNo).join(', ')}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>TIME OF LOG</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#13343b' }}>{new Date(createdDate).toLocaleString('en-GB')}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button className="btn-save" style={{ flex: 1, padding: '10px', opacity: canModify ? 1 : 0.5, cursor: canModify ? 'pointer' : 'not-allowed' }} disabled={!canModify} onClick={onEdit}>Modify</button>
                        <button className="btn-save" style={{ flex: 1, padding: '10px', opacity: canModify ? 1 : 0.5, cursor: canModify ? 'pointer' : 'not-allowed', color: '#ef4444', border: '1px solid #fee2e2' }} disabled={!canModify} onClick={() => onDelete(log.id)}>Delete</button>
                    </div>
                    {!isOwner && <p style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', margin: 0 }}>Only the creator can modify this record.</p>}
                    {isOwner && !isWithin8Hours && <p style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', margin: 0 }}>This record is locked as it was created over 8 hours ago.</p>}
                </div>
            </div>
        </div>
    );
};

const MultiSleeperDropdown = ({ availableSleepers, selectedSleepers, onSelect, isLoading, hasBatch }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = availableSleepers.filter(s => 
        !selectedSleepers.includes(s.no) &&
        s.no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSleeper = (no) => {
        if (selectedSleepers.includes(no)) {
            onSelect(selectedSleepers.filter(s => s !== no));
        } else {
            onSelect([...selectedSleepers, no]);
        }
    };

    return (
        <div className="custom-dropdown-container" style={{ position: 'relative' }}>
            <div 
                className="dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    minHeight: '42px',
                    padding: '6px 12px',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    cursor: 'pointer',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
                    {selectedSleepers.length === 0 ? (
                        <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                            {isLoading ? 'Loading sleepers...' : !hasBatch ? 'Select batch first' : 'Select sleepers...'}
                        </span>
                    ) : (
                        selectedSleepers.map(s => (
                            <span key={s} style={{ 
                                background: '#f1f5f9', 
                                color: '#475569', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                border: '1px solid #e2e8f0'
                            }}>
                                {s}
                                <span onClick={(e) => { e.stopPropagation(); toggleSleeper(s); }} style={{ fontWeight: '800', cursor: 'pointer' }}>✕</span>
                            </span>
                        ))
                    )}
                </div>
                {isLoading && <div className="spinner-mini" style={{ width: '14px', height: '14px' }}></div>}
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div className="dropdown-panel" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginTop: '4px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 100,
                    maxHeight: '250px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                        <input 
                            type="text" 
                            placeholder="Search sleeper..." 
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                borderRadius: '6px', 
                                border: '1px solid #e2e8f0',
                                fontSize: '13px'
                            }}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                                {hasBatch ? 'No sleepers matching search' : 'Select a batch to see sleepers'}
                            </div>
                        ) : (
                            filtered.map(s => {
                                const isSelected = selectedSleepers.includes(s.no);
                                return (
                                    <div 
                                        key={s.id} 
                                        onClick={() => toggleSleeper(s.no)}
                                        style={{ 
                                            padding: '8px 12px', 
                                            fontSize: '13px', 
                                            cursor: 'pointer',
                                            background: isSelected ? '#f0f9ff' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        className="dropdown-item"
                                    >
                                        <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer' }} />
                                        <span style={{ color: isSelected ? '#0369a1' : '#1e293b', fontWeight: isSelected ? '700' : '500' }}>{s.no}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div style={{ padding: '8px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{ 
                                fontSize: '11px', 
                                color: '#64748b', 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer',
                                fontWeight: '700'
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EpoxyTreatedSleepers;
