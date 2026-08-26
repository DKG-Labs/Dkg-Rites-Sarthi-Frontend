import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateFinalProductCertificate,
  generateRailpadIcDetails,
  getFinalIcEditData,
  getProcessIcEditData,
} from '../services/certificateService';
import { fetchCorrectionSlip } from '../services/correctionSlipService';
import { getStoredUser } from '../services/authService';
import Notification from './Notification';
import CorrectionSlipPDF from './CorrectionSlipPDF';

/* ─── Per-IC-type field maps (sourced from backend DTOs) ─── */
const PROCESS_FIELD_MAP = {
  certificateNo:          'Certificate No.',
  certificateDate:        'Certificate Date',
  bookNo:                 'Book No.',
  setNo:                  'Set No.',
  offeredInstNo:          'Offered Installment No.',
  passedInstNo:           'Passed Installment No.',
  placeOfInspection:      'Place of Inspection',
  contractor:             'Contractor',
  contractRef:            'Contract Ref & Date (Rly.)',
  billPayingOfficer:      'Bill Paying Officer',
  consignee:              'Consignee',
  consigneeRailway:       'Consignee (Railway)',
  purchasingAuthority:    'Purchasing Authority (Railway)',
  description:            'Description',
  drawingNo:              'Drawing No.',
  specNo:                 'Specification No.',
  qapNo:                  'QAP No.',
  qtyOnOrder:             'Qty. on Order',
  qtyOfferedPreviously:   'Qty. Offered Previously',
  qtyPassedPreviously:    'Qty. Passed Previously',
  qtyNowOffered:          'Qty. Now Offered',
  qtyNowPassed:           'Qty. Now Passed',
  qtyNowRejected:         'Qty. Now Rejected',
  qtyStillDue:            'Qty. Still Due',
  dateOfCall:             'Date of Call',
  noOfVisits:             'No. of Visits',
  datesOfInspection:      'Dates of Inspection',
  inspectionDates:        'Inspection Dates',
  sealingPattern:         'Sealing / Stamping Pattern',
  facsimileText:          'Facsimile Text',
  reasonsForRejection:    'Reasons for Rejection',
  remarks:                'Remarks',
  inspectingEngineer:     'Inspecting Engineer',
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
  billPayingOfficer:      'Bill Paying Officer',
  consignee:              'Consignee',
  consigneeRailway:       'Consignee (Railway)',
  purchasingAuthority:    'Purchasing Authority (Railway)',
  itemNo:                 'Item No.',
  description:            'Description',
  drawingNo:              'Drawing No.',
  specNo:                 'Specification No.',
  qtyOnOrder:             'Qty. on Order',
  qtyOfferedPreviously:   'Qty. Offered Previously',
  qtyPassedPreviously:    'Qty. Passed Previously',
  qtyNowOffered:          'Qty. Now Offered',
  qtyNowPassed:           'Qty. Now Passed',
  qtyNowRejected:         'Qty. Now Rejected',
  qtyStillDue:            'Qty. Still Due',
  quantityNowPassedText:  'Qty. Now Passed (Text)',
  remarks:                'Remarks',
  dateOfCall:             'Date of Call',
  noOfVisits:             'No. of Visits',
  datesOfInspection:      'Dates of Inspection',
  inspectionDates:        'Inspection Dates',
  sealingPattern:         'Sealing / Stamping Pattern',
  facsimileText:          'Facsimile Text',
  reasonsForRejection:    'Reasons for Rejection',
  inspectingEngineer:     'Inspecting Engineer',
  processIcNo:            'Process IC No.',
};

const getFieldMap = (productType) => {
  if (productType === 'PROCESS') return PROCESS_FIELD_MAP;
  return FINAL_FIELD_MAP;
};

const HIDDEN_DROPDOWN_KEYS = [
  'certificateNo',
  'certificateDate',
  'bookNo',
  'setNo',
  'contractRef',
  'qtyNowOffered',
  'qtyNowPassed',
  'qtyNowRejected',
  'rmIcNo',
  'processIcNo'
];

const emptyRow = () => ({ columnName: '', readAs: '', insteadOf: '', id: Date.now() + Math.random() });

/* ─── Custom Field Dropdown (Matches ERC) ─── */
const FieldDropdown = ({ options, hiddenKeys = [], value, onChange, disabled, placeholder = '— Select field —' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find(o => o.key === value);
  const filtered = options.filter(o => !hiddenKeys.includes(o.key) && o.label.toLowerCase().includes(search.toLowerCase()));

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

      {open && (
        <div style={{
          position: 'absolute', top: '36px', left: 0, right: 0, zIndex: 9999,
          background: '#fff', border: '1.5px solid #dbeafe', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
          maxHeight: '240px', display: 'flex', flexDirection: 'column',
          minWidth: '220px',
        }}>
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

/* ─── Styles (Identical to ERC S styles) ─── */
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

/* ─── Main Component ─── */
const CorrectionSlipModal = ({ row, onClose }) => {
  const [icData, setIcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [icError, setIcError] = useState('');
  const [corrections, setCorrections] = useState([emptyRow()]);
  const [issuing, setIssuing] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [showPDF, setShowPDF] = useState(false);

  const callNo = row?.call_no || row?.requestId || row?.callNo || row?.icNo || '';
  const currentUser = getStoredUser();

  const showNotif = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  /* Load IC Certificate data */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setIcError('');
      try {
        // 1. Fetch certificate particulars
        let certData = null;
        try {
          certData = await generateRailpadIcDetails(callNo);
        } catch (e) {
          console.warn('generateRailpadIcDetails fallback:', e);
        }

        if (!certData || !certData.certificateNo) {
          try {
            certData = await generateFinalProductCertificate(callNo);
          } catch (e2) {
            console.warn('generateFinalProductCertificate fallback:', e2);
          }
        }

        // 2. Fetch saved IC Edit data (railpad_process_ic_edit / railpad_final_ic_edit)
        const rawCertNo = certData?.certificateNo || certData?.certNo || certData?.icNumber;
        const fullIcNumber = rawCertNo || callNo;
        const isProcess = String(callNo || '').toUpperCase().startsWith('RPP') ||
          String(row?.product_type || row?.productType || row?.railPadType || '').toLowerCase().includes('process');

        let editData = null;
        try {
          if (isProcess) {
            editData = await getProcessIcEditData(fullIcNumber);
            if (!editData && fullIcNumber !== callNo) {
              editData = await getProcessIcEditData(callNo);
            }
          } else {
            editData = await getFinalIcEditData(fullIcNumber);
            if (!editData && fullIcNumber !== callNo) {
              editData = await getFinalIcEditData(callNo);
            }
          }
        } catch (err) {
          console.warn('IC Edit fetch fallback:', err);
        }

        const merged = certData || {};
        const normalizedData = {
          ...row,
          ...merged,
          certificateNo: merged.certificateNo || callNo,
          certificateDate: editData?.createdAt ? new Date(editData.createdAt).toLocaleDateString('en-GB') : (merged.certificateDate || (row?.createdDate ? new Date(row.createdDate).toLocaleDateString('en-GB') : '')),
          contractor: editData?.contractor || merged.contractor || merged.contractorName || row?.vendorName || row?.vendorCode || '',
          placeOfInspection: editData?.placeOfInspection || merged.placeOfInspection || '',
          contractRef: editData?.contractRef || merged.contractRef || merged.contractReferences || row?.poNo || '',
          billPayingOfficer: editData?.billPayingOfficer || merged.billPayingOfficer || '',
          consignee: editData?.consignee || merged.consignee || merged.consigneeRailway || 'Senior Section Engineer (P.Way)',
          consigneeRailway: editData?.consignee || merged.consigneeRailway || merged.consignee || '',
          purchasingAuthority: editData?.purchasingAuthority || merged.purchasingAuthority || 'PCMM/Rly',
          itemNo: merged.itemNo || '001',
          description: editData?.description || merged.description || merged.descriptionOfStores || row?.productType || row?.railPadType || 'Grooved Rubber Sole Plates',
          drawingNo: editData?.drgNo || editData?.drawingNo || merged.drawingNo || merged.drgNo || row?.drawingNo || '',
          specNo: editData?.specNo || merged.specNo || 'IRS T-55-2025',
          qapNo: editData?.qapNo || merged.qapNo || '',
          qtyOnOrder: merged.qtyOnOrder ?? merged.quantityOnOrder ?? row?.orderedQty ?? 0,
          qtyOfferedPreviously: merged.qtyOfferedPreviously ?? merged.cumulativeQtyOfferedPreviously ?? 'NIL',
          qtyPassedPreviously: merged.qtyPassedPreviously ?? merged.qtyPrevPassed ?? 'NIL',
          qtyNowOffered: editData?.qtyNowOffered ?? merged.qtyNowOffered ?? row?.totalQty ?? 0,
          qtyNowPassed: editData?.qtyNowPassed ?? merged.qtyNowPassed ?? row?.acceptedQty ?? 0,
          qtyNowRejected: editData?.qtyNowRejected ?? merged.qtyNowRejected ?? 'NIL',
          qtyStillDue: merged.qtyStillDue ?? 'NIL',
          quantityNowPassedText: editData?.quantityNowPassedText || merged.quantityNowPassedText || merged.quantityNowPassedInWords || '',
          remarks: editData?.remarks || merged.remarks || '',
          dateOfCall: editData?.dateOfCall || merged.dateOfCall || '',
          noOfVisits: editData?.noOfVisits || merged.noOfVisits || '',
          datesOfInspection: editData?.datesOfInspection || merged.datesOfInspection || merged.dateOfInspection || '',
          inspectionDates: editData?.datesOfInspection || merged.inspectionDates || merged.datesOfInspection || merged.dateOfInspection || '',
          sealingPattern: editData?.sealingPattern || merged.sealingPattern || 'RITES HOLOGRAM SEAL',
          facsimileText: merged.facsimileText || 'RITES HOLOGRAM SEAL',
          reasonsForRejection: editData?.reasonsForRejection || merged.reasonsForRejection || merged.reasonOfRejection || 'N/A',
          inspectingEngineer: editData?.inspectingEngineer || merged.inspectingEngineer || currentUser?.userName || 'Inspecting Engineer',
          bookNo: editData?.bookNo || merged.bookNo || '001',
          setNo: editData?.setNo || merged.setNo || '001',
          offeredInstNo: editData?.offeredInstNo || editData?.installmentNo || merged.offeredInstNo || merged.offeredInsttNo || '1',
          passedInstNo: editData?.passedInstNo || merged.passedInstNo || merged.passedInsttNo || '1ST & FINAL',
        };

        setIcData(normalizedData);
      } catch (err) {
        setIcError('Could not load IC data: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    if (callNo) load();
  }, [callNo, row]);

  /* Restore saved corrections */
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
  }, [callNo]);

  const productType = (() => {
    const call = String(callNo || '').toUpperCase();
    const pt = String(row?.product_type || row?.productType || row?.railPadType || icData?.callType || '').toLowerCase();
    if (call.startsWith('RPP') || pt.includes('process')) return 'PROCESS';
    return 'FINAL';
  })();

  /* Build Section 1 key-value pairs (filtered out empty/null fields) */
  const icFields = icData
    ? Object.entries(getFieldMap(productType))
        .filter(([key]) => {
          const val = icData[key];
          return val !== undefined && val !== null && val !== '' && !Array.isArray(val);
        })
        .map(([key, label]) => ({ key, label, value: String(icData[key]) }))
    : [];

  /* ── Row helpers ── */
  const updateRow = (id, field, value) => {
    setCorrections(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'columnName') {
        const found = icFields.find(f => f.key === value);
        updated.insteadOf = found ? found.value : (icData && icData[value] ? String(icData[value]) : '—');
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

  /* ── Validation ── */
  const validate = () => {
    for (let i = 0; i < corrections.length; i++) {
      const r = corrections[i];
      if (!r.columnName) {
        showNotif(`Row ${i + 1}: Please select a column name.`, 'error');
        return false;
      }
      if (!r.readAs.trim()) {
        showNotif(`Row ${i + 1}: "Read As" value cannot be empty.`, 'error');
        return false;
      }
    }
    return true;
  };

  const handleIssueCorrectionSlip = async () => {
    if (!validate()) return;
    setIssuing(true);
    setShowPDF(true);
  };

  if (showPDF) {
    return (
      <CorrectionSlipPDF
        icData={icData}
        corrections={corrections}
        callNo={callNo}
        icFields={icFields}
        createdBy={currentUser?.userId || currentUser?.userName || 'Inspecting Engineer'}
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
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Call No: <span style={{ color: '#2563eb', fontWeight: 600 }}>{callNo}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#9ca3af',
              fontSize: '20px', cursor: 'pointer', lineHeight: 1, borderRadius: '6px', padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Notification */}
        <Notification
          message={notification.message}
          type={notification.type}
          autoClose={true}
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

          {/* Section 2 – Correction Details */}
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
                        hiddenKeys={HIDDEN_DROPDOWN_KEYS}
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
