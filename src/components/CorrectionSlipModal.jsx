import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateRawMaterialCertificate,
  generateProcessMaterialCertificate,
  generateFinalProductCertificate,
  getRmIcEditData,
  getProcessIcEditData,
  getFinalIcEditData,
} from '../services/certificateService';
import { fetchCorrectionSlip } from '../services/correctionSlipService';
import { getStoredUser } from '../services/authService';

import Notification from './Notification';
import CorrectionSlipPDF from './CorrectionSlipPDF';

/* ─── helpers ─── */
const getProductType = (row) => {
  const pt = (row.product_type || row.productType || '').toLowerCase();
  if (pt.includes('raw') || pt.includes('rm')) return 'RM';
  if (pt.includes('final') || pt.includes('fp') || pt.includes('final product')) return 'FINAL';
  return 'PROCESS';
};

/* ─── Per-IC-type field label maps (sourced from backend DTOs) ─── */

const RM_FIELD_MAP = {
  certificateNo:        'Certificate No.',
  certificateDate:      'Certificate Date',
  bookNo:               'Book No.',
  setNo:                'Set No.',
  offeredInstNo:        'Offered Installment No.',
  passedInstNo:         'Passed Installment No.',
  contractor:           'Contractor',
  manufacturer:         'Manufacturer',
  placeOfInspection:    'Place of Inspection',
  contractRef:          'Contract Ref & Date (Rly.)',
  contractorPo:         'Contractor PO No. & Date',
  billPayingOfficer:    'Bill Paying Officer',
  consigneeRailway:     'Consignee (Railway)',
  consigneeManufacturer:'Consignee (Manufacturer)',
  purchasingAuthority:  'Purchasing Authority (Railway)',
  description:          'Description',
  ercType:              'ERC Type',
  drgNo:                'Drawing No.',
  specNo:               'Specification No.',
  qapNo:                'QAP No.',
  inspectionType:       'Type of Inspection',
  chpClause:            'CHP Clause No.',
  contractChpReq:       'Contract CHP Requirement',
  detailsOfInspection:  'Details of Inspection',
  result:               'Result',
  qtyCleared:           'Qty. Cleared',
  qtyRejected:          'Qty. Rejected',
  remarks:              'Remarks',
  dateOfCall:           'Date of Call',
  noOfVisits:           'No. of Visits',
  dateOfInspection:     'Date of Inspection',
  sealingPattern:       'Sealing / Stamping Pattern',
  sealFacsimile:        'Facsimile of Seal/Stamp',
  inspectingEngineer:   'Inspecting Engineer',
};

const PROCESS_FIELD_MAP = {
  certificateNo:        'Certificate No.',
  certificateDate:      'Certificate Date',
  bookNo:               'Book No.',
  setNo:                'Set No.',
  placeOfInspection:    'Place of Inspection',
  offeredInstNo:        'Offered Installment No.',
  passedInstNo:         'Passed Installment No.',
  contractor:           'Contractor',
  manufacturer:         'Manufacturer',
  contractRef:          'Contract Ref & Date (Rly.)',
  poDetails:            'PO No. & Date (Contractor)',
  billPayingOfficer:    'Bill Paying Officer',
  consigneeRailway:     'Consignee (Railway)',
  consigneeManufacturer:'Consignee (Manufacturer)',
  purchasingAuthority:  'Purchasing Authority (Railway)',
  maNumberAndDate:      'MA Number & Date',
  facsimileText:        'Facsimile Text',
  reasonsForRejection:  'Reasons for Rejection',
  inspectingEngineer:   'Inspecting Engineer',
  datesOfInspection:    'Dates of Inspection',
  description:          'Description',
  drgNo:                'Drawing No.',
  specNo:               'Specification No.',
  qapNo:                'QAP No.',
  chpClause:            'CHP Clause No.',
  inspectionType:       'Type of Inspection',
  ercType:              'ERC Type',
  reference:            'Reference',
  dateOfCall:           'Date of Call',
  inspectionDate:       'Inspection Date',
  manDays:              'Man-Days',
  noOfVisits:           'No. of Visits',
  sealingPattern:       'Sealing / Stamping Pattern',
};

const FINAL_FIELD_MAP = {
  certificateNo:          'Certificate No.',
  certificateDate:        'Certificate Date',
  bookNo:                 'Book No.',
  setNo:                  'Set No.',
  offeredInstNo:          'Offered Installment No.',
  passedInstNo:           'Passed Installment No.',
  contractor:             'Contractor',
  placeOfInspection:      'Place of Inspection',
  contractRef:            'Contract Ref & Date (Rly.)',
  contractRefDate:        'Contract Ref Date',
  billPayingOfficer:      'Bill Paying Officer',
  consignee:              'Consignee',
  consigneeRailway:       'Consignee (Railway)',
  consigneeManufacturer:  'Consignee (Manufacturer)',
  maNumberAndDate:        'MA Number & Date',
  purchasingAuthority:    'Purchasing Authority (Railway)',
  itemNo:                 'Item No.',
  description:            'Description',
  totalLots:              'Total Lots',
  qtyOnOrder:             'Qty. on Order',
  qtyOfferedPreviously:   'Qty. Offered Previously',
  qtyPassedPreviously:    'Qty. Passed Previously',
  qtyNowOffered:          'Qty. Now Offered',
  qtyNowPassed:           'Qty. Now Passed',
  qtyNowRejected:         'Qty. Now Rejected',
  qtyStillDue:            'Qty. Still Due',
  quantityNowPassedText:  'Qty. Now Passed (Text)',
  remarks:                'Remarks',
  trRecDate:              'TR Rec. Date',
  noOfItemsChecked:       'No. of Items Checked',
  dateOfCall:             'Date of Call',
  noOfVisits:             'No. of Visits',
  inspectionDates:        'Inspection Dates',
  datesOfInspection:      'Dates of Inspection',
  sealingPattern:         'Sealing / Stamping Pattern',
  facsimileText:          'Facsimile Text',
  reasonsForRejection:    'Reasons for Rejection',
  inspectingEngineer:     'Inspecting Engineer',
  rmIcNo:                 'RM IC No.',
  rmIcDate:               'RM IC Date',
  processIcNo:            'Process IC No.',
  processIcDate:          'Process IC Date',
  rejectedReason:         'Rejected Reason',
};

const getFieldMap = (productType) => {
  if (productType === 'RM') return RM_FIELD_MAP;
  if (productType === 'FINAL') return FINAL_FIELD_MAP;
  return PROCESS_FIELD_MAP;
};


const emptyRow = () => ({ columnName: '', readAs: '', insteadOf: '', id: Date.now() + Math.random() });

/* ─── Custom Field Dropdown ─── */
const FieldDropdown = ({ options, value, onChange, disabled, placeholder = '— Select field —' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find(o => o.key === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        style={{
          width: '100%', height: '32px', padding: '0 28px 0 10px',
          background: disabled ? '#f9fafb' : '#fff',
          border: `1.5px solid ${open ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: '6px', fontSize: '12.5px', fontWeight: '500',
          color: selected ? '#1f2937' : '#9ca3af',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: '36px', left: 0, right: 0, zIndex: 9999,
          background: '#fff', border: '1.5px solid #dbeafe', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
          maxHeight: '240px', display: 'flex', flexDirection: 'column',
          minWidth: '220px',
        }}>
          {/* Search */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search fields..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: '26px', padding: '0 8px',
                border: '1px solid #e2e8f0', borderRadius: '5px',
                fontSize: '12px', outline: 'none', boxSizing: 'border-box', color: '#374151',
              }}
            />
          </div>
          {/* Options */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div
              onClick={() => { onChange(''); setSearch(''); setOpen(false); }}
              style={{
                padding: '7px 12px', fontSize: '12.5px', color: '#9ca3af',
                cursor: 'pointer', fontStyle: 'italic',
                borderBottom: '1px solid #f3f4f6',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              — Select field —
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                No fields found
              </div>
            ) : filtered.map(opt => (
              <div
                key={opt.key}
                onClick={() => { onChange(opt.key); setSearch(''); setOpen(false); }}
                style={{
                  padding: '7px 12px', fontSize: '12.5px',
                  cursor: 'pointer', fontWeight: value === opt.key ? '600' : '400',
                  color: value === opt.key ? '#1e40af' : '#374151',
                  background: value === opt.key ? '#eff6ff' : 'transparent',
                  borderLeft: value === opt.key ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (value !== opt.key) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (value !== opt.key) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


/* ─── styles ─── */
const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
  },
  modal: {
    background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '900px',
    maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '18px 24px',
    borderRadius: '12px 12px 0 0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  body: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  footer: {
    padding: '16px 24px', borderTop: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f9fafb',
    borderRadius: '0 0 12px 12px',
  },
  sectionTitle: {
    fontSize: '15px', fontWeight: '700', color: '#1e3a5f',
    borderLeft: '4px solid #3b82f6', paddingLeft: '10px', marginBottom: '12px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: {
    background: '#f1f5f9', padding: '8px 12px', textAlign: 'left',
    border: '1px solid #d1d5db', fontWeight: '600', color: '#374151',
  },
  td: { padding: '8px 12px', border: '1px solid #e5e7eb', verticalAlign: 'middle', color: '#4b5563' },
  tdVal: { padding: '8px 12px', border: '1px solid #e5e7eb', fontWeight: '500', color: '#1f2937' },
  inputBase: {
    width: '100%', padding: '5px 9px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box',
    height: '32px', color: '#1f2937',
    transition: 'border-color 0.15s',
  },
  select: {
    width: '100%', padding: '4px 28px 4px 9px', border: '1.5px solid #d1d5db',
    borderRadius: '6px', fontSize: '12.5px', background: '#fff', cursor: 'pointer',
    height: '32px', color: '#1f2937', fontWeight: '500',
    appearance: 'none', WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  btnPrimary: {
    padding: '9px 20px', background: '#1e40af', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  btnSuccess: {
    padding: '9px 20px', background: '#15803d', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  btnOutline: {
    padding: '9px 20px', background: '#fff', color: '#374151', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  btnDanger: {
    padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5',
    borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
  },
  addRowBtn: {
    padding: '6px 14px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe',
    borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '600',
  },
  loader: { textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '14px' },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
    padding: '12px 16px', color: '#b91c1c', fontSize: '13px',
  },
};

/* ─── main component ─── */
const CorrectionSlipModal = ({ row, onClose }) => {
  const [icData, setIcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [icError, setIcError] = useState('');
  const [corrections, setCorrections] = useState([emptyRow()]);

  const [issuing, setIssuing] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [showPDF, setShowPDF] = useState(false);

  const callNo = row?.call_no || '';
  // Backend expects the raw call number (e.g. ER-06170001), NOT the formatted IC number (W/ER-06170001/Visma)
  const icNumber = callNo;
  const productType = getProductType(row);
  const currentUser = getStoredUser();

  const showNotif = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  /* fetch IC certificate + IC Edit data (merged) */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setIcError('');
      try {
        // 1. Fetch certificate data (primary source)
        let certData;
        if (productType === 'RM') {
          certData = await generateRawMaterialCertificate(icNumber);
          certData = certData?.responseData || certData;
        } else if (productType === 'FINAL') {
          certData = await generateFinalProductCertificate(icNumber);
        } else {
          certData = await generateProcessMaterialCertificate(icNumber);
        }

        // 2. Fetch IC Edit data using the full IC number (certificateNo) — that's how IC Edit tables store the key
        // The RM certificate API may return certNo nested differently, check both
        const rawCertNo = certData?.certificateNo || certData?.certNo || certData?.icNumber;
        const fullIcNumber = rawCertNo || icNumber;
        console.log('[CorrectionSlip] certData.certificateNo =', certData?.certificateNo, '| fullIcNumber =', fullIcNumber);

        let editData = null;
        try {
          if (productType === 'RM') {
            editData = await getRmIcEditData(fullIcNumber);
          } else if (productType === 'FINAL') {
            editData = await getFinalIcEditData(fullIcNumber);
          } else {
            editData = await getProcessIcEditData(fullIcNumber);
          }
          console.log('[CorrectionSlip] editData =', editData);
        } catch (_) { /* IC Edit is optional — proceed without it */ }

        // 3. Merge: IC Edit fields override/fill gaps by type
        let editOverrides = {};
        if (editData) {
          // Common fields across all 3 IC types
          editOverrides = {
            bookNo:              editData.bookNo              || certData?.bookNo,
            setNo:               editData.setNo               || certData?.setNo,
            offeredInstNo:       editData.offeredInstallmentNo || certData?.offeredInstNo,
            passedInstNo:        editData.passedInstallmentNo  || certData?.passedInstNo,
            description:         editData.description          || certData?.description,
            purchasingAuthority: editData.purchasingAuthority  || certData?.purchasingAuthority,
            icEditDate:          editData.createdAt            || null,
          };

          if (productType === 'RM') {
            // RmIcEditDTO specific fields
            Object.assign(editOverrides, {
              manufacturer:          editData.manufacturer         || certData?.manufacturer,
              drgNo:                 editData.drawingNo            || certData?.drgNo,
              contractorPo:          editData.contractorPo         || certData?.contractorPo,
              consigneeRailway:      editData.consigneeRailway     || certData?.consigneeRailway,
              consigneeManufacturer: editData.consigneeManufacturer|| certData?.consigneeManufacturer,
              specNo:                editData.specNo               || certData?.specNo,
              qapNo:                 editData.qapNo                || certData?.qapNo,
              chpClause:             editData.chpClause            || certData?.chpClause,
            });
          } else if (productType === 'PROCESS') {
            // ProcessIcEditDTO specific fields
            Object.assign(editOverrides, {
              consigneeRailway:  editData.consignee        || certData?.consigneeRailway,
              contractRef:       editData.contractRef      || certData?.contractRef,
              maNumberAndDate:   editData.maNumberAndDate  || certData?.maNumberAndDate,
              billPayingOfficer: editData.billPayingOfficer|| certData?.billPayingOfficer,
              qapNo:             editData.qapNo            || certData?.qapNo,
            });
          } else if (productType === 'FINAL') {
            // FinalIcEditDTO specific fields
            Object.assign(editOverrides, {
              consigneeRailway:     editData.consignee          || certData?.consigneeRailway,
              maNumberAndDate:      editData.maNumberAndDate     || certData?.maNumberAndDate,
              qtyOfferedPreviously: editData.cummQtyOfferedPrev  || certData?.qtyOfferedPreviously,
              qtyPassedPreviously:  editData.qtyPrevPassed       || certData?.qtyPassedPreviously,
              qtyStillDue:          editData.qtyStillDue         || certData?.qtyStillDue,
              trRecDate:            editData.trRecDate            || certData?.trRecDate,
            });
          }
        }

        const merged = { ...certData, ...editOverrides };

        setIcData(merged);
      } catch (err) {
        setIcError('Could not load IC data: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    if (icNumber) load();
  }, [icNumber, productType]);

  /* restore saved corrections */
  useEffect(() => {
    const restore = async () => {
      const saved = await fetchCorrectionSlip(callNo);
      if (saved && saved.length > 0) {
        setCorrections(saved.map(s => ({
          id: Date.now() + Math.random(),
          columnName: s.columnName || s.column_name || '',
          readAs: s.readAs || s.read_as || '',
          insteadOf: s.insteadOf || s.instead_of || '',
        })));
      }
    };
    if (callNo) restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callNo]);

  /* ── flatten IC fields using the correct per-type map ── */
  const fieldMap = getFieldMap(productType);
  const icFields = icData
    ? Object.entries(fieldMap)
        .filter(([key]) => {
          const val = icData[key];
          // include if value exists and is not empty (allow 0 and false)
          return val !== undefined && val !== null && val !== '' && !Array.isArray(val);
        })
        .map(([key, label]) => ({ key, label, value: String(icData[key]) }))
    : [];

  /* ── row helpers ── */
  const updateRow = (id, field, value) => {
    setCorrections(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // auto-fill insteadOf when column selected
      if (field === 'columnName') {
        const found = icFields.find(f => f.key === value);
        updated.insteadOf = found ? found.value : '';
      }
      return updated;
    }));
  };

  const addRow = () => setCorrections(prev => [...prev, emptyRow()]);
  const removeRow = (id) => {
    if (corrections.length === 1) {
      showNotif('At least one correction row is required.', 'warning');
      return;
    }
    setCorrections(prev => prev.filter(r => r.id !== id));
  };

  /* ── validation ── */
  const validate = () => {
    for (let i = 0; i < corrections.length; i++) {
      const row = corrections[i];
      if (!row.columnName) {
        showNotif(`Row ${i + 1}: Please select a column name.`, 'error');
        return false;
      }
      if (!row.readAs.trim()) {
        showNotif(`Row ${i + 1}: "Read As" value cannot be empty.`, 'error');
        return false;
      }
    }
    return true;
  };


  /* ── issue (validate + open PDF, no DB save yet) ── */
  const handleIssueCorrectionSlip = async () => {
    if (!validate()) return;
    setIssuing(true);
    // No DB save here — save happens after eSign in CorrectionSlipPDF
    setShowPDF(true);
  };

  if (showPDF) {
    return (
      <CorrectionSlipPDF
        icData={icData}
        corrections={corrections}
        callNo={callNo}
        icFields={icFields}
        createdBy={currentUser?.userId || currentUser?.empCode || 'unknown'}
        onBack={() => { setShowPDF(false); setIssuing(false); }}
        onClose={onClose}
      />
    );
  }

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827' }}>Issue Correction Slip</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Call No: <span style={{ color: '#2563eb', fontWeight: 600 }}>{callNo}</span></div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer', lineHeight: 1, borderRadius: '6px', padding: '4px 8px' }}>✕</button>
        </div>

        {/* Notification */}
        <Notification
          message={notification.message}
          type={notification.type}
          autoClose={true}
          autoCloseDelay={4000}
          onClose={() => setNotification({ message: '', type: 'info' })}
        />

        {/* Body */}
        <div style={S.body}>
          {/* Section 1 – IC Data */}
          <div>
            <div style={S.sectionTitle}>Section 1 – IC Data</div>
            {loading && <div style={S.loader}>⏳ Loading IC data...</div>}
            {icError && <div style={S.errorBox}>{icError}</div>}
            {!loading && !icError && icFields.length === 0 && (
              <div style={S.errorBox}>No IC data found for this call number.</div>
            )}
            {!loading && !icError && icFields.length > 0 && (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, width: '35%' }}>Field</th>
                    <th style={S.th}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {icFields.map(({ key, label, value }) => (
                    <tr key={key}>
                      <td style={S.td}>{label}</td>
                      <td style={S.tdVal}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 2 – Correction Form */}
          <div>
            <div style={S.sectionTitle}>Section 2 – Correction Details</div>
            <table style={{ ...S.table, marginBottom: '12px' }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: '32%' }}>Column Name</th>
                  <th style={{ ...S.th, width: '30%' }}>Read As</th>
                  <th style={{ ...S.th, width: '30%' }}>Instead Of</th>
                  <th style={{ ...S.th, width: '8%' }}>✕</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((corr) => (
                  <tr key={corr.id}>
                    <td style={{ ...S.td, padding: '6px 8px' }}>
                      <FieldDropdown
                        options={icFields}
                        value={corr.columnName}
                        onChange={(val) => updateRow(corr.id, 'columnName', val)}
                        disabled={loading || !!icError}
                      />
                    </td>
                    <td style={{ ...S.td, padding: '6px 8px' }}>
                      <input
                        style={S.inputBase}
                        type="text"
                        placeholder="Enter corrected value"
                        value={corr.readAs}
                        onChange={(e) => updateRow(corr.id, 'readAs', e.target.value)}
                        onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; }}
                      />
                    </td>
                    <td style={{ ...S.td, padding: '6px 8px' }}>
                      <input
                        style={{ ...S.inputBase, background: '#f1f5f9', color: '#6b7280', cursor: 'not-allowed', fontStyle: 'italic', border: '1px solid #e5e7eb' }}
                        type="text"
                        readOnly
                        value={corr.insteadOf}
                        title="Auto-filled from IC data"
                        placeholder="Auto-filled"
                      />
                    </td>
                    <td style={{ ...S.td, padding: '6px 8px', textAlign: 'center' }}>
                      <button style={S.btnDanger} onClick={() => removeRow(corr.id)} title="Remove row">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button style={S.addRowBtn} onClick={addRow}>+ Add Correction Row</button>
          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button style={S.btnOutline} onClick={onClose}>Cancel</button>
          <button
            style={{ ...S.btnSuccess, opacity: issuing ? 0.7 : 1 }}
            onClick={handleIssueCorrectionSlip}
            disabled={issuing || loading || !!icError}
          >
            {issuing ? 'Generating...' : 'Issue Correction Slip'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectionSlipModal;
