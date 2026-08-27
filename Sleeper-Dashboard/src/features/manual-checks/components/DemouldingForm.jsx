import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../../services/api';
import '../../../components/common/Checkbox.css';
import { useShift } from '../../../context/ShiftContext';

const DemouldingForm = ({ onSave, onCancel, isLongLine, existingEntries = [], initialData, activeContainer, sharedBatchNo, sharedBenchNo, onShiftFieldChange }) => {
    const { allWitnessedRecords, dutyUnit, dutyLocation, vendorId: contextVendorId } = useShift();

    // Exact State Mapping as requested by User
    // Helper for safe date/time (Forcing Asia/Kolkata to stop 12:54/UTC issues)
    const getSafeToday = () => {
        try {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date()); // Returns YYYY-MM-DD
        } catch (e) {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    };

    const getSafeNowTime = () => {
        try {
            return new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(new Date());
        } catch (e) {
            const d = new Date();
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    };

    const [formData, setFormData] = useState({
        location: activeContainer?.name || 'N/A',
        inspectionDate: getSafeToday(),
        inspectionTime: getSafeNowTime(),
        batch: '',
        gangNo: '',
        type: '',
        casting: getSafeToday(),
        process: '',
        visualCheck: 'All OK',
        dimCheck: 'All OK',
        remarks: '',
        defectiveSleeperDetails: []
    });

    const [validationErrors, setValidationErrors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [benches, setBenches] = useState([]);
    const [sleeperTypes, setSleeperTypes] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [availableSleepersByBench, setAvailableSleepersByBench] = useState({});
    const [isBenchDropdownOpen, setIsBenchDropdownOpen] = useState(false);
    const [confirmDeselectTarget, setConfirmDeselectTarget] = useState(null);
    const [existingRecordId, setExistingRecordId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingSleepers, setIsFetchingSleepers] = useState(false);
    const [isFetchingFormOptions, setIsFetchingFormOptions] = useState(false);
    const benchDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (benchDropdownRef.current && !benchDropdownRef.current.contains(event.target)) {
                setIsBenchDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const vendorId = contextVendorId || localStorage.getItem('vendorId') || "134";

    // Helper for DateTime/Date input compatibility
    const formatFromBackendDatePart = (dateStr) => {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 10);
        if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
            const [d, m, y] = dateStr.split('/');
            return `${y}-${m}-${d}`;
        }
        return dateStr;
    };

    const formatDateTimeForInput = (dt, time) => {
        if (!dt) return "";
        if (dt.includes('T')) return dt.substring(0, 16);
        const datePart = formatFromBackendDatePart(dt);
        const timePart = time || '00:00';
        return `${datePart}T${timePart.substring(0, 5)}`;
    };

    const formatDateForInput = (d) => {
        if (!d) return "";
        if (d.includes('T')) return d.substring(0, 10);
        return d;
    };

    const formatSleeperLabel = (benchStr, seqStr, sleeperType = formData.type) => {
        const s = String(seqStr || '').trim();
        const b = String(benchStr || '').trim();
        if (!s) return b;
        if (!b) return s;
        
        const typeLower = String(sleeperType || '').toLowerCase();
        const isSingleBenchType = ['pnc', 'turnout', 'dc', 'scc', 'curved', 'dcs', 'ds'].some(kw => typeLower.includes(kw));
        
        if (isSingleBenchType) return s;

        if (s.toLowerCase().startsWith(b.toLowerCase())) return s;
        return `${b}${s}`;
    };

    const parseDefectiveSleepers = (rawDefects, visualCheck, dimCheck, typeForLabel = formData.type) => {
        if (!Array.isArray(rawDefects)) return [];

        if (visualCheck === 'All OK' && dimCheck === 'All OK') {
            return [];
        }

        const isAllRejected = visualCheck === 'All Rejected' || dimCheck === 'All Rejected';
        const visualOptions = ['Surface Defect', 'Honeycomb', 'Dowel Missing / Tilt / Sink', 'Insert Missing / Tilt / Sink', 'Crack'];
        const dimOptions = ['Outer Gauge', 'Rail Seat', 'Toe Gap', 'Rail Seat Slope', 'Height Gauge', 'Length of Sleeper'];

        const parsed = rawDefects
            .filter(d => {
                if (!d) return false;
                const sleeperIdStr = String(d.sleeperNo || d.sleeper_no || d.sequenceNo || d.sequence_no || d.sequence || d.id || "").trim();
                return Boolean(sleeperIdStr);
            })
            .map(d => {
                const sleeperStr = String(d.sleeperNo || d.sequenceNo || d.sequence || "").trim();
                const derivedBench = sleeperStr.match(/^\d+/)?.[0] || "";
                const benchStr = String(d.benchGangNo || d.benchNo || "").trim() || derivedBench;
                const seqStr = d.sequenceNo || d.sequence || sleeperStr;

                const rawVis = String(d.visualReason || d.visual_reason || "").trim();
                const rawDim = String(d.dimReason || d.dim_reason || "").trim();
                const rawGen = String(d.reason || d.rejectionReason || "").trim();

                let visReason = "";
                let dimReasonVal = "";

                if (rawVis && !rawDim) {
                    if (dimOptions.includes(rawVis)) dimReasonVal = rawVis;
                    else visReason = rawVis;
                } else if (rawDim && !rawVis) {
                    if (visualOptions.includes(rawDim)) visReason = rawDim;
                    else dimReasonVal = rawDim;
                } else if (rawVis && rawDim) {
                    visReason = rawVis;
                    dimReasonVal = "";
                } else if (rawGen) {
                    if (dimOptions.includes(rawGen)) dimReasonVal = rawGen;
                    else visReason = rawGen;
                }

                return {
                    benchNo: benchStr,
                    sequence: seqStr,
                    sleeperNo: sleeperStr,
                    visualReason: visReason,
                    dimReason: dimReasonVal,
                    defectType: visReason ? "Visual" : (dimReasonVal ? "Dimensional" : "Visual")
                };
            });

        const uniqueMap = new Map();
        for (const item of parsed) {
            const label = formatSleeperLabel(item.benchNo, item.sleeperNo || item.sequence, typeForLabel).toUpperCase();
            if (!uniqueMap.has(label)) {
                uniqueMap.set(label, item);
            }
        }
        return Array.from(uniqueMap.values());
    };

    // Modify Must Spread Full Row
    useEffect(() => {
        if (initialData) {
            console.log("Fetched Time:", initialData.inspectionTime);
            setFormData({
                ...initialData,
                location: initialData.lineShedNo || initialData.location || activeContainer?.name || 'N/A',
                inspectionDate: formatFromBackendDatePart(initialData.inspectionDate || (initialData.dateTime ? initialData.dateTime.split('T')[0] : '') || initialData.date || ''),
                inspectionTime: initialData.inspectionTime?.slice(0, 5) || "",
                batch: initialData.batch || initialData.batchNo || '',
                gangNo: (initialData.gangNo || initialData.benchNo || '').toString().split(',').map(s => s.trim()).filter(Boolean),
                type: initialData.sleeperType || initialData.type || '',
                casting: formatFromBackendDatePart(initialData.castingDate || initialData.casting || initialData.dateOfCasting),
                process: initialData.processStatus || initialData.process || '',
                visualCheck: initialData.visualCheck || 'All OK',
                dimCheck: initialData.dimCheck || 'All OK',
                remarks: initialData.overallRemarks || initialData.remarks || '',
                defectiveSleeperDetails: parseDefectiveSleepers(
                    initialData.defectiveSleepers || initialData.defectiveSleeperDetails || [],
                    initialData.visualCheck,
                    initialData.dimCheck,
                    initialData.sleeperType || initialData.type || ''
                )
            });
        }
    }, [initialData, activeContainer]);

    // Fetch Dynamic Locations for current Unit
    useEffect(() => {
        const fetchLocations = async () => {
            const vId = contextVendorId || localStorage.getItem('vendorId');
            if (dutyUnit && vId) {
                try {
                    // Reusing the same service function updated for the new API
                    const sheds = await apiService.getPlantSheds(vId, dutyUnit);

                    let locList = [];
                    const data = sheds?.responseData || sheds;
                    if (typeof data === 'object' && data !== null) {
                        Object.values(data).forEach((ids) => {
                            if (Array.isArray(ids)) {
                                ids.forEach(id => {
                                    // Use the ID directly (e.g., "Line 1", "Shed 1") as per the new DTO
                                    locList.push(id);
                                });
                            }
                        });
                    }
                    setAvailableLocations(locList);
                    if (locList.length > 0 && !formData.location) {
                        setFormData(prev => ({ ...prev, location: locList[0] }));
                    }
                } catch (err) {
                    console.error("Error fetching locations in form:", err);
                }
            }
        };
        fetchLocations();
    }, [dutyUnit, contextVendorId]);

    const formatToBackendDate = (dateStr) => {
        if (!dateStr) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split("-");
            return `${day}/${month}/${year}`;
        }
        return dateStr;
    };

    // Fetch batches when casting date or location changes
    useEffect(() => {
        if (formData.casting && formData.location && formData.location !== 'N/A' && !initialData) {
            let isSubscribed = true;
            const fetchBatches = async () => {
                setIsFetchingFormOptions(true);
                try {
                    const formattedDate = formatToBackendDate(formData.casting);
                    // Pass selected plant id (dutyUnit) and location (from form)
                    const response = await apiService.getAllProductionBatches(
                        vendorId,
                        formattedDate,
                        dutyUnit,
                        formData.location
                    );
                    if (isSubscribed && response?.responseData) {
                        setBatches(response.responseData);
                        if (!response.responseData.includes(formData.batch)) {
                            setFormData(prev => ({ ...prev, batch: '', gangNo: '', type: '' }));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching batches:", error);
                } finally {
                    if (isSubscribed) setIsFetchingFormOptions(false);
                }
            };
            fetchBatches();
            return () => { isSubscribed = false; };
        }
    }, [formData.casting, formData.location, vendorId, initialData, dutyUnit]);

    // Fetch benches and populate existing inspection details when batch changes
    useEffect(() => {
        if (formData.batch && !initialData) {
            let isSubscribed = true;
            const loadBatchData = async () => {
                setIsFetchingFormOptions(true);
                try {
                    let allRecords = Array.isArray(existingEntries) ? [...existingEntries] : [];

                    try {
                        let fetchedList = [];
                        if (apiService.getDemouldingInspectionByBatch) {
                            const batchResp = await apiService.getDemouldingInspectionByBatch(formData.batch);
                            fetchedList = batchResp?.responseData || (Array.isArray(batchResp) ? batchResp : []);
                        }
                        if (!fetchedList || fetchedList.length === 0) {
                            const allResp = await apiService.getAllDemouldingInspection();
                            fetchedList = allResp?.responseData || (Array.isArray(allResp) ? allResp : []);
                        }
                        if (Array.isArray(fetchedList)) {
                            allRecords = [...allRecords, ...fetchedList];
                        }
                    } catch (err) {
                        console.error("Error fetching demoulding records:", err);
                    }

                    if (!isSubscribed) return;

                    const matchingRecords = allRecords.filter(r => 
                        String(r.batchNo || r.batch || r.batchNumber || '').trim().toLowerCase() === String(formData.batch).trim().toLowerCase()
                    );

                    if (matchingRecords.length > 0) {
                        const latestRecord = matchingRecords[matchingRecords.length - 1];
                        if (initialData?.id && latestRecord && latestRecord.id) {
                            setExistingRecordId(latestRecord.id);
                        }
                        const rawDefects = latestRecord.defectiveSleepers || latestRecord.defectiveSleeperDetails || latestRecord.defectiveSleeperList || latestRecord.defective_sleepers || latestRecord.defects || [];

                        const parsedDefects = parseDefectiveSleepers(
                            rawDefects,
                            latestRecord.visualCheck,
                            latestRecord.dimCheck,
                            latestRecord.sleeperType || latestRecord.type || formData.type
                        );
                        setFormData(prev => {
                            const hasActiveEdits = prev.defectiveSleeperDetails && prev.defectiveSleeperDetails.length > 0;
                            return {
                                ...prev,
                                visualCheck: latestRecord.visualCheck || prev.visualCheck || 'All OK',
                                dimCheck: latestRecord.dimCheck || prev.dimCheck || 'All OK',
                                process: latestRecord.processStatus || latestRecord.process || prev.process || '',
                                remarks: latestRecord.overallRemarks || latestRecord.remarks || prev.remarks || '',
                                defectiveSleeperDetails: hasActiveEdits ? prev.defectiveSleeperDetails : (parsedDefects.length > 0 ? parsedDefects : prev.defectiveSleeperDetails)
                            };
                        });
                    }

                    const response = await apiService.getAllProductionBenches(formData.batch, formData.location, formData.casting);
                    if (isSubscribed && response?.responseData) {
                        const newBenches = response.responseData;
                        setBenches(newBenches);

                        if (newBenches.length > 0) {
                            setFormData(prev => ({
                                ...prev,
                                gangNo: newBenches.map(String)
                            }));
                        }
                    }

                    let foundLoc = '';
                    Object.values(allWitnessedRecords || {}).forEach(records => {
                        const match = records.find(r => String(r.batchNo) === String(formData.batch));
                        if (match && match.location) foundLoc = match.location;
                    });
                    if (isSubscribed && foundLoc) {
                        setFormData(prev => ({ ...prev, location: foundLoc }));
                    }
                } catch (error) {
                    console.error("Error fetching benches:", error);
                } finally {
                    if (isSubscribed) setIsFetchingFormOptions(false);
                }
            };
            loadBatchData();
            return () => { isSubscribed = false; };
        } else if (!formData.batch) {
            setBenches([]);
        }
    }, [formData.batch, initialData, existingEntries, allWitnessedRecords]);

    // Fetch sleeper types when bench changes
    useEffect(() => {
        if (formData.batch && formData.gangNo && formData.gangNo.length > 0 && !initialData) {
            let isSubscribed = true;
            const fetchSleeperTypes = async () => {
                setIsFetchingFormOptions(true);
                try {
                    const response = await apiService.getAllProductionSleeperTypes(formData.batch, formData.gangNo[0], formData.location);
                    if (isSubscribed && response?.responseData) {
                        const newTypes = response.responseData;
                        setSleeperTypes(newTypes);

                        if (newTypes.length > 0) {
                            setFormData(prev => ({
                                ...prev,
                                type: newTypes[0]
                            }));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching sleeper types:", error);
                } finally {
                    if (isSubscribed) setIsFetchingFormOptions(false);
                }
            };
            fetchSleeperTypes();
            return () => { isSubscribed = false; };
        } else if (!formData.gangNo || formData.gangNo.length === 0) {
            setSleeperTypes([]);
        }
    }, [formData.batch, formData.gangNo, initialData]);
    
    // Fetch available sleepers when type changes
    useEffect(() => {
        if (formData.batch && formData.gangNo && formData.gangNo.length > 0 && formData.type) {
            let isSubscribed = true;
            const fetchSleepers = async () => {
                setIsFetchingSleepers(true);
                try {
                    const sleepersMap = {};
                    for (const bench of formData.gangNo) {
                        const response = await apiService.getAllProductionSleepers(
                            formData.batch, 
                            bench, 
                            formData.type, 
                            formData.location
                        );
                        if (response?.responseData && response.responseData.length > 0) {
                            sleepersMap[bench] = response.responseData;
                        } else {
                            sleepersMap[bench] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                        }
                    }
                    if (isSubscribed) {
                        setAvailableSleepersByBench(sleepersMap);
                    }
                } catch (error) {
                    console.error("Error fetching sleeper list:", error);
                    const defaultMap = {};
                    formData.gangNo.forEach(b => defaultMap[b] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
                    if (isSubscribed) {
                        setAvailableSleepersByBench(defaultMap);
                    }
                } finally {
                    if (isSubscribed) {
                        setIsFetchingSleepers(false);
                    }
                }
            };
            fetchSleepers();
            return () => { isSubscribed = false; };
        } else if (!formData.gangNo || formData.gangNo.length === 0) {
            setAvailableSleepersByBench({});
            setIsFetchingSleepers(false);
        }
    }, [formData.batch, formData.gangNo, formData.type, formData.location]);

    const handleChange = (field, value) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: value };

            if (field === 'batch' || field === 'gangNo') {
                setAvailableSleepersByBench({});
            }
            if (field === 'batch') {
                newState.gangNo = [];
                newState.type = '';
            }
            if (field === 'gangNo') {
                newState.type = '';
            }

            if (field === 'visualCheck' && value !== 'All OK') {
                newState.dimCheck = 'All OK';
            }
            if (field === 'dimCheck' && value !== 'All OK') {
                newState.visualCheck = 'All OK';
            }

            // Always reset selections when the check status changes so stale
            // entries (e.g. from a previous "All Rejected" auto-fill) don't linger.
            if (field === 'visualCheck' || field === 'dimCheck') {
                newState.defectiveSleeperDetails = [];
            }

            // Handle "All Rejected" transition automatically
            const isAllRejectedVisual = newState.visualCheck === 'All Rejected';
            const isAllRejectedDim = newState.dimCheck === 'All Rejected';

            if (isAllRejectedVisual || isAllRejectedDim) {
                const currentDecls = [];
                (newState.gangNo || []).forEach(bench => {
                    const seqs = availableSleepersByBench[bench] || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                    seqs.forEach(seq => {
                        currentDecls.push({
                            benchNo: bench,
                            sequence: seq,
                            sleeperNo: formatSleeperLabel(bench, seq),
                            visualReason: '',
                            dimReason: ''
                        });
                    });
                });
                newState.defectiveSleeperDetails = currentDecls;
            }
            // "All OK" for both: list already cleared above
            return newState;
        });

        // 🔥 Shared Shift logic: Update parent state when batch or bench changes
        if (field === 'batch') onShiftFieldChange('batchNo', value);
        if (field === 'gangNo') onShiftFieldChange('benchNo', value);
    };

    const [showValidation, setShowValidation] = useState(false);

    const handleSave = async () => {
        if (isSubmitting) return;

        const errors = [];
        const gangNoStr = Array.isArray(formData.gangNo) ? formData.gangNo.join(', ') : (formData.gangNo || '');
        if (!formData.batch) errors.push('Batch No.');
        if (!gangNoStr) errors.push(`${fieldLabel} No.`);
        if (!formData.type) errors.push('Sleeper Type');
        if (!formData.process) errors.push('Process Status');
        if (!formData.remarks) errors.push('Overall Remarks');

        // Validation: only require manual sleeper selection when checks are non-OK
        const bothAllOk = formData.visualCheck === 'All OK' && formData.dimCheck === 'All OK';
        if (!bothAllOk && formData.defectiveSleeperDetails.length === 0) {
            errors.push(`At least one ${fieldLabel} sleeper must be selected from the grid below`);
        }

        // If checks are not OK, ensure exactly one non-empty reason is filled per sleeper
        if (!bothAllOk && formData.defectiveSleeperDetails.length > 0) {
            const missingReasonItem = formData.defectiveSleeperDetails.find(d => {
                const vis = String(d.visualReason || "").trim();
                const dim = String(d.dimReason || "").trim();
                return !vis && !dim;
            });
            if (missingReasonItem) {
                const label = formatSleeperLabel(missingReasonItem.benchNo, missingReasonItem.sleeperNo || missingReasonItem.sequence);
                errors.push(`Defect reason is required for sleeper ${label}. Please select a reason from the dropdown in the table below.`);
            }
        }

        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidation(true);
            return;
        }
        setShowValidation(false);
        setValidationErrors([]);

        setIsSubmitting(true);

        try {
            // Build defective sleepers payload:
            // - "All OK": auto-send all 8 positions with empty reasons (backend requires non-empty array)
            // - Non-OK: use manually selected sleepers with their reasons
            const mappedDefectiveSleepers = bothAllOk
                ? (formData.gangNo || []).flatMap(bench => {
                    const seqs = availableSleepersByBench[bench] || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                    return seqs.map(seq => ({
                        benchGangNo: String(bench),
                        sequenceNo: String(seq),
                        sleeperNo: String(seq),
                        visualReason: "",
                        dimReason: ""
                    }));
                })
                : formData.defectiveSleeperDetails.map(item => ({
                    benchGangNo: String(item.benchNo || gangNoStr || ""),
                    sequenceNo: String(item.sequence || ""),
                    sleeperNo: String(formatSleeperLabel(item.benchNo || gangNoStr, item.sequence, formData.type) || ""),
                    visualReason: String(item.visualReason || ""),
                    dimReason: String(item.dimReason || "")
                }));

            // Payload matching demoulding-inspection-controller schema exactly
            const payload = {
                id: initialData?.id || undefined,
                lineShedNo: formData.location || activeContainer?.name || 'N/A',
                inspectionDate: formatToBackendDate(formData.inspectionDate),
                inspectionTime: formData.inspectionTime,
                castingDate: formatToBackendDate(formData.casting),
                batchNo: String(formData.batch || ''),
                benchNo: String(gangNoStr),
                sleeperType: formData.type || 'RT-1234',
                processStatus: formData.process || 'Satisfactory',
                visualCheck: formData.visualCheck || 'All OK',
                dimCheck: formData.dimCheck || 'All OK',
                overallRemarks: formData.remarks || '',
                createdBy: String(localStorage.getItem('userId') || "0"),
                updatedBy: String(localStorage.getItem('userId') || "0"),
                defectiveSleepers: mappedDefectiveSleepers
            };

            await onSave(payload);

            // Reset non-shared fields
            setFormData(prev => ({
                ...prev,
                inspectionDate: getSafeToday(),
                inspectionTime: getSafeNowTime(),
                process: '',
                visualCheck: 'All OK',
                dimCheck: 'All OK',
                defectiveSleeperDetails: [],
                remarks: ''
            }));
        } catch (err) {
            console.error("Error during save:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addDefectiveSleeper = () => {
        setFormData(prev => {
            const gangStr = Array.isArray(prev.gangNo) ? prev.gangNo.join(', ') : (prev.gangNo || '');
            return {
                ...prev,
                defectiveSleeperDetails: [...prev.defectiveSleeperDetails, {
                    benchNo: gangStr,
                    sequence: '',
                    sleeperNo: '',
                    visualReason: '',
                    dimReason: ''
                }]
            };
        });
    };

    const updateDefectiveSleeper = (index, field, value) => {
        setFormData(prev => {
            const updated = [...prev.defectiveSleeperDetails];
            if (!updated[index]) return prev;
            if (typeof field === 'object' && field !== null) {
                updated[index] = { ...updated[index], ...field };
            } else {
                updated[index] = { ...updated[index], [field]: value };
            }
            const b = updated[index].benchNo;
            const s = updated[index].sequence || updated[index].sleeperNo;
            updated[index].sleeperNo = formatSleeperLabel(b, s);
            return { ...prev, defectiveSleeperDetails: updated };
        });
    };

    const removeDefectiveSleeper = (index) => {
        setFormData(prev => ({
            ...prev,
            defectiveSleeperDetails: prev.defectiveSleeperDetails.filter((_, i) => i !== index)
        }));
    };

    const fieldLabel = (formData.location || '').toLowerCase().includes('line') ? 'Gang' : 'Bench';

    return (
        <div className="form-container" style={{ padding: '20px' }}>
            <div className="form-grid-standard" style={{ marginBottom: '20px' }}>
                <div className="form-field">
                    <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Location</label>
                    <select
                        className="form-input-standard"
                        value={formData.location}
                        onChange={e => handleChange('location', e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    >
                        <option value="N/A">-- Select --</option>
                        {availableLocations.length > 0 ? (
                            availableLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))
                        ) : (
                            <>
                                <option value="Long Line">Long Line</option>
                                <option value="Line 1">Line 1</option>
                                <option value="Line 2">Line 2</option>
                                <option value="Line 3">Line 3</option>
                                <option value="Shed 1">Shed 1</option>
                                <option value="Shed 2">Shed 2</option>
                                <option value="Shed 3">Shed 3</option>
                            </>
                        )}
                    </select>
                </div>

                {/* Properly Bound using VALUE and ONCHANGE */}
                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="dim-inspectionDateTime" style={{ fontSize: '11px', fontWeight: '700' }}>Inspection Date & Time <span className="required">*</span></label>
                    <input
                        id="dim-inspectionDateTime"
                        type="datetime-local"
                        className="form-input-standard"
                        value={`${formData.inspectionDate}T${formData.inspectionTime}`}
                        onChange={e => {
                            const [d, t] = e.target.value.split('T');
                            setFormData(prev => ({ ...prev, inspectionDate: d, inspectionTime: t }));
                        }}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="dim-casting" style={{ fontSize: '11px', fontWeight: '700' }}>Date of Casting <span className="required">*</span></label>
                    <input
                        id="dim-casting"
                        type="date"
                        className="form-input-standard"
                        value={formData.casting}
                        onChange={e => handleChange('casting', e.target.value)}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="dim-batch" style={{ fontSize: '11px', fontWeight: '700' }}>Batch No. <span className="required">*</span></label>
                    <select
                        id="dim-batch"
                        className="form-input-standard"
                        value={formData.batch}
                        onChange={e => handleChange('batch', e.target.value)}
                        style={{ border: (showValidation && !formData.batch) ? '2px solid #ef4444' : '', background: (showValidation && !formData.batch) ? '#fef2f2' : '' }}
                    >
                        <option value="">-- Select Batch --</option>
                        {batches.map((b, idx) => (
                            <option key={idx} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label style={{ fontSize: '11px', fontWeight: '700' }}>{fieldLabel} No. <span className="required">*</span></label>
                    <div ref={benchDropdownRef} style={{ position: 'relative', width: '100%' }}>
                        <div 
                            className="form-input-standard"
                            onClick={() => setIsBenchDropdownOpen(!isBenchDropdownOpen)}
                            style={{ 
                                cursor: 'pointer', 
                                border: (showValidation && (!formData.gangNo || formData.gangNo.length === 0)) ? '2px solid #ef4444' : '', 
                                background: (showValidation && (!formData.gangNo || formData.gangNo.length === 0)) ? '#fef2f2' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                minHeight: '38px',
                                padding: '8px 12px',
                                userSelect: 'none'
                            }}
                        >
                            <span style={{ 
                                color: (formData.gangNo && formData.gangNo.length > 0) ? '#1e293b' : '#64748b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: '13px'
                            }}>
                                {(formData.gangNo && formData.gangNo.length > 0) ? formData.gangNo.join(', ') : '-- Select Bench --'}
                            </span>
                            <span style={{ fontSize: '10px' }}>▼</span>
                        </div>
                        
                        {isBenchDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                marginTop: '4px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                zIndex: 50,
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                            }}>
                                {benches.length === 0 ? (
                                    <div style={{ padding: '8px 12px', color: '#64748b', fontSize: '12px' }}>No benches available</div>
                                ) : (
                                    <>
                                        <div
                                            onClick={() => {
                                                const allSelected = formData.gangNo && formData.gangNo.length === benches.length;
                                                if (allSelected) {
                                                    handleChange('gangNo', []);
                                                } else {
                                                    handleChange('gangNo', benches.map(String));
                                                }
                                            }}
                                            style={{
                                                padding: '8px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                background: '#f8fafc',
                                                borderBottom: '1px solid #cbd5e1'
                                            }}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={formData.gangNo && formData.gangNo.length === benches.length && benches.length > 0}
                                                readOnly
                                                style={{ margin: 0, cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 'bold' }}>Select All</span>
                                        </div>
                                        {benches.map((b, idx) => {
                                        const isChecked = formData.gangNo && formData.gangNo.includes(String(b));
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => {
                                                    let newSelected = [...(formData.gangNo || [])];
                                                    const valStr = String(b);
                                                    if (newSelected.includes(valStr)) {
                                                        newSelected = newSelected.filter(v => v !== valStr);
                                                    } else {
                                                        newSelected.push(valStr);
                                                    }
                                                    handleChange('gangNo', newSelected);
                                                }}
                                                style={{
                                                    padding: '8px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    background: isChecked ? '#f0f9ff' : '#fff',
                                                    borderBottom: idx < benches.length - 1 ? '1px solid #f1f5f9' : 'none'
                                                }}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    readOnly
                                                    style={{ margin: 0, cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '13px', color: '#1e293b' }}>{b}</span>
                                            </div>
                                        );
                                    })
                                    }
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="dim-type" style={{ fontSize: '11px', fontWeight: '700' }}>Sleeper Type <span className="required">*</span></label>
                    <select
                        id="dim-type"
                        className="form-input-standard"
                        value={formData.type}
                        onChange={e => handleChange('type', e.target.value)}
                        style={{ border: (showValidation && !formData.type) ? '2px solid #ef4444' : '', background: (showValidation && !formData.type) ? '#fef2f2' : '' }}
                    >
                        <option value="">-- Select Type --</option>
                        {sleeperTypes.map((t, idx) => (
                            <option key={idx} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="dim-process" style={{ fontSize: '11px', fontWeight: '700' }}>Process Status <span className="required">*</span></label>
                    <select id="dim-process" value={formData.process} className="form-input-standard" onChange={e => handleChange('process', e.target.value)} style={{ border: (showValidation && !formData.process) ? '2px solid #ef4444' : '', background: (showValidation && !formData.process) ? '#fef2f2' : '' }}>
                        <option value="">-- Select --</option>
                        <option value="Satisfactory">Satisfactory</option>
                        <option value="Not Satisfactory">Not Satisfactory</option>
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="dim-visual" style={{ fontSize: '11px', fontWeight: '700' }}>Visual Check <span className="required">*</span></label>
                    <select id="dim-visual" value={formData.visualCheck} className="form-input-standard" onChange={e => handleChange('visualCheck', e.target.value)}>
                        <option value="All OK">All OK</option>
                        <option value="Partially OK">Partially OK</option>
                        <option value="All Rejected">All Rejected</option>
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="dim-dim" style={{ fontSize: '11px', fontWeight: '700' }}>Dim. Check <span className="required">*</span></label>
                    <select id="dim-dim" value={formData.dimCheck} className="form-input-standard" onChange={e => handleChange('dimCheck', e.target.value)}>
                        <option value="All OK">All OK</option>
                        <option value="Partially OK">Partially OK</option>
                        <option value="All Rejected">All Rejected</option>
                    </select>
                </div>

                <div className="form-field form-field-full">
                    <label htmlFor="dim-remarks" style={{ fontSize: '11px', fontWeight: '700' }}>Overall Findings / Remarks <span className="required">*</span></label>
                    <input
                        id="dim-remarks"
                        type="text"
                        placeholder="Enter observations"
                        className="form-input-standard"
                        value={formData.remarks}
                        onChange={e => handleChange('remarks', e.target.value)}
                        style={{ border: (showValidation && !formData.remarks) ? '2px solid #ef4444' : '', background: (showValidation && !formData.remarks) ? '#fef2f2' : '' }}
                    />
                </div>
            </div>

            {/* Defective Section: Only shown when at least one check is non-OK */}
            {(formData.visualCheck !== 'All OK' || formData.dimCheck !== 'All OK') && (
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '15px', fontWeight: '800' }}>
                                DEFECTIVE SLEEPERS — {fieldLabel.toUpperCase()} {(formData.gangNo && formData.gangNo.length > 0) ? formData.gangNo.join(', ') : '—'}
                            </h4>
                        </div>
                        <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic', fontWeight: '700', background: '#fef2f2', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                            {formData.visualCheck === 'All Rejected' || formData.dimCheck === 'All Rejected'
                                ? '* All sleepers are marked rejected'
                                : '⚠ Required: Click sleepers to mark as defective'}
                        </div>
                    </div>

                    {(isFetchingSleepers || isFetchingFormOptions) ? (
                        <div style={{
                            padding: '40px 24px',
                            textAlign: 'center',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px dashed #cbd5e1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            minHeight: '160px',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                border: '3px solid #e2e8f0',
                                borderTop: '3px solid #ef4444',
                                borderRadius: '50%',
                                animation: 'demouldingSpin 0.75s linear infinite'
                            }}></div>
                            <style>{`
                                @keyframes demouldingSpin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                                    Fetching Sleepers...
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                                    Please wait while sleeper numbers are being loaded
                                </div>
                            </div>
                        </div>
                    ) : (
                        (formData.gangNo || []).map(bench => (
                            <div key={bench} style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px', color: '#334155', textTransform: 'uppercase' }}>
                                    {fieldLabel} {bench}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '10px',
                                    padding: '16px',
                                    background: '#f8fafc',
                                    borderRadius: '12px',
                                    border: '1px dashed #cbd5e1',
                                }}>
                                    {(availableSleepersByBench[bench] || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']).map((seq, idx) => {
                                        const matchesSleeper = (d) => {
                                            const dSleeper = String(d.sleeperNo || d.sequence || '').trim().toUpperCase();
                                            const targetSeq = String(seq || '').trim().toUpperCase();
                                            const dBench = String(d.benchNo || '').trim();
                                            const targetBench = String(bench || '').trim();

                                            if (dSleeper !== '' && dSleeper === targetSeq) {
                                                return true;
                                            }

                                            const dFormatted = formatSleeperLabel(dBench, dSleeper).toUpperCase();
                                            const tFormatted = formatSleeperLabel(targetBench, targetSeq).toUpperCase();
                                            if (dFormatted !== '' && dFormatted === tFormatted) {
                                                return true;
                                            }

                                            const dSeq = String(d.sequence || d.sequenceNo || '').trim().toUpperCase();
                                            if (dSeq !== '' && (dSeq === targetSeq || dSeq === targetSeq.replace(/^\d+/, ''))) {
                                                const dClean = dSleeper.replace(/^[^\d]*/, '').replace(/^\d+/, '');
                                                const tClean = targetSeq.replace(/^[^\d]*/, '').replace(/^\d+/, '');
                                                const benchMatch = !dBench || dBench === targetBench || dBench.split(',').map(s => s.trim()).includes(targetBench) || dSleeper.startsWith(targetBench);
                                                if (benchMatch && (dSleeper === targetSeq || (dClean !== '' && dClean === tClean))) {
                                                    return true;
                                                }
                                            }

                                            return false;
                                        };

                                        const isDefective = formData.defectiveSleeperDetails.some(matchesSleeper);

                                        const isAllRejectedVisual = formData.visualCheck === 'All Rejected';
                                        const isAllRejectedDim = formData.dimCheck === 'All Rejected';
                                        const isForced = isAllRejectedVisual || isAllRejectedDim;

                                        const handleClick = () => {
                                            if (isForced) return;

                                            if (isDefective) {
                                                const displayLabel = formatSleeperLabel(bench, seq);
                                                setConfirmDeselectTarget({
                                                    sleeperNo: displayLabel,
                                                    benchNo: bench,
                                                    sequence: seq,
                                                    matcher: matchesSleeper
                                                });
                                            } else {
                                                const displayLabel = formatSleeperLabel(bench, seq);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    defectiveSleeperDetails: [...prev.defectiveSleeperDetails, {
                                                        benchNo: bench,
                                                        sequence: seq,
                                                        sleeperNo: displayLabel,
                                                        visualReason: '',
                                                        dimReason: '',
                                                        defectType: 'Visual'
                                                    }]
                                                }));
                                            }
                                        };

                                        return (
                                            <div
                                                key={idx}
                                                onClick={handleClick}
                                                style={{
                                                    width: '56px',
                                                    height: '42px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '800',
                                                    cursor: isForced ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    background: (isDefective || isForced) ? '#fee2e2' : '#fff',
                                                    color: (isDefective || isForced) ? '#b91c1c' : '#64748b',
                                                    borderWidth: '2px',
                                                    borderStyle: 'solid',
                                                    borderColor: (isDefective || isForced) ? '#ef4444' : '#e2e8f0',
                                                    boxShadow: (isDefective || isForced) ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none',
                                                    transform: (isDefective || isForced) ? 'scale(1.05)' : 'scale(1)'
                                                }}
                                            >
                                                {seq}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Defect Reasons Table */}
                    {formData.defectiveSleeperDetails.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '10px 12px', width: '90px' }}>Sleeper</th>
                                        {/* Logic: Show Visual reason if not OK, UNLESS it's Partial + the other is All Rejected */}
                                        {(formData.visualCheck !== 'All OK' && !(formData.visualCheck === 'Partially OK' && formData.dimCheck === 'All Rejected')) && (
                                            <th style={{ padding: '10px 12px' }}>Visual Defect Reason</th>
                                        )}
                                        {/* Logic: Show Dim reason if not OK, UNLESS it's Partial + the other is All Rejected */}
                                        {(formData.dimCheck !== 'All OK' && !(formData.dimCheck === 'Partially OK' && formData.visualCheck === 'All Rejected')) && (
                                            <th style={{ padding: '10px 12px' }}>Dimensional Defect Reason</th>
                                        )}
                                        <th style={{ padding: '10px 12px', width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.defectiveSleeperDetails.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px', fontWeight: '800', color: '#1e293b' }}>
                                                {item.benchNo ? `${fieldLabel} ${item.benchNo} - ` : ''}{formatSleeperLabel(item.benchNo, item.sleeperNo || item.sequence)}
                                            </td>

                                            {(formData.visualCheck !== 'All OK' && !(formData.visualCheck === 'Partially OK' && formData.dimCheck === 'All Rejected')) && (
                                                <td style={{ padding: '8px 12px' }}>
                                                    <select
                                                        className="form-input-standard"
                                                        style={{ width: '100%', fontSize: '11px', height: '32px' }}
                                                        value={item.visualReason || ''}
                                                        onChange={e => {
                                                            // Visual dropdown always saves to visualReason
                                                            updateDefectiveSleeper(idx, { visualReason: e.target.value, dimReason: '' });
                                                        }}
                                                    >
                                                        <option value="">-- Select Visual Reason --</option>
                                                        <option value="Surface Defect">Surface Defect</option>
                                                        <option value="Honeycomb">Honeycomb</option>
                                                        <option value="Dowel Missing / Tilt / Sink">Dowel Missing / Tilt / Sink</option>
                                                        <option value="Insert Missing / Tilt / Sink">Insert Missing / Tilt / Sink</option>
                                                        <option value="Crack">Crack</option>
                                                        <option value="Outer Gauge">Outer Gauge</option>
                                                        <option value="Rail Seat">Rail Seat</option>
                                                        <option value="Toe Gap">Toe Gap</option>
                                                        <option value="Rail Seat Slope">Rail Seat Slope</option>
                                                        <option value="Height Gauge">Height Gauge</option>
                                                        <option value="Length of Sleeper">Length of Sleeper</option>
                                                        {Boolean(item.visualReason && !['Surface Defect', 'Honeycomb', 'Dowel Missing / Tilt / Sink', 'Insert Missing / Tilt / Sink', 'Crack', 'Outer Gauge', 'Rail Seat', 'Toe Gap', 'Rail Seat Slope', 'Height Gauge', 'Length of Sleeper'].includes(item.visualReason)) && (
                                                            <option value={item.visualReason}>{item.visualReason}</option>
                                                        )}
                                                    </select>
                                                </td>
                                            )}

                                            {(formData.dimCheck !== 'All OK' && !(formData.dimCheck === 'Partially OK' && formData.visualCheck === 'All Rejected')) && (
                                                <td style={{ padding: '8px 12px' }}>
                                                    <select
                                                        className="form-input-standard"
                                                        style={{ width: '100%', fontSize: '11px', height: '32px' }}
                                                        value={item.dimReason || ''}
                                                        onChange={e => {
                                                            // Dim dropdown always saves to dimReason
                                                            updateDefectiveSleeper(idx, { dimReason: e.target.value, visualReason: '' });
                                                        }}
                                                    >
                                                        <option value="">-- Select Dim. Reason --</option>
                                                        <option value="Outer Gauge">Outer Gauge</option>
                                                        <option value="Rail Seat">Rail Seat</option>
                                                        <option value="Toe Gap">Toe Gap</option>
                                                        <option value="Rail Seat Slope">Rail Seat Slope</option>
                                                        <option value="Height Gauge">Height Gauge</option>
                                                        <option value="Length of Sleeper">Length of Sleeper</option>
                                                        <option value="Surface Defect">Surface Defect</option>
                                                        <option value="Honeycomb">Honeycomb</option>
                                                        <option value="Dowel Missing / Tilt / Sink">Dowel Missing / Tilt / Sink</option>
                                                        <option value="Insert Missing / Tilt / Sink">Insert Missing / Tilt / Sink</option>
                                                        <option value="Crack">Crack</option>
                                                        {Boolean(item.dimReason && !['Outer Gauge', 'Rail Seat', 'Toe Gap', 'Rail Seat Slope', 'Height Gauge', 'Length of Sleeper', 'Surface Defect', 'Honeycomb', 'Dowel Missing / Tilt / Sink', 'Insert Missing / Tilt / Sink', 'Crack'].includes(item.dimReason)) && (
                                                            <option value={item.dimReason}>{item.dimReason}</option>
                                                        )}
                                                    </select>
                                                </td>
                                            )}

                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                {/* Show remove button always — not just for Partially OK */}
                                                {!(formData.visualCheck === 'All Rejected' || formData.dimCheck === 'All Rejected') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeselectTarget({
                                                            sleeperNo: formatSleeperLabel(item.benchNo, item.sleeperNo || item.sequence),
                                                            index: idx,
                                                            type: 'table'
                                                        })}
                                                        style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                                                    >×</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="form-actions-row">
                <button 
                    className="toggle-btn" 
                    type="button" 
                    onClick={handleSave} 
                    disabled={isSubmitting}
                    style={{ 
                        minWidth: '160px', 
                        height: '42px',
                        opacity: isSubmitting ? 0.65 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <span style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                display: 'inline-block',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                            Saving...
                        </>
                    ) : (initialData ? 'Update Record' : 'Save Record')}
                </button>
                {initialData && <button className="toggle-btn secondary" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>}
            </div>

            {/* Confirmation Modal for Deselecting Sleeper */}
            {confirmDeselectTarget && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div className="fade-in" style={{
                        maxWidth: '420px',
                        width: '100%',
                        background: '#fff',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            background: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px auto',
                            color: '#ef4444',
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }}>⚠</div>

                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>
                            Confirm Deselection
                        </h3>

                        <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', color: '#475569', lineHeight: '1.5' }}>
                            Are you sure to deselect Sleeper <strong style={{ color: '#ef4444', fontWeight: '800' }}>{confirmDeselectTarget.sleeperNo}</strong>?
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setConfirmDeselectTarget(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    color: '#475569',
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirmDeselectTarget.type === 'grid' && confirmDeselectTarget.matcher) {
                                        const matcher = confirmDeselectTarget.matcher;
                                        setFormData(prev => ({
                                            ...prev,
                                            defectiveSleeperDetails: prev.defectiveSleeperDetails.filter(d => !matcher(d))
                                        }));
                                    } else if (confirmDeselectTarget.type === 'table' && typeof confirmDeselectTarget.index === 'number') {
                                        removeDefectiveSleeper(confirmDeselectTarget.index);
                                    }
                                    setConfirmDeselectTarget(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontWeight: '800',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Validation Errors Modal */}
            {validationErrors.length > 0 && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.45)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                    padding: '24px'
                }}>
                    <div className="fade-in" style={{
                        maxWidth: '400px',
                        width: '100%',
                        background: '#fff',
                        borderRadius: '24px',
                        padding: '2rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto',
                            color: '#ef4444',
                            fontSize: '20px'
                        }}>!</div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>Incomplete Data</h3>
                        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                            The following mandatory fields are required before saving:
                        </p>

                        <div style={{
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '2rem',
                            textAlign: 'left',
                            border: '1px solid #f1f5f9'
                        }}>
                            <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#dc2626', fontSize: '0.875rem', fontWeight: '700', lineHeight: '1.8' }}>
                                {validationErrors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => setValidationErrors([])}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '14px',
                                border: 'none',
                                background: '#1e293b',
                                color: '#fff',
                                fontWeight: '800',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(30, 41, 59, 0.2)',
                                transition: 'all 0.2s'
                            }}
                        >Understand & Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemouldingForm;
