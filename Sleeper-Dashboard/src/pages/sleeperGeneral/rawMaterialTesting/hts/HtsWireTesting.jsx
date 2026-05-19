import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import EnhancedDataTable from '../../../../components/common/EnhancedDataTable';
import { MOCK_HTS_HISTORY, MOCK_INVENTORY, MOCK_VERIFIED_CONSIGNMENTS } from '../../../../utils/rawMaterialMockData';
import { useShift } from '../../../../context/ShiftContext';
import { useToast } from '../../../../context/ToastContext';
import { saveHtsWireDailyTest, getHtsWireDailyTestByReqId } from '../../../../services/workflowService';
import TrendChart from '../../../../components/common/TrendChart';
import '../cement/CementForms.css';

const SubCard = ({ id, title, color, count, label, isActive, onClick }) => (
    <div
        className={`asset-card ${isActive ? 'active' : ''}`}
        onClick={onClick}
        style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderTopWidth: '4px',
            borderTopColor: color,
            borderRightColor: isActive ? color : '#e2e8f0',
            borderBottomColor: isActive ? color : '#e2e8f0',
            borderLeftColor: isActive ? color : '#e2e8f0',
            '--active-color-alpha': `${color}15`,
            cursor: 'pointer',
            flex: '1',
            minWidth: '200px'
        }}
    >
        <div className="asset-card-header">
            <div>
                <h4 className="asset-card-title" style={{ color: '#64748b', fontSize: '10px' }}>{title}</h4>
                <div className="asset-card-count" style={{ fontSize: count === 'N/A' ? '1.1rem' : '1.5rem', margin: '4px 0', fontWeight: count === 'N/A' ? '400' : '700' }}>{count}</div>
            </div>
        </div>
        <div className="asset-card-label" style={{ color: color, fontSize: '9px', fontWeight: '700' }}>{label}</div>
    </div>
);

const HtsWireTesting = ({ onBack, inventoryData = [] }) => {
    const [viewMode, setViewMode] = useState('new-stocks'); // Default to new stocks
    const [showForm, setShowForm] = useState(false);
    const { selectedShift, dutyDate, dutyLocation } = useShift();
    const { showToast } = useToast();
    const [availableCoils] = useState(MOCK_INVENTORY.HTS || []);
    const [history, setHistory] = useState(MOCK_HTS_HISTORY.map(h => ({
        ...h,
        nominalWeight: h.weight,
        strandDiameter: h.diameter,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    })));

    const pendingStocks = inventoryData;
    const toast = useToast();
    const [statusMap, setStatusMap] = useState({});
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [editId, setEditId] = useState(null);
    const [isPeriodic, setIsPeriodic] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!pendingStocks?.length) return;
            const newStatusMap = { ...statusMap };
            const fetchedHistory = [];
            let updated = false;
            try {
                const processedReqIds = new Set();
                for (const stock of pendingStocks) {
                    if (stock.requestId && !processedReqIds.has(stock.requestId)) {
                        processedReqIds.add(stock.requestId);
                        const record = await getHtsWireDailyTestByReqId(stock.requestId);
                        if (record && record.id) {
                            newStatusMap[stock.requestId] = "Completed";
                            fetchedHistory.push({
                                ...record,
                                id: record.id,
                                testDate: record.testDate ? record.testDate.substring(0, 10) : new Date().toISOString().split('T')[0],
                                consignmentNo: record.consignmentNo || stock.consignmentNo,
                                lotNo: record.lotNo || (stock.details?.coilDetails && stock.details.coilDetails[0]?.lotNo) || stock.lotNo,
                                nominalWeight: record.nominalWeight,
                                layLength: record.layLength,
                                strandDiameter: record.strandDiameter,
                                createdAt: record.createdAt || new Date().toISOString(),
                            });
                        } else {
                            newStatusMap[stock.requestId] = "Pending";
                        }
                        updated = true;
                    }
                }
                if (updated) {
                    setStatusMap(newStatusMap);
                    if (fetchedHistory.length > 0) {
                        setHistory(prev => {
                            const existingIds = new Set(prev.map(p => p.id));
                            const newRecords = fetchedHistory.filter(f => !existingIds.has(f.id));
                            const combined = [...newRecords, ...prev];
                            return combined.sort((a,b) => {
                                const dateA = new Date(a.testDate || 0);
                                const dateB = new Date(b.testDate || 0);
                                if (dateB - dateA !== 0) return dateB - dateA;
                                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                            });
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching HTS wire status", error);
            }
        };
        fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingStocks?.length, refreshTrigger]);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            testDate: new Date().toISOString().split('T')[0],
            consignmentNo: '',
            lotNo: '',
            nominalWeight: '',
            layLength: '',
            strandDiameter: ''
        }
    });

    useEffect(() => {
        if (activeRequestId) {
            getHtsWireDailyTestByReqId(activeRequestId).then(record => {
                if (record && record.id) {
                    setEditId(record.id);
                    reset({
                        ...record,
                        testDate: record.testDate ? record.testDate.substring(0, 10) : new Date().toISOString().split('T')[0]
                    });
                } else {
                    toast.info("No previous HTS Wire test data found for this request. You can start entering new results.");
                }
            });
        }
    }, [activeRequestId, reset]);

    // Removed coilNo watch and useEffect

    const canModify = (createdAt) => {
        if (!createdAt) return false;
        const entryTime = new Date(createdAt).getTime();
        const now = new Date().getTime();
        return (now - entryTime) < (60 * 60 * 1000); // 1 hour
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                shift: selectedShift || 'General',
                lineNo: dutyLocation || 'N/A',
                dateOfInspection: dutyDate || new Date().toISOString().split('T')[0],
                requestId: activeRequestId || null,
                createdBy: parseInt(localStorage.getItem('userId') || '1', 10)
            };

            await saveHtsWireDailyTest(payload, editId);
            toast.success(`HTS Wire daily test result ${editId ? 'updated' : 'saved'} successfully!`);
            
            setShowForm(false);
            reset();
            setActiveRequestId(null);
            setEditId(null);
            setIsPeriodic(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error saving HTS wire test:", error);
            toast.error(error.message || "Failed to save HTS wire test result.");
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this test record?')) {
            try {
                setHistory(prev => prev.filter(h => h.id !== id));
                toast.success("Record removed from local history list.");
            } catch (error) {
                toast.error("Failed to delete record.");
            }
        }
    };

    const inventoryColumns = [
        { key: 'vendor', label: 'Registered Agency' },
        { 
            key: 'lotNo', 
            label: 'Lot No. *', 
            isHeaderHighlight: true,
            render: (_, row) => {
                const items = row.details?.coilDetails || row.details?.lotDetails || [];
                if (items.length > 0) return items.map(c => c.lotNo || c.coilNo).join(', ');
                return row.lotNo || row.coilNo || 'N/A';
            }
        },
        { 
            key: 'qty', 
            label: 'Quantity',
            render: (_, row) => row.details?.totalQtyReceived || row.qty || 'N/A'
        },
        { key: 'receivedDate', label: 'Arrival Date' },
        {
            key: 'testingStatus',
            label: 'Status',
            render: (_, row) => {
                const status = statusMap[row.requestId] || 'Pending';
                return (
                    <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: status === 'Completed' ? '#dcfce7' : '#fef3c7',
                        color: status === 'Completed' ? '#166534' : '#92400e'
                    }}>
                        {status}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => {
                const isCompleted = statusMap[row.requestId] === 'Completed';
                return (
                    <button
                        className="btn-action mini"
                        onClick={() => {
                            reset({
                                testDate: new Date().toISOString().split('T')[0],
                                consignmentNo: row.consignmentNo,
                                lotNo: ''
                            });
                            setActiveRequestId(row.requestId);
                            setEditId(null);
                            setIsPeriodic(false);
                            setShowForm(true);
                        }}
                    >
                        {isCompleted ? 'Modify test details' : 'Add Test Detail'}
                    </button>
                )
            }
        }
    ];

    const historyColumns = [
        { key: 'testDate', label: 'Date', render: (val) => val ? val.split('-').reverse().join('/') : '' },
        { key: 'consignmentNo', label: 'Consignment' },
        { key: 'lotNo', label: 'Lot No.' },
        { key: 'nominalWeight', label: 'Weight' },
        { key: 'layLength', label: 'Lay Length' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => {
                const editable = canModify(row.createdAt);
                return (
                    <div className="btn-group-center" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                            className={`btn-action mini ${!editable ? 'disabled-btn' : ''}`}
                            disabled={!editable}
                            onClick={() => {
                                reset(row);
                                setShowForm(true);
                            }}
                            title={!editable ? "Expired" : ""}
                        >
                            Modify
                        </button>
                        <button
                            className={`btn-action mini danger ${!editable ? 'disabled-btn' : ''}`}
                            disabled={!editable}
                            onClick={() => handleDelete(row.id)}
                        >
                            Delete
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="hts-testing-root cement-forms-scope fade-in">
            <div className="content-title-row" style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>HTS Wire Testing (Daily)</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="toggle-btn secondary mini" onClick={onBack}>Back to Dashboard</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <SubCard id="stats" title="Analytics" color="#42818c" count="N/A" label="Statistics" isActive={viewMode === 'stats'} onClick={() => setViewMode('stats')} />
                <SubCard
                    id="new-stocks"
                    title="Inventory"
                    color="#f59e0b"
                    count={pendingStocks.filter(s => statusMap[s.requestId] !== 'Completed').length}
                    label="Pending for Test"
                    isActive={viewMode === 'new-stocks'}
                    onClick={() => setViewMode('new-stocks')}
                />
                <SubCard id="history" title="Historical" color="#10b981" count={history.length} label="Test Logs" isActive={viewMode === 'history'} onClick={() => setViewMode('history')} />
            </div>

            <div className="view-layer">
                {viewMode === 'stats' && (
                    <div className="table-outer-wrapper fade-in" style={{ padding: '24px' }}>
                        <TrendChart
                            data={history}
                            xKey="testDate"
                            lines={[
                                { key: 'nominalWeight', color: '#3b82f6', label: 'Nominal Weight' },
                                { key: 'layLength', color: '#8b5cf6', label: 'Lay Length' }
                            ]}
                            title="HTS Wire Quality Trends"
                            description="Daily weight and lay length monitoring"
                            yAxisLabel=""
                        />
                    </div>
                )}

                {viewMode === 'new-stocks' && (
                    <div className="table-outer-wrapper fade-in">
                        <div className="content-title-row" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', marginBottom: 0 }}>
                            <h4 style={{ margin: 0 }}>HTS Inventory Pending Testing</h4>
                        </div>
                        <EnhancedDataTable columns={inventoryColumns.filter(c => c.key !== 'testingStatus')} data={pendingStocks.filter(s => statusMap[s.requestId] !== 'Completed')} />
                    </div>
                )}

                {viewMode === 'history' && (
                    <div className="table-outer-wrapper fade-in">
                        <div className="content-title-row" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', marginBottom: 0 }}>
                            <h4 style={{ margin: 0 }}>HTS Quality Logs</h4>
                        </div>
                        <EnhancedDataTable columns={historyColumns} data={history} emptyMessage="No HTS test records found." />
                    </div>
                )}
            </div>

            {showForm && (
                <div className="form-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="form-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '80%', width: '80%' }}>
                        <div className="form-modal-header">
                            <span className="form-modal-header-title">HTS Wire Test Record</span>
                            <button className="form-modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <div className="form-modal-body" style={{ background: '#f8fafc' }}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Date of Testing <span className="required">*</span></label>
                                        <input type="text" value={new Date().toLocaleDateString('en-GB')} readOnly style={{ background: '#f1f5f9' }} />
                                    </div>
                                    <div className="input-group">
                                        <label>Consignment No. <span className="required">*</span></label>
                                        {activeRequestId ? (
                                            <input
                                                type="text"
                                                readOnly
                                                className="readOnly"
                                                style={{ background: '#f8fafc' }}
                                                {...register("consignmentNo")}
                                            />
                                        ) : isPeriodic ? (
                                            <input
                                                type="text"
                                                placeholder="Enter Consignment No"
                                                {...register("consignmentNo", { required: "Required" })}
                                            />
                                        ) : (
                                            <select {...register('consignmentNo', { required: 'Required' })}>
                                                <option value="">-- Select --</option>
                                                {inventoryData.map((c, i) => (
                                                    <option key={i} value={c.consignmentNo}>{c.consignmentNo} ({c.vendor})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="input-group">
                                        <label>Lot No. <span className="required">*</span></label>
                                        <input type="text" {...register('lotNo', { required: 'Lot No. is required' })} />
                                    </div>
                                    <div className="input-group">
                                        <label>Nominal Weight <span className="required">*</span></label>
                                        <input type="number" step="0.001" {...register('nominalWeight', { required: true })} />
                                    </div>
                                    <div className="input-group">
                                        <label>Lay Length <span className="required">*</span></label>
                                        <input type="number" step="0.01" {...register('layLength', { required: true })} />
                                    </div>
                                    <div className="input-group">
                                        <label>Nominal Diameter <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="2.97 – 3.03 mm"
                                            {...register('strandDiameter', {
                                                required: 'Nominal Diameter is required',
                                                min: { value: 2.97, message: 'Min value is 2.97 mm' },
                                                max: { value: 3.03, message: 'Max value is 3.03 mm' }
                                            })}
                                            style={errors.strandDiameter ? { borderColor: '#ef4444' } : {}}
                                        />
                                        {errors.strandDiameter && (
                                            <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                {errors.strandDiameter.message}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="form-modal-footer" style={{ borderTop: 'none', padding: '24px 0 0' }}>
                                    <button type="submit" className="btn-save">{editId ? 'Update Test' : 'Save Test'}</button>
                                    <button type="button" className="btn-save" style={{ background: '#64748b' }} onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default HtsWireTesting;
